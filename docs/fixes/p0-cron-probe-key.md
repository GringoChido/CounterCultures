# [P0] Cron probe key unset — `/api/cron/*` routes are unauthenticated

> **Status:** PENDING · **Priority:** P0 · **Effort:** 20 min · **Branch:** `claude/fix-cron-probe-key`
> **Last updated:** 2026-05-12

## Why this matters

The four scheduled-job endpoints (`/api/cron/odoo-sync`, `/api/cron/fx-sync`, `/api/cron/stale-deal-sweep`, `/api/cron/follow-up-drip`) accept any anonymous request right now. The auth check is an OR clause: `x-netlify-scheduled: 1` (set by Netlify's scheduler) OR `x-cron-probe-key === process.env.CRON_PROBE_KEY`. When `CRON_PROBE_KEY` is unset, the second branch becomes truthy-by-omission (depending on the exact comparison used), and any external caller hitting these URLs can trigger expensive jobs: Sheets API quota burn, Odoo sync runs against live data, FX rate refetches, follow-up emails dispatched to leads. This is both a quota-exhaustion DoS vector and a data-integrity risk.

## The problem (evidence)

- `/dashboard/settings` Integration Health panel shows: **Scheduled Jobs — NEEDS ATTENTION**.
- `CRON_PROBE_KEY` is absent from Netlify production env vars.
- The OR-pattern auth check in `app/api/cron/*/route.ts` (e.g., `if (header === '1' || probeHeader === process.env.CRON_PROBE_KEY)`) is unsafe when the env var is `undefined` — a request sending `x-cron-probe-key: undefined` (or even just `undefined === undefined` if no comparison guard) can pass.
- No rate limiting on these routes.

## Scope

**In scope:**
- Generate and set `CRON_PROBE_KEY` in Netlify production env
- Audit and (if needed) harden the auth check in all 4 cron route handlers so that an unset env var fails closed
- Confirm Netlify scheduled functions still fire successfully
- Smoke-test rejection for unauthenticated callers

**Out of scope:**
- Rate-limiting middleware (separate fix)
- Migrating from header-based probe key to signed JWT (separate fix)
- New cron jobs (separate fix)

## Files to touch

- Netlify env config (UI)
- `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/api/cron/fx-sync/route.ts`
- `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/api/cron/odoo-sync/route.ts`
- `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/api/cron/stale-deal-sweep/route.ts`
- `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/api/cron/follow-up-drip/route.ts`
- Possibly a shared helper (e.g., `app/lib/cron-auth.ts`) if one exists — DRY the check there

## The fix (step by step)

1. Generate a strong random key locally:
   ```bash
   openssl rand -hex 32
   ```
2. Copy the 64-character hex string.
3. Open Netlify → counter-cultures → Site settings → Environment variables. Add `CRON_PROBE_KEY=<the-string>`. Scope: Production (and preview if cron is exercised there).
4. Read each cron route file and confirm the auth check is structured as:
   ```ts
   const probeKey = process.env.CRON_PROBE_KEY;
   const isScheduled = req.headers.get('x-netlify-scheduled') === '1';
   const probeMatch = !!probeKey && req.headers.get('x-cron-probe-key') === probeKey;
   if (!isScheduled && !probeMatch) {
     return new Response('Unauthorized', { status: 401 });
   }
   ```
   The critical guard is `!!probeKey &&` — without this, an unset env var lets undefined-vs-undefined comparisons through. If any of the 4 routes is missing this guard, fix it. If there's a shared helper, fix it there once.
5. Commit on `claude/fix-cron-probe-key`, push, deploy.
6. Test (production):
   - `curl -i https://countercultures.netlify.app/api/cron/fx-sync` → expect **401**.
   - `curl -i -H "x-cron-probe-key: <wrong>" https://...` → expect **401**.
   - `curl -i -H "x-cron-probe-key: $CRON_PROBE_KEY" https://...` → expect **200**.
7. Wait for next scheduled run (or trigger one via Netlify UI → Functions → cron → Run) → confirm scheduled execution still succeeds (Netlify injects `x-netlify-scheduled: 1`).
8. Confirm `/dashboard/settings` Integration Health → Scheduled Jobs now shows **CONNECTED**.

## Acceptance criteria

- [ ] `CRON_PROBE_KEY` set in Netlify production env (≥32 random chars / 64 hex)
- [ ] All 4 cron route handlers reject requests with no scheduled header and no/wrong probe key (HTTP 401)
- [ ] Auth check includes the `!!probeKey &&` guard so an unset env var fails closed
- [ ] Netlify scheduled functions still fire successfully (header `x-netlify-scheduled: 1` accepted)
- [ ] `/dashboard/settings` shows Scheduled Jobs **CONNECTED**

## Verification

```bash
# Anonymous → 401
curl -i https://countercultures.netlify.app/api/cron/fx-sync
# Wrong key → 401
curl -i -H "x-cron-probe-key: nope" https://countercultures.netlify.app/api/cron/fx-sync
# Correct key → 200
curl -i -H "x-cron-probe-key: $CRON_PROBE_KEY" https://countercultures.netlify.app/api/cron/fx-sync
```

Expected: 401 / 401 / 200 in that order. Repeat for `odoo-sync`, `stale-deal-sweep`, `follow-up-drip`.

## Dependencies

**Requires:** None.
**Blocks:** Nothing strictly, but until this lands, any external scanner that finds these URLs can burn quota and trigger Odoo writes.

## Notes

- The probe key is for manual/debug invocation by an operator. Day-to-day, Netlify's scheduler invokes these with `x-netlify-scheduled: 1` and the probe key isn't needed.
- Do **not** commit the key to the repo. It lives only in Netlify env.
- Rotate the key if it's ever shared in chat, email, or screenshots.
- Future hardening: signed JWT with short expiry instead of static header — out of scope here.
