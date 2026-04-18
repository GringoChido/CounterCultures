/**
 * Verifier: confirms the 5 W5 sheets exist in the CRM Sheet with the
 * exact header rows from the design doc.
 *
 * Run: npx tsx scripts/_test-shipments-sheets.ts
 *
 * Expected RED before scripts/_create-shipments-sheets.ts is run.
 * Expected GREEN after.
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const EXPECTED: Record<string, string[]> = {
  Brand_NOM_Status: [
    "brand_slug", "nom_code", "status", "applies_to_skus", "cert_drive_folder_id",
    "last_verified_date", "expires_date", "notes", "updated_by", "updated_at",
  ],
  Brand_Lead_Times: [
    "brand_slug", "production_days", "transit_sea_days", "transit_air_days",
    "transit_truck_days", "customs_avg_days", "domestic_avg_days",
    "last_verified_date", "notes", "updated_by", "updated_at",
  ],
  HS_Code_Lookup: [
    "category_slug", "display_name_en", "display_name_es", "hs_code",
    "hs_code_prefix_6", "nom_codes", "ieps_applies", "default_duty_rate_mfn",
    "notes", "updated_by", "updated_at",
  ],
  FTA_Rates: [
    "fta_code", "origin_country", "hs_code_prefix", "preferential_rate",
    "effective_from", "effective_until", "source", "notes", "updated_by", "updated_at",
  ],
  Trafico_Events: [
    "event_id", "trafico_id", "timestamp", "actor", "event_type",
    "from_status", "to_status", "doc_key", "doc_drive_id", "amount_mxn",
    "delay_reason", "alert_channel", "message",
  ],
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
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_ID env var missing");

  let failures = 0;
  for (const [sheet, expected] of Object.entries(EXPECTED)) {
    try {
      const r = await sheets.spreadsheets.values.get({
        spreadsheetId, range: `${sheet}!1:1`,
      });
      const actual = r.data.values?.[0] ?? [];
      const ok = actual.length === expected.length && actual.every((v, i) => v === expected[i]);
      if (ok) {
        console.log(`✓ ${sheet} (${expected.length} cols)`);
      } else {
        console.log(`✗ ${sheet} — header mismatch`);
        console.log(`   expected: ${expected.join(",")}`);
        console.log(`   actual:   ${actual.join(",")}`);
        failures++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗ ${sheet} — ${msg.split("\n")[0]}`);
      failures++;
    }
  }
  console.log(failures === 0 ? "\n✅ All 5 tabs present with correct headers." : `\n❌ ${failures} failure${failures === 1 ? "" : "s"}`);
  process.exit(failures === 0 ? 0 : 1);
};

main().catch((e) => { console.error(e); process.exit(1); });
