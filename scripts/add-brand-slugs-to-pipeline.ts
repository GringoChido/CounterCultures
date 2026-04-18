/**
 * Week 2 Day 4 — add `brand_slugs` column to the Pipeline tab in the CRM Sheet.
 *
 * Appends a single column at the end of the existing Pipeline header row.
 * Idempotent: if `brand_slugs` already exists (any column), this is a no-op.
 * Existing data rows are untouched.
 *
 * Run: npx tsx scripts/add-brand-slugs-to-pipeline.ts
 */

import { google } from "googleapis";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const TAB = "Pipeline";
const NEW_COLUMN = "brand_slugs";

const requireEnv = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env var: ${k}`);
  return v;
};

const colLetter = (index: number): string => {
  let n = index;
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
};

const main = async () => {
  const sheetId = requireEnv("GOOGLE_SHEETS_ID");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      private_key: requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const header = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${TAB}!A1:ZZ1`,
  });
  const row = (header.data.values?.[0] ?? []) as string[];
  const existingIndex = row.findIndex((c) => c.trim().toLowerCase() === NEW_COLUMN);

  if (existingIndex >= 0) {
    console.log(`✓ "${NEW_COLUMN}" already exists at column ${colLetter(existingIndex)}. No-op.`);
    return;
  }

  const nextCol = colLetter(row.length);
  console.log(`Appending "${NEW_COLUMN}" at column ${nextCol}.`);

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${TAB}!${nextCol}1`,
    valueInputOption: "RAW",
    requestBody: { values: [[NEW_COLUMN]] },
  });

  const verify = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${TAB}!A1:ZZ1`,
  });
  const newRow = (verify.data.values?.[0] ?? []) as string[];
  console.log(`\n✓ Done. Header now: ${newRow.join(" · ")}`);
};

main().catch((e) => {
  console.error("\n✗ Migration failed:", e);
  process.exit(1);
});
