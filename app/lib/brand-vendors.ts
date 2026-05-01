/**
 * Brand → Vendor mapping. Roger doesn't order direct from the brands he
 * sells; he orders through authorized distributors. Kohler/Brizo/Delta go
 * through Ferguson. BLANCO goes through JCR. Each SKU's vendor is derived
 * from its brand.
 *
 * Match is case-insensitive. Brands not listed fall back to the brand name
 * itself (treated as their own vendor) so we never block a PO from being
 * generated.
 */

const VENDOR_BY_BRAND_LOWER: Record<string, string> = {
  // Ferguson handles the big-three US plumbing
  kohler: "Ferguson",
  brizo: "Ferguson",
  delta: "Ferguson",
  "delta faucet": "Ferguson",
  "brizo / delta faucet": "Ferguson",

  // JCR handles BLANCO in Mexico
  blanco: "JCR",

  // Others — direct relationships
  toto: "TOTO USA",
  "toto usa": "TOTO USA",
  dornbracht: "Dornbracht",
  "california faucets": "California Faucets",
  rohl: "Rohl",
  waterworks: "Waterworks",
  "newport brass": "Newport Brass",
  "sun valley bronze": "Sun Valley Bronze",
};

/**
 * Returns the canonical vendor name Roger orders from for a given brand.
 * Falls back to the brand itself when no mapping is registered.
 */
export const getVendorForBrand = (brand: string): string => {
  const key = (brand ?? "").trim().toLowerCase();
  if (!key) return "";
  return VENDOR_BY_BRAND_LOWER[key] ?? brand.trim();
};

/** True when we have an explicit vendor mapping for the brand. */
export const hasVendorMapping = (brand: string): boolean =>
  Object.prototype.hasOwnProperty.call(
    VENDOR_BY_BRAND_LOWER,
    (brand ?? "").trim().toLowerCase(),
  );
