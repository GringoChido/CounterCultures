# [P1] Trade Pricing — Separate Sheet + Tier-Ready Lookup

> **Status:** PENDING · **Priority:** P1 · **Effort:** 1 day · **Branch:** `claude/fix-trade-pricing`
> **Last updated:** 2026-05-12

## Why this matters
Trade customers (architects, designers, hospitality buyers) get net pricing — typically 15–35% below retail — and this is the single biggest reason they sign up. Without a real trade-pricing mechanism, the trade program is theater: applications get approved but the "approved" customers see retail prices in the cart. Worse, putting trade overrides in the main 354K-row Products sheet would push CRM past Google Sheets' 10M-cell cap (it's already near the ceiling). A separate sheet keyed by `(product_id, tier)` with a `"default"` fallback gives us a launch-ready system today and a tier-segmented system later (`v2` populates `pro`, `vip`, etc.) without schema changes.

## The problem (evidence)
- No trade-price field anywhere in `app/lib/products-full.ts` — every customer sees `price` from the retail column.
- Main CRM sheet `CC_Products_Full` is at cell-cap; adding 354K × N tier columns is structurally impossible.
- `is_trade` flag (added in P1.2) currently has no behavioral effect.
- Catalog API and cart-store both read price the same way (`product.price`), so a single swap-point exists.

## Scope
**In scope:**
- New Google Sheet `Counter Cultures Trade Pricing` (separate workbook).
- New env var `GOOGLE_SHEETS_ID_TRADE_PRICING`.
- New `app/lib/trade-pricing.ts` with `getTradePrice(productId, tier)`.
- Hydration in `app/lib/products-full.ts` and catalog API to swap price when `customer.is_trade`.
- Cart-store price-source update.
- All prices stored ex-IVA (16% added at checkout).

**Out of scope:**
- Per-customer tier assignment UI (always `"default"` for v1).
- Per-category percentage overrides (use explicit prices per product).
- Trade-price effective-dating logic beyond `effective_from`/`effective_to` columns (read newest row).

## Files to touch
- New `app/lib/trade-pricing.ts` — sheet reader + cache + `getTradePrice`.
- New `app/lib/sheets-trade.ts` (or extend existing `google-sheets.ts`) — service-account auth + read for the trade workbook.
- `app/lib/products-full.ts` — accept optional `tradeContext` arg, swap price field.
- `app/api/catalog/route.ts` (or wherever catalog is served) — read customer session, pass `tradeContext`.
- `app/lib/cart-store.ts` — when adding to cart, store the customer-resolved price (snapshot).
- `app/(customer)/account/...` Customer record — `tier` column (already added in P1.2).
- `.env.example` — add `GOOGLE_SHEETS_ID_TRADE_PRICING=`.

## Trade pricing sheet schema
Sheet name: `Counter Cultures Trade Pricing`. Single tab `Prices`. Columns:
- `product_id` — matches `CC_Products_Full.product_id` exactly.
- `tier` — `"default"` for v1; later `"pro"`, `"vip"`, etc.
- `trade_price` — number, ex-IVA, MXN.
- `currency` — `MXN` (allow `USD` later).
- `effective_from` — ISO date. Empty = always.
- `effective_to` — ISO date. Empty = never expires.
- `notes` — free text.

## The fix (step by step)
1. Create the new Google Sheet. Share with the service account email used by `GOOGLE_SERVICE_ACCOUNT_EMAIL`. Copy the sheet ID, add to Netlify env as `GOOGLE_SHEETS_ID_TRADE_PRICING`.
2. Seed 5–10 rows with `tier="default"` for the top-selling Showroom Selection products to test.
3. Implement `app/lib/trade-pricing.ts`:
   ```ts
   export type TradeContext = { isTrade: boolean; tier: string };
   export async function getTradePrice(productId: string, tier: string): Promise<number | null> {
     const rows = await loadTradePriceRows(); // cached 5 min
     const now = new Date();
     const candidates = rows.filter(r =>
       r.product_id === productId &&
       (r.tier === tier || r.tier === 'default') &&
       (!r.effective_from || new Date(r.effective_from) <= now) &&
       (!r.effective_to || new Date(r.effective_to) >= now)
     );
     // Prefer exact-tier match, fall back to default.
     const exact = candidates.find(r => r.tier === tier);
     const fallback = candidates.find(r => r.tier === 'default');
     return (exact ?? fallback)?.trade_price ?? null;
   }
   ```
4. In `products-full.ts`, after the retail price hydration step, if `tradeContext?.isTrade`, await `getTradePrice(productId, tradeContext.tier)` per product (use `Promise.all` and a batch fetch — pre-load the whole sheet once per request, then resolve in O(1)).
5. In the catalog API route, derive `tradeContext` from the customer NextAuth session: `{ isTrade: jwt.isTrade ?? false, tier: jwt.tradeTier ?? 'default' }`.
6. In cart-store, when `addItem(product)` is called, capture `priceSnapshot` = the price the customer sees at that moment. Cart line items store this snapshot so a tier change mid-session doesn't silently reprice.
7. Add a debug query param `?asTrade=1` (gated behind staff role) so internal users can preview trade pricing.
8. Update `CART-RULES.md` to note the snapshot semantics.

## Acceptance criteria
- [ ] Trade pricing sheet exists, service account has read access.
- [ ] Logged-in customer with `is_trade=true` sees swapped price on catalog cards AND PDP.
- [ ] Same customer without `is_trade` (or anonymous) sees retail price.
- [ ] If no trade row exists for a given product, retail price is shown (no nulls leaked to UI).
- [ ] Cart line items lock the price at moment-of-add (verify by toggling `is_trade` on the customer record mid-session).
- [ ] Stripe charge amount matches the displayed sub-total + IVA.
- [ ] `getTradePrice('UNKNOWN_ID', 'default')` returns `null` without throwing.

## Verification
```bash
# 1. Seed a trade row: product_id=ODOO_12345, tier=default, trade_price=1200
# 2. Mark a customer is_trade=TRUE in Customers tab.
# 3. Log in as that customer, hit /api/catalog?ids=ODOO_12345
curl "$BASE_URL/api/catalog?ids=ODOO_12345" -H "Cookie: <customer-session>"
```
Expected: response shows `price: 1200` (or `priceTrade: 1200, priceRetail: <higher>`), and the same product viewed anonymously shows the retail price.

## Dependencies
**Requires:** P1.2 (Customer accounts — needs `is_trade` and `tier` on session).
**Blocks:** P1.4 (Promo code mutual exclusion — needs to detect trade pricing), P1.6 (Trade program approval flow sets `is_trade=true` and assumes pricing kicks in immediately), P1.13 (Factura Stripe bridge — invoice line items use trade price).

## Notes
- Cell-cap math: 354K products × 4 tiers × 2 dates = 2.8M cells just for trade prices, ignoring the 10–15 retail columns. The separate workbook is the only structural solution.
- All prices are ex-IVA. The cart adds IVA at checkout per Mexican tax law. Trade customers still pay IVA unless they're export-eligible (out of scope).
- Cache TTL: 5 minutes is fine. Trade prices change infrequently; the visibility-vs-perf tradeoff is comfortable here.
- Future tiers: when a customer is assigned to `tier="pro"` and no `pro` row exists for product X, the fallback hits `"default"` automatically — no missing-data 500s.
