/**
 * Google Sheets API v4 wrapper
 *
 * Single source of truth for all website data operations:
 * products, leads, trade applications, newsletter, bookings.
 *
 * In production, reads/writes to the "Counter Cultures CRM" spreadsheet
 * using the Google Cloud Service Account.
 *
 * In development (no env vars), falls back to sample data from constants.ts.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_SHEETS_ID
 */

import { google } from "googleapis";
import type { Product, ProductFilter } from "./types";
import { SAMPLE_PRODUCTS, PRODUCT_CATEGORIES } from "./constants";
import type { CategoryKey } from "./constants";

// ── Config ────────────────────────────────────────────────────────────

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;

const isConfigured = () =>
  Boolean(
    SHEETS_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
  );

// ── Auth (shared with dashboard-sheets.ts) ────────────────────────────

const getAuth = () =>
  new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

const getSheets = () => google.sheets({ version: "v4", auth: getAuth() });

// ── Read Operations ───────────────────────────────────────────────────

const fetchSheetData = async (range: string): Promise<string[][]> => {
  if (!isConfigured()) return [];

  try {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_ID!,
      range,
    });

    return (response.data.values as string[][]) ?? [];
  } catch (error) {
    console.error(`[Sheets] Failed to fetch "${range}":`, error);
    return [];
  }
};

// ── Write Operations ──────────────────────────────────────────────────

const appendSheetData = async (
  range: string,
  values: string[][]
): Promise<void> => {
  if (!isConfigured()) {
    console.warn("[Sheets] Not configured — skipping write");
    return;
  }

  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEETS_ID!,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
};

// ── Product Helpers ───────────────────────────────────────────────────

const VALID_CATEGORIES: Product["category"][] = ["bathroom", "kitchen", "hardware"];

const inferCategoryFromName = (name: string): Product["category"] => {
  const lower = name.toLowerCase();
  if (/\b(cocina|kitchen|tarja|fregadero|campana|range.?hood|pot.?filler|llenador de ollas|estufa|stove|oven|horno|dishwasher)\b/.test(lower)) return "kitchen";
  if (/\b(chapa|cerradura|deadbolt|cerrojo|entry.?set|door.?lock|handleset|jaladera|cabinet.?pull|door.?knocker|aldaba)\b/.test(lower)) return "hardware";
  return "bathroom";
};

const isValidSubcategory = (category: string, subcategory: string): boolean => {
  const catConfig = PRODUCT_CATEGORIES[category as CategoryKey];
  if (!catConfig) return false;
  return catConfig.subcategories.some((s) => s.slug === subcategory);
};

const rowToProduct = (row: string[], index: number): Product => {
  let category = (row[5]?.trim().toLowerCase() || "bathroom") as Product["category"];
  const subcategory = row[6]?.trim() || "";
  const name = row[3] || "";

  if (!VALID_CATEGORIES.includes(category)) {
    const inferred = inferCategoryFromName(name);
    console.warn(`[Products] Row ${index + 2}: "${name}" has invalid category "${row[5]}" — defaulting to "${inferred}"`);
    category = inferred;
  }

  if (subcategory && !isValidSubcategory(category, subcategory)) {
    console.warn(`[Products] Row ${index + 2}: "${name}" has invalid subcategory "${subcategory}" for category "${category}"`);
  }

  return {
    id: row[0] || String(index),
    sku: row[1] || "",
    brand: row[2] || "",
    name,
    nameEn: row[4] || name,
    category,
    subcategory,
    price: Number(row[7]) || 0,
    tradePrice: row[8] ? Number(row[8]) : undefined,
    currency: (row[9] as "MXN" | "USD") || "MXN",
    finishes: row[10] ? row[10].split(",").map((f) => f.trim()) : [],
    images: row[11] ? row[11].split(",").map((u) => u.trim()) : [],
    artisanal: row[12] === "true",
    description: row[13] || "",
    descriptionEn: row[14] || row[13] || "",
    availability: (row[15] as Product["availability"]) || "in-stock",
    featured: row[16] === "true",
    slug: row[17] || name.toLowerCase().replace(/\s+/g, "-") || "",
  };
};

const sampleToProducts = (): Product[] =>
  (SAMPLE_PRODUCTS as ReadonlyArray<(typeof SAMPLE_PRODUCTS)[number]>).map(
    (p) => {
      const record = p as unknown as Record<string, unknown>;
      return {
        id: p.id,
        sku: p.sku,
        brand: p.brand,
        name: p.name,
        nameEn: p.nameEn,
        category: p.category as Product["category"],
        subcategory: p.subcategory,
        price: p.price,
        currency: p.currency as Product["currency"],
        finishes: [...p.finishes],
        images: [p.image],
        artisanal: p.artisanal,
        description: (record.description as string) || "",
        descriptionEn:
          (record.descriptionEn as string) ||
          (record.description as string) ||
          "",
        availability: "in-stock" as const,
        slug:
          (record.slug as string) ||
          p.name.toLowerCase().replace(/\s+/g, "-"),
        specifications: record.specifications as
          | Record<string, string>
          | undefined,
      };
    }
  );

// ── Product Cache ────────────────────────────────────────────────────

let cachedProducts: Product[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getAllProducts = async (): Promise<Product[]> => {
  const now = Date.now();
  if (cachedProducts && now - cacheTimestamp < CACHE_TTL) {
    return cachedProducts;
  }

  if (!isConfigured()) {
    cachedProducts = sampleToProducts();
    cacheTimestamp = now;
    return cachedProducts;
  }

  const rows = await fetchSheetData("Products!A2:R");
  if (rows.length === 0) {
    console.warn("[Sheets] No product data returned — using sample data");
    cachedProducts = sampleToProducts();
  } else {
    cachedProducts = rows.map(rowToProduct);
    // Warn about products with invalid categories/subcategories
    cachedProducts.forEach((p, i) => {
      if (!VALID_CATEGORIES.includes(p.category)) {
        console.warn(`[Products] Row ${i + 2}: "${p.name}" has invalid category "${p.category}"`);
      }
      if (p.subcategory && !isValidSubcategory(p.category, p.subcategory)) {
        console.warn(`[Products] Row ${i + 2}: "${p.name}" has invalid subcategory "${p.subcategory}" for "${p.category}"`);
      }
    });
  }
  cacheTimestamp = now;
  return cachedProducts;
};

// ── Public API ────────────────────────────────────────────────────────

const applyFilters = (
  products: Product[],
  filter?: ProductFilter
): Product[] => {
  let result = products;
  if (filter?.category) {
    result = result.filter((p) => p.category === filter.category);
  }
  if (filter?.subcategory) {
    result = result.filter((p) => p.subcategory === filter.subcategory);
  }
  if (filter?.brand) {
    result = result.filter(
      (p) => p.brand.toLowerCase() === filter.brand?.toLowerCase()
    );
  }
  if (filter?.artisanal !== undefined) {
    result = result.filter((p) => p.artisanal === filter.artisanal);
  }
  if (filter?.minPrice) {
    result = result.filter((p) => p.price >= (filter.minPrice ?? 0));
  }
  if (filter?.maxPrice) {
    result = result.filter((p) => p.price <= (filter.maxPrice ?? Infinity));
  }
  return result;
};

export const getProducts = async (
  filter?: ProductFilter
): Promise<Product[]> => {
  const products = await getAllProducts();
  return applyFilters(products, filter);
};

export const getProductBySlug = async (
  slug: string
): Promise<Product | null> => {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) || null;
};

export const getProductsByBrand = async (
  brand: string
): Promise<Product[]> => {
  return getProducts({ brand });
};

export const getFeaturedProducts = async (): Promise<Product[]> => {
  const products = await getProducts();
  return products.filter((p) => p.featured).slice(0, 8);
};

export const getProductsBySubcategory = async (
  category: string,
  subcategory: string
): Promise<Product[]> => {
  return getProducts({ category, subcategory });
};

// ── Lead Operations ───────────────────────────────────────────────────

export const submitLead = async (lead: {
  name: string;
  email: string;
  phone: string;
  source: string;
  message: string;
}): Promise<void> => {
  const leadId = `LEAD-${Date.now()}`;
  const now = new Date().toISOString();

  await appendSheetData("Leads!A:K", [
    [
      leadId,
      lead.name,
      lead.email,
      lead.phone,
      lead.source,
      "new",
      "", // assigned rep
      "0",
      now,
      now,
      lead.message,
    ],
  ]);
};

export const submitTradeApplication = async (app: {
  name: string;
  email: string;
  phone: string;
  company: string;
  profession: string;
  license: string;
  website: string;
  message: string;
}): Promise<void> => {
  const appId = `TRADE-${Date.now()}`;
  const now = new Date().toISOString();

  await appendSheetData("Trade_Applications!A:H", [
    [
      appId,
      app.company,
      app.profession,
      app.license,
      "pending",
      now,
      "",
      `${app.name} | ${app.email} | ${app.phone} | ${app.website} | ${app.message}`,
    ],
  ]);
};

export const submitNewsletter = async (email: string): Promise<void> => {
  const now = new Date().toISOString();
  await appendSheetData("Newsletter!A:C", [[email, now, "active"]]);
};

export const submitShowroomBooking = async (booking: {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  notes: string;
}): Promise<void> => {
  const bookingId = `BOOK-${Date.now()}`;
  const now = new Date().toISOString();

  await appendSheetData("Bookings!A:H", [
    [
      bookingId,
      booking.name,
      booking.email,
      booking.phone,
      booking.date,
      booking.time,
      "pending",
      `${now} | ${booking.notes}`,
    ],
  ]);
};
