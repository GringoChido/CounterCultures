/**
 * Partner scraper TEMPLATE.
 *
 * Copy this file to partner-<brand>.ts and customize:
 *   - BRAND_FILTER : the brand string as it appears in products-odoo.csv
 *   - PRODUCT_URL  : function (sku) → product detail URL on the partner site
 *   - parseProduct : function (sku, html) → { descriptionEn, features[], specSheetUrl, ... }
 *
 * Why one file per brand? Each manufacturer site has a different DOM
 * structure. Sharing a parser would require runtime branching that's worse
 * than separate small files.
 *
 * Output:
 *   staging/partner/<brand>/<odoo_id>.json
 *
 * Usage:
 *   npx tsx scripts/scrape/partner-emtek.ts
 *   npx tsx scripts/scrape/partner-emtek.ts --limit 25
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import {
  REPO_ROOT, STAGING, exists, pool, getText, writeJson, stripHtml,
} from "./_lib";

// ───────────────────────────────────────────────────────────────────────────
// CUSTOMIZE THESE  ↓
// ───────────────────────────────────────────────────────────────────────────
const BRAND_FILTER = "Emtek";   // exact string in products-odoo.csv brand column
const BRAND_SLUG   = "emtek";    // for the staging folder name

/** Given a SKU, return one or more candidate product detail URLs. */
const productUrl = (sku: string): string[] => {
  const cleaned = sku.replace(/^EMTEK[\s-]*/i, "").trim();
  return [
    `https://emtek.com/product/${encodeURIComponent(cleaned)}`,
    `https://emtek.com/products/${encodeURIComponent(cleaned)}`,
  ];
};

/** Parse the product detail HTML. Return whatever fields you can extract;
 *  fields you can't find return undefined and downstream merge ignores them. */
const parseProduct = (sku: string, html: string) => {
  const descMatch =
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(html) ??
    /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)["']/i.exec(html);
  const descriptionEn = descMatch ? stripHtml(descMatch[1]) : "";

  // Spec PDF — Emtek usually serves them at /content/dam/.../*.pdf
  const specMatch = /href=["'](https?:\/\/[^"']+\.pdf)["'][^>]*>(?:[^<]*spec[^<]*|[^<]*sheet[^<]*)/i.exec(html);
  const specSheetUrl = specMatch?.[1];

  // Feature bullets — adjust the regex for the brand's typical DOM.
  const features: string[] = [];
  const ulMatch = /<ul[^>]+class=["'][^"']*feature[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i.exec(html);
  if (ulMatch) {
    for (const li of ulMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
      const t = stripHtml(li[1]); if (t) features.push(t);
    }
  }

  // Images — pick canonical og:image + any <img> under /content/dam/
  const images = new Set<string>();
  const og = /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(html);
  if (og) images.add(og[1]);
  for (const m of html.matchAll(/<img[^>]+src=["'](https:\/\/[^"']+\/content\/dam\/[^"']+\.(?:jpe?g|png|webp))["']/g)) {
    images.add(m[1]);
  }

  return { sku, descriptionEn, features, specSheetUrl, images: [...images] };
};

// ───────────────────────────────────────────────────────────────────────────
// CUSTOMIZE THESE  ↑
// ───────────────────────────────────────────────────────────────────────────

const arg = (name: string, fallback?: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`); return i < 0 ? fallback : process.argv[i + 1];
};

const parseCsv = async (csvPath: string): Promise<Array<Record<string, string>>> => {
  const text = await fs.readFile(csvPath, "utf-8");
  const clean = text.replace(/^﻿/, "");
  const rows: Array<Record<string, string>> = [];
  let header: string[] = []; let field = ""; let row: string[] = []; let inQuotes = false; let i = 0;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => {
    if (!header.length) header = row;
    else if (row.some((c) => c !== "")) {
      const o: Record<string, string> = {};
      for (let k = 0; k < header.length; k++) o[header[k]] = row[k] ?? "";
      rows.push(o);
    }
    row = [];
  };
  while (i < clean.length) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') { if (clean[i+1] === '"') { field += '"'; i+=2; continue; } inQuotes = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { pushField(); i++; continue; }
    if (c === "\n") { pushField(); pushRow(); i++; continue; }
    if (c === "\r") { i++; continue; }
    field += c; i++;
  }
  if (field || row.length) { pushField(); pushRow(); }
  return rows;
};

const run = async () => {
  const csvPath = path.join(REPO_ROOT, "scripts", "products-odoo.csv");
  const rows = (await parseCsv(csvPath)).filter((r) => r.brand === BRAND_FILTER && r.sku);
  const limit = Number(arg("limit", "0") || 0);
  const subset = limit > 0 ? rows.slice(0, limit) : rows;
  const concurrency = Number(arg("concurrency", "3"));
  const outDir = path.join(STAGING, "partner", BRAND_SLUG);

  console.log(`[partner-${BRAND_SLUG}] ${subset.length} ${BRAND_FILTER} SKUs (concurrency=${concurrency})`);

  let ok = 0, fail = 0, skipped = 0;
  await pool(subset, concurrency, async (r) => {
    const dest = path.join(outDir, `${r.odoo_id}.json`);
    if (await exists(dest)) { skipped++; return; }
    const candidates = productUrl(r.sku);
    let parsed: any = null;
    for (const url of candidates) {
      try {
        const html = await getText(url);
        if (html.length < 500) continue;
        parsed = parseProduct(r.sku, html);
        parsed.sourceUrl = url;
        parsed.odoo_id = r.odoo_id;
        parsed.sku = r.sku;
        parsed.brand = r.brand;
        parsed.scrapedAt = new Date().toISOString();
        break;
      } catch { /* try next candidate */ }
    }
    if (!parsed) { fail++; return; }
    await writeJson(dest, parsed);
    ok++;
  });

  console.log(`[partner-${BRAND_SLUG}] ✓ ok=${ok} skipped=${skipped} failed=${fail} (total=${subset.length})`);
};

if (require.main === module) {
  run().catch((e) => { console.error(e); process.exit(1); });
}
