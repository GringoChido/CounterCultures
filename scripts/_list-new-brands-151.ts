import { GoogleAuth } from "google-auth-library";
import { sheets as sheetsApi } from "@googleapis/sheets";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const auth = new GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

(async () => {
  const sheets = sheetsApi({ version: "v4", auth });
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_BRAND_KIT_SHEET_ID,
    range: "brands!A2:Y",
  });
  const rows = (r.data.values ?? []).filter((row) => row[24] === "claude (brands-151 batch)");
  console.log(`new rows: ${rows.length}`);
  for (const row of rows) {
    const slug = row[0];
    const name = row[1];
    if (slug && /[^a-z0-9-]/.test(slug)) console.log(`  ODD: ${slug.padEnd(30)} ${name}`);
    else if (slug && (slug.includes("--") || slug.endsWith("-") || slug.startsWith("-"))) console.log(`  BAD: ${slug.padEnd(30)} ${name}`);
  }
  // Also print the slugs that contain unusual patterns: short, contain numbers in weird ways
  console.log("---all new slugs:");
  for (const row of rows) console.log(`  ${row[0].padEnd(30)} ${row[1]}`);
})();
