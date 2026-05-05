/**
 * Append the 97 net-new brands from BRANDS 151 doc to the live Brand Kit
 * Sheet. Idempotent: re-runs skip slugs that already exist.
 *
 * Source data: /tmp/brands151-structured.json (parsed from BRANDS 151.docx)
 *
 * Run with:
 *   npx tsx scripts/append-brands-151.ts
 *
 * Env requirements (typical .env.local):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_BRAND_KIT_SHEET_ID
 */

import { GoogleAuth } from "google-auth-library";
import { sheets as sheetsApi } from "@googleapis/sheets";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

config({ path: resolve(__dirname, "../.env.local") });

const SHEET_ID = process.env.GOOGLE_BRAND_KIT_SHEET_ID ?? "";
const TAB = "brands";
const STRUCTURED_PATH = "/tmp/brands151-structured.json";

if (!SHEET_ID) {
  console.error("Missing GOOGLE_BRAND_KIT_SHEET_ID");
  process.exit(1);
}

type CategorySlug =
  | "faucetry-showers"
  | "door-cabinet-hardware"
  | "bathroom-sinks"
  | "kitchen-sinks"
  | "drains"
  | "toilets"
  | "bathtubs"
  | "appliances"
  | "other";

interface DocBrand {
  name: string;
  descriptionEn: string;
  primaryCategorySlug: CategorySlug;
  categorySlugs: CategorySlug[];
  originCountry: string;
  originCountryName: string;
}

// Slugs already in the seed (from scripts/seed-brand-kit-sheet.ts) under
// different naming. Treat the 151-doc name as a duplicate of the seed slug.
const NAME_REWRITES: Record<string, string> = {
  Baldwin: "baldwin-hardware",
  "Belwith Keeler": "belwith-products",
  "Sun Valley Bronze": "sun-valley-bronze",
};

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

// Brands the BRANDS 151 doc explicitly identifies as artisan/handcrafted —
// stone, copper, ceramic, and small-batch hardware shops. Heuristic, will
// not be perfect; Roger can flip the flag in the sheet later.
const ARTISAN_HINTS = [
  "Cruz Bay Studio",
  "Native Trails",
  "Original Mission Tile",
  "Stone Forest",
  "Linkasink",
  "Sukabumi Stone México",
  "Thompson Traders",
  "Sietto",
  "Du Verre",
  "Rocky Mountain Hardware",
  "Ageless Iron",
  "Buster + Punch",
  "Hardware Renaissance",
  "Rusticware",
];

// Rough EN→ES translation table for the boilerplate phrases that show up
// across the 151 doc. Not literary, but accurate and consistent enough that
// Spanish brand cards render coherently. Roger can refine.
const TRANSLATIONS: [RegExp, string][] = [
  [/^A luxury brand/i, "Una marca de lujo"],
  [/^A leading/i, "Un líder"],
  [/^Known for /i, "Conocido por "],
  [/^Specializes in /i, "Se especializa en "],
  [/^Offers /i, "Ofrece "],
  [/^Provides /i, "Proporciona "],
  [/^A trusted /i, "Una marca de confianza "],
  [/^A pioneer in /i, "Pionero en "],
  [/^An Italian /i, "Marca italiana "],
  [/^A German /i, "Marca alemana "],
  [/^A Swiss /i, "Marca suiza "],
  [/^A British /i, "Marca británica "],
  [/^A Canadian /i, "Marca canadiense "],
  [/^A Mexican /i, "Marca mexicana "],
  [/^A Japanese /i, "Marca japonesa "],
];

const PHRASE_REPLACEMENTS: [RegExp, string][] = [
  [/\bfaucets and showerheads\b/g, "grifería y regaderas"],
  [/\bfaucets\b/gi, "grifería"],
  [/\bshowers\b/gi, "regaderas"],
  [/\bbathroom\b/gi, "baño"],
  [/\bkitchen\b/gi, "cocina"],
  [/\bsinks\b/gi, "lavabos"],
  [/\bbathtubs?\b/gi, "tinas"],
  [/\bhardware\b/gi, "herrajes"],
  [/\btiles?\b/gi, "azulejos"],
  [/\bquality\b/gi, "calidad"],
  [/\binnovation\b/gi, "innovación"],
  [/\binnovative\b/gi, "innovadora"],
  [/\bdesign\b/gi, "diseño"],
  [/\bdesigns\b/gi, "diseños"],
  [/\bluxury\b/gi, "lujo"],
  [/\bcraftsmanship\b/gi, "oficio artesanal"],
  [/\bhandcrafted\b/gi, "hechos a mano"],
  [/\bcontemporary\b/gi, "contemporáneo"],
  [/\bmodern\b/gi, "moderno"],
  [/\bclassic\b/gi, "clásico"],
  [/\btraditional\b/gi, "tradicional"],
  [/\belegant\b/gi, "elegante"],
  [/\bstylish\b/gi, "elegante"],
  [/\bdurability\b/gi, "durabilidad"],
  [/\baccessories\b/gi, "accesorios"],
  [/\bfixtures\b/gi, "accesorios"],
  [/\bcabinet\b/gi, "gabinete"],
  [/\bdoor\b/gi, "puerta"],
  [/\bbrand\b/gi, "marca"],
  [/\bhomes?\b/gi, "hogares"],
  [/\bspaces?\b/gi, "espacios"],
  [/\bcollections?\b/gi, "colecciones"],
];

const naiveTranslate = (en: string): string => {
  let es = en;
  for (const [pat, rep] of TRANSLATIONS) {
    if (pat.test(es)) {
      es = es.replace(pat, rep);
      break;
    }
  }
  for (const [pat, rep] of PHRASE_REPLACEMENTS) es = es.replace(pat, rep);
  return es;
};

// First-clause tagline. The doc descriptions are typically `<adjective phrase>:
// <details>`; cut at the first full stop / dash for a punchy one-liner.
const buildTagline = (desc: string): string => {
  const stop = desc.search(/[.;—]/);
  const slice = stop > 20 ? desc.slice(0, stop) : desc;
  return slice.trim().slice(0, 90);
};

const buildRow = (b: DocBrand) => {
  const slug = NAME_REWRITES[b.name] ?? slugify(b.name);
  const taglineEn = buildTagline(b.descriptionEn);
  const taglineEs = naiveTranslate(taglineEn);
  const descriptionEs = naiveTranslate(b.descriptionEn);
  const isArtisan = ARTISAN_HINTS.includes(b.name);
  const now = new Date().toISOString();
  return {
    slug,
    name: b.name,
    taglineEn,
    taglineEs,
    descriptionEn: b.descriptionEn,
    descriptionEs,
    originCountry: b.originCountry,
    originCountryName: b.originCountryName,
    websiteUrl: "",
    externalUrl: "",
    stockedState: "external",
    primaryCategorySlug: b.primaryCategorySlug,
    categorySlugs: b.categorySlugs.join("|"),
    logoDriveId: "",
    heroDriveId: "",
    brandFolderDriveId: "",
    featuredProductIds: "",
    featuredProjectSlugs: "",
    nomStatusSummary: "unknown",
    isArtisan: isArtisan ? "TRUE" : "FALSE",
    isFeatured: "FALSE",
    displayOrder: "",
    createdAt: now,
    updatedAt: now,
    updatedBy: "claude (brands-151 batch)",
  };
};

const rowToValues = (r: ReturnType<typeof buildRow>): string[] => [
  r.slug,
  r.name,
  r.taglineEn,
  r.taglineEs,
  r.descriptionEn,
  r.descriptionEs,
  r.originCountry,
  r.originCountryName,
  r.websiteUrl,
  r.externalUrl,
  r.stockedState,
  r.primaryCategorySlug,
  r.categorySlugs,
  r.logoDriveId,
  r.heroDriveId,
  r.brandFolderDriveId,
  r.featuredProductIds,
  r.featuredProjectSlugs,
  r.nomStatusSummary,
  r.isArtisan,
  r.isFeatured,
  r.displayOrder,
  r.createdAt,
  r.updatedAt,
  r.updatedBy,
];

const main = async () => {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = sheetsApi({ version: "v4", auth });

  console.log("Reading current Brand Kit slugs…");
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A2:B`,
  });
  const existingSlugs = new Set(
    (existing.data.values ?? [])
      .map((row) => (row[0] ?? "").toString().trim())
      .filter(Boolean)
  );
  const existingNames = new Set(
    (existing.data.values ?? [])
      .map((row) => (row[1] ?? "").toString().trim().toLowerCase())
      .filter(Boolean)
  );
  console.log(`  found ${existingSlugs.size} existing rows`);

  const candidates: DocBrand[] = JSON.parse(
    readFileSync(STRUCTURED_PATH, "utf8")
  );

  const toAppend: ReturnType<typeof buildRow>[] = [];
  const skipped: string[] = [];
  for (const c of candidates) {
    const row = buildRow(c);
    if (existingSlugs.has(row.slug) || existingNames.has(c.name.toLowerCase())) {
      skipped.push(c.name);
      continue;
    }
    toAppend.push(row);
  }

  console.log(
    `Plan: append ${toAppend.length} new brands, skip ${skipped.length} existing`
  );
  if (toAppend.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  // Echo a sample so the operator can sanity-check before the API call commits
  console.log("\nFirst 3 rows preview:");
  for (const r of toAppend.slice(0, 3)) {
    console.log(`  ${r.slug.padEnd(28)}  ${r.name.padEnd(28)}  ${r.taglineEn.slice(0, 60)}`);
  }

  const values = toAppend.map(rowToValues);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  console.log(`\nAppended ${toAppend.length} rows. Done.`);
  console.log(`Skipped: ${skipped.slice(0, 10).join(", ")}${skipped.length > 10 ? `, … (+${skipped.length - 10})` : ""}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
