import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { artisans, type ArtisanProfile } from "@/app/components/sections/artisan-profiles";

describe("Artisan profiles data", () => {
  it("contains exactly 4 artisans", () => {
    expect(artisans).toHaveLength(4);
  });

  it("every artisan has a name", () => {
    for (const a of artisans) {
      expect(a.name).toBeTruthy();
    }
  });

  it("every artisan has craft in EN and ES", () => {
    for (const a of artisans) {
      expect(a.craft.en).toBeTruthy();
      expect(a.craft.es).toBeTruthy();
    }
  });

  it("every artisan has detail in EN and ES", () => {
    for (const a of artisans) {
      expect(a.detail.en).toBeTruthy();
      expect(a.detail.es).toBeTruthy();
    }
  });

  it("ES detail strings are distinct from EN (not accidentally English)", () => {
    for (const a of artisans) {
      expect(a.detail.en).not.toBe(a.detail.es);
    }
  });

  it("every artisan has an image path", () => {
    for (const a of artisans) {
      expect(a.image).toBeTruthy();
    }
  });

  it("every image path matches a file that exists on disk", () => {
    for (const a of artisans) {
      const filePath = path.join(process.cwd(), "public", a.image);
      expect(existsSync(filePath), `Missing image: ${a.image} for ${a.name}`).toBe(true);
    }
  });

  it("every artisan has a non-empty href starting with /brands", () => {
    for (const a of artisans) {
      expect(a.href).toBeTruthy();
      expect(a.href.startsWith("/brands"), `href for ${a.name} should start with /brands`).toBe(true);
    }
  });

  it("the expected artisan names are present", () => {
    const names = artisans.map((a) => a.name);
    expect(names).toContain("Mistoa");
    expect(names).toContain("Castro");
    expect(names).toContain("Familia Meza");
    expect(names).toContain("Manriquez");
  });
});
