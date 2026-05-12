# 06 — Data Quality

_last updated 2026-05-12_

Findings from live Google Sheets sampling on 2026-05-12. This is what the data actually looks like in the source-of-truth files described in [02](./02-data-layer.md), not what the codebase or schemas claim it should look like.

## Ownership / governance flag

The main CRM file `Counter Cultures CRM` (`1iXG4A6bzrRSodbendoi-IVy6gi1cqiKbDado_bH7Yt0`) has Drive metadata:

- **`owners[0].emailAddress`**: `jsemolik@gmail.com`
- **`parents`**: none — file lives in personal "My Drive"
- **`driveId`**: absent — not in any Shared Drive

`jsemolik@gmail.com` is a **personal Gmail account**, not a `@countercultures.com.mx` workspace account. Business continuity, audit, and recovery all depend on a single personal Google identity. If that account is suspended, vacationing, or otherwise unavailable, the operating CRM (including 70+ tabs, 40 overdue AR rows, 741 stale quotes, the Users table, etc.) becomes unreachable.

A **second `Brand Kit` folder** also exists, owned by the service account `counter-cultures-website@gen-lang-client-0620971024.iam.gserviceaccount.com`. It is unclear whether this is a working copy, an orphan from an early integration test, or a deliberate write-target separate from the primary Brand Kit. Worth resolving — same brand data in two places is a small version of the dual-payment-ledger problem from [04](./04-dashboard-state.md).

## `CC_Products_Full` placeholder pricing

Every visible row in the 354,449-row catalog has `list_price = 1.00 MXN`. Sampling across the file (rows near 1, 100, 1000, 10000, 100000, 354000) returned the same `1.00`. This is the **catalog of record** for everything the public site shows under `/shop` and `/catalog`.

Real prices live in the **Schema B `Products` tab inside the main CRM**, which has IDs in the 1–low-double-digits range — i.e. a curated subset of perhaps a few dozen SKUs. The vast majority of the 354,449 catalog rows have **no real price anywhere in the source of truth**.

Implication: the public site is technically shipping a 354K-product catalog, but the price displayed on a catalog page for any non-Schema-B product is whatever the front-end falls back to when `list_price = 1`. The codebase appears to mask the literal "$1" by hiding price on cards with `list_price <= 1`, but the data is missing, not hidden.

## Two parallel Products schemas don't share IDs or SKUs

Concrete example — the same physical Emtek lockset:

| Field | Schema A (`CC_Products_Full`) | Schema B (CRM `Products`) |
| --- | --- | --- |
| `id` | `629192` | `1` |
| `sku` | `EMTEK -  1L1A55CDLHTWB` (two spaces between dash and code) | `EMT-0001` |
| `name_es` | `Emtek L1A55CD LH Cerradura...` | `Emtek L1A55CD LH Cerradura...` |
| `list_price` | `1.00` | `8,490.00` |
| `tradePrice` | (column absent) | `6,792.00` |

The two-space SKU on Schema A is not a transcription artifact — the cell value literally contains two consecutive spaces. Joining the schemas by SKU requires a normalize step (collapse whitespace, strip vendor prefix, etc.) and the result is still fuzzy because the prefix conventions diverge.

There is no foreign-key column in either schema pointing at the other. Joining today happens by approximate name match in a couple of Dashboard widgets, which is why brand pages show e.g. "168 products" in one tile and "151" in another (see [04](./04-dashboard-state.md)).

## Zero Mexican fiscal compliance fields in product data

For CFDI 4.0 factura electrónica generation (mandatory for invoicing in Mexico), each line item needs at minimum:

| Required field | Status in source data |
| --- | --- |
| `clave de producto y servicio` (SAT product/service code) | **Missing** |
| `clave de unidad` (SAT unit code, e.g. `H87`, `PZA`) | **Missing**; `uom` column contains English `Units` |
| HS code / tariff classification | **Missing** |
| RFC of vendor / manufacturer | **Missing** |
| `IVA` applicability flag | **Missing**; no tax-class column |

Without these, a CFDI generator cannot produce a compliant XML invoice for any product in the catalog. Today the team appears to be doing this manually inside Odoo on a per-deal basis. Building factura generation into Counter Cultures requires either (a) backfilling these columns into Schema A — 354K rows × 5 columns = 1.77M new cells, manageable against the 65% headroom — or (b) routing all invoicing through Odoo for the foreseeable future.

## `nameEn` duplicates Spanish `name`

In the Schema B `Products` tab, the `nameEn` column is **identical to the `name` (Spanish) column** in every visible row. Examples:

| `name` (es) | `nameEn` |
| --- | --- |
| `Emtek L1A55CD LH Cerradura...` | `Emtek L1A55CD LH Cerradura...` |
| `Kohler Aveo lavabo bajo encimera` | `Kohler Aveo lavabo bajo encimera` |

The English locale on the public site reads `nameEn` and displays it as-is. Result: visitors on `/en` see product names in Spanish. The column exists; nothing populated it.

## Brand Kit: 22 brands with AI-Spanglish descriptions

Sampling the Brand Kit shows **22 brands with descriptions stamped `updated_by = "claude (brands-151 batch)"` on `updated_at = 2026-05-05`** that contain mid-sentence English/Spanish mixing — what looks like an automated translation pass that stopped mid-token.

Examples from live cells:

- **pfister**: "Ofrece a broad range of elegante and affordable grifería that combines durability with refined design..."
- **american-standard**: "Marca histórica que delivers reliable plumbing fixtures across all price points..."
- **kallista**: "Luxury bath y kitchen brand under the Kohler umbrella, known for arquitecturalmente bold pieces..."

These strings are currently being served on the public brand pages at `/es/brands/[slug]` and `/en/brands/[slug]`. They are not in either language coherently. The list of 22 needs a manual rewrite pass.

## Brand Kit drive-asset columns: 100% empty

Four columns in `Brand Kit` are completely unpopulated across all 98 brands:

| Column | Filled cells |
| --- | --- |
| `logo_drive_id` | 0 of 98 |
| `hero_drive_id` | 0 of 98 |
| `brand_folder_drive_id` | 0 of 98 |
| `featured_product_ids` | 0 of 98 |

These columns were added in anticipation of the Drive-backed brand asset workflow (uploads in the Dashboard creating brand folders and indexing them here). The workflow exists in the Dashboard sidebar but no brand has been wired up to it yet. Brand-page hero images today come from hardcoded references in component files.

## `nom_status_summary` uniformly `unknown`

The `nom_status_summary` column on Brand Kit — intended to summarize Mexican NOM regulatory compliance per brand — shows the string **`unknown` for every row**. Sampled the first 30, the last 10, and 10 random middle rows. All `unknown`.

NOM compliance is a real concern for imported plumbing/electrical/appliance brands sold in Mexico, and there are columns adjacent (`nom_certificate_url`, `nom_renewal_date`) that are also empty. The structure is anticipating data that nobody has entered.

## `is_artisan` never used; "Artesanal" not a real brand

`is_artisan` is a Brand Kit column. **It is `FALSE` for every row.** The column appears unused in any Dashboard or front-end logic — searching for `is_artisan` in `app/**` returns sporadic references in type definitions but no consumer.

Meanwhile, the public site has an "Artesanal" filter / brand-name concept used as a proxy for handmade products. There is **no `Artesanal` row in the Brand Kit** — it's a synthetic bucket the front-end constructs by some other heuristic (likely a tag on Schema B Products). This is a data-modeling mismatch: the column meant to express this concept is empty, and the concept is computed elsewhere.

## Codebase says 11 columns, sheet has 10

In `app/lib/sheets/products-full.ts` the read range is `A:K` (11 columns). The `CC_Products_Full` sheet has data in `A:J` only (10 columns). Column K reads return `undefined`, which the code handles gracefully (the K-column field is treated as `null`) so nothing breaks — but this is silent code drift: at some point either the sheet had 11 columns or the code anticipated an 11th.

Practical consequence: any new column added to `CC_Products_Full` as column K will start populating that field in the code, possibly unintentionally. Worth tightening either by renaming the range to `A:J` or by adding the missing column intentionally.

## Cell-cap math, re-stated for clarity

(Cross-reference with [02](./02-data-layer.md).)

`CC_Products_Full`: 354,449 rows × 10 cols = **3,544,490 cells**, **35.4% of the 10M cap**. If the codebase's 11-column expectation were the actual shape, it would be 3,898,939 cells ≈ 39%. Either way, headroom is multiple-years at current growth rates *for this file*. The pressure is on the main CRM, not on the product catalog.

## Observability gap during this audit

The MCP tooling used for this audit truncates long Sheets reads at a token cap that landed inside the Products tab. As a result, **the live sampling above is bounded to the tabs that fit within that budget**:

- ✅ Direct sampling: `CC_Products_Full` (all of it via paginated reads), `Brand Kit`, CRM `Products` tab (partial).
- ❌ Could not directly sample: `Pipeline`, `Trade_Codes`, `Trade_Applications`, `Users`, `Reps`, `Posts`, `Activity_Log`, full `Customers`, full `Deals`.

For those tabs the findings in this baseline come from the **Dashboard walkthrough** ([04](./04-dashboard-state.md)) and from **code reads** ([02](./02-data-layer.md)) rather than from looking at the cells. They are correct in aggregate (the Dashboard renders real data) but they may miss the kind of row-level oddity (placeholder values, AI-Spanglish strings, empty-column patterns) that direct sampling caught for Products and Brand Kit. A future pass with a higher-budget Sheets reader should re-sample the bounded tabs and update this doc.

Sources: live Google Sheets reads on 2026-05-12 via MCP against fileIds `1iXG4A6bzrRSodbendoi-IVy6gi1cqiKbDado_bH7Yt0`, `1oEWZ1iBuyfo0RLEDanXZRwWkLwPnYT4Hyt6zQcfI_og`, `1CHIB3NX0kDSGx4sTulkYmzHn32-6yMtQ_dEqJrD9ZBs`; Drive metadata API for ownership flags; codebase audit of `app/lib/sheets/products-full.ts` for the column-count drift.
