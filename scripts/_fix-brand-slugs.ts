/**
 * One-off slug repair for the BRANDS 151 batch.
 *
 * Three rows came out with awkward slugs because the original slugify
 * didn't NFKD-normalize and didn't space out `&` before kebab-casing:
 *   - sukabumi-stone-m-xico → sukabumi-stone-mexico
 *   - aande-bath-and-shower → a-and-e-bath-and-shower
 *   - tands-brass           → t-and-s-brass
 */

import { GoogleAuth } from "google-auth-library";
import { sheets as sheetsApi } from "@googleapis/sheets";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const SHEET_ID = process.env.GOOGLE_BRAND_KIT_SHEET_ID ?? "";

const FIXES: Record<string, string> = {
  "sukabumi-stone-m-xico": "sukabumi-stone-mexico",
  "aande-bath-and-shower": "a-and-e-bath-and-shower",
  "tands-brass": "t-and-s-brass",
};

(async () => {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = sheetsApi({ version: "v4", auth });
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "brands!A2:A",
  });
  const rows = r.data.values ?? [];
  const updates: { range: string; values: string[][] }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const slug = (rows[i][0] ?? "").toString();
    if (FIXES[slug]) {
      const rowNum = i + 2; // header + 0-indexed
      updates.push({
        range: `brands!A${rowNum}`,
        values: [[FIXES[slug]]],
      });
      console.log(`row ${rowNum}: ${slug} → ${FIXES[slug]}`);
    }
  }
  if (updates.length === 0) {
    console.log("No matching slugs to fix.");
    return;
  }
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: "RAW", data: updates },
  });
  console.log(`Updated ${updates.length} slugs.`);
})();
