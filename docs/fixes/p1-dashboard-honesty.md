# Fix: Dashboard honesty — finance leads-access gap + fabricated analytics

> **Source:** MASTER-PLAN.md §6 Week-2 RE-TRIAGE, item 1 (the hardening batch), split **1b** — the no-sign-off half. Surfaced by the 2026-05-25 forensic audit (§1.5/D-7, D-8).
> **Companion:** fix-file **1a** (`docs/fixes/p1-security-endpoint-hardening.md`) covers the `follow-up-drip` cron gate + the WhatsApp-webhook signature. That one is separate because it touches **Sacred Surface #10** + in-motion processes (§0.4) and needs a recorded §0 YES. **Do NOT do 1a's work here.**
>
> **Risk: LOW.** No Sacred Surface item touched. No in-motion process (§0.4) touched. The dashboard is internal-staff, single-locale (no EN/ES parity needed). Smallest-possible-diff applies.

---

## §0 pre-flight (run BEFORE writing any code)

```
[ ] Read AGENTS.md + docs/SURGICAL-RULES.md + MASTER-PLAN.md §0, §1.5, §2, §6 Week-2
[ ] Confirm this item is still PENDING in §6 (not silently shipped — check the merge log)
[ ] Grep to confirm the symbols named below still exist before editing
[ ] Capture before-state evidence: screenshots of both analytics pages; the finance role's feature set
[ ] Confirm by grepping changed files against §2 that NO Sacred Surface item is touched
```

If any box can't be checked, STOP and resolve before coding.

---

## Scope

**IN**
- **A.** Fix the finance-role permission contradiction (can manage leads but can't view them).
- **B.** Replace fabricated / sample analytics numbers with honest "data pending — not yet connected" states on the marketing-analytics and sales-analytics dashboard pages.

**OUT — do NOT touch here**
- `app/lib/auth-options.ts` (Sacred Surface #4 / #11). Only `features.ts` role defaults.
- Wiring real marketing/social/campaign data sources — that's the Week-5 marketing layer. This fix only makes the *unwired* widgets honest, it does not connect new data.
- The cron + WhatsApp-webhook hardening — that's fix-file 1a.
- Any customer-facing surface.
- If scope grows >25% mid-session (§0.6), narrow back and file a follow-up.

---

## Part A — finance leads-access gap

**Problem (verified):** in `app/lib/features.ts`, the **finance** role defaults grant `manage_leads` but omit `view_leads` and `view_pipeline`. Result: a finance user (Antonina, `control@`) can edit leads via the API but gets **403 on the Leads / Pipeline pages** — an internally inconsistent role that will confuse the team on day one.

**Decision needed (Joshua — one line):** should finance have leads access at all?
- **YES (default):** add `view_leads` + `view_pipeline` to the finance role defaults so the role is internally consistent (manage implies view).
- **NO:** instead remove `manage_leads` from finance.

> Joshua's call recorded: ____________  (default to **YES** if unspecified)

**Change:** locate the finance role's feature list in `features.ts` (e.g. `FINANCE_FEATURES` / the `finance` entry in `ROLE_DEFAULTS`). Apply the decision above, using the **exact same canonical feature constants** the `sales`/`owner` roles already use (do not invent new keys). Verify the Leads and Pipeline pages actually read those gates.

---

## Part B — analytics honesty

**Problem (verified):**
- `app/(dashboard)/dashboard/(portal)/marketing-analytics/page.tsx` ships hardcoded `channelPerformance`, `campaignMetrics`, `funnelData`, `trafficSources`, `topPages`, and default KPI numbers (e.g. `"6,400"` visitors, `"42.3%"` bounce). Only the visitors chart + ~4 KPIs are wired to `/api/dashboard/marketing-analytics`; the rest is fabricated and is exported to CSV as if real.
- `app/(dashboard)/dashboard/(portal)/sales-analytics/page.tsx` falls back to `SAMPLE_REVENUE_TREND` when the live fetch is empty — rendering invented revenue.

**Change:**
- **KEEP** the widgets genuinely wired to a live endpoint (the visitors chart + the real KPIs).
- For every widget backed by a hardcoded/sample constant with **no** live source: replace the fabricated data with an explicit **"Data pending — source not yet connected"** empty state (a small shared placeholder component is fine). **Never show invented numbers.**
- **Remove fabricated rows from any CSV export** — export only real data; if there's none, export a header-only file with a note.
- Remove / neutralize the `SAMPLE_*` constants so they can't silently render again. Leave a `// TODO(week5-marketing): wire <source>` where a real source is planned.

---

## Files to touch
- `app/lib/features.ts` — Part A
- `app/(dashboard)/dashboard/(portal)/marketing-analytics/page.tsx` — Part B
- `app/(dashboard)/dashboard/(portal)/sales-analytics/page.tsx` — Part B
- *(optional)* a tiny shared placeholder under `app/(dashboard)/components/`

## Acceptance
- **Finance role:** signed in as finance, the Leads and Pipeline pages load (no 403) and view/manage are consistent. *(Or, if Joshua chose NO: finance no longer has `manage_leads` and the manage affordances are hidden.)*
- **Analytics:** neither page shows any fabricated number anywhere; unwired widgets show an honest "data pending" state; the genuinely-wired widgets are unchanged.
- CSV export contains only real data.
- `tsc --noEmit` clean; `npm run lint` clean on changed files; `npm run build` succeeds.
- Sacred Surface: none touched (prove by listing the changed files against §2).

## Verification
- Before/after screenshots of both analytics pages.
- Sign in as a finance user (or simulate the finance feature set) → confirm Leads + Pipeline load.
- Grep the two pages for the old sample-constant names → zero rendered references.

## Session-end report (mandatory — §0.7)
Use the `docs/SURGICAL-RULES.md` template verbatim, plus:
`**§0 compliance:** all four conditions met` (no Sacred Surface / in-motion process touched).
