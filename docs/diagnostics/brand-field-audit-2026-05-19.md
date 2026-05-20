# Brand Field Data-Quality Audit

> Generated 2026-05-19 (data pulled 2026-05-20T03:19Z).
> Read-only diagnostic — no data was modified.

---

## 1. Executive summary

The brand-field problem is **small in scope but real**. Of 354,449 product rows in `CC_Products_Full`, **99.5% carry a recognized manufacturer brand**. Only **1,928 products (0.5%)** have brand strings that don't match the Brand Kit or BRANDS constant. Within those, the customer-visible junk is concentrated in a handful of values — roughly **~110 saleable products** carry a brand string that is clearly not a manufacturer. This is a **"fix in an afternoon" problem**, not a Week-2 project.

The Amazon shower-curtain rod that triggered this investigation is one of 19 products branded "Amazon." The larger unrecognized bucket is dominated by two classes: (a) CC's own artisan/sourcing lines (`Counter / Santiago`, `Counter / Gaby- Cobre`, `Counter/Meza`, etc. — 481 products total) which may be intentional internal brands, and (b) legitimate manufacturers not yet added to the Brand Kit (Waterworks, WarmlyYours, Phylrich, etc.).

---

## 2. Scope of data

| Metric | Count |
|---|---|
| Total rows in CC_Products_Full | 354,449 |
| All active (`active=true`) | 354,449 (100%) |
| All sale_ok (`sale_ok=true`) | 354,380 (99.98%) |
| Active AND sale_ok | 354,380 |
| Distinct brand strings | 160 |
| Brand Kit entries | 168 |
| BRANDS constant entries | 17 |

**Note:** Effectively all rows are `active=true` and nearly all are `sale_ok=true`. The `active` flag is not filtering anything meaningful in this dataset. The 69 non-saleable rows are spread across a few brands.

---

## 3. Top 50 brands by product count

| # | Brand | Total | Saleable | Zero-price | Recognized? |
|---|---|---|---|---|---|
| 1 | Emtek | 326,020 | 326,020 | 50 | Yes |
| 2 | Delta | 12,413 | 12,413 | 21 | Yes |
| 3 | Brizo | 7,913 | 7,913 | 8 | Yes |
| 4 | California Faucets | 3,756 | 3,756 | 227 | Yes |
| 5 | Peerless | 962 | 962 | 0 | Yes |
| 6 | **JCR** | **810** | **810** | 21 | **No** |
| 7 | Kohler | 257 | 256 | 115 | Yes |
| 8 | **Counter / Santiago** | **245** | **245** | 38 | **No** |
| 9 | Toto | 178 | 178 | 33 | Yes |
| 10 | **Counter / Gaby- Cobre** | **174** | **174** | 49 | **No** |
| 11 | Sun Valley Bronze | 173 | 173 | 50 | Yes |
| 12 | Kingston Brass | 142 | 142 | 34 | Yes |
| 13 | **All** | **129** | **101** | 44 | **No** |
| 14 | Ebbe | 106 | 106 | 0 | Yes |
| 15 | Baldwin | 55 | 55 | 19 | Yes |
| 16 | **Waterworks** | **52** | **52** | 0 | **No** |
| 17 | **CRL** | **46** | **46** | 27 | **No** |
| 18 | AQUASPA | 45 | 45 | 14 | Yes |
| 19 | **Build** | **42** | **42** | 25 | **No** |
| 20 | TEKA | 40 | 40 | 13 | Yes |
| 21 | Watermark | 39 | 39 | 25 | Yes |
| 22 | **Operating expenses** | **37** | **3** | 2 | **No** |
| 23 | Dornbracht | 37 | 37 | 10 | Yes |
| 24 | Blanco | 36 | 36 | 21 | Yes |
| 25 | Rohl | 34 | 34 | 15 | Yes |
| 26 | **Counter** | **31** | **31** | 3 | **No** |
| 27 | Rocky Mountain Hardware | 30 | 30 | 6 | Yes |
| 28 | Badeloft | 28 | 28 | 9 | Yes |
| 29 | **Counter/Meza** | **28** | **28** | 8 | **No** |
| 30 | Signature Hardware | 26 | 26 | 5 | Yes |
| 31 | Hansgrohe | 23 | 23 | 6 | Yes |
| 32 | **Build / Kingston Brass** | **22** | **22** | 7 | **No** |
| 33 | Elkay | 20 | 20 | 9 | Yes |
| 34 | MISENO | 19 | 19 | 8 | Yes |
| 35 | **Amazon** | **19** | **19** | 2 | **No** |
| 36 | RUVATI | 19 | 19 | 4 | Yes |
| 37 | DURAVIT | 18 | 18 | 5 | Yes |
| 38 | **WarmlyYours** | **18** | **18** | 6 | **No** |
| 39 | **V&B** | **17** | **17** | 3 | **No** |
| 40 | Deltana | 14 | 14 | 6 | Yes |
| 41 | **VIKING** | **13** | **13** | 11 | **No** |
| 42 | Moen | 12 | 12 | 3 | Yes |
| 43 | BLUESTAR | 12 | 12 | 7 | Yes |
| 44 | **PHYLRICH** | **11** | **11** | 4 | **No** |
| 45 | **Nuheat** | **11** | **11** | 7 | **No** |
| 46 | **Mistoa** | **10** | **10** | 2 | **No** |
| 47 | Grohe | 10 | 10 | 6 | Yes |
| 48 | Axor | 8 | 8 | 8 | Yes |
| 49 | Infinity Drain | 8 | 8 | 4 | Yes |
| 50 | **Un Rayito de Sol** | **8** | **8** | 1 | **No** |

---

## 4. Recognized vs. unrecognized breakdown

| Bucket | Distinct brands | Total products | Saleable products |
|---|---|---|---|
| Recognized (in Brand Kit or BRANDS) | 55 | 352,521 | 352,520 |
| Unrecognized | 105 | 1,928 | 1,860 |
| **Total** | **160** | **354,449** | **354,380** |

The 168-brand Brand Kit contains many brands that have zero products in the catalog (stocked brands with no Odoo product records yet, or brands added to the kit in anticipation of future inventory). Only 55 of the 168 have matching product rows.

---

## 5. Flagged non-manufacturer values

### 5a. Retailers / marketplaces

| Brand string | Total | Saleable | Zero-price (saleable) | Notes |
|---|---|---|---|---|
| Amazon | 19 | 19 | 2 | Retailer, not manufacturer. This is the problem that triggered this audit. |
| Build | 42 | 42 | 25 | Likely build.com — a retailer, not a manufacturer. |
| Build / Kingston Brass | 22 | 22 | 7 | Hybrid: sourced from build.com, actual brand is Kingston Brass. |
| Build / Delta | 5 | 5 | 3 | Hybrid: sourced from build.com, actual brand is Delta. |
| AJ MADISSON | 1 | 1 | 1 | "AJ Madison" is a retailer. |
| quality bath | 1 | 1 | 1 | QualityBath.com is a retailer. |
| Lamp Plus | 1 | 1 | 1 | "Lamps Plus" is a retailer. |
| Lamps Plus | 1 | 1 | 1 | Retailer (duplicate spelling). |
| **Subtotal** | **92** | **92** | **41** | |

### 5b. Accounting / non-product categories

| Brand string | Total | Saleable | Zero-price (saleable) | Notes |
|---|---|---|---|---|
| All | 129 | 101 | 44 | Odoo catch-all bucket, not a brand. |
| Operating expenses | 37 | 3 | 2 | Accounting category mistakenly in product catalog. |
| All / Expenses | 3 | 2 | 1 | Accounting category. |
| All / Saleable / Booking Fees | 1 | 1 | 0 | Accounting/service line. |
| service | 1 | 1 | 0 | Service item, not a product brand. |
| Commercial | 2 | 2 | 0 | Ambiguous — could be a category, not a manufacturer. |
| Personal | 1 | 0 | 0 | Not a brand (not saleable). |
| IMP-02 | 4 | 0 | 0 | Looks like an import batch code, not a brand (not saleable). |
| **Subtotal** | **178** | **110** | **47** | |

### 5c. Miscellaneous non-brands

| Brand string | Total | Saleable | Zero-price (saleable) | Notes |
|---|---|---|---|---|
| MISC | 2 | 2 | 1 | Generic placeholder. |
| **Subtotal** | **2** | **2** | **1** | |

### 5d. CC internal artisan / sourcing lines (ambiguous — may be intentional)

These use a `Counter / <artisan>` pattern and likely represent CC's own curated artisan products. They are not "junk" per se — but they don't map to a Brand Kit entry, so they render as raw strings to customers. **Roger should decide whether these should be formalized in the Brand Kit or mapped to a CC house brand.**

| Brand string | Total | Saleable | Zero-price (saleable) | Notes |
|---|---|---|---|---|
| Counter / Santiago | 245 | 245 | 38 | |
| Counter / Gaby- Cobre | 174 | 174 | 49 | |
| Counter | 31 | 31 | 3 | |
| Counter/Meza | 28 | 28 | 8 | |
| COUNTER/CHINA | 3 | 3 | 0 | |
| gaby | 1 | 1 | 1 | Likely short for "Gaby-Cobre" artisan. |
| cobuild | 1 | 1 | 0 | Unknown. |
| coobuild | 1 | 1 | 0 | Likely typo of "cobuild". |
| independencia | 1 | 1 | 0 | Artisan/source name. |
| mosaico steven | 1 | 1 | 0 | Tile artisan name. |
| **Subtotal** | **486** | **486** | **99** | |

### 5e. Abbreviations / misspellings of recognized brands

| Brand string | Likely intended brand | Total | Saleable | Notes |
|---|---|---|---|---|
| V&B | Villeroy & Boch | 17 | 17 | Abbreviation. |
| SVB | Sun Valley Bronze | 2 | 2 | Abbreviation. |
| CALIFIORNIA | California Faucets | 3 | 3 | Typo. |
| RUBATI | Ruvati | 1 | 1 | Typo. |
| NAMEEK'S | Nameeks | 3 | 3 | Punctuation variant. |
| Watermarkfixtures | Watermark | 5 | 5 | Different name for same brand. |
| Inifinity Drains | Infinity Drain | 1 | 1 | Typo. |
| HOUSE ROHL | Rohl | 1 | 1 | Prefixed variant. |
| Original Misson Tile | Original Mission Tile | 7 | 7 | Typo ("Misson"). |
| **Subtotal** | **40** | **40** | |

### 5f. Legitimate manufacturers not in Brand Kit

These are real brands that simply haven't been added to the 168-brand Brand Kit sheet yet.

| Brand string | Total | Saleable | Zero-price (saleable) | Notes |
|---|---|---|---|---|
| JCR | 810 | 810 | 21 | Mexican hardware manufacturer. |
| Waterworks | 52 | 52 | 0 | Luxury bath brand. |
| CRL | 46 | 46 | 27 | C.R. Laurence — glass/glazing hardware. |
| WarmlyYours | 18 | 18 | 6 | Radiant floor heating. |
| VIKING | 13 | 13 | 11 | Viking Range — appliances. |
| PHYLRICH | 11 | 11 | 4 | Luxury faucets. |
| Nuheat | 11 | 11 | 7 | Radiant floor heating. |
| Mistoa | 10 | 10 | 2 | Mexican artisan brand. |
| Un Rayito de Sol | 8 | 8 | 1 | Mexican artisan brand. |
| Westbrass | 7 | 7 | 1 | Plumbing accessories. |
| Insinkerator | 7 | 7 | 1 | Garbage disposals. |
| Gatco | 7 | 7 | 2 | Bath accessories. |
| MTI | 7 | 7 | 6 | MTI Baths (in Brand Kit as "MTI Baths"). |
| BARCLAY | 6 | 6 | 2 | Plumbing fixtures. |
| Thermador | 6 | 6 | 6 | Luxury appliances. |
| Outdoor Shower Co. | 5 | 5 | 2 | Specialty showers. |
| Sonoma Forge | 4 | 4 | 0 | Luxury faucets. |
| SUKABUMI | 4 | 4 | 0 | In Brand Kit as "Sukabumi Stone Mexico" (name mismatch). |
| Mountain Plumbing | 4 | 4 | 0 | Plumbing accessories. |
| SUBZERO | 4 | 4 | 4 | Sub-Zero — luxury refrigeration. |
| Trade Winds | 4 | 4 | 1 | Ventilation/bath. |
| Bobrick | 4 | 4 | 4 | Commercial washroom accessories. |
| Liebherr | 4 | 4 | 1 | Luxury refrigeration. |
| Victoria + Albert | 3 | 3 | 0 | In Brand Kit as "Victoria & Albert" (punctuation mismatch). |
| WATCO | 3 | 3 | 0 | Drain products. |
| Helvex | 3 | 3 | 0 | Mexican plumbing manufacturer. |
| DACOR | 3 | 3 | 3 | Luxury appliances. |
| LG | 3 | 3 | 2 | Consumer electronics/appliances. |
| Accurate | 3 | 3 | 0 | Lock hardware. |
| + ~30 more at 1-2 products each | ~40 | ~40 | ~15 | |
| **Subtotal** | **~1,130** | **~1,090** | | |

---

## 6. Price cross-tab: flagged non-brands with zero price

Focusing on the clearly-not-a-manufacturer values (sections 5a + 5b + 5c):

| Category | Saleable products | Zero-price saleable | % zero-price |
|---|---|---|---|
| Retailers (5a) | 92 | 41 | 45% |
| Accounting/non-product (5b) | 110 | 47 | 43% |
| MISC (5c) | 2 | 1 | 50% |
| **Total flagged junk** | **204** | **89** | **44%** |

Nearly half of the junk-branded saleable products also have zero price. These products would show **both** a nonsensical brand AND a missing price to customers — the worst possible combination for the cart/checkout experience. However, the zero-price products already get the "Request a quote" treatment via existing UI logic, so the price gap is partially mitigated.

---

## 7. Scope assessment

### How many saleable products show a junk brand today?

| Class | Saleable count | Action |
|---|---|---|
| **Clear junk** (retailers + accounting + MISC) | **~110** | Fix in Odoo: reassign to actual manufacturer or mark `sale_ok=false` |
| **Retailer hybrids** (Build/Kingston Brass, Build/Delta) | **~27** | Fix in Odoo: extract the real brand from the compound string |
| **Misspellings/abbreviations** | **~40** | Fix in Odoo: correct to canonical brand name |
| **CC artisan lines** (Counter/X) | **~486** | Decision needed: formalize as Brand Kit entries or create "Counter Cultures" house brand |
| **Legitimate brands not in Kit** | **~1,090** | Add to Brand Kit, or accept they render without brand-page context |

### Bottom line

- **~110 products** show genuinely wrong brands to customers (Amazon, Build, All, Operating expenses, etc.). These need source-data cleanup in Odoo.
- **~40 products** are misspellings of known brands. Quick Odoo fix.
- **~486 products** are CC's own artisan lines. Not "junk" but need a branding decision.
- **~1,090 products** are legitimate manufacturers not in the Brand Kit. Low urgency — they display correctly on PDPs, just lack brand-page integration.

### Is this "fix in an afternoon" or a "Week-2 project"?

**Fix in an afternoon.** The hard cleanup is ~150 rows across ~15 brand strings. The misspelling fixes are another ~40 rows across ~9 strings. Both are Odoo brand-field edits, not code changes. The artisan-line decision and Brand Kit expansion are separate, non-urgent conversations.

**No code change or display guard is needed** for launch — the problem affects 0.03% of the saleable catalog by product count. A simple Odoo data-entry cleanup resolves it.

---

## 8. Distinct junk values needing cleanup (action list)

These 15 brand strings should be corrected at the Odoo source:

| # | Current value | Products | Suggested action |
|---|---|---|---|
| 1 | Amazon | 19 | Identify actual manufacturer, reassign |
| 2 | Build | 42 | Identify actual manufacturer, reassign |
| 3 | Build / Kingston Brass | 22 | Change to "Kingston Brass" |
| 4 | Build / Delta | 5 | Change to "Delta" |
| 5 | All | 129 | Identify real brands or mark `sale_ok=false` |
| 6 | All / Expenses | 3 | Mark `sale_ok=false` |
| 7 | All / Saleable / Booking Fees | 1 | Mark `sale_ok=false` |
| 8 | Operating expenses | 37 | Mark `sale_ok=false` (34 already are) |
| 9 | service | 1 | Mark `sale_ok=false` |
| 10 | MISC | 2 | Identify actual manufacturer, reassign |
| 11 | Commercial | 2 | Identify actual manufacturer or mark non-saleable |
| 12 | AJ MADISSON | 1 | Identify actual manufacturer, reassign |
| 13 | quality bath | 1 | Identify actual manufacturer, reassign |
| 14 | Lamp Plus | 1 | Identify actual manufacturer, reassign |
| 15 | Lamps Plus | 1 | Identify actual manufacturer, reassign |

Plus 9 misspelling/abbreviation fixes:

| # | Current value | Products | Correct to |
|---|---|---|---|
| 1 | V&B | 17 | Villeroy & Boch |
| 2 | SVB | 2 | Sun Valley Bronze |
| 3 | CALIFIORNIA | 3 | California Faucets |
| 4 | RUBATI | 1 | Ruvati |
| 5 | NAMEEK'S | 3 | Nameeks |
| 6 | Watermarkfixtures | 5 | Watermark |
| 7 | Inifinity Drains | 1 | Infinity Drain |
| 8 | HOUSE ROHL | 1 | Rohl |
| 9 | Original Misson Tile | 7 | Original Mission Tile |

**Total rows to touch: ~310 (across 24 distinct brand strings).**

---

## 9. Raw data reference

Full JSON output from the audit script is at `/tmp/brand-audit-output.json` (ephemeral — will not survive reboot). The audit script is at `scripts/brand-field-audit.mjs`.

---

## 10. Phase B — Surgical investigation (2026-05-19)

### Discovery: "brand" = Odoo `categ_id`

The sheet's "brand" column is populated from `product.template.categ_id`, a **many2one relational field** pointing to `product.category`. There is no dedicated brand field in Odoo. When the sheet says brand = "Amazon," it means the product's `categ_id` points to a category named "Amazon."

This means "fixing the brand" = reassigning `categ_id` in Odoo. That is a write to a relational field that carries downstream implications.

### Gate 1 — Category routing coupling: CLEAR

The site's browsing category (bathroom / kitchen / hardware) comes from a **separate** column in CC_Products_Full (column index 4), mapped by `normalizeCategory()` in `products-full.ts:186-189`. It does NOT read from `categ_id`.

**Verdict:** Changing `categ_id` in Odoo will NOT affect site URLs, catalog filters, or browsing categories.

### Gate 2 — Accounting/valuation coupling: FAILED

Every `product.category` record carries full accounting configuration:

- `property_account_income_categ_id` (income account)
- `property_account_expense_categ_id` (expense account)
- `property_stock_account_input_categ_id` / `_output_categ_id` (stock valuation)
- `property_cost_method` (costing method)
- `property_valuation` (valuation type)
- `removal_strategy` (inventory removal)

**Critical difference:** Some junk categories use expense account **501.01.01 (Costo de venta / COGS)** while canonical brand categories use **601.10.01 (Otros gastos generales)**. Reassigning `categ_id` would change which expense account applies to affected products.

Per `CLAUDE-FINANCE-RULES.md`, this is a finance-affecting change. It cannot proceed without Antonina's review.

**Verdict:** Odoo `categ_id` reassignment is blocked until accounting implications are cleared with finance.

### Inference pass results

Sampled all ~314 products across 15 junk categories. Only **9 products** had manufacturer names inferable from their product name or SKU:

| Source category | Product ID | Inferred brand |
|---|---|---|
| Amazon | 2046800 | Kohler |
| Amazon | 2047946 | Delta |
| Build | 2047517 | Kingston Brass |
| Build | 2047564 | Moen |
| Build | 2047960 | Kohler |
| Build | 2048108 | Blanco |
| All | 2048671 | Sun Valley Bronze |
| All | 2048769 | Emtek |
| All | 2048923 | Delta |

The remaining ~305 products are either (a) genuinely unattributable hardware parts, (b) accounting/service line items, or (c) CC artisan products.

### Canonical target category IDs

| Target brand | Odoo category ID | Match type |
|---|---|---|
| California Faucets | 5 | exact |
| Villeroy & Boch | 45 | exact |
| Sun Valley Bronze | 51 | exact |
| Infinity Drain | 65 | exact |
| Ruvati | 97 | case match ("RUVATI") |
| Rohl | 55 | exact |
| Watermark | 115 | exact |
| Kingston Brass | 32 | exact |
| Delta | 37 | exact |
| Kohler | 30 | exact |
| Emtek | 6 | exact |
| Baldwin | 7 | exact |
| Brizo | 29 | exact |
| **Nameeks** | — | **NOT FOUND** |
| **Original Mission Tile** | — | **NOT FOUND** |

### Misspelling source → target mapping

| Misspelled category (ID) | Canonical target (ID) |
|---|---|
| V&B (27) | Villeroy & Boch (45) |
| SVB (16) | Sun Valley Bronze (51) |
| CALIFIORNIA (95) | California Faucets (5) |
| RUBATI (159) | Ruvati (97) |
| NAMEEK'S (144) | Nameeks (—) |
| Watermarkfixtures (177) | Watermark (115) |
| Inifinity Drains (135) | Infinity Drain (65) |
| HOUSE ROHL (167) | Rohl (55) |
| Original Misson Tile (171) | Original Mission Tile (—) |

---

## 11. Recommendation: Option B — Display-layer normalization map

**Gate 2 failed.** Odoo `categ_id` reassignment changes expense accounts and is blocked until finance reviews. We recommend **Option B: a display-layer normalization map** in `products-full.ts` that translates junk category names to correct brand display names at read time, without touching Odoo.

### How it works

A `BRAND_DISPLAY_MAP` in `products-full.ts` intercepts the raw brand string at line 245 and normalizes it before the `ProductFull` object is constructed. Odoo data stays untouched. The map covers three cases:

**Case 1 — Misspelling/abbreviation → canonical brand name:**

```
"V&B"                → "Villeroy & Boch"
"SVB"                → "Sun Valley Bronze"
"CALIFIORNIA"        → "California Faucets"
"RUBATI"             → "Ruvati"
"NAMEEK´S"           → "Nameeks"
"Watermarkfixtures"  → "Watermark"
"Inifinity Drains"   → "Infinity Drain"
"HOUSE ROHL"         → "Rohl"
"Original Misson Tile" → "Original Mission Tile"
```

**Case 2 — Retailer hybrid → extract real brand:**

```
"Build / Kingston Brass" → "Kingston Brass"
"Build / Delta"          → "Delta"
```

**Case 3 — Junk/retailer/accounting → blank (empty string):**

```
"Amazon"                      → ""
"Build"                       → ""
"All"                         → ""
"All / Expenses"              → ""
"All / Saleable / Booking Fees" → ""
"Operating expenses"          → ""
"service"                     → ""
"MISC"                        → ""
"Commercial"                  → ""
"Personal"                    → ""
"IMP-02"                      → ""
"AJ MADISSON"                 → ""
"quality bath"                → ""
"Lamp Plus"                   → ""
"Lamps Plus"                  → ""
```

### What this fixes

- 40 products with misspelled brands now display their correct canonical brand name.
- 27 products with "Build / X" hybrids now display the real manufacturer.
- ~147 products with retailer/accounting/junk brands now display a blank brand instead of a misleading one.
- PDP is already guarded against blank brands. ProductCard needs a guard added (shows empty line today).
- No Odoo data modified. No accounting implications. No finance review required.
- Fully reversible — delete the map and you're back to raw Odoo values.

### What this does NOT fix

- The underlying Odoo data quality (products still in wrong categories).
- The 9 inferable-but-unknown products (Kohler in Amazon, Moen in Build, etc.) — these would need manual product-by-product review with Roger.
- CC artisan lines (Counter/Santiago, etc.) — separate branding decision, out of scope.
- Legitimate manufacturers not in Brand Kit (~1,090 products) — separate Brand Kit expansion task.

### Future: Odoo cleanup (Phase C, deferred)

Once Antonina reviews the accounting implications, a future session can:
1. Align expense accounts between junk and canonical categories (or confirm the difference is intentional).
2. Reassign `categ_id` for the 9 inferable products to their correct manufacturer category.
3. Mark pure accounting/service items as `sale_ok=false` to remove them from the product catalog entirely.

This is a separate scope requiring finance sign-off per `CLAUDE-FINANCE-RULES.md`.

---

## 12. Execution plan (awaiting approval)

**Scope:** Add `BRAND_DISPLAY_MAP` to `products-full.ts`. One code change, one file.

**Steps:**
1. Add the normalization map (Record<string, string>) near the top of `products-full.ts`.
2. Apply the map at line 245 where `brand` is read: `const brand = BRAND_DISPLAY_MAP[rawBrand] ?? rawBrand`.
3. Add a blank-brand guard to `ProductCard` (match PDP's existing guard).
4. Verify via dev server that affected products now display correctly.

**Not in scope:** Odoo writes, Brand Kit changes, artisan-line decisions, sale_ok changes.

**Awaiting Joshua's explicit "execute" before any code changes.**

---

*Phase B investigation performed by Claude Code. No product data, code, or Odoo records were modified.*
