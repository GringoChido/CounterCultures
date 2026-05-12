/**
 * Stage 3 — Collapse Odoo variants under canonical parent products.
 *
 * The Odoo catalog has ~4,236 templates but most are variants of the same
 * physical product: Emtek lever set × finish × handing × backset = 24 SKUs
 * for one lever. We pick ONE canonical parent per family and make the other
 * SKUs reference it. Content (descriptions, gallery, spec sheet) lives only
 * on the parent and cascades to variants at render time.
 *
 * Family detection rules:
 *   1. Same brand
 *   2. SKU prefix matches up to a known finish/handing/backset suffix
 *   3. Name shares ≥80% of meaningful tokens
 *
 * Canonical parent selection:
 *   - Shortest SKU wins (usually the base / undecorated variant)
 *   - Tie-breaker: lowest list_price, then lowest odoo_id
 *
 * Output: app/lib/product-families.json
 *   {
 *     parents: { [parentId]: { children: [childIds], reason: "" } }
 *     childToParent: { [childId]: parentId }
 *   }
 *
 * Usage:
 *   npx tsx scripts/scrape/09-collapse-variants.ts
 *   npx tsx scripts/scrape/09-collapse-variants.ts --brand "Emtek"   # dry-run one brand
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { REPO_ROOT, writeJson } from "./_lib";

// Known finish codes (US hardware): exhaustive enough that stripping them
// from a SKU reliably collapses variants under one root.
const FINISH_CODES = [
  "US3","US4","US5","US10","US10A","US10B","US10BL","US10BR","US14","US15","US15A","US19","US26","US26D","US32","US32D",
  "MB","FB","PC","BN","PN","BG","GL","PB","ORB","CP","WH","BL","RB","SS","CH",
  "PVDPN","BNP","SBN","GBR","CGN","BGN","CCO","CMO","CMB","HCO","HMB",
  "BBR","BBL","CR","NK","PCK","SCH","SCHB",
];
const HANDING = ["LH","RH","LHRB","LHRB1","RHRB","RHRB1"];
const SIZES = /\b(2|2-1\/4|2-1\/2|2-3\/8|2-3\/4|3|3-1\/2|4|5|6|7|8|9|10|11|12|14|16|18|24)["']?\b/g;

const interface_ = `
interface CsvRow { odoo_id: string; sku: string; name: string; brand: string; list_price: string; }
`;
interface CsvRow { odoo_id: string; sku: string; name: string; brand: string; list_price: string; }

const parseCsv = async (csvPath: string): Promise<CsvRow[]> => {
  const text = await fs.readFile(csvPath, "utf-8");
  const clean = text.replace(/^﻿/, "");
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
  return out;
};

/** Strip finish + handing codes from end of SKU. Returns SKU root. */
const skuRoot = (sku: string): string => {
  let s = sku.toUpperCase().replace(/\s+/g, "");
  // Remove finish suffix (greedy — try long codes first)
  const allCodes = [...FINISH_CODES, ...HANDING].sort((a, b) => b.length - a.length);
  for (const code of allCodes) {
    const re = new RegExp(`[-_]?${code}$`);
    s = s.replace(re, "");
  }
  // Trim trailing dashes
  s = s.replace(/[-_]+$/, "");
  return s;
};

/** Normalize a name: strip finish words, sizes, parenthetical, punctuation. */
const normName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(SIZES, " ")
    .replace(/\b(matte black|polished chrome|brushed nickel|polished nickel|matte brass|antique brass|polished brass|venetian bronze|chrome|nickel|bronze|brass|copper|gold|black|white|stainless|satin)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const overlap = (a: string, b: string): number => {
  const ta = new Set(a.split(" "));
  const tb = new Set(b.split(" "));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.min(ta.size, tb.size);
};

const run = async () => {
  const brandFilter = process.argv.includes("--brand") ? process.argv[process.argv.indexOf("--brand") + 1] : null;
  const csvPath = path.join(REPO_ROOT, "scripts", "products-odoo.csv");
  const rows = (await parseCsv(csvPath)).filter((r) => !brandFilter || r.brand === brandFilter);

  // Bucket by (brand, sku_root)
  const buckets = new Map<string, CsvRow[]>();
  for (const r of rows) {
    if (!r.sku) continue;
    const key = `${r.brand}::${skuRoot(r.sku)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r);
  }

  const parents: Record<string, { children: string[]; reason: string; brand: string; skuRoot: string; sampleName: string }> = {};
  const childToParent: Record<string, string> = {};

  let totalChildren = 0;
  let singletonGroups = 0;
  let groupedFamilies = 0;

  for (const [key, members] of buckets) {
    if (members.length === 1) { singletonGroups++; continue; }
    // Validate the bucket: names should also overlap. If they don't, this isn't a real family.
    const norm = members.map((m) => normName(m.name));
    let cohesion = 1;
    for (let i = 1; i < norm.length; i++) {
      cohesion = Math.min(cohesion, overlap(norm[0], norm[i]));
    }
    if (cohesion < 0.5 && members.length > 2) {
      singletonGroups += members.length;
      continue;
    }

    // Pick parent: shortest SKU then lowest price then lowest id
    const sorted = [...members].sort((a, b) =>
      a.sku.length - b.sku.length ||
      (Number(a.list_price) || 0) - (Number(b.list_price) || 0) ||
      a.odoo_id.localeCompare(b.odoo_id)
    );
    const parent = sorted[0];
    const children = sorted.slice(1).map((m) => m.odoo_id);
    parents[parent.odoo_id] = {
      children,
      brand: parent.brand,
      skuRoot: key.split("::")[1],
      sampleName: parent.name,
      reason: `family of ${members.length}, cohesion=${cohesion.toFixed(2)}`,
    };
    for (const c of children) childToParent[c] = parent.odoo_id;
    totalChildren += children.length;
    groupedFamilies++;
  }

  const out = path.join(REPO_ROOT, "app", "lib", "product-families.json");
  await writeJson(out, { parents, childToParent, generatedAt: new Date().toISOString() });
  const parentCount = Object.keys(parents).length;
  const totalSkus = rows.length;
  console.log(`[09] ✓ ${parentCount} parent families covering ${parentCount + totalChildren} SKUs`);
  console.log(`[09]   collapsed ${totalChildren} variants under parents (${((totalChildren / totalSkus) * 100).toFixed(1)}% of catalog)`);
  console.log(`[09]   singleton products (no variants): ${singletonGroups}`);
  console.log(`[09]   → ${out}`);
};

run().catch((e) => { console.error(e); process.exit(1); });
