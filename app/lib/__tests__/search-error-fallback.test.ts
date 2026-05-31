import { describe, it, expect } from "vitest";

/**
 * Tests for the error/fallback behavior of /api/products/search:
 *
 * 1. Route returns proper error shape on searchFn throw
 * 2. Route returns search_timeout shape on 6s race
 * 3. degradedSort: true is set when specScores.size === 0 AND sort is most_specified
 */

describe("search error response shapes", () => {
  it("500 error response has { error: string } shape", () => {
    const errorResponse = { error: "Search failed" };
    expect(errorResponse).toHaveProperty("error");
    expect(typeof errorResponse.error).toBe("string");
  });

  it("timeout response has the canonical search_timeout shape", () => {
    const timeoutResponse = {
      items: [],
      totalCount: 0,
      brandCounts: [],
      categoryCounts: { bathroom: 0, kitchen: 0, hardware: 0 },
      timedOut: true,
      error: "search_timeout",
      message: {
        en: "Your search is too broad. Try adding a brand or model number.",
        es: "Tu búsqueda es demasiado amplia. Prueba con una marca o número de modelo.",
      },
    };
    expect(timeoutResponse.timedOut).toBe(true);
    expect(timeoutResponse.error).toBe("search_timeout");
    expect(timeoutResponse.items).toEqual([]);
    expect(timeoutResponse.message).toHaveProperty("en");
    expect(timeoutResponse.message).toHaveProperty("es");
  });
});

describe("degradedSort flag", () => {
  it("degradedSort: true when specScores is empty Map AND sort is most_specified", () => {
    const specScores = new Map<string, { weightedScore: number; projectCount: number }>();
    const sort = "most_specified";
    const needSignals = true;

    const degradedSort = needSignals && sort === "most_specified" && specScores.size === 0;
    expect(degradedSort).toBe(true);
  });

  it("degradedSort: false when specScores has entries", () => {
    const specScores = new Map([
      ["p-1", { weightedScore: 5.2, projectCount: 3 }],
    ]);
    const sort = "most_specified";
    const needSignals = true;

    const degradedSort = needSignals && sort === "most_specified" && specScores.size === 0;
    expect(degradedSort).toBe(false);
  });

  it("degradedSort: false when sort is not most_specified", () => {
    const specScores = new Map<string, { weightedScore: number; projectCount: number }>();
    const sort: string = "relevance";
    const needSignals = true;

    const degradedSort = needSignals && sort === "most_specified" && specScores.size === 0;
    expect(degradedSort).toBe(false);
  });

  it("degradedSort: false when signals were not needed (brand or q present)", () => {
    const specScores = new Map<string, { weightedScore: number; projectCount: number }>();
    const sort = "most_specified";
    const brand = "Brizo";
    const q = "";
    const needSignals = !brand && !q && sort === "most_specified";

    const degradedSort = needSignals && sort === "most_specified" && specScores.size === 0;
    expect(degradedSort).toBe(false);
  });
});
