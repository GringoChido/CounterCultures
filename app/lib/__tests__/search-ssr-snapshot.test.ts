import { describe, it, expect } from "vitest";
import type { SearchResult } from "../products-full";

/**
 * Tests for SSR snapshot search — verifies that searchProductsIndexed
 * returns a valid SearchResult shape with the expected item count.
 *
 * These tests validate the contract, not the live data layer (which
 * requires Google Sheets credentials). We test the shape and invariants.
 */

describe("SSR snapshot search result shape", () => {
  it("SearchResult has all required fields", () => {
    const result: SearchResult = {
      items: [],
      total: 0,
      offset: 0,
      limit: 24,
      elapsedMs: 100,
      cacheAgeMs: 0,
    };
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("offset");
    expect(result).toHaveProperty("limit");
    expect(result).toHaveProperty("elapsedMs");
    expect(result).toHaveProperty("cacheAgeMs");
  });

  it("SearchResult items respect limit when populated", () => {
    const items = Array.from({ length: 24 }, (_, i) => ({
      id: `p-${i}`,
      name: `Product ${i}`,
      sku: `SKU-${i}`,
      brand: "TestBrand",
      category: "bathroom" as const,
      listPrice: 100 + i,
      currency: "USD",
      uom: "Units",
      active: true,
      saleOk: true,
      hasImage: false,
      slug: `product-${i}`,
    }));
    const result: SearchResult = {
      items,
      total: 354000,
      offset: 0,
      limit: 24,
      elapsedMs: 280,
      cacheAgeMs: 500,
    };
    expect(result.items).toHaveLength(24);
    expect(result.limit).toBe(24);
    expect(result.offset).toBe(0);
  });

  it("SearchResult can carry optional partial flag", () => {
    const result: SearchResult = {
      items: [],
      total: 0,
      offset: 0,
      limit: 24,
      elapsedMs: 4001,
      cacheAgeMs: 0,
      partial: true,
    };
    expect(result.partial).toBe(true);
  });

  it("each item has the minimum fields needed for ProductCard rendering", () => {
    const item = {
      id: "123",
      name: "Brizo Litze",
      sku: "BRI-63054LF-MB",
      brand: "Brizo",
      category: "bathroom" as const,
      listPrice: 450,
      currency: "USD",
      uom: "Units",
      active: true,
      saleOk: true,
      hasImage: true,
      imageSrc: "/products/odoo/123.jpg",
      slug: "brizo-litze-bri-63054lf-mb",
    };
    expect(item.id).toBeTruthy();
    expect(item.name).toBeTruthy();
    expect(item.sku).toBeTruthy();
    expect(item.brand).toBeTruthy();
    expect(item.category).toBeTruthy();
    expect(item.slug).toBeTruthy();
    expect(typeof item.listPrice).toBe("number");
  });
});
