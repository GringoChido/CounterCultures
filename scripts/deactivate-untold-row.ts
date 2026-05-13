/**
 * One-shot: soft-delete the joshua@untold.works row in the Users tab by
 * flipping active=false. Follows the convention in app/lib/users-sheet.ts
 * (deactivateUser): row is never removed — preserves audit trail.
 *
 * Run with: npx tsx scripts/deactivate-untold-row.ts
 */

import { google } from "googleapis";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const TAB = "Users";
const TARGET_EMAIL = "joshua@untold.works";

const requireEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
};

const main = async () => {
  const spreadsheetId = requireEnv("GOOGLE_SHEETS_ID");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      private_key: requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${TAB}!A:E`,
  });
  const rows = res.data.values ?? [];
  if (rows.length < 2) {
    throw new Error("Users tab is empty — nothing to deactivate.");
  }
  const header = rows[0];
  const emailCol = header.indexOf("email");
  const activeCol = header.indexOf("active");
  if (emailCol === -1 || activeCol === -1) {
    throw new Error(`Users tab missing required columns. Header: ${header.join(" | ")}`);
  }

  const dataRowIndex = rows.slice(1).findIndex(
    (r) => (r[emailCol] ?? "").trim().toLowerCase() === TARGET_EMAIL
  );
  if (dataRowIndex === -1) {
    console.log(`  No row found for ${TARGET_EMAIL} — nothing to do.`);
    return;
  }

  const sheetRow = dataRowIndex + 2; // header + 1-indexed
  const currentActive = (rows[dataRowIndex + 1][activeCol] ?? "").trim();
  if (currentActive.toLowerCase() === "false") {
    console.log(`  ${TARGET_EMAIL} is already active=false. Nothing to do.`);
    return;
  }

  // Update just the active cell (column E based on schema email|name|role|active|feature_overrides).
  const activeA1 = String.fromCharCode("A".charCodeAt(0) + activeCol); // 'D'
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${TAB}!${activeA1}${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [["false"]] },
  });
  console.log(`  ✓ Set ${TARGET_EMAIL} (row ${sheetRow}) active=false.`);
  console.log(`  Auth-layer Users cache TTL is 60s — sign-in will reject within 1 min.`);
};

main().catch((err) => {
  console.error("\n✗ deactivate failed:", err);
  process.exit(1);
});
