/**
 * PDP description resolver — the single source of truth for what text the
 * product detail page (and its <meta>, OpenGraph, and JSON-LD blocks) shows
 * as the product description.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  WHY THIS FILE EXISTS — DO NOT INLINE THIS LOGIC INTO page.tsx
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * On 2026-05-12, commit 9fbe146 ("feat: Step 11 — product detail pages for
 * 354K SKU catalog") rewrote the PDP and made every product page read the
 * description ONLY from `app/lib/product-content.json` (the hand-curated
 * sidecar that covers ~666 SKUs). The CRM-sourced `ProductFull.descriptionEs`
 * / `descriptionEn` fields — populated for the rest of the 354K catalog —
 * stopped being rendered. The result: blank product pages for ~99.7% of the
 * catalog.
 *
 * To stop that from happening again:
 *
 *   1. The resolver lives in this file, and is the ONLY thing page.tsx is
 *      allowed to call when computing the displayed description.
 *   2. Vitest in app/lib/pdp-description.test.ts pins the resolution chain.
 *      If a future change drops a source from the chain, the test fails.
 *   3. scripts/checks/assert-pdp-renders-description.ts samples real catalog
 *      data and asserts the resolver does not return an empty string for any
 *      product that has source content. Wire this into CI / `next build`.
 *
 * The invariant is also documented in docs/commerce/PDP-DESCRIPTION-RULES.md.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  RESOLUTION CHAIN  (ordered, do not narrow without updating the test)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   1. Sidecar JSON in the requested locale         (content.description<Lang>)
 *   2. Sidecar JSON in the other locale             (content.description<Other>)
 *   3. ProductFull (CRM) in the requested locale    (product.description<Lang>)
 *   4. ProductFull (CRM) in the other locale        (product.description<Other>)
 *   5. Brand + name string                          ("{brand} {name}")
 *
 * Steps 1 and 2 win when the sidecar exists (it's hand-curated, higher
 * quality). Steps 3 and 4 cover the long tail. Step 5 guarantees the
 * resolver NEVER returns an empty string — there is always something to
 * display.
 */

export interface PdpDescriptionSources {
  /** Sidecar `getProductContent(id)` — may be null/undefined for most SKUs. */
  content: {
    descriptionEs?: string;
    descriptionEn?: string;
  } | null | undefined;
  /** The ProductFull record from the CRM sheet. Always present on PDP. */
  product: {
    name: string;
    brand: string;
    descriptionEs?: string;
    descriptionEn?: string;
  };
  /** Which locale the user is viewing. */
  locale: "en" | "es";
}

export interface ResolvedPdpDescription {
  /** The description to show in the visible "Description" block. Non-empty. */
  primary: string;
  /** Spanish description, resolved with the same chain (for JSON-LD / meta). */
  es: string | undefined;
  /** English description, resolved with the same chain (for JSON-LD / meta). */
  en: string | undefined;
  /** Where `primary` came from. Useful for build-time auditing. */
  source: "sidecar-locale" | "sidecar-other" | "crm-locale" | "crm-other" | "fallback";
}

const nonEmpty = (s: string | undefined | null): s is string =>
  typeof s === "string" && s.trim().length > 0;

/**
 * Resolve the description to render on the PDP.
 *
 * Guarantees:
 *   - `primary` is always a non-empty string.
 *   - `es` / `en` follow the same chain so JSON-LD and the visible block
 *     stay in sync.
 *   - The chain is pinned by tests in `pdp-description.test.ts`.
 */
export function resolvePdpDescription(
  sources: PdpDescriptionSources,
): ResolvedPdpDescription {
  const { content, product, locale } = sources;

  const sidecarLocale = locale === "es" ? content?.descriptionEs : content?.descriptionEn;
  const sidecarOther  = locale === "es" ? content?.descriptionEn : content?.descriptionEs;
  const crmLocale     = locale === "es" ? product.descriptionEs : product.descriptionEn;
  const crmOther      = locale === "es" ? product.descriptionEn : product.descriptionEs;

  // ES / EN values for downstream consumers (JSON-LD, OpenGraph, meta).
  const es = pickFirst(content?.descriptionEs, product.descriptionEs);
  const en = pickFirst(content?.descriptionEn, product.descriptionEn);

  if (nonEmpty(sidecarLocale)) return { primary: sidecarLocale, es, en, source: "sidecar-locale" };
  if (nonEmpty(sidecarOther))  return { primary: sidecarOther,  es, en, source: "sidecar-other"  };
  if (nonEmpty(crmLocale))     return { primary: crmLocale,     es, en, source: "crm-locale"    };
  if (nonEmpty(crmOther))      return { primary: crmOther,      es, en, source: "crm-other"     };

  return {
    primary: `${product.brand} ${product.name}`.trim(),
    es,
    en,
    source: "fallback",
  };
}

function pickFirst(...vals: Array<string | undefined>): string | undefined {
  for (const v of vals) if (nonEmpty(v)) return v;
  return undefined;
}
