/**
 * Step 8 — Ingest Roger's human-reviewed match map and regenerate
 *          app/lib/product-content.json with confirmed pairings.
 *
 * Reads docs/audit/CC-Match-Review.xlsx (the file produced by step 07,
 * with the "Roger's Pick" column filled). For every row where the pick
 * is set, overwrite the matched odoo_id in staging/cc-mx/match-map.json,
 * then rerun step 06 in-process.
 *
 * Usage:
 *   npx tsx scripts/scrape/08-merge-reviewed.ts
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { REPO_ROOT, STAGING, readJson, writeJson, exists } from "./_lib";

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
  const xlsx = await import("xlsx");
  const reviewPath = path.join(REPO_ROOT, "docs", "audit", "CC-Match-Review.xlsx");
  if (!(await exists(reviewPath))) {
    console.error(`[08] Missing ${reviewPath}. Run step 07 first.`);
    process.exit(1);
  }

  const wb = xlsx.readFile(reviewPath);
  const sheet = wb.Sheets["Review"];
  if (!sheet) { console.error(`[08] No "Review" sheet found.`); process.exit(1); }
  const rows = xlsx.utils.sheet_to_json<Record<string, string>>(sheet);

  const matchPath = path.join(STAGING, "cc-mx", "match-map.json");
  const matches = await readJson<Match[]>(matchPath);
  const bySlug = new Map(matches.map((m) => [m.slug, m]));

  const pickKey = "✅ Roger's Pick (Odoo ID)";
  let updated = 0;
  let cleared = 0;
  for (const r of rows) {
    const slug = r["Legacy Slug"];
    if (!slug) continue;
    const pick = (r[pickKey] ?? "").toString().trim();
    if (!pick) continue;
    const m = bySlug.get(slug);
    if (!m) continue;
    if (pick === "-" || pick.toLowerCase() === "skip" || pick.toLowerCase() === "none") {
      m.odoo_id = null;
      m.confidence = 0;
      m.flags = [...new Set([...m.flags, "manually-skipped"])];
      cleared++;
      continue;
    }
    if (m.odoo_id !== pick) {
      m.odoo_id = pick;
      m.confidence = 1.0;
      m.flags = [...new Set([...m.flags, "manually-confirmed"])];
      updated++;
    }
  }

  await writeJson(matchPath, matches);
  console.log(`[08] ✓ updated=${updated} cleared=${cleared} (in ${matchPath})`);
  console.log(`[08]   Next: rerun npx tsx scripts/scrape/06-build-product-content.ts`);
};

run().catch((e) => { console.error(e); process.exit(1); });
