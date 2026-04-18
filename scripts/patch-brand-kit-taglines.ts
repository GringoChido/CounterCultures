/**
 * Week 2 Day 1 — editorial pass (tagline_en).
 *
 * Sources per brand (tagged on each patch):
 *   - "repo"    : hand-written by Joshua's team in /app/[locale]/brands/page.tsx
 *   - "scraped" : pulled from the brand's official homepage via WebFetch this session
 *   - "draft"   : fallback when the brand site returned 403 / NONE / timeout / redirect
 *
 * Also fills origin for aquaspa (MX, confirmed from in-repo editorial).
 *
 * Idempotent: only writes tagline_en where the cell is currently empty.
 * Bumps updated_at/updated_by on touched rows.
 *
 * Run: npx tsx scripts/patch-brand-kit-taglines.ts
 */

import { google } from "googleapis";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const TAB = "brands";
const COL = {
  slug: "A",
  tagline_en: "C",
  origin_country: "G",
  origin_country_name: "H",
  updated_at: "X",
  updated_by: "Y",
} as const;

type Source = "repo" | "scraped" | "draft";

interface Patch {
  slug: string;
  tagline: string;
  source: Source;
  country?: string;
  countryName?: string;
  note?: string;
}

const PATCHES: Patch[] = [
  // ── Repo (17) — Joshua's team's editorial voice ─────────────────────────
  { slug: "kohler", tagline: "Bold Looks. Lasting Quality.", source: "repo" },
  { slug: "toto", tagline: "People-First Innovation.", source: "repo" },
  { slug: "brizo", tagline: "Fashion for the Home.", source: "repo" },
  { slug: "blanco", tagline: "The Kitchen Sink Experts.", source: "repo" },
  { slug: "california-faucets", tagline: "Handcrafted in Huntington Beach.", source: "repo" },
  { slug: "sun-valley-bronze", tagline: "Hand-Cast. Hand-Finished. Idaho-Made.", source: "repo" },
  { slug: "emtek", tagline: "Hardware for Every Style.", source: "repo" },
  { slug: "badeloft", tagline: "Modern Bathing Reimagined.", source: "repo" },
  { slug: "villeroy-boch", tagline: "European Craftsmanship Since 1748.", source: "repo" },
  { slug: "ebbe", tagline: "Engineered Drain Solutions.", source: "repo" },
  { slug: "delta", tagline: "Innovation at Every Turn.", source: "repo" },
  { slug: "rohl", tagline: "Authentic Luxury Since 1983.", source: "repo" },
  { slug: "teka", tagline: "German Kitchen Technology.", source: "repo", note: "In-repo editorial calls Teka 'German' (Haiger origin) — my Day 1 patch had origin=ES. Reconcile: global HQ is Spain today, heritage is German. Pick one." },
  { slug: "smeg", tagline: "Technology with Style.", source: "repo" },
  { slug: "bluestar", tagline: "Restaurant Power. Residential Beauty.", source: "repo" },
  { slug: "baldwin", tagline: "American Craftsmanship Since 1946.", source: "repo" },
  {
    slug: "aquaspa",
    tagline: "Spa-Grade Shower Systems.",
    source: "repo",
    country: "MX",
    countryName: "Mexico",
    note: "Origin filled from in-repo editorial (Mexican spa systems brand). Flag: arguably artisan/domestic — review is_artisan=FALSE.",
  },

  // ── Scraped (38) — from brand's official homepage ───────────────────────
  { slug: "acorn-manufacturing", tagline: "85 Years of Iron Forging Excellence", source: "scraped" },
  { slug: "amba-products", tagline: "Luxury and warmth — heated towel racks for the bath.", source: "scraped", note: "Trimmed from 'Bring a touch of luxury and warmth to your bathroom with a heated towel rack'." },
  { slug: "ashley-norton", tagline: "The leading choice for discerning architects and designers.", source: "scraped" },
  { slug: "atlas-homewares", tagline: "Because Style Matters.", source: "scraped" },
  { slug: "belwith-products", tagline: "A Living Legacy Since 1839.", source: "scraped", note: "The site says 1839, but earlier research found 1893. Verify the real founding year." },
  { slug: "berenson", tagline: "Cabinet Hardware for Every Space, Style, and Budget.", source: "scraped" },
  { slug: "blaze-products", tagline: "A Higher Caliber of Cooking.", source: "scraped" },
  { slug: "cheviot", tagline: "High-end bathware with European craftsmanship.", source: "scraped", note: "Condensed from 'High-end Bathroom Sinks, Bathtubs & Fixtures With European Craftsmanship'." },
  { slug: "colonial-bronze", tagline: "Fine Brass Hardware Since 1927 · Handmade In The USA.", source: "scraped" },
  { slug: "deltana", tagline: "Architectural hardware — exceptional service and quality.", source: "scraped", note: "Condensed from 'the architectural hardware manufacturer with a proven record for exceptional service and quality' (97 chars)." },
  { slug: "dornbracht", tagline: "Inspiring your vision is our ambition.", source: "scraped", note: "Condensed from 107-char corporate statement." },
  { slug: "duravit", tagline: "Upgrade your everyday.", source: "scraped" },
  { slug: "elkay", tagline: "Filtration Reimagined.", source: "scraped", note: "This is a product campaign, not Elkay's brand-level tagline. Their classic positioning is kitchen sinks. Consider replacing." },
  { slug: "franke", tagline: "Opening up a world of opportunities.", source: "scraped" },
  { slug: "ginger", tagline: "Legacy Refined for modern living.", source: "scraped", note: "Pulled from newportbrass.com/ginger (Ginger is discontinued — now under Newport Brass/Brasstech). Decide: keep row, retire, or replace with newport-brass row." },
  { slug: "grohe", tagline: "Timeless, transitional — GROHE excellence.", source: "scraped", note: "The site's hero was for the LISTRA collection, not brand-level. May want a more classic Grohe tagline (e.g., 'Pure Freude an Wasser')." },
  { slug: "hardware-renaissance", tagline: "It's Like no Other.", source: "scraped" },
  { slug: "houzer", tagline: "The Heart of the Home.", source: "scraped" },
  { slug: "icera", tagline: "Next Level Comfort.", source: "scraped" },
  { slug: "jacuzzi", tagline: "Everything Else is Just Hot Water.", source: "scraped" },
  { slug: "julien", tagline: "Master of stainless steel for over 75 years.", source: "scraped", note: "Site tagline is French: 'maître de l'inox depuis plus de 75 ans'. English translation used." },
  { slug: "kingston-brass", tagline: "The Tradition of Fine Craftsmanship.", source: "scraped" },
  { slug: "lacava", tagline: "Creating Beautiful Bathrooms.", source: "scraped" },
  { slug: "maax", tagline: "Designer of The Best Bathroom Experience.", source: "scraped" },
  { slug: "mti-baths", tagline: "Crafted by hand, made for you.", source: "scraped" },
  { slug: "native-trails", tagline: "Artisan Crafted Luxury for the Kitchen and Bath.", source: "scraped" },
  { slug: "original-mission-tile", tagline: "Cement Tiles as an Expression of Art.", source: "scraped", note: "⚠ Site confirms 'handmade / artisans / traditions passed down since 1900s / San Luis Potosí'. Strongest artisan case in the set — recommend flipping is_artisan=TRUE and moving to the Artisan & Makers track." },
  { slug: "quickdrain", tagline: "Elevate your shower design.", source: "scraped" },
  { slug: "r-and-t", tagline: "Creating spaces where life's warmth endures.", source: "scraped", note: "Translated from the Chinese site. R&T is a Xiamen OEM — flag for Roger whether this belongs in a 'featured brand' catalog at all." },
  { slug: "rocky-mountain-hardware", tagline: "Organic Warmth. Understated Opulence.", source: "scraped" },
  { slug: "santec", tagline: "Inspired to create the extraordinary.", source: "scraped", note: "Full site tagline is 'Inspired to create the extraordinary — Objects that spark sensations.' (71 chars). Truncated for punch." },
  { slug: "sietto", tagline: "Handcrafted Glass & Metal Cabinet Hardware.", source: "scraped", note: "⚠ BRANDS.docx description_en calls them 'sink designs' — Sietto actually makes glass cabinet knobs/pulls. Description should be corrected." },
  { slug: "siro-designs", tagline: "European Decorative Cabinet Hardware.", source: "scraped", note: "Origin=AT kept (Austrian parent, Solingen DE branch + US affiliate). Austria joined EU 1995 so FTA is TLCUEM (not TLC-AELC)." },
  { slug: "stone-forest", tagline: "Artisan Stone Sinks, Tubs & Garden Fountains.", source: "scraped" },
  { slug: "thermasol", tagline: "Make Space to Live Well.", source: "scraped" },
  { slug: "viega", tagline: "Providing secure pipe connections for 125 years.", source: "scraped" },
  { slug: "watermark", tagline: "Sleek, Sophisticated in every environment.", source: "scraped" },
  { slug: "waterstone", tagline: "Blending Art and Technology.", source: "scraped" },

  // ── Drafted fallback (18) — scrape returned 403 / NONE / timeout / redirect ──
  { slug: "alape", tagline: "German-designed washbasins and bath furniture.", source: "draft", note: "alape.com redirects to laufen.com/vitreon-steel — Alape has been absorbed into Laufen (Roca Group). Flag: brand may be deprecated or renamed." },
  { slug: "alno", tagline: "Distinctive bathroom sinks and cabinet hardware.", source: "draft", note: "No tagline on alnoinc.com." },
  { slug: "bosch", tagline: "Invented for life.", source: "draft", note: "Bosch's longstanding corporate tagline — site returned 403, pulled from brand knowledge." },
  { slug: "classic-brass", tagline: "Period-true solid brass door and cabinet hardware.", source: "draft", note: "classic-brass.com had no tagline on homepage." },
  { slug: "hansgrohe", tagline: "Select joy.", source: "draft", note: "Hansgrohe's recent campaign tagline — site returned 403, pulled from brand knowledge." },
  { slug: "idh-st-simons", tagline: "Solid-brass architectural and decorative hardware since 1987.", source: "draft", note: "idhbrass.com had no tagline on homepage." },
  { slug: "infinity-drain", tagline: "Made in the USA.", source: "draft", note: "The only repeating positioning phrase on infinitydrain.com. Not strong — Joshua likely wants to rewrite." },
  { slug: "jason", tagline: "Hydrotherapy baths with MicroSilk technology.", source: "draft", note: "⚠ jasoninternational.com redirects to a Danish fashion film site (copenhagenfashionfilm.dk) — domain appears to have expired or been hijacked. Real Jason site may have moved." },
  { slug: "jsg-oceana", tagline: "Glass vessel sinks, made in America's glass country.", source: "draft", note: "Parent = Jeannette Specialty Glass, PA. No direct JSG Oceana domain." },
  { slug: "kitchenaid", tagline: "For the way it's made.", source: "draft", note: "KitchenAid brand promise — site timeout, pulled from brand knowledge." },
  { slug: "kwc", tagline: "Swiss-engineered faucets, precision-built.", source: "draft", note: "kwc.com had no tagline content on the scraped page." },
  { slug: "panasonic", tagline: "A Better Life, A Better World.", source: "draft", note: "Panasonic corporate tagline — site returned 403." },
  { slug: "robern", tagline: "Mirror cabinets and vanities, lit for the bath.", source: "draft", note: "robern.com connection dropped mid-fetch." },
  { slug: "rubinet", tagline: "Canadian-crafted luxury faucets.", source: "draft", note: "rubinet.com returned 403." },
  { slug: "s-parker", tagline: "Architectural and commercial door hardware.", source: "draft", note: "Site tagline was 119 chars ('No other single hardware source can offer you a more complete selection...'). Condensed." },
  { slug: "samsung", tagline: "Smart kitchen and home appliances.", source: "draft", note: "samsung.com homepage was all Spanish promo copy, no brand tagline." },
  { slug: "sigma", tagline: "Customizable California-designed bath fixtures.", source: "draft", note: "sigmafaucets.com had no content on the scraped page." },
  { slug: "victoria-and-albert", tagline: "Freestanding baths in volcanic limestone.", source: "draft", note: "vandabaths.com timed out. This draft uses V&A's distinctive Volcanic Limestone™ material positioning." },
];

// ── Length sanity ──────────────────────────────────────────────────────
for (const p of PATCHES) {
  if (p.tagline.length > 80) {
    console.warn(`  ⚠ tagline >80 chars for ${p.slug} (${p.tagline.length}): ${p.tagline}`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────

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

  const read = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${TAB}!A2:C`,
  });
  const rows = read.data.values ?? [];
  const slugToRow = new Map<string, { row: number; existingTagline: string }>();
  for (let i = 0; i < rows.length; i++) {
    const slug = rows[i]?.[0];
    if (slug) {
      slugToRow.set(slug, {
        row: i + 2,
        existingTagline: rows[i]?.[2] ?? "",
      });
    }
  }

  const data: { range: string; values: string[][] }[] = [];
  const now = new Date().toISOString();
  let wrote = 0;
  let skippedExisting = 0;
  const missing: string[] = [];

  for (const p of PATCHES) {
    const entry = slugToRow.get(p.slug);
    if (!entry) {
      missing.push(p.slug);
      continue;
    }
    if (entry.existingTagline.trim()) {
      skippedExisting++;
      continue;
    }
    data.push({ range: `${TAB}!${COL.tagline_en}${entry.row}`, values: [[p.tagline]] });
    if (p.country) {
      data.push({ range: `${TAB}!${COL.origin_country}${entry.row}`, values: [[p.country]] });
    }
    if (p.countryName) {
      data.push({ range: `${TAB}!${COL.origin_country_name}${entry.row}`, values: [[p.countryName]] });
    }
    data.push({
      range: `${TAB}!${COL.updated_at}${entry.row}:${COL.updated_by}${entry.row}`,
      values: [[now, "editorial-patch"]],
    });
    wrote++;
  }

  if (missing.length) {
    console.error(`\n✗ Slugs not in sheet:`);
    for (const m of missing) console.error(`    ${m}`);
    process.exit(1);
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { valueInputOption: "RAW", data },
  });

  const bySource: Record<Source, number> = { repo: 0, scraped: 0, draft: 0 };
  for (const p of PATCHES) bySource[p.source]++;

  console.log(`\n✓ Wrote taglines for ${wrote} brands (${data.length} cell updates).`);
  console.log(`  Skipped ${skippedExisting} rows (already had a tagline).\n`);
  console.log(`  Source breakdown:`);
  console.log(`    repo    (Joshua's editorial): ${bySource.repo}`);
  console.log(`    scraped (brand homepage):     ${bySource.scraped}`);
  console.log(`    draft   (scrape failed):      ${bySource.draft}\n`);

  const flags = PATCHES.filter((p) => p.note);
  if (flags.length) {
    console.log(`Flags / notes for Joshua's redline pass (${flags.length}):\n`);
    for (const n of flags) {
      console.log(`  [${n.slug}] (${n.source})`);
      console.log(`    "${n.tagline}"`);
      console.log(`    → ${n.note}\n`);
    }
  }
};

main().catch((err) => {
  console.error("\n✗ Patch failed:", err);
  process.exit(1);
});
