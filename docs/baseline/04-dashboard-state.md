# 04 — Dashboard State

_last updated 2026-05-12_

Per-module state of the operator Dashboard at `/dashboard/*`. All findings from a live walkthrough on 2026-05-12 plus codebase audit. "Works" means the module renders real data from the source of truth and supports its core operator workflow. "Broken/hardcoded" means it renders but the data is invented or pulled from a stub. "Stub" means the route exists but the page is a placeholder.

## Sidebar inventory — ~22 modules across 7 sections

```
HOME
  Today
  Activity
SALES
  Pipeline
  Deals
  Customers
  Leads
  Quotes
  Trade Program
  Sales Analytics
OPERATIONS
  Orders
  Shipments
  Trafico (customs)
  Accounts Payable
  Purchases
  Vendors
  Inventory
  Finance
  Payments
CATALOG ADMIN
  Products
  Brands
MARKETING
  Inbox (Gmail)
  Email Campaigns       [SOON badge — actually built]
  Social Hub            [SOON badge — demo mode]
  Marketing & Traffic
  Website Analytics     (redirects to Marketing & Traffic)
  Content Calendar      (redirects to Social)
INSIGHTS
  P&L
  Weekly Review
OTHER
  Drive
  Odoo                  ["Retiring"]
  Design                (dev-only)
ADMIN
  Settings
  Users
```

## Today view — the KPI tile grid

Real numbers, pulled live from the CRM, rendered on `/dashboard`:

| Tile | Value | Source |
| --- | --- | --- |
| Overdue AR | **40 invoices** | `Invoices` tab where `due_date < today` |
| Stale quotes | **741** worth **$35M MXN** | `Quotes` not updated > N days |
| Ready to invoice | **79 deals** / **$1.2M MXN** | `Deals` in stage Won, no invoice |
| Awaiting vendor bill | **134** | `Purchases` received, no bill |
| POs stuck > 60 d | **1,036** | `Purchases` ordered, not received |
| Inventory gaps | **252** | `Products` flagged below safety stock |
| Pipeline value | **$28.2M** | Sum of open `Deals.amount` |
| Active deals | **93** | `Deals` where stage ∈ open states |

These all reflect real data. The contradiction problem starts the moment you click into the sales modules — see below.

## What works (production-ready or close)

### Accounts Payable — `/dashboard/accounts-payable`
- **210 pending vendor bills**, real data, clean column layout (vendor / PO / amount / due / status).
- Filter + sort + bulk-mark-paid functional.
- This is the module closest to "Antonia could open this tomorrow and run AP from it."
- Note: the Today tile says 134 awaiting vendor bill, AP queue says 210 pending. These count different things (134 = received-but-not-billed POs; 210 = bills entered but unpaid) — same direction, two different metrics. Naming should clarify.

### Inbox — `/dashboard/inbox`
- Real Gmail threads via per-user OAuth (see [02](./02-data-layer.md)).
- 5–8 s initial load (acceptable for an email view).
- Send / archive / mark-read all functional.

### Email Campaigns — `/dashboard/email-campaigns` [SOON badge but fully built]
- **6 campaigns** in the list, **44.2% average open rate** displayed.
- Real send history, opens, clicks.
- The SOON badge in the sidebar is misleading — this is the most polished marketing module in the build.

### Products / Inventory / Purchases / Vendors / Customers
- Solid operator tables with real data.
- CRUD wired through to CRM tabs.
- These are where the bulk of the actual operator hours go and they hold up.

### P&L — `/dashboard/profit-loss`
- Real revenue + cost numbers.
- **Gross-profit calc has a bug**: GP shown does not equal Revenue − COGS for the visible rows. Likely a column-mapping mistake in the aggregator. Doesn't block use, but the displayed GP cannot be trusted as posted.

## What's broken or hardcoded

### Trade Program — `/dashboard/trade`
- **100% fabricated data.** The "trade partners" list shows:
  - Elena Martinez
  - Coastal Living
  - Hacienda Renovations
  - Pacific Homes
- None of these exist in the CRM `Trade_Applications` tab. They are hardcoded in the component file.
- The data layer for Trade is partially real (see [02](./02-data-layer.md)) — `Trade_Codes` and `Trade_Applications` tabs exist and `/api/cart/trade-code` works. The Dashboard surface just hasn't been wired up.

### Sales Analytics — `/dashboard/sales-analytics`
- Shows **$2.42M revenue / 38 deals closed / 72% win rate.**
- Pipeline page next door shows **$0 closed** in the same period.
- Weekly Review shows **0.0% close rate**.
- Same data, three contradictory numbers. The Sales Analytics figures are almost certainly hardcoded — the values are too round and don't match any aggregate of `Deals` rows.

### Marketing & Traffic / Website Analytics
- Visitor counts, bounce rate, top-pages are **static** in the component.
- GA4 is installed on the public site (see [03](./03-performance.md)) but no GA4 Data API integration feeds these tiles.

### Notifications
- Template literals appear unsubstituted as text: e.g. `{issue_type}` rendered as the literal four characters plus braces.
- Many rows show `DEAL-__TEST_DEAL_W7_*` IDs — test fixtures from a workflow seed that never got cleaned up. See [05](./05-stale-inventory.md).

### Drive — `/dashboard/drive`
- "Failed to load" toast on every visit.
- The service-account Drive credential is live (uploads from the public site work). The failure is on the per-user OAuth side — the user's tokens may be missing the right scope, or the route is calling the wrong client.

### Odoo — `/dashboard/odoo`
- Every panel shows HTTP 429.
- The page banner reads "Retiring."
- Sidebar entry should be removed (or hidden behind a feature flag).

## Contradicting numbers across modules

Same metric, different module, different value:

| Metric | Value A | Value B | Notes |
| --- | --- | --- | --- |
| Active deals | 93 (Today) | 38 (Sales Analytics) | 38 is "closed this period" mislabeled as active, or hardcoded |
| Closed won | $0 (Pipeline) | $2.42M (Sales Analytics) | Sales Analytics likely fabricated |
| Close rate | 0.0% (Weekly Review) | 72% (Sales Analytics) | Same direction as above |
| Email open rate | 44.2% (Email Campaigns) | 0.0% (Marketing & Traffic) | Marketing & Traffic is static |
| AP backlog | 210 (AP queue) | 134 (Today) | Counting different things, but same label |
| Brand count | 168 (some widgets) | 151 (Brands page) | One reads CRM `Brands` mirror, the other reads `Brand Kit` directly |
| Payments | 4,674 (Payments) | 48 (Finance) | **Dual ledgers — see below** |

## Dual payment ledgers

The most important governance finding inside the Dashboard:

- `/dashboard/payments` reads **4,674 Odoo payment records** via the `Odoo_Payments` mirror.
- `/dashboard/finance` reads **48 manually-entered payment rows** from CRM `Payments` tab.
- There is **no reconciliation surface** between the two. No diff view, no "match" UI, no shared key.
- Antonia (Finance/AP — same person as "Tonina" in older docs) sees Finance. Sales sees Payments. The two roles look at the same business event through completely different lenses.

## SOON badges that mislead

| Module | Badge | Actual state |
| --- | --- | --- |
| Email Campaigns | SOON | **Fully built**, real campaigns, real metrics |
| Social Hub | SOON | Demo mode (mock posts, mock metrics) |
| Trade Program | (no badge) | 100% fabricated — *should* have a badge |
| Sales Analytics | (no badge) | Contradicts other modules — *should* have a badge |

The badge system is currently noise. Either remove it or use it consistently.

## Stub routes that should be removed or hidden

| Route | State | Should be |
| --- | --- | --- |
| `/dashboard/design` | Dev-only EntityCard preview | Behind `NODE_ENV !== 'production'` guard or in `_dev/` |
| `/dashboard/odoo` | Retiring, all 429 | Removed from sidebar |
| `/dashboard/content-calendar` | Silent redirect to `/dashboard/social` | Removed, sidebar link → `/social` directly |
| `/dashboard/website-analytics` | Silent redirect to `/dashboard/marketing-analytics` | Same |

Silent redirects are a particular waste — they confuse operators ("I clicked X but the page that opened says Y") and they bloat the route count.

## Integration health — from `/dashboard/settings`

The settings page exposes 9 integration toggles. **3 of 9 connected:**

| Integration | Status | Impact if used |
| --- | --- | --- |
| Google Sheets (service account) | Connected | Core read/write |
| Gmail (per-user OAuth) | Connected | Inbox works |
| Google Drive (service account) | Connected | Uploads work |
| Stripe webhook | **Secret unset** | Webhook events 503; payment-status callbacks dropped |
| Resend (transactional email) | **API key unset** | No transactional emails sent (order confirmations etc.) |
| WhatsApp | Disabled | No WhatsApp messaging |
| Meta Graph API | Not configured | No FB/IG posting from Social Hub |
| Cron probe key | Not set | No cron health check; if a cron silently dies, no alert |
| Odoo XML-RPC | "Retiring" / 429 | Hourly sync still running but every endpoint failing |

The Stripe and Resend gaps are the most consequential — checkout completes (payment-intent confirm) but the post-payment audit trail is missing, and no email confirmation goes out.

## Users tab — empty + bootstrap mode

`/dashboard/users` shows **zero rows**. The `Users` tab in the CRM is empty.

The auth callback in `app/auth/...` falls back to a **bootstrap rule**: any email with the `@countercultures.com.mx` domain is allowed in unrestricted. There is no allowlist check, no role enforcement, no per-user permissions.

Practically this means:

- Anyone who can obtain a `*@countercultures.com.mx` Google account can sign in
- Once signed in, every role-gated UI element is treated as "owner"
- Joshua (allowlist), Roger (owner), Antonia (finance), Javier and Ian (sales) all see the same UI
- No audit log records who edited what

Sources: live walkthrough of every Dashboard route 2026-05-12; codebase audit of `app/dashboard/**`, `app/api/dashboard/**`, `app/auth/**`, `app/lib/sheets/*`.
