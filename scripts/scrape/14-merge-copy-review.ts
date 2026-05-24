/**
 * Step 14 — Merge approved copy from the review XLSX into the live sidecar.
 *
 * This is the ONLY script allowed to promote AI-drafted copy into
 * app/lib/product-content.json. It reads docs/audit/CC-Copy-Review.xlsx
 * and, for every row where the "Approve?" column is non-empty and not
 * "skip" / "-" / "none", writes the Final ES / Final EN values into the
 * live sidecar with descriptionSource: "human".
 *
 * Never overwrites an entry already marked "human" unless the row
 * explicitly re-approves it.
 *
 * Usage:
 *   npx tsx scripts/scrape/14-merge-copy-review.ts
 *   npx tsx scripts/scrape/14-merge-copy-review.ts --dry-run   # preview without writing
 */
import * as path from "node:path";
import { REPO_ROOT, readJson, writeJson, exists } from "./_lib";

const run = async () => {
  const xlsxMod = await import("xlsx");
  const xlsx = xlsxMod.default ?? xlsxMod;
  const dryRun = process.argv.includes("--dry-run");

  const reviewPath = path.join(REPO_ROOT, "docs", "audit", "CC-Copy-Review.xlsx");
  if (!(await exists(reviewPath))) {
    console.error(`[14] Missing ${reviewPath}. Run step 13 first.`);
    process.exit(1);
  }

  const liveContentPath = path.join(REPO_ROOT, "app", "lib", "product-content.json");
  const productContent: Record<string, any> = (await exists(liveContentPath))
    ? await readJson(liveContentPath) : {};

  const wb = xlsx.readFile(reviewPath);
  const sheet = wb.Sheets["Copy Review"];
  if (!sheet) {
    console.error('[14] "Copy Review" sheet not found in the xlsx.');
    process.exit(1);
  }

  const rows = xlsx.utils.sheet_to_json<Record<string, string>>(sheet);
  const SKIP_VALUES = new Set(["", "skip", "-", "none", "no", "n"]);

  let merged = 0;
  let skipped = 0;
  let alreadyHuman = 0;

  for (const row of rows) {
    const odooId = String(row["Odoo ID"] ?? "").trim();
    const approve = String(row["✅ Approve? (Y / edit)"] ?? "").trim().toLowerCase();

    if (!odooId || SKIP_VALUES.has(approve)) {
      skipped++;
      continue;
    }

    // Never overwrite human-reviewed copy unless explicitly re-approved
    const existing = productContent[odooId];
    if (existing?.descriptionSource === "human" && approve !== "y" && approve !== "yes") {
      alreadyHuman++;
      skipped++;
      continue;
    }

    const finalEs = String(row["Final ES (edit here)"] ?? "").trim();
    const finalEn = String(row["Final EN (edit here)"] ?? "").trim();
    const featuresEsRaw = String(row["Features ES"] ?? "").trim();
    const featuresEnRaw = String(row["Features EN"] ?? "").trim();

    if (!finalEs && !finalEn) {
      skipped++;
      continue;
    }

    // Parse pipe-separated features back into arrays
    const featuresEs = featuresEsRaw ? featuresEsRaw.split("|").map((s) => s.trim()).filter(Boolean) : [];
    const featuresEn = featuresEnRaw ? featuresEnRaw.split("|").map((s) => s.trim()).filter(Boolean) : [];

    const entry = productContent[odooId] ?? {
      legacySlug: "", legacyUrl: "", title: "", features: [], gallery: [],
      variants: [], breadcrumb: [], updatedAt: new Date().toISOString(), matchConfidence: 0,
    };

    if (finalEs) entry.descriptionEs = finalEs;
    if (finalEn) entry.descriptionEn = finalEn;
    if (featuresEs.length > 0) entry.featuresEs = featuresEs;
    if (featuresEn.length > 0) entry.featuresEn = featuresEn;
    entry.descriptionSource = "human";
    entry.reviewedAt = new Date().toISOString();
    entry.updatedAt = new Date().toISOString();

    productContent[odooId] = entry;
    merged++;
  }

  if (dryRun) {
    console.log(`[14] DRY RUN — would merge=${merged} skipped=${skipped} (${alreadyHuman} already human)`);
  } else {
    await writeJson(liveContentPath, productContent);
    console.log(`[14] ✓ merged=${merged} skipped=${skipped} (${alreadyHuman} already human)`);
    console.log(`[14]   → ${liveContentPath}`);
    console.log(`[14]   Next: run 12-final-audit.ts to see updated coverage numbers`);
  }
};

run().catch((e) => { console.error(e); process.exit(1); });
