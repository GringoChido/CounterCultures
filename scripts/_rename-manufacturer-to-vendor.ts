/**
 * One-shot: rename "Manufacturer" → "Vendor" in the Google Sheet to match
 * the PR-1 codebase rename.
 *
 * Two operations, both idempotent:
 *   1. Purchase_Orders tab: rename column header "Manufacturer" → "Vendor"
 *   2. If a tab named "Manufacturers" exists, rename it to "Vendors"
 *
 * Run: npx tsx scripts/_rename-manufacturer-to-vendor.ts
 *      npx tsx scripts/_rename-manufacturer-to-vendor.ts --dry-run
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const DRY_RUN = process.argv.includes("--dry-run");

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
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_ID missing from .env.local");
  }

  console.log(`Mode: ${DRY_RUN ? "DRY-RUN (no writes)" : "LIVE"}`);
  console.log(`Spreadsheet: ${spreadsheetId}\n`);

  // ── Step 1: Purchase_Orders header rename ─────────────────────────────
  const poRange = "Purchase_Orders!A1:ZZ1";
  const poHeaderRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: poRange,
  });
  const poHeaders = poHeaderRes.data.values?.[0] ?? [];

  if (poHeaders.length === 0) {
    console.log("⚠ Purchase_Orders has no header row — skipping column rename.");
  } else {
    const mfrIdx = poHeaders.findIndex((h) => h === "Manufacturer");
    const vendorIdx = poHeaders.findIndex((h) => h === "Vendor");

    if (vendorIdx >= 0 && mfrIdx < 0) {
      console.log("✓ Purchase_Orders.Vendor column already exists — no-op.");
    } else if (mfrIdx < 0) {
      console.log("⚠ Purchase_Orders has neither 'Manufacturer' nor 'Vendor' column — skipping.");
    } else if (vendorIdx >= 0 && mfrIdx >= 0) {
      console.log(
        `⚠ Both 'Manufacturer' (col ${colLetter(mfrIdx + 1)}) and 'Vendor' (col ${colLetter(
          vendorIdx + 1,
        )}) columns exist. Manual review needed — skipping.`,
      );
    } else {
      const cell = `Purchase_Orders!${colLetter(mfrIdx + 1)}1`;
      console.log(`→ Renaming Purchase_Orders.${colLetter(mfrIdx + 1)}1: 'Manufacturer' → 'Vendor'`);
      if (!DRY_RUN) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: cell,
          valueInputOption: "RAW",
          requestBody: { values: [["Vendor"]] },
        });
        console.log(`  ✅ done`);
      } else {
        console.log(`  (dry-run skipped)`);
      }
    }
  }

  // ── Step 2: Manufacturers → Vendors tab rename ────────────────────────
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const tabs = meta.data.sheets ?? [];
  const mfrTab = tabs.find((s) => s.properties?.title === "Manufacturers");
  const vendorsTab = tabs.find((s) => s.properties?.title === "Vendors");

  if (!mfrTab && !vendorsTab) {
    console.log("\n⚠ No 'Manufacturers' or 'Vendors' tab found — nothing to do.");
  } else if (!mfrTab && vendorsTab) {
    console.log("\n✓ 'Vendors' tab already exists, no 'Manufacturers' tab — no-op.");
  } else if (mfrTab && vendorsTab) {
    console.log(
      "\n⚠ Both 'Manufacturers' AND 'Vendors' tabs exist. Manual merge needed — skipping rename.",
    );
  } else if (mfrTab) {
    const sheetId = mfrTab.properties?.sheetId;
    if (sheetId === undefined || sheetId === null) {
      throw new Error("Manufacturers tab found but has no sheetId");
    }
    console.log(`\n→ Renaming tab 'Manufacturers' (sheetId ${sheetId}) → 'Vendors'`);
    if (!DRY_RUN) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: { sheetId, title: "Vendors" },
                fields: "title",
              },
            },
          ],
        },
      });
      console.log(`  ✅ done`);
    } else {
      console.log(`  (dry-run skipped)`);
    }
  }

  console.log(`\n${DRY_RUN ? "Dry-run complete." : "✅ Migration complete."}`);
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
