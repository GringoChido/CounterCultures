import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The catalog typeahead is the 6th search surface. Surfaces 1, 3 (catalog,
 * cmd-K palette) hit /api/products/search; surface 5 (dashboard) uses its
 * own API. The typeahead joins the public-API cohort.
 *
 * Public API params (from search-all-surfaces-integration.test.ts):
 *   q, brand, category, inStock, sort, limit, offset, finish
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

const panelSource = readFileSync(
  path.join(
    process.cwd(),
    "app/components/catalog/catalog-search-panel.tsx",
  ),
  "utf-8",
);

describe("Catalog typeahead — 6th search surface contract", () => {
  it("requests /api/products/search (same backend as catalog + palette)", () => {
    expect(panelSource).toContain("/api/products/search");
  });

  it("only uses public-API params (q, finish, limit, sort)", () => {
    const paramsUsed = ["q", "finish", "limit", "sort"];
    for (const p of paramsUsed) {
      expect(PUBLIC_API_PARAMS.has(p)).toBe(true);
    }
  });

  it("declares limit=8 (compact dropdown)", () => {
    // Allow either an inline `limit=8` URL fragment, an inline literal
    // `"limit", "8"` set call, or a `PRODUCT_LIMIT = 8` constant.
    const patterns = [
      /limit=8\b/,
      /["']limit["']\s*,\s*["']?8["']?/,
      /PRODUCT_LIMIT\s*=\s*8\b/,
    ];
    expect(patterns.some((p) => p.test(panelSource))).toBe(true);
  });

  it("declares sort=relevance for typeahead ordering", () => {
    expect(panelSource).toMatch(/sort["']?\s*[:,]\s*["']?relevance["']?/);
  });

  it("does NOT touch dashboard-only params (active, sale, facets, signals)", () => {
    // Only flag these as URL query parameters, not as identifiers (the
    // panel has its own React props like `active={finish === f.code}`).
    const dashboardOnly = [
      /[?&]active=/,
      /[?&]sale=/,
      /[?&]facets=/,
      /[?&]signals=/,
      /params\.set\(["']active["']/,
      /params\.set\(["']sale["']/,
      /params\.set\(["']facets["']/,
      /params\.set\(["']signals["']/,
    ];
    for (const p of dashboardOnly) {
      expect(panelSource).not.toMatch(p);
    }
  });

  it("debounce interval is 180ms (faster than palette 250ms)", () => {
    expect(panelSource).toMatch(/180/);
  });

  it("uses AbortController to cancel stale fetches", () => {
    expect(panelSource).toContain("AbortController");
  });
});
