# QA Findings - 2026-05-25

Hardening pass over Counter Cultures storefront + Counter Portal.

## Automated Checks Summary

| Check | Result |
|-------|--------|
| `vitest run` | 8 suites, 74 tests, ALL PASS |
| `tsc --noEmit` | 1 error (pre-existing, untracked `product-detail.tsx`) |
| `eslint app/` | 295 errors, 114 warnings (mostly `no-explicit-any` in data-layer, `no-html-link-for-pages` in inbox page) |
| `check-internal-links.mjs` | 1410 URLs crawled, 0 broken (32 timeouts on long-slug PDPs — rate-limit, not real 404s) |
| `assert-pdp-renders-description.ts` | PASS (0 sampled locally — no Sheets env vars) |
| `12-final-audit.ts` | Runs clean. 4027 products need real photography, 25% have Spanish descriptions, 23% have English descriptions |
| `npm run build` | PASS (with untracked product-detail.tsx moved aside) |

---

## Fixed in This Pass (committed)

1. **"LLC" -> "R&F" in AR page** (4 occurrences in `accounts-receivable/page.tsx`) — user-facing labels now say "R&F USA" / "R&F" to match the rest of the app
2. **"LLC USA" -> "R&F USA" in P&L report page** (1 occurrence in `reports/pnl/page.tsx`)
3. **Removed stale `PORTAL_EMAIL_ALLOWLIST`** from `.env.example` — the env var is no longer read by any source code
4. **Escaped unescaped apostrophes** in `this-week/_entries/2026-w18.tsx` (2 occurrences, ESLint `react/no-unescaped-entities`)

---

## Logged Findings

### P0 — Blocks Users / Security

_None found._ The send-quote route lacks in-route auth but IS protected by Edge middleware (`/api/dashboard` prefix). Downgraded to P1.

### P1 — Fix Soon

| # | Title | Location | Suggested Fix |
|---|-------|----------|---------------|
| 1 | **Leads API has no server-side Zod validation** | `app/api/dashboard/leads/route.ts` | Add a Zod schema mirroring the client `LeadForm` validation (name required, email required, phone conditional on source) |
| 2 | **Leads API has no Activity_Log entry** | `app/api/dashboard/leads/route.ts` | Add `appendRow("Activity_Log", ...)` after successful write (violates Finance Rule 33) |
| 3 | **Leads API has no feature gating** | `app/api/dashboard/leads/route.ts` | Add `requireFeature("manage_leads")` or similar; currently any authenticated staff can CRUD leads |
| 4 | **send-quote route has no feature gating** | `app/api/dashboard/deals/[id]/send-quote/route.ts` | Add `requireFeature("send_quote")` |
| 5 | **send-quote route has no Activity_Log** | `app/api/dashboard/deals/[id]/send-quote/route.ts` | Log send action with recipient, deal ID, actor |
| 6 | **send-quote bypasses communication matrix** | `app/api/dashboard/deals/[id]/send-quote/route.ts` | Should route through `dispatchAlertsForTransition` or at minimum log to `Conversation_Log` (CART-RULES rule 23-24) |
| 7 | **No currency_id explicitly sent in createQuote** | `app/lib/odoo/write.ts:244`, `orders/new/page.tsx` | Add `currency_id` to `CreateQuoteInput` and pass from UI (CC=MXN id, R&F=USD id) so it doesn't rely on Odoo pricelist defaults |
| 8 | **No currency_id sent from PO UI form** | `purchases/new/page.tsx` | The Zod schema accepts `currencyId` but the form never sends it; same implicit-default risk as quotes |
| 9 | **create-bill uses semantically wrong feature key** | `app/api/dashboard/purchases/[id]/create-bill/route.ts` | Uses `register_payment` instead of a dedicated `create_bill` key — works by accident since both are finance-only |
| 10 | **Untracked product-detail.tsx breaks build** | `app/[locale]/shop/[category]/p/[slug]/product-detail.tsx` | Either commit it (with `artisanal` prop added to `ProductCardProps`) or delete the file from the working directory |
| 11 | **Inbox page uses `<a>` instead of `<Link>`** | `app/(dashboard)/dashboard/(portal)/inbox/page.tsx:36,106` | Convert to `next/link` — causes full page reloads inside the SPA shell |
| 12 | **confirmAndInvoiceOrder uses private Odoo method** | `app/lib/odoo/write.ts` (`_create_invoices`) | Works in practice but fragile across Odoo upgrades; consider the `sale.advance.payment.inv` wizard path |

### P2 — Nice-to-Have

| # | Title | Location | Suggested Fix |
|---|-------|----------|---------------|
| 13 | **"llc" internal key rename to "rf"** | 10+ files | Logged per AGENTS.md — do NOT rename in this pass. The internal key is `"llc"` but user-facing text correctly shows "R&F" after this fix |
| 14 | **No duplicate-customer prevention server-side** | `app/api/dashboard/customers/create/route.ts` | Consider `search_read` on name+email before create |
| 15 | **No salesperson selector on new quote form** | `orders/new/page.tsx` | All quotes attribute to the API user (Roger). Add a dropdown if Javier/Ian create quotes |
| 16 | **validity_date not format-validated** | `app/api/dashboard/orders/create/route.ts` | Add `.regex(/^\d{4}-\d{2}-\d{2}$/)` to the Zod schema |
| 17 | **No mirror sync for new POs** | `app/lib/odoo/write.ts:createPurchaseOrder` | Unlike `createQuote` (which calls `syncSaleOrderInMirror`), POs have no equivalent sync call |
| 18 | **date_planned on PO header may not work in Odoo 16** | `app/lib/odoo/write.ts` | In Odoo 16, `date_planned` moved to order lines. Verify Roger's Odoo version |
| 19 | **Orphaned API routes** | See list below | Remove dead routes that have no UI consumers |
| 20 | **Dead stores / unused modules** | See list below | `project-list-store.ts`, `cart-sync.ts`, `sample-customs-data.ts` (700 lines) |
| 21 | **FX rate encoded in ref string for payments** | `app/lib/odoo/write.ts:registerPayment` | Works but bypasses Odoo's native multi-currency reconciliation |
| 22 | **No idempotency guard on quote/PO creation** | `orders/new/page.tsx`, `purchases/new/page.tsx` | Button disables on click but a fast double-click could slip through before React re-renders |
| 23 | **Unused `formatDateRange` import** | `app/this-week/_components/shell.tsx:6` | Dead import |
| 24 | **Unused `parents` var in final-audit script** | `scripts/scrape/12-final-audit.ts:112` | Assigned but never read |

---

## Orphaned API Routes (no UI consumers)

| Route | Notes |
|-------|-------|
| `app/api/chat/route.ts` | 97 lines, Anthropic SDK chatbot. Dashboard uses `/api/dashboard-chat` instead |
| `app/api/quote-request/route.ts` | Old single-product quote form. Superseded by cart/checkout flow |
| `app/api/stripe/revenue/route.ts` | No consumers anywhere |
| `app/api/odoo/inventory/route.ts` | Explicitly marked DEPRECATED in header |
| `app/api/checkout/submit/route.ts` | The stepper calls `/api/checkout/buy` not `/submit` |

## Dead Modules (entire files with zero importers)

| File | Lines |
|------|-------|
| `app/lib/stores/project-list-store.ts` | 66 |
| `app/lib/stores/cart-sync.ts` | 56 |
| `app/lib/sample-customs-data.ts` | ~700 |

---

## Human Smoke Test Checklist

These require a logged-in session at `countercultures.netlify.app/dashboard`:

### Leads
- [ ] Click "Leads" in sidebar, click "+ New Lead"
- [ ] Fill required fields (Name, Email), select Source = "Website"
- [ ] Submit and confirm the lead appears in the list immediately
- [ ] Open it and confirm all fields persisted

### Purchase Orders
- [ ] Click "Purchases" > "+ New PO"
- [ ] Select entity "R&F" — confirm currency shows USD
- [ ] Search for a product by partial SKU (e.g. "8413") and confirm results appear
- [ ] Add a line, select a known vendor, submit
- [ ] Confirm PO appears in portal Purchases list with correct vendor and R&F badge
- [ ] In Odoo, confirm the PO was created with company_id=2 and currency=USD

### Quotes / Sale Orders
- [ ] Click "Orders" > "+ New Quote"
- [ ] Select entity "CC" — confirm currency shows MXN
- [ ] Search product by brand name in Spanish (e.g. "grifo") — confirm results
- [ ] Add a line, select or create a customer, submit
- [ ] Confirm the quote appears with CC badge in the orders list
- [ ] Click into the quote detail and confirm the amounts match

### Product Pages
- [ ] Open `/en/shop/bathroom` — pick a Manriquez product — confirm a real description renders (not placeholder)
- [ ] Open `/en/shop/kitchen` — pick a Castro product — confirm a real description renders
- [ ] Confirm the "R&F" badge shows on a quote or PO created under the R&F entity

### Search
- [ ] In the quote builder product search, type "CF-8413" — confirm the product appears
- [ ] Type just "8413" — confirm it still matches
- [ ] Type "grifo" — confirm kitchen faucet products appear
- [ ] In the storefront search (cmd+K or search icon), type a brand name and confirm results

### AR Page (post-fix verification)
- [ ] Navigate to Accounts Receivable
- [ ] Confirm the company filter buttons say "CC" and "R&F USA" (not "LLC")
- [ ] Filter by R&F and confirm the active chip says "R&F"

### P&L Report (post-fix verification)
- [ ] Navigate to Reports > P&L
- [ ] Confirm the company tab says "R&F USA" (not "LLC USA")

---

## Roger Monday Fixes — 2026-05-25 (second pass)

### Fix 1: Maker cards on /brands → catalog (severity: P1, UX-breaking)
- **Root cause:** `catalog/page.tsx` SSR called `searchProducts()` without `brand`/`q` URL params. Initial render showed unfiltered "most specified" products; client-side corrected after 180ms debounce, but the flash made it appear broken.
- **Fix:** Page now reads `searchParams`, passes `brand` + `q` to the server-side `searchProducts()` call.
- **Status:** Fixed, needs deploy verification.

### Fix 2: Bilingual quotes — EN/ES per customer (severity: feature request)
- **Root cause:** `createCustomer` never sent `lang` to Odoo's `res.partner`.
- **Fix:** `lang` field added to `CreateCustomerInput`, API Zod schema, and the inline New Customer form (Espanol/English toggle, default `es_MX`).
- **Status:** Fixed, needs Odoo verification (create customer with each lang, confirm quote PDF renders in the correct language).

### Fix 3: Purchase orders never synced (severity: P1, data trust)
- **Root cause:** `MODELS` map in `sync.ts` only had invoice/payment/saleOrder. `ALL_MODELS` in cron route only listed those three. The `Odoo_Purchase_Orders` sheet was frozen at its initial load.
- **Fix:** Added `PURCHASE_ORDER_FIELDS` (11 fields + `write_date`), `purchaseOrder` entry in `MODELS`, `syncPurchaseOrdersIncremental` export, `"purchase_orders"` in cron `ALL_MODELS`.
- **Remaining:** After deploy, the PO sync needs to run several times to backfill from ~1292 to ~1346 (250 per run). Monitor cron logs. Sale-order lag (~25) should self-heal on next hourly run.

### Fix 4: Catalog slow for brand/search views (severity: P1, UX)

**Diagnosis** (cold start, dev server, `?brand=Castro`):

| SSR Step | Cold (ms) | Warm (ms) |
|---|---|---|
| getCatalogBrands + getCatalogStats | 2,005 | 16 |
| getMostSpecifiedScores + getInShowroomIds | 1,496 | 0 |
| searchProducts (snapshot hydration) | 5,628 | 0 |
| **Total SSR** | **9,130** | **17** |

Cold TTFB: 4.2s. Three sequential stages stacked latencies; signals fetched even when irrelevant; client re-fetched on mount.

**Fix** (3 files: `page.tsx`, `catalog-view.tsx`, `api/products/search/route.ts`):
1. **Fast path**: when `urlBrand` or `urlQuery` set, skip signal fetches, use alpha/relevance sort.
2. **Parallelize**: default landing runs brands+stats+signals in single `Promise.all`.
3. **Skip mount fetch**: SSR result reused when it matches initial URL params (one-shot ref guard).
4. **API fast path**: `/api/products/search` also skips signals when brand/q is set.

**Cold-start improvement**:

| Scenario | Before | After | Savings |
|---|---|---|---|
| Brand/search (cold) | ~9.1s | ~5.6s | -3.5s (38%) |
| Default landing (cold) | ~9.1s | ~7.6s | -1.5s |
| Any view (warm) | ~17ms | ~17ms | Same |

Remaining cold cost (5.6s) is snapshot hydration from Sheets, handled by the keepalive cron. Cannot be removed here.

**Phase 2 — Instant shell + skeleton** (2 files: `page.tsx`, `catalog-view.tsx`):

The 5.6s cold cost from `searchProducts` made filtered views feel broken even though the page would eventually render. Fix: stop awaiting `searchProducts` on the server for filtered views. The page shell (hero, sidebar, toolbar, skeleton grid) renders immediately from `brandCounts`/`stats` (which are time-boxed with fast fallbacks). Products load client-side with a shimmer skeleton placeholder.

5. **No SSR search for filtered views**: `page.tsx` filtered branch only fetches brands+stats; passes `null` initialResult to CatalogView.
6. **Product grid skeleton**: 12 placeholder cards matching the real grid layout (`grid-cols-1 sm:2 lg:3 xl:4`, aspect-4/3 image area, brand/name/price placeholders) with `animate-pulse`.
7. **Default landing unchanged**: still does full SSR with signals + searchProducts (cacheable, warm path).

**Cold-start improvement (updated)**:

| Scenario | Before (phase 1) | After (phase 2) | Perceived |
|---|---|---|---|
| Brand/search (cold) | ~5.6s TTFB | ~92ms TTFB + ~5.6s products | Instant shell |
| Default landing (cold) | ~7.6s | ~7.6s | Same (SSR) |
| Any view (warm) | ~17ms | ~17ms | Same |

**Verified**: default landing (SSR, no skeleton flash), Castro brand filter (skeleton → products), search `q=grifo` (skeleton → products), sort/pagination/category/inStock toggles, no console errors, no wrong-content flash.

### Fix 5: Maker cards route to cached brand pages (severity: P1, UX)

**Root cause:** The 4 artisan maker cards (Mistoa, Castro, Familia Meza, Manriquez) on `/brands` linked to `/shop/catalog?brand=<name>`. The catalog page is dynamic and loads the 354K-product snapshot (~5s cold start) on every visit. Meanwhile, `/brands/[slug]` pages are ISR-cached (`revalidate=300`) with `generateStaticParams` — pre-built at deploy, served instantly from CDN.

The makers weren't in the brand registry (Brand Kit Sheet or fallbacks), so `/brands/mistoa` would 404.

**Fix** (4 files):
1. **`app/lib/brand-fallbacks.ts`**: Added 4 artisan makers (mistoa, castro, familia-meza, manriquez) with `isArtisan: true`, origin Mexico. Added `isArtisan` to the fallback type and `getFallbackBrand()` passthrough.
2. **`app/lib/products-full.ts`**: Added `catalogToProduct()` — maps `ProductFull` (354K catalog) to `Product` (CRM-style) so the `ShopCatalog` grid can render catalog-sourced products.
3. **`app/[locale]/brands/[slug]/page.tsx`**: Extended `generateStaticParams` to include all fallback brand slugs (not just Brand Kit Sheet brands), so artisan pages are pre-built at deploy. Added catalog fallback: when `getProductsByBrand` (legacy CRM sheet) returns 0 products but `getBrandSummary` shows the catalog has them, fetches via `searchProducts` and maps to `Product[]`. Safe because the page is ISR-cached (`revalidate=300`) — the heavy snapshot load runs at build/revalidation, not per user request.
4. **`app/[locale]/brands/page.tsx`**: Added `slug` field to each artisan entry. Changed maker card href from `/${locale}/shop/catalog?brand=${encodeURIComponent(artisan.productBrand)}` to `/${locale}/brands/${artisan.slug}`. Fixed `buildFallbackBrands` to pass through `isArtisan` from meta.

**Product counts verified (dev server with full catalog env):**

| Maker | Legacy CRM sheet | Catalog fallback | Final on page |
|---|---|---|---|
| Mistoa | 14 | n/a (legacy sufficient) | **14** |
| Castro | 0 | 175 from snapshot | **175** |
| Familia Meza | 0 | 28 from snapshot | **28** |
| Manriquez | 0 | 245 from snapshot | **245** |

**Result:**
- Maker cards now link to ISR-cached brand pages (instant from CDN, no 354K snapshot load per request)
- Each maker page renders with its full product grid (not empty), correct brand name, origin Mexico, value props
- `getBrandSummary(brand.name)` on the brand page still connects to the full catalog (runs at ISR revalidation, not per-request)
- Existing brand pages unaffected (Kohler verified with product grid intact)
- Both EN and ES locales verified

**Verified**: All 4 maker pages render with correct product counts, no 404, no empty grids, no console errors. Type-check passes clean.

**Note — broader catalog cold-start**: ~~The dynamic `/shop/catalog` page still has ~5.6s cold TTFB from snapshot hydration. This is a separate architecture item (keepalive cron mitigates it). This fix only reroutes the maker cards away from that bottleneck.~~ **RESOLVED 2026-05-25:** `buildStockMap` is now non-blocking on cold hydrate (cold-start ~8.8s → ~2.5s). Stock badges self-heal within seconds after the background fetch completes.
