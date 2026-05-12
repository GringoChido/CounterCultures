# [P3] Product Schema Reconciliation (A vs B)

> **Status:** PENDING · **Priority:** P3 · **Effort:** 2 days research + migration plan; weeks for full execution · **Branch:** `claude/fix-product-schemas`
> **Last updated:** 2026-05-12

## Why this matters
Counter Cultures currently maintains two parallel Products schemas that don't share IDs or SKUs. The same physical product (e.g., an Emtek lockset) lives in both schemas with different identifiers. This causes pricing bugs, cart-line mismatches, inventory miscounts, and broken cross-references in Pipeline/Deal_Line_Items. Until reconciled, every commerce feature carries a footnote: "which schema?" Reconciling unlocks single-source-of-truth product data and is a prerequisite to the database migration (P3) and trade-tier pricing (P3).

## The problem (evidence)
- Schema A: Odoo-style ids starting at `629192+`, SKUs like `EMTEK -  1L1A55CDLHTWB` (two spaces), placeholder $1 prices, source: `lib/products/odoo-mirror.ts`, sheet `Odoo_Products`.
- Schema B: Commerce ids starting at `1`, SKUs like `EMT-0001`, real MXN prices, includes `subcategory`, source: `lib/products/commerce.ts`, sheet `Products`.
- Both schemas reference Emtek but the same `1L1A55CDLHTWB` lockset is `id=629345 / SKU="EMTEK -  1L1A55CDLHTWB"` in A and `id=2841 / SKU="EMT-0142"` in B.
- `lib/products/products-full.ts:6` comment: `// near 10M cell cap; reconcile A/B before further growth`.
- `app/api/cart/*` defensively checks both schemas on every line.

## Scope
**In scope:**
- New `Product_Schema_Map` sheet: `schema_a_id | schema_b_id | shared_sku | brand | confidence | verified_by | notes`.
- Fuzzy-matcher script using brand + name + key spec fields (finish, dimensions, model code embedded in SKU).
- Manual verification UI in `/dashboard/products/reconcile` for borderline matches (confidence < 0.9).
- Migration plan document (separate from execution): proposed canonical id space, cutover sequence, rollback strategy.

**Out of scope:**
- Actual migration execution (gated on plan sign-off).
- Schema deduplication for non-Emtek brands lacking model codes in SKU (later phase).
- Updating Pipeline/Deal historical rows (forward-only for v1).

## Files to touch
- `scripts/products/reconcile-schemas.ts` — fuzzy matcher.
- `lib/products/reconcile/match.ts` — matching algorithm (Jaro-Winkler on names, token overlap on specs, model-code extraction from SKU).
- `lib/sheets/product-schema-map.ts` — new sheet adapter.
- `app/dashboard/products/reconcile/page.tsx` — verification UI with side-by-side rows + accept/reject buttons.
- `app/dashboard/products/reconcile/actions.ts` — server actions to write mappings.
- `docs/fixes/p3-product-schemas-migration-plan.md` — separate plan doc (created during this work).

## The fix (step by step)
1. Export both Products sheets to JSON; normalize SKUs (collapse whitespace, uppercase).
2. Run matcher: for each Schema A row, find best Schema B candidate within same brand using model-code extraction (e.g., `1L1A55CDLHTWB` appears in both). Score 0-1; auto-accept ≥0.95; queue 0.7-0.95 for manual review; reject <0.7.
3. Write candidates to `Product_Schema_Map` with `confidence` score and `verified_by = 'auto'` or `null`.
4. Build dashboard UI showing pending candidates; reviewer (Joshua or Javier) clicks accept/reject; accepted rows update `verified_by`.
5. Run on a top-100 sample first (highest-traffic SKUs by Pipeline appearance) to validate approach.
6. Produce migration plan doc covering: chosen canonical id space (Schema B preferred — has real prices + subcategory), cutover sequence (Cart -> Pipeline -> Deal_Line_Items -> Odoo_* mirrors -> Frontend reads), rollback, data-loss risk for unmatched rows.
7. Present plan to Roger + Joshua for sign-off before execution.

## Acceptance criteria
- [ ] `Product_Schema_Map` exists with ≥1000 rows.
- [ ] Top-100 SKUs by Pipeline volume are 100% mapped and verified.
- [ ] Dashboard reconcile UI works end-to-end.
- [ ] Migration plan doc signed off by Roger + Joshua.
- [ ] No production code change executes the migration yet — that's a separate ticket.

## Verification
```bash
pnpm tsx scripts/products/reconcile-schemas.ts --report
```
Expected: "Auto-matched: N | Manual queue: M | Unmatched: U | Top-100 coverage: 100/100"

## Dependencies
**Requires:** none
**Blocks:** P3 database migration, single canonical PDP, accurate inventory rollups

## Notes
- Reference: `lib/products/products-full.ts:6` comment.
- The 10M cell cap warning means we cannot grow Products by another full mirror — reconciliation is the cap-relief path.
- Roger has historical context on why two schemas exist (Odoo import predated the commerce schema build).
