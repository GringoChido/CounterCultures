/**
 * One-shot: align the Shipments sheet with the existing code's
 * SHIPMENT_COLUMNS array (the live sheet was missing Photo_IDs) AND
 * add the 5 Skydropx columns introduced by PR-9.
 *
 *   - Photo_IDs (was missing from live sheet)
 *   - Label_Drive_File_ID  (Skydropx label PDF Drive id)
 *   - Tracking_URL         (carrier-provided tracking link)
 *   - Skydropx_Mode        ("dry-run" | "live")
 *   - Rate_MXN             (Skydropx-quoted total in MXN)
 *   - Carrier_Display      (chosen provider name, e.g. "DHL", "FedEx")
 *
 * Idempotent. Run: npx tsx scripts/_add-skydropx-columns.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const DRY_RUN = process.argv.includes("--dry-run");
const NEW_COLUMNS = [
  "Photo_IDs",
  "Label_Drive_File_ID",
  "Tracking_URL",
  "Skydropx_Mode",
  "Rate_MXN",
  "Carrier_Display",
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
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN" : "LIVE"}\n`);

  const r = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Shipments!1:1",
  });
  const headers = (r.data.values?.[0] ?? []).map((v) => String(v ?? ""));
  if (headers.length === 0) throw new Error("Shipments has no header row");

  const missing = NEW_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length === 0) {
    console.log("✓ All Skydropx columns already present — no-op.");
    return;
  }

  const startCol = headers.length + 1;
  const endCol = startCol + missing.length - 1;
  const range = `Shipments!${colLetter(startCol)}1:${colLetter(endCol)}1`;
  console.log(`→ Appending ${missing.length} column(s) at ${range}:`);
  for (const c of missing) console.log(`    - ${c}`);
  if (DRY_RUN) return;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [missing] },
  });

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetId = (meta.data.sheets ?? []).find(
    (s) => s.properties?.title === "Shipments",
  )?.properties?.sheetId;
  if (sheetId !== undefined && sheetId !== null) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: startCol - 1,
                endColumnIndex: endCol,
              },
              cell: { userEnteredFormat: { textFormat: { bold: true } } },
              fields: "userEnteredFormat.textFormat.bold",
            },
          },
        ],
      },
    });
  }
  console.log("\n✅ Shipments sheet now aligned with PR-9 schema.");
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
