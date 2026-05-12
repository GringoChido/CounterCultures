/**
 * Product content sidecar — Spanish descriptions, feature bullets, galleries,
 * variant lists, and spec-sheet URLs that don't live in the Odoo / Sheets mirror.
 *
 * Built by scripts/scrape/06-build-product-content.ts from:
 *   - countercultures.com.mx (Squarespace) scrape  → ES copy + galleries + variants
 *   - scripts/products-odoo.csv description column → spec sheet PDF URLs
 *   - Partner-site scrapers (Brizo/Delta/CF/etc.)  → EN technical copy
 *
 * Why a sidecar and not an extra column on the Sheets mirror?
 *   The CC_Products_Full sheet is near its 10M-cell cap. A 354k × 5-col content
 *   table would blow it. JSON-on-disk is fine because content is only loaded
 *   for the product currently being rendered, never the whole catalog.
 */
import productContent from "./product-content.json";

export interface ProductContent {
  legacySlug: string;
  legacyUrl: string;
  /** Title scraped from the legacy site (Spanish). */
  title: string;
  /** Spanish marketing copy (200-500 chars typical). */
  descriptionEs: string;
  /** Optional English description from partner sites. */
  descriptionEn?: string;
  /** Bulleted features (CARACTERÍSTICAS). */
  features: string[];
  /** Public paths under /products/odoo-gallery/<id>/. */
  gallery: string[];
  /** Variant labels (Color: dropdown) — display strings, not codes. */
  variants: string[];
  /** Breadcrumb category trail. */
  breadcrumb: string[];
  /** Remote spec sheet URL (PDF, usually manufacturer-hosted). */
  specSheetUrl?: string;
  /** Local mirror if downloaded — /specs/odoo/<id>.pdf. */
  specSheetLocal?: string;
  price?: number;
  priceFrom?: boolean;
  saleOriginalPrice?: number;
  updatedAt: string;
  matchConfidence: number;
}

const map = productContent as unknown as Record<string, ProductContent>;

/**
 * Lookup by Odoo product id (the same id used in products-full.ts).
 * Returns null if nothing is staged for this product.
 */
export const getProductContent = (odooId: string): ProductContent | null => {
  return map[odooId] ?? null;
};

/** All ids with any staged content. Useful for sitemaps. */
export const getStagedIds = (): string[] => Object.keys(map);

/**
 * Quick boolean — does this product have a description/gallery/spec beyond
 * what the catalog row carries? Used by UI to decide whether to render the
 * extended PDP layout vs the lean "quote-only" card.
 */
export const hasRichContent = (odooId: string): boolean => {
  const c = map[odooId];
  if (!c) return false;
  return !!(c.descriptionEs || c.descriptionEn || c.gallery.length || c.specSheetUrl);
};
