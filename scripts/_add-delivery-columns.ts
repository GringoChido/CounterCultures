/**
 * One-shot: add 6 delivery / signature columns to Pipeline for PR-10
 * (Miguel local scheduler + signature capture).
 *
 *   - delivery_window_start          (ISO timestamp)
 *   - delivery_window_end            (ISO timestamp)
 *   - delivery_phone_confirmed_at    (ISO timestamp — Miguel called the
 *                                     customer to confirm the window)
 *   - delivery_signature_drive_file_id (Drive id of the signed receipt)
 *   - delivery_signed_at             (ISO timestamp)
 *   - delivery_signed_by             (free-text — recipient's name)
 *
 * Idempotent. Run: npx tsx scripts/_add-delivery-columns.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const DRY_RUN = process.argv.includes("--dry-run");
const NEW_COLUMNS = [
  "delivery_window_start",
  "delivery_window_end",
  "delivery_phone_confirmed_at",
  "delivery_signature_drive_file_id",
  "delivery_signed_at",
  "delivery_signed_by",
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
    range: "Pipeline!1:1",
  });
  const headers = (r.data.values?.[0] ?? []).map((v) => String(v ?? ""));
  if (headers.length === 0) throw new Error("Pipeline has no header row");

  const missing = NEW_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length === 0) {
    console.log("✓ All delivery columns already present — no-op.");
    return;
  }

  const startCol = headers.length + 1;
  const endCol = startCol + missing.length - 1;
  const range = `Pipeline!${colLetter(startCol)}1:${colLetter(endCol)}1`;
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
    (s) => s.properties?.title === "Pipeline",
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
  console.log("\n✅ Pipeline now has delivery / signature columns.");
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
