/**
 * Step 5 — Match scraped countercultures.com.mx slugs to Odoo product IDs.
 *
 * The legacy Squarespace site doesn't carry our Odoo IDs in its URLs/HTML, so
 * we match scraped products to Odoo via fuzzy similarity on (title, brand)
 * against (name, brand, sku) in the CSV.
 *
 * Strategy:
 *   1. For each scraped product, compute a feature vector: bag of normalized
 *      tokens from (title + features). Include known SKU codes (everything
 *      that looks like an alphanumeric-with-dash token of length ≥4).
 *   2. For each Odoo row, build the same vector from (name + sku + description).
 *   3. Score = (Jaccard token overlap) × (brand-match boost) +
 *              (1.0 if any extracted SKU appears in odoo.sku, else 0)
 *   4. Best match per slug wins. Confidence is normalized 0–1.
 *
 * Output:
 *   staging/cc-mx/match-map.json  — [{ slug, odoo_id, sku, confidence, alt[3] }]
 *
 * Anything below confidence 0.45 is flagged for manual review.
 *
 * Usage:
 *   npx tsx scripts/scrape/05-match-to-odoo.ts
 *   npx tsx scripts/scrape/05-match-to-odoo.ts --min 0.35
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { REPO_ROOT, STAGING, exists, writeJson } from "./_lib";
import type { ScrapedProduct } from "./02-cc-mx-products";

const PRODUCTS_DIR = path.join(STAGING, "cc-mx", "products");
const OUT = path.join(STAGING, "cc-mx", "match-map.json");

const STOP = new Set([
  "el","la","los","las","de","del","con","para","sin","y","o","u","en","a",
  "the","a","an","of","for","with","and","or","to","by","on",
  // Common adjectives/finish words that aren't useful for matching
  "color","colors","negro","blanco","plateado","dorado","cromado","bronce","cromo","niquel","brilliance","luxe","matte","brushed","polished","satin",
]);

const normTokens = (s: string): string[] => {
  return s
    .toLowerCase()
    .replace(/[®©™]/g, " ")
    .replace(/[^a-z0-9áéíóúñü\-\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && t.length >= 3 && !STOP.has(t));
};

const skuLikeTokens = (s: string): string[] => {
  const out: string[] = [];
  for (const m of s.matchAll(/\b([A-Z]{2,}[\s-]*[A-Z0-9-]{3,})\b/g)) {
    const code = m[1].replace(/\s+/g, "").toUpperCase();
    if (code.length >= 5) out.push(code);
  }
  return out;
};

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
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

const arg = (name: string, fallback?: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`); return i < 0 ? fallback : process.argv[i + 1];
};

const run = async () => {
  const minConf = Number(arg("min", "0.45"));
  const csvPath = path.join(REPO_ROOT, "scripts", "products-odoo.csv");
  const odooRows = await parseCsv(csvPath);
  console.log(`[05] Odoo rows: ${odooRows.length}`);

  // Index Odoo rows by brand to narrow the search.
  const byBrand = new Map<string, Array<{ row: Record<string,string>; tokens: Set<string>; skuTokens: Set<string> }>>();
  for (const r of odooRows) {
    const corpus = `${r.name ?? ""} ${r.description ?? ""} ${r.sku ?? ""}`;
    const tokens = new Set(normTokens(corpus));
    const skuTokens = new Set([
      ...skuLikeTokens(corpus),
      (r.sku ?? "").replace(/\s+/g, "").toUpperCase(),
    ].filter(Boolean));
    const brand = (r.brand ?? "").trim();
    if (!byBrand.has(brand)) byBrand.set(brand, []);
    byBrand.get(brand)!.push({ row: r, tokens, skuTokens });
  }

  // Map scraped brand-y heuristics → Odoo brand strings.
  // Includes both vendor names AND collection/series names (LITZE→Brizo,
  // POETTO→California Faucets, etc.) because Squarespace titles often lead
  // with the collection name rather than the brand.
  const brandAliases: Record<string, string[]> = {
    // Top brands
    "BRIZO": ["Brizo"],
    "KOHLER": ["Kohler"],
    "TOTO": ["Toto"],
    "CALIFORNIA FAUCETS": ["California Faucets"],
    "CALIFONIA FAUCETS": ["California Faucets"],  // typo on legacy site
    "DELTA": ["Delta"],
    "EMTEK": ["Emtek"],
    "SUN VALLEY BRONZE": ["Sun Valley Bronze"],
    "ROHL": ["Rohl"],
    "BLANCO": ["Blanco"],
    "BADELOFT": ["Badeloft"],
    "AQUASPA": ["AQUASPA"],
    "AQUA SPA": ["AQUASPA"],
    "VILLEROY": ["Villeroy & Boch", "Villeroy and Boch"],
    "MISTOA": ["Mistoa"],
    "BANTE": ["Banté"],
    "BANT": ["Banté"],
    "EBBE": ["Ebbe"],
    "BALDWIN": ["Baldwin"],
    "TEKA": ["TEKA"],
    "KINGSTON BRASS": ["Kingston Brass"],
    "WATERWORKS": ["Waterworks"],
    "WATERMARK": ["Watermark"],
    "CRL": ["CRL"],
    "DORNBRACHT": ["Dornbracht"],
    "ROCKY MOUNTAIN HARDWARE": ["Rocky Mountain Hardware"],
    "ROCKY MOUNTAIN": ["Rocky Mountain Hardware"],
    "BUILD": ["Build"],
    "JACLO": ["JACLO"],
    "MIRABELLE": ["Mirabelle"],
    "JCR": ["JCR"],
    "SMEG": ["Smeg"],
    "BLUESTAR": ["Bluestar"],
    "ACORN": ["Acorn Manufacturing", "Acorn"],
    // Brizo collections → Brizo
    "LITZE": ["Brizo"],
    "ARTESSO": ["Brizo"],
    "ODIN": ["Brizo"],
    "VIRAGE": ["Brizo"],
    "SIDERNA": ["Brizo"],
    "VESI": ["Brizo"],
    "TEMPASSURE": ["Brizo"],
    // California Faucets collections
    "POETTO": ["California Faucets"],
    "DAVOLI": ["California Faucets"],
    "DESCANSO": ["California Faucets"],
    "DEL MAR": ["California Faucets"],
    "DELMAR": ["California Faucets"],
    "CORSANO": ["California Faucets"],
    "JALAMA": ["California Faucets"],
    "BELLA TERRA": ["California Faucets"],
    "STYLETHERM": ["California Faucets"],
    "RAINSCAPE": ["California Faucets"],
    "ZERODRAIN": ["California Faucets"],
    "ZERO DRAIN": ["California Faucets"],
    "SOLIMAR": ["California Faucets"],
    "SALINAS": ["California Faucets"],
    "CRAFTSMAN": ["California Faucets"],
    "D STREET": ["California Faucets"],
    "D-STREET": ["California Faucets"],
    "PALM SPRINGS": ["California Faucets"],
    // Kohler collections
    "EDALYN": ["Kohler"],
    "FORTE": ["Kohler"],
    "VERTICYL": ["Kohler"],
    "CLEARFLO": ["Kohler"],
    "CIMARRON": ["Kohler"],
    "STUDIO MCGEE": ["Kohler"],
    // TOTO collections
    "AQUIA": ["Toto"],
    "CARLYLE": ["Toto"],
    "CONNELLY": ["Toto"],
    "DRAKE": ["Toto"],
    "LEGATO": ["Toto"],
    "WASHLET": ["Toto"],
    // Counter (house brands)
    "COUNTER / SANTIAGO": ["Counter / Santiago"],
    "SANTIAGO": ["Counter / Santiago"],
    "COUNTER / GABY": ["Counter / Gaby- Cobre"],
    "GABY": ["Counter / Gaby- Cobre"],
    "COBRE": ["Counter / Gaby- Cobre", "Counter / Santiago"],
    "RIOLITA": ["Counter / Santiago"],
    "ARTESANAL": ["Counter", "Counter / Santiago"],
    "ARTESANO": ["Counter", "Counter / Santiago"],
    "MICHELLE VESSEL": ["Counter / Gaby- Cobre"],
  };

  const guessBrand = (title: string, breadcrumb?: string[]): string[] => {
    const upper = `${title} ${(breadcrumb ?? []).join(" ")}`.toUpperCase();
    const hits = new Set<string>();
    // Iterate longest keys first so "CALIFORNIA FAUCETS" wins over "DELTA"
    // in cases of substring collision.
    const keys = Object.keys(brandAliases).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (upper.includes(key)) {
        for (const b of brandAliases[key]) hits.add(b);
      }
    }
    return [...hits];
  };

  const files = (await fs.readdir(PRODUCTS_DIR)).filter((f) => f.endsWith(".json"));
  console.log(`[05] Scraped products: ${files.length}`);

  interface Match {
    slug: string;
    title: string;
    odoo_id: string | null;
    sku: string | null;
    brand: string | null;
    confidence: number;
    alts: Array<{ odoo_id: string; sku: string; brand: string; confidence: number }>;
    flags: string[];
  }

  const matches: Match[] = [];
  let highConf = 0, lowConf = 0, noMatch = 0;
  for (const f of files) {
    const p = JSON.parse(await fs.readFile(path.join(PRODUCTS_DIR, f), "utf-8")) as ScrapedProduct;
    const titleCorpus = `${p.title} ${p.features.join(" ")} ${p.breadcrumb.join(" ")}`;
    const scrapedTokens = new Set(normTokens(titleCorpus));
    const scrapedSkuTokens = new Set(skuLikeTokens(titleCorpus));

    const brands = guessBrand(p.title, p.breadcrumb);
    // When brand inference fails, fall back to the full catalog so the LLM
    // step can disambiguate. When it succeeds, narrow the pool to that brand
    // (×~5 faster and avoids cross-brand false positives).
    const pools = brands.length
      ? brands.flatMap((b) => byBrand.get(b) ?? [])
      : [...byBrand.values()].flat();

    // Score
    const scored = pools.map((cand) => {
      const tokenScore = jaccard(scrapedTokens, cand.tokens);
      // SKU hit boost: if any scraped SKU-like token is in candidate SKU tokens.
      let skuBoost = 0;
      for (const s of scrapedSkuTokens) if (cand.skuTokens.has(s)) { skuBoost = 0.4; break; }
      const score = tokenScore * 0.7 + skuBoost + (brands.length ? 0.1 : 0);
      return { cand, score };
    });
    scored.sort((a, b) => b.score - a.score);

    const top = scored[0];
    const alts = scored.slice(1, 4).map((s) => ({
      odoo_id: s.cand.row.odoo_id,
      sku: s.cand.row.sku,
      brand: s.cand.row.brand,
      confidence: Math.min(1, s.score),
    }));

    const flags: string[] = [];
    if (!top || top.score < 0.1) {
      noMatch++;
      flags.push("no-candidates");
      matches.push({ slug: p.slug, title: p.title, odoo_id: null, sku: null, brand: null, confidence: 0, alts: [], flags });
      continue;
    }
    if (top.score < minConf) {
      flags.push("low-confidence");
      lowConf++;
    } else {
      highConf++;
    }
    matches.push({
      slug: p.slug,
      title: p.title,
      odoo_id: top.cand.row.odoo_id,
      sku: top.cand.row.sku,
      brand: top.cand.row.brand,
      confidence: Math.min(1, top.score),
      alts,
      flags,
    });
  }

  matches.sort((a, b) => a.confidence - b.confidence);
  await writeJson(OUT, matches);
  console.log(`[05] ✓ high=${highConf} low=${lowConf} no-match=${noMatch} → ${OUT}`);
  console.log(`[05]   Manual review needed for ${lowConf + noMatch} matches.`);
};

run().catch((e) => {
  console.error("[05] FAILED:", e);
  process.exit(1);
});
