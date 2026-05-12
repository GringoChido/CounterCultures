# 02 — Data Layer

_last updated 2026-05-12_

Where Counter Cultures data actually lives, who owns each entity, and how the moving parts connect. Findings here come from the 2026-05-12 codebase audit and live Google Sheets sampling. Quality issues against this data (placeholder prices, missing fiscal fields, Spanglish strings) live in [06](./06-data-quality.md).

## The three spreadsheets

All persistent business state outside of Stripe/Odoo lives in three Google Spreadsheets:

### 1. `Counter Cultures CRM` — main operational DB

- **fileId**: `1iXG4A6bzrRSodbendoi-IVy6gi1cqiKbDado_bH7Yt0`
- **Size**: 6.9 MB
- **Tabs**: 70+ (Deals, Customers, Leads, Quotes, Orders, Invoices, Payments, Shipments, Pedimentos, Trafico, Trade_Applications, Trade_Codes, Users, Reps, Posts, Activity_Log, FX_Rates, Gmail_Tokens, Notifications, plus 16+ `Odoo_*` mirror tabs and several `_archive` tabs)
- **Owner (Drive metadata)**: `jsemolik@gmail.com` — a **personal Gmail account**, not a workspace account
- **Location**: personal "My Drive" (no `parentId`, not in any Shared Drive)
- **Codebase comment**: "main CRM near 10M cell cap"
- **Governance flag**: business continuity sits on a personal Google account. If `jsemolik@gmail.com` is suspended or the owner is unreachable, the company loses its CRM. See also "second Brand Kit folder" in [06](./06-data-quality.md).

### 2. `CC_Products_Full` — catalog of record

- **fileId**: `1oEWZ1iBuyfo0RLEDanXZRwWkLwPnYT4Hyt6zQcfI_og`
- **Size**: 4.4 MB
- **Shape**: **354,449 product rows × 10 columns (A:J)**
- **Location**: Shared Drive
- **Cell-cap math**: 354,449 × 10 ≈ **3.54M cells of the 10M cap (~35%)**. If the codebase claim of 11 columns held it would be 354,449 × 11 ≈ 3.9M (~39%). Headroom is comfortable today, tight by EOY 2027 at current growth.
- **Schema drift**: codebase reads `A:K` (11 columns) — see `app/lib/sheets/products-full.ts`. Sheet only has `A:J`. Column K reads return `undefined` and silently no-op. Tracked again in [06](./06-data-quality.md).

### 3. `Brand Kit` — brand directory

- **fileId**: `1CHIB3NX0kDSGx4sTulkYmzHn32-6yMtQ_dEqJrD9ZBs`
- **Shape**: ~98 brand rows × 25 columns
- **Location**: Shared Drive
- **Headers include**: `slug`, `name`, `tagline_es`, `description_es`, `description_en`, `logo_drive_id`, `hero_drive_id`, `brand_folder_drive_id`, `featured_product_ids`, `nom_status_summary`, `is_artisan`, `updated_at`, `updated_by`
- **Note**: a second `Brand Kit` folder owned by the service account exists — see [06](./06-data-quality.md)

## Source-of-truth map by entity

| Entity | Source of truth | Mirror / projection | Where the dashboard reads |
| --- | --- | --- | --- |
| Product catalog (354K SKUs) | `CC_Products_Full` (Schema A) | none | Public catalog; **Dashboard reads Schema B from CRM `Products` tab** for editorial subset |
| Product editorial (priced, curated) | CRM `Products` tab (Schema B) | none | Dashboard /products + customer-facing brand pages |
| Customer | CRM `Customers` tab | `Odoo_Customers` mirror | Dashboard /customers |
| Lead | CRM `Leads` tab | `Odoo_Leads` | Dashboard /leads |
| Deal / Quote / Order | CRM `Deals` + `Quotes` + `Orders` | `Odoo_*` mirrors | Dashboard /deals, /pipeline |
| Invoice | **Odoo (write-side)** + CRM `Invoices` (mirror) | `Odoo_Invoices` | Dashboard /finance + /payments |
| Payment | **Odoo (write-side)** for 4,674 records + CRM `Payments` for 48 manual | none reconciled | Two ledgers — see [04](./04-dashboard-state.md) |
| Vendor bill | CRM `Vendor_Bills` (AP queue) | `Odoo_Vendor_Bills` | Dashboard /accounts-payable |
| Purchase order | CRM `Purchases` | `Odoo_Purchases` | Dashboard /purchases |
| Vendor | CRM `Vendors` | `Odoo_Vendors` | Dashboard /vendors |
| Pedimento / Trafico (Mx customs) | CRM `Pedimentos` + `Trafico` | none | Dashboard /trafico |
| Brand | `Brand Kit` (separate file) | mirrored to CRM `Brands` tab on read | Brand pages + Dashboard /brands |
| Trade Application | CRM `Trade_Applications` | none | Dashboard /trade (mostly mocked — see [04](./04-dashboard-state.md)) |
| Trade Code | CRM `Trade_Codes` | none | `/api/cart/trade-code` endpoint |
| FX rate | CRM `FX_Rates` (populated by `fx-sync` cron) | none | Multiple |
| Gmail OAuth tokens | CRM `Gmail_Tokens` (AES-256-GCM encrypted) | none | `/api/gmail/*` |
| User / role | CRM `Users` tab | NextAuth JWT | Auth callback — **currently empty**, see [04](./04-dashboard-state.md) |

## Two parallel Products schemas

This is the most important data-layer fact about Counter Cultures, and the source of most "why is X different in the public site vs Dashboard" questions.

### Schema A — the catalog

- Lives in `CC_Products_Full`
- IDs start at **629192+** (Odoo product IDs, preserved verbatim)
- SKUs are vendor-formatted strings like `EMTEK -  1L1A55CDLHTWB` (two spaces preserved)
- 354,449 rows
- **`list_price` is `1.00 MXN` for every visible row** (placeholder) — see [06](./06-data-quality.md)
- Powers the public `/shop` and `/catalog` views

### Schema B — the editorial subset

- Lives in CRM `Products` tab
- IDs start at **1** and run small (visible range is single/low double digits)
- SKUs are normalized like `EMT-0001`
- Has real prices, curated names, hero images, "tradePrice" column for the Trade program
- Powers Dashboard /products and brand-page featured-product slots

### The bridge

There isn't one. Same physical Emtek lockset has **id 629192 + SKU `EMTEK -  1L1A55CDLHTWB` in Schema A** and **id 1 + SKU `EMT-0001` in Schema B**. There is no foreign-key column joining the two. Joining today happens by fuzzy name match in a couple of dashboard widgets, which is why brand-page featured-product counts disagree with brand-page total-product counts.

## Odoo mirror

Sixteen-plus tabs in the main CRM are prefixed `Odoo_` (e.g. `Odoo_Customers`, `Odoo_Invoices`, `Odoo_Purchases`, `Odoo_Vendor_Bills`). They are populated by:

1. **Hourly cron** (`/api/cron/odoo-sync`, scheduled via Netlify) which calls Odoo XML-RPC, paginates results, writes rows in batches.
2. **Spot refresh on every dashboard mutation** — e.g. when a CRM Deal flips to Won, the relevant Odoo mirror tab gets a targeted re-read of the affected records.

Odoo itself is **labelled "Retiring"** inside the Dashboard at `/dashboard/odoo`, every endpoint there is currently 429-ing, and 8 of the 14 `/api/odoo/*` routes are `@deprecated` (see [05](./05-stale-inventory.md)). The XML-RPC sync is still running on schedule but the surface area is shrinking. Writes-to-Odoo happen exclusively through `app/lib/odoo/write.ts` (2 callers).

## Drive integration — two distinct OAuth flows

The app uses Google Drive for two purposes, with two different credential types:

### Service-account writes (full Drive scope)

- Service account: `counter-cultures-website@gen-lang-client-0620971024.iam.gserviceaccount.com`
- Scope: `https://www.googleapis.com/auth/drive` (full)
- Used by: customer-facing uploads (PO attachments, trade-app PDFs, product photo uploads from the Dashboard), Sheet writes, brand-asset uploads
- All Sheets API calls in the app authenticate as this principal

### Per-user OAuth (readonly Drive)

- Used by: Dashboard "Drive" module file browser, Gmail integration's attachment listing
- Scopes: `gmail.modify`, `drive.readonly`
- Tokens stored AES-256-GCM encrypted in CRM `Gmail_Tokens` tab, keyed by user email
- Currently the Drive module is **"Failed to load"** in the Dashboard despite the service account being connected — see [04](./04-dashboard-state.md). The failure is on the per-user side, not the service account.

## Gmail integration

Per-user OAuth, identical token-storage pattern to Drive. Scopes: `gmail.modify` + `drive.readonly` (Drive scope is here because attachment metadata fetches go through the same client). The Dashboard `/inbox` view reads real threads via this path and renders them in ~5–8 s (measured during walkthrough).

## Concurrency / race conditions

The data-access layer (`app/lib/sheets/*`) exposes three primitives:

| Primitive | Atomic? | Idempotent? | Race-condition risk |
| --- | --- | --- | --- |
| `appendRow` | Yes (Sheets API guarantees) | No — double-call = duplicate row | Medium |
| `updateRow` | No — read-modify-write | No | **High** — concurrent writers clobber each other silently |
| `upsertRowByField` | No — read-modify-write | No | **High** |

There is **no optimistic locking** (no version column on any row, no `If-Match` semantics), no retry-with-jitter, and no row-level lease. The dashboard happens to have low concurrent-write volume so the hazard rarely surfaces, but the `stale-deal-sweep` cron + a human edit on the same Deal at 14:00:01 UTC will silently drop one of the two writes. There is no audit trail to detect when this happens.

## Trade program — data already partially in place

The Trade infrastructure is real on the data side even though the Dashboard surface is mostly mocked (see [04](./04-dashboard-state.md)):

- `Trade_Codes` tab exists with columns including `code`, `discount_pct`, `partner_name`, `active`
- `Trade_Applications` tab exists, captures applicant data
- `/api/cart/trade-code` endpoint validates a submitted code against `Trade_Codes.active`
- **`Trade_Codes.discount_pct` is unused.** The real trade discount is per-product, sourced from the `tradePrice` column on Schema B Products. Submitting any valid `active=TRUE` code in cart toggles the cart-store's `useTradePrice` flag, which then re-prices line items from each product's `tradePrice`.

## Sheets cell-cap pressure

Google Sheets caps at 10,000,000 cells per file. Current state:

| File | Cells used | % of cap |
| --- | --- | --- |
| `CC_Products_Full` | 354,449 × 10 = 3.54M (code expects 11, would be 3.9M) | 35–39% |
| CRM main | not directly measured; codebase comment says "near 10M cap" | ~near cap |
| Brand Kit | ~98 × 25 = 2,450 | <0.1% |

The CRM main file is the at-risk one. Several tabs (`Activity_Log`, `Notifications`, `Odoo_Invoices`, `Odoo_Customers`) grow monotonically and have no archive cron. The 70+ tab structure itself doesn't cost cells, only used rows × columns do.

## What this implies for any new feature

1. New product-side data must pick a schema (A or B) and stay consistent — the bridge problem is real.
2. Anything that writes to the CRM should go through `upsertRowByField` or `appendRow`; treat `updateRow` as a hazard.
3. Personal-Gmail ownership of the CRM is a P0 governance issue independent of any code change.
4. Cell-cap growth in the main CRM needs an archive strategy before it becomes a blocker.

Sources: codebase audit (`app/lib/sheets/*`, `netlify.toml`, `/api/cron/*`), live Sheets metadata via Drive API, live cell-count sampling 2026-05-12.
