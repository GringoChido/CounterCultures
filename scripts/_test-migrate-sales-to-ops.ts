/**
 * Counter Cultures — Pipeline Migration: Sales fulfillment/delivered → Operations
 *
 * Per redesign Phase 2 (docs/superpowers/specs/2026-04-19-dashboard-redesign-plan.md T11):
 * the Sales Pipeline now ships with 3 phases (Discovery / Design & Scope /
 * Proposal · Negotiation) via SALES_PHASES. Any deal currently in a
 * fulfillment/delivered stage that's still flagged as Sales-side needs to
 * land in the Operations Pipeline with an appropriate stage assignment.
 *
 * Dry-run by default. Pass --execute to write.
 * Pass --backup-only to write a CSV snapshot without modifying the sheet.
 *
 * Usage:
 *   npx tsx scripts/_test-migrate-sales-to-ops.ts             # dry-run
 *   npx tsx scripts/_test-migrate-sales-to-ops.ts --execute   # apply
 *   npx tsx scripts/_test-migrate-sales-to-ops.ts --backup-only
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import fs from "fs";
import path from "path";
import { google } from "googleapis";

const DRY_RUN = !process.argv.includes("--execute");
const BACKUP_ONLY = process.argv.includes("--backup-only");

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SA_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!SHEETS_ID || !SA_EMAIL || !SA_KEY) {
  console.error("Missing GOOGLE_SHEETS_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY");
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: { client_email: SA_EMAIL, private_key: SA_KEY },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

// Stages that should leave the Sales pipeline. These map to JourneyPhase
// "fulfillment" or "delivered" in app/lib/sample-dashboard-data.ts.
const SOURCE_STAGES = new Set([
  "quote-approved",
  "deposit-pending",
  "deposit-received",
  "ordering",
  "in-production",
  "shipping",
  "received",
  "delivery-scheduled",
  "delivered",
  "balance-pending",
  "complete",
  "post-delivery-issue",
  // historic synonyms
  "fulfillment",
]);

// For deals stuck in synonyms, infer a real Operations stage.
const inferOpsStage = (currentStage: string): string => {
  if (SOURCE_STAGES.has(currentStage)) return currentStage;
  if (currentStage === "fulfillment") return "ordering";
  return "ordering";
};

const colLetter = (n: number): string => {
  let s = "";
  let i = n;
  while (i >= 0) {
    s = String.fromCharCode(65 + (i % 26)) + s;
    i = Math.floor(i / 26) - 1;
  }
  return s;
};

const main = async (): Promise<void> => {
  console.log(DRY_RUN ? "🔍 DRY RUN — no writes" : "✏️  EXECUTING");

  const dealsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: "Pipeline!A:Z",
  });
  const rows = dealsRes.data.values ?? [];
  if (rows.length < 2) {
    console.log("No deals found in Pipeline sheet.");
    return;
  }
  const [header, ...dataRows] = rows;
  const stageIdx = header.indexOf("stage");
  const idIdx = header.indexOf("id");
  if (stageIdx < 0 || idIdx < 0) {
    console.error("Expected columns id + stage in header:", header);
    process.exit(1);
  }

  const affected = dataRows
    .map((r, i) => ({
      rowIndex: i + 2,
      deal: Object.fromEntries(header.map((h, k) => [h, r[k] ?? ""])) as Record<string, string>,
    }))
    .filter(({ deal }) => SOURCE_STAGES.has((deal.stage ?? "").toLowerCase()));

  console.log(`Affected deals (in fulfillment/delivered Sales stages): ${affected.length}`);

  if (affected.length === 0) {
    console.log("Nothing to migrate. Sales pipeline is already clean.");
    return;
  }

  // Backup CSV (always written)
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.resolve(process.cwd(), "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `deals-pre-migration-${ts}.csv`);
  const csv = [
    header.join(","),
    ...affected.map(({ deal }) =>
      header.map((h) => JSON.stringify(deal[h] ?? "")).join(",")
    ),
  ].join("\n");
  fs.writeFileSync(backupPath, csv);
  console.log(`✅ Backup written to ${backupPath}`);

  if (BACKUP_ONLY) {
    console.log("Backup-only mode — exiting without modification.");
    return;
  }

  for (const { rowIndex, deal } of affected) {
    const newStage = inferOpsStage(deal.stage);
    console.log(
      `  ${deal.id ?? `row-${rowIndex}`}: ${deal.stage} → ${newStage}`
    );
    if (DRY_RUN) continue;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEETS_ID,
      range: `Pipeline!${colLetter(stageIdx)}${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [[newStage]] },
    });

    // Activity_Log audit row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEETS_ID,
      range: "Activity_Log!A:I",
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            `act-mig-${Date.now()}-${deal.id ?? rowIndex}`,
            "stage_migration",
            `Migrated ${deal.id ?? rowIndex} from Sales/${deal.stage} → Operations/${newStage}`,
            deal.company ?? "",
            "system:migration-script",
            new Date().toISOString(),
            "",
            deal.id ?? "",
            "",
          ],
        ],
      },
    });
  }

  console.log(DRY_RUN ? "Dry run complete." : "✅ Migration applied.");
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
