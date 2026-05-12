# [P0] Stripe webhook secret unset — events silently dropping (503)

> **Status:** PENDING · **Priority:** P0 · **Effort:** 15 min + reconciliation · **Branch:** `claude/fix-stripe-webhook-secret` (env-only, no code branch needed)
> **Last updated:** 2026-05-12

## Why this matters

Every Stripe webhook hitting the site is being rejected with 503 right now because `STRIPE_WEBHOOK_SECRET` is not set in Netlify production env. `checkout.session.completed`, `payment_intent.succeeded`, and `invoice.payment_succeeded` are all dropped. That means cart purchases never trigger the `stripe_payment` rule transition in the lifecycle state machine, `Deal_Payments` rows are not being written, and Stripe payouts do not reflect in the system. Finance has no record of online card transactions until this is fixed.

## The problem (evidence)

- `/dashboard/settings` Integration Health panel shows: **Stripe — NEEDS ATTENTION**.
- `app/api/stripe/webhook/route.ts` performs boot-time validation: if `process.env.STRIPE_WEBHOOK_SECRET` is missing it returns HTTP 503 with body `{ error: "Webhook secret not configured" }` on every POST.
- Netlify function logs for `/api/stripe/webhook` show repeated 503 responses with no signature verification attempted.
- Stripe Dashboard → Developers → Webhooks → counter-cultures endpoint shows failed deliveries with retry attempts piling up.

## Scope

**In scope:**
- Set `STRIPE_WEBHOOK_SECRET` in Netlify production env
- Trigger redeploy
- Smoke-test webhook delivery
- Manually reconcile any cart payments that landed during the outage

**Out of scope:**
- Code changes to the webhook handler (`app/api/stripe/webhook/route.ts` is fine — boot validation works as intended)
- Stripe ↔ Factura bridge fixes (see P1.13)
- New Stripe event types (separate fix)

## Files to touch

- Netlify env config (UI-driven, no commit)
- `app/api/stripe/webhook/route.ts` — **read-only** to confirm boot validation pattern; no edits expected

## The fix (step by step)

1. Open Stripe Dashboard → Developers → Webhooks → counter-cultures production endpoint.
2. Click **Signing secret** → reveal → copy the `whsec_...` value.
3. Open Netlify → counter-cultures site → Site settings → Environment variables.
4. Add (or update if present-but-empty): `STRIPE_WEBHOOK_SECRET=whsec_...`. Scope: Production.
5. Trigger a redeploy (Deploys → Trigger deploy → Deploy site).
6. Wait for deploy to finish (~2-3 min). Confirm latest deploy is live.
7. In Stripe Dashboard → Webhooks → counter-cultures endpoint, click **Send test webhook** → pick `checkout.session.completed` → Send.
8. Watch Netlify function logs for `/api/stripe/webhook` → expect a `200 OK` response and a log line like `Stripe webhook processed: checkout.session.completed`.
9. Reconcile the outage window:
   - In Stripe Dashboard, filter Payments by date range since the secret was last working.
   - For each successful payment with no matching `Deal_Payments` row in the sheet, either:
     - Replay the event from Stripe Dashboard → Webhooks → event → Resend, OR
     - Manually register it via `/dashboard/payments/register`.
10. Confirm `/dashboard/settings` Integration Health → Stripe now shows **CONNECTED**.

## Acceptance criteria

- [ ] `STRIPE_WEBHOOK_SECRET` is set in Netlify production env (begins with `whsec_`)
- [ ] Production deploy includes the new env var
- [ ] Test webhook from Stripe Dashboard returns 200
- [ ] `/dashboard/settings` Integration Health → Stripe shows **CONNECTED**
- [ ] All unreconciled payments since the outage are backfilled in `Deal_Payments`
- [ ] No 503s on `/api/stripe/webhook` in last 100 Netlify log lines

## Verification

```bash
# Tail Netlify function logs (or use Netlify UI)
netlify functions:logs --name stripe-webhook --tail
# In Stripe Dashboard: Developers → Webhooks → Send test webhook (checkout.session.completed)
# Expected log line: "Stripe webhook processed: checkout.session.completed"
# Expected HTTP response in Stripe Dashboard delivery log: 200
```

Expected: 200 on test event, no 503s, `Deal_Payments` sheet shows new row from test if the test customer/deal id resolves (it may no-op gracefully if the test object isn't a real deal — that's fine, the 200 confirms signature verification passed).

## Dependencies

**Requires:** None (env-only change).
**Blocks:** P1.13 (Factura ↔ Stripe bridge) — that flow depends on `checkout.session.completed` actually firing the downstream rule transitions.

## Notes

- `whsec_...` is environment-specific: the production secret is different from the test-mode secret. Use the production one for the production env var.
- If multiple webhook endpoints are configured in Stripe (e.g., one for prod and one for preview deploys), each has its own secret. Document which one is canonical in `docs/integrations/stripe.md`.
- See `docs/commerce/LIFECYCLE-STATE-MACHINE.md` for the `stripe_payment` transition rule that this webhook fires.
- See `docs/finance/CLAUDE-FINANCE-RULES.md` for how `Deal_Payments` rows feed the finance mirror.
