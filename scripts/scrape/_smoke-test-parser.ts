/**
 * Smoke test: verify the parser extracts the right fields from a known-good
 * countercultures.com.mx product page. Used by build/CI to confirm the
 * Squarespace DOM hasn't drifted under us.
 *
 * Run: npx tsx scripts/scrape/_smoke-test-parser.ts
 */
import { parseProduct } from "./02-cc-mx-products";

const TEST_URL = "https://www.countercultures.com.mx/productos/p/mezcladora-para-cocina-extraible-angulada-con-manija-moleteada";
const TEST_SLUG = "mezcladora-para-cocina-extraible-angulada-con-manija-moleteada";

const fail = (msg: string) => { console.error("✗", msg); process.exitCode = 1; };
const pass = (msg: string) => console.log("✓", msg);

const run = async () => {
  console.log(`Fetching ${TEST_URL}`);
  const res = await fetch(TEST_URL, { headers: { "User-Agent": "CC-AssetMigration-Smoke/1.0" } });
  if (!res.ok) { fail(`HTTP ${res.status}`); return; }
  const html = await res.text();
  const p = parseProduct(TEST_SLUG, TEST_URL, html);

  if (p.title.includes("Brizo LITZE")) pass(`title parsed: "${p.title}"`); else fail(`title wrong: "${p.title}"`);
  if (p.description.length >= 100) pass(`description ${p.description.length} chars`); else fail(`description too short: ${p.description.length}`);
  if (p.features.length >= 3) pass(`features: ${p.features.length}`); else fail(`features too few: ${p.features.length}`);
  if (p.images.length >= 3) pass(`images: ${p.images.length}`); else fail(`images too few: ${p.images.length}`);
  if (p.variants.length >= 3) pass(`variants: ${p.variants.length}`); else fail(`variants too few: ${p.variants.length}`);
  if (p.price && p.price > 1000) pass(`price: ${p.price} ${p.currency}`); else fail(`price not parsed: ${p.price}`);

  console.log("\nFull parse result:");
  console.log(JSON.stringify({
    title: p.title,
    description: p.description.slice(0, 120) + "…",
    features: p.features,
    imageCount: p.images.length,
    firstImage: p.images[0],
    variants: p.variants,
    price: p.price, priceFrom: p.priceFrom, currency: p.currency,
  }, null, 2));
};

run().catch((e) => { console.error("FAILED:", e); process.exit(1); });
