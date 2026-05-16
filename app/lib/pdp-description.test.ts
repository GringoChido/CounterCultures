/**
 * Regression tests for the PDP description resolver.
 *
 * These tests exist to prevent a repeat of the May-2026 incident in which
 * product descriptions silently disappeared from ~99.7% of product pages
 * after the PDP refactor stopped reading from `ProductFull.description*`.
 *
 * DO NOT relax these assertions without updating
 * docs/commerce/PDP-DESCRIPTION-RULES.md and getting a human review.
 */

import { describe, expect, it } from "vitest";
import { resolvePdpDescription } from "./pdp-description";

const baseProduct = {
  name: "Widget 3000",
  brand: "Acme",
};

describe("resolvePdpDescription — invariant: never returns empty primary", () => {
  it("uses the sidecar in the viewer's locale when present", () => {
    const r = resolvePdpDescription({
      content: { descriptionEs: "Sidecar ES", descriptionEn: "Sidecar EN" },
      product: { ...baseProduct, descriptionEs: "CRM ES", descriptionEn: "CRM EN" },
      locale: "es",
    });
    expect(r.primary).toBe("Sidecar ES");
    expect(r.source).toBe("sidecar-locale");
  });

  it("uses the sidecar in the other locale when the requested one is missing", () => {
    const r = resolvePdpDescription({
      content: { descriptionEn: "Sidecar EN only" },
      product: { ...baseProduct, descriptionEs: "CRM ES", descriptionEn: "CRM EN" },
      locale: "es",
    });
    expect(r.primary).toBe("Sidecar EN only");
    expect(r.source).toBe("sidecar-other");
  });

  it("falls back to ProductFull (CRM) when the sidecar has no content", () => {
    const r = resolvePdpDescription({
      content: null,
      product: { ...baseProduct, descriptionEs: "CRM ES", descriptionEn: "CRM EN" },
      locale: "es",
    });
    expect(r.primary).toBe("CRM ES");
    expect(r.source).toBe("crm-locale");
  });

  it("falls back to CRM in the other locale when the requested one is missing", () => {
    const r = resolvePdpDescription({
      content: undefined,
      product: { ...baseProduct, descriptionEn: "CRM EN only" },
      locale: "es",
    });
    expect(r.primary).toBe("CRM EN only");
    expect(r.source).toBe("crm-other");
  });

  it("falls back to brand + name only when nothing else is available", () => {
    const r = resolvePdpDescription({
      content: null,
      product: baseProduct,
      locale: "en",
    });
    expect(r.primary).toBe("Acme Widget 3000");
    expect(r.source).toBe("fallback");
  });

  it("never returns an empty primary, no matter what", () => {
    // All the worst-case shapes we could hit in production.
    const cases = [
      { content: null, product: baseProduct, locale: "en" as const },
      { content: undefined, product: baseProduct, locale: "es" as const },
      { content: { descriptionEs: "", descriptionEn: "" }, product: { ...baseProduct, descriptionEs: "", descriptionEn: "" }, locale: "es" as const },
      { content: { descriptionEs: "  " }, product: { ...baseProduct, descriptionEn: "   " }, locale: "en" as const },
    ];
    for (const c of cases) {
      const r = resolvePdpDescription(c);
      expect(r.primary.trim().length).toBeGreaterThan(0);
    }
  });

  it("treats whitespace-only strings as empty", () => {
    const r = resolvePdpDescription({
      content: { descriptionEs: "   ", descriptionEn: "\n\t" },
      product: { ...baseProduct, descriptionEs: "Real CRM ES" },
      locale: "es",
    });
    expect(r.primary).toBe("Real CRM ES");
    expect(r.source).toBe("crm-locale");
  });

  it("exposes es/en separately for JSON-LD / OpenGraph consumers", () => {
    const r = resolvePdpDescription({
      content: { descriptionEs: "Sidecar ES" },
      product: { ...baseProduct, descriptionEs: "CRM ES", descriptionEn: "CRM EN" },
      locale: "es",
    });
    expect(r.es).toBe("Sidecar ES"); // sidecar wins for ES
    expect(r.en).toBe("CRM EN");     // CRM fills EN since sidecar lacks it
  });
});

describe("resolvePdpDescription — invariant: chain order is pinned", () => {
  it("sidecar always wins over CRM, even when sidecar is short", () => {
    const r = resolvePdpDescription({
      content: { descriptionEs: "a" },
      product: { ...baseProduct, descriptionEs: "A long, beautifully-written CRM description." },
      locale: "es",
    });
    expect(r.primary).toBe("a");
    expect(r.source).toBe("sidecar-locale");
  });
});
