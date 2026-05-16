# i18n Baseline — Pre-fix State

Captured before the `fix/i18n-locale-toggle-permanent` changes.

## Locale-stripping links

Internal links in header, footer, and section components used `next/link` with bare paths
(e.g., `/shop/bathroom`) or manually prefixed `/${locale}` / `/${lang}`. When a Spanish-locale
user clicked these links, `next-intl` middleware saw the unprefixed path, defaulted to `/en/`,
and the user was silently bounced back to English.

**Components affected:**
- `header.tsx` — all nav links used `NextLink` + `localizedHref()` manual prefix
- `footer.tsx` — all links used `Link from "next/link"` + `/${lang}` template string
- `shop-by-room.tsx` — bare `/shop/bathroom` etc. via `next/link`
- `hospitality-teaser.tsx` — `/${lang}/hospitality` via `next/link`
- `featured-brands-band.tsx` — `/${locale}/brands` via `next/link`
- `catalog-depth-band.tsx` — `/${locale}/shop/catalog` via `next/link`
- `two-paths-band.tsx` — `/${locale}/showroom`, `/${locale}/trade` via `next/link`
- `subcategory-grid.tsx` — `/${locale}/shop/...` via `NextLink`
- `category-brand-wall.tsx` — `/${locale}/brands/...` via `NextLink`

## Language toggle

Both desktop (lines 162-189) and mobile (lines 387-414) toggles used plain `<a href>` tags
with a comment: "Language toggle — full page reload to bypass CDN/router cache." This caused
a full-page reload on every toggle, losing scroll position and client state.

## Dual translation systems

Header and Footer had ~15 inline `lang === "en" ? ... : ...` ternaries alongside the
`useTranslations()` / `getTranslations()` system used elsewhere. The `lang` value was
prop-drilled from 27 page files each for Header and Footer (54 total call sites).
