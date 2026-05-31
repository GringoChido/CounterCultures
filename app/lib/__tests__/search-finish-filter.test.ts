import { describe, it, expect } from "vitest";
import { normalize, matchesFinish } from "../search-utils";
import type { IndexedProduct } from "../products-mapping";

const makeProduct = (
  overrides: Partial<IndexedProduct> & { sku: string; brand: string; category: "bathroom" | "kitchen" | "hardware" },
): IndexedProduct => ({
  id: overrides.id ?? `test-${overrides.sku}`,
  name: overrides.name ?? `Test Product ${overrides.sku}`,
  sku: overrides.sku,
  brand: overrides.brand,
  category: overrides.category,
  listPrice: overrides.listPrice ?? 100,
  currency: overrides.currency ?? "USD",
  uom: "Units",
  active: overrides.active ?? true,
  saleOk: overrides.saleOk ?? true,
  hasImage: false,
  slug: `test-${overrides.sku.toLowerCase()}`,
  _sku: normalize(overrides.sku),
  _name: normalize(overrides.name ?? `Test Product ${overrides.sku}`),
  _brand: normalize(overrides.brand),
  _skuParts: normalize(overrides.sku).split(/[-._/\s]+/).filter(Boolean),
  _cat: normalize(overrides.category),
  _finishes: normalize((overrides.variantLabels ?? []).join(" ")),
  _desc: "",
  ...("variantLabels" in overrides ? { variantLabels: overrides.variantLabels } : {}),
  ...("inStock" in overrides ? { inStock: overrides.inStock } : {}),
  ...("stockQty" in overrides ? { stockQty: overrides.stockQty } : {}),
});

const matchFinish = (p: IndexedProduct, finish: string): boolean => {
  if (!finish) return true;
  return matchesFinish(p, normalize(finish));
};

describe("finish filter", () => {
  const products = [
    makeProduct({
      sku: "BRI-63054LF-MB",
      brand: "Brizo",
      category: "bathroom",
      variantLabels: ["Matte Black", "Chrome", "Nickel"],
    }),
    makeProduct({
      sku: "BRI-63054LF-PC",
      brand: "Brizo",
      category: "bathroom",
      variantLabels: ["Chrome", "Polished Chrome"],
    }),
    makeProduct({
      sku: "KOH-12345-GL",
      brand: "Kohler",
      category: "bathroom",
      variantLabels: ["Gold", "Moderne Brass"],
    }),
    makeProduct({
      sku: "EMT-ABMB",
      brand: "Emtek",
      category: "hardware",
      variantLabels: [],
    }),
    makeProduct({
      sku: "TOT-WASHLET",
      brand: "TOTO",
      category: "bathroom",
      variantLabels: ["Cotton White"],
    }),
    makeProduct({
      sku: "BLA-440194-MB",
      brand: "Blanco",
      category: "kitchen",
      variantLabels: ["Matte Black"],
      inStock: true,
      stockQty: 5,
    }),
  ];

  it("finish: 'MB' returns only products whose _finishes or _sku contains MB", () => {
    const matched = products.filter((p) => matchFinish(p, "MB"));
    const ids = matched.map((p) => p.sku);
    expect(ids).toContain("BRI-63054LF-MB");
    expect(ids).not.toContain("BRI-63054LF-PC");
    expect(ids).not.toContain("KOH-12345-GL");
  });

  it("finish: 'MB' does NOT match SKU 'EMT-ABMB' — no separator before suffix", () => {
    const emtek = products.find((p) => p.sku === "EMT-ABMB")!;
    expect(matchFinish(emtek, "MB")).toBe(false);
  });

  it("finish: 'MB' matches Blanco via SKU suffix (-MB)", () => {
    const blanco = products.find((p) => p.sku === "BLA-440194-MB")!;
    expect(matchFinish(blanco, "MB")).toBe(true);
  });

  it("finish: '' returns all (no-op)", () => {
    const matched = products.filter((p) => matchFinish(p, ""));
    expect(matched.length).toBe(products.length);
  });

  it("finish filter composes with brand + category + inStockOnly", () => {
    const filtered = products.filter((p) => {
      if (p.brand !== "Blanco") return false;
      if (p.category !== "kitchen") return false;
      if (!p.inStock) return false;
      if (!matchFinish(p, "MB")) return false;
      return true;
    });
    expect(filtered.length).toBe(1);
    expect(filtered[0].sku).toBe("BLA-440194-MB");
  });

  it("finish: 'GL' matches SKU suffix with separator", () => {
    const matched = products.filter((p) => matchFinish(p, "GL"));
    expect(matched.map((p) => p.sku)).toContain("KOH-12345-GL");
  });

  it("finish: 'PC' matches via SKU suffix", () => {
    const matched = products.filter((p) => matchFinish(p, "PC"));
    expect(matched.map((p) => p.sku)).toContain("BRI-63054LF-PC");
  });

  it("finish: 'chrome' matches via _finishes token", () => {
    const matched = products.filter((p) => matchFinish(p, "chrome"));
    const skus = matched.map((p) => p.sku);
    expect(skus).toContain("BRI-63054LF-MB");
    expect(skus).toContain("BRI-63054LF-PC");
  });

  it("finish: 'nickel' matches via _finishes token prefix", () => {
    const matched = products.filter((p) => matchFinish(p, "nickel"));
    expect(matched.map((p) => p.sku)).toContain("BRI-63054LF-MB");
  });
});
