# [P1] Factura Stripe Bridge — Auto-Emit on Stripe Payments

> **Status:** PENDING · **Priority:** P1 · **Effort:** 2 days · **Branch:** `claude/fix-factura-stripe-bridge`
> **Last updated:** 2026-05-12

## Why this matters
`CLAUDE-FINANCE-RULES.md` rule 1 says: "Facturas auto-create only on Santander deposits." That made sense when payments came almost entirely via wire transfer. But Stripe is now a major channel, and Stripe payouts hit a different bank (or a Stripe-managed account, then sweep to Santander days later). Result: every Stripe-paid order with factura intent sits in a black hole — the customer paid, expects their factura, and nothing automatic happens. Antonia processes them manually, with a delay. The fix is to add a parallel auto-emit path triggered by Stripe `payment_intent.succeeded`, while keeping the Santander path intact. Customers without RFC/factura intent fall into a visible "Needs Factura" queue that finance triages.

## The problem (evidence)
- Stripe webhook handler logs `payment_intent.succeeded` and updates `Pipeline.stage = 'closed-won'` but never invokes the CFDI emit chain.
- `CLAUDE-FINANCE-RULES.md` rule 1 explicitly says Santander-only.
- Customers who paid via Stripe and provided RFC on checkout still get manual facturas days later.
- There's no surface for "this order needs a factura but auto-emit failed/wasn't attempted" — these orders are invisible until a customer complains.

## Scope
**In scope:**
- Detect factura intent on the Deal (RFC, regimen fiscal, uso CFDI present).
- In Stripe webhook handler, on `payment_intent.succeeded` for kind `cart_purchase`, if factura intent present → queue CFDI emit.
- New "Needs Factura" queue on AR page for orders with payment but no factura yet.
- Update FINANCE-RULES rule 1.
- Email the customer their factura PDF + XML on emit success.

**Out of scope:**
- PAC provider integration (already exists or stubbed — wire to existing).
- Manual factura re-emit UI (already exists).
- Credit-note / cancellation flow.

## Files to touch
- `app/api/stripe/webhook/route.ts` — add `emitFacturaIfIntent(deal)` call after payment registered.
- `app/lib/ar-factura.ts` — add `emitFacturaForDeal(dealId)` orchestrator.
- New `app/lib/factura-queue.ts` — append to `Factura_Queue` tab.
- New `app/(dashboard)/dashboard/(portal)/ar/needs-factura/page.tsx` — visible queue.
- New `app/api/dashboard/ar/needs-factura/route.ts` — GET queue.
- `docs/finance/CLAUDE-FINANCE-RULES.md` — update rule 1.
- `app/lib/email.ts` — add `sendFacturaEmail(customer, { pdfUrl, xmlUrl })`.

## Factura intent detection
A Deal has factura intent if its `Deal` row (or `Customers` row for the buyer) contains:
- `rfc` non-empty AND
- `regimen_fiscal` non-empty AND
- `uso_cfdi` non-empty AND
- `razon_social` non-empty.

If any is missing → no auto-emit, push to "Needs Factura" queue with a reason.

## The fix (step by step)
1. **Update FINANCE-RULES rule 1.** New text:
   > Facturas auto-emit on either: (a) Santander deposit confirmation (legacy/wire flow), or (b) Stripe `payment_intent.succeeded` for kind=cart_purchase|deal_payment where the Deal has complete factura intent (RFC, regimen_fiscal, uso_cfdi, razon_social). Orders with payment but incomplete factura intent surface in the "Needs Factura" queue at `/dashboard/ar/needs-factura`.

2. **Webhook update.** In `app/api/stripe/webhook/route.ts`, after the existing `registerPayment` call for `payment_intent.succeeded`:
   ```ts
   if (event.data.object.metadata?.kind === 'cart_purchase' ||
       event.data.object.metadata?.kind === 'deal_payment') {
     const dealId = event.data.object.metadata.deal_id;
     await emitFacturaIfIntent(dealId, { source: 'stripe', paymentIntentId: event.data.object.id });
   }
   ```

3. **`emitFacturaIfIntent(dealId, ctx)`** in `ar-factura.ts`:
   - Load deal + customer + line items.
   - Check intent fields. If incomplete → `appendToNeedsFacturaQueue(dealId, missingFields)` and return.
   - Otherwise → call existing CFDI emit path (resolves fiscal fields via P1.12).
   - On success: store factura PDF + XML refs on the deal, send email.
   - On failure: log error, append to queue with `error_message`.

4. **`Factura_Queue` tab** (or use Activity_Log with a filter):
   - `deal_id | customer_email | payment_intent_id | reason (missing_fields | emit_failed) | missing_fields | error_message | status (pending|resolved) | created_at | resolved_at`.

5. **"Needs Factura" page** at `/dashboard/ar/needs-factura`:
   - Table of queue rows where `status='pending'`.
   - Each row has: deal link, customer link, "Edit fiscal info" button (opens Customer fiscal modal), "Retry emit" button.
   - On successful retry: row marks `resolved`.

6. **Email.** New `sendFacturaEmail({ to, dealId, pdfUrl, xmlUrl })`:
   - Subject: "Tu factura — Counter Cultures #<deal>".
   - Body: short message, attached PDF, link to XML.
   - From: `transactional@countercultures.com.mx`.

7. **Idempotency.** Use `payment_intent.id` as the idempotency key — if the webhook delivers twice (Stripe does retry on 5xx), don't double-emit. Check `Factura_Queue.payment_intent_id` and the deal's existing factura ref before emitting.

## Acceptance criteria
- [ ] Stripe test webhook with `cart_purchase` kind + complete factura intent → factura is emitted + email received within 60s.
- [ ] Stripe test webhook with missing RFC → row appears in `/dashboard/ar/needs-factura`.
- [ ] Retry button on a queue row, after fixing the customer's fiscal info, successfully emits.
- [ ] Webhook double-delivery does not produce two facturas.
- [ ] `FINANCE-RULES.md` rule 1 reflects dual-source.
- [ ] Existing Santander auto-emit path still works (no regression).

## Verification
```bash
# In Stripe test mode, send a test PI succeeded event
stripe trigger payment_intent.succeeded \
  --override "payment_intent:metadata.kind=cart_purchase" \
  --override "payment_intent:metadata.deal_id=DEAL-TEST-003"

# Check the queue
curl -s "$BASE_URL/api/dashboard/ar/needs-factura" -H "Cookie: <staff>" | jq
```
Expected: depending on whether the test deal has factura intent, either factura emitted (email received) or queue row created.

## Dependencies
**Requires:** P0.2 (Stripe webhook secret functional), P1.12 (Mexican fiscal fields populated), P1.1 (Resend for factura email).
**Blocks:** Monthly close, customer satisfaction on Stripe orders, finance team workload reduction.

## Notes
- Idempotency is the most important thing to get right. Double-facturas trigger SAT audit risk.
- If the existing CFDI emit module is itself a stub (PAC not wired), this fix ships the queue + intent detection — actual emit is gated behind the PAC integration completing.
- Email to customer should include both the PDF (human-readable) and XML (machine-readable — required for their accounting).
- Trade-customer orders with the new trade pricing (P1.3) — line items emit at trade price, not retail. IVA still applies at line level.
- Future: surface "Needs Factura" count as a badge on the AR sidebar entry — high-signal for Antonia.
