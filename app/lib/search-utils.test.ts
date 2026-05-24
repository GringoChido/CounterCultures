import { describe, it, expect } from "vitest";
import {
  normalize,
  scoreTokens,
  scoreNormalized,
  scoreProduct,
  type ProductFields,
} from "./search-utils";

// ── Existing parity tests ─────────────────────────────────────────────

describe("scoreNormalized parity with scoreTokens", () => {
  const cases: Array<{ label: string; fields: string[]; query: string }> = [
    { label: "exact SKU match", fields: ["K-13448-CP", "Kohler Faucet", "Kohler"], query: "k-13448-cp" },
    { label: "brand prefix", fields: ["EMT-123", "Lever Handle", "Emtek"], query: "emtek" },
    { label: "accented name", fields: ["DUO-33", "Tarja Banté DUO 33\"", "Bante"], query: "banté" },
    { label: "multi-token query", fields: ["BRI-640", "Brizo Litze Faucet", "Brizo"], query: "brizo litze" },
    { label: "partial SKU", fields: ["1L1A55CDLHTWB", "Some Product", "Emtek"], query: "1l1a55" },
    { label: "no match", fields: ["ABC-123", "Widget", "Acme"], query: "zzzzz" },
    { label: "empty query", fields: ["ABC-123", "Widget", "Acme"], query: "" },
    { label: "undefined field", fields: ["ABC-123", "", "Acme"], query: "abc" },
    { label: "Spanish term", fields: ["55.995", "Grifo de baño", "Hansgrohe"], query: "grifo" },
    { label: "uppercase query", fields: ["CRL-US10B", "Door Closer", "CRL"], query: "CRL" },
  ];

  for (const { label, fields, query } of cases) {
    it(`${label}: scoreTokens(raw) === scoreNormalized(pre-normalized)`, () => {
      const rawScore = scoreTokens(query, fields, { weights: [4, 3, 1] });
      const normQuery = normalize(query);
      const normFields = fields.map((f) => (f ? normalize(f) : undefined));
      const fastScore = scoreNormalized(normQuery, normFields, { weights: [4, 3, 1] });
      expect(fastScore).toBe(rawScore);
    });
  }
});

// ── Product relevance suite ───────────────────────────────────────────

const mkProduct = (
  overrides: Partial<ProductFields> & Pick<ProductFields, "_sku" | "_name" | "_brand">
): ProductFields => ({
  _skuParts: overrides._sku.split(/[-._/\s]+/).filter(Boolean),
  _cat: "",
  _finishes: "",
  _desc: "",
  ...overrides,
});

const PRODUCTS: Record<string, ProductFields> = {
  kohlerFaucet: mkProduct({
    _sku: normalize("K-13448-CP"),
    _name: normalize("Kohler Kelston Faucet CP"),
    _brand: normalize("Kohler"),
    _skuParts: ["k", "13448", "cp", "k13448cp", normalize("K-13448-CP")],
    _cat: normalize("bathroom"),
    _finishes: normalize("Chrome Polished"),
  }),
  kohlerFaucetBN: mkProduct({
    _sku: normalize("K-13448-BN"),
    _name: normalize("Kohler Kelston Faucet BN"),
    _brand: normalize("Kohler"),
    _skuParts: ["k", "13448", "bn", "k13448bn", normalize("K-13448-BN")],
    _cat: normalize("bathroom"),
    _finishes: normalize("Brushed Nickel"),
  }),
  emtekLever: mkProduct({
    _sku: normalize("1L1A55CDLHTWB"),
    _name: normalize("Emtek L-Square Lever Handle"),
    _brand: normalize("Emtek"),
    _skuParts: ["1l1a55cdlhtwb"],
    _cat: normalize("hardware"),
  }),
  brizoLitze: mkProduct({
    _sku: normalize("BRI-63054LF-GL"),
    _name: normalize("Brizo Litze Kitchen Faucet"),
    _brand: normalize("Brizo"),
    _skuParts: ["bri", "63054lf", "gl", "bri63054lfgl", normalize("BRI-63054LF-GL")],
    _cat: normalize("kitchen"),
    _finishes: normalize("Luxe Gold"),
  }),
  brizoOther: mkProduct({
    _sku: normalize("BRI-65043LF-PC"),
    _name: normalize("Brizo Solna Pull-Down Faucet"),
    _brand: normalize("Brizo"),
    _skuParts: ["bri", "65043lf", "pc", "bri65043lfpc", normalize("BRI-65043LF-PC")],
    _cat: normalize("kitchen"),
    _finishes: normalize("Polished Chrome"),
  }),
  banteProduct: mkProduct({
    _sku: normalize("DUO-33"),
    _name: normalize("Tarja Banté DUO 33"),
    _brand: normalize("Banté"),
    _skuParts: ["duo", "33", "duo33", normalize("DUO-33")],
    _cat: normalize("kitchen"),
  }),
  grifoProduct: mkProduct({
    _sku: normalize("HG-31067"),
    _name: normalize("Grifo de baño monoblock"),
    _brand: normalize("Hansgrohe"),
    _skuParts: ["hg", "31067", "hg31067", normalize("HG-31067")],
    _cat: normalize("bathroom"),
    _finishes: normalize("Cromo"),
  }),
  chromeFaucet: mkProduct({
    _sku: normalize("MOE-TS2143"),
    _name: normalize("Moen Align Bathroom Faucet"),
    _brand: normalize("Moen"),
    _skuParts: ["moe", "ts2143", "moets2143", normalize("MOE-TS2143")],
    _cat: normalize("bathroom"),
    _finishes: normalize("Chrome"),
  }),
};

const ALL = Object.values(PRODUCTS);

const rank = (query: string, products?: ProductFields[]): ProductFields[] => {
  const nq = normalize(query);
  return (products ?? ALL)
    .map((p) => ({ p, s: scoreProduct(nq, p) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .map(({ p }) => p);
};

describe("scoreProduct — relevance suite", () => {
  it("exact hyphenated SKU K-13448-CP → that product is #1", () => {
    const results = rank("K-13448-CP");
    expect(results[0]).toBe(PRODUCTS.kohlerFaucet);
  });

  it("partial/mid SKU 13448 → K-13448 family at top", () => {
    const results = rank("13448");
    expect(results.length).toBeGreaterThanOrEqual(2);
    const topIds = new Set(results.slice(0, 2));
    expect(topIds.has(PRODUCTS.kohlerFaucet)).toBe(true);
    expect(topIds.has(PRODUCTS.kohlerFaucetBN)).toBe(true);
  });

  it("long alphanumeric SKU 1L1A55CDLHTWB → exact match", () => {
    const results = rank("1L1A55CDLHTWB");
    expect(results[0]).toBe(PRODUCTS.emtekLever);
  });

  it("fragment of long SKU 1l1a55 → matches via substring", () => {
    const results = rank("1l1a55");
    expect(results[0]).toBe(PRODUCTS.emtekLever);
  });

  it("brand prefix emtek → Emtek products rank at top", () => {
    const results = rank("emtek");
    expect(results[0]).toBe(PRODUCTS.emtekLever);
  });

  it("accented Spanish banté → matches accent-folded", () => {
    const results = rank("banté");
    expect(results[0]).toBe(PRODUCTS.banteProduct);
  });

  it("Spanish term grifo → matches in name", () => {
    const results = rank("grifo");
    expect(results[0]).toBe(PRODUCTS.grifoProduct);
  });

  it("multi-word AND: brizo litze → only products matching BOTH tokens", () => {
    const results = rank("brizo litze");
    expect(results.length).toBe(1);
    expect(results[0]).toBe(PRODUCTS.brizoLitze);
  });

  it("junk-token AND: brizo widget → returns nothing (widget matches nothing)", () => {
    const results = rank("brizo widget");
    expect(results.length).toBe(0);
  });

  it("finish term chrome → matches via _finishes field", () => {
    const results = rank("chrome");
    expect(results.length).toBeGreaterThan(0);
    const matched = results.map((p) => p._finishes);
    expect(matched.some((f) => f.includes("chrome"))).toBe(true);
  });

  it("category term kitchen → matches via _cat field", () => {
    const results = rank("kitchen");
    const kitchenProducts = results.filter((p) => p._cat.includes("kitchen"));
    expect(kitchenProducts.length).toBeGreaterThan(0);
  });

  it("empty query → returns nothing", () => {
    expect(rank("")).toHaveLength(0);
  });

  it("exact SKU scores higher than substring SKU match", () => {
    const nq = normalize("K-13448-CP");
    const exactScore = scoreProduct(nq, PRODUCTS.kohlerFaucet);
    const substrScore = scoreProduct(normalize("13448"), PRODUCTS.kohlerFaucet);
    expect(exactScore).toBeGreaterThan(substrScore);
  });

  it("brand + category narrows results: brizo kitchen", () => {
    const results = rank("brizo kitchen");
    // Only Brizo products with "kitchen" in _cat should appear
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      expect(p._brand).toContain("brizo");
    }
  });
});
