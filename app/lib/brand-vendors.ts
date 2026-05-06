/**
 * Brand → Vendor mapping. Each brand has one default vendor (Roger's go-to)
 * and zero or more alternative vendors he switches to based on warehouse
 * stock, lead time, or import ease.
 *
 * R2-5: this used to be implicitly fixed (the brand WAS the vendor on the
 * PO). Roger's reality: he sometimes routes the same SKU through a different
 * vendor when one has stock and the other doesn't, or when one has cleaner
 * customs handling. The PO line item now defaults to the brand's primary
 * vendor but exposes alternatives, with a saved override reason.
 *
 * Decision context (leadTimeDays, importEase) is kept here per-vendor so the
 * dropdown can render it without an extra round-trip. Real-time stock comes
 * from /api/dashboard/inventory and isn't carried here.
 */
export interface VendorOption {
  /** Internal vendor key — also the row key in the Vendors sheet (R2-6). */
  key: string;
  /** Display name on the PO and dropdown. */
  name: string;
  /** Typical lead time in days when this vendor fulfills. */
  leadTimeDays: number;
  /**
   * Customs / import handling quality. 5 = clean broker, complete docs,
   * no surprises; 1 = expect to chase paperwork. Roger's heuristic, not
   * objective.
   */
  importEase: 1 | 2 | 3 | 4 | 5;
  /** Free-text note shown under the option in the dropdown. */
  note?: string;
}

export interface BrandVendorMap {
  /** The default vendor the PO routes to absent an override. */
  default: VendorOption;
  /** Other vendors that carry this brand. May be empty. */
  alternatives: VendorOption[];
}

/**
 * Canonical brand → vendor map. Roger maintains the source of truth in his
 * head; this captures it. Update here to add a brand or shuffle a default.
 *
 * Lead-time + import-ease are best-current-estimates and intentionally
 * conservative; they exist to inform the dropdown choice, not to govern
 * automatic routing.
 */
export const BRAND_VENDORS: Record<string, BrandVendorMap> = {
  Kohler: {
    default: { key: "ferguson", name: "Ferguson", leadTimeDays: 18, importEase: 5, note: "Cash up front · clean broker" },
    alternatives: [],
  },
  Brizo: {
    default: { key: "ferguson", name: "Ferguson", leadTimeDays: 14, importEase: 5, note: "Brizo sourced via Ferguson" },
    alternatives: [],
  },
  Delta: {
    default: { key: "ferguson", name: "Ferguson", leadTimeDays: 14, importEase: 5, note: "Delta sourced via Ferguson" },
    alternatives: [],
  },
  BLANCO: {
    default: { key: "jcr", name: "JCR", leadTimeDays: 25, importEase: 4, note: "BLANCO authorized dealer" },
    alternatives: [],
  },
  TOTO: {
    default: { key: "jelp", name: "JELP", leadTimeDays: 25, importEase: 4, note: "Stock/price dependent" },
    alternatives: [
      { key: "jcr", name: "JCR", leadTimeDays: 22, importEase: 4, note: "Also carries TOTO — check stock/price" },
    ],
  },
  "Sun Valley Bronze": {
    default: { key: "svb_direct", name: "Sun Valley Bronze (direct)", leadTimeDays: 60, importEase: 2, note: "50% deposit on orders over $2,500" },
    alternatives: [],
  },
  "California Faucets": {
    default: { key: "california_faucets", name: "California Faucets", leadTimeDays: 28, importEase: 5, note: "NET 30 · $10K credit limit · vendor and brand" },
    alternatives: [],
  },
  Dornbracht: {
    default: { key: "ferguson", name: "Ferguson", leadTimeDays: 35, importEase: 4 },
    alternatives: [],
  },
  Badeloft: {
    default: { key: "badeloft", name: "Badeloft", leadTimeDays: 45, importEase: 3, note: "50% if not in stock, 100% before shipment" },
    alternatives: [],
  },
};

/**
 * Resolve a brand name to its mapping. Case-insensitive. Returns null when
 * the brand isn't registered yet — caller should fall back to "set vendor
 * manually" UI rather than picking arbitrarily.
 */
export const vendorMapForBrand = (brand: string): BrandVendorMap | null => {
  if (!brand) return null;
  const trimmed = brand.trim();
  if (!trimmed) return null;
  // Case-insensitive lookup against canonical keys
  const found = Object.entries(BRAND_VENDORS).find(
    ([key]) => key.toLowerCase() === trimmed.toLowerCase()
  );
  return found ? found[1] : null;
};

/**
 * Flat list of (default + alternative) vendor options for a brand. Order
 * preserved — default first, alternatives in registration order.
 */
export const vendorOptionsForBrand = (brand: string): VendorOption[] => {
  const map = vendorMapForBrand(brand);
  if (!map) return [];
  return [map.default, ...map.alternatives];
};

/**
 * Did the user pick a vendor that isn't the default for this brand?
 * Used to decide whether to require a reason on save.
 */
export const isVendorOverride = (brand: string, vendorKey: string): boolean => {
  const map = vendorMapForBrand(brand);
  if (!map) return false;
  return map.default.key !== vendorKey;
};
