/**
 * Step 7 — Emit a human-review XLSX so Roger (or anyone who knows the
 *          products by sight) can confirm slug ↔ Odoo SKU pairings the
 *          fuzzy matcher couldn't resolve confidently.
 *
 * The matcher in step 05 reaches ~20% high confidence — Spanish marketing
 * titles on the legacy site don't share enough tokens with English technical
 * names in Odoo for pure NLP matching. So we surface the work for a human:
 *
 *   - Each scraped CC.mx slug → row
 *   - Columns: legacy URL, scraped title, current best guess, alt 1-3
 *   - One "Roger Pick" column with a dropdown (free text accepted)
 *   - Coverage formula at the top so it's obvious how much is left
 *
 * Output: docs/audit/CC-Match-Review.xlsx
 *
 * Once Roger fills the Pick column, run scripts/scrape/08-merge-reviewed.ts
 * to ingest into product-content.json.
 *
 * Usage:
 *   npx tsx scripts/scrape/07-emit-review-xlsx.ts
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { REPO_ROOT, STAGING, readJson, exists } from "./_lib";

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

const run = async () => {
  const matchPath = path.join(STAGING, "cc-mx", "match-map.json");
  if (!(await exists(matchPath))) {
    console.error(`[07] Missing ${matchPath}. Run step 05 first.`);
    process.exit(1);
  }
  const matches = await readJson<Match[]>(matchPath);

  // Use the project's xlsx dep (already in package.json) — no shelling out.
  // We use XLSX rather than openpyxl because it's a pure-JS dep and keeps
  // this script Node-only.
  const xlsx = await import("xlsx");

  // Sheet 1: REVIEW (one row per scraped slug)
  const reviewRows: Array<Record<string, string | number>> = [];
  for (const m of matches) {
    reviewRows.push({
      "Legacy Slug": m.slug,
      "Scraped Title": m.title,
      "Legacy URL": `https://www.countercultures.com.mx/productos/p/${m.slug}`,
      "Auto-Match Odoo ID": m.odoo_id ?? "",
      "Auto-Match SKU": m.sku ?? "",
      "Auto-Match Brand": m.brand ?? "",
      "Auto Confidence": Number(m.confidence.toFixed(2)),
      "Alt 1": m.alts[0] ? `${m.alts[0].sku} (${m.alts[0].brand}, ${m.alts[0].confidence.toFixed(2)})` : "",
      "Alt 2": m.alts[1] ? `${m.alts[1].sku} (${m.alts[1].brand}, ${m.alts[1].confidence.toFixed(2)})` : "",
      "Alt 3": m.alts[2] ? `${m.alts[2].sku} (${m.alts[2].brand}, ${m.alts[2].confidence.toFixed(2)})` : "",
      "✅ Roger's Pick (Odoo ID)": "",
      "Notes": "",
      "Flags": m.flags.join(", "),
    });
  }

  // Sheet 2: SUMMARY
  const summary: Array<Record<string, string | number>> = [
    { Metric: "Total scraped slugs", Value: matches.length, Notes: "From staging/cc-mx/sitemap.json" },
    { Metric: "Auto-matched high-confidence (≥0.45)", Value: matches.filter((m) => m.confidence >= 0.45).length, Notes: "Trusted; in product-content.json" },
    { Metric: "Auto-matched low-confidence (0.30-0.44)", Value: matches.filter((m) => m.confidence >= 0.30 && m.confidence < 0.45).length, Notes: "Verify in Review sheet" },
    { Metric: "Below threshold (<0.30)", Value: matches.filter((m) => m.confidence < 0.30).length, Notes: "Roger picks manually" },
    { Metric: "No candidate", Value: matches.filter((m) => !m.odoo_id).length, Notes: "Brand guess failed — manual" },
  ];

  const wb = xlsx.utils.book_new();
  const reviewSheet = xlsx.utils.json_to_sheet(reviewRows);
  reviewSheet["!cols"] = [
    { wch: 40 }, { wch: 60 }, { wch: 60 }, { wch: 14 }, { wch: 22 }, { wch: 22 },
    { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 24 }, { wch: 30 }, { wch: 20 },
  ];
  reviewSheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  xlsx.utils.book_append_sheet(wb, reviewSheet, "Review");

  const summarySheet = xlsx.utils.json_to_sheet(summary);
  summarySheet["!cols"] = [{ wch: 40 }, { wch: 12 }, { wch: 50 }];
  xlsx.utils.book_append_sheet(wb, summarySheet, "Summary");

  const outDir = path.join(REPO_ROOT, "docs", "audit");
  await fs.mkdir(outDir, { recursive: true });
  const out = path.join(outDir, "CC-Match-Review.xlsx");
  xlsx.writeFile(wb, out);
  console.log(`[07] ✓ ${reviewRows.length} rows → ${out}`);
  console.log(`[07]   Roger fills "Roger's Pick" column; then run 08-merge-reviewed.ts`);
};

run().catch((e) => { console.error(e); process.exit(1); });
