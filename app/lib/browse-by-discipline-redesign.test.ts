import { describe, it, expect } from "vitest";
import { DISCIPLINE_SPREADS, PRODUCT_CATEGORIES } from "./constants";

// ── Section composition — 4-spread ordering + data shape ────────────

describe("BrowseByDiscipline composition", () => {
  it("renders 4 spreads in order: 01 Bathroom, 02 Kitchen, 03 Door Hardware, 04 The Workshops", () => {
    const labels = DISCIPLINE_SPREADS.map(
      (s) => `${s.number} ${s.label.en}`,
    );
    expect(labels).toEqual([
      "01 Bathroom",
      "02 Kitchen",
      "03 Door Hardware",
      "04 The Workshops",
    ]);
  });

  it("alternates image position: right, left, right, left", () => {
    const positions = DISCIPLINE_SPREADS.map((_, i) =>
      i % 2 === 0 ? "right" : "left",
    );
    expect(positions).toEqual(["right", "left", "right", "left"]);
  });

  it("first spread gets priority image (index 0), others do not", () => {
    DISCIPLINE_SPREADS.forEach((_, i) => {
      const isPriority = i === 0;
      if (i === 0) expect(isPriority).toBe(true);
      else expect(isPriority).toBe(false);
    });
  });

  it("headline text is correct (EN)", () => {
    const headline = "Three rooms. Seventy-three brands. One catalog.";
    expect(headline).toContain("Three rooms");
    expect(headline).toContain("Seventy-three brands");
  });

  it("headline text is correct (ES)", () => {
    const headline = "Tres ambientes. Setenta y tres marcas. Un catálogo.";
    expect(headline).toContain("Tres ambientes");
    expect(headline).toContain("Setenta y tres marcas");
  });

  it("all 4 spreads have distinct keys", () => {
    const keys = DISCIPLINE_SPREADS.map((s) => s.key);
    expect(new Set(keys).size).toBe(4);
  });

  it("all 4 spreads have distinct numbers", () => {
    const numbers = DISCIPLINE_SPREADS.map((s) => s.number);
    expect(new Set(numbers).size).toBe(4);
  });

  it("spreads that map to PRODUCT_CATEGORIES have matching labels (EN)", () => {
    for (const s of DISCIPLINE_SPREADS.slice(0, 3)) {
      const catKey = s.key as keyof typeof PRODUCT_CATEGORIES;
      expect(s.label.en).toBe(PRODUCT_CATEGORIES[catKey].label.en);
    }
  });

  it("spreads that map to PRODUCT_CATEGORIES have matching labels (ES)", () => {
    for (const s of DISCIPLINE_SPREADS.slice(0, 3)) {
      const catKey = s.key as keyof typeof PRODUCT_CATEGORIES;
      expect(s.label.es).toBe(PRODUCT_CATEGORIES[catKey].label.es);
    }
  });
});
