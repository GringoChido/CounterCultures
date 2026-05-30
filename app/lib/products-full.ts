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
import { cache as reactCache } from "react";
import { GoogleAuth } from "google-auth-library";
import { sheets as sheetsApi } from "@googleapis/sheets";
import { getGooglePrivateKey } from "./google-private-key";
import { normalize, scoreProduct } from "./search-utils";
import { toSlug } from "./slug";
import {
  getOdooStockQuants,
  getOdooStockLocations,
} from "./odoo-sheets";
import { readFileSync, existsSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Product } from "./types";
import {
  mapRowsToProducts,
  buildCacheFromProducts,
  BRAND_DISPLAY_MAP,
  type ProductFull,
  type ProductCategory,
  type BrandCount,
  type IndexedProduct,
  type SnapshotProduct,
  type Cache,
} from "./products-mapping";

// Re-export types + constants so all existing consumers keep working.
export { BRAND_DISPLAY_MAP };
export type { ProductFull, ProductCategory, BrandCount };

const SHEET_ID = process.env.GOOGLE_SHEETS_ID_PRODUCTS_FULL ?? "";
const TAB = "Products";
const TTL_MS = 30 * 60 * 1000;

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


const crmToProductFull = (p: Product): ProductFull => ({
  id: p.id,
  name: p.name,
  sku: p.sku,
  brand: p.brand,
  category: p.category,
  listPrice: p.price,
  currency: p.currency,
  uom: "Units",
  active: true,
  saleOk: p.availability !== "quote_only",
  inStock: p.availability === "in-stock",
  stockQty: p.availability === "in-stock" ? 1 : 0,
  hasImage: !!p.images?.[0],
  imageSrc: p.images?.[0],
  descriptionEs: p.description,
  descriptionEn: p.descriptionEn,
  features: p.features,
  tradePrice: p.tradePrice,
  slug: p.slug,
});

export const catalogToProduct = (p: ProductFull): Product => ({
  id: p.id,
  sku: p.sku,
  brand: p.brand,
  name: p.name,
  nameEn: p.name,
  category: p.category,
  subcategory: "",
  price: p.listPrice,
  tradePrice: p.tradePrice,
  currency: (p.currency === "USD" ? "USD" : "MXN") as "MXN" | "USD",
  finishes: p.variantLabels ?? [],
  images: p.imageSrc ? [p.imageSrc] : [],
  artisanal: false,
  description: p.descriptionEs ?? "",
  descriptionEn: p.descriptionEn ?? "",
  features: p.features,
  availability: p.inStock ? "in-stock" : "special-order",
  slug: p.slug,
  satCode: p.satCode,
  inStock: p.inStock,
  stockQty: p.stockQty,
});


let cache: Cache | null = null;
let loading: Promise<Cache> | null = null;
let warnedNoSheetId = false;
let stockLoadPending = false;

/**
 * Patch stock quantities into an already-built cache without rebuilding it.
 * Synchronous loop → atomic under Node's single-threaded model (no torn reads).
 * Guarded: only one background stock fetch runs at a time.
 */
const loadStockInBackground = (targetCache: Cache): void => {
  if (stockLoadPending) return;
  stockLoadPending = true;
  const t0 = Date.now();
  buildStockMap()
    .then((stockMap) => {
      if (cache !== targetCache) return;
      if (stockMap.size === 0) return;
      let patched = 0;
      for (const p of targetCache.products) {
        const qty = stockMap.get(p.id) ?? 0;
        p.stockQty = qty;
        p.inStock = qty > 0;
        if (qty > 0) patched++;
      }
      console.warn(
        `[products-full] Background stock patched (${patched} SKUs in-stock) in ${Date.now() - t0}ms`,
      );
    })
    .catch((err) => {
      console.warn(
        "[products-full] Background stock load failed:",
        err instanceof Error ? err.message : err,
      );
    })
    .finally(() => {
      stockLoadPending = false;
    });
};

const EMPTY_CACHE: Cache = {
  products: [],
  byBrand: new Map(),
  brandCounts: [],
  categoryCounts: { bathroom: 0, kitchen: 0, hardware: 0 },
  ts: 0,
};

const loadFromSheets = async (skipStock = false): Promise<Cache> => {
  if (!SHEET_ID) return EMPTY_CACHE;

  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: getGooglePrivateKey(),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = sheetsApi({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A:L`,
  });
  const rows = res.data.values;
  if (!rows || rows.length < 2) {
    console.warn("[products] CC_Products_Full returned no data — check GOOGLE_SHEETS_ID_PRODUCTS_FULL and service account permissions.");
    return EMPTY_CACHE;
  }

  const snapProducts = mapRowsToProducts(rows as string[][]);
  const stockMap = skipStock ? new Map<string, number>() : await buildStockMap();
  return buildCacheFromProducts(snapProducts, stockMap);
};

const metaDir = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_CANDIDATES = [
  resolve(metaDir, "generated/products-snapshot.json.gz"),
  resolve(__dirname, "generated/products-snapshot.json.gz"),
];

const loadFromSnapshot = async (skipStock = false): Promise<Cache | null> => {
  try {
    const snapshotPath = SNAPSHOT_CANDIDATES.find((p) => existsSync(p));
    if (!snapshotPath) {
      console.warn(
        `[products-full] Snapshot NOT found — metaDir=${metaDir} __dirname=${__dirname} — falling back to Sheets`,
      );
      return null;
    }
    const t0 = Date.now();
    const gzipped = readFileSync(snapshotPath);
    const json = gunzipSync(gzipped).toString("utf-8");
    const snapProducts: SnapshotProduct[] = JSON.parse(json);
    if (!Array.isArray(snapProducts) || snapProducts.length === 0) {
      console.warn("[products-full] Snapshot parsed but empty — falling back to Sheets");
      return null;
    }
    const stockMap = skipStock ? new Map<string, number>() : await buildStockMap();
    const c = buildCacheFromProducts(snapProducts, stockMap);
    console.warn(
      `[products-full] Hydrated ${c.products.length} products from snapshot in ${Date.now() - t0}ms${skipStock ? " (stock deferred to background)" : ""}`,
    );
    return c;
  } catch (err) {
    console.warn(
      "[products-full] Snapshot hydrate failed — falling back to Sheets:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
};

const load = async (skipStock = false): Promise<Cache> => {
  const fromSnapshot = await loadFromSnapshot(skipStock);
  if (fromSnapshot) return fromSnapshot;
  return loadFromSheets(skipStock);
};

// Kicks off a refresh if one isn't already in flight. The returned promise
// is the same one stored in `loading`, so concurrent callers coalesce on a
// single Sheet fetch instead of stampeding.
//
// Cold start (cache===null): skip the ~6s buildStockMap on the critical path
// so the catalog is serveable in ~2.5s. Stock patches in-place in background.
// TTL refresh (cache!==null): block on stock — users see the stale cache anyway.
const beginLoad = (): Promise<Cache> => {
  if (loading) return loading;
  const cold = cache === null;
  loading = load(cold)
    .then((c) => {
      cache = c;
      loading = null;
      if (cold) void loadStockInBackground(c);
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
  if (!SHEET_ID) {
    if (!warnedNoSheetId) {
      console.warn("[products] GOOGLE_SHEETS_ID_PRODUCTS_FULL not set — catalog will be empty");
      warnedNoSheetId = true;
    }
    return EMPTY_CACHE;
  }
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
  partial?: boolean;
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
  satCode: p.satCode,
  stockQty: p.stockQty,
  inStock: p.inStock,
  descriptionEs: p.descriptionEs,
  descriptionEn: p.descriptionEn,
  features: p.features,
  gallery: p.gallery,
  variantLabels: p.variantLabels,
  specSheetUrl: p.specSheetUrl,
  specSheetLocal: p.specSheetLocal,
  hasImage: p.hasImage,
  imageSrc: p.imageSrc,
  slug: p.slug,
  tradePrice: p.tradePrice,
  shippingClass: p.shippingClass,
});

// Relevance via scoreProduct: AND semantics, SKU-part matching, richer fields.
// Weight order: sku/skuParts(6/5) > name(4) > brand(3) > cat/finishes(2) > desc(1).
const imageWeight = (p: IndexedProduct) => (p.imageSrc ? 1 : 0);

const scoreRow = (p: IndexedProduct, q: string): number => scoreProduct(q, p);

const DEFAULT_SCAN_BUDGET_MS = 4000;

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
  const query = normalize(q);

  // Pick candidate pool: brand-filtered if a brand is specified.
  const pool =
    brand && c.byBrand.has(brand) ? c.byBrand.get(brand)! : c.products;

  let matched: IndexedProduct[];
  let partial = false;
  if (query) {
    // Score each candidate; keep only non-zero. For ranked search we need the
    // full list before slicing (scores vary).
    const scored: Array<{ p: IndexedProduct; s: number }> = [];
    const scanStart = Date.now();
    let iter = 0;
    for (const p of pool) {
      if (++iter % 5000 === 0 && Date.now() - scanStart > DEFAULT_SCAN_BUDGET_MS) {
        partial = true;
        break;
      }
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
      scored.sort((a, b) => b.s - a.s || (imageWeight(b.p) - imageWeight(a.p)) || a.p._sku.localeCompare(b.p._sku));
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
    } else {
      matched = [...matched].sort((a, b) => (imageWeight(b) - imageWeight(a)) || a._sku.localeCompare(b._sku));
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
  const result: SearchResult = {
    items,
    total: matched.length,
    offset,
    limit,
    elapsedMs: Date.now() - t0,
    cacheAgeMs: Date.now() - c.ts,
  };
  if (partial) result.partial = true;
  return result;
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

// Wrapped in React.cache() for per-request dedup. The PDP's generateMetadata
// and the page render both look up the same product by id/slug — without
// this, the cache lookup runs twice per render. Cache is request-scoped:
// fresh between requests, deduped within.
export const getProductById = reactCache(
  async (id: string): Promise<ProductFull | null> => {
    const c = await getCache();
    const p = c.products.find((x) => x.id === id);
    return p ? stripIndex(p) : null;
  },
);

/** Bulk SKU lookup — returns a Map<UPPER_SKU, ProductFull> for the SKUs
 *  that exist in the catalog. Used by the PO generator's stock check so
 *  one round-trip covers every line item on a deal. */
export const getProductsBySkus = async (
  skus: string[]
): Promise<Map<string, ProductFull>> => {
  const out = new Map<string, ProductFull>();
  const wanted = new Set(
    skus.map((s) => s.trim().toUpperCase()).filter(Boolean),
  );
  if (wanted.size === 0) return out;
  const c = await getCache();
  for (const p of c.products) {
    const key = (p.sku ?? "").trim().toUpperCase();
    if (key && wanted.has(key) && !out.has(key)) {
      out.set(key, stripIndex(p));
    }
  }
  return out;
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

// ── Public catalog brand aggregation ────────────────────────────────────

export const getCatalogBrands = async (): Promise<BrandCount[]> => {
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

// ── PDP slug-based lookup ─────────────────────────────────────────────

let slugIndex: Map<string, string> | null = null;
let slugIndexTs = 0;

const ensureSlugIndex = async (): Promise<Map<string, string>> => {
  const c = await getCache();
  if (slugIndex && slugIndexTs === c.ts) return slugIndex;
  const idx = new Map<string, string>();
  for (const p of c.products) {
    const slug = toSlug(p.name, p.sku);
    if (!idx.has(slug)) idx.set(slug, p.id);
  }
  slugIndex = idx;
  slugIndexTs = c.ts;
  return idx;
};

// Wrapped in React.cache() — see comment on getProductById. The PDP page
// calls this in generateMetadata AND in the page body for the same slug.
export const getProductBySlug = reactCache(
  async (slug: string): Promise<ProductFull | null> => {
    const idx = await ensureSlugIndex();
    const id = idx.get(slug);
    if (id) return getProductById(id);

    const c = await getCache();
    const norm = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Fallback 1: match by SKU
    for (const p of c.products) {
      if (p._sku === norm || p.sku.toLowerCase() === slug.toLowerCase()) {
        return stripIndex(p);
      }
    }

    // Fallback 2: slug contains the SKU suffix — check if any product's
    // toSlug output starts with the same prefix (handles minor slug drift)
    for (const p of c.products) {
      if (norm.endsWith(p._sku) && norm.length > p._sku.length) {
        const computed = toSlug(p.name, p.sku);
        if (computed === norm || norm.startsWith(computed.slice(0, 20))) {
          return stripIndex(p);
        }
      }
    }

    // Fallback 3: CRM sheet products (artisanal / curated items not in Odoo)
    const { getProductBySlug: getCrmProduct } = await import("./sheets");
    const crm = await getCrmProduct(slug);
    if (crm) return crmToProductFull(crm);

    return null;
  },
);

// Wrapped in React.cache() — same per-request dedup. Same (category,
// excludeId, limit) tuple from the same PDP renders only once.
export const getRelatedProducts = reactCache(
  async (
    category: ProductCategory,
    excludeId: string,
    limit = 8,
  ): Promise<ProductFull[]> => {
    const c = await getCache();
    const out: ProductFull[] = [];
    for (const p of c.products) {
      if (p.id === excludeId) continue;
      if (p.category !== category) continue;
      if (!p.saleOk || !p.active) continue;
      if (!p.imageSrc) continue;
      out.push(stripIndex(p));
      if (out.length >= limit) break;
    }
    return out;
  },
);

export const getProductSlug = (p: ProductFull): string => toSlug(p.name, p.sku);

export const getAllProductsFull = async (): Promise<ProductFull[]> => {
  const c = await getCache();
  return c.products.map(stripIndex);
};

// ── Build-time pre-rendering candidates ───────────────────────────────

export interface PdpSlugParams {
  locale: string;
  category: string;
  slug: string;
}

export const getTopPdpSlugs = async (
  limit = 1000,
): Promise<PdpSlugParams[]> => {
  const c = await getCache();
  if (c.products.length === 0) return [];

  const candidates = c.products
    .filter((p) => p.active && p.saleOk && p.imageSrc)
    .slice(0, limit);

  const params: PdpSlugParams[] = [];
  const seen = new Set<string>();
  for (const p of candidates) {
    const slug = toSlug(p.name, p.sku);
    const key = `${p.category}/${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    params.push(
      { locale: "en", category: p.category, slug },
      { locale: "es", category: p.category, slug },
    );
  }
  return params;
};
