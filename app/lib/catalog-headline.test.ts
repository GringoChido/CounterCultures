import { describe, it, expect } from "vitest";
import {
  getSectionEyebrow,
  getSectionHeadline,
  buildDisciplineColumns,
} from "./catalog-headline";

// ── Eyebrow logic ───────────────────────────────────────────────────

describe("getSectionEyebrow", () => {
  it("returns 'Results' when query meets MIN_QUERY (EN)", () => {
    expect(getSectionEyebrow("ab", "", "all", "most_specified", "en")).toBe("Results");
  });

  it("returns 'Resultados' when query meets MIN_QUERY (ES)", () => {
    expect(getSectionEyebrow("ab", "", "all", "most_specified", "es")).toBe("Resultados");
  });

  it("returns 'Brand' when brand is set (EN)", () => {
    expect(getSectionEyebrow("", "Brizo", "all", "most_specified", "en")).toBe("Brand");
  });

  it("returns 'Marca' when brand is set (ES)", () => {
    expect(getSectionEyebrow("", "Brizo", "all", "most_specified", "es")).toBe("Marca");
  });

  it("returns 'Category' when category is not 'all' (EN)", () => {
    expect(getSectionEyebrow("", "", "bathroom", "most_specified", "en")).toBe("Category");
  });

  it("returns 'Categoría' when category is not 'all' (ES)", () => {
    expect(getSectionEyebrow("", "", "bathroom", "most_specified", "es")).toBe("Categoría");
  });

  it("returns 'Most Specified' when sort is most_specified and no filters (EN)", () => {
    expect(getSectionEyebrow("", "", "all", "most_specified", "en")).toBe("Most Specified");
  });

  it("returns 'Browse' as the default fallback (EN)", () => {
    expect(getSectionEyebrow("", "", "all", "alpha", "en")).toBe("Browse");
  });

  it("returns 'Explorar' as the default fallback (ES)", () => {
    expect(getSectionEyebrow("", "", "all", "alpha", "es")).toBe("Explorar");
  });

  it("query takes priority over brand", () => {
    expect(getSectionEyebrow("faucet", "Brizo", "all", "most_specified", "en")).toBe("Results");
  });

  it("brand takes priority over category", () => {
    expect(getSectionEyebrow("", "Kohler", "bathroom", "most_specified", "en")).toBe("Brand");
  });
});

// ── Headline logic ──────────────────────────────────────────────────

describe("getSectionHeadline", () => {
  it("wraps query in quotes when active (EN)", () => {
    expect(getSectionHeadline("faucet", "", "all", "en")).toBe('"faucet"');
  });

  it("trims query whitespace", () => {
    expect(getSectionHeadline("  Litze  ", "", "all", "en")).toBe('"Litze"');
  });

  it("returns brand name when brand is set", () => {
    expect(getSectionHeadline("", "Brizo", "all", "en")).toBe("Brizo");
  });

  it("returns 'Bathroom' for bathroom category (EN)", () => {
    expect(getSectionHeadline("", "", "bathroom", "en")).toBe("Bathroom");
  });

  it("returns 'Baño' for bathroom category (ES)", () => {
    expect(getSectionHeadline("", "", "bathroom", "es")).toBe("Baño");
  });

  it("returns 'Kitchen' for kitchen category (EN)", () => {
    expect(getSectionHeadline("", "", "kitchen", "en")).toBe("Kitchen");
  });

  it("returns 'Cocina' for kitchen category (ES)", () => {
    expect(getSectionHeadline("", "", "kitchen", "es")).toBe("Cocina");
  });

  it("returns 'Door Hardware' for hardware category (EN)", () => {
    expect(getSectionHeadline("", "", "hardware", "en")).toBe("Door Hardware");
  });

  it("returns 'Chapas y Herrajes' for hardware category (ES)", () => {
    expect(getSectionHeadline("", "", "hardware", "es")).toBe("Chapas y Herrajes");
  });

  it("returns 'Explore the Catalog' as default (EN) — NOT architects", () => {
    expect(getSectionHeadline("", "", "all", "en")).toBe("Explore the Catalog");
    expect(getSectionHeadline("", "", "all", "en")).not.toContain("architect");
  });

  it("returns 'Explora el Catálogo' as default (ES) — NOT arquitectos", () => {
    expect(getSectionHeadline("", "", "all", "es")).toBe("Explora el Catálogo");
    expect(getSectionHeadline("", "", "all", "es")).not.toContain("arquitecto");
  });

  it("query takes priority over brand", () => {
    expect(getSectionHeadline("faucet", "Brizo", "all", "en")).toBe('"faucet"');
  });
});

// ── BrowseByDiscipline link generation ──────────────────────────────

describe("buildDisciplineColumns", () => {
  it("returns exactly 3 columns", () => {
    expect(buildDisciplineColumns("en")).toHaveLength(3);
  });

  it("columns are bathroom, kitchen, hardware in order", () => {
    const keys = buildDisciplineColumns("en").map((c) => c.key);
    expect(keys).toEqual(["bathroom", "kitchen", "hardware"]);
  });

  it("category labels are locale-aware (EN)", () => {
    const labels = buildDisciplineColumns("en").map((c) => c.label);
    expect(labels).toEqual(["Bathroom", "Kitchen", "Door Hardware"]);
  });

  it("category labels are locale-aware (ES)", () => {
    const labels = buildDisciplineColumns("es").map((c) => c.label);
    expect(labels).toEqual(["Baño", "Cocina", "Chapas y Herrajes"]);
  });

  it("category hrefs point to /shop/{key}", () => {
    const hrefs = buildDisciplineColumns("en").map((c) => c.href);
    expect(hrefs).toEqual(["/shop/bathroom", "/shop/kitchen", "/shop/hardware"]);
  });

  it("bathroom has 10 subcategories", () => {
    const bathroom = buildDisciplineColumns("en")[0];
    expect(bathroom.subcategories).toHaveLength(10);
  });

  it("kitchen has 8 subcategories", () => {
    const kitchen = buildDisciplineColumns("en")[1];
    expect(kitchen.subcategories).toHaveLength(8);
  });

  it("hardware has 3 subcategories", () => {
    const hardware = buildDisciplineColumns("en")[2];
    expect(hardware.subcategories).toHaveLength(3);
  });

  it("subcategory hrefs are /shop/{cat}/{sub}", () => {
    const bathroom = buildDisciplineColumns("en")[0];
    expect(bathroom.subcategories[0].href).toBe("/shop/bathroom/sinks");
    expect(bathroom.subcategories[1].href).toBe("/shop/bathroom/faucets");
  });

  it("subcategory labels are locale-aware", () => {
    const bathroomEn = buildDisciplineColumns("en")[0];
    const bathroomEs = buildDisciplineColumns("es")[0];
    expect(bathroomEn.subcategories[0].label).toBe("Sinks & Basins");
    expect(bathroomEs.subcategories[0].label).toBe("Lavabos");
  });

  it("viewAllLabel is locale-aware (EN)", () => {
    const cols = buildDisciplineColumns("en");
    expect(cols[0].viewAllLabel).toBe("View All Bathroom");
    expect(cols[2].viewAllLabel).toBe("View All Door Hardware");
  });

  it("viewAllLabel is locale-aware (ES)", () => {
    const cols = buildDisciplineColumns("es");
    expect(cols[0].viewAllLabel).toBe("Ver Todo Baño");
    expect(cols[2].viewAllLabel).toBe("Ver Todo Chapas y Herrajes");
  });
});
