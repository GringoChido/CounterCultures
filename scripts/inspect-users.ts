/**
 * Dump every row of the Users tab so we can see exactly what the
 * signIn callback is reading.
 *
 * Run with: npx tsx scripts/inspect-users.ts
 */

import { google } from "googleapis";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const TAB = "Users";

const requireEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
};

const main = async () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      private_key: requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: requireEnv("GOOGLE_SHEETS_ID"),
    range: `${TAB}!A:Z`,
  });
  const rows = res.data.values ?? [];
  console.log(`\nUsers tab — ${rows.length} row(s) total (incl. header):\n`);
  rows.forEach((r, i) => {
    if (i === 0) {
      console.log(`  HEADER  | ${r.join(" | ")}`);
      console.log(`  ` + "-".repeat(80));
    } else {
      const padded = r.map((c) => JSON.stringify(c)).join(" | ");
      console.log(`  row ${String(i).padStart(2, "0")}  | ${padded}`);
    }
  });
  console.log();
};

main().catch((err) => {
  console.error("✗ inspect failed:", err);
  process.exit(1);
});
