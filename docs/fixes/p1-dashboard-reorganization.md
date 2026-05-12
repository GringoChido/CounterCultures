# [P1] Dashboard Reorganization — Role-Based Sidebar

> **Status:** PENDING · **Priority:** P1 · **Effort:** 2 days · **Branch:** `claude/fix-dashboard-reorganization`
> **Last updated:** 2026-05-12

## Why this matters
The current sidebar shows ~22 items across 8 sections to every user regardless of role. Roger (CEO) sees an Accounts Payable view he never opens; Antonia (Finance) wades through Sales analytics she doesn't own; Javier and Ian see Settings and P&L they have no business touching. The cognitive cost is enormous — every login starts with a hunt — and the page also still surfaces stub routes (`/design`, `/odoo`, `/content-calendar`, `/website-analytics`) that lead nowhere, and "SOON" badges on features that are actually live. A role-based sidebar with hidden stubs and accurate labels is the single highest-leverage UX fix in the dashboard.

## The problem (evidence)
- `app/(dashboard)/components/sidebar.tsx` renders all entries unconditionally — no role gating.
- Pipeline + Sales are buried under `INSIGHTS` despite being core sales surfaces.
- Two Finance entries exist (Finance and Payments) confusing both finance and non-finance users.
- Routes `/design`, `/odoo`, `/content-calendar`, `/website-analytics` link to empty stubs.
- Email Campaigns is labeled "SOON" but the route is built and functional; Social Hub shows "SOON" but is Demo Mode.

## Scope
**In scope:**
- Role-based item filtering via `useFeatures()` hook + `ROLE_DEFAULTS` map.
- Hide stub routes entirely.
- Fix badge labels (SOON / DEMO / BETA / LIVE accuracy).
- Reorganize sections: top-level SALES, FINANCE, OPERATIONS, INSIGHTS, SETTINGS.
- Consolidate duplicate Finance entries.
- Move Pipeline & Sales out of INSIGHTS to SALES top-level.

**Out of scope:**
- Per-user customization ("favorite" pinning) — defer.
- Sidebar collapse memory in cookie — already works.
- New routes — only reorganize existing.

## Files to touch
- `app/(dashboard)/components/sidebar.tsx` — render filtered by role.
- `app/lib/features.ts` — extend `ROLE_DEFAULTS` map; add `useFeatures()` hook (or extend if exists).
- `app/lib/auth-options.ts` — confirm role is stamped on session (it is, but verify the new feature keys are surfaced).
- `app/(dashboard)/layout.tsx` — ensure session is hydrated before sidebar render.
- `app/(dashboard)/components/sidebar.config.ts` (new, if not already extracted) — canonical NAV definition with `requiredFeatures: string[]` per item.

## Role → visible items
**Owner (Roger):** Today, Pipeline, Weekly Review, P&L, Customers, Sales Analytics, Settings.
**Finance (Antonia):** Today, Accounts Receivable, Accounts Payable, Invoices, Payments, P&L, Vendors, Purchase Orders, Inbox.
**Sales (Javier, Ian):** Today, Pipeline, Customers, Orders, Quotes, Products, Inbox, WhatsApp.
**Joshua (allowlist):** Everything — current view (`*` feature flag).

## Badge rules
- `LIVE`: in production, real data, used by the team. (No badge — default state.)
- `BETA`: working but feedback-wanted (Email Campaigns post-fix).
- `DEMO`: visible UI but no real data (Social Hub).
- `SOON`: not yet built (use sparingly).
- Stub routes that are SOON: HIDE entirely instead of badging.

## The fix (step by step)
1. **Extract NAV config** to `sidebar.config.ts`:
   ```ts
   export const NAV = [
     { section: 'WORKSPACE', items: [
       { label: 'Today', href: '/dashboard/today', feature: 'today' },
       { label: 'Inbox', href: '/dashboard/inbox', feature: 'inbox' },
     ]},
     { section: 'SALES', items: [
       { label: 'Pipeline', href: '/dashboard/pipeline', feature: 'pipeline' },
       { label: 'Customers', href: '/dashboard/customers', feature: 'customers' },
       { label: 'Orders', href: '/dashboard/orders', feature: 'orders' },
       { label: 'Quotes', href: '/dashboard/quotes', feature: 'quotes' },
       { label: 'Products', href: '/dashboard/products', feature: 'products' },
       { label: 'WhatsApp', href: '/dashboard/whatsapp', feature: 'whatsapp' },
     ]},
     { section: 'FINANCE', items: [
       { label: 'Accounts Receivable', href: '/dashboard/ar', feature: 'ar' },
       { label: 'Accounts Payable', href: '/dashboard/ap', feature: 'ap' },
       { label: 'Invoices', href: '/dashboard/invoices', feature: 'invoices' },
       { label: 'Payments', href: '/dashboard/payments', feature: 'payments' },
       { label: 'P&L', href: '/dashboard/pnl', feature: 'pnl' },
       { label: 'Vendors', href: '/dashboard/vendors', feature: 'vendors' },
       { label: 'Purchase Orders', href: '/dashboard/purchase-orders', feature: 'purchase-orders' },
     ]},
     { section: 'INSIGHTS', items: [
       { label: 'Weekly Review', href: '/dashboard/weekly-review', feature: 'weekly-review' },
       { label: 'Sales Analytics', href: '/dashboard/sales-analytics', feature: 'sales-analytics' },
       { label: 'Marketing Analytics', href: '/dashboard/marketing-analytics', feature: 'marketing-analytics', badge: 'BETA' },
       { label: 'Email Campaigns', href: '/dashboard/email-campaigns', feature: 'email-campaigns', badge: 'BETA' },
       { label: 'Social Hub', href: '/dashboard/social', feature: 'social', badge: 'DEMO' },
     ]},
     { section: 'OPERATIONS', items: [
       { label: 'Trade Program', href: '/dashboard/trade-program', feature: 'trade-program' },
       { label: 'Drive', href: '/dashboard/drive', feature: 'drive' },
       { label: 'Settings', href: '/dashboard/settings', feature: 'settings' },
     ]},
   ];
   // Stubs intentionally omitted: /design, /odoo, /content-calendar, /website-analytics, /dashboard/finance (deprecated)
   ```
2. **Define `ROLE_DEFAULTS`** in `features.ts`:
   ```ts
   export const ROLE_DEFAULTS: Record<Role, string[]> = {
     owner: ['today','pipeline','weekly-review','pnl','customers','sales-analytics','settings'],
     finance: ['today','ar','ap','invoices','payments','pnl','vendors','purchase-orders','inbox'],
     sales: ['today','pipeline','customers','orders','quotes','products','inbox','whatsapp'],
     allowlist: ['*'],
   };
   ```
3. **`useFeatures()` hook** returns the set the user can see; supports `*`.
4. **Sidebar render**: filter `NAV[].items` where `feature ∈ allowed` (or `'*'`). Drop empty sections.
5. **Hide stubs**: remove `/design`, `/odoo`, `/content-calendar`, `/website-analytics` entries entirely. Add a 410 Gone or 308 redirect at those route files so direct visits don't 404 confusingly.
6. **Consolidate Finance**: `/dashboard/finance` is deprecated (P1.8) — drop from nav.
7. **Move Pipeline & Sales** out of INSIGHTS. Pipeline now under SALES.
8. **Fix badges**: Email Campaigns from SOON → BETA. Social Hub from SOON → DEMO.

## Acceptance criteria
- [ ] Roger logs in → sees only 7 items in his nav.
- [ ] Antonia logs in → sees only finance-relevant items.
- [ ] Javier/Ian log in → see only sales-relevant items.
- [ ] Joshua sees everything (allowlist).
- [ ] No stub routes appear in any user's nav.
- [ ] Email Campaigns shows BETA, not SOON.
- [ ] Social Hub shows DEMO.
- [ ] Direct-URL visits to stubs return 308 to `/dashboard/today` (not a hard 404 page).
- [ ] Pipeline appears under SALES, not INSIGHTS.

## Verification
```bash
# Run dev server, log in as each role via dev impersonation.
# For each role, assert the visible sidebar items match the spec.
# Visit a stub URL:
curl -i "$BASE_URL/dashboard/design"
# Expected: 308 → /dashboard/today
```

## Dependencies
**Requires:** P1.7 (Notifications fixed before reorg promotes the counter), P1.8 (Finance deprecation banner shipped).
**Blocks:** P2 personalization (favorites, custom order).

## Notes
- Role detection comes from `auth-options.ts` callbacks — confirm `session.user.role` is one of `'owner' | 'finance' | 'sales'`. Allowlist is Joshua and anyone in `STAFF_ALLOWLIST` env var.
- Keep "Today" pinned as item #1 for every role — it's the universal landing.
- When in doubt about a label, default to its current name to keep muscle memory intact.
- Stub deletion: hide from nav now, plan a code-cleanup pass in P2 to delete route files (out of scope here).
