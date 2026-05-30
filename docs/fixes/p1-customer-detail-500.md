# [P1] Customer detail page 500s ("Customer not found / HTTP 500") (bug #5)

> **Source:** Roger feedback 2026-05-26. Clicking the customer link from an order → a 500 crash page. Independent of the other quote fixes.
> **Risk: LOW** (dashboard UI hook fix + an optional read backstop). Not a Sacred Surface; no §0 YES needed for the hook fix.

## Root cause (verified)
A **Rules-of-Hooks violation** in `app/(dashboard)/dashboard/(portal)/customers/[id]/page.tsx`: the loading/error early `return` is at ~lines 194-219, but `const { user: currentUser } = useCurrentUser();` is called AFTER it at ~line 221. When the customer API returns non-200 (here a 404: `getCustomerProfile` returns null when the partner isn't in the `Odoo_Partners` mirror → `customers/[id]/route.ts:11-12`), React renders a different number of hooks across renders → "rendered fewer hooks than expected" → client tree crash → the "HTTP 500 / Customer not found" the user sees. Trigger: the partner (here Roger's own `res.partner`) isn't resolvable in the mirror.

## §0 pre-flight
```
[ ] Read AGENTS.md, docs/SURGICAL-RULES.md
[ ] Re-read customers/[id]/page.tsx (hook order vs the early returns) + customers/[id]/route.ts + getCustomerProfile
[ ] Before-state: the 500 page for the failing customer
```

## Scope
**Part A — the crash (required):** move `useCurrentUser()` and ALL other hooks ABOVE the early `return`s in `customers/[id]/page.tsx`, so hooks run unconditionally on every render (Rules of Hooks). This alone converts the crash into a clean, intended "Customer not found" state instead of a 500.

**Part B — the data backstop (recommended):** make `getCustomerProfile` (or the `customers/[id]/route.ts` handler) fall back to a **live Odoo `res.partner` read** when the partner isn't in the `Odoo_Partners` mirror, so customers like Roger's own record actually load instead of 404ing. (Reuse the existing Odoo client.) If a live read isn't clean here, at minimum confirm the missing partner is in the mirror.

**OUT:** the quote line-items / terms / image / attachments fixes (separate files). Don't change unrelated customer-page behavior.

## Acceptance
- The previously-500ing customer page loads (Part B) — or, at worst, shows a clean "Customer not found" with no crash (Part A) — never an HTTP 500.
- No Rules-of-Hooks warning in the console for that page.
- Other customer pages unchanged (parity). `tsc`/lint/build green.

## Verify
- Open the customer that was 500ing (ROGER FLOYD Williams from order S01858) → loads (or clean not-found), no crash; console clean.
- Spot-check another, already-working customer page → unchanged.

## Commit + DELETE-WHEN-DONE
- One commit. `rm` this fix-file. Exclude MASTER-PLAN/cruft. No push. Report the sha.

## Session-end report
Template + `**§0 compliance:** dashboard UI hook fix (+ optional partner live-read backstop); no Sacred Surface / in-motion process touched; before/after attached. C1/C2/C4 met.`
