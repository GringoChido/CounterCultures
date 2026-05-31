import { describe, it, expect, vi } from "vitest";

vi.mock("@/app/i18n/navigation", () => ({
  Link: "a",
}));

vi.mock("next/image", () => ({
  default: "img",
}));

import {
  CATEGORY_BRAND_INDEX,
  BATHROOM_BRAND_INDEX,
  KITCHEN_BRAND_INDEX,
  HARDWARE_BRAND_INDEX,
} from "@/app/lib/category-brand-index";
import { artisans } from "@/app/components/sections/artisan-profiles";

describe("CatalogBrandWall data sourcing", () => {
  it("CATEGORY_BRAND_INDEX has bathroom, kitchen, hardware keys", () => {
    expect(Object.keys(CATEGORY_BRAND_INDEX)).toContain("bathroom");
    expect(Object.keys(CATEGORY_BRAND_INDEX)).toContain("kitchen");
    expect(Object.keys(CATEGORY_BRAND_INDEX)).toContain("hardware");
  });

  it("bathroom has at least one brand section with brands", () => {
    const totalBrands = BATHROOM_BRAND_INDEX.reduce(
      (sum, s) => sum + s.brands.length,
      0,
    );
    expect(totalBrands).toBeGreaterThan(0);
  });

  it("kitchen has at least one brand section with brands", () => {
    const totalBrands = KITCHEN_BRAND_INDEX.reduce(
      (sum, s) => sum + s.brands.length,
      0,
    );
    expect(totalBrands).toBeGreaterThan(0);
  });

  it("hardware has at least one brand section with brands", () => {
    const totalBrands = HARDWARE_BRAND_INDEX.reduce(
      (sum, s) => sum + s.brands.length,
      0,
    );
    expect(totalBrands).toBeGreaterThan(0);
  });

  it("no discipline has zero brands (data shape guard)", () => {
    for (const [key, sections] of Object.entries(CATEGORY_BRAND_INDEX)) {
      const total = sections.reduce((sum, s) => sum + s.brands.length, 0);
      expect(total, `${key} has zero brands`).toBeGreaterThan(0);
    }
  });

  it("artisans array has exactly 4 entries for the workshops section", () => {
    expect(artisans).toHaveLength(4);
  });

  it("artisan names match expected workshop makers", () => {
    const names = artisans.map((a) => a.name);
    expect(names).toContain("Mistoa");
    expect(names).toContain("Castro");
    expect(names).toContain("Familia Meza");
    expect(names).toContain("Manriquez");
  });

  it("every brand section has an id and bilingual label", () => {
    for (const [, sections] of Object.entries(CATEGORY_BRAND_INDEX)) {
      for (const section of sections) {
        expect(section.id).toBeTruthy();
        expect(section.label.en).toBeTruthy();
        expect(section.label.es).toBeTruthy();
      }
    }
  });

  it("every brand has a name", () => {
    for (const [, sections] of Object.entries(CATEGORY_BRAND_INDEX)) {
      for (const section of sections) {
        for (const brand of section.brands) {
          expect(brand.name).toBeTruthy();
        }
      }
    }
  });
});
