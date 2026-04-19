/**
 * One-shot script: creates the Notifications tab in the CRM Sheet
 * with the approved 10-column header.
 *
 * Schema approved by Joshua on 2026-04-19.
 *
 * Run once: npx tsx scripts/_create-notifications-sheet.ts
 *
 * Idempotent: if the tab already exists, exits 0 with a message.
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { google } from "googleapis";

const HEADERS = [
  "notification_id",
  "severity",
  "audience",
  "title",
  "body",
  "source_entity_type",
  "source_entity_id",
  "status",
  "created_at",
  "acked_at",
];

const main = async () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_ID not set");

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === "Notifications");
  if (exists) {
    console.log("✓ Notifications tab already exists — nothing to do");
    return;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: "Notifications" } } }],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Notifications!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [HEADERS] },
  });

  console.log(`✓ Created Notifications tab with ${HEADERS.length} columns`);
};

main().catch((e) => {
  console.error("❌ FAILED:", e?.message || e);
  process.exit(1);
});
