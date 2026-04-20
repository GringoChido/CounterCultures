/**
 * One-shot: add the missing header row to the Trafico_Items sheet so
 * findRowIndex (which assumes row 0 = headers) actually works.
 *
 * Same pre-existing bug as Traficos pre-W5-Task-8 — the Trafico_Items PUT
 * route has been silently broken since the sheet was first written to
 * without a header. Closes W5 §8 open follow-up.
 *
 * Behavior:
 *   - If row 1 already matches ITEM_COLUMNS exactly → no-op
 *   - Otherwise, insert a new row 1 (push existing data down) and write
 *     the header
 *
 * Run: npx tsx scripts/_fix-trafico-items-header.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const ITEM_COLUMNS = [
  "Item_ID", "TRF_ID", "Deal_ID", "PO_ID", "Shipment_ID",
  "Vendor_Name", "Vendor_Invoice_Number", "Vendor_Invoice_Date", "Vendor_Invoice_Drive_ID",
  "Products_JSON", "Invoice_Subtotal", "Freight_Charge", "Invoice_Total",
  "US_Carrier", "US_Tracking",
  "Country_of_Origin", "Origin_Confirmed_By", "USMCA_Status", "USMCA_Cert_Drive_ID",
  "Spanish_Manuals_Required", "Spanish_Manuals_Status", "Spanish_Manual_Drive_IDs",
  "Is_Replacement", "Is_Late_Addition", "Notes",
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

  const lastCol = colLetter(ITEM_COLUMNS.length);
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `Trafico_Items!A1:${lastCol}1`,
  });
  const current = r.data.values?.[0] ?? [];

  const headersMatch =
    current.length === ITEM_COLUMNS.length &&
    current.every((v, i) => v === ITEM_COLUMNS[i]);

  if (headersMatch) {
    console.log("✓ Trafico_Items header row is already correct — no-op.");
    return;
  }

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = (meta.data.sheets ?? []).find(
    (s) => s.properties?.title === "Trafico_Items"
  );
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) {
    throw new Error("Trafico_Items sheet not found");
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

  console.log(`Writing header row (${ITEM_COLUMNS.length} cols)…`);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Trafico_Items!A1:${lastCol}1`,
    valueInputOption: "RAW",
    requestBody: { values: [ITEM_COLUMNS] },
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

  console.log("\n✅ Trafico_Items sheet now has a header row. PUT route should work.");
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.message || e); process.exit(1); });
