import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

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
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID!,
    range: "Traficos!A:D",
  });
  const rows = r.data.values ?? [];
  console.log(`Traficos sheet has ${rows.length} total rows (incl. header)`);
  console.log("First 3 rows of cols A-D:");
  for (let i = 0; i < Math.min(rows.length, 3); i++) {
    console.log(`  [${i}] ${JSON.stringify(rows[i])}`);
  }
  if (rows.length > 3) {
    console.log("Last 3 rows:");
    for (let i = Math.max(rows.length - 3, 0); i < rows.length; i++) {
      console.log(`  [${i}] ${JSON.stringify(rows[i])}`);
    }
  }
  // Specifically search for our test ID
  const target = "CC-TRF-TEST-1776550738571";
  const found = rows.findIndex((r) => r[0] === target);
  console.log(`\nSearch for ${target}: ${found >= 0 ? `FOUND at row ${found}` : "NOT FOUND"}`);
};

main().catch((e) => { console.error(e); process.exit(1); });
