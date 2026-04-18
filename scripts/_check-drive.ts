import { google } from "googleapis";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });

(async () => {
  const id = process.env.GOOGLE_BRAND_KIT_SHEET_ID!;
  // slug (A), origin_country (G), origin_country_name (H), website_url (I)
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: id,
    ranges: ["brands!A2:A74", "brands!G2:I74"],
  });
  const slugs = res.data.valueRanges?.[0].values ?? [];
  const cells = res.data.valueRanges?.[1].values ?? [];

  let hasOrigin = 0;
  let hasUrl = 0;
  const blankOrigin: string[] = [];
  const blankUrl: string[] = [];

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i][0] ?? "";
    const row = cells[i] ?? [];
    const origin = row[0] ?? "";
    const url = row[2] ?? "";
    if (origin) hasOrigin++; else blankOrigin.push(slug);
    if (url) hasUrl++; else blankUrl.push(slug);
  }

  console.log(`Brands with origin_country filled:  ${hasOrigin}/${slugs.length}`);
  console.log(`Brands with website_url filled:     ${hasUrl}/${slugs.length}`);
  if (blankOrigin.length) console.log(`Blank origin: ${blankOrigin.join(", ")}`);
  if (blankUrl.length) console.log(`Blank url:    ${blankUrl.join(", ")}`);

  console.log("\nSpot-check (first 5 flagship):");
  for (let i = 0; i < Math.min(6, slugs.length); i++) {
    const slug = slugs[i][0] ?? "";
    const row = cells[i] ?? [];
    console.log(`  ${slug.padEnd(20)} ${(row[0] ?? "").padEnd(4)} ${(row[1] ?? "").padEnd(18)} ${row[2] ?? ""}`);
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
