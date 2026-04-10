/**
 * Syncs SAMPLE_PRODUCTS from the Google Sheet.
 * Reads all products from Products!A2:R and generates
 * the SAMPLE_PRODUCTS array for app/lib/constants.ts.
 *
 * Usage:
 *   npx tsx scripts/sync-sample-products.ts > /tmp/synced-products.ts
 *
 * Requires env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_SHEETS_ID
 */

import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.error("Missing required env vars");
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: SERVICE_ACCOUNT_EMAIL,
    private_key: PRIVATE_KEY,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

const run = async () => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID!,
    range: "Products!A2:R",
  });

  const rows = (response.data.values as string[][]) ?? [];

  if (rows.length === 0) {
    console.error("No data found in Google Sheet");
    process.exit(1);
  }

  console.log("export const SAMPLE_PRODUCTS = [");

  for (const row of rows) {
    const id = row[0] || "";
    const sku = row[1] || "";
    const brand = row[2] || "";
    const name = row[3] || "";
    const nameEn = row[4] || name;
    const category = row[5] || "bathroom";
    const subcategory = row[6] || "";
    const price = Math.round(Number(row[7]) || 0);
    const currency = row[9] || "MXN";
    const finishes = row[10] ? row[10].split(",").map((f: string) => f.trim()) : [];
    const image = row[11] || "";
    const artisanal = row[12] === "true";
    const description = row[13] || "";
    const descriptionEn = row[14] || description;
    const slug = row[17] || name.toLowerCase().replace(/\s+/g, "-");

    const finishesStr = finishes.map((f: string) => `"${f}"`).join(", ");

    console.log(`  {`);
    console.log(`    id: "${id}",`);
    console.log(`    sku: "${sku}",`);
    console.log(`    slug: "${slug}",`);
    console.log(`    brand: "${brand}",`);
    console.log(`    name: "${name.replace(/"/g, '\\"')}",`);
    console.log(`    nameEn: "${nameEn.replace(/"/g, '\\"')}",`);
    console.log(`    category: "${category}",`);
    console.log(`    subcategory: "${subcategory}",`);
    console.log(`    price: ${price},`);
    console.log(`    currency: "${currency}",`);
    console.log(`    finishes: [${finishesStr}],`);
    console.log(`    image: "${image}",`);
    console.log(`    artisanal: ${artisanal},`);
    console.log(`    description: "${description.replace(/"/g, '\\"')}",`);
    console.log(`    descriptionEn: "${descriptionEn.replace(/"/g, '\\"')}",`);
    console.log(`  },`);
  }

  console.log("] as const;");
  console.error(`\n✅ Generated ${rows.length} products from Google Sheet`);
};

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
