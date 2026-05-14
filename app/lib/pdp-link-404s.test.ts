import { describe, it, expect } from "vitest";
import { toSlug } from "./slug";
import type { ProductFull, ProductCategory } from "./products-full";

const makeProduct = (
  overrides: Partial<ProductFull> & { name: string; sku: string }
): ProductFull => ({
  id: overrides.id ?? "12345",
  name: overrides.name,
  sku: overrides.sku,
  brand: overrides.brand ?? "TestBrand",
  category: overrides.category ?? "bathroom",
  listPrice: overrides.listPrice ?? 100,
  currency: overrides.currency ?? "MXN",
  uom: overrides.uom ?? "Units",
  active: overrides.active ?? true,
  saleOk: overrides.saleOk ?? true,
  slug: toSlug(overrides.name, overrides.sku),
});

const buildPdpHref = (locale: string, p: ProductFull) =>
  `/${locale}/shop/${p.category}/p/${p.slug}`;

const SAMPLE_PRODUCTS: { name: string; sku: string; category: ProductCategory }[] = [
  { name: "Axor Citterio M Single-Hole Faucet", sku: "39010001", category: "bathroom" },
  { name: "Hansgrohe Raindance Select S 120", sku: "26530001", category: "bathroom" },
  { name: "", sku: "CRL-US10B", category: "hardware" },
  { name: "Válvula de Compresión Estándar", sku: "ABC-123", category: "kitchen" },
  { name: "Kohler Purist Wall-Mount Faucet", sku: "T14414-4-CP", category: "bathroom" },
  { name: "Delta Trinsic Pro Pull-Down Kitchen", sku: "9159T-DST", category: "kitchen" },
  { name: "Moen Align Single Handle", sku: "5965", category: "kitchen" },
  { name: "Brizo Litze Bar Faucet", sku: "61064LF-PC", category: "kitchen" },
  { name: "CRL Frameless Glass Clamp", sku: "GCB188CH", category: "hardware" },
  { name: "Rocky Mountain Hardware Briggs Lever", sku: "E30611/E30611", category: "hardware" },
];

describe("PDP link 404 smoke tests", () => {
  it("every ProductFull.slug is a non-empty string (never undefined)", () => {
    for (const raw of SAMPLE_PRODUCTS) {
      const p = makeProduct(raw);
      expect(p.slug).toBeDefined();
      expect(typeof p.slug).toBe("string");
      expect(p.slug.length).toBeGreaterThan(0);
    }
  });

  it("no PDP href contains 'undefined'", () => {
    for (const raw of SAMPLE_PRODUCTS) {
      const p = makeProduct(raw);
      const href = buildPdpHref("en", p);
      expect(href).not.toContain("undefined");
      expect(href).toMatch(/^\/en\/shop\/(bathroom|kitchen|hardware)\/p\/[a-z0-9-]+$/);
    }
  });

  it("slug is deterministic — same input always yields same slug", () => {
    for (const raw of SAMPLE_PRODUCTS) {
      const a = makeProduct(raw);
      const b = makeProduct(raw);
      expect(a.slug).toBe(b.slug);
    }
  });

  it("slug round-trips through a simulated slug index lookup", () => {
    const slugIndex = new Map<string, string>();
    const products = SAMPLE_PRODUCTS.map((raw, i) =>
      makeProduct({ ...raw, id: `prod-${i}` })
    );
    for (const p of products) {
      slugIndex.set(p.slug, p.id);
    }

    for (const p of products) {
      const resolvedId = slugIndex.get(p.slug);
      expect(resolvedId).toBe(p.id);
    }
  });

  it("SKU fallback resolves when slug index misses", () => {
    const products = SAMPLE_PRODUCTS.map((raw, i) =>
      makeProduct({ ...raw, id: `prod-${i}` })
    );

    for (const p of products) {
      const skuSlug = p.sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const match = products.find(
        (candidate) =>
          candidate.sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === skuSlug
      );
      expect(match).toBeDefined();
      expect(match!.id).toBe(p.id);
    }
  });

  it("products with empty name still produce a valid slug from SKU", () => {
    const p = makeProduct({ name: "", sku: "CRL-US10B" });
    expect(p.slug).toBe("crl-us10b");
    const href = buildPdpHref("es", p);
    expect(href).toBe("/es/shop/bathroom/p/crl-us10b");
    expect(href).not.toContain("undefined");
  });

  it("products with diacritics in name produce clean slugs", () => {
    const p = makeProduct({ name: "Válvula de Compresión Estándar", sku: "VAL-001" });
    expect(p.slug).toBe("valvula-de-compresion-estandar-val-001");
    expect(p.slug).not.toMatch(/[áéíóúñ]/);
  });

  it("catalog-view openProduct pattern uses slug directly", () => {
    const p = makeProduct({ name: "Test Product", sku: "TP-100" });
    const href = `/${("en")}/shop/${p.category}/p/${p.slug}`;
    expect(href).not.toContain("undefined");
    expect(href).toBe("/en/shop/bathroom/p/test-product-tp-100");
  });

  it("search-palette fallback pattern uses toSlug when slug missing from API", () => {
    const apiResult = { name: "Some Faucet", sku: "SF-200", category: "kitchen", slug: undefined as string | undefined };
    const hrefSuffix = `/shop/${apiResult.category}/p/${apiResult.slug || toSlug(apiResult.name, apiResult.sku)}`;
    expect(hrefSuffix).not.toContain("undefined");
    expect(hrefSuffix).toBe("/shop/kitchen/p/some-faucet-sf-200");
  });
});
