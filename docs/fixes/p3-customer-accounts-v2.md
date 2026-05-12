# [P3] Customer Accounts v2: Order History, Wishlist, Addresses, Facturas, Email Prefs, Recommendations

> **Status:** PENDING · **Priority:** P3 · **Effort:** 2-3 days · **Branch:** `claude/fix-customer-accounts-v2`
> **Last updated:** 2026-05-12

## Why this matters
P1.2 ships v1 customer accounts: magic-link auth, Customers sheet, basic profile, persisted cart. That's the minimum viable account — enough to recognize a returning visitor. v2 turns the account from a recognition mechanism into a relationship surface: customers see their order history, save designs to a wishlist, manage multiple addresses, store factura profiles for different RFCs, control email preferences, and get basic personalized recommendations. For a Mexican commerce site selling premium goods to designers, architects, and B2B buyers, these are table stakes that drive repeat orders and trust.

## The problem (evidence)
- After P1.2: `/account` shows only profile + saved cart.
- Pipeline rows linked to customer by `customer_id` are not surfaced anywhere in the account UI.
- No `Wishlist` sheet or wishlist UI exists.
- `Customers` table has a single `address` column — no multi-address support.
- Single `rfc` column — buyers with multiple fiscal entities (a designer billing under personal RFC sometimes and their studio RFC other times) cannot manage profiles.
- Email subscription state is opaque to the customer (managed in Klaviyo only).
- No recommendation logic surfaces past quotes.

## Scope
**In scope:**
- Order history tab in `/account/orders` showing Pipeline rows where `customer_id` matches.
- Wishlist: new `Wishlist` sheet, add-to-wishlist heart on PDP, `/account/wishlist` tab.
- Address book CRUD: new `Customer_Addresses` sheet with default-ship + default-bill flags.
- Saved factura profiles: new `Customer_Factura_Profiles` sheet with multiple RFCs / regimens.
- Email preferences UI in `/account/preferences` syncing with Klaviyo lists.
- Basic recommendations on `/account` dashboard: "Based on your recent quotes" using brand + category overlap with past Pipeline rows.

**Out of scope:**
- Reorder-with-one-click flow (v3).
- Shared wishlist / collaborative boards (v3).
- ML-driven recommendations (v1 is rule-based overlap).
- Factura auto-issuance from past orders (separate Finance ticket).

## Files to touch
- `lib/sheets/wishlist.ts` — new adapter.
- `lib/sheets/customer-addresses.ts` — new adapter.
- `lib/sheets/customer-factura-profiles.ts` — new adapter.
- `app/account/orders/page.tsx` — order history list pulling from Pipeline.
- `app/account/orders/[id]/page.tsx` — order detail.
- `app/account/wishlist/page.tsx` — wishlist UI.
- `app/account/addresses/page.tsx` — address book CRUD.
- `app/account/factura-profiles/page.tsx` — factura profiles CRUD.
- `app/account/preferences/page.tsx` — email prefs UI calling Klaviyo API.
- `app/account/page.tsx` — dashboard with recommendations block.
- `lib/recommendations/basic.ts` — recommendation logic (brand + category overlap on past Pipeline rows).
- `app/[locale]/products/[slug]/components/WishlistButton.tsx` — heart toggle.
- `lib/klaviyo/preferences.ts` — read/write subscription state.

## The fix (step by step)
1. Build `Wishlist` sheet (`customer_id | product_id | added_at | notes`) and adapter. Add heart toggle on PDP wired to a server action.
2. Build `Customer_Addresses` sheet (`id | customer_id | label | line1 | line2 | colonia | municipio | estado | cp | country | is_default_ship | is_default_bill | created_at`) and CRUD page.
3. Build `Customer_Factura_Profiles` sheet (`id | customer_id | label | rfc | razon_social | regimen_fiscal | uso_cfdi | domicilio_fiscal_cp | is_default | created_at`) and CRUD page.
4. Build order-history page reading Pipeline rows where `customer_id === session.customer_id`, ordered by `created_at DESC`, paginated 25 per page. Detail page shows line items, status, dates.
5. Build email-preferences page: list Klaviyo lists customer is on, toggle subscriptions via Klaviyo profile API.
6. Build recommendation logic: take customer's last 10 Pipeline rows, collect brand + category set, query Products for non-purchased items in that set, limit 8, render on `/account`.
7. Update checkout to let the customer pick from saved addresses and factura profiles (with "add new" option).

## Acceptance criteria
- [ ] Order history shows all Pipeline rows for the customer.
- [ ] Wishlist add/remove from PDP works and persists.
- [ ] Address book supports multiple entries + default ship/bill.
- [ ] Factura profiles support multiple RFCs.
- [ ] Email preferences page reads and writes Klaviyo subscription state.
- [ ] Recommendations block renders for customers with ≥1 past Pipeline row.
- [ ] Checkout pulls saved addresses + factura profiles.

## Verification
```bash
pnpm test:e2e account-v2
```
Expected: all 6 v2 surfaces pass e2e (order-history, wishlist, addresses, factura, email-prefs, recommendations).

## Dependencies
**Requires:** P1.2 (v1 customer accounts)
**Blocks:** reorder flow (v3), loyalty program (v3), shared wishlist (v3)

## Notes
- Reference: P1.2 spec and `CART-RULES.md` (cart persistence patterns reusable for wishlist).
- See `CLAUDE-FINANCE-RULES.md` for factura field validation (RFC checksum, regimen enum, uso CFDI list).
- Antonia owns the factura field rules; align with her on validation before shipping.
- Klaviyo API key already lives in env; see `lib/klaviyo/client.ts`.
