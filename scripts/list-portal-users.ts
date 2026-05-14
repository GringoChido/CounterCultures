/**
 * List all portal users and their access status.
 * Use this to answer "who has access to the Counter Portal?" without
 * needing the dashboard UI.
 *
 * Run with: npx tsx scripts/list-portal-users.ts
 *
 * Requires .env.local with GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL,
 * and GOOGLE_PRIVATE_KEY.
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
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: requireEnv("GOOGLE_SHEETS_ID"),
    range: `${TAB}!A:E`,
  });
  const rows = res.data.values ?? [];

  if (rows.length <= 1) {
    console.log("\nUsers tab is empty (no data rows). Nobody can sign in.\n");
    return;
  }

  const header = rows[0];
  const emailIdx = header.findIndex((h: string) => h.trim().toLowerCase() === "email");
  const nameIdx = header.findIndex((h: string) => h.trim().toLowerCase() === "name");
  const roleIdx = header.findIndex((h: string) => h.trim().toLowerCase() === "role");
  const activeIdx = header.findIndex((h: string) => h.trim().toLowerCase() === "active");

  const users = rows.slice(1).map((r: string[]) => ({
    email: (r[emailIdx] ?? "").trim().toLowerCase(),
    name: (r[nameIdx] ?? "").trim(),
    role: (r[roleIdx] ?? "").trim(),
    active: (r[activeIdx] ?? "").trim().toLowerCase() === "true",
  }));

  const active = users.filter((u) => u.active);
  const inactive = users.filter((u) => !u.active);

  console.log(`\n── Portal Users (${active.length} active, ${inactive.length} inactive) ──\n`);

  for (const u of active) {
    console.log(`  ✓  ${u.email.padEnd(40)} ${u.role.padEnd(10)} ${u.name}`);
  }
  for (const u of inactive) {
    console.log(`  ✗  ${u.email.padEnd(40)} ${u.role.padEnd(10)} ${u.name} (deactivated)`);
  }
  console.log();
};

main().catch((err) => {
  console.error("Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
