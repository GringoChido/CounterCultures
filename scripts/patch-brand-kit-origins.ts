/**
 * Week 2 Day 1 — origin + website_url patch pass.
 *
 * Updates the Brand Kit Sheet seeded earlier today with:
 *   - origin_country  (ISO-2)
 *   - origin_country_name (display)
 *   - website_url (official brand site)
 *
 * Values sourced from web research this session. Values marked ⚠ are
 * low-confidence and left blank for Joshua to verify.
 *
 * Only writes cells where a value is provided; blank fields are skipped
 * (preserves existing data). Bumps updated_at/updated_by on touched rows.
 *
 * Run: npx tsx scripts/patch-brand-kit-origins.ts
 */

import { google } from "googleapis";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const TAB = "brands";

// column letters (matches seed schema)
const COL = {
  slug: "A",
  origin_country: "G",
  origin_country_name: "H",
  website_url: "I",
  updated_at: "X",
  updated_by: "Y",
} as const;

interface Patch {
  slug: string;
  country?: string;      // ISO-2
  countryName?: string;  // display
  url?: string;
  note?: string;
}

// Every slug matches what the seed script emitted. See scripts/seed-brand-kit-sheet.ts.
const PATCHES: Patch[] = [
  // ── Faucetry & Showers ────────────────────────────────────────────
  { slug: "delta", country: "US", countryName: "United States", url: "https://www.deltafaucet.com" },
  { slug: "dornbracht", country: "DE", countryName: "Germany", url: "https://www.dornbracht.com" },
  { slug: "alape", country: "DE", countryName: "Germany", url: "https://www.alape.com" },
  { slug: "amba-products", country: "US", countryName: "United States", url: "https://ambaproducts.com", note: "Atlanta, GA" },
  { slug: "atlas-homewares", country: "US", countryName: "United States", url: "https://www.atlashomewares.com" },
  { slug: "baldwin", country: "US", countryName: "United States", url: "https://www.baldwinhardware.com" },
  { slug: "brizo", country: "US", countryName: "United States", url: "https://www.brizo.com" },
  { slug: "california-faucets", country: "US", countryName: "United States", url: "https://www.calfaucets.com" },
  { slug: "kohler", country: "US", countryName: "United States", url: "https://us.kohler.com" },
  { slug: "kwc", country: "CH", countryName: "Switzerland", url: "https://www.kwc.com" },
  { slug: "teka", country: "ES", countryName: "Spain", url: "https://www.teka.com" },
  { slug: "grohe", country: "DE", countryName: "Germany", url: "https://www.grohe.us" },
  { slug: "hansgrohe", country: "DE", countryName: "Germany", url: "https://www.hansgrohe-usa.com" },
  { slug: "jsg-oceana", country: "US", countryName: "United States", note: "No primary domain confirmed; parent = Jeannette Specialty Glass. Leaving URL blank." },
  { slug: "lacava", country: "US", countryName: "United States", url: "https://www.lacava.com", note: "Italian-founded, Chicago HQ" },
  { slug: "rohl", country: "US", countryName: "United States", url: "https://www.rohlhome.com" },
  { slug: "rubinet", country: "CA", countryName: "Canada", url: "https://www.rubinet.com" },
  { slug: "santec", country: "US", countryName: "United States", url: "https://santecfaucet.com" },
  { slug: "sigma", country: "US", countryName: "United States", url: "https://www.sigmafaucets.com" },
  { slug: "sun-valley-bronze", country: "US", countryName: "United States", url: "https://www.sunvalleybronze.com" },
  { slug: "thermasol", country: "US", countryName: "United States", url: "https://www.thermasol.com" },
  { slug: "watermark", country: "US", countryName: "United States", url: "https://www.watermark-designs.com" },
  { slug: "waterstone", country: "US", countryName: "United States", url: "https://www.waterstoneco.com" },
  { slug: "viega", country: "DE", countryName: "Germany", url: "https://www.viega.us" },

  // ── Door & Cabinet Hardware ───────────────────────────────────────
  { slug: "acorn-manufacturing", country: "US", countryName: "United States", url: "https://acornmfg.com", note: "Mansfield, MA" },
  { slug: "ashley-norton", country: "US", countryName: "United States", url: "https://www.ashleynorton.com", note: "US-designed, India-manufactured" },
  { slug: "belwith-products", country: "US", countryName: "United States", url: "https://www.belwith.com", note: "Belwith Keeler / Hickory Hardware parent" },
  { slug: "berenson", country: "US", countryName: "United States", url: "https://www.berensonhardware.com", note: "Buffalo, NY" },
  { slug: "classic-brass", country: "US", countryName: "United States", url: "https://www.classic-brass.com" },
  { slug: "colonial-bronze", country: "US", countryName: "United States", url: "https://www.colonialbronze.com", note: "Torrington, CT since 1927" },
  { slug: "deltana", country: "US", countryName: "United States", url: "https://deltana.net" },
  { slug: "emtek", country: "US", countryName: "United States", url: "https://www.emtek.com" },
  { slug: "hardware-renaissance", country: "US", countryName: "United States", url: "https://hardwarerenaissance.com", note: "Santa Fe, NM" },
  { slug: "idh-st-simons", country: "US", countryName: "United States", url: "https://www.idhbrass.com" },
  { slug: "rocky-mountain-hardware", country: "US", countryName: "United States", url: "https://www.rockymountainhardware.com" },
  { slug: "siro-designs", country: "AT", countryName: "Austria", url: "https://www.sirodesigns.net", note: "Austrian parent with US affiliate + Solingen DE branch" },
  { slug: "s-parker", country: "US", countryName: "United States", url: "https://www.sparker.com", note: "Englewood, NJ" },

  // ── Bathroom Sinks ────────────────────────────────────────────────
  { slug: "alno", country: "US", countryName: "United States", url: "https://alnoinc.com", note: "Alno Inc (US) — not to be confused with Alno AG (DE kitchens)" },
  { slug: "badeloft", country: "DE", countryName: "Germany", url: "https://badeloftusa.com" },
  { slug: "cheviot", country: "CA", countryName: "Canada", url: "https://cheviotproducts.com", note: "Canadian, 40+ years" },
  { slug: "franke", country: "CH", countryName: "Switzerland", url: "https://www.franke.com" },
  { slug: "icera", country: "US", countryName: "United States", url: "https://icerabath.com", note: "Huntington Beach, CA" },
  { slug: "julien", country: "CA", countryName: "Canada", url: "https://www.julien.ca" },
  { slug: "native-trails", country: "US", countryName: "United States", url: "https://nativetrailshome.com" },
  { slug: "sietto", country: "US", countryName: "United States", url: "https://sietto.com", note: "Chicago glass studio" },
  { slug: "stone-forest", country: "US", countryName: "United States", url: "https://www.stoneforest.com" },
  { slug: "victoria-and-albert", country: "GB", countryName: "United Kingdom", url: "https://vandabaths.com", note: "Shropshire, UK; South Africa production" },

  // ── Kitchen Sinks ─────────────────────────────────────────────────
  { slug: "blaze-products", country: "US", countryName: "United States", url: "https://www.blazegrills.com" },
  { slug: "elkay", country: "US", countryName: "United States", url: "https://www.elkay.com" },
  { slug: "houzer", country: "US", countryName: "United States", url: "https://www.houzersink.com", note: "Hamilton, NJ" },
  { slug: "kingston-brass", country: "US", countryName: "United States", url: "https://www.kingstonbrass.com" },

  // ── Drains ────────────────────────────────────────────────────────
  { slug: "ebbe", country: "US", countryName: "United States", url: "https://www.ebbeamerica.com" },
  { slug: "infinity-drain", country: "US", countryName: "United States", url: "https://www.infinitydrain.com" },
  { slug: "quickdrain", country: "US", countryName: "United States", url: "https://www.quickdrainusa.com" },

  // ── Toilets ───────────────────────────────────────────────────────
  { slug: "duravit", country: "DE", countryName: "Germany", url: "https://www.duravit.us" },
  { slug: "r-and-t", country: "CN", countryName: "China", url: "https://www.rtplumbing.com", note: "Xiamen R&T Plumbing — OEM flush valves / cisterns" },
  { slug: "toto", country: "JP", countryName: "Japan", url: "https://www.totousa.com" },
  { slug: "villeroy-boch", country: "DE", countryName: "Germany", url: "https://www.villeroy-boch.com" },

  // ── Bathtubs ──────────────────────────────────────────────────────
  { slug: "aquaspa", note: "⚠ Could not confidently identify domain or corporate HQ — left blank for Joshua to verify" },
  { slug: "jacuzzi", country: "US", countryName: "United States", url: "https://www.jacuzzi.com" },
  { slug: "maax", country: "CA", countryName: "Canada", url: "https://www.maax.com" },
  { slug: "mti-baths", country: "US", countryName: "United States", url: "https://www.mtibaths.com" },

  // ── Appliances ────────────────────────────────────────────────────
  { slug: "bosch", country: "DE", countryName: "Germany", url: "https://www.bosch-home.com" },
  { slug: "kitchenaid", country: "US", countryName: "United States", url: "https://www.kitchenaid.com" },
  { slug: "samsung", country: "KR", countryName: "South Korea", url: "https://www.samsung.com" },
  { slug: "smeg", country: "IT", countryName: "Italy", url: "https://www.smegusa.com" },

  // ── Other ─────────────────────────────────────────────────────────
  { slug: "ginger", country: "US", countryName: "United States", url: "https://www.gingerco.com", note: "Discontinued — now under Newport Brass / Brasstech" },
  { slug: "jason", country: "US", countryName: "United States", url: "https://www.jasoninternational.com", note: "North Little Rock, AR; founded by Remo Jacuzzi" },
  { slug: "robern", country: "US", countryName: "United States", url: "https://www.robern.com" },
  { slug: "panasonic", country: "JP", countryName: "Japan", url: "https://www.panasonic.com" },
  { slug: "original-mission-tile", country: "MX", countryName: "Mexico", url: "https://originalmissiontile.com", note: "⚠ San Luis Potosí, MX — handcrafted cement tiles. Arguably an artisan maker; flag for is_artisan review." },

  // ── Storefront-only (not in BRANDS.docx) ──────────────────────────
  { slug: "blanco", country: "DE", countryName: "Germany", url: "https://www.blanco.com/us-en/", note: "Oberderdingen, DE HQ; NA manufacturing in Toronto" },
  { slug: "bluestar", country: "US", countryName: "United States", url: "https://www.bluestarcooking.com" },
];

const requireEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
};

const main = async () => {
  const sheetId = requireEnv("GOOGLE_BRAND_KIT_SHEET_ID");

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      private_key: requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // Build slug → row index map from the Sheet.
  const slugRead = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${TAB}!${COL.slug}:${COL.slug}`,
  });
  const slugCol = slugRead.data.values ?? [];
  const slugToRow = new Map<string, number>();
  for (let i = 1; i < slugCol.length; i++) {
    const s = slugCol[i]?.[0];
    if (s) slugToRow.set(s, i + 1);
  }
  console.log(`Sheet has ${slugToRow.size} brand rows.\n`);

  // Build batched value updates.
  const data: { range: string; values: string[][] }[] = [];
  const now = new Date().toISOString();
  let touched = 0;
  let skipped = 0;
  const missing: string[] = [];

  for (const p of PATCHES) {
    const row = slugToRow.get(p.slug);
    if (!row) {
      missing.push(p.slug);
      continue;
    }
    let wrote = false;
    if (p.country) {
      data.push({ range: `${TAB}!${COL.origin_country}${row}`, values: [[p.country]] });
      wrote = true;
    }
    if (p.countryName) {
      data.push({ range: `${TAB}!${COL.origin_country_name}${row}`, values: [[p.countryName]] });
      wrote = true;
    }
    if (p.url) {
      data.push({ range: `${TAB}!${COL.website_url}${row}`, values: [[p.url]] });
      wrote = true;
    }
    if (wrote) {
      data.push({
        range: `${TAB}!${COL.updated_at}${row}:${COL.updated_by}${row}`,
        values: [[now, "research-patch"]],
      });
      touched++;
    } else {
      skipped++;
    }
  }

  if (missing.length) {
    console.error(`\n✗ Slugs not found in sheet:`);
    for (const m of missing) console.error(`    ${m}`);
    console.error(`\nAborting. Fix the slug list in PATCHES and re-run.\n`);
    process.exit(1);
  }

  if (data.length === 0) {
    console.log("Nothing to write.");
    return;
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { valueInputOption: "RAW", data },
  });

  console.log(`✓ Patched ${touched} brands (${data.length} cell updates).`);
  console.log(`  Skipped ${skipped} rows with no values to write.`);
  console.log(`  Total brands in PATCHES: ${PATCHES.length}\n`);

  // Report notes for rows flagged for human review
  const flags = PATCHES.filter((p) => p.note);
  if (flags.length) {
    console.log(`Notes / flags for your review:\n`);
    for (const f of flags) {
      console.log(`  [${f.slug}] ${f.note}`);
    }
  }
};

main().catch((err) => {
  console.error("\n✗ Patch failed:", err);
  process.exit(1);
});
