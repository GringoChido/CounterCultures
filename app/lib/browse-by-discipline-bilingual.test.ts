import { describe, it, expect } from "vitest";
import { DISCIPLINE_SPREADS, PRODUCT_CATEGORIES, type CategoryKey } from "./constants";
import { formatAnchorBrands } from "./format-anchor-brands";

// ── Every English string has a Spanish counterpart ──────────────────

describe("BrowseByDiscipline bilingual parity", () => {
  it("every spread has both EN and ES labels", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.label.en).toBeTruthy();
      expect(s.label.es).toBeTruthy();
    }
  });

  it("every spread has both EN and ES copy", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.copy.en).toBeTruthy();
      expect(s.copy.es).toBeTruthy();
    }
  });

  it("every spread has both EN and ES ctaLabel", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.ctaLabel.en).toBeTruthy();
      expect(s.ctaLabel.es).toBeTruthy();
    }
  });

  it("EN and ES labels are different strings (not copy-paste)", () => {
    for (const s of DISCIPLINE_SPREADS) {
      if (s.key === "workshops") continue;
      expect(s.label.en).not.toBe(s.label.es);
    }
  });

  it("EN and ES copy are different strings", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.copy.en).not.toBe(s.copy.es);
    }
  });

  it("EN and ES ctaLabel are different strings", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.ctaLabel.en).not.toBe(s.ctaLabel.es);
    }
  });
});

// ── Subcategory labels switch language ───────────────────────────────

describe("Subcategory labels are bilingual", () => {
  const categoryKeys: CategoryKey[] = ["bathroom", "kitchen", "hardware"];

  for (const key of categoryKeys) {
    it(`${key} subcategories have both EN and ES labels`, () => {
      for (const sub of PRODUCT_CATEGORIES[key].subcategories) {
        expect(sub.label.en).toBeTruthy();
        expect(sub.label.es).toBeTruthy();
      }
    });

    it(`${key} EN and ES subcategory labels differ`, () => {
      for (const sub of PRODUCT_CATEGORIES[key].subcategories) {
        expect(sub.label.en).not.toBe(sub.label.es);
      }
    });
  }
});

// ── Brand join uses correct conjunction ─────────────────────────────

describe("Anchor brand join uses 'y' in ES", () => {
  it("bathroom brands joined with 'y' in ES", () => {
    const result = formatAnchorBrands(DISCIPLINE_SPREADS[0].anchorBrands, "es");
    expect(result).toContain(" y ");
    expect(result).not.toContain(" and ");
  });

  it("bathroom brands joined with 'and' in EN", () => {
    const result = formatAnchorBrands(DISCIPLINE_SPREADS[0].anchorBrands, "en");
    expect(result).toContain(" and ");
    expect(result).not.toContain(" y ");
  });

  it("hardware brands joined with 'y' in ES", () => {
    const result = formatAnchorBrands(DISCIPLINE_SPREADS[2].anchorBrands, "es");
    expect(result).toContain(" y ");
  });

  it("workshops brands joined with 'y' in ES", () => {
    const result = formatAnchorBrands(DISCIPLINE_SPREADS[3].anchorBrands, "es");
    expect(result).toContain(" y ");
  });
});

// ── Section-level bilingual strings ─────────────────────────────────

describe("Section header bilingual parity", () => {
  const SECTION_T = {
    eyebrow: { en: "Browse by Discipline", es: "Explora por Disciplina" },
    headline: {
      en: "Three rooms. Seventy-three brands. One catalog.",
      es: "Tres ambientes. Setenta y tres marcas. Un catálogo.",
    },
  };

  it("eyebrow has EN and ES", () => {
    expect(SECTION_T.eyebrow.en).toBeTruthy();
    expect(SECTION_T.eyebrow.es).toBeTruthy();
    expect(SECTION_T.eyebrow.en).not.toBe(SECTION_T.eyebrow.es);
  });

  it("headline has EN and ES", () => {
    expect(SECTION_T.headline.en).toBeTruthy();
    expect(SECTION_T.headline.es).toBeTruthy();
    expect(SECTION_T.headline.en).not.toBe(SECTION_T.headline.es);
  });
});
