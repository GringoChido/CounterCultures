import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const artisanSource = readFileSync(
  path.join(process.cwd(), "app/components/sections/artisan-profiles.tsx"),
  "utf-8",
);

describe("Artisan images — no background-image hygiene", () => {
  it("does not use backgroundImage in style prop", () => {
    expect(artisanSource).not.toContain("backgroundImage");
  });

  it("does not use background-image CSS property", () => {
    expect(artisanSource).not.toContain("background-image");
  });

  it("imports next/image", () => {
    expect(artisanSource).toContain('from "next/image"');
  });

  it("uses the <Image> component", () => {
    expect(artisanSource).toContain("<Image");
  });
});
