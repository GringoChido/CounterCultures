/**
 * Week 3 Day 1 — append `source_message_id` to Leads and Pipeline tabs.
 *
 * Populated when a Lead or Deal is created from a Gmail thread via the
 * "Create Lead from email" / "Create Deal from email" flows. Links back
 * to the original message (Gmail message ID) so the thread-on-Deal panel
 * can surface the full email history. Idempotent — no-op if either column
 * is already present.
 *
 * Run: npx tsx scripts/add-source-message-id.ts
 */

import { google, sheets_v4 } from "googleapis";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const NEW_COLUMN = "source_message_id";
const TABS: ("Leads" | "Pipeline")[] = ["Leads", "Pipeline"];

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

const addColumnIfMissing = async (
  sheets: sheets_v4.Sheets,
  sheetId: string,
  tab: string
) => {
  const header = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tab}!A1:ZZ1`,
  });
  const row = (header.data.values?.[0] ?? []) as string[];
  const existingIndex = row.findIndex(
    (c) => c.trim().toLowerCase() === NEW_COLUMN
  );

  if (existingIndex >= 0) {
    console.log(
      `✓ ${tab}.${NEW_COLUMN} already at column ${colLetter(existingIndex)}. No-op.`
    );
    return;
  }

  const nextCol = colLetter(row.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${tab}!${nextCol}1`,
    valueInputOption: "RAW",
    requestBody: { values: [[NEW_COLUMN]] },
  });
  console.log(`✓ ${tab}.${NEW_COLUMN} appended at column ${nextCol}.`);
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

  for (const tab of TABS) {
    await addColumnIfMissing(sheets, sheetId, tab);
  }
};

main().catch((e) => {
  console.error("\n✗ Migration failed:", e);
  process.exit(1);
});
