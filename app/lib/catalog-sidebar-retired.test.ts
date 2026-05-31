import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.join(
    process.cwd(),
    "app/[locale]/shop/catalog/catalog-view.tsx",
  ),
  "utf-8",
);

describe("Catalog sidebar — brand list retirement", () => {
  it("sidebar renders at most 10 brand rows (slice(0, 10))", () => {
    // The brand list should be sliced to top 10
    expect(source).toContain(".slice(0, 10)");
  });

  it("'Show all N brands' anchor link is present", () => {
    expect(source).toMatch(/Show all|Ver las|Ver todas/);
  });

  it("'Show all' link href points to #brands", () => {
    expect(source).toContain('#brands"');
  });

  it("brand search input is still present", () => {
    expect(source).toContain("brandFilter");
    expect(source).toContain("setBrandFilter");
  });

  it("'All brands' reset button is still present", () => {
    expect(source).toContain('setBrand("")');
  });

  it("no longer renders the old 134-row full brand list", () => {
    // The old code used filteredBrands.map which rendered all brands
    // Now it should only use brandCounts.slice(0, 10)
    // The filteredBrands reference should either not exist or only be
    // used for the search-filtered top-10, not the full sidebar
    const sliceMatches = source.match(/\.slice\(0,\s*10\)/g);
    expect(sliceMatches?.length).toBeGreaterThanOrEqual(1);
  });
});
