# Brand Hero Images — Batch 2 Manifest

**Generated:** 2026-05-05
**Scope:** Pilot batch of 18 priority brands missing hero images on `/en/brands`.
**Method:** Chrome MCP DOM extraction against each brand's public site. og:image + largest rendered `<img>` (≥800w) on the homepage or top inspiration page.
**Visual brief:** Match existing 17 cards — warm, editorial lifestyle bath/kitchen scenes featuring the brand's signature product. No watermarks, no competitor logos, no text overlays.
**Card spec:** Source ≥1600w (preferred), processed to 1600w `.webp` at q82, written to `/public/Assets/BRANDS/<slug>-hero.webp`. The card container is `h-44`/`h-48` with `fill` + `object-cover`, so any aspect ratio crops cleanly.

---

## Why these 18?

Picked from the 151 brand cards currently rendering the charcoal fallback. Three signals stacked:

1. **Premium tier** — luxury cart-value brands first (Dornbracht, Hansgrohe, Axor, Duravit, Grohe, Kallista, Perrin & Rowe, Newport Brass, Graff, Gessi).
2. **Brands name-dropped in your hero/metadata copy** — Dornbracht, Hansgrohe (already covered).
3. **Brands aligned with the Mexican artisan story** — Native Trails (copper sinks), Stone Forest (stone vessels), Thompson Traders (artisanal hammered copper), Rocky Mountain Hardware (hand-forged bronze, parallels Sun Valley Bronze).

Plus three high-volume bathroom-staple brands the grid will lean on heavily: Victoria + Albert, MTI Baths, Robern, Top Knobs.

---

## Confidence legend

- **A** — brand-official lifestyle hero ≥1600w, on the brand's own CDN, matches editorial brief out of the box.
- **B** — brand-official but either (a) <1600w (will need sharp upscaling or accept slight softness on Retina), or (b) product-isolated rather than lifestyle.
- **C** — best I could verify but flagged concerns (Instagram thumbnails, OG share image, smaller asset).
- **NEEDS_MANUAL** — JS execution blocked on the brand's site or hero is lazy-loaded and didn't fire. Roger downloads from press kit; recommended search query in notes.

---

## The 18 brands

| # | slug | brand | category | confidence | image_url | size | notes |
|---|------|-------|----------|------------|-----------|------|-------|
| 1 | hansgrohe | Hansgrohe | faucetry-showers | **A** | `https://assets.hansgrohe.com/celum/web/raindance-alive_xtrastoris-minimalistic_showering-woman_red-bathroom-ambiance_16x9.jpg` | 3840×2160 master | Drop `?format=HBW48` to get master res. Editorial bath ambiance — woman showering, red wall accent. Slot in beside Brizo as flagship-tier. |
| 2 | dornbracht | Dornbracht | faucetry-showers | **A** | `https://media.cdn.dornbracht.com/v/1pRVLKft/crop:8645x3705,fp:0,2454/fit-in:1920x10000/quality:80/FDrei_Dornbracht_COYA_Stills_030.webp` | 1920×823 | COYA series still — minimalist German faucetry, on-brand for Dornbracht. Adjust `fit-in:2560x10000` for higher res if needed. |
| 3 | axor | Axor | faucetry-showers | **A** | `https://assets.hansgrohe.com/celum/web/hps_axw_escape_the_ordinary_ish_teaser_02_2000x1100.jpg` | 2000×1100 master | Drop `?format=HBW48` for master. Axor ShowerSphere editorial. Same Celum CDN as Hansgrohe parent. |
| 4 | grohe | Grohe | faucetry-showers | **A** | `https://www.grohe.us/cdn/shop/files/Cubeo_Collection_Shop_the_Look_1.jpg?v=1762279523` | 2000×1308 | Cubeo collection editorial kitchen — pulled from their Shopify storefront; this is their current "Shop the Look" hero. |
| 5 | thompson-traders | Thompson Traders | bathroom-sinks | **A** | `https://thompsontraders.com/wp-content/uploads/2020/05/BathroomSink_Angle-scaled.jpg` | 1920×2560 | Hand-hammered copper bathroom sink. Strong fit alongside your Mistoa/Santa Clara del Cobre artisan section. |
| 6 | mti-baths | MTI Baths | bathtubs | **B** | `https://s3-us-west-2.amazonaws.com/mti.baths/cms/index/banner-MacPherson-01.jpg` | 1520×679 | Banner aspect (2.24:1). MacPherson freestanding tub. Will look good on desktop card; mobile may show heavy crop. |
| 7 | stone-forest | Stone Forest | bathroom-sinks | **B** | `https://cdn.shopify.com/s/files/1/0888/5218/files/social-sharing-image-1200x628.jpg?v=1692307578` | 1200×628 | OG social-share hero. Slightly under 1600w — will be a touch soft on Retina but acceptable. Alternative: navigate manually to a product page and grab a higher-res shot. |
| 8 | gessi | Gessi | faucetry-showers | **B** | `https://gwebassets.gessi.com/strapi-uploads/assets/Bathroom_ce6ce4ea1a.webp` | 830×1040 | Portrait orientation (5:4 tall). Will work with `object-cover` cropping but not ideal for desktop wide cards. Alternative: try gessi.com/en/products/bathroom for landscape lifestyle shots. |
| 9 | rocky-mountain-hardware | Rocky Mountain Hardware | door-cabinet-hardware | **C** | `https://data-image.sociablekit.com/sources/instagram-feed/rockymountainhardware/DX7KGDTGR52-thumbnail.webp?v=1777923505` | 1080×1334 | Sourced from their Instagram feed widget — the brand's actual press shots aren't on the homepage. Bronze hardware close-up, on-brand. **Recommend:** Roger pull a better shot from the brand's Press section if available; this is fallback only. |
| 10 | top-knobs | Top Knobs | door-cabinet-hardware | **C** | `https://www.topknobs.com/media/wysiwyg/category-1.jpg` | 1109×521 | Category banner — small. **NEEDS_MANUAL preferred:** browse topknobs.com/inspiration for a kitchen lifestyle shot at 1600w+. |
| 11 | native-trails | Native Trails | bathroom-sinks | **C** | `https://nativetrailshome.com/wp-content/uploads/2024/02/Kitchen-block-rendezvous-01.jpg` | 700×600 | Site is heavy lazy-loaded; this was the only image that fired. **NEEDS_MANUAL strongly recommended:** open nativetrailshome.com/copper-collection in your browser, scroll, save the largest copper-sink lifestyle shot. |
| 12 | duravit | Duravit | bathroom-sinks | **NEEDS_MANUAL** | — | — | Duravit's site blocks programmatic JS access. **Suggested:** open duravit.com/en/products → pick a Luv or Vero series lifestyle shot. They have a press portal at duravit.com/service/news__press_releases. |
| 13 | victoria-albert | Victoria + Albert | bathtubs | **NEEDS_MANUAL** | — | — | DOM extraction returned empty (lazy-load + intersection observer). **Suggested:** vandabaths.com/about-us has full-bleed editorial heroes; open in browser, right-click save the spa-style freestanding tub shot. |
| 14 | newport-brass | Newport Brass | faucetry-showers | **B** | `https://www.newportbrass.com/media/thza0xzr/social-share.jpg` | OG share | OG share image extracted on second pass. Likely 1200×630 — usable but not the strongest editorial shot. **Recommend:** Roger swap with a kitchen lifestyle shot from newportbrass.com/inspiration after launch. |
| 15 | kallista | Kallista | faucetry-showers | **NEEDS_MANUAL** | — | — | JS blocked. Kallista is Kohler's luxury sub-brand — Roger has Kohler dealer access, which extends to Kallista assets. **Suggested:** kallista.com/inspiration or pressroom.kohler.com (filter by Kallista). |
| 16 | robern | Robern | bathroom-mirrors | **NEEDS_MANUAL** | — | — | JS blocked. Robern is also Kohler-owned. **Suggested:** robern.com/discover or pressroom.kohler.com for an editorial bathroom mirror lifestyle shot. |
| 17 | perrin-and-rowe | Perrin & Rowe | faucetry-showers | **NEEDS_MANUAL** | — | — | UK site (perrinandrowe.co.uk) blocks JS exec. P&R is distributed by Rohl in the US, so press assets are mirrored on rohlhome.com/press. **Suggested:** rohlhome.com → search "Perrin & Rowe" → save a kitchen bridge-faucet lifestyle shot. |
| 18 | graff | Graff | faucetry-showers | **NEEDS_MANUAL** | — | — | graff-designs.com/en homepage returned empty DOM (heavy SPA, images load via async observer). **Suggested:** graff-designs.com/en/products → pick a Solar or Targa series lifestyle. They have direct press-image downloads on each product page. |

---

## Tally

- **A confidence:** 5 (Hansgrohe, Dornbracht, Axor, Grohe, Thompson Traders)
- **B confidence:** 4 (MTI Baths, Stone Forest, Gessi, Newport Brass)
- **C confidence:** 3 (Rocky Mountain Hardware, Top Knobs, Native Trails)
- **NEEDS_MANUAL:** 6 (Duravit, Victoria + Albert, Kallista, Robern, Perrin & Rowe, Graff)

**Auto-downloadable:** 12 — the download script pulls these.
**Manual / Phase B:** 6 — Claude Code will try Playwright headless extraction; whatever Playwright can't get, Roger sources manually and drops into `/public/Assets/BRANDS/staging/<slug>-hero.<ext>`. The processor picks them up either way.

---

## Workflow

```bash
# 1. Auto-download the 11 verified images
chmod +x scripts/download-brand-heroes-batch2.sh
./scripts/download-brand-heroes-batch2.sh

# 2. (Optional) Drop manually-sourced images for the 7 NEEDS_MANUAL brands into:
#    public/Assets/BRANDS/staging/<slug>-hero.<jpg|png|webp>
#    e.g. public/Assets/BRANDS/staging/duravit-hero.jpg

# 3. Process all (auto + manual) into final 1600w .webp
npx tsx scripts/process-brand-heroes-batch2.ts

# 4. PRE_STAGED_HEROES has already been updated for the 11 auto-verified slugs.
#    For each manually-added slug, append to the table in app/[locale]/brands/page.tsx.
#    (See PR comment template at bottom of this manifest.)
```

---

## Licensing note

These are images served from each brand's public website / CDN. Counter Cultures is an authorized dealer for the brands you stock — using their lifestyle imagery for a dealer-portfolio listing is the standard practice. For the brands where you're **not** an authorized dealer (any "external" stockedState), confirm with the brand before publishing.

If any rightsholder flags an image post-launch, swap path in `PRE_STAGED_HEROES` to a different source, or replace the file at `/public/Assets/BRANDS/<slug>-hero.webp` — no code change needed.

---

## PR comment template (for manual additions)

After dropping a manual image and re-running the processor:

```ts
// In app/[locale]/brands/page.tsx, PRE_STAGED_HEROES:
duravit: "/Assets/BRANDS/duravit-hero.webp",
"victoria-albert": "/Assets/BRANDS/victoria-albert-hero.webp",
"newport-brass": "/Assets/BRANDS/newport-brass-hero.webp",
kallista: "/Assets/BRANDS/kallista-hero.webp",
robern: "/Assets/BRANDS/robern-hero.webp",
"perrin-and-rowe": "/Assets/BRANDS/perrin-and-rowe-hero.webp",
graff: "/Assets/BRANDS/graff-hero.webp",
```
