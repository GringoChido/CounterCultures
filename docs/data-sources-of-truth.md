# Counter Cultures — Data Sources of Truth

> Generated 2026-05-19 by full codebase audit. Canonical reference for every customer-facing data element.
>
> **Purpose:** before wiring scraped descriptions, migrating images to CDN, or fixing any data-display bug, look here first. If two sources disagree, this doc says which one wins.

---

## Sources we use

Five data backends currently feed the staging app. Each has a job. Problems start when jobs overlap.

| Source | What it's for | Env var / location | Cache TTL |
|---|---|---|---|
| **CC_Products_Full** (Google Sheet) | 354K-row Odoo product catalog: id, name, SKU, brand, category, list_price, currency, UOM, active, sale_ok, sat_code, shipping_class | `GOOGLE_SHEETS_ID_PRODUCTS_FULL` | 30 min (SWR) |
| **CRM Sheet** (Google Sheet) | Operations: Leads, Pipeline, Contacts, Customers, Cart_Sessions, Deal_*, Trade_Codes, Promo_Codes, Tax_Rates, Odoo_* mirror tabs (invoices, payments, sale orders, stock quants, stock locations), Products (curated ~small set), Products_Odoo, Products_Quote, Product_Descriptions, FX_Rates, Brand_NOM_Status, Brand_Lead_Times, etc. | `GOOGLE_SHEETS_ID` | Varies per reader (60s–5min) |
| **Brand Kit** (Google Sheet) | 73 brands: slug, name, taglines (EN/ES), descriptions (EN/ES), origin country, website, stocked state, category slugs, Drive IDs (logo, hero, folder), NOM status, featured products, display order | `GOOGLE_BRAND_KIT_SHEET_ID` | Per-request (no module cache) |
| **Trade Pricing** (Google Sheet) | Per-product tier pricing: product_id, tier, trade_price, currency, effective dates | `GOOGLE_SHEETS_ID_TRADE_PRICING` | 5 min |
| **Sidecar JSON** (`app/lib/product-content.json`) | Scraped content from countercultures.com.mx (Squarespace): Spanish descriptions, features, galleries, variants, breadcrumbs, spec sheet URLs. Built by `scripts/scrape/06-build-product-content.ts`. | Checked into repo (1.1 MB) | Compile-time (static import) |
| **Local files** (public/) | Product thumbnails (`public/products/odoo/<id>.jpg` — 4,236 files), gallery images (`public/products/odoo-gallery/<id>/` — 96 products), spec sheet PDFs (`public/specs/odoo/<id>.pdf` — 468 files), product image manifest (`app/lib/product-image-manifest.json`) | Disk | N/A |
| **Google Drive** | Brand logos + heroes (via `logoDriveId`/`heroDriveId` in Brand Kit), deal attachments (Shared Drive `GOOGLE_SHARED_DRIVE_ID`), price list PDFs (`GOOGLE_PRICE_LIST_DRIVE_ID`), operational documents | Service account | Per-request |
| **Odoo ERP** (via JSON-RPC) | Authoritative ERP. Not accessed directly at runtime by the app. Data flows into Sheets via `/api/cron/odoo-sync` (hourly, delta-based on `write_date`). Synced models: invoices, payments, sale_orders. Product catalog synced separately into CC_Products_Full (mechanism: manual export or script — not the cron). | `ODOO_URL` / `ODOO_DB` / `ODOO_API_KEY` | N/A (write target is Sheets) |
| **Squarespace** (countercultures.com.mx) | LIVE PRODUCTION SITE. Not read at runtime. Content was scraped into the sidecar JSON and local files via `scripts/scrape/*`. | N/A | N/A |

---

## Sources we will NOT use after July 6 launch

| Source | Current role | Deprecation path |
|---|---|---|
| **Squarespace site** (countercultures.com.mx) | Live production; CC_Products_Full prices sometimes cross-checked against SS listings | DNS cutover replaces SS entirely. Post-cutover: SS site goes read-only or offline. |
| **CRM `Products` + `Products_Odoo` tabs** | Legacy product reader in `sheets.ts`; used as PDP fallback (line 969 of `products-full.ts`) | Superseded by CC_Products_Full for all catalog reads. The CRM Products tabs should be treated as a small curated subset only. Long-term: remove the fallback import. |
| **CRM `Products_Quote` tab** | Quote-only catalog surface (`/shop/quote/`) | Being folded into CC_Products_Full with `sale_ok=false` + `availability=quote_only`. Deprecated route. |
| **Gmail subject-line scanner** (COMPROBANTE_ pattern) | Legacy factura detection | Deprecated per CLAUDE-FINANCE-RULES rule 6. Manual fallback only. |

---

## Per-element audit

### Product List Price

| | |
|---|---|
| **Canonical source** | `CC_Products_Full` sheet → `list_price` column |
| **Read paths** | `products-full.ts:268` (→ `ProductFull.listPrice`) → PDP page, cart line items, checkout totals, search results, catalog cards, brand pages, JSON-LD offers, related products grid |
| **Secondary source** | CRM `Products` / `Products_Odoo` tabs → column 7 (via `sheets.ts:129`). Used ONLY as PDP slug-fallback path (`products-full.ts:969` imports `sheets.getProductBySlug`). |
| **Sidecar** | `product-content.json` carries a `price` field on ~1,215 entries (from Squarespace scrape). Currently read by `toQuoteProduct()` in `products-full.ts:845` for the quote catalog adapter ONLY — not by the main PDP or cart. |
| **Conflicts** | CC_Products_Full prices come from Odoo export. Squarespace has its own prices (scraped into sidecar). CRM Products tabs have yet another price column. **Three potential price sources.** In practice, CC_Products_Full wins everywhere that matters (PDP, cart, checkout, search). |
| **Data quality** | Prices in CC_Products_Full are IVA-inclusive per Mexican law (confirmed by `iva.ts` extract-from-inclusive logic, sha c5f28ff). Currency is per-row (MXN or USD). Zero-price products exist (~products with `listPrice: 0`) — UI hides price when ≤ 10 in JSON-LD. |
| **Migration path** | CC_Products_Full is authoritative. Remove sidecar `price` field reads. Remove CRM Products price column from any customer-facing path. |

### Product Trade Price

| | |
|---|---|
| **Canonical source** | Trade Pricing sheet → `Prices` tab (`GOOGLE_SHEETS_ID_TRADE_PRICING`) |
| **Read paths** | `trade-pricing.ts` → `getTradePrice()` / `getTradePriceMap()` → PDP page (line 130: only for trade-authenticated customers) |
| **Secondary source** | CRM `Products` tab has a `tradePrice` column (col 8 in `sheets.ts:128`). Also: `cart-store.ts` carries `tradePrice` per cart item (client-side, set at add-to-cart time). |
| **Conflicts** | Trade Pricing sheet is the dedicated, tier-aware source. CRM Products tradePrice is a flat value per product (no tier support, no effective dates). |
| **Data quality** | Per MASTER-PLAN: trade pricing RENDERING is being pulled (Week 1 Day 4). Engine + data stay for internal quoting. Trade customers will see list prices publicly. |
| **Migration path** | Trade Pricing sheet remains source of truth for internal use. Customer-facing trade-price display being removed. |

### Product Name

| | |
|---|---|
| **Canonical source** | `CC_Products_Full` sheet → `name` column (Odoo product name, typically English) |
| **Read paths** | `products-full.ts:245` → `ProductFull.name` → PDP title, cart line item name, search results, catalog cards, slug generation, JSON-LD `name`, breadcrumb, related products |
| **Secondary source** | Sidecar `product-content.json` → `title` field (scraped from Squarespace, typically Spanish). Used by PDP for: `generateMetadata` (line 67: `content?.title \|\| product.name`), JSON-LD (line 193), breadcrumb (line 252). |
| **CRM Products** | Has both `name` (col 3, Spanish) and `nameEn` (col 4) in `sheets.ts:109-110`. Only reached via the PDP slug-fallback path. |
| **Conflicts** | **Two names in active use on the same PDP.** The sheet name (English, from Odoo) is used for slug generation, search, cart items, and the `product.name` field. The sidecar title (Spanish, from Squarespace) overrides in meta/JSON-LD/breadcrumb when present. This means the page `<title>` can be Spanish while the H1 rendered by `PDPClient` uses the Odoo English name. |
| **Data quality** | Odoo names are manufacturer-style (e.g., "Brizo 63054LF-GL Litze Bar Faucet"). Sidecar titles are marketing-style Spanish (e.g., "Grifo de Bar Litze"). 1,215 of 354K products have sidecar titles. |
| **Migration path** | CC_Products_Full `name` is authoritative for identity. Sidecar title is a display enhancement. Week 3 Squarespace scrape will expand sidecar coverage. Consider adding an explicit `display_name_es` / `display_name_en` to CC_Products_Full long-term. |

### Product Description

| | |
|---|---|
| **Canonical source** | `pdp-description.ts` resolver — NOT a single data store, but a 5-level fallback chain |
| **Resolution chain** | 1. Sidecar JSON `descriptionEs`/`descriptionEn` (locale match) → 2. Sidecar other locale → 3. ProductFull `descriptionEs`/`descriptionEn` (merged from sidecar at cache-load time in `products-full.ts:275-276`) → 4. ProductFull other locale → 5. Fallback `"{brand} {name}"` |
| **Read paths** | `pdp-description.ts` → PDP visible description block, `<meta description>`, OpenGraph, JSON-LD. Called from `page.tsx:70` (metadata) and `page.tsx:139` (render). |
| **Additional source (NOT wired to PDP)** | `Product_Descriptions` tab in CRM sheet (`product-descriptions.ts`) — AI-generated descriptions with Roger approval gate. Status: pending/approved/rejected. **Currently used only by catalog drawer and brand-category pages** (`getApprovedBulk`), NOT by the PDP resolver chain. |
| **CRM Products** | Has `description` (col 13, Spanish) and `descriptionEn` (col 14) — only reached via slug-fallback. |
| **Conflicts** | The sidecar and ProductFull `descriptionEs`/`descriptionEn` fields are populated from the same sidecar at load time (`products-full.ts:275-276` reads `getProductContent(id)`). So steps 1-2 and steps 3-4 of the resolver often carry the same data — the chain is mainly about locale preference, not competing sources. **The real gap:** AI-generated descriptions (`Product_Descriptions` tab) are NOT in the resolver chain. They sit unused for PDP rendering even when approved. |
| **Data quality** | 1,215 products have sidecar descriptions. Remaining ~353K fall through to `"{brand} {name}"` fallback. AI-generated descriptions exist but are gated behind Roger approval and not wired to PDP. |
| **Migration path** | Week 2 Squarespace scrape expands sidecar coverage. Week 3 AI generation fills top 50K. Wire `Product_Descriptions` (approved only) into the resolver chain as step 2.5 (after sidecar, before CRM fallback). |

### Product Images

| | |
|---|---|
| **Canonical source** | Resolution priority in `products-full.ts:258-261`: 1. Manifest thumbnail (`/products/odoo/<id>.jpg`) → 2. First gallery image from sidecar → 3. undefined (typography placeholder) |
| **Read paths** | `ProductFull.imageSrc` / `ProductFull.hasImage` → PDP hero, catalog cards, search results, cart line items, related products grid, brand signature tiles |
| **Gallery** | Sidecar `product-content.json` → `gallery[]` (paths under `/products/odoo-gallery/<id>/`). Read by PDP page (line 163) for hero image carousel. Also used by `toQuoteProduct()`. |
| **Brand images** | Brand Kit sheet → `logoDriveId` / `heroDriveId` / `brandFolderDriveId` (Google Drive file IDs). Used by brand pages, search index. **Currently served via Google Drive proxy — will migrate to Cloudflare Images.** |
| **CRM Products** | Has `images` column (col 11, comma-separated URLs). Only reached via slug-fallback. |
| **Coverage** | 4,236 thumbnails / 354K products = **1.2% coverage**. 96 products have gallery images. 1,215 sidecar entries exist but many have empty gallery arrays. |
| **Data quality** | Image coverage is the single biggest content gap. ~98.8% of products render the typography placeholder. Brand hero images exist for ~73 brands in Google Drive (coverage varies — some Drive IDs may be empty). |
| **Migration path** | Week 2: Squarespace scrape pulls images. Cloudflare Images + R2 replaces local files + Drive. New `image_url` column on CC_Products_Full pointing to CDN. |

### Product SKU

| | |
|---|---|
| **Canonical source** | `CC_Products_Full` sheet → `sku` column |
| **Read paths** | `ProductFull.sku` → slug generation (`toSlug(name, sku)`), PDP display (currently shown — to be removed per Week 1 Day 3 cleanup), cart line items, search scoring, JSON-LD `sku` + `mpn`, variant detection (`extractSkuRoot`), stock lookup key |
| **Conflicts** | None. Single source. |
| **Data quality** | SKU format varies by brand (e.g., "BRI-63054LF-GL", "CAL-0185", "EMT-8520US10B"). Some have prefixes; most are manufacturer codes. |
| **Migration path** | None needed. SKU display on PDP being removed (visual only — data stays). |

### Product Slug (URL)

| | |
|---|---|
| **Canonical source** | Computed at runtime by `toSlug(name, sku)` in `slug.ts` |
| **Read paths** | `products-full.ts:286` (at cache load), `pdp-href.ts` (at link render), PDP `generateStaticParams`, sitemap, search results, cart `productHref` |
| **Secondary source** | CRM `Products` tab has a stored `slug` column (col 17 in `sheets.ts:139`). Used only in CRM fallback path. |
| **Conflicts** | Slug is deterministic from name + sku. The CRM stored slug MAY drift if the product name changes in Odoo (slug won't update in CRM). Low-risk because the CRM fallback path is rarely hit. |
| **Data quality** | `toSlug` truncates name to 60 chars, total slug to 80 chars. NFD-aware diacritics stripping. Slugs are stable as long as Odoo name + sku don't change. |
| **Migration path** | None needed. Runtime computation is correct. |

### Product Brand (on product records)

| | |
|---|---|
| **Canonical source** | `CC_Products_Full` sheet → `brand` column (string, e.g., "Brizo", "California Faucets") |
| **Read paths** | `ProductFull.brand` → PDP display, breadcrumb, `byBrand` Map grouping, brand page product lists, search scoring, catalog filters, cart line items |
| **Join to Brand Kit** | Name-string match. `BRAND_SLUG_MAP` in PDP page maps `brand name → brand slug` using `constants.ts` BRANDS array. Brand Kit sheet also keyed by name. **No numeric ID join.** |
| **Conflicts** | Brand names MUST match exactly between CC_Products_Full and Brand Kit. Case/whitespace mismatches break the join silently (products won't appear under their brand page). |
| **Data quality** | 73 brands in Brand Kit. Product catalog references ~200+ brand strings. Many products reference brands NOT in the Brand Kit (they still render on PDPs but lack brand-page context). |
| **Migration path** | None needed for launch. Post-launch: consider adding a `brand_slug` column to CC_Products_Full for a more robust join. |

### Brand Metadata (logo, description, partner status)

| | |
|---|---|
| **Canonical source** | Brand Kit sheet (`GOOGLE_BRAND_KIT_SHEET_ID`) → `brands` tab, 25 columns |
| **Read paths** | `brand-kit-sheets.ts` → brand pages (`/brands`, `/brands/[slug]`, `/brands/[slug]/[category]`), search index (MiniSearch), dashboard brand management, `featured-brands.ts` fallback, landed-cost calculations, shipment risk |
| **Secondary sources** | `constants.ts` → `BRANDS` array (hardcoded subset of ~12 flagship brands with slug + name + country). Used for `BRAND_SLUG_MAP` on PDP page and `FLAGSHIP_FALLBACK` in search index when Brand Kit sheet is unreachable. |
| **Image delivery** | Brand logos/heroes referenced via `logoDriveId`/`heroDriveId` (Google Drive). **Not yet migrated to CDN.** |
| **Data quality** | 73 brands fully populated. Logo/hero Drive IDs may be empty for newer brands (fallback renders without image). Descriptions bilingual (EN/ES). |
| **Migration path** | Week 2: brand images migrate to Cloudflare Images. Drive IDs replaced with CDN URLs. |

### Product Category / Subcategory

| | |
|---|---|
| **Canonical source** | `CC_Products_Full` → `category` column (normalized to "bathroom" / "kitchen" / "hardware" in `products-full.ts:186-189`) |
| **Read paths** | `ProductFull.category` → PDP URL structure (`/shop/{category}/p/{slug}`), catalog filters, brand-category pages, `categoryCounts`, `byBrand` grouping, JSON-LD `category` label |
| **Subcategory** | NOT in CC_Products_Full. Only in CRM `Products` tab (col 6). Subcategory hierarchy defined in `constants.ts` → `PRODUCT_CATEGORIES` with static slugs. Used by `/shop/[category]` page and subcategory filter routes. |
| **Conflicts** | CC_Products_Full has only 3 top-level categories. CRM Products has subcategories. The two don't cross-reference. Products found via the main catalog (354K) have no subcategory; products from CRM have both. |
| **Data quality** | Category inference fallback exists (`inferCategoryFromName` in `sheets.ts:93-98`) for invalid values. |
| **Migration path** | Consider adding a `subcategory` column to CC_Products_Full (from Odoo product category tree) for richer filtering on the full 354K catalog. Low priority for launch. |

### Product Inventory / Stock Status

| | |
|---|---|
| **Canonical source** | Odoo stock quants, mirrored to `Odoo_Stock_Quants` + `Odoo_Stock_Locations` tabs in CRM sheet |
| **Read paths** | `odoo-sheets.ts:829-836` → `products-full.ts:50-80` (`buildStockMap`) → `ProductFull.stockQty` / `ProductFull.inStock` → PDP "In stock" badge, catalog `inStockOnly` filter, hero "in stock" counter |
| **Sync mechanism** | `Odoo_Stock_Quants` and `Odoo_Stock_Locations` are populated by Odoo data export (separate from the hourly invoice/payment sync cron). Refresh frequency unclear. |
| **Conflicts** | None — single source through Odoo mirror. |
| **Data quality** | Stock map filters to `internal` usage locations only (CC warehouse + Laredo consolidators). If locations tab is empty/unreachable, falls back to summing ALL quants (imperfect but non-zero). Empty stock map = no "In stock" badges rendered (graceful degradation, no errors). |
| **Migration path** | None needed for launch. Stock data freshness depends on how often the Odoo mirror is refreshed. |

### Product Spec Sheets

| | |
|---|---|
| **Canonical source** | Sidecar `product-content.json` → `specSheetUrl` (remote, manufacturer-hosted) + `specSheetLocal` (local mirror at `/specs/odoo/<id>.pdf`) |
| **Read paths** | `products-full.ts:280-281` → `ProductFull.specSheetUrl` / `specSheetLocal` → PDP page (passed as props at line 302-303) |
| **Coverage** | 468 local spec PDFs out of 354K products. Remote URLs populated for a subset of the 1,215 sidecar entries. |
| **Data quality** | Remote URLs may be stale (manufacturer sites change). Local mirrors are stable. No systematic spec sheet scraping has been done beyond the initial Squarespace scrape. |
| **Migration path** | Week 2: Squarespace scrape pulls more spec URLs. Week 5: spec PDFs migrate to R2 + new "Specs" section on every PDP. |

### Customer Record

| | |
|---|---|
| **Canonical source** | `Customers` tab in CRM sheet |
| **Read paths** | `customer-sheet.ts` → `getCustomer()` / `getAllCustomers()` / `upsertCustomer()` → customer auth flow (`customer-auth.ts`), cart persistence (`Customer_Carts` tab), pipeline backfill, trade status |
| **Fields** | email (PK), name, phone, addresses, RFC, factura default, locale, trade_tier, is_trade, created_at, last_login_at, marketing_opt_in, notes |
| **Auth data** | NextAuth session carries `isTrade` / `tradeTier` in JWT (set from Customers sheet at login). Magic-link tokens in `Verification_Tokens` tab. |
| **Conflicts** | None — single source. Customer data does NOT live in Odoo for this system (Odoo Partners are a separate concept for vendor/AP operations). |
| **Data quality** | New customers auto-created on first magic-link or Google sign-in. `STAGING_EMAIL_REDIRECT` rewrites customer email to admin@ in staging (original email preserved in Customers sheet). |
| **Migration path** | None needed for launch. Post-launch: Sheets → Postgres if scale demands. |

### Cart State

| | |
|---|---|
| **Canonical source** | Client-side: zustand + localStorage at key `cc_cart_v1` |
| **Read paths** | `cart-store.ts` → cart page, checkout stepper, cart drawer, order summary, add-to-cart button, cart icon (item count) |
| **Server mirror** | `Cart_Sessions` tab in CRM sheet — written at checkout submit (`/api/checkout/submit/route.ts:55`, `/api/checkout/quote/route.ts:41`, `/api/checkout/buy/route.ts:101`). Also updated by Stripe webhook dispatcher on payment. |
| **Logged-in persistence** | `Customer_Carts` tab — JSON blob per email (`customer-sheet.ts:224-260`). |
| **Conflicts** | Client cart is the live state. Server mirror is write-only at checkout — not read back into the client. Customer_Carts is read on login to restore cart. **If a customer has items in localStorage AND in Customer_Carts, behavior is unclear — check cart-sync.ts.** |
| **Data quality** | Cart session ID persists across submissions until cart cleared. `cartSessionId` is the idempotency anchor for preventing double-creates. |
| **Migration path** | None needed for launch. |

### Tax Rate (per line)

| | |
|---|---|
| **Canonical source (cart/checkout)** | Hardcoded 16% IVA in `iva.ts` |
| **Canonical source (AP/AR invoicing)** | `Tax_Rates` tab in CRM sheet → managed at `/dashboard/settings/tax-rates` |
| **Read paths** | Cart/checkout: `computeIva()` in `iva.ts` → checkout stepper, order summary, Stripe payment intent. AP/AR: `tax-rates.ts` → `listActiveTaxRates()` → document generator dropdown, invoice template. |
| **Conflicts** | Two separate systems by design (per CLAUDE-FINANCE-RULES rule 42). Cart always uses 16% IVA for MX ship-to. AP can use configurable rates (IVA, IEPS, Retencion, Other). |
| **Data quality** | Sound. Intentional separation. |
| **Migration path** | None needed. If per-line tax rates are ever needed at checkout (e.g., IEPS on certain products), wire Tax_Rates into the cart math. Not in scope for launch. |

### Order / Deal Record

| | |
|---|---|
| **Canonical source** | `Pipeline` tab in CRM sheet |
| **Read paths** | `dashboard-sheets.ts` → `readSheet("Pipeline")` → deal detail pages, pipeline views, stale-deal-sweep cron, customer-sheet backfill |
| **Related tabs** | `Deal_Line_Items`, `Deal_Events`, `Deal_Payments`, `Cart_Sessions`, `Conversation_Log`, `Notes` |
| **Lifecycle** | State machine in `rule-engine.ts` via `evaluateAndTransition()`. Stages defined in `LIFECYCLE-STATE-MACHINE.md`. All transitions logged to `Deal_Events`. |
| **Conflicts** | None — Pipeline is the single source. Odoo sale orders (`Odoo_Sale_Orders` tab) are a separate downstream record created when a deal reaches `order_confirmed`. |
| **Data quality** | Sound for current scale. |
| **Migration path** | None needed for launch. |

---

## Conflict summary — the three tangles

### Tangle 1: Three price sources

| Source | Scope | Who updates | Freshness |
|---|---|---|---|
| CC_Products_Full `list_price` | All 354K products | Odoo export → Sheet | Unclear (manual refresh?) |
| CRM Products tab col 7 | Curated subset (~100s) | Manual sheet edit | Stale for many rows |
| Sidecar `product-content.json` `price` | 1,215 products (Squarespace scrape) | Build-time script | Snapshot from last scrape |

**Resolution:** CC_Products_Full wins. The other two should not be read for customer-facing price display. The sidecar price read in `toQuoteProduct()` should be removed or replaced with CC_Products_Full `listPrice`.

### Tangle 2: Product name / title (EN vs ES)

| Source | Language | Coverage | Used for |
|---|---|---|---|
| CC_Products_Full `name` | English (Odoo) | 354K | Slug, search, cart, H1 on PDP |
| Sidecar `title` | Spanish (Squarespace) | 1,215 | Meta title, JSON-LD name, breadcrumb |
| CRM Products `name` / `nameEn` | Mixed | Small subset | Slug-fallback path only |

**Resolution:** Both are legitimate — they serve different purposes. But the meta-title using a Spanish string while the page H1 uses English is a bilingual consistency issue. **Decision needed:** should the PDP always use the sidecar title when available (for both H1 and meta), or always use the Odoo name? See open questions below.

### Tangle 3: Description coverage gap

| Source | Coverage | Quality | Wired to PDP? |
|---|---|---|---|
| Sidecar `descriptionEs` / `descriptionEn` | 1,215 / 354K (0.3%) | High (Squarespace scrape + partner sites) | Yes (resolver step 1-2) |
| `Product_Descriptions` tab (AI-generated) | Unknown (Roger-gated) | Medium (Haiku 4.5, needs approval) | **No** — only catalog drawer + brand-category pages |
| Fallback `"{brand} {name}"` | 100% | Minimal | Yes (resolver step 5) |

**Resolution:** Wire `Product_Descriptions` (status=approved) into the PDP resolver chain at step 2.5 (after sidecar, before CRM). This gives Roger editorial control while dramatically expanding description coverage. Scheduled: Wire after Week 3 AI generation fills the tab.

---

## Open data-quality questions for Joshua

These surfaced during the audit. Each needs a decision — don't fix, just decide.

1. **CC_Products_Full refresh mechanism.** How often is the 354K-row sheet updated from Odoo? The hourly cron syncs invoices/payments/sale_orders, but NOT the product catalog. If a price changes in Odoo today, when does CC_Products_Full reflect it? Is this a manual re-export, a script, or something else?

2. **Product name bilingual split.** The PDP currently shows English Odoo name as H1 but may show Spanish sidecar title in `<title>` and JSON-LD. Is this intentional? Should Week 3 scrape produce an explicit `display_name_es` field to make the split deliberate rather than accidental?

3. **AI-generated descriptions not wired to PDP.** `Product_Descriptions` tab exists with a Roger-approval gate, but the PDP resolver doesn't read it. Is this intentional (Roger wants manual review before any AI text goes on PDPs), or was it an oversight? If intentional, when should it be wired in — after the top-5K hand-edit pass in Week 5?

4. **Sidecar price field.** `product-content.json` carries a `price` field from the Squarespace scrape. It's read by `toQuoteProduct()` for the quote catalog. These prices are snapshot-in-time from Squarespace and may disagree with CC_Products_Full. Should the quote catalog adapter use CC_Products_Full `listPrice` instead?

5. **Brand name join fragility.** Products reference brands by exact string match. If a brand is renamed in Odoo (e.g., "California Faucets" → "CaliFaucets"), products silently fall off their brand page. Is this acceptable for launch, or should we add a `brand_id` or `brand_slug` column to CC_Products_Full?

6. **Subcategory gap on full catalog.** CC_Products_Full has only top-level categories (3). CRM Products has subcategories. The 354K catalog can only be filtered by bathroom/kitchen/hardware. Is subcategory filtering needed for launch, or is it acceptable to defer to the search palette?

7. **Stock data freshness.** `Odoo_Stock_Quants` feed the "In stock" badge. What's the refresh frequency? If a product sells out in Odoo at 2pm and the quant mirror refreshes nightly, the badge lies for ~18 hours. Is this acceptable for launch?

8. **Spec sheet remote URL stability.** 468 local spec PDFs exist, but remote URLs in the sidecar may point to manufacturer sites that change. Should we proactively mirror all remote spec sheets to R2 during the Week 5 migration, or only mirror on first access?

---

## PDP contract

| | |
|---|---|
| **Canonical template** | `app/[locale]/shop/[category]/p/[slug]/page.tsx` |
| **Sacred Surface** | #2 (see `docs/SURGICAL-RULES.md`) |
| **Data input** | `ProductFull` from `app/lib/products-full.ts` (source: `CC_Products_Full` sheet) |
| **Description input** | `pdp-description.ts` resolver (5-level fallback: sidecar → ProductFull → fallback) |
| **Display elements** | Image hero, product name (H1), brand, breadcrumb, description, list price, currency, finish picker, qty selector, Add to Cart, Add to Project, related products grid, JSON-LD, meta/OG tags |
| **URL pattern** | `/{locale}/shop/{category}/p/{slug}` |
| **Deprecated alternative** | `/shop/quote/{slug}` — removed 2026-05-20, 301 redirects to `/shop/catalog` |

---

## Product-render surface inventory (audited 2026-05-20)

> Every file that renders product fields, grouped by shared-component usage.
> **Canonical PDP:** `app/[locale]/shop/[category]/p/[slug]/page.tsx` (Sacred Surface #2).
> **The deprecated `/shop/quote/` template was removed 2026-05-20** — 301 redirects to `/shop/catalog`.

### Shared components (well-structured — no action needed)

| Component | Path | Renders |
|---|---|---|
| ProductCard | `app/components/products/ProductCard.tsx` | Card: brand, name, image, price, finishes, availability |
| ProductVisual | `app/components/product-visual.tsx` | Image with typography fallback |
| SafeProductImage | `app/components/safe-product-image.tsx` | Image with brand/SKU fallback |
| BrandSignatureTile | `app/[locale]/brands/[slug]/brand-signature-tile.tsx` | Featured product tile on brand pages |
| PDPClient | `app/[locale]/shop/[category]/p/[slug]/pdp-client.tsx` | Full PDP detail (canonical) |

### Pages that delegate to shared components (no action needed)

| Surface | Path | How |
|---|---|---|
| Category page | `app/[locale]/shop/[category]/page.tsx` | Uses ShopCatalog → ProductCard |
| Subcategory page | `app/[locale]/shop/[category]/[subcategory]/page.tsx` | Uses ShopCatalog → ProductCard |
| Brand page | `app/[locale]/brands/[slug]/page.tsx` | Uses BrandSignatureTile |
| Brand+category page | `app/[locale]/brands/[slug]/[category]/page.tsx` | Uses BrandSignatureTile |
| Cart / order summary | `app/components/cart/order-summary.tsx` | Renders CartItem snapshots (not live product) |
| Checkout stepper | `app/[locale]/checkout/checkout-stepper.tsx` | Form state, minimal product rendering |

### One-off renderings (refactor candidates — Day 3 follow-up)

| # | File | What it renders inline | Recommended fix |
|---|---|---|---|
| 1 | `app/[locale]/shop/catalog/catalog-view.tsx` | Full product cards (name, sku, brand, price, image, finishes, stock) | Extract to ProductCard variant or import ProductCard |
| 2 | `app/[locale]/shop/catalog/product-drawer.tsx` | Product detail modal (name, sku, brand, price, finishes, image, stock) | Extract to shared drawer component using PDP subcomponents |
| 3 | `app/(dashboard)/dashboard/(portal)/products/catalog-search.tsx` | Dashboard product tiles (same fields as #1) | Import ProductCard or create dashboard-specific ProductCardAdmin |
| 4 | `app/(dashboard)/dashboard/(portal)/products/product-detail-panel.tsx` | Dashboard product detail panel (tabbed, all fields) | Extract to shared component |

**Note:** Items 3–4 are dashboard-only (admin surfaces). They serve a different UX purpose than customer-facing cards, so a shared `ProductCardAdmin` variant may be more appropriate than forcing them to use the customer-facing `ProductCard`.

### Minor one-offs (low priority — acceptable for launch)

| File | What | Why acceptable |
|---|---|---|
| `app/components/cart/add-to-cart-button.tsx` | Reads `product.finishes` for finish-required check | Button logic, not visual rendering |
| `app/(dashboard)/components/command-palette.tsx` | Search result snippets (name, sku, brand) | Compact search UI, intentionally minimal |
| `app/(customer)/account/projects/[id]/page.tsx` | Project line items (name, brand, sku, price) | Renders CartItem snapshots, not live product |
| `app/(dashboard)/components/product-insert-context.tsx` | Creates InsertableProduct snapshot | Data mapping, not rendering |

### API routes (server-side only — no JSX rendering, not in scope)

`stripe/checkout`, `dashboard/deals/[id]/line-items`, `dashboard/products/generate-description`, `checkout/quote` — read product fields for business logic only.

---

*Maintained by Joshua. Update when data sources change. This doc + `MASTER-PLAN.md` §6 are the two docs to open each morning.*
