# [P2] P&L Mixed-Currency Gross-Profit Bug

> **Status:** PENDING · **Priority:** P2 · **Effort:** 4 hrs · **Branch:** `claude/fix-pnl-currency-bug`
> **Last updated:** 2026-05-12

## Why this matters
`/dashboard/reports/pnl` for April 2026 currently shows Gross Profit at 178.1%. A >100% gross margin is obviously nonsense and erodes Roger's and Antonia's trust in every other dashboard number. Until this is fixed, the P&L page is unusable for the very people it's built for.

## The problem (evidence)
- April 2026 view: GP = 178.1%.
- Revenue line: $230k USD.
- COGS line: $0 MXN + $109k USD (notice the split — that's the smoking gun).
- The GP calc divides total revenue by total COGS without normalizing the MXN/USD split, producing the inflated percentage.

## Scope
**In scope:**
- Normalize all monetary values to a single display currency (the user toggle already exists) BEFORE computing GP, margin, and totals.
- Use the documented FX source for conversion (banxico daily fix or equivalent already wired elsewhere).
- Add a guardrail: if any line is in an unexpected currency, log a warning and surface a visible "Currency mismatch detected" banner instead of silently producing junk.

**Out of scope:**
- Refactoring the underlying COGS allocation logic.
- Multi-currency presentation (we display in one currency at a time, controlled by the existing toggle).

## Files to touch
- `app/(dashboard)/dashboard/(portal)/reports/pnl/page.tsx`
- `app/lib/pnl.ts` (if it exists; otherwise create a thin helper module)
- `app/lib/fx.ts` (confirm the existing FX source supports the dates in question)
- `app/components/reports/currency-mismatch-banner.tsx` (new)

## The fix (step by step)
1. Locate the GP computation in `page.tsx`. Confirm it accepts raw rows from the P&L source.
2. Extract into `app/lib/pnl.ts`: `computePnl(rows, displayCurrency, fxRates)`. Convert every line's amount to `displayCurrency` using `fxRates[row.currency][displayCurrency]` (falling back to monthly average rate for the row's period).
3. Compute totals (revenue, COGS, GP, GP%) from the normalized rows only.
4. If any row has an unknown currency or missing rate, push a warning and render the `<CurrencyMismatchBanner />`.
5. Add unit tests in `__tests__/pnl.test.ts` covering: all-MXN, all-USD, mixed MXN+USD COGS, and a missing-rate case.
6. Re-render April 2026 page; confirm GP% is a believable single-digit-or-low-double-digit number.

## Acceptance criteria
- [ ] April 2026 GP% is plausible (between -20% and +60%, sanity range).
- [ ] Currency toggle correctly recomputes all totals.
- [ ] Mixed-currency input never produces >100% GP.
- [ ] Missing FX rate triggers banner, not a silent broken number.
- [ ] Unit tests pass.

## Verification
```bash
npm test -- pnl
```
Expected: all P&L tests green; navigate to `/dashboard/reports/pnl?month=2026-04` and visually confirm GP%.

## Dependencies
**Requires:** none.
**Blocks:** none.

## Notes
See `docs/finance/CLAUDE-FINANCE-RULES.md` for currency normalization rules — that doc specifies banxico as the FX source. Antonia is the SME for finance numbers; ping her to sanity-check the April result before closing.
