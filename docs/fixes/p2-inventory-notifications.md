# [P2] Inventory Low/OOS Notification Engine

> **Status:** PENDING · **Priority:** P2 · **Effort:** 1 day · **Branch:** `claude/fix-inventory-notifications`
> **Last updated:** 2026-05-12

## Why this matters
Inventory currently tracks 796 SKUs: 519 low + 252 OOS — and nobody is proactively told. Antonia and Roger only learn about a stockout when a customer can't check out, or when Javier/Ian flag it manually. The data is sitting right there; surfacing it daily turns a reactive problem into a planned reorder cadence.

## The problem (evidence)
- `CC_Inventory` tab: 519 rows where `qty_on_hand < reorder_threshold`, 252 with `qty_on_hand = 0`.
- No daily digest cron exists.
- `/dashboard/today` "Needs You" panel has no inventory card type.

## Scope
**In scope:**
- Daily cron at 07:00 CDMX emitting an inventory digest email to Roger + Antonia.
- Digest groups: newly-OOS (since last digest), newly-low (since last digest), persistent-low (>14d).
- "Stock running low" card on `/dashboard/today` Needs You panel.
- Mark inventory rows with `last_notified_at` to avoid spamming.

**Out of scope:**
- Automatic PO generation (separate workflow).
- Per-rep notifications — start with Roger + Antonia only.

## Files to touch
- `app/api/cron/inventory-digest/route.ts` (new)
- `app/lib/email/templates/inventory-digest.tsx` (new)
- `app/lib/inventory/queries.ts` (add `getNewlyLow`, `getNewlyOOS`, `getPersistentLow`)
- `app/(dashboard)/dashboard/today/components/inventory-alerts-card.tsx` (new)
- `netlify.toml` (cron schedule entry)

## The fix (step by step)
1. In `inventory/queries.ts`, add three query helpers that compare current `qty_on_hand` against `last_notified_qty` to determine the "newly" buckets.
2. Build the cron route: assemble the three buckets, render the Resend template (table per bucket, sorted by margin or velocity), send to Roger + Antonia.
3. After successful send, update `last_notified_at` and `last_notified_qty` on every included row.
4. Schedule the cron daily 07:00 CDMX in `netlify.toml`.
5. Build the dashboard card: top 5 newly-OOS items, link to `/dashboard/inventory?filter=oos`.
6. Add a manual "Mark reviewed" button that bumps the row's `last_notified_at`.

## Acceptance criteria
- [ ] Cron runs daily at 07:00 CDMX.
- [ ] Digest email arrives at Roger + Antonia inboxes with three sections.
- [ ] Rows that were already notified do not appear in subsequent digests unless they regress further.
- [ ] `/dashboard/today` Inventory Alerts card renders newly-OOS items with link to inventory page.
- [ ] No spurious notifications for SKUs intentionally discontinued (`status = discontinued` excluded).

## Verification
```bash
curl -X POST http://localhost:3000/api/cron/inventory-digest -H "x-cron-secret: $CRON_SECRET"
```
Expected: JSON `{ newlyOOS: n, newlyLow: n, persistentLow: n, emailSent: true }`.

## Dependencies
**Requires:** P1.1 (Resend integration).
**Blocks:** none.

## Notes
See `docs/commerce/COMMUNICATION-MATRIX.md` for who-gets-what defaults. Antonia (formerly Tonina in older docs — same person) handles inventory reorder approvals.
