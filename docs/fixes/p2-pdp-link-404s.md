# [P2] PDP Link 404s — ProductFull Missing Slug

> **Status:** DONE · **Priority:** P2 · **Effort:** 1 hr · **Branch:** `fix/pdp-link-404s`
> **Last updated:** 2026-05-14

## Why this matters

Clicking any product card on the catalog grid, search palette, or brand page emitted
`/shop/{category}/p/undefined` because `ProductFull` (354K Odoo catalog) declared
`slug?: string` but never populated it at construction time. Every catalog-sourced PDP
link was a 404.

## Root cause

- `ProductFull` (app/lib/products-full.ts) had `slug` as an optional field, never set
  during the `load()` → row-parse loop.
- The PDP route resolves products via `getProductBySlug(slug)` which builds a slug index
  from `toSlug(name, sku)` — a deterministic function of name + SKU.
- Link constructors used `product.slug` (undefined) or `product.slug || product.sku`
  (raw SKU, which doesn't match the `toSlug()` output) → 404 either way.

## What this is NOT

This fix addresses **link 404s** (clicking a product card leads to a dead page).
The separate `p2-product-image-404s.md` addresses **image asset 404s** (broken
thumbnails on catalog tiles). Different root cause, different fix surface.

## Fix summary

1. **Populate `slug` at read time** — `products-full.ts` now calls `toSlug(name, sku)`
   during product construction and stores it on every `ProductFull`. Made `slug` required
   on the interface (was optional). Updated `stripIndex()` to carry it through.

2. **PDP resolver fallback** — `getProductBySlug()` now tries three lookups:
   (a) exact slug-index match, (b) SKU-slug match, (c) case-insensitive raw SKU match.
   Handles old bookmarks or external links that used raw SKU as slug.

3. **Link constructors patched** — `catalog-view.tsx` and `search-palette.tsx` now use
   the populated `product.slug` instead of `product.slug || product.sku`.

4. **Manual ProductFull constructors** — `product-detail-panel.tsx` and
   `product-drawer.tsx` both construct partial `ProductFull` objects for variant
   selection; added `slug: toSlug(v.name, v.sku)` to each.

## Files touched

- `app/lib/products-full.ts` — slug field required, populated at load, carried in stripIndex, SKU fallback in resolver
- `app/lib/slug.ts` — unchanged (already had `toSlug`)
- `app/lib/slug.test.ts` — new: 5 unit tests for `toSlug` determinism + edge cases
- `app/[locale]/shop/catalog/catalog-view.tsx` — drop `|| p.sku` fallback
- `app/components/search/search-palette.tsx` — use `toSlug` fallback
- `app/(dashboard)/dashboard/(portal)/products/product-detail-panel.tsx` — add slug to variant pick
- `app/[locale]/shop/catalog/product-drawer.tsx` — add slug to variant pick

## Verification

- `npm run typecheck` passes
- `npx vitest run app/lib/slug.test.ts` — 5/5 pass
- Manual: catalog grid product cards link to valid PDP URLs (no `/p/undefined`)
