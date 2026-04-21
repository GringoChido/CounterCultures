/**
 * RED/verify test for W7 Pipeline schema migration + Deal_Events sheet.
 *
 *   - Asserts the Pipeline sheet has the 5 new W7 columns
 *   - Asserts stage_entered_at is backfilled for all existing rows
 *   - Asserts Deal_Events sheet exists with the 10-column header
 *
 * Run: npx tsx scripts/_test-pipeline-schema.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const PIPELINE_REQUIRED_COLUMNS = [
  "id", "name", "company", "stage", "value", "probability",
  "expected_close", "owner", "source", "created_at", "notes",
  "brand_slugs", "source_message_id",
  // W7 additions
  "stage_entered_at", "pending_move_to", "pending_move_at",
  "date_at_border", "date_customs_cleared",
];

const DEAL_EVENTS_HEADERS = [
  "event_id", "deal_id", "timestamp", "actor", "event_type",
  "from_stage", "to_stage", "trigger_rule_id", "payload_json",
  "reverted_event_id",
];

const main = async () => {
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_ID env var missing");

  let failed = false;

  // ------ Pipeline header + backfill ------
  const pipelineResp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Pipeline!A:ZZ",
  });
  const rows = pipelineResp.data.values ?? [];
  if (rows.length < 1) {
    console.error("❌ Pipeline sheet has no header row");
    process.exit(1);
  }
  const pipelineHeader = rows[0];
  const missing = PIPELINE_REQUIRED_COLUMNS.filter((c) => !pipelineHeader.includes(c));
  if (missing.length > 0) {
    console.error(`❌ Pipeline missing columns: ${missing.join(", ")}`);
    failed = true;
  } else {
    console.log(`✓ Pipeline has all ${PIPELINE_REQUIRED_COLUMNS.length} required columns`);
  }

  if (rows.length > 1) {
    const stageEnteredIdx = pipelineHeader.indexOf("stage_entered_at");
    const dataRows = rows.slice(1);
    const missingBackfill = dataRows.filter((r) => !(r[stageEnteredIdx]?.length > 0)).length;
    if (missingBackfill > 0) {
      console.error(`❌ Pipeline: ${missingBackfill}/${dataRows.length} rows missing stage_entered_at`);
      failed = true;
    } else {
      console.log(`✓ Pipeline: stage_entered_at backfilled on all ${dataRows.length} rows`);
    }
  } else {
    console.log(`✓ Pipeline: no data rows (backfill trivially satisfied)`);
  }

  // ------ Deal_Events sheet + header ------
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Deal_Events!1:1",
    });
    const header = r.data.values?.[0] ?? [];
    const missingHeaders = DEAL_EVENTS_HEADERS.filter((h) => !header.includes(h));
    if (missingHeaders.length > 0) {
      console.error(`❌ Deal_Events missing headers: ${missingHeaders.join(", ")}`);
      failed = true;
    } else {
      console.log(`✓ Deal_Events has all ${DEAL_EVENTS_HEADERS.length} headers`);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unable to parse range") || msg.includes("not found")) {
      console.error(`❌ Deal_Events sheet does not exist`);
      failed = true;
    } else {
      throw e;
    }
  }

  if (failed) process.exit(1);
  console.log("\n✅ Pipeline schema + Deal_Events schema OK");
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
