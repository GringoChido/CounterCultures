# [P1] Promo / F&F Codes at Checkout

> **Status:** PENDING · **Priority:** P1 · **Effort:** 1 day · **Branch:** `claude/fix-promo-code-checkout`
> **Last updated:** 2026-05-12

## Why this matters
Checkout has no code-redemption UI today, so every marketing push, friends-and-family thank-you, and influencer collab is unredeemable on-site — discounts are applied manually post-sale via custom invoices, which is fragile, untracked, and impossible to attribute. With this fix, the same Promo_Codes table powers both marketing promos and F&F (distinguished by a `type` flag), discounts auto-apply at the Stripe step, redemption is tracked, and codes are MUTUALLY EXCLUSIVE with trade pricing per the locked decision — trade customers can't stack codes on top of trade prices, ensuring margin integrity.

## The problem (evidence)
- `app/(checkout)/checkout/pay/[dealId]/page.tsx` has no `<PromoCodeInput>` component, no "Have a code?" section.
- No `Promo_Codes` tab exists in the CRM.
- Stripe `PaymentIntent` is created with deal total — no path to adjust amount post-creation.
- F&F discounts today are handled as manual line items in custom invoices, with no audit trail.

## Scope
**In scope:**
- New `Promo_Codes` tab in CRM.
- New endpoint `POST /api/checkout/promo-code` for validation + apply.
- New UI on `/checkout/pay/[dealId]/page.tsx`: collapsible "Have a code?" section.
- Re-issue Stripe PaymentIntent with new amount on successful apply.
- Two new columns on `Deal_Line_Items`: `promo_code_applied`, `promo_discount`.
- Activity_Log entries on apply.
- Mutual exclusion with trade pricing.

**Out of scope:**
- Stacking multiple codes (one code per order).
- Auto-applying URL-coupon (`?code=XYZ`) — could add later.
- Per-product-category code restrictions (use min_order for now).
- Referral codes generated per-customer (separate feature).

## Files to touch
- New `app/api/checkout/promo-code/route.ts` — POST validate+apply, POST revoke.
- New `app/lib/promo-codes.ts` — `validateCode(code, context)`, `applyCode(...)`, `incrementUsedCount(...)`.
- Modify `app/(checkout)/checkout/pay/[dealId]/page.tsx` — render input, wire to API, show feedback states.
- Modify Stripe PaymentIntent creation logic (`app/lib/stripe-paymentintent.ts` or current path) — accept `promo_discount` arg.
- Modify `Deal_Line_Items` writer in `app/lib/deal-line-items.ts` — write the two new columns.
- Modify `app/lib/activity-log.ts` to log `promo_code_applied` event.

## Promo_Codes tab schema
- `code` — uppercase, trimmed, unique (PK).
- `type` — `promo` or `f&f`.
- `discount_pct` — 0–100, nullable.
- `discount_fixed` — MXN, nullable. Exactly one of `discount_pct`/`discount_fixed` must be set.
- `min_order` — MXN, optional.
- `max_redemptions` — int, optional (null = unlimited).
- `used_count` — int, defaults to 0.
- `valid_from` — ISO date, optional.
- `valid_to` — ISO date, optional.
- `active` — boolean.
- `notes` — free text.

## The fix (step by step)
1. Add `Promo_Codes` tab to the CRM with the schema above. Seed 3 test codes: `WELCOME10` (10% promo), `FRIENDOFROGER` (15% f&f), `SUMMER25` (25% promo with min_order=2000).
2. Implement `app/lib/promo-codes.ts`:
   - `validateCode(code, { subtotal, customerIsTrade })`:
     - Normalize input: uppercase + trim.
     - If `customerIsTrade` → return `{ ok: false, reason: 'TRADE_EXCLUSIVE', message: 'Trade pricing already applied — promo codes are for non-trade orders' }`.
     - Fetch row; if not found / inactive / out-of-window / over-redemptions / under min_order → return matching reason.
     - Compute discount: `pct` clamps to `subtotal`; `fixed` clamps too.
     - Return `{ ok: true, code, type, discount, finalTotal }`.
3. Implement `POST /api/checkout/promo-code`:
   - Body: `{ dealId, code }`.
   - Load deal, derive `subtotal` and `customerIsTrade` from customer record.
   - Validate; on success, recreate Stripe PaymentIntent with new amount (cancel old, create new) — store new `client_secret`, return to client.
   - Update `Deal_Line_Items`: write `promo_code_applied` + `promo_discount` on the deal-level row.
   - Append to Activity_Log: `{ entity: 'deal', entity_id: dealId, action: 'promo_code_applied', meta: { code, discount } }`.
4. Build the UI block on `/checkout/pay/[dealId]/page.tsx`:
   - Position: BELOW order summary, ABOVE the pay button.
   - Collapsed by default ("Have a code? +").
   - On expand: input + Apply button + error/success area.
   - On success: show "Code WELCOME10 applied · −$125.00 MXN", a "Remove" button, and the updated total.
   - On error: show server message; do not block the rest of checkout.
5. Wire the Apply button to fetch `/api/checkout/promo-code`, then refresh the order summary (the page already polls the deal — invalidate that query).
6. Add Stripe `client_secret` refresh path: the Pay button must use the latest `client_secret` after PaymentIntent recreation.
7. On successful Stripe charge (in webhook handler), increment `used_count` on the redeemed code.

## Acceptance criteria
- [ ] User types `WELCOME10` → server returns ok → UI shows applied discount → Stripe PaymentIntent amount is the discounted total.
- [ ] Trade customer typing any code → server rejects with the trade-exclusion message.
- [ ] Expired code (`valid_to` in past) → server rejects with "code expired".
- [ ] Code that hit max_redemptions → server rejects with "code fully redeemed".
- [ ] Sub-total below `min_order` → server rejects with "minimum order $X".
- [ ] Successful Stripe charge increments `used_count` exactly once (idempotent on retry).
- [ ] `Deal_Line_Items` row reflects `promo_code_applied` and `promo_discount`.
- [ ] Activity_Log shows the event with code + discount value.

## Verification
```bash
curl -X POST "$BASE_URL/api/checkout/promo-code" \
  -H "Content-Type: application/json" \
  -d '{"dealId":"DEAL-TEST-001","code":"welcome10"}'
```
Expected: `200 { ok: true, code: "WELCOME10", discount: 125.00, finalTotal: 1125.00, clientSecret: "pi_xxx_secret_xxx" }`. Subsequent Stripe charge succeeds at the discounted amount and `used_count` increments.

## Dependencies
**Requires:** P1.2 (Customer accounts — need to know `is_trade`), P1.3 (Trade pricing — to detect trade context).
**Blocks:** Marketing campaigns with redeemable codes, F&F program rollout, attribution analytics for promo lift.

## Notes
- Mutual exclusion with trade pricing is locked policy — do NOT add a "stacking" feature without explicit owner approval.
- Re-issuing the PaymentIntent (rather than calling Stripe `update`) avoids a class of edge cases where the original PI was already confirmed; cancel + create is safer.
- F&F codes share the same table for simplicity; the `type` column drives analytics segmentation only.
- Case-insensitive input but stored uppercase — paste-handling is lenient.
- Future: support per-customer codes (e.g., trade welcome `TRADE-{customerId}-15`) by adding `customer_email` column and validation step.
