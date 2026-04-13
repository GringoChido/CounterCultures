# Brand Hero Images

This flat folder is the **source of truth** for brand hero images used on the site (`/en/brands`, `/es/brands`, and individual brand pages).

## Naming convention

```
{slug}-hero.{ext}
```

- `{slug}` matches the brand slug in `app/lib/constants.ts` (e.g., `kohler`, `sun-valley-bronze`, `california-faucets`)
- `{ext}` should be `.webp` (preferred), `.jpg`, or `.avif`
- Example: `kohler-hero.webp`, `emtek-hero.avif`

## To replace an image

1. Drop the new file into this folder using the naming convention above
2. If changing the file extension, update the `image:` path in `brandDescriptions` at `app/[locale]/brands/page.tsx` (~line 50)
3. Recommended: max 1600px wide, WebP at quality 80-85, under 200KB

## Archive folder

`public/Assets/Brand Images/` contains the original high-res source files organized by brand with `_brief.md` files. That folder is **not read by the site** -- it's the archive/brief reference. This flat `BRANDS/` folder is what the site reads.
