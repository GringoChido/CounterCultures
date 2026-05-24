/**
 * Step 13 — Emit a human-review XLSX for AI-drafted product descriptions.
 *
 * Inputs:
 *   1. staging/ai-descriptions-draft.json — new drafts from step 10 (staged mode)
 *   2. app/lib/product-content.json entries where descriptionSource === "ai"
 *      (the 570 already-live AI drafts that were published without review)
 *
 * Output: docs/audit/CC-Copy-Review.xlsx
 *   Sheet "Copy Review" — one row per product, reviewer edits in place
 *   Sheet "Summary"     — counts by brand and total awaiting review
 *
 * Usage:
 *   npx tsx scripts/scrape/13-emit-copy-review-xlsx.ts                  # all
 *   npx tsx scripts/scrape/13-emit-copy-review-xlsx.ts --brand "Emtek"  # one brand
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { REPO_ROOT, STAGING, readJson, exists } from "./_lib";

const arg = (name: string, fallback?: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? fallback : process.argv[i + 1];
};

interface DraftEntry {
  odoo_id?: string;
  sku?: string;
  brand?: string;
  descriptionEs?: string;
  descriptionEn?: string;
  featuresEs?: string[];
  featuresEn?: string[];
  descriptionSource?: string;
  modelUsed?: string;
  generatedAt?: string;
  name?: string;
}

const run = async () => {
  const xlsxMod = await import("xlsx");
  const xlsx = xlsxMod.default ?? xlsxMod;
  const brandFilter = arg("brand", "");

  const stagingPath = path.join(STAGING, "ai-descriptions-draft.json");
  const liveContentPath = path.join(REPO_ROOT, "app", "lib", "product-content.json");

  const stagingDrafts: Record<string, DraftEntry> = (await exists(stagingPath))
    ? await readJson(stagingPath) : {};
  const liveContent: Record<string, DraftEntry> = (await exists(liveContentPath))
    ? await readJson(liveContentPath) : {};

  // Load CSV for name lookup (product-content.json doesn't always store name)
  const csvPath = path.join(REPO_ROOT, "scripts", "products-odoo.csv");
  const csvText = await fs.readFile(csvPath, "utf-8");
  const csvClean = csvText.replace(/^﻿/, "");
  const csvLines = csvClean.split("\n");
  const csvHeader = csvLines[0].split(",");
  const nameIdx = csvHeader.indexOf("name");
  const idIdx = csvHeader.indexOf("odoo_id");
  const nameMap = new Map<string, string>();
  for (let i = 1; i < csvLines.length; i++) {
    const parts = csvLines[i].split(",");
    if (parts[idIdx]) nameMap.set(parts[idIdx], parts[nameIdx] ?? "");
  }

  // Collect all entries needing review
  interface ReviewRow {
    odooId: string;
    sku: string;
    brand: string;
    name: string;
    source: "ai-staged" | "ai-live";
    draftEs: string;
    draftEn: string;
    featuresEs: string;
    featuresEn: string;
  }

  const rows: ReviewRow[] = [];
  const seen = new Set<string>();

  // 1. Staged drafts (new from step 10)
  for (const [id, entry] of Object.entries(stagingDrafts)) {
    if (brandFilter && entry.brand !== brandFilter) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({
      odooId: id,
      sku: entry.sku ?? "",
      brand: entry.brand ?? "",
      name: nameMap.get(id) ?? entry.name ?? "",
      source: "ai-staged",
      draftEs: entry.descriptionEs ?? "",
      draftEn: entry.descriptionEn ?? "",
      featuresEs: (entry.featuresEs ?? []).join(" | "),
      featuresEn: (entry.featuresEn ?? []).join(" | "),
    });
  }

  // 2. Already-live AI entries in product-content.json
  for (const [id, entry] of Object.entries(liveContent)) {
    if (entry.descriptionSource !== "ai") continue;
    if (brandFilter && entry.brand !== brandFilter) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({
      odooId: id,
      sku: entry.sku ?? "",
      brand: entry.brand ?? "",
      name: nameMap.get(id) ?? entry.name ?? "",
      source: "ai-live",
      draftEs: entry.descriptionEs ?? "",
      draftEn: entry.descriptionEn ?? "",
      featuresEs: (entry.featuresEs ?? []).join(" | "),
      featuresEn: (entry.featuresEn ?? []).join(" | "),
    });
  }

  if (rows.length === 0) {
    console.log("[13] No AI-drafted entries found to review.");
    process.exit(0);
  }

  // Sort by brand → SKU for review convenience
  rows.sort((a, b) => a.brand.localeCompare(b.brand) || a.sku.localeCompare(b.sku));

  // Build xlsx rows
  const sheetRows = rows.map((r) => ({
    "Odoo ID": r.odooId,
    "SKU": r.sku,
    "Brand": r.brand,
    "Name": r.name,
    "Source": r.source,
    "Draft ES": r.draftEs,
    "Draft EN": r.draftEn,
    "Features ES": r.featuresEs,
    "Features EN": r.featuresEn,
    "✅ Approve? (Y / edit)": "",
    "Final ES (edit here)": r.draftEs,
    "Final EN (edit here)": r.draftEn,
    "Notes": "",
  }));

  // Summary sheet — counts by brand
  const brandCounts = new Map<string, { staged: number; live: number }>();
  for (const r of rows) {
    const e = brandCounts.get(r.brand) ?? { staged: 0, live: 0 };
    if (r.source === "ai-staged") e.staged++;
    else e.live++;
    brandCounts.set(r.brand, e);
  }
  const summaryRows = [
    { Metric: "Total entries awaiting review", Count: rows.length, Notes: "" },
    { Metric: "New staged drafts (step 10)", Count: rows.filter((r) => r.source === "ai-staged").length, Notes: "From staging/ai-descriptions-draft.json" },
    { Metric: "Already-live AI entries (need retroactive review)", Count: rows.filter((r) => r.source === "ai-live").length, Notes: "Currently published without review" },
    { Metric: "", Count: "", Notes: "" },
    ...[...brandCounts.entries()]
      .sort((a, b) => (b[1].staged + b[1].live) - (a[1].staged + a[1].live))
      .map(([brand, c]) => ({
        Metric: brand,
        Count: c.staged + c.live,
        Notes: `staged=${c.staged} live-ai=${c.live}`,
      })),
  ];

  const wb = xlsx.utils.book_new();

  const reviewSheet = xlsx.utils.json_to_sheet(sheetRows);
  reviewSheet["!cols"] = [
    { wch: 10 },  // Odoo ID
    { wch: 24 },  // SKU
    { wch: 24 },  // Brand
    { wch: 40 },  // Name
    { wch: 12 },  // Source
    { wch: 60 },  // Draft ES
    { wch: 60 },  // Draft EN
    { wch: 50 },  // Features ES
    { wch: 50 },  // Features EN
    { wch: 18 },  // Approve?
    { wch: 60 },  // Final ES
    { wch: 60 },  // Final EN
    { wch: 30 },  // Notes
  ];
  reviewSheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  xlsx.utils.book_append_sheet(wb, reviewSheet, "Copy Review");

  const summarySheet = xlsx.utils.json_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 50 }, { wch: 12 }, { wch: 40 }];
  xlsx.utils.book_append_sheet(wb, summarySheet, "Summary");

  const outDir = path.join(REPO_ROOT, "docs", "audit");
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "CC-Copy-Review.xlsx");
  xlsx.writeFile(wb, outPath);

  console.log(`[13] ✓ ${rows.length} entries → ${outPath}`);
  console.log(`[13]   ${rows.filter((r) => r.source === "ai-staged").length} new staged + ${rows.filter((r) => r.source === "ai-live").length} already-live AI`);
  console.log(`[13]   Reviewer fills "Approve?" column (Y to approve), edits "Final ES"/"Final EN" as needed.`);
  console.log(`[13]   Then run: npx tsx scripts/scrape/14-merge-copy-review.ts`);
};

run().catch((e) => { console.error(e); process.exit(1); });
