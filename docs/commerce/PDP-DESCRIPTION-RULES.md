# PDP Description Rules — invariant, do not relax

**Status:** Hard rule. Violations have shipped customer-visible regressions before.
**Owner:** Joshua / Counter Cultures commerce.
**Source of truth:** `app/lib/pdp-description.ts`.

---

## The rule (one sentence)

Every product detail page must display a non-empty description — sourced from the curated sidecar JSON when available, falling back through the CRM-sourced `ProductFull` fields, and finally to a brand+name fallback. This chain is encoded in `resolvePdpDescription()` and pinned by tests.

---

## Why this file exists

On 2026-05-12, commit `9fbe146` (*"feat: Step 11 — product detail pages for 354K SKU catalog"*) rewrote the PDP and made every product page read the description **only** from `app/lib/product-content.json`. That file only covers ~666 of our ~354,000 SKUs. The CRM-sourced `ProductFull.descriptionEs` / `descriptionEn` fields kept being populated, but the page stopped reading them. The visible result: blank product pages for ~99.7% of the catalog. Customers, sales, and SEO all saw it before we did.

This document, plus the resolver, plus the test, plus the build-time check (once wired in), and a follow-up update of the PDP page to call `resolvePdpDescription`, are the layers that make that bug impossible to ship again.

---

## The resolution chain (ordered)

Implemented in `app/lib/pdp-description.ts`:

1. Sidecar JSON in the viewer's locale — `content.descriptionEs` / `content.descriptionEn`
2. Sidecar JSON in the other locale
3. CRM (`ProductFull`) in the viewer's locale — `product.descriptionEs` / `product.descriptionEn`
4. CRM in the other locale
5. Brand + name fallback — `"{brand} {name}"`

The sidecar wins because it's hand-curated by editorial. The CRM fallback covers the long tail. The brand+name fallback exists so the resolver can guarantee a non-empty return — there is *always* something to show.

The same chain is used for:

- The visible "Description" block on the PDP.
- The `<meta name="description">`, OpenGraph description, and Twitter card description.
- The Product JSON-LD `description` field used by Google for rich results.

Treat these as a single concern: if you change one source, change the resolver, and update the test in the same commit.

---

## Things you are not allowed to do

- **Do not** read `content?.descriptionEs` / `content?.descriptionEn` directly from inside `app/[locale]/shop/[category]/p/[slug]/page.tsx`. Always go through `resolvePdpDescription`.
- **Do not** narrow the chain (drop the CRM fallback, drop the brand+name fallback, drop the other-locale fallback).
- **Do not** swap the resolver for a new "smart" version without first updating `app/lib/pdp-description.test.ts` to pin the new behavior and rewriting this file.
- **Do not** delete `scripts/checks/assert-pdp-renders-description.ts` once it is wired into the `build` script. If it is too slow, lower `PDP_CHECK_SAMPLE`; do not skip it.

---

## Where the safeguards live

| Layer | File | Status | What it guarantees |
|---|---|---|---|
| Resolver | `app/lib/pdp-description.ts` | Shipped (this PR) | Single source of truth. Always returns non-empty. |
| Unit tests | `app/lib/pdp-description.test.ts` | Shipped (this PR) | Pins the order and the never-empty invariant. |
| Build-time check | `scripts/checks/assert-pdp-renders-description.ts` | Scaffolded (this PR), wiring follow-up | Walks the real catalog; once wired into `npm run build`, fails the build if any product with source content would render blank. |
| PDP page integration | `app/[locale]/shop/[category]/p/[slug]/page.tsx` | Follow-up | Currently still reads sidecar-only; must be updated to call `resolvePdpDescription` for the bug to actually stop. |
| Docs | `docs/commerce/PDP-DESCRIPTION-RULES.md` (this file) | Shipped (this PR) | Link from `CLAUDE.md` to be added in the wire-up follow-up. |

---

## If you think you need to change something here

1. Read the resolver, the test, and this doc end-to-end.
2. Open a ticket (or at least a commit body) that explains *why* the chain needs to change. Reference customer-visible behavior.
3. Update `pdp-description.ts`, `pdp-description.test.ts`, and this doc in the *same* commit.
4. Run `npx vitest run app/lib/pdp-description.test.ts` locally before pushing. (Once the build-time check is wired into `package.json`, also run that.)
5. Get a human review. This is not a refactor an AI should approve alone.
