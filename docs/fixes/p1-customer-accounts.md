# [P1] Customer Accounts — Magic Link + Google OAuth

> **Status:** PENDING · **Priority:** P1 · **Effort:** 2 days · **Branch:** `claude/fix-customer-accounts`
> **Last updated:** 2026-05-12

## Why this matters
Counter Cultures has no customer-account system today. Every checkout is anonymous, every order is detached from a persistent identity, the cart vanishes on browser refresh, trade members can't log in to see "their" pricing, and repeat purchasers re-enter shipping/RFC/factura data every time. Industry-standard for 2026 ecommerce is passwordless (magic link + social) — passwords are a liability, not a moat. Building this NOW unblocks trade pricing (P1.3), promo-code mutual exclusion (P1.4), trade-program data (P1.6), and the factura Stripe bridge (P1.13). It also enables persistent carts, saved fiscal data, and order history without inventing a second auth surface that conflicts with staff NextAuth.

## The problem (evidence)
- No `Customers` tab exists in the main CRM sheet — only `Pipeline`, `Deal_Line_Items`, `Cart_Sessions`, etc.
- `app/lib/auth-options.ts` is staff-only (allowlist + role mapping for owner/finance/sales).
- Cart-store (`zustand`) is browser-local; refresh on different device loses cart.
- Past orders join Pipeline rows by `contact_email` ad-hoc, never resolve to a single customer.
- Magic-link path doesn't exist; no `/account/sign-in` route present.

## Scope
**In scope:**
- New `Customers` tab in CRM.
- New `/account/sign-in` page (magic link + Google OAuth).
- NextAuth `customer` provider stack, separate from staff.
- `app/lib/customer-sheet.ts` for read/write of Customer rows.
- Cart persistence per logged-in customer in new `Customer_Carts` tab (or extend `Cart_Sessions`).
- First-login backfill: match by `contact_email` against Pipeline rows, set `customer_email` on those rows.

**Out of scope:**
- Order history UI (will follow in P2).
- Address-book CRUD UI beyond defaults (P2).
- Trade-tier UI for customer self-upgrade (always staff-driven for now).

## Files to touch
- New `app/lib/customer-auth.ts` — NextAuth options for customers (Resend email + GoogleProvider).
- New `app/api/auth/customer/[...nextauth]/route.ts` — separate handler.
- New `app/(customer)/account/sign-in/page.tsx` and `app/(customer)/account/layout.tsx`.
- New `app/lib/customer-sheet.ts` — `getCustomer(email)`, `upsertCustomer(...)`, `backfillPipelineByEmail(email)`.
- Modify `app/lib/cart-store.ts` — sync to `Customer_Carts` when `session.user.email` is set; hydrate from server on login.
- Modify `app/lib/google-sheets.ts` — add `Customers` and `Customer_Carts` tab references.
- Modify `app/lib/auth-options.ts` — leave staff stack alone, but ensure JWT `audience` claim distinguishes staff vs customer.

## Customers tab schema
Columns (in order):
- `email` (PK, lowercase, trimmed)
- `name`
- `phone`
- `default_ship_address` (JSON string)
- `default_billing_address` (JSON string)
- `saved_rfc`
- `factura_default` (JSON: `regimen_fiscal`, `uso_cfdi`, `razon_social`, `cp_fiscal`)
- `locale` (`es-MX` default)
- `trade_tier` (default `"default"`)
- `is_trade` (boolean string `TRUE`/`FALSE`)
- `created_at` (ISO)
- `last_login_at` (ISO)
- `marketing_opt_in` (boolean)
- `notes`

## The fix (step by step)
1. In the CRM sheet, add tab `Customers` with the schema above. Add tab `Customer_Carts` with columns: `email | cart_json | updated_at`.
2. Add env vars: `NEXTAUTH_CUSTOMER_SECRET`, `GOOGLE_CLIENT_ID_CUSTOMER`, `GOOGLE_CLIENT_SECRET_CUSTOMER` (separate OAuth app — staff and customer must NOT share consent screen).
3. Create `app/lib/customer-auth.ts` with `NextAuthOptions` exporting an `EmailProvider` configured to send via Resend (`from: process.env.RESEND_FROM_TRANSACTIONAL`) and `GoogleProvider` (customer client). Pages: `signIn: '/account/sign-in'`, `verifyRequest: '/account/check-email'`. JWT callback: stamp `{ audience: 'customer', email, isTrade, tradeTier }`.
4. Wire `app/api/auth/customer/[...nextauth]/route.ts` to that options object.
5. Build `/account/sign-in` UI: email input + "Email me a link" button + "Continue with Google" button.
6. In NextAuth `signIn` callback, call `upsertCustomer({ email, lastLoginAt: now, createdAt: existing?.createdAt ?? now })`. If new, also call `backfillPipelineByEmail(email)` — set `customer_email = email` on all Pipeline rows where `contact_email = email`.
7. Implement `customer-sheet.ts` with the standard append/lookup pattern used elsewhere; cache reads for 60s.
8. Extend `cart-store.ts`: when `useSession()` (customer) returns email, after every cart mutation, debounce 500ms and POST `/api/customer/cart` to upsert `Customer_Carts`. On login, GET to hydrate.
9. Add `/api/customer/cart` route with `GET` + `POST`.
10. Add `/account/check-email`, `/account/welcome`, `/account/sign-out` minimal pages.
11. Ensure middleware does NOT touch staff `/dashboard/*` for customer JWTs; they have different cookie names by default (`next-auth.session-token` vs `next-auth.customer-session-token` — set `cookieName` explicitly to keep them isolated).

## Acceptance criteria
- [ ] `/account/sign-in` renders, email submission triggers Resend magic link.
- [ ] Clicking the magic link logs the user in, creates a Customers row if none, updates `last_login_at`.
- [ ] Google OAuth login works end-to-end.
- [ ] Past Pipeline rows with the same `contact_email` get backfilled with `customer_email` on first login.
- [ ] Cart persists across devices: log in on browser A, add item, log in on browser B, item appears.
- [ ] Staff auth at `/dashboard` is unaffected (no cookie collision, no role leak).
- [ ] `is_trade=false` and `trade_tier="default"` for all new customers by default.

## Verification
```bash
# 1. Trigger sign-in via curl simulating UI
curl -X POST "$BASE_URL/api/auth/customer/signin/email" \
  -d "email=test+$(date +%s)@untold.works"

# 2. Inspect Customers tab — new row should appear
# 3. Click link in email, complete sign-in
# 4. Curl the cart endpoint
curl "$BASE_URL/api/customer/cart" -H "Cookie: <customer-session-cookie>"
```
Expected: 200, JSON `{ items: [], updated_at: "<ISO>" }`. New Customers row visible in sheet.

## Dependencies
**Requires:** P1.1 (Resend) — magic links must send.
**Blocks:** P1.3 (Trade pricing — needs `is_trade` flag), P1.4 (Promo code mutual exclusion — needs trade flag), P1.6 (Trade program — counts active trade customers), P1.13 (Factura Stripe bridge — links payment to customer record).

## Notes
- Keep staff and customer cookies separate — overlapping `next-auth.session-token` between two NextAuth instances on the same domain is a classic foot-gun. Set `cookies.sessionToken.name = '__Secure-cc-customer-session'`.
- Magic-link tokens are single-use, 24-hour TTL by default in NextAuth. Don't lengthen.
- Google OAuth consent screen should be branded "Counter Cultures Shop", not the staff app name.
- When trade-tier UX ships (v2), a logged-in trade customer's `tradeTier` is on the JWT — no extra fetch needed for catalog pricing.
- Backfill is idempotent: re-running on subsequent logins is a no-op since `customer_email` is already set.
