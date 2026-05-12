/**
 * Step 4 — Extract spec sheet PDF URLs already embedded in Odoo descriptions
 *          and download the PDFs to public/specs/odoo/<odoo_id>.pdf.
 *
 * Brizo/Delta SKUs already carry a manufacturer spec sheet URL inside the
 * `description` column of scripts/products-odoo.csv. We don't need to scrape
 * anything to recover these — just regex over the CSV.
 *
 * Output:
 *   public/specs/odoo/<odoo_id>.pdf  — actual PDF files
 *   staging/spec-urls.json           — { odoo_id, sku, url, status }
 *
 * Usage:
 *   npx tsx scripts/scrape/04-extract-spec-urls.ts            # extract + download
 *   npx tsx scripts/scrape/04-extract-spec-urls.ts --no-download  # just list URLs
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import {
  REPO_ROOT,
  STAGING,
  PUBLIC_SPECS,
  exists,
  pool,
  downloadBinary,
  writeJson,
} from "./_lib";

interface SpecEntry {
  odoo_id: string;
  sku: string;
  brand: string;
  name: string;
  url: string;
  status: "pending" | "downloaded" | "skipped-exists" | "failed";
  bytes?: number;
  error?: string;
}

// Liberal URL matcher — handles spaces in PDF filenames (common in deltafaucet URLs).
const SPEC_URL_RE = /https?:\/\/[^\s)\]<>]+(?:Spec[A-Za-z]*\.pdf|\.pdf)/gi;

const parseCsv = async (csvPath: string): Promise<Array<Record<string, string>>> => {
  const text = await fs.readFile(csvPath, "utf-8");
  // Strip BOM
  const clean = text.replace(/^﻿/, "");
  const rows: Array<Record<string, string>> = [];
  let header: string[] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => {
    if (!header.length) {
      header = row;
    } else if (row.some((c) => c !== "")) {
      const o: Record<string, string> = {};
      for (let k = 0; k < header.length; k++) o[header[k]] = row[k] ?? "";
      rows.push(o);
    }
    row = [];
  };
  while (i < clean.length) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
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
  const noDownload = process.argv.includes("--no-download");
  const csvPath = path.join(REPO_ROOT, "scripts", "products-odoo.csv");
  if (!(await exists(csvPath))) {
    console.error(`[04] CSV not found: ${csvPath}`);
    process.exit(1);
  }
  const rows = await parseCsv(csvPath);
  console.log(`[04] Parsed ${rows.length} rows from products-odoo.csv`);

  // Find URLs in descriptions
  const candidates: SpecEntry[] = [];
  for (const r of rows) {
    const matches = (r.description ?? "").match(SPEC_URL_RE);
    if (!matches) continue;
    // First match wins; remainder logged in a comment
    const url = matches[0].trim().replace(/[.,;:]+$/, "");
    candidates.push({
      odoo_id: r.odoo_id ?? "",
      sku: r.sku ?? "",
      brand: r.brand ?? "",
      name: r.name ?? "",
      url,
      status: "pending",
    });
  }
  console.log(`[04] ${candidates.length} products carry a spec URL.`);

  if (noDownload) {
    await writeJson(path.join(STAGING, "spec-urls.json"), candidates);
    console.log(`[04] List-only mode. → ${path.join(STAGING, "spec-urls.json")}`);
    return;
  }

  let dl = 0, sk = 0, fail = 0;
  await pool(candidates, 4, async (e) => {
    const dest = path.join(PUBLIC_SPECS, "odoo", `${e.odoo_id}.pdf`);
    if (await exists(dest)) { e.status = "skipped-exists"; sk++; return; }
    try {
      const bytes = await downloadBinary(e.url, dest, { maxBytes: 50 * 1024 * 1024 });
      e.status = "downloaded";
      e.bytes = bytes;
      dl++;
      if ((dl + sk + fail) % 25 === 0) console.log(`[04]   …downloaded=${dl} skipped=${sk} failed=${fail}`);
    } catch (err) {
      e.status = "failed";
      e.error = err instanceof Error ? err.message : String(err);
      fail++;
    }
  });

  await writeJson(path.join(STAGING, "spec-urls.json"), candidates);
  console.log(`[04] ✓ downloaded=${dl} skipped=${sk} failed=${fail} (total=${candidates.length})`);
};

run().catch((e) => {
  console.error("[04] FAILED:", e);
  process.exit(1);
});
