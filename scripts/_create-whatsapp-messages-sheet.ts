/**
 * One-shot script: creates the WhatsApp_Messages tab in the CRM Sheet
 * with the 14-column header for the inbound + outbound message log.
 *
 * Each row is one message. Conversations are derived at read time by
 * grouping rows on wa_id. The sheet is append-only on the write path;
 * the only updates are status transitions on the message row Meta
 * already issued an id for.
 *
 * Run once: npx tsx scripts/_create-whatsapp-messages-sheet.ts
 *
 * Idempotent: if the tab already exists, exits 0 with a message.
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { GoogleAuth } from "google-auth-library";
import { sheets as sheetsApi } from "@googleapis/sheets";

const TAB_NAME = "WhatsApp_Messages";

const HEADERS = [
  "message_id",
  "wa_id",
  "contact_name",
  "direction",
  "type",
  "body",
  "media_id",
  "status",
  "template_name",
  "phone_number_id",
  "created_at",
  "updated_at",
  "linked_lead_id",
  "error",
];

const COLUMN_WIDTHS: Record<string, number> = {
  message_id: 220,
  wa_id: 130,
  contact_name: 160,
  direction: 90,
  type: 80,
  body: 420,
  media_id: 220,
  status: 100,
  template_name: 180,
  phone_number_id: 180,
  created_at: 180,
  updated_at: 180,
  linked_lead_id: 140,
  error: 280,
};

const main = async () => {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = sheetsApi({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_ID not set");

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets?.find((s) => s.properties?.title === TAB_NAME);
  if (existing) {
    console.log(`✓ ${TAB_NAME} tab already exists — nothing to do`);
    return;
  }

  const addRes = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: TAB_NAME } } }],
    },
  });

  const newSheetId = addRes.data.replies?.[0]?.addSheet?.properties?.sheetId;
  if (newSheetId === undefined || newSheetId === null) {
    throw new Error("Sheets API did not return a sheetId for the new tab");
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${TAB_NAME}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [HEADERS] },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: HEADERS.map((header, i) => ({
        updateDimensionProperties: {
          range: {
            sheetId: newSheetId,
            dimension: "COLUMNS",
            startIndex: i,
            endIndex: i + 1,
          },
          properties: { pixelSize: COLUMN_WIDTHS[header] ?? 140 },
          fields: "pixelSize",
        },
      })),
    },
  });

  console.log(`✓ Created ${TAB_NAME} tab with ${HEADERS.length} columns`);
};

main().catch((e) => {
  console.error("❌ FAILED:", e?.message || e);
  process.exit(1);
});
