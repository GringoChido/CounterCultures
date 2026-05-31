import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const CATALOG_COMPONENTS = [
  "app/components/sections/browse-by-discipline.tsx",
  "app/components/sections/artisan-profiles.tsx",
  "app/components/sections/catalog-brand-wall.tsx",
  "app/components/catalog/catalog-search-panel.tsx",
  "app/components/sections/how-it-works-band.tsx",
  "app/[locale]/shop/catalog/page.tsx",
];

const readSource = (rel: string): string =>
  readFileSync(path.join(process.cwd(), rel), "utf-8");

describe("Image hygiene — catalog component tree", () => {
  describe("no background-image for content imagery", () => {
    for (const file of CATALOG_COMPONENTS) {
      it(`${file} — no backgroundImage or background-image`, () => {
        const src = readSource(file);
        expect(src, `${file} uses backgroundImage`).not.toContain(
          "backgroundImage",
        );
        expect(src, `${file} uses background-image`).not.toContain(
          "background-image",
        );
      });
    }
  });

  describe("every <Image fill> has a sizes attribute", () => {
    for (const file of CATALOG_COMPONENTS) {
      it(`${file} — <Image fill> ⇒ sizes=`, () => {
        const src = readSource(file);
        const imageBlocks = src.split("<Image");
        for (let i = 1; i < imageBlocks.length; i++) {
          const block = imageBlocks[i];
          if (!block.includes("fill")) continue;
          const closing = block.indexOf("/>");
          const snippet = block.slice(0, closing > -1 ? closing : 300);
          expect(
            snippet,
            `<Image fill> #${i} in ${file} is missing sizes`,
          ).toContain("sizes=");
        }
      });
    }
  });
});
