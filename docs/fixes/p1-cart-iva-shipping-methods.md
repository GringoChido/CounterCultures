# P1 — Cart IVA + Shipping Methods + Oversized Freight

**Branch:** `fix/cart-iva-shipping-methods`
**Priority:** P1
**Status:** in-progress

## Scope

Three changes in one session:

### A) Show IVA on the cart page

- Cart page defaults to MX ship-to (captured later at checkout step 2).
- Centralized IVA helper `app/lib/iva.ts`: `computeIva(subtotalMXN, country)` at 16%.
- Replaces 4 duplicated `Math.round(subtotal * 0.16)` sites:
  - `checkout-stepper.tsx`
  - `pay-client.tsx`
  - `account/projects/[id]/page.tsx`
  - `api/cart/share/route.ts` (2 sites)
- `OrderSummary` now shows: Subtotal (net) / IVA 16% / Total / Shipping: "Calculated at checkout".

### B) Shipping method picker at checkout

- Added to checkout step 1 (Ship To), below delivery notes.
- Three radio options (non-oversized):
  1. **Local pickup (SMA showroom)** — $0
  2. **Local delivery in SMA** — $0
  3. **Ship via FedEx Economy (Skydropx)** — live rate from `POST /api/shipping/quote`
- Cart store extended with `shippingMethod` and `shippingQuoteMXN`.
- OrderSummary updated to show selected method + cost instead of "Quoted after order review".
- Checkout payload includes `shippingMethod`, `shippingCost`, `requiresFreightQuote`.
- Pipeline sheet rows now carry these 3 additional columns.

### C) Oversized items → custom freight quote

- `CartItem.shippingClass?: 'standard' | 'oversized'` (default standard).
- `ProductFull.shippingClass` sourced from `shipping_class` column in CC_Products_Full sheet.
- If any cart item is oversized:
  - Shipping picker locks to "Custom freight quote (oversized item)" with explainer copy.
  - Checkout forced to QUOTE path (never Stripe).
  - Pipeline deal carries `requires_freight_quote=true`.
- To QA: add `shipping_class=oversized` to a test product row in the CC_Products_Full sheet.

## Files touched

| File | Change |
|------|--------|
| `app/lib/iva.ts` | NEW — centralized IVA helper |
| `app/lib/stores/cart-store.ts` | Extended types + `setShipping`, `hasOversized` |
| `app/lib/products-full.ts` | `shippingClass` on ProductFull, reads `shipping_class` column |
| `app/components/cart/order-summary.tsx` | Shipping method + cost display |
| `app/[locale]/cart/cart-page-client.tsx` | Passes IVA props to OrderSummary |
| `app/[locale]/checkout/checkout-stepper.tsx` | Shipping picker, oversized logic, IVA via helper |
| `app/[locale]/checkout/pay/[dealId]/pay-client.tsx` | IVA via helper |
| `app/(customer)/account/projects/[id]/page.tsx` | IVA via helper |
| `app/api/cart/share/route.ts` | IVA via helper |
| `app/api/checkout/quote/route.ts` | Accepts + persists shipping fields |
| `app/api/checkout/buy/route.ts` | Accepts + persists shipping fields |

## Acceptance

- Cart page renders IVA breakdown: $8,900 item → Subtotal $7,672.41 / IVA $1,227.59 / Total $8,900.
- Checkout shows 3 radio shipping options. Selecting "Ship" fires `/api/shipping/quote`.
- Oversized SKU in cart → picker locks to "Custom freight quote" + forces QUOTE path + `requires_freight_quote=true` in Pipeline.
- `npm run typecheck` and `npm run lint` pass.

## Verification

```bash
npm run typecheck
npm run lint
```

Manual QA:
1. Add a standard item to cart → cart page shows IVA breakdown.
2. Proceed to checkout → step 1 shows shipping picker with 3 options.
3. Select "Ship via FedEx Economy" → live rate appears.
4. Flag a test product as `shipping_class=oversized` in CC_Products_Full sheet.
5. Add that product to cart → picker shows "Custom freight quote" locked.
6. Submit → deal in Pipeline has `requires_freight_quote=true`.
