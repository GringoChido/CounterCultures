import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.join(
    process.cwd(),
    "app/components/sections/catalog-brand-wall.tsx",
  ),
  "utf-8",
);

describe("Brand tiles — image hygiene", () => {
  it("does not use backgroundImage in style prop", () => {
    expect(source).not.toContain("backgroundImage");
  });

  it("does not use background-image CSS property", () => {
    expect(source).not.toContain("background-image");
  });

  it("imports next/image", () => {
    expect(source).toContain('from "next/image"');
  });

  it("uses <Image> component for brand tile images", () => {
    expect(source).toContain("<Image");
  });

  it("every <Image> usage has a sizes attribute", () => {
    const imageBlocks = source.split("<Image");
    // Skip the first element (before any <Image)
    for (let i = 1; i < imageBlocks.length; i++) {
      const block = imageBlocks[i];
      const closingIndex = block.indexOf("/>");
      const snippet = block.slice(0, closingIndex > -1 ? closingIndex : 200);
      expect(
        snippet,
        `<Image block #${i} is missing a sizes attribute`,
      ).toContain("sizes=");
    }
  });

  it("does not use priority on below-fold images", () => {
    // CatalogBrandWall is below the fold — no image should have priority
    expect(source).not.toContain("priority");
  });
});
