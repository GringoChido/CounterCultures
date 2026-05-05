/**
 * Self-healing schema migrations for Google Sheets. The dashboard's data
 * model evolves; the production sheet doesn't always evolve with it.
 * Rather than ask Roger to manually add columns and tabs every time we
 * ship, the API routes call into these helpers before writing — so the
 * sheet self-corrects on first use of any new field.
 *
 * All operations are idempotent: re-running them is safe and a no-op
 * when the sheet is already in the right shape.
 */

import { GoogleAuth } from "google-auth-library";
import { sheets as sheetsApi } from "@googleapis/sheets";
import { getGooglePrivateKey } from "./google-private-key";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID ?? "";

const getSheets = () => {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: getGooglePrivateKey(),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return sheetsApi({ version: "v4", auth });
};

const colLetter = (i: number): string => {
  let n = i;
  let s = "";
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
};

/**
 * Ensure the named tab has each of `requiredColumns` in its header row.
 * Missing columns are appended to the right of the existing header. Cell
 * values for existing rows in those new columns will read as "" until
 * something writes them, which is exactly what readSheet expects.
 *
 * Throws only on the underlying Sheets API error — missing columns are
 * NOT a failure here, they're the trigger for the migration.
 */
export const ensureColumns = async (
  tab: string,
  requiredColumns: string[]
): Promise<void> => {
  if (!SPREADSHEET_ID || requiredColumns.length === 0) return;
  const sheets = getSheets();
  let headerRes;
  try {
    headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!1:1`,
    });
  } catch (err) {
    // Tab probably doesn't exist. Caller should ensureTab() before
    // ensureColumns() — but don't blow up here, let the caller handle.
    console.warn(`[sheet-migrations] ensureColumns(${tab}) read failed:`, err instanceof Error ? err.message : err);
    return;
  }
  const headers = headerRes.data.values?.[0] ?? [];
  const missing = requiredColumns.filter((c) => !headers.includes(c));
  if (missing.length === 0) return;

  const startCol = headers.length;
  const startLetter = colLetter(startCol);
  const endLetter = colLetter(startCol + missing.length - 1);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!${startLetter}1:${endLetter}1`,
    valueInputOption: "RAW",
    requestBody: { values: [missing] },
  });

  console.info(
    `[sheet-migrations] Added columns to ${tab}: ${missing.join(", ")}`
  );
};

/**
 * Ensure a tab exists. Creates it if missing and writes the header row.
 * No-op when the tab already exists, regardless of header content (use
 * ensureColumns to fix headers).
 */
export const ensureTab = async (
  tab: string,
  headers: string[]
): Promise<void> => {
  if (!SPREADSHEET_ID) return;
  const sheets = getSheets();
  const ss = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = ss.data.sheets?.some((s) => s.properties?.title === tab);
  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        { addSheet: { properties: { title: tab } } },
      ],
    },
  });

  if (headers.length > 0) {
    const endLetter = colLetter(headers.length - 1);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A1:${endLetter}1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }

  console.info(`[sheet-migrations] Created tab ${tab} with header row`);
};

/**
 * Append rows to a tab in one shot. Used for seeding a fresh tab.
 */
export const appendRows = async (
  tab: string,
  rows: string[][]
): Promise<void> => {
  if (!SPREADSHEET_ID || rows.length === 0) return;
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A:A`,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });
};
