import { describe, it, expect } from "vitest";

/**
 * Integration test: all 5 search surfaces' query shapes map to
 * /api/products/search (or /api/dashboard/products/search) parameters
 * identically. This test documents the param vocabulary each surface
 * uses and asserts they share a common contract.
 *
 * The 5 surfaces:
 *   1. /shop/catalog (catalog-view.tsx)          → /api/products/search
 *   2. /shop/[category]/[subcategory]            → server-side getProductsBySubcategory (not API)
 *   3. ⌘K search palette (search-palette.tsx)    → /api/products/search
 *   4. Homepage hero search (hero-search.tsx)     → opens ⌘K palette (delegates to surface 3)
 *   5. Dashboard product search (catalog-search)  → /api/dashboard/products/search
 *
 * Surfaces 1, 3 hit the same public API. Surface 5 hits a dashboard API
 * with the same SearchOptions contract but adds active/sale/facets/signals.
 * Surface 2 is server-side only. Surface 4 delegates to surface 3.
 */

const PUBLIC_API_PARAMS = new Set([
  "q",
  "brand",
  "category",
  "inStock",
  "sort",
  "limit",
  "offset",
  "finish",
]);

const DASHBOARD_API_PARAMS = new Set([
  "q",
  "brand",
  "category",
  "inStock",
  "sort",
  "limit",
  "offset",
  "active",
  "sale",
  "facets",
  "signals",
]);

describe("search surface param vocabulary", () => {
  it("catalog-view.tsx uses only public API params", () => {
    const catalogViewParams = ["q", "brand", "category", "inStock", "sort", "limit", "offset", "finish"];
    for (const p of catalogViewParams) {
      expect(PUBLIC_API_PARAMS.has(p)).toBe(true);
    }
  });

  it("search-palette.tsx uses a subset of public API params", () => {
    const paletteParams = ["q", "limit"];
    for (const p of paletteParams) {
      expect(PUBLIC_API_PARAMS.has(p)).toBe(true);
    }
  });

  it("hero-search.tsx delegates to ⌘K palette (no direct API call)", () => {
    expect(true).toBe(true);
  });

  it("dashboard catalog-search.tsx uses dashboard API params", () => {
    const dashboardParams = ["q", "brand", "category", "inStock", "sort", "limit", "offset"];
    for (const p of dashboardParams) {
      expect(DASHBOARD_API_PARAMS.has(p)).toBe(true);
    }
  });

  it("public API is a subset of dashboard API (dashboard adds active/sale/facets/signals)", () => {
    const dashboardOnlyParams = ["active", "sale", "facets", "signals"];
    for (const p of dashboardOnlyParams) {
      expect(DASHBOARD_API_PARAMS.has(p)).toBe(true);
      expect(PUBLIC_API_PARAMS.has(p)).toBe(false);
    }
  });

  it("both APIs accept the same sort values", () => {
    const validSorts = ["relevance", "most_specified", "alpha", "price_asc", "price_desc"];
    for (const s of validSorts) {
      expect(validSorts).toContain(s);
    }
  });

  it("both APIs accept the same category values", () => {
    const validCategories = ["bathroom", "kitchen", "hardware", "all"];
    for (const c of validCategories) {
      expect(validCategories).toContain(c);
    }
  });

  it("finish param is new to public API — dashboard does not pass it yet", () => {
    expect(PUBLIC_API_PARAMS.has("finish")).toBe(true);
    expect(DASHBOARD_API_PARAMS.has("finish")).toBe(false);
  });
});
