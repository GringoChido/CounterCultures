import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { toSlug } from "./slug";
import { pdpHref, pdpPath, pdpUrl } from "./pdp-href";
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

// ── pdpHref helper tests ────────────────────────────────────────────

describe("pdpHref / pdpPath / pdpUrl", () => {
  it("pdpHref builds a valid locale-prefixed path", () => {
    const p = makeProduct({ name: "Test Faucet", sku: "TF-100", category: "bathroom" });
    expect(pdpHref("en", p)).toBe("/en/shop/bathroom/p/test-faucet-tf-100");
    expect(pdpHref("es", p)).toBe("/es/shop/bathroom/p/test-faucet-tf-100");
  });

  it("pdpPath builds a locale-free path", () => {
    const p = makeProduct({ name: "Test Faucet", sku: "TF-100", category: "kitchen" });
    expect(pdpPath(p)).toBe("/shop/kitchen/p/test-faucet-tf-100");
  });

  it("pdpUrl builds a full absolute URL", () => {
    const p = makeProduct({ name: "Test Faucet", sku: "TF-100", category: "hardware" });
    expect(pdpUrl("en", p)).toBe("https://countercultures.mx/en/shop/hardware/p/test-faucet-tf-100");
  });

  it("throws when slug resolves to empty string", () => {
    expect(() => pdpHref("en", { sku: "", category: "bathroom" })).toThrow("[pdpHref]");
  });

  it("falls back to toSlug(name, sku) when slug field is missing", () => {
    const result = pdpHref("en", { name: "Some Product", sku: "SP-1", category: "bathroom" });
    expect(result).toBe("/en/shop/bathroom/p/some-product-sp-1");
  });

  it("falls back to SKU-derived slug when both slug and name are missing", () => {
    const result = pdpHref("en", { sku: "ABC-123", category: "bathroom" });
    expect(result).toBe("/en/shop/bathroom/p/abc-123");
  });
});

// ── ProductFull slug integrity ──────────────────────────────────────

describe("ProductFull slug integrity", () => {
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
      const href = pdpHref("en", p);
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
      expect(slugIndex.get(p.slug)).toBe(p.id);
    }
  });

  it("SKU fallback resolves when slug index misses", () => {
    const products = SAMPLE_PRODUCTS.map((raw, i) =>
      makeProduct({ ...raw, id: `prod-${i}` })
    );
    for (const p of products) {
      const skuSlug = p.sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const match = products.find(
        (c) => c.sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === skuSlug
      );
      expect(match).toBeDefined();
      expect(match!.id).toBe(p.id);
    }
  });

  it("empty name → SKU-only slug", () => {
    const p = makeProduct({ name: "", sku: "CRL-US10B" });
    expect(p.slug).toBe("crl-us10b");
    expect(pdpHref("es", p)).toBe("/es/shop/bathroom/p/crl-us10b");
  });

  it("diacritics stripped from slug", () => {
    const p = makeProduct({ name: "Válvula de Compresión Estándar", sku: "VAL-001" });
    expect(p.slug).toBe("valvula-de-compresion-estandar-val-001");
    expect(p.slug).not.toMatch(/[áéíóúñ]/);
  });
});

// ── Codebase regression guard ───────────────────────────────────────

describe("no raw /p/${...} patterns outside pdp-href.ts and PDP page", () => {
  it("every PDP link in the codebase uses pdpHref/pdpPath/pdpUrl", () => {
    const ALLOWED_FILES = [
      "app/lib/pdp-href.ts",
      "app/[locale]/shop/[category]/p/[slug]/page.tsx",
      "app/[locale]/shop/[category]/p/[slug]/pdp-client.tsx",
      "app/[locale]/p/[slug]/page.tsx",
      "app/api/cron/keepalive/route.ts",
    ];

    const raw = execSync(
      "grep -rn '/p/\\${' app/ --include='*.tsx' --include='*.ts' || true",
      { encoding: "utf-8" }
    );

    const violations = raw
      .split("\n")
      .filter(Boolean)
      .filter((line) => !ALLOWED_FILES.some((f) => line.startsWith(f)))
      .filter((line) => !line.includes(".test."));

    if (violations.length > 0) {
      throw new Error(
        `Found ${violations.length} raw /p/\${...} pattern(s) outside pdpHref. ` +
        `Use pdpHref(), pdpPath(), or pdpUrl() from app/lib/pdp-href.ts instead:\n` +
        violations.join("\n")
      );
    }
  });
});
