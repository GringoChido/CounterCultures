import { NextResponse, type NextRequest } from "next/server";
import { GoogleAuth } from "google-auth-library";
import { sheets as sheetsApi } from "@googleapis/sheets";
import { getGooglePrivateKey } from "@/app/lib/google-private-key";
import { findSATCode } from "@/app/lib/sat-codes";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID_PRODUCTS_FULL ?? "";
const TAB = "Products";

export const PUT = async (req: NextRequest) => {
  const body = (await req.json()) as { productId: string; satCode: string };
  const { productId, satCode } = body;
  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }
  if (satCode && !findSATCode(satCode)) {
    return NextResponse.json({ error: "Invalid SAT code" }, { status: 400 });
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: getGooglePrivateKey(),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = sheetsApi({ version: "v4", auth });

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!1:1`,
  });
  const headers = headerRes.data.values?.[0] ?? [];

  let satColIdx = headers.indexOf("sat_code");
  if (satColIdx < 0) {
    satColIdx = headers.length;
    const colLetter = String.fromCharCode(65 + satColIdx);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TAB}!${colLetter}1`,
      valueInputOption: "RAW",
      requestBody: { values: [["sat_code"]] },
    });
  }

  const idCol = headers.indexOf("id");
  const idColLetter = String.fromCharCode(65 + (idCol >= 0 ? idCol : 0));
  const idsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!${idColLetter}:${idColLetter}`,
  });
  const ids = idsRes.data.values ?? [];
  const rowIdx = ids.findIndex((r) => r[0] === productId);

  if (rowIdx < 0) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const satColLetter = String.fromCharCode(65 + satColIdx);
  const sheetRow = rowIdx + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!${satColLetter}${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [[satCode]] },
  });

  return NextResponse.json({ ok: true, productId, satCode });
};
