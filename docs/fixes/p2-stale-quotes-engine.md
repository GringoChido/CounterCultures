# [P2] Stale Quote Follow-Up Engine

> **Status:** PENDING · **Priority:** P2 · **Effort:** 1 day · **Branch:** `claude/fix-stale-quotes-engine`
> **Last updated:** 2026-05-12

## Why this matters
741 stale quotes worth $35M MXN (~$5.6M USD) are sitting >30 days with zero follow-up automation. This is the single largest recoverable revenue opportunity in the funnel — even a 10% conversion lift on the aged-quote pile recovers $3.5M MXN. Right now Antonia/Roger have no systematic visibility, and the deal owners (Javier, Ian) only chase what they personally remember.

## The problem (evidence)
- Pipeline tab shows 741 rows in `stage = Quoted` with `last_activity_at < now - 30d`.
- No cron path currently touches stale quotes — only `/api/cron/stale-deal-sweep` exists but is scoped to opportunity stage transitions.
- `/dashboard/today` has a "Needs You" panel but stale-quote follow-ups are not a card type.

## Scope
**In scope:**
- Extend `/api/cron/stale-deal-sweep` with stale-quote detection at 7/14/30 day buckets.
- Stage-specific Resend email templates (gentle nudge → check-in → "is this still alive?").
- New `/dashboard/today` panel card: "Quotes needing follow-up (n)".
- CC the deal owner (Javier or Ian based on `owner_email` field).

**Out of scope:**
- WhatsApp follow-ups (separate P2-14).
- Auto-closing dead quotes — humans still decide.

## Files to touch
- `app/api/cron/stale-deal-sweep/route.ts` (extend)
- `app/lib/email/templates/stale-quote-7d.tsx` (new)
- `app/lib/email/templates/stale-quote-14d.tsx` (new)
- `app/lib/email/templates/stale-quote-30d.tsx` (new)
- `app/(dashboard)/dashboard/today/components/needs-followup-panel.tsx` (new)
- `app/lib/pipeline-queries.ts` (add `getStaleQuotes(daysOld: 7|14|30)`)

## The fix (step by step)
1. In `pipeline-queries.ts`, add `getStaleQuotes(bucket)` reading `CC_Pipeline` rows where `stage='Quoted'` and `last_activity_at` falls within bucket window.
2. Extend cron route: iterate three buckets, dedupe against `notifications_sent` log to avoid double-pinging the same bucket.
3. Render the three Resend templates; cc Antonia + Roger; the deal owner is the primary `to`.
4. Log each send to `Notifications` sheet with `type=stale_quote_followup_{bucket}`.
5. Add `<NeedsFollowupPanel />` to `/dashboard/today` listing top 10 stale quotes sorted by value descending.
6. Add manual "Mark as followed up" button that bumps `last_activity_at` so the quote drops out of the bucket.

## Acceptance criteria
- [ ] Cron emits 7/14/30 day reminder emails to deal owners with Antonia + Roger cc'd.
- [ ] Each quote receives at most one email per bucket.
- [ ] `/dashboard/today` shows the Needs Follow-Up panel with stale quote count and aggregate value.
- [ ] Manual follow-up action clears the item from the panel.
- [ ] Cron runs idempotently on a re-trigger (no duplicate emails).

## Verification
```bash
curl -X POST https://localhost:3000/api/cron/stale-deal-sweep -H "x-cron-secret: $CRON_SECRET"
```
Expected: JSON `{ buckets: { "7d": n, "14d": n, "30d": n }, emailsSent: total }`.

## Dependencies
**Requires:** P1.1 (Resend integration must ship first).
**Blocks:** none.

## Notes
See `docs/commerce/LIFECYCLE-STATE-MACHINE.md` for quote stage definitions and `docs/commerce/COMMUNICATION-MATRIX.md` for who-gets-cc'd defaults. Antonia (formerly Tonina in older docs — same person) is the default finance recipient.
