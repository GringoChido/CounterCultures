import { describe, it, expect } from "vitest";
import { REGIMEN_FISCAL } from "../regimen-fiscal";

describe("REGIMEN_FISCAL catalog", () => {
  it("contains all 22 SAT regimen codes", () => {
    expect(REGIMEN_FISCAL.length).toBe(22);
  });

  it("every entry has non-empty code, label_es, and label_en", () => {
    for (const entry of REGIMEN_FISCAL) {
      expect(entry.code).toBeTruthy();
      expect(entry.label_es).toBeTruthy();
      expect(entry.label_en).toBeTruthy();
    }
  });

  it("every entry has a valid appliesTo value", () => {
    for (const entry of REGIMEN_FISCAL) {
      expect(["fisica", "moral", "both"]).toContain(entry.appliesTo);
    }
  });

  it("codes are unique", () => {
    const codes = REGIMEN_FISCAL.map((e) => e.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("includes key codes 601, 612, 626", () => {
    const codes = REGIMEN_FISCAL.map((e) => e.code);
    expect(codes).toContain("601");
    expect(codes).toContain("612");
    expect(codes).toContain("626");
  });
});
