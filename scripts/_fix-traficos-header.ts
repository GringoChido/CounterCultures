/**
 * One-shot: add the missing header row to the Traficos sheet so
 * findRowIndex (which assumes row 0 = headers) actually works.
 *
 * Pre-existing bug surfaced during W5 implementation — the Traficos PUT
 * route has been silently broken since the sheet was first appended to
 * with no header. After this script runs, PUT works correctly.
 *
 * Behavior:
 *   - If row 1 already matches TRAFICO_COLUMNS exactly → no-op
 *   - Otherwise, insert a new row 1 (push existing data down) and write
 *     the header
 *
 * Run: npx tsx scripts/_fix-traficos-header.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const TRAFICO_COLUMNS = [
  "TRF_ID", "Trafico_Number", "Pedimento_Number", "Status",
  "Broker_Name", "Broker_Email", "Crossing_Agent",
  "Warehouse_Name", "Warehouse_Address",
  "Invoice_Value_USD", "Exchange_Rate", "Customs_Value_MXN",
  "Calculo_Total_MXN", "Calculo_Breakdown_JSON", "Calculo_Drive_ID",
  "Truck_Crossing_Fee", "Truck_Fee_Payee",
  "Calculo_Payment_JSON", "Truck_Payment_JSON",
  "Total_Import_Cost",
  "Factura_Amount", "Factura_Difference", "Factura_Drive_ID",
  "Domestic_Carrier", "Domestic_Tracking", "Domestic_Ship_Date",
  "Domestic_Est_Arrival", "Domestic_Actual_Arrival",
  "Expediente_Status", "Expediente_Drive_ID", "Expediente_Signed_Date",
  "Initiated_Date", "Import_Closed_Date", "Calculo_Received_Date",
  "Payment_Sent_Date", "Crossing_Approved_Date", "Completed_Date",
  "Notes", "Status_History_JSON", "Item_Count",
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
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

  const lastCol = colLetter(TRAFICO_COLUMNS.length);
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `Traficos!A1:${lastCol}1`,
  });
  const current = r.data.values?.[0] ?? [];

  const headersMatch =
    current.length === TRAFICO_COLUMNS.length &&
    current.every((v, i) => v === TRAFICO_COLUMNS[i]);

  if (headersMatch) {
    console.log("✓ Traficos header row is already correct — no-op.");
    return;
  }

  // Get sheet ID for batchUpdate
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = (meta.data.sheets ?? []).find(
    (s) => s.properties?.title === "Traficos"
  );
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) {
    throw new Error("Traficos sheet not found");
  }

  console.log("Inserting blank row 1 (push existing data down by 1)…");
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 },
            inheritFromBefore: false,
          },
        },
      ],
    },
  });

  console.log(`Writing header row (${TRAFICO_COLUMNS.length} cols)…`);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Traficos!A1:${lastCol}1`,
    valueInputOption: "RAW",
    requestBody: { values: [TRAFICO_COLUMNS] },
  });

  console.log("Bolding header…");
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
      ],
    },
  });

  console.log("\n✅ Traficos sheet now has a header row. PUT route should work.");
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.message || e); process.exit(1); });
