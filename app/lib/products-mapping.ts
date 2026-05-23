/**
 * Shared row→product mapping used by both the runtime `load()` in
 * products-full.ts and the build-time snapshot generator.
 *
 * Extracting this avoids drift: one mapping function, two callers.
 * Types that both products-full.ts and the snapshot script need are
 * defined here to avoid circular imports.
 */
import { normalize } from "./search-utils";
import { toSlug } from "./slug";
import { getProductContent } from "./product-content";
import productImageManifest from "./product-image-manifest.json";

const productImageIds: Set<string> = new Set(productImageManifest as string[]);

// ── Types ──────────────────────────────────────────────────────────────

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
  stockQty?: number;
  inStock?: boolean;
  hasImage?: boolean;
  imageSrc?: string;
  satCode?: string;
  descriptionEs?: string;
  descriptionEn?: string;
  features?: string[];
  gallery?: string[];
  variantLabels?: string[];
  specSheetUrl?: string;
  specSheetLocal?: string;
  tradePrice?: number;
  slug: string;
  shippingClass?: "standard" | "oversized";
}

export interface IndexedProduct extends ProductFull {
  _sku: string;
  _name: string;
  _brand: string;
}

export interface BrandCount {
  brand: string;
  count: number;
}

export interface Cache {
  products: IndexedProduct[];
  byBrand: Map<string, IndexedProduct[]>;
  brandCounts: BrandCount[];
  categoryCounts: Record<ProductCategory, number>;
  ts: number;
}

/**
 * Snapshot-only shape: everything a ProductFull carries except stock
 * (which stays live) and search-index fields (recomputed at hydrate).
 */
export interface SnapshotProduct {
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
  satCode?: string;
  shippingClass?: "standard" | "oversized";
  descriptionEs?: string;
  descriptionEn?: string;
  features?: string[];
  gallery?: string[];
  variantLabels?: string[];
  specSheetUrl?: string;
  specSheetLocal?: string;
  hasImage?: boolean;
  imageSrc?: string;
  slug: string;
}

// ── Constants ──────────────────────────────────────────────────────────

export const BRAND_DISPLAY_MAP: Record<string, string> = {
  "V&B": "Villeroy & Boch",
  "SVB": "Sun Valley Bronze",
  "CALIFIORNIA": "California Faucets",
  "RUBATI": "Ruvati",
  "NAMEEK´S": "Nameeks",
  "Watermarkfixtures": "Watermark",
  "Inifinity Drains": "Infinity Drain",
  "HOUSE ROHL": "Rohl",
  "Original Misson Tile": "Original Mission Tile",
  "Build / Kingston Brass": "Kingston Brass",
  "Build / Delta": "Delta",
  "Amazon": "",
  "Build": "",
  "AJ MADISSON": "",
  "quality bath": "",
  "Lamp Plus": "",
  "Lamps Plus": "",
  "All": "",
  "All / Expenses": "",
  "All / Saleable / Booking Fees": "",
  "Operating expenses": "",
  "service": "",
  "MISC": "",
  "Commercial": "",
  "Personal": "",
  "IMP-02": "",
  "Counter / Santiago": "Manriquez",
  "Counter / Gaby- Cobre": "Castro",
  "Counter/Meza": "Familia Meza",
  "gaby": "Castro",
  "Mistoa": "Mistoa",
  "Counter": "Counter Cultures",
  "COUNTER/CHINA": "Counter Cultures",
  "independencia": "Independencia",
  "mosaico steven": "Steven",
  "cobuild": "",
  "coobuild": "",
};

export const ARTISAN_BRANDS: ReadonlySet<string> = new Set([
  "Mistoa",
  "Familia Meza",
  "Castro",
  "Manriquez",
]);

export const normalizeCategory = (c: string): ProductCategory => {
  if (c === "kitchen" || c === "hardware") return c;
  return "bathroom";
};

// ── Row→product mapping ────────────────────────────────────────────────

/**
 * Parse raw sheet rows into SnapshotProduct[]. Pure transform — no stock,
 * no search-index fields. Both the runtime Sheets path and the build-time
 * snapshot generator call this.
 */
export const mapRowsToProducts = (rows: string[][]): SnapshotProduct[] => {
  if (rows.length < 2) return [];

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
  const iSatCode = idx("sat_code");
  const iShippingClass = idx("shipping_class");

  const products: SnapshotProduct[] = [];

  for (const row of data) {
    const name = (row[iName] ?? "").toString();
    const sku = (row[iSku] ?? "").toString();
    const rawBrand = (row[iBrand] ?? "").toString();
    const brand = BRAND_DISPLAY_MAP[rawBrand] ?? rawBrand;
    const category = normalizeCategory((row[iCat] ?? "").toString());
    const id = (row[iId] ?? "").toString();
    const content = getProductContent(id);
    const imageSrc = productImageIds.has(id)
      ? `/products/odoo/${id}.jpg`
      : content?.gallery?.[0];

    products.push({
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
      satCode: iSatCode >= 0 ? (row[iSatCode] ?? "").toString() || undefined : undefined,
      shippingClass: iShippingClass >= 0 && (row[iShippingClass] ?? "").toString() === "oversized" ? "oversized" : "standard",
      descriptionEs: content?.descriptionEs || undefined,
      descriptionEn: content?.descriptionEn || undefined,
      features: content?.features?.length ? content.features : undefined,
      gallery: content?.gallery?.length ? content.gallery : undefined,
      variantLabels: content?.variants?.length ? content.variants : undefined,
      specSheetUrl: content?.specSheetUrl || undefined,
      specSheetLocal: content?.specSheetLocal || undefined,
      hasImage: !!imageSrc,
      imageSrc,
      slug: toSlug(name, sku),
    });
  }

  return products;
};

// ── Cache builder ──────────────────────────────────────────────────────

/**
 * Build a full Cache from SnapshotProducts + a live stock map.
 * Used by both the Sheets path and the snapshot-hydrate path so Cache
 * shape is identical regardless of data source.
 */
export const buildCacheFromProducts = (
  snapProducts: SnapshotProduct[],
  stockMap: Map<string, number>,
): Cache => {
  const products: IndexedProduct[] = [];
  const brandAgg = new Map<string, number>();
  const categoryCounts: Record<ProductCategory, number> = {
    bathroom: 0,
    kitchen: 0,
    hardware: 0,
  };

  for (const sp of snapProducts) {
    const stockQty = stockMap.get(sp.id) ?? 0;
    const p: IndexedProduct = {
      ...sp,
      stockQty,
      inStock: stockQty > 0,
      tradePrice: undefined,
      _sku: normalize(sp.sku),
      _name: normalize(sp.name),
      _brand: normalize(sp.brand),
    };
    products.push(p);
    if (sp.brand) brandAgg.set(sp.brand, (brandAgg.get(sp.brand) ?? 0) + 1);
    categoryCounts[sp.category]++;
  }

  const brandCounts: BrandCount[] = [...brandAgg.entries()]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count);

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
