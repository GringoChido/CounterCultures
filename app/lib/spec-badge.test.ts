import { describe, it, expect } from "vitest";

// ── Spec/Showroom badge presentation logic ─────────────────────────────
// Pure functions extracted from the badge components so they can be
// tested in the node test environment without JSX/DOM.

/** SpecifiedBadge only renders when projectCount >= 2 */
const shouldShowSpecBadge = (count: number): boolean => count >= 2;

/** Badge label text by locale */
const specBadgeLabel = (count: number, locale: "en" | "es"): string =>
  locale === "es" ? `Spec. ${count}×` : `Spec'd ${count}×`;

/** Tooltip text by locale */
const specBadgeTooltip = (count: number, locale: "en" | "es"): string =>
  locale === "es"
    ? `Especificado en ${count} proyectos`
    : `Specified on ${count} projects`;

/** ShowroomBadge label by locale */
const showroomBadgeLabel = (locale: "en" | "es"): string =>
  locale === "es" ? "En Showroom" : "In Showroom";

/** Aria-label for SpecifiedBadge (matches tooltip) */
const specBadgeAriaLabel = (count: number, locale: "en" | "es"): string =>
  specBadgeTooltip(count, locale);

/** Aria-label for ShowroomBadge */
const showroomBadgeAriaLabel = (locale: "en" | "es"): string =>
  showroomBadgeLabel(locale);

// ── SpecifiedBadge tests ───────────────────────────────────────────────

describe("SpecifiedBadge logic", () => {
  it("renders nothing when count=0", () => {
    expect(shouldShowSpecBadge(0)).toBe(false);
  });

  it("renders nothing when count=1", () => {
    expect(shouldShowSpecBadge(1)).toBe(false);
  });

  it("renders when count=2", () => {
    expect(shouldShowSpecBadge(2)).toBe(true);
  });

  it("renders when count=5", () => {
    expect(shouldShowSpecBadge(5)).toBe(true);
  });

  it("label shows \"Spec'd 2×\" for EN count=2", () => {
    expect(specBadgeLabel(2, "en")).toBe("Spec'd 2×");
  });

  it("label shows \"Spec'd 5×\" for EN count=5", () => {
    expect(specBadgeLabel(5, "en")).toBe("Spec'd 5×");
  });

  it("label shows \"Spec. 3×\" for ES count=3", () => {
    expect(specBadgeLabel(3, "es")).toBe("Spec. 3×");
  });

  it("tooltip reads \"Specified on 2 projects\" for EN", () => {
    expect(specBadgeTooltip(2, "en")).toBe("Specified on 2 projects");
  });

  it("tooltip reads \"Especificado en 5 proyectos\" for ES", () => {
    expect(specBadgeTooltip(5, "es")).toBe("Especificado en 5 proyectos");
  });

  it("aria-label matches tooltip text", () => {
    expect(specBadgeAriaLabel(3, "en")).toBe("Specified on 3 projects");
    expect(specBadgeAriaLabel(4, "es")).toBe("Especificado en 4 proyectos");
  });
});

// ── ShowroomBadge tests ────────────────────────────────────────────────

describe("ShowroomBadge logic", () => {
  it("label is \"In Showroom\" for EN", () => {
    expect(showroomBadgeLabel("en")).toBe("In Showroom");
  });

  it("label is \"En Showroom\" for ES", () => {
    expect(showroomBadgeLabel("es")).toBe("En Showroom");
  });

  it("aria-label matches label text for EN", () => {
    expect(showroomBadgeAriaLabel("en")).toBe("In Showroom");
  });

  it("aria-label matches label text for ES", () => {
    expect(showroomBadgeAriaLabel("es")).toBe("En Showroom");
  });
});
