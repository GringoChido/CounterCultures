# [P1] Dashboard simplification — Phase 1: trim the nav to the cockpit, demote the dead surfaces

> **Source:** LEAN-ON-ODOO-PLAN.md §4 (the usefulness pass). Kicks off the next build stage. **Goal: make the dashboard SIMPLER** — show only the surfaces staff actually use day-to-day; send create/edit to Odoo; remove dead/demo/unwired pages from the nav.
> **Risk: LOW.** Nav + page-level only. No Sacred Surface, no in-motion process. **Reversible:** demote (redirect/hide) rather than delete.
> *(Joshua leads the VISUAL redesign of the kept surfaces in a later phase — this phase is structure, not styling.)*

## §0 pre-flight
```
[ ] Read AGENTS.md, docs/SURGICAL-RULES.md (archived in MASTER-PLAN.md), LEAN-ON-ODOO-PLAN.md §0 + §4
[ ] Find the dashboard nav/sidebar config (the component that lists the portal routes) and read it
[ ] Confirm none of the changes touch a Sacred Surface system (these are nav + dead-page demotions only)
[ ] Capture before-state: a screenshot of the current dashboard nav
```

## Scope

**1. KEEP + keep prominent — the daily cockpit (do NOT touch their logic):**
`overview` · `orders` (+ detail/preview/quote-print) · `customers` (+ 360) · `vendors` · `leads` · `accounts-receivable` · `accounts-payable` · `invoices` · `payments` · `reports` + `reports/pnl` · `pipeline` · `shipments` · `settings` (+ users, tax-rates) · `odoo` (the bridge) · `stripe` · search (⌘K).

**2. CUT from the nav + demote the page (redirect to `/dashboard/overview` or hide behind a flag — keep the code, don't delete):**
- `email-campaigns` — Klaviyo is OUT; sample data only.
- `social` — demo mode.
- `marketing-analytics` · `website-analytics` · `sales-analytics` — no real data source wired; already show honest empty states. Remove from the primary nav (or tuck under a single "Analytics (coming soon)" entry).
- `drive` sub-routes (`drive/folder/[id]`, `drive/my-drive`, `drive/shared`, `drive/shared-drives`, `drive/starred`) — heavy, and the main one was the broken "Failed to load." Keep at most a single working entry if it's used for attachments; demote the rest.
- `design` — dev/preview artifact, not an ops tool.

**3. FLAG for Joshua (do NOT cut without his yes — leave in nav, add a comment in the fix):**
`content-calendar` · `blog-manager` · `trade-program` (admin) · `customs` · `weekly-review` · `inbox`. These may or may not be used — Joshua confirms keep/cut before they're removed.

**4. CREATE/EDIT entry points → Odoo (verify the pivot held):** any "New …" nav item or button creates in Odoo (deep-link), and record views offer "Open in Odoo." (Already shipped in `84eb9a9` — just confirm the nav reflects it.)

**OUT:** the kept pages' internal logic; styling/visual redesign (Joshua leads later); anything in Odoo; the storefront.

## Acceptance
- The dashboard nav shows only the cockpit (§ scope 1) + the flagged-pending items (§ scope 3); the dead/demo/unwired surfaces (§ scope 2) are removed from the nav and their pages redirect or are hidden (not reachable as live tools).
- No kept page's behavior changed; no Sacred Surface touched.
- `tsc` clean; lint clean on changed files; `npm run build` succeeds.
- Before/after screenshot of the nav.

## Verify
- Nav before/after: dead surfaces gone, cockpit intact, flagged items still present (pending Joshua's keep/cut).
- Visit a demoted route directly (e.g. `/dashboard/social`) → redirects/hidden, no error.

## Commit + report
- One commit. `rm docs/fixes/p1-dashboard-simplify-phase1.md`. Exclude MASTER-PLAN.md / LEAN-ON-ODOO-PLAN.md / cruft. No push (or push on Joshua's go). Report the sha + which routes you demoted vs flagged.

## Session-end report
Use the template, plus: `**§0 compliance:** dashboard nav simplified, dead surfaces demoted (reversible); no Sacred Surface / in-motion process touched; cockpit logic unchanged. C1/C2/C4 met.`
