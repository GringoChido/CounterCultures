# [P1] Trade Program Dashboard — Replace Mock with Real Data

> **Status:** PENDING · **Priority:** P1 · **Effort:** 1 day · **Branch:** `claude/fix-trade-program-real-data`
> **Last updated:** 2026-05-12

## Why this matters
The Trade Program dashboard is the operational surface for approving, tracking, and serving Counter Cultures' highest-value customer segment — architects, designers, hospitality buyers who place orders 5–10x the average ticket. Right now the page is 100% theater: "Active Members: 47", "Pending Apps: 12", a table of hardcoded names like "Elena Martinez" who don't exist. Roger can't make decisions from fake data, Antonia can't reconcile trade revenue, and applicants who get approved don't actually receive their welcome email or a code — they're applauded into a void. Wiring this to real data is the difference between a working program and a Potemkin village.

## The problem (evidence)
- `app/(dashboard)/dashboard/(portal)/trade-program/page.tsx` declares `const tradeMembers = [{ name: 'Elena Martinez', ... }, ...]` — fully hardcoded.
- KPI cards show static `47`, `12`, `$2,420,000`, `34%` — no data fetcher attached.
- Approve/Reject buttons toggle local state only; no PATCH endpoint, no email, no code minting.
- No reference to the `Customers` tab (created in P1.2) or `Trade_Applications` tab.

## Scope
**In scope:**
- Replace all hardcoded data with real Sheets-backed reads.
- KPI cards driven by aggregated queries.
- Customer-360 cards rendered from `Customers` + `Trade_Applications`.
- Approve handler: PATCH application status, set `is_trade=true` on Customer, mint a `Trade_Code` in `Promo_Codes`, send welcome email via Resend.
- Reject handler: PATCH status, send polite-decline email.
- All actions logged to `Activity_Log`.

**Out of scope:**
- Trade-tier assignment UI (always `"default"` for v1).
- Per-member trade-revenue drill-down (link to Customer 360 instead).
- Bulk-approve UX.

## Files to touch
- Modify `app/(dashboard)/dashboard/(portal)/trade-program/page.tsx` — gut mock data, wire to fetchers.
- New `app/api/dashboard/trade-program/route.ts` — GET (list + KPIs), PATCH `/applications/:id` (approve/reject).
- New `app/lib/trade-applications.ts` — sheet reader/writer for `Trade_Applications` tab.
- Modify `app/lib/customer-sheet.ts` — `setCustomerTrade(email, { isTrade, tier })`.
- Modify `app/lib/email.ts` — add `sendTradeWelcomeEmail(customer, code)` and `sendTradeDeclineEmail(customer)`.
- New email templates: `trade-welcome.tsx`, `trade-decline.tsx` (React Email or simple HTML strings).
- Modify `app/lib/promo-codes.ts` — `mintTradeWelcomeCode(email)` (generates a per-customer one-time code, type `f&f`).

## Trade_Applications tab schema
(Exists or needs creating)
- `id` (PK, e.g., `TAPP-001`)
- `email`
- `business_name`
- `business_type` (architect | designer | hospitality | other)
- `website`
- `phone`
- `years_in_business`
- `expected_annual_volume`
- `status` (pending | approved | rejected)
- `submitted_at`
- `decided_at`
- `decided_by`
- `notes`

## The fix (step by step)
1. Confirm `Trade_Applications` tab exists in the CRM with the schema above. Create if missing.
2. Implement `app/lib/trade-applications.ts` with `listApplications(filter)`, `getApplication(id)`, `updateApplication(id, patch)`.
3. Implement `GET /api/dashboard/trade-program/route.ts`:
   - Active Members = COUNT(Customers WHERE `is_trade=TRUE`).
   - Pending Apps = COUNT(Trade_Applications WHERE `status='pending'`).
   - Trade Revenue (this month) = SUM(Pipeline WHERE stage='closed-won' AND customer.is_trade=TRUE AND closed_at IN current month).
   - Trade % = Trade Revenue / Total Revenue × 100.
   - `applications: [...]` — full pending list.
   - `members: [...]` — list of trade customers from Customers tab + their last-order date.
4. Implement `PATCH /api/dashboard/trade-program/applications/:id`:
   - Body: `{ action: 'approve' | 'reject', notes? }`.
   - If approve: `updateApplication(id, { status: 'approved', decided_at, decided_by })` → `setCustomerTrade(email, { isTrade: true, tier: 'default' })` (upsert Customer if not yet present) → `mintTradeWelcomeCode(email)` → `sendTradeWelcomeEmail({ email, code, signinUrl: BASE_URL + '/account/sign-in' })` → log activity.
   - If reject: `updateApplication(id, { status: 'rejected', decided_at, decided_by, notes })` → `sendTradeDeclineEmail(email, notes)` → log activity.
5. Rewrite the page component:
   - Use `useSWR` (or existing pattern) to fetch the GET endpoint.
   - Replace KPI cards with real numbers; show loading state.
   - Remove `tradeMembers` array. Render real members table.
   - Render applications table with Approve/Reject buttons; on click → mutation → optimistic UI refresh.
6. Author `trade-welcome.tsx` email: greeting, "Your trade pricing is now active", one-time welcome code, link to `/account/sign-in`.
7. Author `trade-decline.tsx`: polite "We weren't able to extend trade pricing at this time" + reason from notes.

## Acceptance criteria
- [ ] KPI cards reflect real counts from sheets (verify by adding a row and refreshing).
- [ ] No string "Elena Martinez" anywhere in source after this fix.
- [ ] Approve a pending application → Customers row gets `is_trade=TRUE`, Promo_Codes gets a new row, applicant receives welcome email at the address on file.
- [ ] Reject → applicant receives decline email, status updates.
- [ ] Activity_Log entries appear for both actions.
- [ ] Logged-in approved customer immediately sees trade pricing on PDPs (validates P1.3 wiring).
- [ ] Page renders <3s on cold lambda.

## Verification
```bash
# Seed an application
# Then:
curl -X PATCH "$BASE_URL/api/dashboard/trade-program/applications/TAPP-TEST-1" \
  -H "Cookie: <staff-session>" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve"}'
```
Expected: 200, Customers row updated, email arrives at the application's email address, Promo_Codes contains a new row with `type='f&f'`.

## Dependencies
**Requires:** P1.1 (Resend — sends welcome/decline emails), P1.2 (Customer accounts — `is_trade` field), P1.3 (Trade pricing — pricing must actually swap when `is_trade=true`).
**Blocks:** Real trade-revenue reporting in Sales Analytics (P1.14), trade-program marketing claims ("47 active trade partners" must be true).

## Notes
- Welcome code is single-redemption, no expiry — it's a "thanks for joining" gesture and gives one discount on first order, then they rely on the trade-pricing system going forward.
- Approval is irreversible-ish: revoking trade status is a manual sheet edit for now (rare event).
- If `setCustomerTrade` is called for an email not in Customers, upsert a stub row — first login completes the profile.
- Email-template TODO: include the customer's `business_name` for personalization.
- Do NOT delete the page during refactor — keep the URL stable; replace the body in-place to avoid breaking sidebar bookmarks.
