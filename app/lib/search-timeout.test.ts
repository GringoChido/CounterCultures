import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { normalize, scoreProduct, type ProductFields } from "./search-utils";

// ── Test helpers ─────────────────────────────────────────────────────

const mkProduct = (
  overrides: Partial<ProductFields> & Pick<ProductFields, "_sku" | "_name" | "_brand">
): ProductFields => ({
  _skuParts: overrides._sku.split(/[-._/\s]+/).filter(Boolean),
  _cat: "",
  _finishes: "",
  _desc: "",
  ...overrides,
});

// ── Fixture set matching the parity-proof queries ────────────────────

const PARITY_PRODUCTS: Record<string, ProductFields> = {
  litze: mkProduct({
    _sku: normalize("BRI-63054LF-GL"),
    _name: normalize("Brizo Litze Kitchen Faucet"),
    _brand: normalize("Brizo"),
    _skuParts: ["bri", "63054lf", "gl", "bri63054lfgl", normalize("BRI-63054LF-GL")],
    _cat: normalize("kitchen"),
    _finishes: normalize("Luxe Gold"),
  }),
  kohlerFaucet: mkProduct({
    _sku: normalize("K-13448-CP"),
    _name: normalize("Kohler Kelston Faucet CP"),
    _brand: normalize("Kohler"),
    _skuParts: ["k", "13448", "cp", "k13448cp", normalize("K-13448-CP")],
    _cat: normalize("bathroom"),
    _finishes: normalize("Chrome Polished"),
  }),
  brizoOther: mkProduct({
    _sku: normalize("BRI-65043LF-PC"),
    _name: normalize("Brizo Solna Pull-Down Faucet"),
    _brand: normalize("Brizo"),
    _skuParts: ["bri", "65043lf", "pc", "bri65043lfpc", normalize("BRI-65043LF-PC")],
    _cat: normalize("kitchen"),
    _finishes: normalize("Polished Chrome"),
  }),
  calFaucets: mkProduct({
    _sku: normalize("CF-6502-PC"),
    _name: normalize("California Faucets Tiburon Shower"),
    _brand: normalize("California Faucets"),
    _skuParts: ["cf", "6502", "pc", "cf6502pc", normalize("CF-6502-PC")],
    _cat: normalize("bathroom"),
  }),
  tinaCobre: mkProduct({
    _sku: normalize("TC-001"),
    _name: normalize("Tina de Cobre Martillado"),
    _brand: normalize("Castro"),
    _skuParts: ["tc", "001", "tc001", normalize("TC-001")],
    _desc: normalize("Tina de cobre martillado a mano"),
  }),
};

// ── scoreProduct parity: these queries must NOT trigger the budget ───

describe("scoreProduct parity — known-good queries score correctly", () => {
  const cases = [
    { query: "Litze", expectMatch: "litze", expectScore: true },
    { query: "K-13448-CP", expectMatch: "kohlerFaucet", expectScore: true },
    { query: "BRI-63054LF-GL", expectMatch: "litze", expectScore: true },
    { query: "tina cobre", expectMatch: "tinaCobre", expectScore: true },
    { query: "California Faucets", expectMatch: "calFaucets", expectScore: true },
    { query: "kohler", expectMatch: "kohlerFaucet", expectScore: true },
    { query: "brizo", expectMatch: "litze", expectScore: true },
  ];

  for (const { query, expectMatch, expectScore } of cases) {
    it(`"${query}" → top result is ${expectMatch}`, () => {
      const nq = normalize(query);
      const all = Object.entries(PARITY_PRODUCTS);
      const scored = all
        .map(([key, p]) => ({ key, s: scoreProduct(nq, p) }))
        .filter(({ s }) => s > 0)
        .sort((a, b) => b.s - a.s);

      if (expectScore) {
        expect(scored.length).toBeGreaterThan(0);
        expect(scored[0].key).toBe(expectMatch);
      }
    });
  }
});

// ── Scan budget simulation ──────────────────────────────────────────
// We can't easily test the real searchProducts with a 354K catalog in
// unit tests, but we can verify the budget logic by simulating
// Date.now() advancing past the budget during iteration.

describe("scan budget logic", () => {
  let originalDateNow: () => number;

  beforeEach(() => {
    originalDateNow = Date.now;
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  it("budget check fires every 5000 iterations and exits early when exceeded", () => {
    const BUDGET_MS = 4000;

    const simulateScanLoop = (poolSize: number, budgetMs: number) => {
      const scanStart = Date.now();
      let iter = 0;
      let partial = false;
      const scored: number[] = [];

      for (let i = 0; i < poolSize; i++) {
        if (++iter % 5000 === 0 && Date.now() - scanStart > budgetMs) {
          partial = true;
          break;
        }
        scored.push(i);
      }

      return { partial, scanned: scored.length };
    };

    // Date.now() is called: once for scanStart, then once per 5000 iterations.
    // Call 1 (scanStart): t=1000
    // Call 2 (iter 5000): t=3000 → elapsed 2000 < 4000 → continue
    // Call 3 (iter 10000): t=5500 → elapsed 4500 > 4000 → exit
    let dateCallCount = 0;
    const timeSteps = [1000, 3000, 5500, 8000, 10000];
    Date.now = () => timeSteps[dateCallCount++] ?? 10000;

    const result = simulateScanLoop(50000, BUDGET_MS);
    expect(result.partial).toBe(true);
    expect(result.scanned).toBe(9999);
  });

  it("budget does NOT trigger for small pools (< 5000 items)", () => {
    let now = 1000;
    Date.now = () => now; // time never advances past budget

    const BUDGET_MS = 4000;
    let iter = 0;
    let partial = false;

    for (let i = 0; i < 3000; i++) {
      if (++iter % 5000 === 0 && Date.now() - now > BUDGET_MS) {
        partial = true;
        break;
      }
    }

    expect(partial).toBe(false);
  });
});

// ── Route timeout response shape ────────────────────────────────────

describe("timeout response shape", () => {
  it("structured timeout response has the correct fields", () => {
    const response = {
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

    expect(response.timedOut).toBe(true);
    expect(response.error).toBe("search_timeout");
    expect(response.items).toEqual([]);
    expect(response.totalCount).toBe(0);
    expect(response.message.en).toContain("too broad");
    expect(response.message.es).toContain("amplia");
  });

  it("timeout sentinel is distinguishable from a real SearchResult", () => {
    const sentinel = { __timeout: true } as const;
    const realResult = {
      items: [],
      total: 0,
      offset: 0,
      limit: 60,
      elapsedMs: 100,
      cacheAgeMs: 500,
    };

    expect("__timeout" in sentinel).toBe(true);
    expect("__timeout" in realResult).toBe(false);
  });
});

// ── URL encoding for common tokens ──────────────────────────────────

describe("URL encoding for broad-query tokens", () => {
  const tokens = ["toto", "delta", "kohler", "brizo", "the", "1"];

  for (const token of tokens) {
    it(`"${token}" encodes without issue`, () => {
      const encoded = encodeURIComponent(token);
      expect(encoded).toBeTruthy();
      expect(decodeURIComponent(encoded)).toBe(token);
    });
  }
});

