# [P2] Product Image 404 Audit & Backfill

> **Status:** PENDING · **Priority:** P2 · **Effort:** 4 hrs · **Branch:** `claude/fix-product-image-404s`
> **Last updated:** 2026-05-12

## Why this matters
30% of visible catalog product images return 404 (18 of 60 sampled). This degrades every PLP and PDP, hurts trust, and likely tanks conversion. Customers see "broken image" icons on a third of the catalog tiles — across 354K products that is a massive surface of brand damage.

## The problem (evidence)
- Manual sample: 18/60 PLP image requests returned 404.
- `CC_Products_Full` sheet references `image_filename` values pointing at `/public/products/odoo/<sku>.jpg` paths that don't exist on disk.
- No build-time validation; broken refs ship to prod silently.

## Scope
**In scope:**
- Build `scripts/audit-product-images.ts` that walks `CC_Products_Full`, checks each `image_filename` against `/public/products/odoo/`, outputs `image-audit.csv` with `{sku, referenced_path, exists, suggested_action}`.
- Backfill missing images where source files can be recovered (check Odoo export, Google Drive, brand sites).
- For unrecoverable refs, null the `image_filename` column so a placeholder fallback renders.
- Add `scripts/check-product-images.ts` to CI that fails build if >5% of products have broken images.

**Out of scope:**
- Image optimization / WebP conversion (separate).
- Adding NEW images for products that never had one — only restoring referenced-but-missing ones.

## Files to touch
- `scripts/audit-product-images.ts` (new)
- `scripts/check-product-images.ts` (new)
- `package.json` (add `audit:images`, `check:images` scripts)
- `.github/workflows/ci.yml` or `netlify.toml` build step (add image check)
- `app/components/product/product-image.tsx` (confirm fallback works when filename is null)

## The fix (step by step)
1. Write `audit-product-images.ts` reading the products sheet via existing `sheets-client.ts`, iterating rows, `fs.existsSync` each referenced path.
2. Output `image-audit.csv` with one row per product; include `referenced_path`, `exists` bool, `file_size_if_present`.
3. Cross-reference missing filenames against alternate sources (Odoo CSV dump, `/public/products/_legacy/`, brand kit) and copy any recovered files into `/public/products/odoo/`.
4. For the residual unrecoverable set, batch-update the sheet to set `image_filename = null` (placeholder fallback kicks in).
5. Build `check-product-images.ts` returning exit code 1 when broken-ref ratio > 0.05.
6. Wire the check into the Netlify build command.

## Acceptance criteria
- [ ] `npm run audit:images` produces `image-audit.csv`.
- [ ] Recoverable images are copied into `/public/products/odoo/`.
- [ ] Unrecoverable refs in the sheet are nulled so placeholder renders.
- [ ] `npm run check:images` exits 0 on a healthy catalog and 1 when >5% broken.
- [ ] Netlify build fails on broken-image threshold.

## Verification
```bash
npm run audit:images && npm run check:images
```
Expected: CSV generated, check command prints `Broken: X / Total: Y (Z%) — within threshold` and exits 0.

## Dependencies
**Requires:** none.
**Blocks:** none.

## Notes
See `AGENTS.md` for sheet schema conventions. Product image fallback component lives in `app/components/product/product-image.tsx` — confirm it gracefully handles `null` / empty `image_filename` before nulling refs en masse.
