# [P2] Sheets Optimistic Locking & Idempotency

> **Status:** PENDING · **Priority:** P2 · **Effort:** 1 day · **Branch:** `claude/fix-sheets-race-conditions`
> **Last updated:** 2026-05-12

## Why this matters
Sheets writes today have no optimistic locking. Two reps moving the same Pipeline row concurrently silently overwrite each other — first writer wins, second writer's change is lost without a trace. `AppendRow` is atomic but not idempotent: a retried client (timeouts, double-tap) appends duplicate rows. Both bugs corrupt data the business runs on.

## The problem (evidence)
- Sales rep concurrency: pipeline drift cases identified in audit — same row updated by two people, only one mutation survives.
- Cart submission: occasional duplicate `cart_submitted` rows on flaky connections.
- No `version` column on any sheet today.
- No `idempotency_key` column on cart writes.

## Scope
**In scope:**
- Add `version` (integer) column on critical sheet rows: `CC_Pipeline`, `Deal_Line_Items`, `Customers`, `Trade_Codes`.
- Update flow: read row + version, write with `If-Match: <version>` semantics (compare before write inside a single batched read+write transaction). Reject mismatches with a UI-recoverable "row changed, refresh and retry" error.
- Add `idempotency_key` column on `Cart_Sessions` / `cart_submitted` writes; reject duplicates server-side.
- Surface conflict errors gracefully in the UI (toast + auto-refresh).

**Out of scope:**
- Migrating off Google Sheets (separate strategic effort).
- Pessimistic locking — we want optimistic only.

## Files to touch
- `app/lib/sheets-client.ts` (add `updateWithVersion`, `appendIdempotent`)
- `app/lib/pipeline-mutations.ts`
- `app/lib/deal-line-items.ts`
- `app/lib/customers.ts`
- `app/lib/trade-codes.ts`
- `app/lib/cart/submit.ts` (idempotency)
- Sheet schemas: add `version` column on the 4 sheets, `idempotency_key` on `Cart_Sessions`
- UI: `app/(dashboard)/dashboard/pipeline/components/row-editor.tsx` (handle 409)
- `app/components/ui/conflict-toast.tsx` (new)

## The fix (step by step)
1. Add `version` column to each of the 4 sheets (default existing rows to `1`).
2. Build `updateWithVersion(sheet, rowId, patch, expectedVersion)`: reads current row, compares `version`, bumps to `expectedVersion + 1` and writes. Returns `{ok: true, version: n}` or `{ok: false, error: 'conflict', currentVersion: m}`.
3. Wire every mutation path through `updateWithVersion` instead of raw writes.
4. Build `appendIdempotent(sheet, row, idempotencyKey)`: scans recent rows (last N or via key index) for the key; skips append if found.
5. Cart submit generates a UUID per attempt (client-side, persisted in form state) → passes as `idempotency_key`.
6. In the pipeline UI, catch the conflict error and show `<ConflictToast />` with a Refresh button.
7. Add tests simulating concurrent writes (two parallel `updateWithVersion` calls with same expected version → exactly one wins).

## Acceptance criteria
- [ ] Concurrent pipeline edits: exactly one wins, the other shows conflict toast.
- [ ] Duplicate cart submit (same idempotency key) results in a single row.
- [ ] Version column increments correctly on every update.
- [ ] No breakage of existing single-writer flows.
- [ ] Concurrency test in CI passes.

## Verification
```bash
npm test -- sheets-concurrency
```
Expected: tests for parallel update and duplicate append both pass.

## Dependencies
**Requires:** none.
**Blocks:** none.

## Notes
See `docs/commerce/CART-RULES.md` for the cart submit lifecycle, and `docs/commerce/LIFECYCLE-STATE-MACHINE.md` for pipeline stage transitions — both need to flow through the new versioned mutation path. Audit any cron jobs that touch the four sheets and update them too (they should pass a current version, not blind-write).
