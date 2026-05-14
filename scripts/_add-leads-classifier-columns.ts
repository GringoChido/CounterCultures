/**
 * One-shot: add 5 classifier columns to the Leads sheet to support PR-2
 * (WhatsApp lead enrichment / Claude classifier).
 *
 * Columns appended (right of existing brand_slugs):
 *   - classifier_brands       (pipe-separated)
 *   - classifier_skus         (pipe-separated)
 *   - classifier_profession   (Architect | Designer | Builder | Hospitality | Homeowner | Unknown)
 *   - classifier_confidence   (string-encoded float 0-1)
 *   - classifier_run_at       (ISO timestamp)
 *
 * Idempotent: skips columns that already exist.
 *
 * Run: npx tsx scripts/_add-leads-classifier-columns.ts
 *      npx tsx scripts/_add-leads-classifier-columns.ts --dry-run
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const DRY_RUN = process.argv.includes("--dry-run");

const NEW_COLUMNS = [
  "classifier_brands",
  "classifier_skus",
  "classifier_profession",
  "classifier_confidence",
  "classifier_run_at",
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

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_ID missing from .env.local");
  }

  console.log(`Mode: ${DRY_RUN ? "DRY-RUN (no writes)" : "LIVE"}`);
  console.log(`Spreadsheet: ${spreadsheetId}\n`);

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Leads!1:1",
  });
  const existingHeaders = (headerRes.data.values?.[0] ?? []).map((v) =>
    String(v ?? ""),
  );

  if (existingHeaders.length === 0) {
    throw new Error("Leads tab has no header row — refusing to operate.");
  }

  const missing = NEW_COLUMNS.filter((c) => !existingHeaders.includes(c));
  if (missing.length === 0) {
    console.log("✓ All classifier columns already present — no-op.");
    return;
  }

  const startCol = existingHeaders.length + 1; // 1-indexed for A1 notation
  const endCol = startCol + missing.length - 1;
  const range = `Leads!${colLetter(startCol)}1:${colLetter(endCol)}1`;
  console.log(`→ Appending ${missing.length} column(s) to Leads at ${range}:`);
  for (const c of missing) console.log(`    - ${c}`);

  if (DRY_RUN) {
    console.log("\n  (dry-run skipped)");
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [missing] },
  });

  // Bold the new headers to match the existing header row style
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetId = (meta.data.sheets ?? []).find(
    (s) => s.properties?.title === "Leads",
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

  console.log("\n✅ Leads sheet now has classifier columns.");
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
