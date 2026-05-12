# [P3] Brand Logo & Drive Asset Populator

> **Status:** PENDING · **Priority:** P3 · **Effort:** 1 day · **Branch:** `claude/fix-brand-logos`
> **Last updated:** 2026-05-12

## Why this matters
The brand directory and brand PDPs render plain text rows today because the Brand Kit's drive-asset columns (`logo_drive_id`, `hero_drive_id`, `brand_folder_drive_id`, `featured_product_ids`) are 100% empty across all 168 brands. This makes Counter Cultures look like a spec sheet rather than a curated showroom. Visual brand presence is table-stakes for the premium positioning Roger has set, and missing logos are the single most visible polish gap in audits.

## The problem (evidence)
- `docs/audit/brand-kit-audit.md`: drive-asset columns 0% populated across 168 rows.
- `app/[locale]/brands/page.tsx`: renders `<span>{brand.name}</span>` with no `<img>`.
- `app/[locale]/brands/[slug]/page.tsx`: hero region falls back to gradient placeholder.
- `lib/drive/upload.ts` already exists with a working uploader — just unused for brand assets.

## Scope
**In scope:**
- Script that takes a brand's `website_url`, fetches favicon/og:image/likely logo paths, downloads, uploads to Drive under `CC/Brands/<slug>/`, writes back `logo_drive_id`.
- Fallback manual upload via `/dashboard/brands/[slug]`.
- Render logos in directory + PDP.
- Populate at least the top 50 brands.

**Out of scope:**
- Hero imagery curation (separate art-direction pass).
- Featured product selection logic (separate P3).
- Auto-cropping / background removal.

## Files to touch
- `scripts/brand-assets/populate-logos.ts` — new bulk script.
- `lib/brand-assets/logo-fetcher.ts` — favicon/og scraping helpers.
- `lib/drive/upload.ts` — extend with `uploadFromUrl(url, folderPath)`.
- `app/dashboard/brands/[slug]/components/LogoUpload.tsx` — drop-zone fallback.
- `app/dashboard/brands/[slug]/actions.ts` — `uploadBrandLogo` server action.
- `app/[locale]/brands/page.tsx` — render `<img src={driveImageUrl(brand.logo_drive_id)} />`.
- `app/[locale]/brands/[slug]/page.tsx` — same.
- `lib/drive/image-url.ts` — helper to convert `drive_id` to public CDN URL (or proxied via existing `/api/drive/[id]`).

## The fix (step by step)
1. Build `logo-fetcher.ts`: given a URL, fetch HTML, parse `<link rel="icon">` and `<meta property="og:image">`, plus probe `/logo.png`, `/assets/logo.svg`, `/static/logo.svg`. Prefer SVG > PNG > JPG; prefer largest dimension.
2. Build `populate-logos.ts`: iterate Brand Kit rows lacking `logo_drive_id`, run fetcher, upload to Drive folder `CC/Brands/<slug>/logo.<ext>`, write back to Sheet.
3. Run script; manually review failures (likely 20-40 brands) — for each, hand-upload via dashboard.
4. Add `LogoUpload` component to `/dashboard/brands/[slug]` with drag-drop -> server action -> Drive -> Sheet write.
5. Update `/[locale]/brands` list view: when `logo_drive_id` present, render image at 80x80; otherwise text fallback.
6. Update `/[locale]/brands/[slug]` PDP: render larger logo (160x160) in header.
7. Add Drive folder creation step that also stores `brand_folder_drive_id` so future asset uploads go to the same folder.

## Acceptance criteria
- [ ] At least 120 of 168 brands have a populated `logo_drive_id` after auto-run.
- [ ] At least 50 brands have manual-verified logos (top by GMV).
- [ ] `/[locale]/brands` renders logos for brands with `logo_drive_id`.
- [ ] PDP renders logo in header.
- [ ] Dashboard upload component works end-to-end.

## Verification
```bash
pnpm tsx scripts/brand-assets/populate-logos.ts --dry-run
pnpm tsx scripts/audit/brand-kit-audit.ts
```
Expected: "logo_drive_id coverage: 120/168 (71%)" minimum.

## Dependencies
**Requires:** working `lib/drive/upload.ts` (exists)
**Blocks:** brand hero refresh (P3), featured-products module (P3)

## Notes
- Reference: `docs/audit/brand-kit-audit.md`.
- Drive folder convention: `CC/Brands/<slug>/{logo,hero,featured}/`.
- Use existing `/api/drive/[id]` image proxy for CDN-style URLs — don't expose raw Drive links to end users.
- Coordinate with Roger on brands needing official permission for logo use (most distribution agreements permit it; Kohler and Toto sometimes restrict — check Antonia's contracts folder).
