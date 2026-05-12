# [P2] Test Data Pollution Cleanup

> **Status:** PENDING · **Priority:** P2 · **Effort:** 4 hrs · **Branch:** `claude/fix-test-data-cleanup`
> **Last updated:** 2026-05-12

## Why this matters
Production sheets are polluted with test data: 7 of 8 shipment rows are duplicate `E99-TEST` entries, and the Notifications feed contains dozens of `DEAL-__TEST_DEAL_W7_*` critical alerts. This breaks Roger's "is the business healthy?" glance at the dashboard, and trains the team to ignore the Needs You feed because most of it is fake.

## The problem (evidence)
- `CC_Shipments` tab: 7 of 8 rows have `shipment_id` starting `E99-TEST`.
- `CC_Notifications` tab: dozens of rows where `entity_id LIKE '%__TEST%'` and `severity = critical`.
- No env guard prevents dev runs from writing to prod sheet IDs.

## Scope
**In scope:**
- Delete test rows from `CC_Shipments` and `CC_Traficos` tabs.
- Filter the notification feed query to exclude `entity_id LIKE '%__TEST%'`.
- Add a dev-mode flag (`NODE_ENV !== 'production' && !ALLOW_PROD_SHEET_WRITES`) that throws if a write is attempted to the prod sheet ID.

**Out of scope:**
- Building a full test-sheet shadow environment (separate ticket).
- Backfilling lost notifications — the test ones were noise anyway.

## Files to touch
- `scripts/purge-test-data.ts` (new)
- `app/lib/notifications/feed.ts` (add filter)
- `app/lib/sheets-client.ts` (add dev-mode write guard)
- `app/lib/env.ts` (add `ALLOW_PROD_SHEET_WRITES` env var)
- `.env.example` (document the new flag)

## The fix (step by step)
1. Write `scripts/purge-test-data.ts` that:
   - Reads `CC_Shipments`, finds rows where `shipment_id LIKE 'E99-TEST%'`, deletes them.
   - Reads `CC_Traficos`, deletes corresponding `__TEST` rows.
   - Reads `CC_Notifications`, soft-deletes rows where `entity_id LIKE '%__TEST%'` (set `archived=true` rather than hard delete, so we can audit).
   - Logs deleted counts per tab.
2. Update `feed.ts` to filter out `archived=true` AND `entity_id LIKE '%__TEST%'` (belt + braces).
3. Add the write-guard in `sheets-client.ts`: if `process.env.NODE_ENV !== 'production'` AND the target spreadsheet ID matches the prod ID AND `ALLOW_PROD_SHEET_WRITES !== 'true'`, throw with a clear message.
4. Document in `.env.example`.
5. Run the purge script once in dry-run, review, then apply.

## Acceptance criteria
- [ ] `CC_Shipments` contains only real shipments.
- [ ] `CC_Traficos` contains no `__TEST` rows.
- [ ] `/dashboard/today` shows zero `__TEST` notifications.
- [ ] Running the test suite locally cannot accidentally write to the prod sheet.
- [ ] The guard error message is actionable ("set `ALLOW_PROD_SHEET_WRITES=true` if you really mean it").

## Verification
```bash
npm run script -- scripts/purge-test-data.ts --dry-run
```
Expected: prints row counts that would be deleted, writes nothing.

## Dependencies
**Requires:** none.
**Blocks:** none.

## Notes
See `AGENTS.md` for sheet-ID conventions. Be careful: the prod sheet ID also appears in some hard-coded test fixtures — search the repo and replace with a `TEST_SHEET_ID` env where relevant.
