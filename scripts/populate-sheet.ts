/**
 * Populates the Google Sheet (Products!A2:R) with ALL products from SAMPLE_PRODUCTS.
 *
 * Usage:
 *   npx tsx scripts/populate-sheet.ts
 *
 * Requires env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_SHEETS_ID
 */

import { google } from "googleapis";

// Inline the sample data import (can't directly import as const)
// Instead, we read constants.ts and extract product data
import { SAMPLE_PRODUCTS } from "../app/lib/constants";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.error("Missing required env vars: GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY");
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: SERVICE_ACCOUNT_EMAIL,
    private_key: PRIVATE_KEY,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const HEADERS = [
  "id", "sku", "brand", "name", "nameEn", "category", "subcategory",
  "price", "tradePrice", "currency", "finishes", "images",
  "artisanal", "description", "descriptionEn", "availability", "featured", "slug",
];

const run = async () => {
  console.log(`📋 Populating Google Sheet with ${SAMPLE_PRODUCTS.length} products...`);

  // Step 1: Write headers
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID!,
    range: "Products!A1:R1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [HEADERS] },
  });
  console.log("✅ Headers written to row 1");

  // Step 2: Clear existing product data
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID!,
    range: "Products!A2:R",
  });
  console.log("🗑️  Cleared existing data from A2:R");

  // Step 3: Map products to rows
  const rows = SAMPLE_PRODUCTS.map((p) => {
    const record = p as unknown as Record<string, unknown>;
    return [
      p.id,
      p.sku,
      p.brand,
      p.name,
      p.nameEn,
      p.category,
      p.subcategory,
      String(p.price),
      "", // tradePrice
      p.currency,
      p.finishes.join(","),
      p.image, // local path
      String(p.artisanal),
      (record.description as string) || "",
      (record.descriptionEn as string) || "",
      "in-stock",
      "false",
      (record.slug as string) || p.name.toLowerCase().replace(/\s+/g, "-"),
    ];
  });

  // Step 4: Write all products
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID!,
    range: `Products!A2:R${rows.length + 1}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });

  console.log(`✅ Wrote ${rows.length} products to Google Sheet`);
  console.log(`📊 Breakdown:`);

  const categories = rows.reduce<Record<string, number>>((acc, row) => {
    const cat = row[5];
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });
};

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
