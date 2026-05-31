import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const catalogPageSource = readFileSync(
  path.join(process.cwd(), "app/[locale]/shop/catalog/page.tsx"),
  "utf-8",
);

describe("Catalog page section order", () => {
  it("ArtisanProfiles renders AFTER CatalogView in the JSX", () => {
    const catalogViewPos = catalogPageSource.indexOf("<CatalogView");
    const artisanPos = catalogPageSource.indexOf("<ArtisanProfiles");
    expect(catalogViewPos, "CatalogView should exist in the page").toBeGreaterThan(-1);
    expect(artisanPos, "ArtisanProfiles should exist in the page").toBeGreaterThan(-1);
    expect(artisanPos).toBeGreaterThan(catalogViewPos);
  });

  it("ArtisanProfiles renders BEFORE the Footer", () => {
    const artisanPos = catalogPageSource.indexOf("<ArtisanProfiles");
    const footerPos = catalogPageSource.indexOf("<Footer");
    expect(artisanPos, "ArtisanProfiles should exist").toBeGreaterThan(-1);
    expect(footerPos, "Footer should exist").toBeGreaterThan(-1);
    expect(artisanPos).toBeLessThan(footerPos);
  });

  it("ArtisanProfiles is inside <main> (not after it)", () => {
    const mainClosePos = catalogPageSource.indexOf("</main>");
    const artisanPos = catalogPageSource.indexOf("<ArtisanProfiles");
    expect(artisanPos).toBeLessThan(mainClosePos);
  });

  it("#artisans anchor exists via ArtisanProfiles (component provides it)", () => {
    expect(catalogPageSource).toContain("<ArtisanProfiles");
  });

  it("CatalogView section appears before ArtisanProfiles (no reversed order)", () => {
    const lines = catalogPageSource.split("\n");
    let catalogViewLine = -1;
    let artisanLine = -1;
    lines.forEach((line, i) => {
      if (line.includes("<CatalogView")) catalogViewLine = i;
      if (line.includes("<ArtisanProfiles")) artisanLine = i;
    });
    expect(catalogViewLine).toBeGreaterThan(-1);
    expect(artisanLine).toBeGreaterThan(-1);
    expect(artisanLine).toBeGreaterThan(catalogViewLine);
  });
});
