# 03 — Performance

_last updated 2026-05-12_

Real numbers from live measurements against `countercultures.netlify.app/es` on 2026-05-12, plus codebase walk to explain the cause of each number. No projections, no targets — just what the site does today.

## Headline finding: cold-Lambda TTFB

| State | Homepage TTFB | Source |
| --- | --- | --- |
| **Cold Lambda** | **10,723 ms** | Direct measurement 2026-05-12 |
| **Warm Lambda** | **674 ms** | Same URL, 30s later |
| **Ratio** | **15.9×** | — |

The codebase already knows about this. In `app/lib/sheets/products-full.ts:174` there is a comment:

> "10–20s cold fetch — accept and cache aggressively"

The measurement confirms the comment exactly. The mechanism:

1. First request to a freshly-instantiated Netlify Function (a "cold Lambda") triggers an unguarded read of `CC_Products_Full` — the full 354,449-row × 10-column sheet — through a single `spreadsheets.values.get` Sheets API call.
2. That call returns ~4 MB of JSON, deserialized in-process, and held in module-scope memory.
3. Stale-while-revalidate caches the result for subsequent warm requests on the same Lambda. TTFB drops to 674 ms.
4. **Every new Lambda instance pays the toll.** Netlify's Lambda scale-out under load creates fresh containers regularly; each user that lands on a new container sees the 10s wait.

The architecture choice is deliberate (the alternative — keeping product reads in Sheets behind pagination — would make catalog browsing latency worse). The trade-off being made is "1 in N users sees a 10s blank page, the rest see a fast site." There is no warm-up cron hitting `/` to keep a Lambda warm.

## Per-page warm-load table

All measured warm, from one client, 2026-05-12:

| Route | TTFB / load | Payload | Notes |
| --- | --- | --- | --- |
| `/es` (home) | 1.3 s | 612 KB | Hero uses `next/image`; rest is HTML |
| `/es/shop` (catalog landing) | 4.5 s | 312 KB | Server-renders facet rail |
| `/es/catalog` | 5.5 s | 287 KB | Renders 60 product cards eagerly |
| `/es/bathroom` | 3.6 s | 1 KB | Content page, low payload |
| `/es/brands` | 0.6 s | 1 KB | Brand directory, mostly text |
| `/es?q=kohler` (search palette navigates here) | 9.8 s | 465 KB | Filters 354K rows on the Lambda, no index |

Warm `/es` at 1.3 s is healthy. Warm `?q=kohler` at 9.8 s suggests the search-filter path doesn't share the cached products payload from the homepage — it reads `CC_Products_Full` again and filters in memory.

## Search palette: MiniSearch duplicate-ID error

Opening the global search palette (`Cmd-K`) throws:

```
Error: Document with ID "article:aveo-new-generation" is already present
```

**100% reproduction rate** across page refreshes and routes. The palette builds a `MiniSearch` index per-mount from products + articles. The dedupe step on indexed documents is missing or broken — two source rows produce the same `article:aveo-new-generation` ID and the second `addAll` call throws synchronously. The palette UI degrades to "no results" silently, even when typing matches obvious products. Users on the live site cannot search.

## Catalog page: image strategy is the bottleneck

The `/es/catalog` page (5.5 s warm, 287 KB HTML) loads **60 product cards above the fold on first paint**, and the images strategy is:

- All 60 images load **eagerly** — no `loading="lazy"`, no `IntersectionObserver`-gated lazy load.
- Every image is served as raw `.jpg` from `/products/odoo/{id}.jpg` on the same Netlify origin.
- **No image CDN** — no Cloudinary, no Imgix, no Bunny, no Netlify Image CDN.
- **`next/image` is not used** for product cards (it is used for the hero on `/es`).
- **No `srcset`** — single source URL per `<img>` regardless of viewport.
- **No AVIF/WebP** — origin only serves `.jpg`.
- **18 of 60 images return HTTP 404** — direct measurement. The catalog ships with ~30% broken thumbnails on the first page alone.

Total image weight on `/es/catalog` lands around 1.8–2.2 MB depending on which 60 IDs render. Combined with the no-CDN single-origin fetch, this dominates LCP on every catalog visit.

## THE BIG FINDING: there are no product detail pages

This is the most consequential performance/SEO finding in the audit.

**The repo contains no `/products/[slug]` route, no `/p/[id]` route, no product-detail page of any kind.** Verification:

- `find app -name 'page.tsx'` shows no path matching products/[slug] or similar.
- The `<button>` rendered by `ProductCard` has no `<a href>` — it is literally a button element. Clicking it opens an in-page quick-view drawer or adds-to-cart, depending on variant.
- The search palette's "select product" handler navigates to `/es?q=<sku>` — a filtered catalog view, not a detail page.
- 354,449 SKUs are individually **un-shareable** (no URL), **uncrawlable** (no link target), **unindexable** by Google (no page to index), and **un-deeplinkable** from email/social/messenger.

This is not a performance problem in the strict LCP/TTFB sense, but it is the largest single bottleneck on the site's commercial output: no product can rank in search, no product can be linked from a vendor's site, no product can be sent in a quote email as a URL. Every prospective customer must search the catalog from scratch.

## Render-blocking resources

- **2 stylesheets** in `<head>` load synchronously via `<link rel="stylesheet">` with no `media` swap pattern and no `preload`/`onload` async trick. Both are Tailwind 4 output bundles (one global, one route-scoped). Combined ~120 KB gzipped.
- No render-blocking JS in `<head>` — Next.js places scripts in `<body>` with appropriate strategies.
- No font preloading beyond what Next.js' default `next/font` pipeline emits. Body fonts are loaded by browser-default discovery.

## Third-party scripts

Counted on the homepage:

| Origin | Purpose | Status |
| --- | --- | --- |
| `google-analytics.com/g/collect` | GA4 pageview/event | Returns **503** from the audit client — likely client-side ad-blocker, not a server problem |
| (no others) | — | — |

No Hotjar, no Intercom, no Drift, no FullStory, no Facebook Pixel, no LinkedIn Insight, no Klaviyo, no Segment, no Optimizely. The site is unusually clean on third-party JS — which is good for performance and unusual for a commerce site that may eventually want lifecycle marketing.

## Console errors observed

Per page load on `/es`:

1. `MiniSearch: Document with ID "article:aveo-new-generation" is already present` — thrown when the search palette mounts (palette mounts on first `Cmd-K`)
2. GA4 `g/collect` 503 — only when an ad-blocker is active; benign
3. No React hydration warnings observed
4. No "Each child in a list should have a unique key" warnings observed
5. No CORS errors observed

## What `next/image` is and isn't doing

- **Used**: homepage hero (`/public/hero.webp` via `<Image priority>`)
- **Not used**: every product card on every page, brand logos on `/es/brands`, hero rotators on brand pages, any image inside the Dashboard
- **Implication**: turning on Netlify Image CDN (a flag flip + replacing `<img>` with `<Image>`) is the single highest-leverage perf change available in the repo. Catalog LCP would drop materially.

## Caching summary

| Asset class | Cache strategy |
| --- | --- |
| HTML (home, catalog) | ISR — 300 s home, 1800 s catalog |
| HTML (brand pages) | `force-dynamic`, no ISR |
| HTML (dashboard) | `force-dynamic`, `no-store` |
| Product list JSON | In-memory stale-while-revalidate inside Lambda |
| Product images | Browser default + Netlify origin default (`Cache-Control: public, max-age=...` whatever Netlify sets for `/public`) |
| Next.js static assets (`_next/static`) | Immutable, fingerprinted, year-long max-age |

## What's *not* measured here

- Real-user CWV from RUM (no RUM beacon installed)
- Mobile-network performance — measurements above are on cable
- Lambda concurrency curve under load — no load test has been run
- p95/p99 latencies — single-point measurements only

Sources: live HTTP measurements against `countercultures.netlify.app/es` on 2026-05-12 via DevTools Network panel + curl timing; codebase walk of `app/lib/sheets/products-full.ts`, `app/components/product-card.tsx`, `app/[locale]/catalog/page.tsx`, `app/components/search-palette/*`; image audit by HEAD-checking 60 IDs against `/products/odoo/{id}.jpg`.
