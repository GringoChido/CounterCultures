/**
 * Week 3 Day 1 — create the `Email_Activity` tab in the CRM Sheet.
 *
 * Audit log for every email interaction that passes through the portal:
 * received / sent / replied / archived / created_lead / created_deal /
 * attached_to_deal. Schema per Gmail integration spec §5.2. Idempotent.
 *
 * Run: npx tsx scripts/create-email-activity-sheet.ts
 */

import { google } from "googleapis";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const TAB = "Email_Activity";
const HEADERS = [
  "activity_id",
  "user_email",
  "gmail_message_id",
  "gmail_thread_id",
  "direction",
  "action",
  "related_lead_id",
  "related_deal_id",
  "sender_email",
  "recipient_emails",
  "subject",
  "snippet",
  "timestamp",
];

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

  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const existing = meta.data.sheets?.find((s) => s.properties?.title === TAB);
  if (existing) {
    console.log(`✓ "${TAB}" already exists (sheetId ${existing.properties?.sheetId}). No-op.`);
    return;
  }

  console.log(`Creating "${TAB}" tab with ${HEADERS.length} columns…`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: TAB,
              gridProperties: { rowCount: 5000, columnCount: HEADERS.length },
            },
          },
        },
      ],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${TAB}!A1:${colLetter(HEADERS.length - 1)}1`,
    valueInputOption: "RAW",
    requestBody: { values: [HEADERS] },
  });

  console.log(`✓ Done. Header row: ${HEADERS.join(" · ")}`);
};

main().catch((e) => {
  console.error("\n✗ Migration failed:", e);
  process.exit(1);
});
