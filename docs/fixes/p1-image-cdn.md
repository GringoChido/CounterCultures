# [P1] Image CDN — Cloudflare Images for 354K SKU Photos

> **Status:** PENDING · **Priority:** P1 · **Effort:** 1 day · **Branch:** `claude/fix-image-cdn`
> **Last updated:** 2026-05-12

## Why this matters
The catalog serves 354,000 product photos as raw `.jpg` files from `/products/odoo/{id}.jpg` on Netlify's origin — no CDN edge cache beyond Netlify's default, no AVIF/WebP, no responsive `srcset`, no lazy loading below the fold. Live measurement shows a warm catalog load at ~5.5 s, of which ~4 s is just images. On mobile 4G it's worse. This single fix improves perceived performance by 60–70%, drops bandwidth cost, and makes the PDP (P1.5) actually feel premium. Cloudflare Images at ~$5/100k images + $1/100k transformations is a no-brainer at our scale; alternatives (Bunny, Cloudinary) are viable but Cloudflare is the cleanest fit given the existing DNS account.

## The problem (evidence)
- `app/(public)/shop/[category]/page.tsx` uses raw `<img src="/products/odoo/{id}.jpg">` with no `loading="lazy"`.
- `next.config.js` `images.remotePatterns` has no CDN domain configured; `next/image` is not used for product photos.
- Network panel: catalog page loads ~80 images × ~150 KB each = ~12 MB total, all at original resolution.
- No format negotiation; AVIF/WebP capable browsers still receive `.jpg`.
- Hot-path lambda fetch logs show image requests count as origin hits.

## Scope
**In scope:**
- Provision Cloudflare Images, generate API token + delivery URL.
- Migrate product image URLs to Cloudflare delivery format.
- Update `next.config.js` `images.remotePatterns`.
- Wrap all product `<img>` in `<Image>` from `next/image`.
- Add `loading="lazy"` below-the-fold; eager for first row.
- Generate AVIF/WebP variants automatically via Cloudflare transformation API.
- One-time ingestion: push all 354K images into Cloudflare Images bucket via `/upload` API.

**Out of scope:**
- Client-side blur placeholders (P2; needs LQIP generation).
- Multi-region edge optimization beyond Cloudflare defaults.
- Animated product hero images (P3).

## Files to touch
- `next.config.js` — add Cloudflare delivery domain to `remotePatterns`.
- `app/lib/product-image.ts` (new) — `getImageUrl(productId, variant)` returns Cloudflare URL with transformations.
- `app/(public)/shop/[category]/page.tsx` — switch `<img>` to `<Image>` and call `getImageUrl`.
- `app/(public)/components/product-card.tsx` — same.
- `app/(public)/components/product-detail.tsx` (from P1.5) — same.
- New `scripts/migrate-images-to-cloudflare.ts` — one-shot ingest job.
- `.env.example` — add `CLOUDFLARE_IMAGES_ACCOUNT_ID`, `CLOUDFLARE_IMAGES_API_TOKEN`, `CLOUDFLARE_IMAGES_HASH` (delivery URL signature).

## The fix (step by step)
1. **Sign up for Cloudflare Images.** Enable on the existing Cloudflare account; pick the $5/month tier (covers 100k stored, $1/100k delivered above that).
2. **Generate API token** with `Cloudflare Images:Edit` scope. Add to Netlify env.
3. **Migration script** `scripts/migrate-images-to-cloudflare.ts`:
   - List all rows in `CC_Products_Full` with non-empty image columns.
   - For each, download from current origin URL (or read from disk if we have local files), POST to `https://api.cloudflare.com/client/v4/accounts/<account_id>/images/v1` with `file=<binary>` and `id=<productId>` (use the product ID as the Cloudflare image ID for predictable URLs).
   - Concurrency 10, throttle to respect Cloudflare rate limits (~100 req/s).
   - Persist progress to a JSON state file; resumable.
   - Expected runtime: 354K images × ~0.3s = ~30 hours single-threaded. Parallelize across 10 workers → ~3 hours.
4. **`getImageUrl` helper:**
   ```ts
   const HASH = process.env.CLOUDFLARE_IMAGES_HASH!;
   export function getImageUrl(productId: string, variant: 'thumb'|'card'|'detail'|'zoom' = 'card') {
     const sizeMap = { thumb: 160, card: 480, detail: 960, zoom: 1600 };
     return `https://imagedelivery.net/${HASH}/${productId}/w=${sizeMap[variant]},format=auto,quality=80`;
   }
   ```
   `format=auto` makes Cloudflare serve AVIF → WebP → JPEG per the request `Accept` header.
5. **`next.config.js`:**
   ```js
   images: {
     remotePatterns: [{ protocol: 'https', hostname: 'imagedelivery.net' }],
     formats: ['image/avif', 'image/webp'],
   }
   ```
6. **Replace `<img>` with `<Image>`** in catalog card, PDP, gallery, search palette result rows. Specify `width` + `height` (or `fill` + container).
7. **Lazy-load policy:** first row (~4 cards above fold) → `priority`. Everything else → `loading="lazy"`.
8. **Fallback:** if a productId has no Cloudflare image (some legacy SKUs may), `getImageUrl` returns a placeholder `/img/placeholder-product.svg`.
9. **Smoke test:** Lighthouse on `/shop/sillas` before and after — LCP should drop substantially.

## Acceptance criteria
- [ ] All product images load from `imagedelivery.net` (verify in network panel).
- [ ] AVIF served to Chrome/Edge/Firefox; WebP fallback to Safari; JPEG fallback to old browsers.
- [ ] Catalog page LCP < 2.5 s on simulated 4G (was ~5.5 s).
- [ ] Image bandwidth per catalog page < 4 MB (was ~12 MB).
- [ ] Below-the-fold images defer until scroll.
- [ ] 354K image migration completes with <0.5% failure rate; failures logged for manual retry.
- [ ] Total Cloudflare cost projected < $30/month at current traffic.

## Verification
```bash
# Lighthouse on a category page
npx lighthouse "$BASE_URL/shop/sillas" --only-categories=performance --form-factor=mobile

# Spot-check a Cloudflare URL
curl -I "https://imagedelivery.net/$CLOUDFLARE_IMAGES_HASH/ODOO_12345/w=480,format=auto,quality=80" \
  -H "Accept: image/avif,image/webp,*/*"
```
Expected: 200, `Content-Type: image/avif`.

## Dependencies
**Requires:** None.
**Blocks:** P1.5 (PDPs feel cheap without good imagery), all SEO efforts (CWV impacts ranking), paid-ads landing-page Quality Score.

## Notes
- Predictable IDs (`<productId>`) keep URLs idempotent — re-uploading the same product doesn't change the URL.
- Cloudflare Images supports signed URLs for sensitive imagery (not needed here).
- If the migration script fails mid-run, the resumable state file lets you restart from the last good index.
- Alternative considered: Bunny.net Stream + Optimizer is ~30% cheaper but the API is less polished; Cloudinary is more feature-rich but ~3x the cost at our scale.
- After CDN ships, audit the `/public/products/odoo/*` files on Netlify and remove (huge artifact size reduction).
