import { describe, it, expect } from "vitest";
import { normalize, scoreTokens, scoreNormalized } from "./search-utils";

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
