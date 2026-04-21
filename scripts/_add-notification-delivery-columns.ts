/**
 * W8 one-shot migration: append 4 delivery-tracking columns to the
 * Notifications sheet (deliver_after, delivery_channel, recipient_email,
 * recipient_phone). No backfill needed — new fields are optional.
 *
 * Idempotent: already-present columns are skipped.
 *
 * Run: npx tsx scripts/_add-notification-delivery-columns.ts
 * Verify: npx tsx scripts/_test-notifications-schema.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const NEW_COLUMNS = [
  "deliver_after",
  "delivery_channel",
  "recipient_email",
  "recipient_phone",
];

const colLetter = (n: number): string => {
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

const main = async () => {
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_ID missing");

  const headerResp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Notifications!1:1",
  });
  const oldHeader = headerResp.data.values?.[0] ?? [];
  if (oldHeader.length === 0) {
    throw new Error("Notifications sheet has no header row — aborting");
  }

  const toAdd = NEW_COLUMNS.filter((c) => !oldHeader.includes(c));
  if (toAdd.length === 0) {
    console.log("= Notifications already has all 4 W8 columns — no-op.");
    return;
  }

  const newHeader = [...oldHeader, ...toAdd];
  console.log(`+ adding ${toAdd.length} columns: ${toAdd.join(", ")}`);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Notifications!A1:${colLetter(newHeader.length)}1`,
    valueInputOption: "RAW",
    requestBody: { values: [newHeader] },
  });

  console.log(`\n✅ W8 Notifications schema migration complete.`);
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.message || e); process.exit(1); });
