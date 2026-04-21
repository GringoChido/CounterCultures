import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";
import {
  searchQuoteProducts,
  type QuoteSearchResult,
} from "@/app/lib/sheets";
import type { Product } from "@/app/lib/types";
import { searchRead, isConfigured as odooConfigured } from "@/app/lib/odoo/client";

const LIVE_LOOKUP_THRESHOLD = 5;
const LIVE_LOOKUP_LIMIT = 20;

const BRAND_CATEGORY: Record<string, Product["category"]> = {
  emtek: "hardware", baldwin: "hardware", "sun valley bronze": "hardware",
  "rocky mountain": "hardware", amerock: "hardware", deltana: "hardware",
  blanco: "kitchen", teka: "kitchen", bluestar: "kitchen", viking: "kitchen",
  smeg: "kitchen", asko: "kitchen", elkay: "kitchen", ruvati: "kitchen",
  toto: "bathroom", hansgrohe: "bathroom", axor: "bathroom", dornbracht: "bathroom",
  grohe: "bathroom", "kingston brass": "bathroom", waterworks: "bathroom",
  watermark: "bathroom", duravit: "bathroom", phylrich: "bathroom",
  "california faucets": "bathroom", brizo: "bathroom", delta: "bathroom",
  kohler: "bathroom", jcr: "bathroom",
};

const KITCHEN_RE = /\b(cocina|kitchen|tarja|fregadero|campana|range.?hood|pot.?filler|stove|oven|dishwasher|sink)\b/i;
const HARDWARE_RE = /\b(chapa|cerradura|deadbolt|entry.?set|door.?lock|handleset|jaladera|cabinet.?pull|knob|pull|hinge|latch|mortise)\b/i;

const inferCategory = (name: string, brand: string): Product["category"] => {
  const brandLo = brand.toLowerCase();
  for (const [k, cat] of Object.entries(BRAND_CATEGORY)) {
    if (brandLo.includes(k)) {
      if (KITCHEN_RE.test(name)) return "kitchen";
      if (HARDWARE_RE.test(name)) return "hardware";
      return cat;
    }
  }
  if (KITCHEN_RE.test(name)) return "kitchen";
  if (HARDWARE_RE.test(name)) return "hardware";
  return "bathroom";
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-")
    .replace(/-{2,}/g, "-").replace(/^-|-$/g, "").slice(0, 80);

interface OdooProductRow {
  id: number;
  name: string | false;
  default_code: string | false;
  categ_id: [number, string] | false;
  barcode: string | false;
  description_sale: string | false;
  list_price: number | false;
}

const odooRowToProduct = (row: OdooProductRow): Product => {
  const id = String(row.id);
  const sku = (row.default_code || `ODOO-${id}`) as string;
  const brand = (row.categ_id ? row.categ_id[1] : "") as string;
  const name = (row.name || sku) as string;
  const desc = (row.description_sale || "") as string;
  return {
    id,
    sku,
    brand,
    name,
    nameEn: name,
    category: inferCategory(name, brand),
    subcategory: "",
    price: 0,
    currency: "MXN",
    finishes: [],
    images: [],
    artisanal: false,
    description: desc,
    descriptionEn: desc,
    availability: "quote_only",
    slug: `${slugify(name) || `product-${id}`}-${id}`,
  };
};

const productToRow = (p: Product): string[] => [
  p.id, p.sku, p.brand, p.name, p.nameEn, p.category, p.subcategory,
  "", "", p.currency, p.finishes.join(","), "",
  String(p.artisanal), p.description, p.descriptionEn,
  p.availability, String(p.featured ?? false), p.slug,
];

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;

const appendToQuoteTab = async (products: Product[]): Promise<void> => {
  if (!SHEETS_ID || products.length === 0) return;
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEETS_ID,
    range: "Products_Quote!A:R",
    valueInputOption: "RAW",
    requestBody: { values: products.map(productToRow) },
  });
};

const searchOdooQuoteOnly = async (q: string): Promise<Product[]> => {
  if (!odooConfigured() || !q.trim()) return [];
  const needle = q.trim();
  const domain = [
    "|",
    ["name", "ilike", needle],
    ["default_code", "ilike", needle],
    ["active", "=", true],
  ];
  const rows = (await searchRead(
    "product.product",
    [domain],
    ["id", "name", "default_code", "categ_id", "barcode", "description_sale", "list_price"],
    LIVE_LOOKUP_LIMIT,
    0,
    "id desc"
  )) as unknown as OdooProductRow[];
  return rows.map(odooRowToProduct);
};

export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  const category = sp.get("category") ?? undefined;
  const brand = sp.get("brand") ?? undefined;
  const limit = Math.min(Number(sp.get("limit") ?? 48), 100);
  const offset = Math.max(Number(sp.get("offset") ?? 0), 0);

  try {
    const cached: QuoteSearchResult = await searchQuoteProducts({
      q, category, brand, limit, offset,
    });

    const shouldLiveLookup =
      q.trim().length >= 2 &&
      cached.total < LIVE_LOOKUP_THRESHOLD &&
      odooConfigured();

    if (!shouldLiveLookup) {
      return NextResponse.json({ ...cached, source: "cache" as const });
    }

    const odooHits = await searchOdooQuoteOnly(q);
    const existingIds = new Set(cached.items.map((p) => p.id));
    const allCachedIds = new Set(
      (await searchQuoteProducts({ limit: 10_000 })).items.map((p) => p.id)
    );
    const newHits = odooHits.filter((p) => !allCachedIds.has(p.id));
    const toAppend = newHits.filter((p) => !existingIds.has(p.id));

    if (toAppend.length > 0) {
      void appendToQuoteTab(toAppend).catch((err) => {
        console.error("[quote-search] append failed:", err);
      });
    }

    const merged = [...cached.items, ...newHits].slice(0, limit);
    return NextResponse.json({
      items: merged,
      total: cached.total + newHits.length,
      offset,
      limit,
      source: "hybrid" as const,
      liveHits: newHits.length,
    });
  } catch (err) {
    console.error("[quote-search] error:", err);
    return NextResponse.json(
      { error: "Quote search failed" },
      { status: 500 }
    );
  }
};
