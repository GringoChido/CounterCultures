import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID ?? "";

const getAuth = () => {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
};

const getSheets = () => {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
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
  | "Content_Calendar"
  | "Email_Campaigns"
  | "Social_Posts"
  | "Website_Analytics"
  | "Sales_Metrics"
  | "Marketing_Metrics"
  | "Settings";

// Read all rows from a sheet tab (returns array of objects using header row as keys)
const readSheet = async <T extends Record<string, string>>(
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

// Append a new row to a sheet tab
const appendRow = async (tab: SheetTab, values: string[]): Promise<void> => {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A:A`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
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

export { readSheet, appendRow, updateRow, deleteRow, findRowIndex };
export type { SheetTab };
