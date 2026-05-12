# [P1] Dual Payment Ledgers — Pick a Canonical, Build Reconciliation

> **Status:** PENDING · **Priority:** P1 · **Effort:** 1 day · **Branch:** `claude/fix-dual-payment-ledgers`
> **Last updated:** 2026-05-12

## Why this matters
Counter Cultures currently runs two parallel payment systems with no reconciliation: `/dashboard/payments` (4,674 Odoo records — the historical source-of-truth) and `/dashboard/finance` (48 CRM records — a partial overlay). Antonia and Roger are looking at different numbers depending on which page they happen to open, and every Stripe checkout that succeeds but fails to register in Odoo (network blip, webhook race, transient API failure) creates a silent gap that surfaces only weeks later as a "ghost order" — paid, shipped, but not booked. We need ONE canonical ledger and a visible reconciliation surface to surface these gaps in hours, not weeks.

## The problem (evidence)
- `/dashboard/payments` shows 4,674 Odoo rows.
- `/dashboard/finance` shows 48 CRM rows that partially duplicate Odoo records but with different IDs, sometimes different amounts.
- No reconciliation report exists; no surface shows "Stripe paid but Odoo missing".
- Stripe webhook handler calls `registerPayment` in Odoo, but failures are logged and forgotten — no retry queue, no visible "needs reconciliation" state.
- `FINANCE-RULES` does not address dual-source ambiguity.

## Scope
**In scope:**
- Canonicalize Odoo as the source-of-truth for payments.
- Build `/dashboard/finance/reconciliation` showing Stripe-paid orders missing from Odoo.
- Mark `/dashboard/finance` UI as deprecated; reroute the sidebar link to Payments.
- Add a "Reconcile" action that retries `registerPayment` and surfaces the result.
- Document the decision in `FINANCE-RULES`.

**Out of scope:**
- Migrating the 48 CRM rows into Odoo (one-time, separate task — can keep them as historical).
- Bi-directional Odoo↔Stripe sync (we already have one-way).
- New payment provider support.

## Files to touch
- New `app/(dashboard)/dashboard/(portal)/finance/reconciliation/page.tsx`.
- New `app/api/dashboard/finance/reconciliation/route.ts` — GET diff, POST retry.
- New `app/lib/payments-reconciliation.ts` — `getStripeOrphans()`, `retryRegister(paymentIntentId)`.
- Modify `app/(dashboard)/components/sidebar.tsx` — point Finance entry to Payments, keep `/dashboard/finance` reachable but with a "Deprecated — use /payments" banner.
- Modify `app/(dashboard)/dashboard/(portal)/finance/page.tsx` — add deprecation banner.
- Modify `docs/finance/CLAUDE-FINANCE-RULES.md` — document Odoo-as-canonical decision.

## The fix (step by step)
1. **Decision recorded.** Update `CLAUDE-FINANCE-RULES.md` rule 1 (already does, per P1.13 plan) and add a "Canonical Ledger" section:
   > Payments canonical source = Odoo (`Odoo_Payments`). CRM `Finance_Ledger` is deprecated as of 2026-05-12 and retained for historical lookup only. All new payment events must register in Odoo via `registerPayment`.
2. **Build `getStripeOrphans()`** in `payments-reconciliation.ts`:
   - Query Stripe API for all `payment_intent` events in the last 30 days with `status='succeeded'` and `metadata.kind` in `('cart_purchase','deal_payment')`.
   - For each, look up `Odoo_Payments` by `stripe_payment_intent_id`.
   - Orphans = Stripe-paid PIs with no matching Odoo row. Return: `[{ paymentIntentId, amount, currency, customerEmail, dealId, createdAt, lastRetryAt, lastRetryError }]`.
   - Cache 5 min.
3. **Build the reconciliation page:**
   - Table of orphans, columns: PI ID, amount, customer, deal, created, last retry, status.
   - Each row has a "Retry Register" button.
   - Header summary: `<count> orphans, total amount <sum> MXN`.
   - Empty state: "All Stripe payments reconciled. Last checked: <ts>".
4. **POST endpoint** `POST /api/dashboard/finance/reconciliation/retry`:
   - Body `{ paymentIntentId }`.
   - Re-invoke the `registerPayment` flow against Odoo with the original PI's amount + metadata.
   - On success: link is created; orphan disappears on next refresh.
   - On failure: stamp `lastRetryAt`, `lastRetryError` to a tracking sheet/tab so we don't lose the attempt history.
5. **Deprecation banner on `/dashboard/finance`:**
   - Yellow ribbon at top: "This view is deprecated. The canonical payment ledger is at [Payments](/dashboard/payments). Reconciliation gaps appear at [Reconciliation](/dashboard/finance/reconciliation)."
6. **Sidebar:** keep "Payments" linked to `/dashboard/payments`; remove or downgrade the "Finance" link (the role-based reorg in P1.9 will further consolidate).
7. **Optional automation:** add a daily cron `app/api/cron/payments-reconciliation/route.ts` that runs `getStripeOrphans()` and, if count > 0, posts a Slack/email alert. (Stub now, fully wire after P1.1 Resend + Slack integration.)

## Acceptance criteria
- [ ] `/dashboard/finance/reconciliation` exists and renders orphans (test by intentionally not running `registerPayment` for a Stripe sandbox PI).
- [ ] Retry button successfully registers the payment in Odoo on a real reconciliation case.
- [ ] `FINANCE-RULES.md` reflects the Odoo-canonical decision.
- [ ] `/dashboard/finance` shows a deprecation banner.
- [ ] No double-counting: a payment in both Odoo and CRM only counts once in any KPI.

## Verification
```bash
# 1. Get current orphan count
curl -s "$BASE_URL/api/dashboard/finance/reconciliation" -H "Cookie: <staff>" \
  | jq '.orphans | length'

# 2. Force an orphan: in Stripe test mode, simulate a succeeded PI but skip the webhook
# 3. Refresh → count increments
# 4. Click Retry → count decrements
```
Expected: orphan count behaves as described; Odoo row appears post-retry.

## Dependencies
**Requires:** P0.2 (Stripe webhook secret functional — otherwise we're reconciling against an empty Odoo).
**Blocks:** P1.13 (Factura Stripe bridge — factura emit depends on Odoo payment existing), AR aging accuracy.

## Notes
- 30-day window is the sweet spot: shorter misses slow webhooks, longer is N×Stripe API calls.
- "Last retry error" persistence is non-negotiable — without it, retries are blind.
- Recommendation note for Joshua: the CRM `Finance_Ledger` tab has historical value (Roger's annotations, custom categories). Keep it readable but no new writes — convert it to a soft-archive.
- Long-term: the Odoo registration should be a queue (BullMQ on a small Redis), with retries and DLQ. For now, the manual retry button is sufficient.
- This fix is the foundation for monthly close: without reliable reconciliation, the close-the-books workflow can't trust any P&L number.
