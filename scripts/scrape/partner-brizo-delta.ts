/**
 * Partner scraper — Brizo + Delta.
 *
 * Both brands publish spec sheets at media.deltafaucet.com/SpecSheet/<NAME>.pdf.
 * Many of those URLs are ALREADY embedded in our Odoo description column —
 * step 04-extract-spec-urls.ts handles those.
 *
 * This script handles the *remainder*: Brizo/Delta SKUs that have no embedded
 * URL. We synthesize a candidate URL from the SKU using the known patterns:
 *
 *   Brizo: BRI-<sku> → media.deltafaucet.com/SpecSheet/BSP-<series>-<sku>.pdf
 *   Delta:           → media.deltafaucet.com/SpecSheet/DSP-<sku>.pdf
 *
 * Patterns vary by series; this script tries a small candidate set and keeps
 * whichever returns HTTP 200.
 *
 * Output: staging/specs-by-pattern.json (one row per attempt)
 *         public/specs/odoo/<odoo_id>.pdf (downloaded successes)
 *
 * Usage:
 *   npx tsx scripts/scrape/partner-brizo-delta.ts
 *   npx tsx scripts/scrape/partner-brizo-delta.ts --dry-run
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { REPO_ROOT, STAGING, PUBLIC_SPECS, exists, pool, downloadBinary, writeJson, readJson } from "./_lib";

interface AttemptResult {
  odoo_id: string;
  sku: string;
  brand: string;
  name: string;
  url: string;
  status: "found" | "404" | "skipped-exists" | "failed";
  bytes?: number;
}

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

const brizoCandidates = (sku: string): string[] => {
  // Brizo SKUs in our CSV often have shape: "BRI- 62525LF-RB"
  // Normalize → "62525LF" (drop dash-finish suffix).
  const cleaned = sku.replace(/^BRI[\s-]*/i, "").trim();
  const base = cleaned.replace(/[\s-]*[A-Z0-9]{1,4}$/i, "");
  const urls = new Set<string>();
  urls.add(`https://media.deltafaucet.com/SpecSheet/BSP-K-${base}.pdf`);
  urls.add(`https://media.deltafaucet.com/SpecSheet/BSP-K-${cleaned}.pdf`);
  urls.add(`https://media.deltafaucet.com/SpecSheet/BSP-${base}.pdf`);
  urls.add(`https://media.deltafaucet.com/SpecSheet/BSP-${cleaned}.pdf`);
  // Capitalization variants
  urls.add(`https://media.deltafaucet.com/SpecSheet/BSP-K-${base}%20Rev%20A.pdf`);
  return [...urls];
};

const deltaCandidates = (sku: string): string[] => {
  const cleaned = sku.replace(/^DEL[\s-]*/i, "").trim();
  const base = cleaned.replace(/[\s-]*[A-Z0-9]{1,4}$/i, "");
  const urls = new Set<string>();
  urls.add(`https://media.deltafaucet.com/SpecSheet/DSP-${base}.pdf`);
  urls.add(`https://media.deltafaucet.com/SpecSheet/DSP-${cleaned}.pdf`);
  return [...urls];
};

const headOk = async (url: string): Promise<boolean> => {
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": "CC-AssetMigration/1.0" } });
    return res.ok;
  } catch { return false; }
};

const run = async () => {
  const dryRun = process.argv.includes("--dry-run");
  const csvPath = path.join(REPO_ROOT, "scripts", "products-odoo.csv");
  const rows = await parseCsv(csvPath);

  // Filter to Brizo/Delta SKUs that don't already have a spec URL recovered.
  const knownSpecs = (await exists(path.join(STAGING, "spec-urls.json")))
    ? await readJson<Array<{ odoo_id: string }>>(path.join(STAGING, "spec-urls.json"))
    : [];
  const known = new Set(knownSpecs.map((s) => s.odoo_id));

  const targets = rows.filter((r) =>
    (r.brand === "Brizo" || r.brand === "Delta") &&
    !known.has(r.odoo_id) &&
    r.sku
  );
  console.log(`[brizo/delta] ${targets.length} targets (Brizo/Delta SKUs without an existing spec URL)`);

  const results: AttemptResult[] = [];
  await pool(targets, 3, async (r) => {
    const candidates = r.brand === "Brizo" ? brizoCandidates(r.sku) : deltaCandidates(r.sku);
    let hit: string | null = null;
    for (const url of candidates) {
      if (await headOk(url)) { hit = url; break; }
    }
    if (!hit) {
      results.push({ odoo_id: r.odoo_id, sku: r.sku, brand: r.brand, name: r.name, url: candidates[0], status: "404" });
      return;
    }
    if (dryRun) {
      results.push({ odoo_id: r.odoo_id, sku: r.sku, brand: r.brand, name: r.name, url: hit, status: "found" });
      return;
    }
    const dest = path.join(PUBLIC_SPECS, "odoo", `${r.odoo_id}.pdf`);
    if (await exists(dest)) {
      results.push({ odoo_id: r.odoo_id, sku: r.sku, brand: r.brand, name: r.name, url: hit, status: "skipped-exists" });
      return;
    }
    try {
      const bytes = await downloadBinary(hit, dest, { maxBytes: 50 * 1024 * 1024 });
      results.push({ odoo_id: r.odoo_id, sku: r.sku, brand: r.brand, name: r.name, url: hit, status: "found", bytes });
    } catch {
      results.push({ odoo_id: r.odoo_id, sku: r.sku, brand: r.brand, name: r.name, url: hit, status: "failed" });
    }
  });

  await writeJson(path.join(STAGING, "specs-by-pattern.json"), results);
  const found = results.filter((r) => r.status === "found").length;
  console.log(`[brizo/delta] ✓ found=${found} / ${results.length} (results in staging/specs-by-pattern.json)`);
};

run().catch((e) => { console.error(e); process.exit(1); });
