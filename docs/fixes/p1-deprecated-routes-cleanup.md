# [P1] Deprecated Routes Cleanup — Delete Dead Endpoints

> **Status:** PENDING · **Priority:** P1 · **Effort:** 2 hrs · **Branch:** `claude/fix-deprecated-routes-cleanup`
> **Last updated:** 2026-05-12

## Why this matters
Three concurrent and explicitly-deprecated route implementations sit in the codebase, totaling ~357 lines of dead code. They're not just dead weight — they're hazards. Future agents reading the codebase get confused about which checkout path is canonical, security audits flag the duplicates as attack surface, and the deprecated routes still respond 200 to clients that haven't migrated, masking the fact that something is using the old path. Deleting them is a 2-hour task with high information value: the codebase becomes self-documenting about what's current.

## The problem (evidence)
- `app/api/checkout/buy/route.ts` — 179 lines, top-of-file comment says `// DEPRECATED — use /api/checkout/submit`.
- `app/api/checkout/submit/route.ts` — current canonical path.
- `app/api/stripe/checkout/route.ts` — 73 lines, marked `// DEPRECATED`.
- `app/api/stripe/payment-intent/route.ts` — current canonical Stripe path.
- `app/api/dashboard/ar-requests/scan/route.ts` — 105 lines, marked `// DEPRECATED — old Gmail subject scanner, replaced by event-driven flow`.

## Scope
**In scope:**
- Verify no live callers of the deprecated routes via grep + log search.
- Delete the three route files.
- Update any client code still referencing them.
- Add a one-line history note to `docs/architecture/deprecated-routes.md` so future engineers know what was removed and why.

**Out of scope:**
- Wholesale dead-code audit of the whole repo.
- API versioning scheme rollout (P3).

## Files to touch
- DELETE `app/api/checkout/buy/route.ts`.
- DELETE `app/api/stripe/checkout/route.ts`.
- DELETE `app/api/dashboard/ar-requests/scan/route.ts`.
- New `docs/architecture/deprecated-routes.md` — historical note (~10 lines per removed route).
- Possibly update: `app/components/CheckoutButton.tsx`, `app/lib/checkout.ts`, anything still importing the old paths.

## The fix (step by step)
1. **Grep for callers**:
   ```bash
   grep -rn "api/checkout/buy" app/ docs/
   grep -rn "api/stripe/checkout" app/ docs/
   grep -rn "api/dashboard/ar-requests/scan" app/ docs/
   ```
   For each match outside the route file itself, decide:
   - If it's a client-side `fetch(...)`: update to the current path.
   - If it's a doc/README mention: update or delete.
   - If it's a comment in another route: leave or update for accuracy.
2. **Check Netlify logs** (last 7 days) for hits on each deprecated path:
   ```bash
   # In Netlify dashboard, Functions tab, filter logs for the path
   ```
   If any production traffic in the last 7 days → investigate before deleting. If zero → safe to delete.
3. **Delete the files.** Standard `git rm`.
4. **Update callers** identified in step 1:
   - `/api/checkout/buy` callers → `/api/checkout/submit` (signatures should match; if they diverge, add an adapter shim in the caller).
   - `/api/stripe/checkout` callers → `/api/stripe/payment-intent`.
   - `/api/dashboard/ar-requests/scan` callers → the event-driven flow (likely no client callers since it was a cron-style scanner).
5. **Run the full build** to catch any TypeScript references the grep missed:
   ```bash
   npm run build
   ```
6. **Smoke test** the canonical paths still work:
   - Place a test order via `/api/checkout/submit`.
   - Create a test Stripe PaymentIntent via `/api/stripe/payment-intent`.
   - Confirm AR requests are still being scanned/processed by the new event-driven path.
7. **Add a history note** at `docs/architecture/deprecated-routes.md`:
   ```markdown
   # Deprecated Routes Removed

   ## 2026-05-12 — Removed in claude/fix-deprecated-routes-cleanup

   - `/api/checkout/buy` (179 LOC) — replaced by `/api/checkout/submit` on YYYY-MM-DD.
   - `/api/stripe/checkout` (73 LOC) — replaced by `/api/stripe/payment-intent` on YYYY-MM-DD.
   - `/api/dashboard/ar-requests/scan` (105 LOC) — replaced by event-driven AR flow on YYYY-MM-DD.

   If you encounter old documentation or client code referencing these paths, update to the current path.
   ```
8. **Optional but recommended:** add 410 Gone responses at the Netlify edge for the old paths, with a clear "This endpoint is removed; use X" message — surfaces any stragglers immediately rather than silently 404-ing.

## Acceptance criteria
- [ ] Three route files deleted.
- [ ] `grep -rn "api/checkout/buy" app/` returns no live references (only the history doc).
- [ ] `npm run build` succeeds.
- [ ] Canonical checkout and Stripe paths still work end-to-end.
- [ ] No new errors in Netlify function logs for 24 hours post-deploy.
- [ ] `docs/architecture/deprecated-routes.md` records the deletions.

## Verification
```bash
# Should produce no results in app/ except history doc
grep -rn "api/checkout/buy\|api/stripe/checkout\|api/dashboard/ar-requests/scan" app/

# Canonical paths still respond
curl -i -X POST "$BASE_URL/api/checkout/submit" \
  -H "Content-Type: application/json" \
  -d '{"dry":true}'
# Expected: 200 or 400 (validation) — NOT 404.
```

## Dependencies
**Requires:** None.
**Blocks:** None directly, but reduces noise for every subsequent agent reading the codebase.

## Notes
- Low risk because they're explicitly marked deprecated — if they were used in critical paths, the deprecation note would have been removed.
- If Netlify logs show ANY traffic to the deprecated paths in the last 7 days, pause and trace the caller before deleting. Could be a forgotten internal cron, a third-party webhook misconfigured, or a stale mobile build (unlikely, no mobile app exists).
- 410 Gone at the edge is a kindness to any unknown caller — the response tells them what to use instead.
- After this fix, do a follow-up search for `// DEPRECATED` / `// TODO: remove` comments across the codebase. There are probably more.
