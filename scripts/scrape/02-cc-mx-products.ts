/**
 * Step 2 — Scrape every product detail page on countercultures.com.mx.
 *
 * For each /productos/p/<slug> URL discovered in step 1, fetch the HTML and
 * extract:
 *   - title (Spanish)
 *   - meta description (Spanish marketing copy — usually 200-500 chars)
 *   - feature bullets (CARACTERÍSTICAS list)
 *   - all gallery image URLs (Squarespace CDN)
 *   - variant options (Color: dropdown)
 *   - price (peso amount, "desde" flag for variant ranges)
 *   - breadcrumb category
 *
 * Output: staging/cc-mx/products/<slug>.json  (one file per product)
 *
 * RESUMABILITY: a slug whose .json exists is skipped. Re-run is safe.
 *
 * Usage:
 *   npx tsx scripts/scrape/02-cc-mx-products.ts                 # full run
 *   npx tsx scripts/scrape/02-cc-mx-products.ts --limit 25      # smoke test
 *   npx tsx scripts/scrape/02-cc-mx-products.ts --concurrency 8 # default 4
 *   npx tsx scripts/scrape/02-cc-mx-products.ts --refresh       # force re-scrape
 */
import * as path from "node:path";
import {
  STAGING,
  getText,
  writeJson,
  readJson,
  exists,
  pool,
  all,
  maybe,
  stripHtml,
  decodeEntities,
  cdnAtWidth,
} from "./_lib";

const SITEMAP = path.join(STAGING, "cc-mx", "sitemap.json");
const OUT_DIR = path.join(STAGING, "cc-mx", "products");

interface ProductSitemapEntry {
  slug: string;
  url: string;
  lastmod: string | null;
}

export interface ScrapedProduct {
  slug: string;
  url: string;
  title: string;
  description: string;
  features: string[];
  images: string[];
  variants: string[];
  breadcrumb: string[];
  price: number | null;
  priceFrom: boolean;
  saleOriginalPrice: number | null;
  currency: string;
  availability: string | null;
  scrapedAt: string;
}

const arg = (name: string, fallback?: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  return process.argv[i + 1];
};

const parsePrice = (s: string | null): number | null => {
  if (!s) return null;
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const parseMeta = (html: string, key: string): string | null => {
  // Match both name= and property= forms; capture content irrespective of attr order.
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${key}["'][^>]*content=["']([^"']*)["']|` +
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${key}["']`,
    "i"
  );
  const m = re.exec(html);
  if (!m) return null;
  return decodeEntities(m[1] ?? m[2] ?? "");
};

export const parseProduct = (slug: string, url: string, html: string): ScrapedProduct => {
  const titleRaw = parseMeta(html, "og:title") ?? maybe(html, /<title>([^<]+)<\/title>/);
  const title = decodeEntities((titleRaw ?? "").replace(/\s*[—–]\s*Counter Cultures.*$/i, "").trim());

  const description = parseMeta(html, "og:description") ?? parseMeta(html, "description") ?? "";

  // Features: Squarespace renders <ul><li> after the "CARACTERÍSTICAS" heading.
  // We scope to the first <ul> following a heading that contains the word.
  const features: string[] = [];
  const featMatch = /CARACTER[ÍI]STICAS[\s\S]{0,200}?<ul[^>]*>([\s\S]*?)<\/ul>/i.exec(html);
  if (featMatch) {
    for (const liMatch of featMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
      const text = stripHtml(liMatch[1]);
      if (text) features.push(text);
    }
  }

  // Images: Squarespace renders product gallery images as <img src="https://images.squarespace-cdn.com/…">.
  // De-dup the base CDN path (strip query) before adding back ?format=2500w.
  const imgUrls = new Set<string>();
  for (const m of html.matchAll(/<img[^>]+src=["'](https:\/\/images\.squarespace-cdn\.com\/[^"']+)["']/g)) {
    const raw = decodeEntities(m[1]);
    // Exclude tiny site assets (logo, social, navigation).
    if (/\/logo[^"']*$/i.test(raw)) continue;
    if (/static1\.squarespace\.com\/static\/[^/]+\/?$/i.test(raw)) continue;
    if (raw.length < 80) continue;
    imgUrls.add(cdnAtWidth(raw.split("?")[0], 2500));
  }
  // Also pick up og:image (full-resolution canonical).
  const og = parseMeta(html, "og:image");
  if (og) imgUrls.add(cdnAtWidth(og.split("?")[0], 2500));
  const images = [...imgUrls];

  // Variants: Squarespace renders a <select> dropdown for "Color:" or similar.
  const variants: string[] = [];
  for (const sel of html.matchAll(/<select[^>]*>([\s\S]*?)<\/select>/g)) {
    const inner = sel[1];
    const opts = [...inner.matchAll(/<option[^>]*>([\s\S]*?)<\/option>/g)]
      .map((m) => stripHtml(m[1]))
      .filter((v) => v && !/^selecciona|^select /i.test(v));
    if (opts.length) {
      for (const v of opts) variants.push(v);
    }
  }

  // Breadcrumb — Squarespace renders a "Productos › Title" trail.
  const breadcrumb: string[] = [];
  const bcMatch = /href=["']\/productos["'][^>]*>([^<]+)<\/a>[\s\S]{0,100}?›[\s\S]{0,100}?>([^<]+)</.exec(html);
  if (bcMatch) {
    breadcrumb.push(decodeEntities(bcMatch[1]));
    breadcrumb.push(decodeEntities(bcMatch[2]));
  }

  // Price: meta product:price:amount preferred; fall back to "$N,NNN.NN" pattern in body.
  const priceMeta = parseMeta(html, "product:price:amount") ?? parseMeta(html, "og:price:amount");
  let price = parsePrice(priceMeta);
  let priceFrom = false;
  if (price == null) {
    const fromMatch = /desde\s*\$?([\d,]+\.\d{2})/i.exec(html);
    if (fromMatch) { price = parsePrice(fromMatch[1]); priceFrom = true; }
  }
  let saleOriginalPrice: number | null = null;
  const origMatch = /Precio original[^$\d]*\$([\d,]+\.\d{2})/i.exec(html);
  if (origMatch) saleOriginalPrice = parsePrice(origMatch[1]);

  const currency = parseMeta(html, "product:price:currency") ?? "MXN";
  const availability = parseMeta(html, "product:availability");

  return {
    slug,
    url,
    title,
    description,
    features,
    images,
    variants,
    breadcrumb,
    price,
    priceFrom,
    saleOriginalPrice,
    currency,
    availability,
    scrapedAt: new Date().toISOString(),
  };
};

const run = async () => {
  if (!(await exists(SITEMAP))) {
    console.error(`[02] Sitemap not found at ${SITEMAP}. Run 01-cc-mx-sitemap.ts first.`);
    process.exit(1);
  }
  const entries = await readJson<ProductSitemapEntry[]>(SITEMAP);
  const limit = Number(arg("limit", "0") || 0);
  const concurrency = Number(arg("concurrency", "4"));
  const refresh = process.argv.includes("--refresh");
  const subset = limit > 0 ? entries.slice(0, limit) : entries;

  console.log(`[02] Scraping ${subset.length} products (concurrency=${concurrency}, refresh=${refresh})…`);

  let skipped = 0;
  let scraped = 0;
  let failed = 0;
  const failures: Array<{ slug: string; error: string }> = [];

  await pool(subset, concurrency, async (entry, i) => {
    const dest = path.join(OUT_DIR, `${entry.slug}.json`);
    if (!refresh && (await exists(dest))) {
      skipped++;
      return;
    }
    try {
      const html = await getText(entry.url);
      const product = parseProduct(entry.slug, entry.url, html);
      await writeJson(dest, product);
      scraped++;
      if ((i + 1) % 25 === 0) {
        console.log(`[02]   …${i + 1}/${subset.length} (scraped=${scraped} skipped=${skipped} failed=${failed})`);
      }
    } catch (e) {
      failed++;
      failures.push({ slug: entry.slug, error: e instanceof Error ? e.message : String(e) });
    }
  });

  if (failures.length) {
    const failPath = path.join(STAGING, "cc-mx", "failures-step02.json");
    await writeJson(failPath, failures);
    console.log(`[02] ${failures.length} failures logged → ${failPath}`);
  }
  console.log(`[02] ✓ scraped=${scraped} skipped=${skipped} failed=${failed} (total=${subset.length})`);
};

if (require.main === module) {
  run().catch((e) => {
    console.error("[02] FAILED:", e);
    process.exit(1);
  });
}
