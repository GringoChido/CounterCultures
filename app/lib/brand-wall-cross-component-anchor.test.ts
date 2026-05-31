import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const catalogViewSource = readFileSync(
  path.join(
    process.cwd(),
    "app/[locale]/shop/catalog/catalog-view.tsx",
  ),
  "utf-8",
);

const brandWallSource = readFileSync(
  path.join(
    process.cwd(),
    "app/components/sections/catalog-brand-wall.tsx",
  ),
  "utf-8",
);

const catalogPageSource = readFileSync(
  path.join(process.cwd(), "app/[locale]/shop/catalog/page.tsx"),
  "utf-8",
);

describe("Brand wall ↔ sidebar cross-component anchor contract", () => {
  it("sidebar has an anchor link with href='#brands'", () => {
    expect(catalogViewSource).toContain('#brands"');
  });

  it("brand wall section has id='brands'", () => {
    expect(brandWallSource).toContain('id="brands"');
  });

  it("CatalogBrandWall renders AFTER ArtisanProfiles in the page", () => {
    const artisanPos = catalogPageSource.indexOf("<ArtisanProfiles");
    const brandWallPos = catalogPageSource.indexOf("<CatalogBrandWall");
    expect(artisanPos, "ArtisanProfiles should exist").toBeGreaterThan(-1);
    expect(brandWallPos, "CatalogBrandWall should exist").toBeGreaterThan(-1);
    expect(brandWallPos).toBeGreaterThan(artisanPos);
  });

  it("HowItWorksBand renders AFTER CatalogBrandWall in the page", () => {
    const brandWallPos = catalogPageSource.indexOf("<CatalogBrandWall");
    const howItWorksPos = catalogPageSource.indexOf("<HowItWorksBand");
    expect(brandWallPos, "CatalogBrandWall should exist").toBeGreaterThan(-1);
    expect(howItWorksPos, "HowItWorksBand should exist").toBeGreaterThan(-1);
    expect(howItWorksPos).toBeGreaterThan(brandWallPos);
  });

  it("both components are inside <main>", () => {
    const mainClosePos = catalogPageSource.indexOf("</main>");
    const brandWallPos = catalogPageSource.indexOf("<CatalogBrandWall");
    const howItWorksPos = catalogPageSource.indexOf("<HowItWorksBand");
    expect(brandWallPos).toBeLessThan(mainClosePos);
    expect(howItWorksPos).toBeLessThan(mainClosePos);
  });

  it("CatalogBrandWall receives brandCounts prop", () => {
    expect(catalogPageSource).toMatch(
      /CatalogBrandWall[\s\S]*?brandCounts/,
    );
  });

  it("CatalogBrandWall receives brandImageMap prop", () => {
    expect(catalogPageSource).toMatch(
      /CatalogBrandWall[\s\S]*?brandImageMap/,
    );
  });
});
