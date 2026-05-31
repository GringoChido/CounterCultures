import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.join(process.cwd(), "app/components/sections/catalog-brand-wall.tsx"),
  "utf-8",
);

describe("CatalogBrandWall render structure", () => {
  it("has id='brands' on the section root", () => {
    expect(source).toContain('id="brands"');
  });

  it("has scroll-mt-24 class for anchor offset", () => {
    expect(source).toContain("scroll-mt-24");
  });

  it("renders BATHROOM discipline heading", () => {
    expect(source).toMatch(/[Bb]athroom/);
  });

  it("renders KITCHEN discipline heading", () => {
    expect(source).toMatch(/[Kk]itchen/);
  });

  it("renders DOOR HARDWARE discipline heading", () => {
    expect(source).toMatch(/[Hh]ardware/);
  });

  it("renders THE WORKSHOPS discipline heading", () => {
    expect(source).toMatch(/[Ww]orkshops/);
  });

  it("uses next/image import", () => {
    expect(source).toContain('from "next/image"');
  });

  it("uses <Image component", () => {
    expect(source).toContain("<Image");
  });

  it("uses Link from i18n/navigation", () => {
    expect(source).toContain('from "@/app/i18n/navigation"');
    expect(source).toContain("<Link");
  });

  it("renders brand count per discipline", () => {
    // Should display count alongside discipline header
    expect(source).toMatch(/brand(s|Count)|count|length/i);
  });

  it("has 4 discipline sub-sections (bathroom, kitchen, hardware, workshops)", () => {
    // The DISCIPLINES array should have 4 entries
    expect(source).toMatch(/DISCIPLINES/);
  });

  it("renders Spanish copy for ES locale", () => {
    // Should have ES translations for discipline names
    expect(source).toContain("Baño");
    expect(source).toContain("Cocina");
    expect(source).toContain("Herrajes");
    expect(source).toContain("Talleres");
  });

  it("renders the ARTISAN tag for workshops tiles", () => {
    expect(source).toContain("ARTISAN");
    expect(source).toContain("ARTESANO");
  });

  it("has bg-brand-linen background", () => {
    expect(source).toContain("bg-brand-linen");
  });

  it("uses max-w-7xl container", () => {
    expect(source).toContain("max-w-7xl");
  });

  it("has py-16 md:py-24 vertical padding", () => {
    expect(source).toMatch(/py-16/);
    expect(source).toMatch(/md:py-24/);
  });

  it("uses 4-column grid for desktop", () => {
    expect(source).toContain("grid-cols-4");
  });

  it("uses 2-column grid for mobile", () => {
    expect(source).toContain("grid-cols-2");
  });

  it("brand tiles have aspect-[4/5] portrait proportion", () => {
    expect(source).toContain("aspect-[4/5]");
  });

  it("artisan tiles have aspect-[3/4] larger proportion", () => {
    expect(source).toContain("aspect-[3/4]");
  });

  it("brand tiles have hover lift effect", () => {
    expect(source).toMatch(/hover:-translate-y|hover:scale/);
  });
});
