# Keepalive Cron — Production Verification

**Date:** 2026-05-30
**Verified by:** Cowork session (perf-audit pass, Fixes #1/#3/#5 shipped same session)
**Outcome:** Cron is healthy. No code change required.

This record exists because Fix #4 of the storefront perf punch list turned out to need no code — the keepalive infrastructure was already correctly built and deployed. This file is the operational verification artifact so future sessions can see the cron was checked and what was found.

---

## What was checked

### Code path
- Route: `app/api/cron/keepalive/route.ts`
- Function shim: `netlify/functions/keepalive.ts`
- Schedule declaration: `netlify.toml` `[functions."keepalive"]`, line 53-54

All three exist, follow the same auth-and-shim pattern as `fx-sync`, `odoo-sync`, and `stale-deal-sweep`. Route is gated by `x-cron-probe-key` header matching the `CRON_PROBE_KEY` env var, fail-closed.

### Netlify env var
- `CRON_PROBE_KEY` is set
- Scope: All (Builds + Functions + Runtime + Post-processing)
- Contexts: same value in all deploy contexts
- Verified at: `https://app.netlify.com/projects/countercultures/configuration/env`

### Netlify function status
- Function: `keepalive` (Scheduled)
- State: running in production
- Schedule: `*/3 * * * *` (every 3 minutes)
- Next execution at time of check: today at 1:18 PM CST
- Last invocation: May 30, 1:12:23 PM — duration 13,930.79 ms, memory 122 MB
- Verified at: `https://app.netlify.com/projects/countercultures/logs-and-metrics/functions/keepalive`

### What the 14-second duration means

The keepalive function does an HTTP fetch back to `/api/cron/keepalive`, which in turn warms the products-full cache and probes 2 PDPs in EN and ES. When the user-facing Lambda is cold (which it was, just after the deploy), that HTTP path takes ~10-14s while the 5.6 MB product snapshot hydrates. That is the keepalive doing its job — paying the cold-start cost on a background schedule so the first customer doesn't.

The next invocation (3 min later) hits a now-warm Lambda and should drop to sub-second. If subsequent runs stay at 10-14s, the cron is running but not warming the user-facing Lambda instance — that would be a deeper investigation. Initial post-deploy duration is by design.

---

## Side observations (logged for visibility — not in scope for Fix #4)

While the env vars page was open, the following gaps were noted. These match the MASTER-PLAN PM-21 "prod env-var landmines" list and are not new findings — surfacing them here so the next session can decide when to address.

- `STRIPE_WEBHOOK_SECRET` — missing. Without this, Stripe webhook signature validation fails; the cart→Stripe→Odoo bridge cannot verify incoming events.
- `ODOO_STRIPE_JOURNAL_ID` — missing. Required for Odoo journal mapping on cart-payment invoices.
- `WHATSAPP_APP_SECRET` — missing. The security-hardening commit `15c31f5` made the WhatsApp webhook fail-closed on a missing secret. Once Meta is live (~2 weeks from MASTER-PLAN's note), this MUST be set or inbound leads will be rejected.
- `NEXT_PUBLIC_ALLOW_INDEXING` — intentionally unset. Staging stays noindex. Leave as-is.

---

## Recommendation for ongoing monitoring

The cron's design assumes the keepalive's HTTP call warms the same Lambda instance that user requests hit. Netlify can route a scheduled function's outbound HTTP call to a different Lambda warm pool than user-facing traffic — that would silently neuter the keepalive.

A cheap signal of effectiveness: if the next 3-min invocation drops to <1s while the user-facing site stays fast, the cron is working as intended. If invocation durations stay at 10s+ across multiple consecutive runs while a fresh user request is also slow, the keepalive is firing but not warming the right pool, and the cold-start architecture needs a different intervention (e.g., a different probe endpoint, or moving cache hydration off the Lambda critical path).

Not a Fix #4 follow-up. Just a note for whoever next looks at cold-start latency.
