/**
 * One-shot Users-sheet seeder. Bypasses the OAuth signIn callback (which
 * itself depends on a populated Users tab — see the chicken-and-egg in
 * app/lib/auth-options.ts after the P0 "bootstrap mode removed" fix) by
 * writing rows directly via the service account.
 *
 * Schema (from app/lib/users-sheet.ts):
 *   email | name | role | active | feature_overrides
 *
 *   role:               "owner" | "finance" | "sales"
 *   active:             "true" | "false"
 *   feature_overrides:  pipe-delimited `+feature` / `-feature` tokens
 *
 * Idempotent: skips any email that already has a row (does NOT overwrite —
 * we don't want to clobber a downgrade Roger may have applied in the UI).
 * To force-update an existing row, delete it in the Sheet first.
 *
 * Run with: npx tsx scripts/seed-users.ts
 */

import { google } from "googleapis";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const TAB = "Users";
const COLUMNS = ["email", "name", "role", "active", "feature_overrides"] as const;

type UserRole = "owner" | "finance" | "sales";

interface SeedUser {
  email: string;
  name: string;
  role: UserRole;
}

// Known team members. Only seed @countercultures.com.mx emails.
//
// admin@: Joshua's Workspace alias (used by Resend staging redirect, Drive ops).
// roger@: CEO. Owns trade-app approvals, brand-kit edits, owner deposits.
// control@: Antonina Trischitta (Finance/AP). Same person as "Tonina"/"Antonia".
//
// TODO: add Javier Medina + Ian once their @countercultures.com.mx emails
// are confirmed. Both should be role=sales.
const SEED: SeedUser[] = [
  { email: "admin@countercultures.com.mx", name: "Joshua Semolik (admin alias)", role: "owner" },
  { email: "roger@countercultures.com.mx", name: "Roger Williams", role: "owner" },
  { email: "control@countercultures.com.mx", name: "Antonina Trischitta", role: "finance" },
];

const requireEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
};

const getPrivateKey = (): string => {
  const raw = requireEnv("GOOGLE_PRIVATE_KEY");
  // Same normalization the app uses — \n in the env var becomes a real newline.
  return raw.replace(/\\n/g, "\n");
};

const main = async () => {
  const spreadsheetId = requireEnv("GOOGLE_SHEETS_ID");
  const clientEmail = requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: getPrivateKey() },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // 1. Read header + existing rows so we can both validate column order and
  //    skip emails that already have a row.
  const range = `${TAB}!A:E`;
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  const rows = existing.data.values ?? [];

  if (rows.length === 0) {
    // Empty tab — write the header first.
    console.log(`  Users tab is empty. Writing header row…`);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${TAB}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [[...COLUMNS]] },
    });
  } else {
    const header = rows[0];
    const mismatches = COLUMNS.filter((c, i) => header[i]?.trim().toLowerCase() !== c);
    if (mismatches.length > 0) {
      console.error(
        `✗ Users tab header mismatch.\n  expected: ${COLUMNS.join(" | ")}\n  found:    ${header.join(" | ")}\n  Aborting — fix the header manually before reseeding.`
      );
      process.exit(1);
    }
  }

  const existingEmails = new Set(
    rows.slice(1).map((r) => (r[0] ?? "").trim().toLowerCase()).filter(Boolean)
  );

  // 2. Append only the rows that don't already exist.
  const toAppend = SEED.filter((u) => !existingEmails.has(u.email.toLowerCase()));
  const skipped = SEED.filter((u) => existingEmails.has(u.email.toLowerCase()));

  for (const s of skipped) {
    console.log(`  skip   ${s.email} — already in Users tab`);
  }

  if (toAppend.length === 0) {
    console.log(`\n✓ Nothing to do — all seed emails already present.\n`);
    return;
  }

  const values = toAppend.map((u) => [u.email, u.name, u.role, "true", ""]);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${TAB}!A:E`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  for (const u of toAppend) {
    console.log(`  added  ${u.email}  role=${u.role}  active=true`);
  }
  console.log(`\n✓ Seeded ${toAppend.length} user${toAppend.length === 1 ? "" : "s"} into ${TAB}.\n`);
  console.log(`  Note: the auth layer caches Users for 60s. Wait ~1min before retry.\n`);
};

main().catch((err) => {
  console.error("\n✗ Seed failed:", err);
  process.exit(1);
});
