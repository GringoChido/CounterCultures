import { describe, it, expect } from "vitest";
import {
  DISCIPLINE_SPREADS,
  PRODUCT_CATEGORIES,
  type CategoryKey,
} from "./constants";
import { formatAnchorBrands } from "./format-anchor-brands";

// ── Single spread data integrity ────────────────────────────────────

describe("DISCIPLINE_SPREADS — individual spread data", () => {
  it("has exactly 4 disciplines", () => {
    expect(DISCIPLINE_SPREADS).toHaveLength(4);
  });

  it("numbers are 01, 02, 03, 04 in order", () => {
    expect(DISCIPLINE_SPREADS.map((s) => s.number)).toEqual([
      "01",
      "02",
      "03",
      "04",
    ]);
  });

  it("keys are bathroom, kitchen, hardware, workshops in order", () => {
    expect(DISCIPLINE_SPREADS.map((s) => s.key)).toEqual([
      "bathroom",
      "kitchen",
      "hardware",
      "workshops",
    ]);
  });

  it("every spread has a non-empty EN label", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.label.en.length).toBeGreaterThan(0);
    }
  });

  it("every spread has a non-empty ES label", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.label.es.length).toBeGreaterThan(0);
    }
  });

  it("every spread has EN and ES copy of at least 30 characters", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.copy.en.length).toBeGreaterThanOrEqual(30);
      expect(s.copy.es.length).toBeGreaterThanOrEqual(30);
    }
  });

  it("every spread has at least 2 anchor brands", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.anchorBrands.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every spread has a heroImage path starting with /", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.heroImage).toMatch(/^\//);
    }
  });

  it("every spread has a non-empty href", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.href.length).toBeGreaterThan(0);
    }
  });

  it("every spread has EN and ES ctaLabel", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.ctaLabel.en.length).toBeGreaterThan(0);
      expect(s.ctaLabel.es.length).toBeGreaterThan(0);
    }
  });
});

// ── Subcategory counts match PRODUCT_CATEGORIES ─────────────────────

describe("DISCIPLINE_SPREADS — subcategory alignment", () => {
  it("bathroom has 10 subcategories in PRODUCT_CATEGORIES", () => {
    expect(PRODUCT_CATEGORIES.bathroom.subcategories).toHaveLength(10);
  });

  it("kitchen has 8 subcategories in PRODUCT_CATEGORIES", () => {
    expect(PRODUCT_CATEGORIES.kitchen.subcategories).toHaveLength(8);
  });

  it("hardware has 3 subcategories in PRODUCT_CATEGORIES", () => {
    expect(PRODUCT_CATEGORIES.hardware.subcategories).toHaveLength(3);
  });

  it("the first 3 spreads map to real PRODUCT_CATEGORIES keys", () => {
    for (const s of DISCIPLINE_SPREADS.slice(0, 3)) {
      expect(s.key in PRODUCT_CATEGORIES).toBe(true);
    }
  });

  it("workshops key is NOT in PRODUCT_CATEGORIES (special case)", () => {
    expect("workshops" in PRODUCT_CATEGORIES).toBe(false);
  });
});

// ── formatAnchorBrands ──────────────────────────────────────────────

describe("formatAnchorBrands", () => {
  it("joins 4 brands with Oxford comma + 'and' (EN)", () => {
    expect(
      formatAnchorBrands(
        ["TOTO", "Brizo", "California Faucets", "Mistoa"],
        "en",
      ),
    ).toBe("TOTO, Brizo, California Faucets and Mistoa");
  });

  it("joins 4 brands with 'y' (ES)", () => {
    expect(
      formatAnchorBrands(
        ["TOTO", "Brizo", "California Faucets", "Mistoa"],
        "es",
      ),
    ).toBe("TOTO, Brizo, California Faucets y Mistoa");
  });

  it("handles 3 brands (EN)", () => {
    expect(
      formatAnchorBrands(["Sun Valley Bronze", "Emtek", "Baldwin"], "en"),
    ).toBe("Sun Valley Bronze, Emtek and Baldwin");
  });

  it("handles 3 brands (ES)", () => {
    expect(
      formatAnchorBrands(["Sun Valley Bronze", "Emtek", "Baldwin"], "es"),
    ).toBe("Sun Valley Bronze, Emtek y Baldwin");
  });

  it("handles 2 brands", () => {
    expect(formatAnchorBrands(["TOTO", "Brizo"], "en")).toBe(
      "TOTO and Brizo",
    );
  });

  it("handles 1 brand", () => {
    expect(formatAnchorBrands(["TOTO"], "en")).toBe("TOTO");
  });

  it("handles empty array", () => {
    expect(formatAnchorBrands([], "en")).toBe("");
  });
});
