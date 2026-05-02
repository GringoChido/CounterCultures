/**
 * R2-5 wire-up: targeted update of just the Vendor + Vendor_Override_Reason
 * columns on a PO row. The main /purchase-orders PUT requires the full
 * record; this PATCH lets the inline editor save without round-tripping
 * everything.
 */

import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";
import { getGooglePrivateKey } from "@/app/lib/google-private-key";
import { findRowIndex } from "@/app/lib/dashboard-sheets";
import { ensureColumns } from "@/app/lib/sheet-migrations";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID ?? "";

const getSheets = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: getGooglePrivateKey(),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
};

interface PatchBody {
  PO_ID: string;
  Deal_ID?: string;
  Vendor: string;
  Vendor_Override_Reason: string;
}

export const PATCH = async (request: NextRequest): Promise<Response> => {
  try {
    const body = (await request.json()) as PatchBody;
    if (!body.PO_ID) {
      return NextResponse.json({ error: "PO_ID required" }, { status: 400 });
    }

    const rowIdx = await findRowIndex("Purchase_Orders", "PO_ID", body.PO_ID);
    if (rowIdx === null) {
      return NextResponse.json({ error: "PO not found" }, { status: 404 });
    }

    // Self-heal: add the columns if the production sheet doesn't have them
    // yet. Idempotent — no-op when already present.
    await ensureColumns("Purchase_Orders", ["Vendor", "Vendor_Override_Reason"]);

    const sheets = getSheets();
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Purchase_Orders!1:1",
    });
    const headers = headerRes.data.values?.[0] ?? [];
    const vendorCol = headers.indexOf("Vendor");
    const reasonCol = headers.indexOf("Vendor_Override_Reason");
    // After ensureColumns(), both should exist. If either is still -1,
    // the sheet write failed silently — fall through to a 500 with detail.
    if (vendorCol === -1 || reasonCol === -1) {
      throw new Error("Vendor columns missing after self-heal attempt");
    }

    const sheetRow = rowIdx + 2; // +1 header, +1 1-indexed
    const colLetter = (i: number): string => {
      let n = i;
      let s = "";
      do {
        s = String.fromCharCode(65 + (n % 26)) + s;
        n = Math.floor(n / 26) - 1;
      } while (n >= 0);
      return s;
    };

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: [
          {
            range: `Purchase_Orders!${colLetter(vendorCol)}${sheetRow}`,
            values: [[body.Vendor]],
          },
          {
            range: `Purchase_Orders!${colLetter(reasonCol)}${sheetRow}`,
            values: [[body.Vendor_Override_Reason]],
          },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "patch_failed";
    console.error("[/api/dashboard/purchase-orders/vendor] PATCH", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
