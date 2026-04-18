/**
 * Week 2 Day 5 — create the `Notes` tab in the CRM Sheet.
 *
 * Single tab, 6 columns:
 *   note_id · entity_type · entity_id · author_email · timestamp · content
 *
 * One data model for notes on every entity type: lead / deal / shipment /
 * trade_app / whatsapp_thread / blog_post / etc. Powered by the reusable
 * <NotesPanel entityType entityId /> React component.
 *
 * Idempotent — if the `Notes` tab already exists, this is a no-op (headers
 * untouched even if they drift).
 *
 * Run: npx tsx scripts/create-notes-sheet.ts
 */

import { google } from "googleapis";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const TAB = "Notes";
const HEADERS = [
  "note_id",
  "entity_type",
  "entity_id",
  "author_email",
  "timestamp",
  "content",
];

const requireEnv = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env var: ${k}`);
  return v;
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

  // Check if the tab already exists
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const existing = meta.data.sheets?.find((s) => s.properties?.title === TAB);
  if (existing) {
    console.log(`✓ "${TAB}" tab already exists (sheetId ${existing.properties?.sheetId}). No-op.`);
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
              gridProperties: { rowCount: 2000, columnCount: HEADERS.length },
            },
          },
        },
      ],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${TAB}!A1:${String.fromCharCode(64 + HEADERS.length)}1`,
    valueInputOption: "RAW",
    requestBody: { values: [HEADERS] },
  });

  console.log(`✓ Done. Header row: ${HEADERS.join(" · ")}`);
};

main().catch((e) => {
  console.error("\n✗ Migration failed:", e);
  process.exit(1);
});
