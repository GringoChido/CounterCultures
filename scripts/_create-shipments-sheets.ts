/**
 * Idempotent creator: scaffolds the 5 W5 sheets in the CRM Sheet (creates
 * tabs if missing, upserts header rows, bolds row 1). Safe to re-run.
 *
 * Run: npx tsx scripts/_create-shipments-sheets.ts
 *
 * Verify with: npx tsx scripts/_test-shipments-sheets.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const HEADERS: Record<string, string[]> = {
  Brand_NOM_Status: [
    "brand_slug", "nom_code", "status", "applies_to_skus", "cert_drive_folder_id",
    "last_verified_date", "expires_date", "notes", "updated_by", "updated_at",
  ],
  Brand_Lead_Times: [
    "brand_slug", "production_days", "transit_sea_days", "transit_air_days",
    "transit_truck_days", "customs_avg_days", "domestic_avg_days",
    "last_verified_date", "notes", "updated_by", "updated_at",
  ],
  HS_Code_Lookup: [
    "category_slug", "display_name_en", "display_name_es", "hs_code",
    "hs_code_prefix_6", "nom_codes", "ieps_applies", "default_duty_rate_mfn",
    "notes", "updated_by", "updated_at",
  ],
  FTA_Rates: [
    "fta_code", "origin_country", "hs_code_prefix", "preferential_rate",
    "effective_from", "effective_until", "source", "notes", "updated_by", "updated_at",
  ],
  Trafico_Events: [
    "event_id", "trafico_id", "timestamp", "actor", "event_type",
    "from_status", "to_status", "doc_key", "doc_drive_id", "amount_mxn",
    "delay_reason", "alert_channel", "message",
  ],
};

// Convert a 1-based column number to a Sheets letter (1→A, 26→Z, 27→AA…)
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

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const titleToId = new Map<string, number>();
  for (const s of meta.data.sheets ?? []) {
    if (s.properties?.title && s.properties.sheetId !== undefined && s.properties.sheetId !== null) {
      titleToId.set(s.properties.title, s.properties.sheetId);
    }
  }

  for (const [title, headers] of Object.entries(HEADERS)) {
    let sheetId = titleToId.get(title);
    if (sheetId === undefined) {
      console.log(`+ create tab "${title}"`);
      const r = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title } } }] },
      });
      sheetId = r.data.replies?.[0]?.addSheet?.properties?.sheetId ?? undefined;
      if (sheetId === undefined) throw new Error(`addSheet for ${title} returned no sheetId`);
    } else {
      console.log(`= tab "${title}" exists (sheetId ${sheetId})`);
    }

    // Upsert header row (idempotent overwrite)
    const lastCol = colLetter(headers.length);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${title}!A1:${lastCol}1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
    console.log(`  headers written (${headers.length} cols, A1:${lastCol}1)`);

    // Bold the header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: "userEnteredFormat.textFormat.bold",
          },
        }],
      },
    });
  }
  console.log("\n✅ Done — all 5 tabs scaffolded.");
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
