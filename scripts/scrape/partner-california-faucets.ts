/**
 * Partner scraper — California Faucets (calfaucets.com).
 *
 * CF is our largest single brand (1,062 SKUs). Spec sheets are PDFs under
 * /pdfs/spec/<SKU>.pdf. Product detail pages live at /product/<sku>.
 *
 * The CF SKU in our CSV looks like "CF-9651" or "CF-9482-K10-3.0" — we strip
 * the "CF-" prefix and the trailing finish/size codes to derive a URL slug.
 *
 * Output: staging/partner/california-faucets/<odoo_id>.json
 *         public/specs/odoo/<odoo_id>.pdf (when found)
 *
 * Usage:
 *   npx tsx scripts/scrape/partner-california-faucets.ts
 *   npx tsx scripts/scrape/partner-california-faucets.ts --limit 25
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import {
  REPO_ROOT, STAGING, PUBLIC_SPECS, exists, pool, getText, downloadBinary,
  writeJson, stripHtml, decodeEntities,
} from "./_lib";

const BRAND_FILTER = "California Faucets";
const BRAND_SLUG   = "california-faucets";

const arg = (name: string, fallback?: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`); return i < 0 ? fallback : process.argv[i + 1];
};

interface CsvRow { odoo_id: string; sku: string; name: string; brand: string; description: string; }

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
    if (inQuotes) {
      if (c === '"') { if (text[i+1] === '"') { field += '"'; i+=2; continue; } inQuotes = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { pushField(); i++; continue; }
    if (c === "\n") { pushField(); pushRow(); i++; continue; }
    if (c === "\r") { i++; continue; }
    field += c; i++;
  }
  if (field || row.length) { pushField(); pushRow(); }
  return out;
};

/** CF SKU → model code (e.g. "CF-9482-K10-3.0" → "9482-K10-3.0"). */
const cfModelCode = (sku: string): string =>
  sku.replace(/^CF-?\s*/i, "").trim();

/** Candidate URLs to try, in order of likelihood. */
const productCandidates = (sku: string): string[] => {
  const model = cfModelCode(sku);
  // Strip trailing finish like "-FINISH" placeholder if present
  const cleaned = model.replace(/-FINISH$/i, "");
  return [
    `https://www.calfaucets.com/product/${encodeURIComponent(cleaned.toLowerCase())}`,
    `https://www.calfaucets.com/product/${encodeURIComponent(cleaned)}`,
  ];
};

const specPdfCandidates = (sku: string): string[] => {
  const model = cfModelCode(sku);
  return [
    `https://www.calfaucets.com/pdfs/spec/${model}.pdf`,
    `https://www.calfaucets.com/pdfs/spec/${model.split("-")[0]}.pdf`,
  ];
};

const parseProduct = (sku: string, html: string) => {
  const og = /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)["']/i.exec(html);
  const desc = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(html);
  const descriptionEn = decodeEntities((og?.[1] ?? desc?.[1] ?? "").trim());

  const images = new Set<string>();
  const ogImg = /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(html);
  if (ogImg) images.add(ogImg[1]);
  for (const m of html.matchAll(/<img[^>]+src=["'](https:\/\/[^"']+calfaucets\.com\/[^"']+\.(?:jpe?g|png|webp))["']/g)) {
    images.add(m[1]);
  }

  // Spec PDF anchored on the page
  const specOnPage = /href=["'](https?:\/\/[^"']+\.pdf)["'][^<]*spec/i.exec(html);

  // Features — CF wraps them in <ul class="features"> or similar. Be loose.
  const features: string[] = [];
  const ulMatch = /<ul[^>]+(?:class|id)=["'][^"']*(feature|highlight|spec)[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i.exec(html);
  if (ulMatch) {
    for (const li of ulMatch[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
      const t = stripHtml(li[1]); if (t && t.length < 200) features.push(t);
    }
  }

  return {
    sku,
    descriptionEn,
    features,
    images: [...images],
    specSheetUrl: specOnPage?.[1],
  };
};

const headOk = async (url: string): Promise<boolean> => {
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": "CC-AssetMigration/1.0" }, redirect: "follow" });
    return res.ok;
  } catch { return false; }
};

const run = async () => {
  const csvPath = path.join(REPO_ROOT, "scripts", "products-odoo.csv");
  const rows = (await parseCsv(csvPath)).filter((r) => r.brand === BRAND_FILTER && r.sku);
  const limit = Number(arg("limit", "0") || 0);
  const concurrency = Number(arg("concurrency", "3"));
  const subset = limit > 0 ? rows.slice(0, limit) : rows;
  const outDir = path.join(STAGING, "partner", BRAND_SLUG);

  console.log(`[CF] ${subset.length} California Faucets SKUs to probe (concurrency=${concurrency})`);

  let ok = 0, fail = 0, skipped = 0, pdfs = 0;
  await pool(subset, concurrency, async (r) => {
    const dest = path.join(outDir, `${r.odoo_id}.json`);
    if (await exists(dest)) { skipped++; return; }
    const candidates = productCandidates(r.sku);
    let parsed: any = null;
    let sourceUrl = "";
    for (const url of candidates) {
      try {
        const html = await getText(url);
        if (html.length < 500) continue;
        parsed = parseProduct(r.sku, html);
        sourceUrl = url;
        break;
      } catch { /* try next */ }
    }
    if (!parsed) { fail++; return; }

    // Spec PDF fallback if not found in page
    if (!parsed.specSheetUrl) {
      for (const u of specPdfCandidates(r.sku)) {
        if (await headOk(u)) { parsed.specSheetUrl = u; break; }
      }
    }

    // Download spec PDF if we have one
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
    if (ok % 25 === 0) console.log(`[CF]   …ok=${ok} skipped=${skipped} failed=${fail} pdfs=${pdfs}`);
  });

  console.log(`[CF] ✓ ok=${ok} skipped=${skipped} failed=${fail} pdfs=${pdfs} (total=${subset.length})`);
};

run().catch((e) => { console.error(e); process.exit(1); });
