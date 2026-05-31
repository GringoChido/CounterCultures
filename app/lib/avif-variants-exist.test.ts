import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { DISCIPLINE_SPREADS } from "@/app/lib/constants";
import { artisans } from "@/app/lib/artisan-data";

const pub = (rel: string) => path.join(process.cwd(), "public", rel);
const avifSibling = (webpPath: string) =>
  webpPath.replace(/\.webp$/, ".avif");

const hasWebpSource = (p: string) =>
  p.endsWith(".webp") && existsSync(pub(p));

describe("AVIF variants exist for hero imagery", () => {
  describe("discipline spread heroes", () => {
    for (const spread of DISCIPLINE_SPREADS) {
      const img = spread.heroImage;
      if (!hasWebpSource(img)) continue;

      it(`${spread.key} hero — ${img} has .avif sibling`, () => {
        expect(
          existsSync(pub(avifSibling(img))),
          `Missing ${avifSibling(img)}`,
        ).toBe(true);
      });
    }
  });

  describe("artisan profile images", () => {
    for (const artisan of artisans) {
      const img = artisan.image;
      if (!hasWebpSource(img)) continue;

      it(`${artisan.name} — ${img} has .avif sibling`, () => {
        expect(
          existsSync(pub(avifSibling(img))),
          `Missing ${avifSibling(img)}`,
        ).toBe(true);
      });
    }
  });

  it("catalog hero has .avif sibling", () => {
    const hero = "/Assets/home-hero/Lux BathRoom.webp";
    if (!existsSync(pub(hero))) return;
    expect(
      existsSync(pub(avifSibling(hero))),
      `Missing ${avifSibling(hero)}`,
    ).toBe(true);
  });
});
