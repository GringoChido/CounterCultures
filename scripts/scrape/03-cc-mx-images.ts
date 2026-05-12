/**
 * Step 3 — Download all gallery images from scraped products.
 *
 * Reads every staging/cc-mx/products/<slug>.json, downloads each image at
 * 2500w resolution, and writes to staging/cc-mx/images/<slug>/N.<ext>.
 *
 * RESUMABILITY: skips any file already on disk. Re-run safely.
 *
 * Usage:
 *   npx tsx scripts/scrape/03-cc-mx-images.ts
 *   npx tsx scripts/scrape/03-cc-mx-images.ts --concurrency 6
 *   npx tsx scripts/scrape/03-cc-mx-images.ts --max-per-product 5
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { STAGING, pool, exists, downloadBinary } from "./_lib";
import type { ScrapedProduct } from "./02-cc-mx-products";

const PRODUCTS_DIR = path.join(STAGING, "cc-mx", "products");
const IMAGES_DIR = path.join(STAGING, "cc-mx", "images");

const arg = (name: string, fallback?: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  return process.argv[i + 1];
};

const extOf = (url: string): string => {
  const m = /\.(jpe?g|png|webp|gif|avif)/i.exec(url.split("?")[0]);
  return m ? `.${m[1].toLowerCase()}` : ".jpg";
};

const run = async () => {
  const files = (await fs.readdir(PRODUCTS_DIR)).filter((f) => f.endsWith(".json"));
  const concurrency = Number(arg("concurrency", "5"));
  const maxPer = Number(arg("max-per-product", "12"));

  console.log(`[03] Found ${files.length} product JSON files. Downloading images (concurrency=${concurrency}, max-per=${maxPer})…`);

  // Flatten to (slug, idx, url) work items
  type Job = { slug: string; idx: number; url: string };
  const jobs: Job[] = [];
  for (const f of files) {
    const p = JSON.parse(await fs.readFile(path.join(PRODUCTS_DIR, f), "utf-8")) as ScrapedProduct;
    p.images.slice(0, maxPer).forEach((url, idx) => jobs.push({ slug: p.slug, idx, url }));
  }
  console.log(`[03] Total image jobs: ${jobs.length}`);

  let dl = 0, skipped = 0, failed = 0;
  await pool(jobs, concurrency, async (j) => {
    const dest = path.join(IMAGES_DIR, j.slug, `${String(j.idx + 1).padStart(2, "0")}${extOf(j.url)}`);
    if (await exists(dest)) {
      skipped++;
      return;
    }
    try {
      await downloadBinary(j.url, dest);
      dl++;
      if ((dl + skipped) % 50 === 0) {
        console.log(`[03]   …downloaded=${dl} skipped=${skipped} failed=${failed}`);
      }
    } catch (e) {
      failed++;
    }
  });

  console.log(`[03] ✓ downloaded=${dl} skipped=${skipped} failed=${failed} (total=${jobs.length})`);
};

run().catch((e) => {
  console.error("[03] FAILED:", e);
  process.exit(1);
});
