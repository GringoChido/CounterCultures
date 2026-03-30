/**
 * Google Sheets API v4 wrapper
 *
 * This is the single source of truth for all data operations.
 * In production, this reads/writes to the "Counter Cultures CRM" spreadsheet.
 *
 * For development, we fall back to sample data from constants.ts.
 * To enable the Sheets API:
 * 1. Create a Google Cloud service account
 * 2. Share the spreadsheet with the service account email
 * 3. Set GOOGLE_SHEETS_ID and GOOGLE_SERVICE_ACCOUNT_KEY env vars
 */

import type { Product, ProductFilter } from "./types";
import { SAMPLE_PRODUCTS } from "./constants";

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

const isConfigured = () => Boolean(SHEETS_ID && SERVICE_ACCOUNT_KEY);

// --- Auth ---

const getAuthToken = async (): Promise<string> => {
  if (!SERVICE_ACCOUNT_KEY) throw new Error("Google Service Account key not configured");

  const key = JSON.parse(SERVICE_ACCOUNT_KEY);
  const now = Math.floor(Date.now() / 1000);

  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = btoa(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  // In production, sign with the private key using Web Crypto or a JWT library
  // For now, this is a placeholder — install googleapis or jose for proper JWT signing
  const token = `${header}.${claim}`;
  return token;
};

// --- Read Operations ---

const fetchSheetData = async (
  range: string
): Promise<string[][]> => {
  if (!isConfigured()) return [];

  const token = await getAuthToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`Sheets API error: ${res.status}`);

  const data = await res.json();
  return data.values || [];
};

// --- Write Operations ---

const appendSheetData = async (
  range: string,
  values: string[][]
): Promise<void> => {
  if (!isConfigured()) {
    console.log("[Sheets] Not configured — skipping write:", range, values);
    return;
  }

  const token = await getAuthToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) throw new Error(`Sheets API write error: ${res.status}`);
};

// --- Product Helpers ---

const rowToProduct = (row: string[], index: number): Product => ({
  id: row[0] || String(index),
  sku: row[1] || "",
  brand: row[2] || "",
  name: row[3] || "",
  nameEn: row[4] || row[3] || "",
  category: (row[5] as Product["category"]) || "bathroom",
  subcategory: row[6] || "",
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
  slug: row[17] || row[3]?.toLowerCase().replace(/\s+/g, "-") || "",
});

// --- Public API ---

export const getProducts = async (
  filter?: ProductFilter
): Promise<Product[]> => {
  if (!isConfigured()) {
    // Development: use sample data
    let products: Product[] = (SAMPLE_PRODUCTS as ReadonlyArray<typeof SAMPLE_PRODUCTS[number]>).map((p) => {
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
        descriptionEn: (record.descriptionEn as string) || (record.description as string) || "",
        availability: "in-stock" as const,
        slug: (record.slug as string) || p.name.toLowerCase().replace(/\s+/g, "-"),
        specifications: record.specifications as Record<string, string> | undefined,
      };
    });

    if (filter?.category) {
      products = products.filter((p) => p.category === filter.category);
    }
    if (filter?.subcategory) {
      products = products.filter((p) => p.subcategory === filter.subcategory);
    }
    if (filter?.brand) {
      products = products.filter(
        (p) => p.brand.toLowerCase() === filter.brand?.toLowerCase()
      );
    }
    if (filter?.artisanal !== undefined) {
      products = products.filter((p) => p.artisanal === filter.artisanal);
    }
    if (filter?.minPrice) {
      products = products.filter((p) => p.price >= (filter.minPrice ?? 0));
    }
    if (filter?.maxPrice) {
      products = products.filter((p) => p.price <= (filter.maxPrice ?? Infinity));
    }

    return products;
  }

  const rows = await fetchSheetData("Products!A2:R");
  let products = rows.map(rowToProduct);

  if (filter?.category) {
    products = products.filter((p) => p.category === filter.category);
  }
  if (filter?.subcategory) {
    products = products.filter((p) => p.subcategory === filter.subcategory);
  }
  if (filter?.brand) {
    products = products.filter(
      (p) => p.brand.toLowerCase() === filter.brand?.toLowerCase()
    );
  }
  if (filter?.artisanal !== undefined) {
    products = products.filter((p) => p.artisanal === filter.artisanal);
  }
  if (filter?.minPrice) {
    products = products.filter((p) => p.price >= (filter.minPrice ?? 0));
  }
  if (filter?.maxPrice) {
    products = products.filter((p) => p.price <= (filter.maxPrice ?? Infinity));
  }

  return products;
};

export const getProductBySlug = async (
  slug: string
): Promise<Product | null> => {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) || null;
};

export const getProductsByBrand = async (brand: string): Promise<Product[]> => {
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

// --- Lead Operations ---

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
