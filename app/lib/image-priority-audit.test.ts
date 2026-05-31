import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ALLOWED_PRIORITY_FILES = [
  "app/[locale]/shop/catalog/page.tsx",
  "app/components/sections/browse-by-discipline.tsx",
];

const CATALOG_TREE_FILES = [
  "app/[locale]/shop/catalog/page.tsx",
  "app/components/sections/browse-by-discipline.tsx",
  "app/components/sections/artisan-profiles.tsx",
  "app/components/sections/catalog-brand-wall.tsx",
  "app/components/catalog/catalog-search-panel.tsx",
  "app/components/sections/how-it-works-band.tsx",
];

const readSource = (rel: string): string =>
  readFileSync(path.join(process.cwd(), rel), "utf-8");

describe("Image priority audit — catalog tree", () => {
  it("priority appears only in allowed above-the-fold files", () => {
    const unexpected: string[] = [];
    for (const file of CATALOG_TREE_FILES) {
      if (ALLOWED_PRIORITY_FILES.includes(file)) continue;
      const src = readSource(file);
      if (/\bpriority\b/.test(src)) {
        unexpected.push(file);
      }
    }
    expect(
      unexpected,
      `Unexpected priority hint in: ${unexpected.join(", ")}`,
    ).toEqual([]);
  });

  it("catalog hero in page.tsx has priority", () => {
    const src = readSource("app/[locale]/shop/catalog/page.tsx");
    const heroBlock = src.split("<Image")[1] ?? "";
    const closing = heroBlock.indexOf("/>");
    const snippet = heroBlock.slice(0, closing > -1 ? closing : 300);
    expect(snippet).toContain("priority");
  });

  it("first discipline spread has priority, rest do not", () => {
    const src = readSource(
      "app/components/sections/browse-by-discipline.tsx",
    );
    expect(src).toContain("priorityImage={i === 0}");
    expect(src).toContain("priority={priorityImage}");
  });
});
