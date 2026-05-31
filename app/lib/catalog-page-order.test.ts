import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const catalogPageSource = readFileSync(
  path.join(process.cwd(), "app/[locale]/shop/catalog/page.tsx"),
  "utf-8",
);

describe("Catalog page section order", () => {
  it("BrowseByDiscipline renders BEFORE ArtisanProfiles", () => {
    const browsePos = catalogPageSource.indexOf("<BrowseByDiscipline");
    const artisanPos = catalogPageSource.indexOf("<ArtisanProfiles");
    expect(browsePos, "BrowseByDiscipline should exist in the page").toBeGreaterThan(-1);
    expect(artisanPos, "ArtisanProfiles should exist in the page").toBeGreaterThan(-1);
    expect(artisanPos).toBeGreaterThan(browsePos);
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

  it("the discovery page composition is BrowseByDiscipline → ArtisanProfiles → CatalogBrandWall → HowItWorksBand", () => {
    const browsePos = catalogPageSource.indexOf("<BrowseByDiscipline");
    const artisanPos = catalogPageSource.indexOf("<ArtisanProfiles");
    const brandWallPos = catalogPageSource.indexOf("<CatalogBrandWall");
    const howItWorksPos = catalogPageSource.indexOf("<HowItWorksBand");
    expect(browsePos).toBeGreaterThan(-1);
    expect(artisanPos).toBeGreaterThan(browsePos);
    expect(brandWallPos).toBeGreaterThan(artisanPos);
    expect(howItWorksPos).toBeGreaterThan(brandWallPos);
  });

  it("no <CatalogView> remains (the legacy grid has been removed)", () => {
    expect(catalogPageSource).not.toMatch(/<CatalogView[\s>]/);
  });
});
