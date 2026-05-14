import { describe, it, expect } from "vitest";
import { toSlug } from "./slug";

describe("toSlug", () => {
  it("generates a deterministic slug from name + sku", () => {
    expect(toSlug("Axor Citterio M Single-Hole Faucet", "39010001"))
      .toBe("axor-citterio-m-single-hole-faucet-39010001");
  });

  it("strips diacritics", () => {
    expect(toSlug("Válvula de Compresión", "ABC-123"))
      .toBe("valvula-de-compresion-abc-123");
  });

  it("falls back to sku-only when name is empty", () => {
    expect(toSlug("", "CRL-US10B")).toBe("crl-us10b");
  });

  it("never produces 'undefined' in the slug", () => {
    const slug = toSlug("Some Product", "SKU-999");
    expect(slug).not.toContain("undefined");
    expect(slug.length).toBeGreaterThan(0);
  });

  it("collapses non-alphanumeric runs into single hyphens", () => {
    expect(toSlug("Foo / Bar (Baz)", "X--Y"))
      .toBe("foo-bar-baz-x-y");
  });

  it("handles decomposed Unicode (n + combining tilde → diseno)", () => {
    const decomposed = "Diseño Martillado";
    expect(toSlug(decomposed, "SKU-1")).toBe("diseno-martillado-sku-1");
  });
});
