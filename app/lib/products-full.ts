/**
 * Full Odoo product catalog (354,449 rows) — cached in-memory reader + search.
 *
 * Source: dedicated spreadsheet `CC_Products_Full` (GOOGLE_SHEETS_ID_PRODUCTS_FULL).
 * Separate spreadsheet because 354k × 10 cols = 3.5M cells and the main CRM
 * sheet is near its 10M cell cap with the 16 Odoo_* tabs.
 *
 * Browser never sees the full list — all search/filter runs server-side.
 * 30-min TTL keeps the Sheets API quiet while Roger continues to use Odoo.
 *
 * We don't use Fuse.js because SKU-heavy architectural hardware searches
 * ("CRL", "US10B", "MB") need exact substring matching, not fuzzy. Ranked
 * substring scoring (sku-prefix > sku-contains > name-prefix > name-contains
 * > brand-contains) is both faster and more correct.
 */
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID_PRODUCTS_FULL ?? "";
const TAB = "Products";
const TTL_MS = 30 * 60 * 1000;

export type ProductCategory = "bathroom" | "kitchen" | "hardware";

export interface ProductFull {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: ProductCategory;
  listPrice: number;
  currency: string;
  uom: string;
  active: boolean;
  saleOk: boolean;
}

interface IndexedProduct extends ProductFull {
  _sku: string;  // lowercased sku
  _name: string; // lowercased name
  _brand: string; // lowercased brand
}

export interface BrandCount {
  brand: string;
  count: number;
}

interface Cache {
  products: IndexedProduct[];
  byBrand: Map<string, IndexedProduct[]>;
  brandCounts: BrandCount[];
  categoryCounts: Record<ProductCategory, number>;
  ts: number;
}

let cache: Cache | null = null;
let loading: Promise<Cache> | null = null;

const normalizeCategory = (c: string): ProductCategory => {
  if (c === "kitchen" || c === "hardware") return c;
  return "bathroom";
};

const load = async (): Promise<Cache> => {
  if (!SHEET_ID) {
    throw new Error(
      "GOOGLE_SHEETS_ID_PRODUCTS_FULL env var is not set. Set it in .env.local."
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // Single call — 354k rows × 10 cols comes back in ~10-20s.
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A:J`,
  });
  const rows = res.data.values;
  if (!rows || rows.length < 2) {
    throw new Error(`CC_Products_Full returned no data`);
  }

  const [header, ...data] = rows;
  const idx = (col: string) => header.indexOf(col);
  const iId = idx("id");
  const iName = idx("name");
  const iSku = idx("sku");
  const iBrand = idx("brand");
  const iCat = idx("category");
  const iPrice = idx("list_price");
  const iCur = idx("currency");
  const iUom = idx("uom");
  const iActive = idx("active");
  const iSaleOk = idx("sale_ok");

  const products: IndexedProduct[] = [];
  const brandAgg = new Map<string, number>();
  const categoryCounts: Record<ProductCategory, number> = {
    bathroom: 0,
    kitchen: 0,
    hardware: 0,
  };

  for (const row of data) {
    const name = (row[iName] ?? "").toString();
    const sku = (row[iSku] ?? "").toString();
    const brand = (row[iBrand] ?? "").toString();
    const category = normalizeCategory((row[iCat] ?? "").toString());
    const p: IndexedProduct = {
      id: (row[iId] ?? "").toString(),
      name,
      sku,
      brand,
      category,
      listPrice: Number(row[iPrice]) || 0,
      currency: (row[iCur] ?? "MXN").toString(),
      uom: (row[iUom] ?? "Units").toString(),
      active: (row[iActive] ?? "").toString() === "true",
      saleOk: (row[iSaleOk] ?? "").toString() === "true",
      _sku: sku.toLowerCase(),
      _name: name.toLowerCase(),
      _brand: brand.toLowerCase(),
    };
    products.push(p);
    brandAgg.set(brand, (brandAgg.get(brand) ?? 0) + 1);
    categoryCounts[category]++;
  }

  const brandCounts: BrandCount[] = [...brandAgg.entries()]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count);

  // Group by brand once, reused by browse-by-brand paths.
  const byBrand = new Map<string, IndexedProduct[]>();
  for (const p of products) {
    const list = byBrand.get(p.brand);
    if (list) list.push(p);
    else byBrand.set(p.brand, [p]);
  }

  return {
    products,
    byBrand,
    brandCounts,
    categoryCounts,
    ts: Date.now(),
  };
};

const getCache = async (): Promise<Cache> => {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache;
  if (loading) return loading;
  loading = load().then((c) => {
    cache = c;
    loading = null;
    return c;
  }).catch((err) => {
    loading = null;
    throw err;
  });
  return loading;
};

export interface SearchOptions {
  q?: string;
  brand?: string;
  category?: ProductCategory | "all";
  activeOnly?: boolean;
  saleOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  items: ProductFull[];
  total: number;
  offset: number;
  limit: number;
  elapsedMs: number;
  cacheAgeMs: number;
}

const stripIndex = (p: IndexedProduct): ProductFull => ({
  id: p.id,
  name: p.name,
  sku: p.sku,
  brand: p.brand,
  category: p.category,
  listPrice: p.listPrice,
  currency: p.currency,
  uom: p.uom,
  active: p.active,
  saleOk: p.saleOk,
});

// Scored substring match. Higher score = better match.
// 100: sku exact match
//  80: sku starts with q
//  60: name starts with q
//  40: sku contains q
//  30: name contains q
//  20: brand contains q
//   0: no match
const scoreRow = (p: IndexedProduct, q: string): number => {
  if (p._sku === q) return 100;
  if (p._sku.startsWith(q)) return 80;
  if (p._name.startsWith(q)) return 60;
  if (p._sku.includes(q)) return 40;
  if (p._name.includes(q)) return 30;
  if (p._brand.includes(q)) return 20;
  return 0;
};

export const searchProducts = async (
  opts: SearchOptions = {}
): Promise<SearchResult> => {
  const t0 = Date.now();
  const {
    q = "",
    brand,
    category = "all",
    activeOnly,
    saleOnly,
    limit = 100,
    offset = 0,
  } = opts;

  const c = await getCache();
  const query = q.trim().toLowerCase();

  // Pick candidate pool: brand-filtered if a brand is specified.
  const pool =
    brand && c.byBrand.has(brand) ? c.byBrand.get(brand)! : c.products;

  let matched: IndexedProduct[];
  if (query) {
    // Score each candidate; keep only non-zero. For ranked search we need the
    // full list before slicing (scores vary).
    const scored: Array<{ p: IndexedProduct; s: number }> = [];
    for (const p of pool) {
      const s = scoreRow(p, query);
      if (s === 0) continue;
      if (category !== "all" && p.category !== category) continue;
      if (activeOnly && !p.active) continue;
      if (saleOnly && !p.saleOk) continue;
      scored.push({ p, s });
    }
    scored.sort((a, b) => b.s - a.s || a.p._sku.localeCompare(b.p._sku));
    matched = scored.map((x) => x.p);
  } else {
    // No query — just filter + sort by sku for stable browse.
    matched = pool.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (activeOnly && !p.active) return false;
      if (saleOnly && !p.saleOk) return false;
      return true;
    });
    // Already sorted by id at extract time; for alpha-browse keep as-is to
    // avoid a 354k sort on empty-query calls.
  }

  const items = matched.slice(offset, offset + limit).map(stripIndex);
  return {
    items,
    total: matched.length,
    offset,
    limit,
    elapsedMs: Date.now() - t0,
    cacheAgeMs: Date.now() - c.ts,
  };
};

export const getBrandCounts = async (): Promise<BrandCount[]> => {
  return (await getCache()).brandCounts;
};

export const getCategoryCounts = async (): Promise<
  Record<ProductCategory, number>
> => {
  return (await getCache()).categoryCounts;
};

export const getProductById = async (
  id: string
): Promise<ProductFull | null> => {
  const c = await getCache();
  const p = c.products.find((x) => x.id === id);
  return p ? stripIndex(p) : null;
};

export const getCatalogStats = async (): Promise<{
  total: number;
  brandCount: number;
  cacheAgeMs: number;
  ttlMs: number;
}> => {
  const c = await getCache();
  return {
    total: c.products.length,
    brandCount: c.brandCounts.length,
    cacheAgeMs: Date.now() - c.ts,
    ttlMs: TTL_MS,
  };
};

// ── Public quote-catalog adapter ────────────────────────────────────────
// The /shop/quote page uses the portal-wide `Product` shape. These helpers
// adapt ProductFull → Product with a deterministic `p-{id}` slug. Price and
// images are deliberately blank on the quote surface — customers request a
// quote; they don't see MXN list prices.

import type { Product } from "./types";

const slugFor = (id: string) => `p-${id}`;

const toQuoteProduct = (p: ProductFull): Product => ({
  id: p.id,
  sku: p.sku || `ODOO-${p.id}`,
  brand: p.brand,
  name: p.name || p.sku || `Product ${p.id}`,
  nameEn: p.name || p.sku || `Product ${p.id}`,
  category: p.category,
  subcategory: "",
  price: 0,
  currency: (p.currency === "USD" ? "USD" : "MXN") as "MXN" | "USD",
  finishes: [],
  images: [],
  artisanal: false,
  description: "",
  descriptionEn: "",
  availability: "quote_only" as const,
  slug: slugFor(p.id),
});

export interface QuoteCatalogSearchOptions {
  q?: string;
  category?: ProductCategory;
  brand?: string;
  limit?: number;
  offset?: number;
}

export interface QuoteCatalogSearchResult {
  items: Product[];
  total: number;
  offset: number;
  limit: number;
  elapsedMs: number;
}

export const searchQuoteCatalog = async (
  opts: QuoteCatalogSearchOptions = {}
): Promise<QuoteCatalogSearchResult> => {
  const { q, category, brand, limit = 48, offset = 0 } = opts;
  const r = await searchProducts({
    q,
    brand,
    category: category ?? "all",
    saleOnly: true, // only sellable products on public catalog
    limit,
    offset,
  });
  return {
    items: r.items.map(toQuoteProduct),
    total: r.total,
    offset: r.offset,
    limit: r.limit,
    elapsedMs: r.elapsedMs,
  };
};

export const getQuoteCatalogBySlug = async (
  slug: string
): Promise<Product | null> => {
  // slug format: "p-{odoo_id}"
  if (!slug.startsWith("p-")) return null;
  const id = slug.slice(2);
  const p = await getProductById(id);
  return p ? toQuoteProduct(p) : null;
};

export const getQuoteCatalogBrands = async (): Promise<BrandCount[]> => {
  const c = await getCache();
  // Only expose sellable-brand counts on public surface.
  const agg = new Map<string, number>();
  for (const p of c.products) {
    if (!p.saleOk) continue;
    agg.set(p.brand, (agg.get(p.brand) ?? 0) + 1);
  }
  return [...agg.entries()]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count);
};
