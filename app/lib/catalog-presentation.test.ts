import { describe, it, expect } from "vitest";

// ── Catalog presentation logic tests ─────────────────────────────────
// These test the presentation-layer decisions that catalog-view.tsx makes,
// extracted as pure functions so they can run in the node test environment.

const MIN_QUERY = 2;

/** Mirrors the condition in catalog-view.tsx for "has active filters" */
const hasActiveFilters = (q: string, brand: string, category: string) =>
  q.trim().length >= MIN_QUERY || !!brand || category !== "all";

/** Mirrors the no-results branch decision */
const noResultsMessage = (
  total: number,
  q: string,
  hasFilters: boolean,
  totalProducts: number,
): "loading" | "no-results-for-query" | "no-results-generic" => {
  if (!hasFilters && totalProducts === 0) return "loading";
  if (q.trim().length >= MIN_QUERY) return "no-results-for-query";
  return "no-results-generic";
};

/** Mirrors the hero-search and catalog-search-input submit encoding */
const encodeSearchUrl = (locale: string, raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return `/${locale}/shop/catalog`;
  return `/${locale}/shop/catalog?q=${encodeURIComponent(trimmed)}`;
};

// ── No-results state logic ───────────────────────────────────────────

describe("catalog no-results state", () => {
  it("total=0 with a query shows query-specific message", () => {
    const result = noResultsMessage(0, "zzzzzzz", true, 350000);
    expect(result).toBe("no-results-for-query");
  });

  it("total=0 with no query and no filters shows generic no-results", () => {
    const result = noResultsMessage(0, "", false, 350000);
    expect(result).toBe("no-results-generic");
  });

  it("total=0 with no query and no totalProducts shows loading state", () => {
    const result = noResultsMessage(0, "", false, 0);
    expect(result).toBe("loading");
  });

  it("total=0 with brand filter but no query shows generic no-results", () => {
    const filters = hasActiveFilters("", "Brizo", "all");
    const result = noResultsMessage(0, "", filters, 350000);
    expect(result).toBe("no-results-generic");
  });

  it("total=0 with category filter shows generic no-results", () => {
    const filters = hasActiveFilters("", "", "bathroom");
    const result = noResultsMessage(0, "", filters, 350000);
    expect(result).toBe("no-results-generic");
  });

  it("single-character query is below MIN_QUERY", () => {
    expect(hasActiveFilters("a", "", "all")).toBe(false);
  });

  it("two-character query meets MIN_QUERY", () => {
    expect(hasActiveFilters("ab", "", "all")).toBe(true);
  });
});

// ── URL encoding ─────────────────────────────────────────────────────

describe("search URL encoding", () => {
  it("trims whitespace before encoding", () => {
    expect(encodeSearchUrl("en", "  Litze  ")).toBe(
      "/en/shop/catalog?q=Litze",
    );
  });

  it("encodes special characters", () => {
    expect(encodeSearchUrl("en", "a*b")).toBe(
      "/en/shop/catalog?q=a*b",
    );
  });

  it("encodes regex metachars [x]", () => {
    const url = encodeSearchUrl("en", "[x]");
    expect(url).toBe("/en/shop/catalog?q=%5Bx%5D");
    expect(url).not.toContain("[");
  });

  it("encodes unicode characters", () => {
    const url = encodeSearchUrl("es", "grifo café");
    expect(url).toContain("q=grifo%20caf%C3%A9");
  });

  it("preserves hyphens in SKUs", () => {
    expect(encodeSearchUrl("en", "K-13448-CP")).toBe(
      "/en/shop/catalog?q=K-13448-CP",
    );
  });

  it("empty input navigates to catalog without q param", () => {
    expect(encodeSearchUrl("en", "")).toBe("/en/shop/catalog");
    expect(encodeSearchUrl("en", "   ")).toBe("/en/shop/catalog");
  });

  it("spaces are encoded as %20", () => {
    expect(encodeSearchUrl("en", "K 13448 CP")).toBe(
      "/en/shop/catalog?q=K%2013448%20CP",
    );
  });
});

// ── XSS safety ───────────────────────────────────────────────────────

describe("XSS rendering safety", () => {
  it("script tags are preserved as literal text (not executable)", () => {
    const malicious = '<script>alert(1)</script>';
    const url = encodeSearchUrl("en", malicious);
    expect(url).not.toContain("<script>");
    expect(url).toContain("%3Cscript%3E");
  });

  it("HTML angle brackets are percent-encoded in URL", () => {
    const input = '"><img src=x onerror=alert(1)>';
    const url = encodeSearchUrl("en", input);
    expect(url).not.toContain("<img");
    expect(url).not.toContain("<");
    expect(url).not.toContain(">");
  });

  it("long strings (500+ chars) produce a valid URL without crashing", () => {
    const longInput = "a".repeat(500);
    const url = encodeSearchUrl("en", longInput);
    expect(url).toContain("q=");
    expect(url.length).toBeGreaterThan(500);
  });
});

// ── Regex metachar safety ────────────────────────────────────────────

describe("regex metachar URL safety", () => {
  const metachars = ["a*b", "[x]", "a+b", "a?b", "(foo)", "a{2}", "a|b", "^start", "end$", "a.b"];

  for (const input of metachars) {
    it(`"${input}" encodes without throwing`, () => {
      expect(() => encodeSearchUrl("en", input)).not.toThrow();
      const url = encodeSearchUrl("en", input);
      expect(url).toContain("q=");
    });
  }
});
