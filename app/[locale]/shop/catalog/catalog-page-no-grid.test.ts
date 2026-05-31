import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const pagePath = path.join(
  process.cwd(),
  "app/[locale]/shop/catalog/page.tsx",
);
const pageSource = readFileSync(pagePath, "utf-8");

const catalogViewPath = path.join(
  process.cwd(),
  "app/[locale]/shop/catalog/catalog-view.tsx",
);

describe("Catalog page — no grid, no sidebar, no sort, no pagination", () => {
  it("does NOT render <CatalogView>", () => {
    expect(pageSource).not.toMatch(/<CatalogView[\s>]/);
  });

  it("does NOT render <ProductCard>", () => {
    expect(pageSource).not.toMatch(/<ProductCard[\s>]/);
  });

  it("does NOT render a sidebar element (id='catalog-sidebar' or 'sidebar' aria role)", () => {
    expect(pageSource).not.toMatch(/id="catalog-sidebar"/);
    expect(pageSource).not.toMatch(/role="complementary"/);
  });

  it("does NOT render a sort dropdown (no sort select / SortKey usage)", () => {
    expect(pageSource).not.toMatch(/initialSort/);
    expect(pageSource).not.toMatch(/sortDropdown/);
  });

  it("does NOT render pagination controls (no Page N of M / pagination markup)", () => {
    expect(pageSource).not.toMatch(/<Pagination/);
    expect(pageSource).not.toMatch(/Page \{[^}]+\} of/);
  });

  it("does NOT fetch top-24 products via searchProductsIndexed in page.tsx", () => {
    expect(pageSource).not.toMatch(/searchProductsIndexed/);
    expect(pageSource).not.toMatch(/initialResult/);
  });

  it("renders BrowseByDiscipline", () => {
    expect(pageSource).toMatch(/<BrowseByDiscipline/);
  });

  it("renders ArtisanProfiles, CatalogBrandWall, HowItWorksBand in order after BrowseByDiscipline", () => {
    const browsePos = pageSource.indexOf("<BrowseByDiscipline");
    const artisanPos = pageSource.indexOf("<ArtisanProfiles");
    const brandWallPos = pageSource.indexOf("<CatalogBrandWall");
    const howItWorksPos = pageSource.indexOf("<HowItWorksBand");
    expect(browsePos).toBeGreaterThan(-1);
    expect(artisanPos).toBeGreaterThan(browsePos);
    expect(brandWallPos).toBeGreaterThan(artisanPos);
    expect(howItWorksPos).toBeGreaterThan(brandWallPos);
  });

  it("catalog-view.tsx is deleted from the project", () => {
    expect(existsSync(catalogViewPath)).toBe(false);
  });
});
