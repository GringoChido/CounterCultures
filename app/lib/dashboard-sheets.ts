import { GoogleAuth } from "google-auth-library";
import { sheets as sheetsApi } from "@googleapis/sheets";
import { getGooglePrivateKey } from "./google-private-key";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID ?? "";

const getAuth = () => {
  return new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: getGooglePrivateKey(),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
};

const getSheets = () => {
  const auth = getAuth();
  return sheetsApi({ version: "v4", auth });
};

// Tab names matching the dashboard spec
type SheetTab =
  | "Leads"
  | "Pipeline"
  | "Contacts"
  | "Activity_Log"
  | "Reps"
  | "Trade_Applications"
  | "Products"
  | "Products_Odoo"
  | "Products_Quote"
  | "Deal_Line_Items"
  | "Content_Calendar"
  | "Email_Campaigns"
  | "Social_Posts"
  | "Website_Analytics"
  | "Sales_Metrics"
  | "Marketing_Metrics"
  | "Settings"
  | "Documents"
  | "Purchase_Orders"
  | "Shipments"
  | "Deal_Payments"
  | "Manufacturers"
  | "Traficos"
  | "Trafico_Items"
  | "USMCA_Certificates"
  | "Spanish_Manuals"
  | "Notes"
  | "Gmail_Tokens"
  | "Email_Activity"
  | "Brand_NOM_Status"
  | "Brand_Lead_Times"
  | "HS_Code_Lookup"
  | "FTA_Rates"
  | "Trafico_Events"
  | "Deal_Events"
  | "Notifications"
  | "Odoo_Partners"
  | "Odoo_Invoices"
  | "Odoo_Invoice_Lines"
  | "Odoo_Payments"
  | "Odoo_Journals"
  | "Odoo_Payment_Methods"
  | "Odoo_Payment_Providers"
  | "Odoo_Sale_Orders"
  | "Odoo_Sale_Order_Lines"
  | "Odoo_Purchase_Orders"
  | "Odoo_Purchase_Order_Lines"
  | "Odoo_Stock_Quants"
  | "Odoo_Stock_Locations"
  | "Odoo_Stock_Warehouses"
  | "Odoo_Reconciliations"
  | "Odoo_Full_Reconciliations"
  | "Odoo_Attachments"
  | "Odoo_Messages"
  | "Posts"
  | "Product_Descriptions"
  | "Users"
  | "FX_Rates"
  | "Invoice_Approvals"
  | "Vendors"
  | "WhatsApp_Messages"
  | "AR_Factura_Requests"
  | "AR_Credit_Notes"
  | "Santander_Deposits"
  | "Invoice_Tags"
  | "Bank_Fee_Rates"
  | "Bank_Fee_Entries"
  | "Trade_Codes"
  | "Cart_Sessions"
  | "Conversation_Log"
  | "Customer_Preferences"
  | "Attachment_Visibility"
  | "Customers"
  | "Customer_Carts";

// In-memory TTL cache. Keyed by tab. Reference tables get a longer TTL
// because they almost never change; active tables use the short TTL so a
// stage change made by one user surfaces to the next within ~60s in the
// worst case (writes invalidate immediately for the same process). All
// writes go through appendRow / updateRow / deleteRow, which invalidate
// the cache for the touched tab — see invalidateSheet below.
const SHORT_TTL_MS = 60 * 1000;
const LONG_TTL_MS = 5 * 60 * 1000;
const REFERENCE_TABS = new Set<SheetTab>([
  "Brand_NOM_Status",
  "Brand_Lead_Times",
  "FX_Rates",
  "HS_Code_Lookup",
  "FTA_Rates",
  "Vendors",
  "Reps",
  "Settings",
  "Users",
  "Manufacturers",
]);

type CacheEntry = { data: unknown[]; expiresAt: number };
const sheetCache = new Map<SheetTab, CacheEntry>();
// Coalesce concurrent fetches: if N requests arrive within the same TTL
// window before the first fetch completes, all N share the same Promise
// instead of triggering N parallel Sheets API calls.
const inflight = new Map<SheetTab, Promise<unknown[]>>();

const ttlFor = (tab: SheetTab): number =>
  REFERENCE_TABS.has(tab) ? LONG_TTL_MS : SHORT_TTL_MS;

const invalidateSheet = (tab: SheetTab): void => {
  sheetCache.delete(tab);
};

const fetchSheet = async <T extends Record<string, string>>(
  tab: SheetTab
): Promise<T[]> => {
  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A:ZZ`,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] ?? "";
    });
    return obj as T;
  });
};

// Read all rows from a sheet tab (returns array of objects using header row as keys)
const readSheet = async <T extends Record<string, string>>(
  tab: SheetTab
): Promise<T[]> => {
  const now = Date.now();
  const cached = sheetCache.get(tab);
  if (cached && cached.expiresAt > now) {
    return cached.data as T[];
  }

  const existing = inflight.get(tab);
  if (existing) return existing as Promise<T[]>;

  const promise = (async () => {
    try {
      const data = await fetchSheet<T>(tab);
      sheetCache.set(tab, {
        data: data as unknown[],
        expiresAt: Date.now() + ttlFor(tab),
      });
      return data;
    } finally {
      inflight.delete(tab);
    }
  })();
  inflight.set(tab, promise as Promise<unknown[]>);
  return promise;
};

// Append a new row to a sheet tab
const appendRow = async (tab: SheetTab, values: string[]): Promise<void> => {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A:A`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
  invalidateSheet(tab);
};

// Update a specific row (0-indexed data row, row 0 = first data row after header)
const updateRow = async (
  tab: SheetTab,
  dataRowIndex: number,
  values: string[]
): Promise<void> => {
  const sheets = getSheets();
  const sheetRow = dataRowIndex + 2; // +1 for header, +1 for 1-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
  invalidateSheet(tab);
};

// Delete a row by data index (0-indexed)
const deleteRow = async (tab: SheetTab, dataRowIndex: number): Promise<void> => {
  const sheets = getSheets();
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === tab
  );

  if (sheet?.properties?.sheetId === undefined) {
    throw new Error(`Sheet tab "${tab}" not found`);
  }

  const sheetRow = dataRowIndex + 1; // +1 for header (0-indexed for batchUpdate)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: "ROWS",
              startIndex: sheetRow,
              endIndex: sheetRow + 1,
            },
          },
        },
      ],
    },
  });
  invalidateSheet(tab);
};

// Find row index by column value
const findRowIndex = async (
  tab: SheetTab,
  columnHeader: string,
  value: string
): Promise<number | null> => {
  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A:ZZ`,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) return null;

  const headers = rows[0];
  const colIndex = headers.indexOf(columnHeader);
  if (colIndex === -1) return null;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][colIndex] === value) return i - 1; // 0-indexed data row
  }

  return null;
};

/** Read just the header row (first row) of a tab, in column order. */
const getSheetHeaders = async (tab: SheetTab): Promise<string[]> => {
  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!1:1`,
  });
  const row = response.data.values?.[0];
  return Array.isArray(row) ? row.map((v) => String(v ?? "")) : [];
};

/**
 * Upserts a row by matching a single key field against an existing row. If
 * found, merges `fields` onto the existing row (preserving columns the
 * caller didn't touch) and rewrites in header order. If not found, appends
 * a new row in header order using empty strings for missing fields.
 *
 * `key.field` should be a stable Odoo identifier (e.g. `id`). All values are
 * coerced to string for the Sheet write (Sheets are stringy).
 */
const upsertRowByField = async (
  tab: SheetTab,
  key: { field: string; value: string },
  fields: Record<string, unknown>
): Promise<{ action: "updated" | "inserted"; rowIndex: number | null }> => {
  const headers = await getSheetHeaders(tab);
  if (headers.length === 0) {
    throw new Error(`Tab "${tab}" has no header row — cannot upsert`);
  }
  const stringifiedFields: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) {
      stringifiedFields[k] = "";
    } else if (Array.isArray(v)) {
      stringifiedFields[k] = v.join("|");
    } else {
      stringifiedFields[k] = String(v);
    }
  }

  const rows = await readSheet<Record<string, string>>(tab);
  const idx = rows.findIndex((r) => r[key.field] === key.value);

  if (idx === -1) {
    const values = headers.map((h) => stringifiedFields[h] ?? "");
    await appendRow(tab, values);
    return { action: "inserted", rowIndex: null };
  }

  const merged = { ...rows[idx], ...stringifiedFields };
  const values = headers.map((h) => merged[h] ?? "");
  await updateRow(tab, idx, values);
  return { action: "updated", rowIndex: idx };
};

/**
 * Append a row by header name. Reads the live header, places each field's
 * value in the right column, fills unknown columns with "". Use this
 * instead of `appendRow` whenever the route's column order might drift
 * from the sheet's actual order — which is most cases now that
 * sheet-migrations may have appended new columns.
 */
const appendRowByHeader = async (
  tab: SheetTab,
  fields: Record<string, string>
): Promise<void> => {
  const headers = await getSheetHeaders(tab);
  if (headers.length === 0) {
    throw new Error(`Tab "${tab}" has no header row — cannot append`);
  }
  const values = headers.map((h) => fields[h] ?? "");
  await appendRow(tab, values);
};

/**
 * Update a row by header name. Reads the live header AND the existing row,
 * merges `fields` onto it, then writes the full row back in the live
 * header order. Preserves any columns the caller didn't touch.
 */
const updateRowByHeader = async (
  tab: SheetTab,
  dataRowIndex: number,
  fields: Record<string, string>
): Promise<void> => {
  const headers = await getSheetHeaders(tab);
  if (headers.length === 0) {
    throw new Error(`Tab "${tab}" has no header row — cannot update`);
  }
  const rows = await readSheet<Record<string, string>>(tab);
  const existing = rows[dataRowIndex] ?? {};
  const merged: Record<string, string> = { ...existing, ...fields };
  const values = headers.map((h) => merged[h] ?? "");
  await updateRow(tab, dataRowIndex, values);
};

export {
  readSheet,
  appendRow,
  updateRow,
  appendRowByHeader,
  updateRowByHeader,
  deleteRow,
  findRowIndex,
  getSheetHeaders,
  upsertRowByField,
  invalidateSheet,
};
export type { SheetTab };
