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
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { GoogleAuth } from "google-auth-library";
import { sheets as sheetsApi } from "@googleapis/sheets";
import { getGooglePrivateKey } from "./google-private-key";
import {
  getOdooStockQuants,
  getOdooStockLocations,
} from "./odoo-sheets";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID_PRODUCTS_FULL ?? "";
const TAB = "Products";
const TTL_MS = 30 * 60 * 1000;

// Local product image inventory. ~4.2k JPGs in public/products/odoo/<id>.jpg
// where <id> matches the Odoo product id used as ProductFull.id. We scan the
// directory once at module init and gate imageSrc on membership so the
// catalog never emits <img> tags pointing at 404s. Empty set = no images
// served (e.g. fresh checkout where the bundle hasn't been fetched yet).
const PRODUCT_IMAGE_DIR = join(process.cwd(), "public", "products", "odoo");
const productImageIds: Set<string> = (() => {
  try {
    const files = readdirSync(PRODUCT_IMAGE_DIR);
    const ids = new Set<string>();
    for (const f of files) {
      if (f.endsWith(".jpg")) ids.add(f.slice(0, -4));
    }
    return ids;
  } catch {
    return new Set<string>();
  }
})();

/**
 * Builds a Map<product_id, totalQty> by summing stock quants across all
 * INTERNAL-usage locations (CC's own warehouse + Laredo consolidators).
 * Excludes virtual buckets (vendors, customers, transit, scrap) so the
 * count reflects real CC-owned inventory the customer could ship.
 *
 * Returns an empty Map if either mirror table is empty/unreachable —
 * the page renders the catalog without "In stock" badges, never errors.
 */
const buildStockMap = async (): Promise<Map<string, number>> => {
  const out = new Map<string, number>();
  try {
    const [quants, locations] = await Promise.all([
      getOdooStockQuants(),
      getOdooStockLocations().catch(() => []),
    ]);
    // Build a quick set of internal-location IDs.
    const internalLocIds = new Set<string>();
    for (const l of locations) {
      if (l.usage === "internal" && l.id) internalLocIds.add(l.id);
    }
    for (const q of quants) {
      // If we couldn't load locations, fall back to summing all quants —
      // imperfect but better than zero stock everywhere.
      if (internalLocIds.size > 0 && !internalLocIds.has(q.location_id_id)) {
        continue;
      }
      const productId = q.product_id_id;
      if (!productId) continue;
      const qty = parseFloat(q.quantity) || 0;
      if (qty <= 0) continue;
      out.set(productId, (out.get(productId) ?? 0) + qty);
    }
  } catch (err) {
    console.warn(
      "[products-full] stock map build failed; rendering without stock badges:",
      err instanceof Error ? err.message : err
    );
  }
  return out;
};

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
  /** Total units across CC's internal warehouse locations
   *  (CC own warehouse + Laredo consolidators). Surfaced as
   *  the "In stock" badge on the public catalog. Optional so
   *  manually-constructed ProductFull objects (preview UIs,
   *  fixtures) don't have to provide it. */
  stockQty?: number;
  /** Convenience flag — `stockQty > 0`. Optional same as above. */
  inStock?: boolean;
  /** Public path to the product thumbnail when one exists locally
   *  (`/products/odoo/<id>.jpg`). Undefined when no image is bundled
   *  so the UI can fall back to typography without trying a 404. */
  imageSrc?: string;
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

const EMPTY_CACHE: Cache = {
  products: [],
  byBrand: new Map(),
  brandCounts: [],
  categoryCounts: { bathroom: 0, kitchen: 0, hardware: 0 },
  ts: 0,
};

const normalizeCategory = (c: string): ProductCategory => {
  if (c === "kitchen" || c === "hardware") return c;
  return "bathroom";
};

const load = async (): Promise<Cache> => {
  // SHEET_ID presence is guarded by getCache; this is a second belt.
  if (!SHEET_ID) return EMPTY_CACHE;

  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: getGooglePrivateKey(),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = sheetsApi({ version: "v4", auth });

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

  // Stock map fetched in parallel with the product rows so the join is
  // hot when we walk the rows.
  const stockMap = await buildStockMap();

  for (const row of data) {
    const name = (row[iName] ?? "").toString();
    const sku = (row[iSku] ?? "").toString();
    const brand = (row[iBrand] ?? "").toString();
    const category = normalizeCategory((row[iCat] ?? "").toString());
    const id = (row[iId] ?? "").toString();
    const stockQty = stockMap.get(id) ?? 0;
    const imageSrc = productImageIds.has(id)
      ? `/products/odoo/${id}.jpg`
      : undefined;
    const p: IndexedProduct = {
      id,
      name,
      sku,
      brand,
      category,
      listPrice: Number(row[iPrice]) || 0,
      currency: (row[iCur] ?? "MXN").toString(),
      uom: (row[iUom] ?? "Units").toString(),
      active: (row[iActive] ?? "").toString() === "true",
      saleOk: (row[iSaleOk] ?? "").toString() === "true",
      stockQty,
      inStock: stockQty > 0,
      imageSrc,
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

// Kicks off a refresh if one isn't already in flight. The returned promise
// is the same one stored in `loading`, so concurrent callers coalesce on a
// single Sheet fetch instead of stampeding.
const beginLoad = (): Promise<Cache> => {
  if (loading) return loading;
  loading = load()
    .then((c) => {
      cache = c;
      loading = null;
      return c;
    })
    .catch((err) => {
      loading = null;
      console.error("[products-full] load failed:", err);
      return cache ?? EMPTY_CACHE;
    });
  return loading;
};

// Stale-while-revalidate. The 354k-row sheet load takes 10-20s; blocking on
// it every 30 minutes per Lambda instance is what makes the public site feel
// slow. Behavior:
//   - Fresh cache → return immediately.
//   - Stale cache → return stale data immediately, refresh in background.
//   - No cache + sheet configured → block on first load (cold-start cost
//     paid once per Lambda).
//   - No cache + no SHEET_ID (e.g. build) → return empty cache.
const getCache = async (): Promise<Cache> => {
  if (cache) {
    if (Date.now() - cache.ts >= TTL_MS && SHEET_ID) {
      // Fire-and-forget; result is captured into `cache` by beginLoad's then.
      void beginLoad();
    }
    return cache;
  }
  if (!SHEET_ID) return EMPTY_CACHE;
  return beginLoad();
};

export type SearchSort =
  | "relevance"
  | "most_specified"
  | "alpha"
  | "price_asc"
  | "price_desc";

export interface SearchOptions {
  q?: string;
  brand?: string;
  category?: ProductCategory | "all";
  activeOnly?: boolean;
  saleOnly?: boolean;
  /** Filter to products with current internal-warehouse stock > 0. */
  inStockOnly?: boolean;
  limit?: number;
  offset?: number;
  sort?: SearchSort;
  /** When provided, decorate returned items with signal flags and sort
   *  most_specified using this score map. */
  specScores?: Map<string, { weightedScore: number; projectCount: number }>;
  inShowroomIds?: Set<string>;
}

export interface ProductFullWithSignals extends ProductFull {
  inShowroom?: boolean;
  projectCount?: number;
}

export interface SearchResult {
  items: ProductFullWithSignals[];
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
  stockQty: p.stockQty,
  inStock: p.inStock,
  imageSrc: p.imageSrc,
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
    inStockOnly,
    limit = 100,
    offset = 0,
    sort = "relevance",
    specScores,
    inShowroomIds,
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
      if (inStockOnly && !p.inStock) continue;
      scored.push({ p, s });
    }
    if (sort === "most_specified" && specScores) {
      // Blend relevance × spec boost so best-matching + most-specified float up.
      scored.sort((a, b) => {
        const sA = a.s * (1 + Math.log(1 + (specScores.get(a.p.id)?.projectCount ?? 0)));
        const sB = b.s * (1 + Math.log(1 + (specScores.get(b.p.id)?.projectCount ?? 0)));
        return sB - sA || a.p._sku.localeCompare(b.p._sku);
      });
    } else if (sort === "alpha") {
      scored.sort((a, b) =>
        (a.p.name || a.p.sku).localeCompare(b.p.name || b.p.sku)
      );
    } else if (sort === "price_asc") {
      scored.sort((a, b) => a.p.listPrice - b.p.listPrice);
    } else if (sort === "price_desc") {
      scored.sort((a, b) => b.p.listPrice - a.p.listPrice);
    } else {
      scored.sort((a, b) => b.s - a.s || a.p._sku.localeCompare(b.p._sku));
    }
    matched = scored.map((x) => x.p);
  } else {
    // No query — filter pool, then sort if requested.
    matched = pool.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (activeOnly && !p.active) return false;
      if (saleOnly && !p.saleOk) return false;
      if (inStockOnly && !p.inStock) return false;
      return true;
    });
    if (sort === "most_specified" && specScores) {
      matched = [...matched].sort((a, b) => {
        const sA = specScores.get(a.id)?.weightedScore ?? 0;
        const sB = specScores.get(b.id)?.weightedScore ?? 0;
        return sB - sA || a._sku.localeCompare(b._sku);
      });
    } else if (sort === "alpha") {
      matched = [...matched].sort((a, b) =>
        (a.name || a.sku).localeCompare(b.name || b.sku)
      );
    } else if (sort === "price_asc") {
      matched = [...matched].sort((a, b) => a.listPrice - b.listPrice);
    } else if (sort === "price_desc") {
      matched = [...matched].sort((a, b) => b.listPrice - a.listPrice);
    }
  }

  const page = matched.slice(offset, offset + limit);
  const items: ProductFullWithSignals[] = page.map((p) => {
    const base: ProductFullWithSignals = stripIndex(p);
    if (inShowroomIds?.has(p.id)) base.inShowroom = true;
    const spec = specScores?.get(p.id);
    if (spec && spec.projectCount > 0) base.projectCount = spec.projectCount;
    return base;
  });
  return {
    items,
    total: matched.length,
    offset,
    limit,
    elapsedMs: Date.now() - t0,
    cacheAgeMs: Date.now() - c.ts,
  };
};

/**
 * Returns the number of catalog products currently in stock at any
 * internal warehouse (CC's own + Laredo consolidators). Used by hero
 * banners + filter chip counters.
 */
export const getInStockCount = async (): Promise<number> => {
  const c = await getCache();
  let count = 0;
  for (const p of c.products) if (p.inStock) count += 1;
  return count;
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

// ── Variants (same SKU family, different finish) ────────────────────────
// Heuristic: many SKUs end with a short alphanumeric "finish code" suffix
// separated by "-" (e.g. Brizo "BRI- 63054LF-GL" / "-PC" / "-BN"). Strip
// that suffix to get the SKU root, then find all products sharing it.

const SKU_FINISH_SUFFIX = /^(.+?)[-_ ]([A-Z0-9]{1,6})$/i;

/** Extract the SKU root if a plausible finish suffix exists. Returns null
 *  if no variant split is detectable (e.g. Emtek monolithic SKUs). */
export const extractSkuRoot = (sku: string): string | null => {
  if (!sku) return null;
  const m = SKU_FINISH_SUFFIX.exec(sku.trim());
  if (!m) return null;
  const root = m[1].trim();
  // Reject weird short roots that would match thousands of unrelated SKUs.
  if (root.length < 4) return null;
  return root;
};

export interface ProductVariant extends ProductFull {
  finishCode: string; // the trailing segment that differs across variants
}

export const getVariants = async (
  sku: string,
  excludeId?: string
): Promise<ProductVariant[]> => {
  const root = extractSkuRoot(sku);
  if (!root) return [];
  const c = await getCache();
  const rootLower = root.toLowerCase();
  const out: ProductVariant[] = [];
  for (const p of c.products) {
    if (excludeId && p.id === excludeId) continue;
    // Case-insensitive prefix match against the root
    if (!p._sku.startsWith(rootLower)) continue;
    // Must have a distinct finish-code tail (not the exact same SKU)
    if (p._sku === sku.toLowerCase()) continue;
    // Parse the finish tail from the full sku (preserving case)
    const m = SKU_FINISH_SUFFIX.exec(p.sku);
    if (!m) continue;
    out.push({ ...stripIndex(p), finishCode: m[2] });
    if (out.length >= 50) break;
  }
  // Sort by finish code for stable rendering
  out.sort((a, b) => a.finishCode.localeCompare(b.finishCode));
  return out;
};

// ── Same-brand recommendations ──────────────────────────────────────────

export const getSameBrand = async (
  brand: string,
  excludeId: string,
  limit = 10
): Promise<ProductFull[]> => {
  const c = await getCache();
  const pool = c.byBrand.get(brand) ?? [];
  return pool
    .filter((p) => p.id !== excludeId && p.saleOk)
    .slice(0, limit)
    .map(stripIndex);
};

// ── Brand Atelier: summary + signature collection ──────────────────────

export interface BrandSummary {
  brand: string;
  count: number;
  saleableCount: number;
  categoryCounts: Record<ProductCategory, number>;
  signature: ProductFull[]; // top N products, preferring specified featuredIds
}

/**
 * Brand-level aggregate used by /brands/[slug] pages. Matches on the
 * canonical brand name as it appears in the catalog. When `featuredIds`
 * is provided, those products are placed first (in order) before filling
 * the rest from the brand's saleable pool.
 */
export const getBrandSummary = async (
  brandName: string,
  { featuredIds = [], limit = 12 }: { featuredIds?: string[]; limit?: number } = {}
): Promise<BrandSummary> => {
  const c = await getCache();
  const pool = c.byBrand.get(brandName) ?? [];
  const saleable = pool.filter((p) => p.saleOk);

  const categoryCounts: Record<ProductCategory, number> = {
    bathroom: 0,
    kitchen: 0,
    hardware: 0,
  };
  for (const p of pool) categoryCounts[p.category]++;

  // Signature: featured IDs first (in order), then fill with remaining saleable
  const byId = new Map(saleable.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const signature: IndexedProduct[] = [];
  for (const id of featuredIds) {
    const hit = byId.get(id);
    if (hit && !seen.has(hit.id)) {
      signature.push(hit);
      seen.add(hit.id);
      if (signature.length >= limit) break;
    }
  }
  for (const p of saleable) {
    if (signature.length >= limit) break;
    if (!seen.has(p.id)) {
      signature.push(p);
      seen.add(p.id);
    }
  }

  return {
    brand: brandName,
    count: pool.length,
    saleableCount: saleable.length,
    categoryCounts,
    signature: signature.map(stripIndex),
  };
};

// ── Brand × Category: programmatic SEO pages ───────────────────────────

export interface BrandCategorySummary {
  brand: string;
  category: ProductCategory;
  count: number; // total saleable products in this brand × category
  totalCount: number; // including non-saleable
  products: ProductFullWithSignals[];
}

/**
 * Per-(brand, category) aggregate used by `/brands/[slug]/[category]` pages.
 * Sorted by `specScores.weightedScore` when provided so projects-with-history
 * float to the top of the SEO grid; falls back to stable SKU order otherwise.
 */
export const getBrandCategorySummary = async (
  brandName: string,
  category: ProductCategory,
  {
    limit = 24,
    specScores,
    inShowroomIds,
  }: {
    limit?: number;
    specScores?: Map<string, { weightedScore: number; projectCount: number }>;
    inShowroomIds?: Set<string>;
  } = {}
): Promise<BrandCategorySummary> => {
  const c = await getCache();
  const pool = (c.byBrand.get(brandName) ?? []).filter(
    (p) => p.category === category
  );
  const saleable = pool.filter((p) => p.saleOk && p.active);

  const sorted = specScores
    ? [...saleable].sort((a, b) => {
        const sA = specScores.get(a.id)?.weightedScore ?? 0;
        const sB = specScores.get(b.id)?.weightedScore ?? 0;
        return sB - sA || a._sku.localeCompare(b._sku);
      })
    : saleable;

  const products: ProductFullWithSignals[] = sorted.slice(0, limit).map((p) => {
    const base: ProductFullWithSignals = stripIndex(p);
    if (inShowroomIds?.has(p.id)) base.inShowroom = true;
    const spec = specScores?.get(p.id);
    if (spec && spec.projectCount > 0) base.projectCount = spec.projectCount;
    return base;
  });

  return {
    brand: brandName,
    category,
    count: saleable.length,
    totalCount: pool.length,
    products,
  };
};

/**
 * Returns brand × category combinations that meet a minimum-count threshold,
 * suitable for static prerendering. Defaults to ≥10 saleable products to
 * avoid thin-content SEO pages.
 */
export const getBrandCategoryCombos = async (
  minCount = 10
): Promise<Array<{ brand: string; category: ProductCategory; count: number }>> => {
  const c = await getCache();
  const out: Array<{ brand: string; category: ProductCategory; count: number }> = [];
  for (const [brand, products] of c.byBrand) {
    const counts: Record<ProductCategory, number> = {
      bathroom: 0,
      kitchen: 0,
      hardware: 0,
    };
    for (const p of products) {
      if (p.saleOk && p.active) counts[p.category]++;
    }
    for (const cat of ["bathroom", "kitchen", "hardware"] as const) {
      if (counts[cat] >= minCount) out.push({ brand, category: cat, count: counts[cat] });
    }
  }
  return out;
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
