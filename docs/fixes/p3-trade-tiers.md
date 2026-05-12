# [P3] Trade Tier Pricing Activation (Gold / Silver / Bronze)

> **Status:** PENDING · **Priority:** P3 · **Effort:** 1 day code + ongoing tier population · **Branch:** `claude/fix-trade-tiers`
> **Last updated:** 2026-05-12

## Why this matters
The trade-pricing scaffolding shipped in P1.3 is tier-ready but everyone is currently on the `default` tier — meaning every approved trade customer gets the same discount regardless of relationship depth, volume history, or strategic importance. Activating Gold / Silver / Bronze tiers lets Counter Cultures reward high-volume designers and architects, run targeted promos, and create an aspirational ladder. Without tiers, the trade program is one-size-fits-all and leaves margin on the table for top accounts while overpaying for low-volume ones.

## The problem (evidence)
- `lib/pricing/trade.ts`: `getTradePrice(productId, tier)` accepts a `tier` arg but the only tier present in `Trade_Pricing` is `default`.
- `lib/customers/types.ts`: `Customer.trade_tier` field exists, defaults to `default`, never set elsewhere.
- `app/account/trade/page.tsx`: shows "You are a trade customer" with no tier info.
- No admin UI exists in `/dashboard/trade-program` for tier assignment.
- Roger has informally referenced "Gold designers" in Slack — concept exists, just not encoded.

## Scope
**In scope:**
- Populate `Trade_Pricing` with `gold | silver | bronze | default` rows per product.
- Admin UI in `/dashboard/trade-program` to set `customer.trade_tier`.
- Customer-facing UI in `/account/trade` showing tier + benefits.
- Tier-gated product access (some SKUs Gold-only).
- Tiered net-terms (Gold = 60 days, Silver = 30, Bronze = 15, default = prepay).

**Out of scope:**
- Automatic tier promotion based on 12-month spend (manual for v1; automation is v3).
- Per-brand tier overrides (flat across catalog v1).
- Public marketing pages for the tier ladder (Sales/marketing work).

## Files to touch
- `lib/sheets/trade-pricing.ts` — extend adapter to load all four tiers per product.
- `lib/pricing/trade.ts` — already accepts `tier`; verify lookup falls back to `default` when tier missing for a product.
- `app/dashboard/trade-program/page.tsx` — new admin list view: customers + current tier + assignment dropdown.
- `app/dashboard/trade-program/actions.ts` — server action to update `customer.trade_tier`.
- `app/account/trade/page.tsx` — render tier badge + benefits matrix.
- `lib/customers/access.ts` — `canCustomerSeeProduct(customer, product)` for tier-gated SKUs.
- `app/[locale]/products/[slug]/PDP.tsx` — hide Add-to-Cart for tier-locked items with explanatory message.
- `lib/checkout/terms.ts` — net-terms selector reads `customer.trade_tier`.

## The fix (step by step)
1. Define benefits matrix in `lib/pricing/tier-benefits.ts`: Gold = 30% off MSRP / 60-day net / early access to drops; Silver = 20% off / 30-day net; Bronze = 10% off / 15-day net; default = 0% / prepay.
2. Populate `Trade_Pricing` initially by computing `gold = msrp * 0.7`, `silver = msrp * 0.8`, `bronze = msrp * 0.9`. Script: `scripts/trade/seed-tier-prices.ts`.
3. Build admin tier-assignment table in `/dashboard/trade-program` listing all `Customers` rows with `trade_status === 'approved'`. Dropdown sets `trade_tier` and writes back to Sheet.
4. Update `/account/trade` to show the customer's tier in a badge with a benefits table beneath. Pull from `tier-benefits.ts`.
5. Add `tier_required` column to Products (nullable). Update PDP to check `canCustomerSeeProduct` and hide Add-to-Cart for unauthorized tiers.
6. Update checkout terms selector to read tier and offer net-terms options accordingly.
7. Notify Sales (Javier, Ian) — they need to know who is Gold / Silver / Bronze when quoting.

## Acceptance criteria
- [ ] `Trade_Pricing` has rows for all four tiers for at least the top 200 SKUs.
- [ ] Admin UI in `/dashboard/trade-program` works.
- [ ] `/account/trade` displays tier + benefits.
- [ ] PDP respects `tier_required`.
- [ ] Checkout offers correct net-terms by tier.

## Verification
```bash
pnpm tsx scripts/trade/audit-tier-coverage.ts
```
Expected: "Tier coverage: Gold N | Silver N | Bronze N | default N | customers tiered: X/Y"

## Dependencies
**Requires:** P1.3 (trade-pricing structure exists)
**Blocks:** auto-tier-promotion (v3), tiered loyalty rewards (v3)

## Notes
- Reference: P1.3 spec in `docs/fixes/p1-trade-pricing.md`.
- Antonia needs to be looped in on net-terms exposure — Gold 60-day means more AR float; review with her before activating.
- See `COMMUNICATION-MATRIX.md` for tier-promotion email templates (placeholder slots exist).
