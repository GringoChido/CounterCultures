import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DISCIPLINE_SPREADS } from "./constants";

const PUBLIC_DIR = resolve(__dirname, "../../public");

// ── Hero images exist on disk ───────────────────────────────────────

describe("BrowseByDiscipline hero images — files exist", () => {
  for (const s of DISCIPLINE_SPREADS) {
    it(`${s.label.en} heroImage exists at ${s.heroImage}`, () => {
      const fullPath = resolve(PUBLIC_DIR, s.heroImage.replace(/^\//, ""));
      expect(existsSync(fullPath)).toBe(true);
    });
  }
});

// ── Hero image paths are well-formed ────────────────────────────────

describe("BrowseByDiscipline hero images — path structure", () => {
  it("every heroImage starts with /", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.heroImage.startsWith("/")).toBe(true);
    }
  });

  it("every heroImage has a recognized image extension", () => {
    const validExts = [".webp", ".avif", ".jpg", ".jpeg", ".png"];
    for (const s of DISCIPLINE_SPREADS) {
      const ext = s.heroImage.slice(s.heroImage.lastIndexOf("."));
      expect(validExts).toContain(ext);
    }
  });

  it("alt text should include discipline name (EN label exists)", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.label.en.length).toBeGreaterThan(0);
    }
  });

  it("alt text should include discipline name (ES label exists)", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.label.es.length).toBeGreaterThan(0);
    }
  });

  it("no heroImage uses background-image syntax", () => {
    for (const s of DISCIPLINE_SPREADS) {
      expect(s.heroImage).not.toContain("url(");
      expect(s.heroImage).not.toContain("background");
    }
  });
});
