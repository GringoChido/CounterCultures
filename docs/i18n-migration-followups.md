# i18n Migration Follow-ups

Remaining inline translation ternaries to migrate to `app/messages/{en,es}.json` page-by-page.
Header and Footer are done. These are sorted by impact (ternary count descending).

## Priority 1 — High-traffic pages with many ternaries

| File | `isEs` / `locale===` / `lang===` | Notes |
|------|----------------------------------|-------|
| `brands/[slug]/page.tsx` | 44 | Brand detail page — heaviest |
| `returns-warranty/page.tsx` | 36 | Legal page |
| `brands/[slug]/[category]/page.tsx` | 36 | Brand-by-category page |
| `brands/page.tsx` | 34 | Brands index |
| `sales-delivery/page.tsx` | 29 | Legal page |
| `payment-methods/page.tsx` | 28 | Legal page |
| `privacy/page.tsx` | 23 | Legal page |
| `shop/catalog/catalog-view.tsx` | 24 | Full catalog — `locale===` pattern |
| `brands/brands-grid.tsx` | 17 | Brands grid component |

## Priority 2 — Commerce and content pages

| File | Count | Notes |
|------|-------|-------|
| `insights/[slug]/article-content.tsx` | 13 | Blog article |
| `trade/page.tsx` | 13 | Trade program page |
| `our-story/page.tsx` | 13 | Our Story |
| `checkout/submitted/[dealId]/page.tsx` | 13 | Post-checkout |
| `shop/quote/[slug]/page.tsx` | 13 | Quote page |
| `payment-success/page.tsx` | 12 | Payment confirmation |
| `insights/page.tsx` | 12 | Insights index |
| `showroom/page.tsx` | 11 | Showroom page |
| `contact/page.tsx` | 11 | Contact page |

## Priority 3 — Section components (still accept locale prop)

| File | Count | Notes |
|------|-------|-------|
| `sections/project-gallery.tsx` | 10 | Gallery section |
| `sections/catalog-depth-band.tsx` | 10 | Catalog depth |
| `sections/subcategory-grid.tsx` | 6 | Subcategory grid |
| `sections/category-brand-wall.tsx` | 3 | Brand wall |
| `sections/shop-by-room.tsx` | 2 | Shop by room |
| `sections/category-hero.tsx` | 2 | Category hero |
| `sections/hospitality-teaser.tsx` | 1 | Hospitality teaser |

## Priority 4 — Shared components

| File | Count | Notes |
|------|-------|-------|
| `checkout/checkout-stepper.tsx` | 5 | Checkout flow |
| `ui/product-card.tsx` | 4 | Product cards |
| `search/search-palette.tsx` | 2 | Search palette |
| `pdp/save-to-project-modal.tsx` | 2 | Save modal |
| `shop/catalog/project-list-bar.tsx` | 3 | Project list |
| `shop/catalog/product-drawer.tsx` | 2 | Product drawer |
| `shop/[category]/[subcategory]/page.tsx` | 8 | Subcategory page (`lang===` pattern) |

## Migration pattern

For each file:
1. Add keys to `app/messages/{en,es}.json` under an appropriate namespace
2. Replace `isEs ? "..." : "..."` / `locale === "en" ? "..." : "..."` with `t("key")`
3. For client components: `useTranslations("namespace")`
4. For server components: `const t = await getTranslations("namespace")`
5. Remove the `locale` prop if the component no longer needs it for any other purpose
6. Run key parity check after each file

## Also tracked

- **Button component** (`app/components/ui/button.tsx`): Add `/account` to the `bypassLocale` check
  alongside `/dashboard` and `/api` for completeness.
- **Section component locale props**: After migrating their ternaries (Priority 3), remove their
  `locale` props and switch to `useLocale()` internally.
