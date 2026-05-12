/**
 * Partner scraper — Emtek (emtek.com).
 *
 * Emtek has 456 SKUs in our catalog, most of which are variants of ~40-50
 * core products (lever × finish × handing × backset). Their product pages
 * live at emtek.com/products/<lever-style>/<rosette-style> and spec sheets
 * are linked from each page.
 *
 * Output: staging/partner/emtek/<odoo_id>.json
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import {
  REPO_ROOT, STAGING, PUBLIC_SPECS, exists, pool, getText, downloadBinary,
  writeJson, stripHtml, decodeEntities,
} from "./_lib";

const BRAND_FILTER = "Emtek";
const BRAND_SLUG   = "emtek";

const arg = (name: string, fallback?: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`); return i < 0 ? fallback : process.argv[i + 1];
};

interface CsvRow { odoo_id: string; sku: string; name: string; brand: string; }

const parseCsv = async (csvPath: string): Promise<CsvRow[]> => {
  const text = (await fs.readFile(csvPath, "utf-8")).replace(/^﻿/, "");
  const out: CsvRow[] = [];
  let header: string[] = []; let field = ""; let row: string[] = []; let inQuotes = false; let i = 0;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => {
    if (!header.length) header = row;
    else if (row.some((c) => c !== "")) {
      const o: Record<string, string> = {};
      for (let k = 0; k < header.length; k++) o[header[k]] = row[k] ?? "";
      out.push(o as unknown as CsvRow);
    }
    row = [];
  };
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i+=2; continue; } inQuotes = false; i++; continue; } field += c; i++; continue; }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { pushField(); i++; continue; }
    if (c === "\n") { pushField(); pushRow(); i++; continue; }
    if (c === "\r") { i++; continue; }
    field += c; i++;
  }
  if (field || row.length) { pushField(); pushRow(); }
  return out;
};

/** Extract a search term from the Odoo product name — Emtek leans on
 *  collection names like "Helios", "Cimarron", "Cadet" that resolve well
 *  on emtek.com's site search. */
const searchTerm = (name: string): string => {
  // Take the first proper-noun token (capitalized 4+ letter word)
  const m = name.match(/\b([A-Z][a-z]{3,})\b/);
  return m ? m[1] : name.split(",")[0].trim().slice(0, 30);
};

/** Try a few URL patterns for the product. */
const productCandidates = (sku: string, name: string): string[] => {
  const cleaned = sku.replace(/^EMTEK[\s-]*/i, "").trim();
  const term = searchTerm(name).toLowerCase();
  return [
    `https://emtek.com/products/${term}`,
    `https://emtek.com/product/${encodeURIComponent(cleaned)}`,
    `https://emtek.com/search?q=${encodeURIComponent(term)}`,
  ];
};

const parseProduct = (sku: string, html: string) => {
  const og = /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)["']/i.exec(html);
  const desc = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(html);
  const descriptionEn = decodeEntities((og?.[1] ?? desc?.[1] ?? "").trim());

  const images = new Set<string>();
  const ogImg = /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(html);
  if (ogImg) images.add(ogImg[1]);
  for (const m of html.matchAll(/<img[^>]+src=["'](https:\/\/(?:[^"']*emtek\.com|[^"']*amazonaws\.com)[^"']+\.(?:jpe?g|png|webp))["']/g)) {
    images.add(m[1]);
  }

  // Spec sheets — Emtek puts them under /content/dam/.../*.pdf
  const specMatch = /href=["'](https?:\/\/[^"']+\.pdf)["'][^<]*(spec|sheet)/i.exec(html);

  // Features ul
  const features: string[] = [];
  const ulMatch = /<ul[^>]*>([\s\S]*?)<\/ul>/i.exec(html);
  if (ulMatch) {
    for (const li of ulMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
      const t = stripHtml(li[1]);
      if (t && t.length > 10 && t.length < 200) features.push(t);
    }
  }

  return { sku, descriptionEn, features: features.slice(0, 8), images: [...images], specSheetUrl: specMatch?.[1] };
};

const run = async () => {
  const csvPath = path.join(REPO_ROOT, "scripts", "products-odoo.csv");
  const rows = (await parseCsv(csvPath)).filter((r) => r.brand === BRAND_FILTER && r.sku && r.name);
  const limit = Number(arg("limit", "0") || 0);
  const concurrency = Number(arg("concurrency", "3"));
  const subset = limit > 0 ? rows.slice(0, limit) : rows;
  const outDir = path.join(STAGING, "partner", BRAND_SLUG);
  console.log(`[EMTEK] ${subset.length} SKUs (concurrency=${concurrency})`);

  let ok = 0, fail = 0, skipped = 0, pdfs = 0;
  await pool(subset, concurrency, async (r) => {
    const dest = path.join(outDir, `${r.odoo_id}.json`);
    if (await exists(dest)) { skipped++; return; }
    let parsed: any = null;
    let sourceUrl = "";
    for (const url of productCandidates(r.sku, r.name)) {
      try {
        const html = await getText(url);
        if (html.length < 500) continue;
        parsed = parseProduct(r.sku, html);
        sourceUrl = url;
        if (parsed.descriptionEn || parsed.images.length) break;
      } catch { /* try next */ }
    }
    if (!parsed || (!parsed.descriptionEn && !parsed.images.length)) { fail++; return; }

    if (parsed.specSheetUrl) {
      const pdfDest = path.join(PUBLIC_SPECS, "odoo", `${r.odoo_id}.pdf`);
      if (!(await exists(pdfDest))) {
        try { await downloadBinary(parsed.specSheetUrl, pdfDest); pdfs++; } catch {}
      }
    }

    parsed.sourceUrl = sourceUrl;
    parsed.odoo_id = r.odoo_id;
    parsed.brand = r.brand;
    parsed.scrapedAt = new Date().toISOString();
    await writeJson(dest, parsed);
    ok++;
    if (ok % 25 === 0) console.log(`[EMTEK]   …ok=${ok} skipped=${skipped} failed=${fail} pdfs=${pdfs}`);
  });
  console.log(`[EMTEK] ✓ ok=${ok} skipped=${skipped} failed=${fail} pdfs=${pdfs} (total=${subset.length})`);
};

run().catch((e) => { console.error(e); process.exit(1); });
