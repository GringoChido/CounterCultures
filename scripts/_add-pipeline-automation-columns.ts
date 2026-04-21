/**
 * W7 one-shot migration (idempotent):
 *   1. Append 5 new columns to the Pipeline sheet:
 *      stage_entered_at, pending_move_to, pending_move_at,
 *      date_at_border, date_customs_cleared
 *   2. Backfill stage_entered_at = created_at for every existing data row
 *      (so SLA timers work from day 1).
 *   3. Create Deal_Events sheet (10-column audit log, mirrors Trafico_Events).
 *
 * Safe to re-run: already-present columns are skipped; already-backfilled rows
 * are left alone; existing Deal_Events sheet gets its header re-upserted.
 *
 * Verify with: npx tsx scripts/_test-pipeline-schema.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const NEW_PIPELINE_COLUMNS = [
  "stage_entered_at",
  "pending_move_to",
  "pending_move_at",
  "date_at_border",
  "date_customs_cleared",
];

const DEAL_EVENTS_HEADERS = [
  "event_id", "deal_id", "timestamp", "actor", "event_type",
  "from_stage", "to_stage", "trigger_rule_id", "payload_json",
  "reverted_event_id",
];

const colLetter = (n: number): string => {
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

const main = async () => {
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_ID env var missing");

  // -------------------------------------------------------------------------
  // 1. Pipeline: append new columns to the header + backfill stage_entered_at
  // -------------------------------------------------------------------------

  const pipelineAll = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Pipeline!A:ZZ",
  });
  const rows = pipelineAll.data.values ?? [];
  if (rows.length < 1) throw new Error("Pipeline sheet has no header row");

  const oldHeader = rows[0];
  const toAdd = NEW_PIPELINE_COLUMNS.filter((c) => !oldHeader.includes(c));
  const newHeader = [...oldHeader, ...toAdd];

  if (toAdd.length > 0) {
    console.log(`+ adding ${toAdd.length} Pipeline columns: ${toAdd.join(", ")}`);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Pipeline!A1:${colLetter(newHeader.length)}1`,
      valueInputOption: "RAW",
      requestBody: { values: [newHeader] },
    });
  } else {
    console.log(`= Pipeline: all 5 W7 columns already present`);
  }

  // Backfill stage_entered_at for every data row where it's blank
  const createdAtIdx = newHeader.indexOf("created_at");
  const stageEnteredIdx = newHeader.indexOf("stage_entered_at");
  if (createdAtIdx === -1 || stageEnteredIdx === -1) {
    throw new Error(`header indices missing: created_at=${createdAtIdx} stage_entered_at=${stageEnteredIdx}`);
  }

  const dataRows = rows.slice(1);
  let backfilled = 0;

  const padded = dataRows.map((row) => {
    const out = [...row];
    while (out.length < newHeader.length) out.push("");
    if (!out[stageEnteredIdx]) {
      out[stageEnteredIdx] = out[createdAtIdx] || new Date().toISOString();
      backfilled++;
    }
    return out;
  });

  if (dataRows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Pipeline!A2:${colLetter(newHeader.length)}${padded.length + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: padded },
    });
    console.log(`+ Pipeline rows rewritten (${padded.length} rows, ${backfilled} newly backfilled)`);
  }

  // -------------------------------------------------------------------------
  // 2. Deal_Events sheet: create if missing + upsert header
  // -------------------------------------------------------------------------

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = (meta.data.sheets ?? []).find(
    (s) => s.properties?.title === "Deal_Events"
  );
  let dealEventsSheetId: number | undefined = existing?.properties?.sheetId ?? undefined;

  if (dealEventsSheetId === undefined) {
    console.log(`+ create tab "Deal_Events"`);
    const r = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "Deal_Events" } } }],
      },
    });
    dealEventsSheetId = r.data.replies?.[0]?.addSheet?.properties?.sheetId ?? undefined;
    if (dealEventsSheetId === undefined) throw new Error("addSheet for Deal_Events returned no sheetId");
  } else {
    console.log(`= tab "Deal_Events" exists (sheetId ${dealEventsSheetId})`);
  }

  const lastCol = colLetter(DEAL_EVENTS_HEADERS.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Deal_Events!A1:${lastCol}1`,
    valueInputOption: "RAW",
    requestBody: { values: [DEAL_EVENTS_HEADERS] },
  });
  console.log(`  Deal_Events headers written (${DEAL_EVENTS_HEADERS.length} cols, A1:${lastCol}1)`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        repeatCell: {
          range: { sheetId: dealEventsSheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: { userEnteredFormat: { textFormat: { bold: true } } },
          fields: "userEnteredFormat.textFormat.bold",
        },
      }],
    },
  });

  console.log("\n✅ W7 schema migration complete.");
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
