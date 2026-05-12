import { describe, it, expect } from "vitest";
import { USO_CFDI } from "../uso-cfdi";

describe("USO_CFDI catalog", () => {
  it("contains all 24 SAT uso codes", () => {
    expect(USO_CFDI.length).toBe(24);
  });

  it("every entry has non-empty code, label_es, and label_en", () => {
    for (const entry of USO_CFDI) {
      expect(entry.code).toBeTruthy();
      expect(entry.label_es).toBeTruthy();
      expect(entry.label_en).toBeTruthy();
    }
  });

  it("codes are unique", () => {
    const codes = USO_CFDI.map((e) => e.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("includes G01, G03, S01, CP01, CN01", () => {
    const codes = USO_CFDI.map((e) => e.code);
    expect(codes).toContain("G01");
    expect(codes).toContain("G03");
    expect(codes).toContain("S01");
    expect(codes).toContain("CP01");
    expect(codes).toContain("CN01");
  });
});
