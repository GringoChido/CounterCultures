import { describe, it, expect } from "vitest";
import { DISCIPLINE_SPREADS, PRODUCT_CATEGORIES, type CategoryKey } from "./constants";

// ── Every link in the discipline section resolves correctly ──────────

describe("DisciplineSpread routing — CTA hrefs", () => {
  it("bathroom CTA → /shop/bathroom", () => {
    expect(DISCIPLINE_SPREADS[0].href).toBe("/shop/bathroom");
  });

  it("kitchen CTA → /shop/kitchen", () => {
    expect(DISCIPLINE_SPREADS[1].href).toBe("/shop/kitchen");
  });

  it("hardware CTA → /shop/hardware", () => {
    expect(DISCIPLINE_SPREADS[2].href).toBe("/shop/hardware");
  });

  it("workshops CTA → #artisans (in-page anchor)", () => {
    expect(DISCIPLINE_SPREADS[3].href).toBe("#artisans");
  });

  it("no href is undefined", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.href).toBeDefined();
      expect(s.href).not.toBe("");
    }
  });

  it("no href is just '#' or '/'", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.href).not.toBe("#");
      expect(s.href).not.toBe("/");
    }
  });
});

describe("DisciplineSpread routing — subcategory hrefs", () => {
  const categorySpreads = DISCIPLINE_SPREADS.filter(
    (s) => s.key !== "workshops",
  );

  it("every subcategory href is /shop/{category}/{subcategory}", () => {
    for (const s of categorySpreads) {
      const catKey = s.key as CategoryKey;
      const subs = PRODUCT_CATEGORIES[catKey].subcategories;
      for (const sub of subs) {
        const expectedHref = `/shop/${catKey}/${sub.slug}`;
        expect(expectedHref).toMatch(/^\/shop\/[a-z]+\/[a-z-]+$/);
      }
    }
  });

  it("bathroom has 10 valid subcategory routes", () => {
    const subs = PRODUCT_CATEGORIES.bathroom.subcategories;
    expect(subs).toHaveLength(10);
    for (const sub of subs) {
      expect(sub.slug).toBeTruthy();
      expect(sub.slug).not.toContain(" ");
    }
  });

  it("kitchen has 8 valid subcategory routes", () => {
    const subs = PRODUCT_CATEGORIES.kitchen.subcategories;
    expect(subs).toHaveLength(8);
    for (const sub of subs) {
      expect(sub.slug).toBeTruthy();
      expect(sub.slug).not.toContain(" ");
    }
  });

  it("hardware has 3 valid subcategory routes", () => {
    const subs = PRODUCT_CATEGORIES.hardware.subcategories;
    expect(subs).toHaveLength(3);
    for (const sub of subs) {
      expect(sub.slug).toBeTruthy();
      expect(sub.slug).not.toContain(" ");
    }
  });

  it("all subcategory slugs are kebab-case", () => {
    for (const s of categorySpreads) {
      const catKey = s.key as CategoryKey;
      for (const sub of PRODUCT_CATEGORIES[catKey].subcategories) {
        expect(sub.slug).toMatch(/^[a-z][a-z0-9-]*$/);
      }
    }
  });
});
