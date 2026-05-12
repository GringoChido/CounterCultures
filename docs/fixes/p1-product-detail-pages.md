# [P1] Product Detail Pages — 354K SKUs, Stable URLs, SEO

> **Status:** PENDING · **Priority:** P1 · **Effort:** 2-3 days · **Branch:** `claude/fix-product-detail-pages`
> **Last updated:** 2026-05-12

## Why this matters
THE BIG ONE. Counter Cultures sells 354,000 SKUs and has zero product-detail pages. Catalog cards are `<button>` elements that pop a modal — meaning no shareable URLs, no SEO surface for Google to index, no JSON-LD product schema, no deep-linking from WhatsApp DMs, no "send your customer this link" workflow for the sales team, and no PDP for ads to drive to. Every other furniture/decor ecommerce site in Mexico has PDPs; we're the only one operating like a 2009 catalog viewer. Without PDPs, our 354K-product moat is invisible — competitors with 10K SKUs and decent SEO are out-ranking us on every search.

## The problem (evidence)
- `app/(public)/shop/[category]/page.tsx` renders product cards as `<button onClick={openModal}>`, not `<Link>`.
- No `/shop/[category]/p/[slug]` or `/p/[slug]` route exists.
- Search palette (`app/components/search-palette.tsx`) navigates to filtered catalog URLs, never to a PDP.
- `CC_Products_Full` sheet has NO `slug` column — 354K rows can't have stable URLs without backfill.
- No `generateStaticParams` exists for the catalog; all routing is client-side filter state.
- No JSON-LD `Product` schema is emitted anywhere.

## Scope
**In scope:**
- New PDP routes: `/[locale]/shop/[category]/p/[slug]/page.tsx` and `/[locale]/p/[slug]/page.tsx` (fallback).
- Slug column on `CC_Products_Full` + backfill script.
- Static generation for top ~200 (Showroom Selection) via `generateStaticParams`.
- ISR (revalidate 1800s) for the long tail.
- Product cards on catalog rendered as `<Link>`.
- Search palette navigates to PDPs.
- JSON-LD `Product` schema in `<head>`.
- Trade-price swap on PDP (uses P1.3).
- Image gallery, related products, breadcrumbs.

**Out of scope:**
- Product reviews / Q&A (P3).
- "Customers also bought" recommendation engine (P3 — for v1, "related products" = same category).
- Variant selectors beyond what exists in Schema A (use as-is).

## Files to touch
- New `app/[locale]/shop/[category]/p/[slug]/page.tsx` — primary PDP.
- New `app/[locale]/p/[slug]/page.tsx` — fallback deep-link PDP (redirects to category-prefixed canonical).
- New `app/(public)/components/product-detail.tsx` — shared PDP UI component.
- Modify `app/lib/products-full.ts` — add `getProductBySlug(slug)`, ensure slug index built.
- Modify `app/(public)/shop/[category]/page.tsx` — wrap cards in `<Link>`.
- Modify `app/components/search-palette.tsx` — navigate to PDP URL.
- New `scripts/backfill-product-slugs.ts` — one-shot script to populate `slug` column for all 354K rows.
- New `app/lib/slug.ts` — `toSlug(name, sku)` shared helper.

## Slug strategy
- Format: `kebab(deAccent(name)) + "-" + lowercase(sku)`, max 80 chars (truncate `name` part if needed).
- Examples: `silla-eames-walnut-base-blanca-cc12345`, `mesa-comedor-roble-180x90-od98765`.
- Deterministic, idempotent — running the backfill twice produces the same value.
- Uniqueness: SKU suffix guarantees it; if a collision ever happens, append `-2`, `-3`, etc.

## The fix (step by step)
1. Add `slug` column to `CC_Products_Full`. Default empty for now.
2. Write `scripts/backfill-product-slugs.ts`:
   - Read all rows in batches of 5000.
   - Compute slug via `toSlug(name, sku)`.
   - Write back in batched updates (Sheets API `values.batchUpdate`).
   - Log progress every 10k rows. Expected runtime: 30–60 min for 354K rows.
3. Run the backfill against production sheet (one-time). Confirm no nulls.
4. Implement `getProductBySlug(slug)` in `products-full.ts` — uses an in-memory `slug → row` index built lazily, cached for the lifetime of the lambda.
5. Build `app/[locale]/shop/[category]/p/[slug]/page.tsx`:
   - `generateStaticParams()` returns top 200 Showroom Selection slugs only.
   - `generateMetadata()` emits SEO tags + canonical.
   - Page body renders `<ProductDetail />`.
   - `export const revalidate = 1800;` for ISR.
6. Build `app/[locale]/p/[slug]/page.tsx` (fallback):
   - Look up category from product row, 308-redirect to canonical `/shop/{category}/p/{slug}`.
7. Build `<ProductDetail />` UI:
   - Breadcrumb (home › category › product name).
   - Gallery (primary image + thumbnails; lazy-load).
   - Title, brand link, SKU pill, stock indicator.
   - Price block — pull `tradeContext` from session, swap price if `isTrade`.
   - Spanish description (always), English (when available, toggle).
   - Specs table (rendered from Schema A spec fields).
   - "Agregar al carrito" CTA → calls cart-store `addItem`.
   - Related products row — same category, sample 8.
8. Add JSON-LD `<script type="application/ld+json">` with `@type: Product`, `name`, `image`, `description`, `sku`, `brand`, `offers` (price, priceCurrency, availability).
9. Update `app/(public)/shop/[category]/page.tsx` — replace `<button onClick={openModal}>` with `<Link href={canonical}>`. Remove modal.
10. Update search palette — on result click, navigate to PDP URL via `router.push(canonical)`.
11. Add `next-sitemap` (or extend existing sitemap) to include all PDP URLs.

## Acceptance criteria
- [ ] Every product in `CC_Products_Full` has a non-empty `slug`.
- [ ] `/shop/sillas/p/silla-eames-walnut-blanca-cc12345` returns 200 with full PDP HTML.
- [ ] `/p/silla-eames-walnut-blanca-cc12345` 308-redirects to the category-prefixed URL.
- [ ] Showroom Selection PDPs are statically generated at build (verify in `.next/server/app/...`).
- [ ] Non-Showroom PDPs serve from ISR cache, first miss <2s, subsequent hits <200ms.
- [ ] Catalog cards are `<a>` tags — right-click "open in new tab" works.
- [ ] Search palette navigates to PDPs.
- [ ] JSON-LD validates via Google Rich Results test.
- [ ] Trade customer sees trade price on PDP.
- [ ] Sitemap includes all PDP URLs.

## Verification
```bash
# Build with static params
npm run build
# Look for prerendered top-200
ls .next/server/app/es-MX/shop/*/p/

# Hit a dynamic one
curl -i "$BASE_URL/es-MX/shop/sillas/p/silla-eames-walnut-blanca-cc12345"

# JSON-LD check
curl -s "$BASE_URL/es-MX/shop/sillas/p/silla-eames-walnut-blanca-cc12345" \
  | grep -A 30 'application/ld+json'
```
Expected: 200, valid HTML, JSON-LD present with `"@type": "Product"`.

## Dependencies
**Requires:** P1.3 (Trade pricing — PDP shows correct price), P1.10 (Image CDN — without it, gallery is slow).
**Blocks:** SEO indexing, paid-ads landing pages, WhatsApp "send a link" sales workflow, sitemap generation, product schema in Google Shopping feed.

## Notes
- Slug backfill is the biggest single risk — script must be idempotent and resumable. Save progress to a small `slug_backfill_state.json` after each batch.
- 354K static pages is NOT feasible — Vercel/Netlify build times would explode. ISR is the right call for the long tail.
- If catalog images aren't yet on the CDN (P1.10), PDPs will look bad — sequence those two carefully (CDN first, ideally).
- `revalidate = 1800` (30 min) is a balance between freshness and CPU; tighten to 300 only if inventory updates become real-time.
- Use the existing `app/components/Breadcrumbs.tsx` if present, otherwise inline.
- Future: per-product Open Graph image generation via `next/og` for richer social previews.
