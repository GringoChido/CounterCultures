# [P3] Database Migration: Google Sheets to Postgres (Research + Plan)

> **Status:** PENDING (research phase) · **Priority:** P3 · **Effort:** RESEARCH first; 2-4 weeks execution after sign-off · **Branch:** `claude/fix-database-migration`
> **Last updated:** 2026-05-12

## Why this matters
The main CRM Google Sheet is approaching the 10M cell cap per the comment in `lib/products/products-full.ts:6`. Beyond the hard cap, write contention, latency on multi-tab joins, and the lack of relational guarantees are already producing real bugs (race conditions in Cart_Sessions, inconsistent foreign keys in Deal_Line_Items). A real database is no longer optional — it's the next-12-month critical-path architectural change. This is a major change requiring explicit Roger + Joshua sign-off before any code lands.

## The problem (evidence)
- `lib/products/products-full.ts:6`: `// near 10M cell cap`.
- `lib/cart/persistence.ts`: defensive re-reads to mitigate Sheet write delay; intermittent ghost rows.
- `lib/sheets/queue.ts`: home-grown write queue throttling Sheets API to 60 writes/min — caps throughput.
- `app/api/pipeline/*`: latency p95 > 2s due to Sheet reads.
- Sheet tabs with >100k rows show editor lag and frequent timeout errors during batch writes.

## Scope
**In scope (this ticket = research + plan, not execution):**
- Choose Postgres host (Supabase vs Neon — compare pricing, MX latency, backup, branching).
- Postgres schema design mirroring Sheet schemas for high-growth tables: Pipeline, Activity_Log, Deal_Line_Items, Deal_Events, Cart_Sessions, Email_Activity, Whatsapp_Messages, Odoo_Products, Odoo_Stock, Odoo_Orders.
- Dual-write adapter design (writes to both Sheets and Postgres during transition).
- Read-cutover sequencing.
- Sheet-archive process.
- Risk register and rollback strategy.

**Out of scope:**
- Migrating low-growth reference tables (Users, Reps, Settings, Brand_Kit, Trade_Pricing) — stay in Sheets indefinitely.
- ORM choice deliberation — likely Drizzle (matches stack); Prisma if Drizzle proves limiting.
- Real-time sync to legacy spreadsheet consumers (Roger's personal dashboards).

## Files to touch (planning phase)
- `docs/fixes/p3-database-migration-research.md` — Supabase vs Neon decision matrix.
- `docs/fixes/p3-database-migration-schema.md` — proposed Postgres schema.
- `docs/fixes/p3-database-migration-cutover.md` — sequenced cutover plan with rollback gates.
- No production code touched in this phase.

## The fix (step by step)
1. **Research host options:** Compare Supabase (built-in auth/storage, MX presence via AWS São Paulo) vs Neon (branching, cold start). Score on latency-to-MX, MXN pricing, backup/PITR, connection pooling, branching for staging.
2. **Schema design:** For each high-growth table, propose Postgres DDL with proper types, foreign keys, indexes (esp. on `created_at`, `customer_id`, `product_id`). Replace stringly-typed Sheet enums with proper enum types.
3. **Dual-write adapter:** Design `lib/db/adapter.ts` that, for each migrated table, writes to both Postgres (primary) and Sheets (mirror) for a 4-week transition. Reads gradually flip from Sheets to Postgres table-by-table.
4. **Cutover sequence:** Propose order — Cart_Sessions first (highest write contention, smallest blast radius if rollback), then Activity_Log, Email_Activity, Whatsapp_Messages, Deal_Events, Pipeline, Deal_Line_Items, Odoo mirrors last (largest, most foreign keys).
5. **Rollback strategy:** Each table's cutover is gated on a "Sheets still in sync" assertion job that compares row counts + recent rows daily.
6. **Sheet archive:** Once a table is fully cut over, the Sheet tab is renamed `_ARCHIVED_<date>_<tab>` and made read-only.
7. **Sign-off meeting:** Present plan + risks + cost projection to Roger + Joshua. No code merges until written sign-off in this doc's frontmatter.

## Acceptance criteria
- [ ] Research doc selects a host with rationale.
- [ ] Schema doc covers all 9 high-growth tables with DDL.
- [ ] Cutover doc has per-table sequence, rollback gates, sync-verification checks.
- [ ] Cost projection for first 12 months in MXN.
- [ ] Roger + Joshua sign-off recorded.

## Verification
```bash
ls docs/fixes/p3-database-migration-*.md
```
Expected: three planning docs present.

## Dependencies
**Requires:** P3 product-schema reconciliation (so Odoo mirror migrates against a canonical id space)
**Blocks:** further growth in Pipeline + Activity_Log; real-time dashboards

## Notes
- Reference: `lib/products/products-full.ts:6`.
- DO NOT START EXECUTION before sign-off. This is a high-blast-radius change.
- Antonia and Sales (Javier, Ian) currently inspect Sheets directly during the day — the archive step must preserve read access via the Sheet's read-only mirror, or replace with a dashboard read-out before archiving.
