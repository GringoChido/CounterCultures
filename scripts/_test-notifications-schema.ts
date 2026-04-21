/**
 * W8 RED/verify test — Notifications sheet must have the 4 new W8 columns.
 *
 * Run: npx tsx scripts/_test-notifications-schema.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const REQUIRED_COLUMNS = [
  "notification_id", "severity", "audience", "title", "body",
  "source_entity_type", "source_entity_id", "status", "created_at", "acked_at",
  // W8 additions
  "deliver_after", "delivery_channel", "recipient_email", "recipient_phone",
];

const main = async () => {
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_ID missing");

  const r = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Notifications!1:1",
  });
  const header = r.data.values?.[0] ?? [];
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));

  if (missing.length > 0) {
    console.error(`❌ Notifications missing columns: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log(`✅ Notifications schema OK (${REQUIRED_COLUMNS.length} cols)`);
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.message || e); process.exit(1); });
