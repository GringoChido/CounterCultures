# [P1] Analytics — Replace Hardcoded Numbers with Real Queries

> **Status:** PENDING · **Priority:** P1 · **Effort:** 1 day · **Branch:** `claude/fix-analytics-real-data`
> **Last updated:** 2026-05-12

## Why this matters
The analytics surfaces (`/dashboard/sales-analytics`, `/dashboard/marketing-analytics`, `/dashboard/website-analytics`) lie. Sales Analytics shows `$2.42M revenue / 38 deals / 72% win rate` while the Pipeline shows `$0 closed-won` — flagrantly contradictory. Roger uses these pages for weekly decisions; he can't, because every meeting starts with "are these numbers real?" Marketing Analytics shows fabricated GA4 charts. Website Analytics is just a redirect to Marketing. Either we delete these pages or we wire them to real source-of-truth data — and given the operational importance, we wire them.

## The problem (evidence)
- `app/(dashboard)/dashboard/(portal)/sales-analytics/page.tsx` contains literal `const revenue = 2420000;` style declarations.
- `Pipeline` sheet currently has 0 rows with `stage='closed-won'` (per audit), contradicting the analytics page's "38 deals".
- Marketing Analytics charts are populated from a `mockMarketingData` constant, not GA4.
- Website Analytics is `redirect('/dashboard/marketing-analytics')` — adds zero value.

## Scope
**In scope:**
- Replace hardcoded data in Sales Analytics with real queries against `Odoo_Invoices` + Pipeline.
- Replace hardcoded data in Marketing Analytics with real GA4 queries via Google Analytics Data API.
- Delete Website Analytics route (or repurpose).
- Add a small "data freshness" timestamp to each card so users know how stale the value is.
- Cache aggressively (5–15 min) — these dashboards are not real-time.

**Out of scope:**
- Custom report builder.
- Per-channel attribution modeling.
- Cohort analysis.

## Files to touch
- `app/(dashboard)/dashboard/(portal)/sales-analytics/page.tsx` — gut mocks, wire to fetcher.
- New `app/lib/analytics-sales.ts` — `getSalesAnalytics(period)`.
- `app/(dashboard)/dashboard/(portal)/marketing-analytics/page.tsx` — wire to GA4 client.
- New `app/lib/ga4.ts` — Google Analytics Data API client.
- Delete `app/(dashboard)/dashboard/(portal)/website-analytics/page.tsx` (or 308 redirect away).
- `.env.example` — add `GA4_PROPERTY_ID`, reuse existing service-account credentials.
- New `app/api/dashboard/sales-analytics/route.ts` — cached endpoint.
- New `app/api/dashboard/marketing-analytics/route.ts` — cached endpoint.

## Real source-of-truth queries

### Sales Analytics
- **Revenue (period):** `SUM(Odoo_Invoices.amount_total) WHERE state='paid' AND invoice_date IN period`.
- **Closed-won deals (period):** `COUNT(Pipeline) WHERE stage='closed-won' AND closed_at IN period`.
- **Win rate:** `closed-won / (closed-won + closed-lost) over deals decided in period`.
- **Avg ticket:** revenue / closed-won count.
- **Top customer (revenue):** join Pipeline → Customers, group by email, sum revenue.
- **Trade vs Direct split:** group closed-won revenue by `customer.is_trade`.
- **Pipeline value:** `SUM(Pipeline.amount) WHERE stage NOT IN ('closed-won','closed-lost')`.

### Marketing Analytics (GA4)
- **Sessions, users, pageviews (period)** via Data API `runReport`.
- **Top pages** by pageviews.
- **Traffic sources** by `sessionSource/sessionMedium`.
- **Conversion events** matching `purchase`, `add_to_cart`, etc.

## The fix (step by step)
1. **Sales analytics fetcher** (`app/lib/analytics-sales.ts`):
   ```ts
   export async function getSalesAnalytics(period: 'mtd'|'qtd'|'ytd' = 'mtd') {
     const range = resolveRange(period);
     const [invoices, pipeline] = await Promise.all([loadOdooInvoices(range), loadPipeline(range)]);
     const paid = invoices.filter(i => i.state === 'paid');
     const closedWon = pipeline.filter(d => d.stage === 'closed-won' && inRange(d.closed_at, range));
     const closedLost = pipeline.filter(d => d.stage === 'closed-lost' && inRange(d.closed_at, range));
     return {
       revenue: sum(paid, 'amount_total'),
       closedWonCount: closedWon.length,
       winRate: closedWon.length / Math.max(1, closedWon.length + closedLost.length),
       avgTicket: sum(paid, 'amount_total') / Math.max(1, paid.length),
       tradeRevenue: sum(closedWon.filter(d => d.customer?.is_trade), 'amount'),
       directRevenue: sum(closedWon.filter(d => !d.customer?.is_trade), 'amount'),
       pipelineValue: sum(pipeline.filter(d => d.stage !== 'closed-won' && d.stage !== 'closed-lost'), 'amount'),
       asOf: new Date().toISOString(),
     };
   }
   ```
2. **API route** wraps with 10-min cache (`stale-while-revalidate`).
3. **Page rewrites** to call the route; each KPI card shows the value + a tiny "as of <timestamp>".
4. **GA4 client** (`app/lib/ga4.ts`):
   - Use `@google-analytics/data` SDK with the existing service account.
   - Service account needs Viewer role on the GA4 property (one-time setup).
   - `runReport({ property: 'properties/<GA4_PROPERTY_ID>', dateRanges, metrics, dimensions })`.
5. **Marketing analytics page** swaps mock charts for GA4 results. Use existing chart components.
6. **Website analytics:** delete `/dashboard/website-analytics/page.tsx`. If anyone has it bookmarked, add a `redirect('/dashboard/marketing-analytics')` in a `not-found.tsx` shim, OR drop entirely (preferred — P1.9 sidebar reorg already hides it).
7. **Empty-state messaging:** when period has no data, show "No closed-won deals in this period" instead of a $0 KPI without context.

## Acceptance criteria
- [ ] Sales Analytics KPIs match what's queryable from sheets — verified by manual SUM in the Pipeline/Invoices tabs.
- [ ] No hardcoded `2420000` / `38` / `0.72` / etc. constants remain in source.
- [ ] If Pipeline has 0 closed-won, Sales Analytics shows 0 (not 38).
- [ ] Marketing Analytics shows real GA4 sessions and top pages for the selected period.
- [ ] `as of <timestamp>` visible on each card.
- [ ] Website Analytics route deleted or properly redirected.
- [ ] Page TTFB < 2 s with cache warm.

## Verification
```bash
# Compare API to sheet sum
curl -s "$BASE_URL/api/dashboard/sales-analytics?period=mtd" -H "Cookie: <staff>" | jq '.revenue'
# Then sum Odoo_Invoices.amount_total WHERE state='paid' AND invoice_date in MTD — should match.

# GA4 sanity
curl -s "$BASE_URL/api/dashboard/marketing-analytics?period=mtd" -H "Cookie: <staff>" | jq '.sessions'
# Should be > 0 if GA4 is receiving real traffic.
```

## Dependencies
**Requires:** P1.2 (Customer accounts) for `is_trade` enrichment on closed-won deals.
**Blocks:** Weekly Review page (depends on Sales Analytics numbers being trustworthy), KPI emails / Roger's morning brief.

## Notes
- The fastest path to "data Roger trusts" is to (a) wire real data, (b) make the freshness timestamp prominent, (c) link each KPI to the underlying record list so he can drill in and verify.
- If GA4 setup blocks (service-account role missing), surface "GA4 not connected" empty state rather than a 500.
- All charts respect the period selector — default MTD, allow QTD/YTD.
- Future: add a "revenue forecast" model based on weighted pipeline (P2).
- After this fix, archive the screenshots of the old fake numbers — Roger may ask "why did it say $2.42M last week?"
