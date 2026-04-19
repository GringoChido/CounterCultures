# Counter Portal — Dashboard Redesign (Option D)

> **PASTE THIS INTO A NEW CHAT TO EXECUTE.**
> Self-contained design + TDD plan. No prior conversation needed.
>
> Authored: 2026-04-18 by previous session after a visual + code audit of the live portal.

---

## 0. Bootstrap context for the new chat

**Read these first (in order, in full):**

1. `/Users/joshuasemolik/CLAUDE.md` — Joshua's global preferences
2. `/Users/joshuasemolik/Desktop/counter-cultures/CLAUDE_PROJECT_BRIEF.md` — what Counter Cultures is, the three players (Website / Dashboard / Drive), positioning, people
3. `/Users/joshuasemolik/Desktop/counter-cultures/MASTER_BUILD_ROADMAP.md` — 8-week shape; we are post-W5+W6 (Webchat v2 just shipped)
4. `/Users/joshuasemolik/Desktop/counter-cultures/DASHBOARD_CONSOLIDATION_SPEC.md` — earlier Roger-facing spec (the W1 sidebar regroup is largely shipped; the deal-card + ⌘K + notification bell items are still open)
5. This document

**Hard rules (immutable):**

- Repo: `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures`, branch `main`, push only when Joshua explicitly says
- Stack: Next.js 16 (App Router) + Tailwind v4 (`@theme inline` in `app/globals.css`) + Framer Motion + Zustand + Lucide icons
- TypeScript strict, no `any`, no comments explaining obvious code, no premature abstractions
- Sheet-backed everywhere; no sample data; sheet schema changes require Joshua's approval BEFORE writing
- Brand palette is **defined** in `globals.css` and **underused**: charcoal #1A1A1A, terracotta #C4725A, copper #B87333, sage #7A8B6F, stone #A89F91, linen #F5F0EB (page bg), sand #D4C5A9
- Fonts: `Cormorant Garamond` display, `DM Sans` body, `JetBrains Mono` mono — already wired
- Dev server pattern: `npm run dev`, port 3000 (or auto-port). Login with `joshua@untold.works` / `GringoChido1!`
- TDD style for this repo: round-trip scripts at `scripts/_test-*.ts` run via `tsx`; browser preview via Claude Preview MCP for UI verification
- Workflow: invoke `superpowers` skill at start. Phase 1 design is below — proceed to Phase 2 (TDD task plan with smaller granular steps) and Phase 3 (inline execution) after Joshua approves the proposal in §6 of this doc

---

## 1. Audit findings (what's actually on the screen)

Visual evidence: 4 screenshots taken on 2026-04-18 against the live preview at desktop width — Today, Pipeline (Sales view), Leads, plus the below-fold of Today.

### 1.1 Today page (the home screen the user lands on) — **C-** grade

**What renders:**
- Header: `Today` title + ⌘K search bar (huge, centered) + ⚡ Quick-Capture (bright yellow, competing with everything) + bell + avatar
- Greeting: `Good morning` + `Sunday, April 19`
- 5 KPI cards row: New Leads (6) · Pipeline Value ($12.3M) · Conversion Rate (12.5%) · Total Leads (31) · Stripe Revenue 30d ($91,541.9)
- Pipeline by Stage horizontal bar chart (~50% of fold-1 real estate)
- Below the fold: Recent Leads · Top Deals · Recent Activity — all cut by a wall of whitespace before they appear
- AI Chat widget **auto-opens** covering ~30% of the right side of the viewport on first load

**What's broken (severity in brackets):**

- **[CRITICAL]** Chat widget auto-opens on first mount, blocking the dashboard. The user wants to see *the dashboard* when they open the dashboard. Should be CLOSED-BY-DEFAULT, with a discoverable affordance (the existing FAB) or a one-time "open me first" pulse.
- **[HIGH]** The 5 KPI cards are **observation, not action**. "New Leads 6 · +25% vs last month" — what should Roger DO with this? The Today page is supposed to be the morning action list (per the consolidation spec §Today rewrite). It's currently a metrics dashboard.
- **[HIGH]** Conversion Rate, Total Leads, and Stripe Revenue (30d) are **weekly-review metrics**, not today metrics. They duplicate Weekly Review and Pipeline & Sales widgets. The consolidation spec already flagged this — the rewrite never fully landed.
- **[HIGH]** Pipeline by Stage chart is the largest visual element above the fold but it's **decorative, not actionable** — clicking a bar doesn't filter, drilling in needs a separate nav. Wasted viewport.
- **[MEDIUM]** The greeting block ("Good morning · Sunday, April 19") takes ~12% of fold-1 real estate but carries near-zero information. Roger knows what day it is.
- **[MEDIUM]** Below the fold: large empty whitespace before Recent Leads / Top Deals / Recent Activity render. Density is too low.
- **[MEDIUM]** Recent Activity is gated behind "Log" affordance instead of having a real "what happened in the last 24h" feed.
- **[LOW]** No surfaced overdue follow-ups, customs holds, payment reminders — exactly the things Roger needs first thing in the morning.

### 1.2 Sidebar — **B-** grade

**What renders:**
- Dark `bg-dash-sidebar` (charcoal-derived) full-height left column
- Counter Cultures wordmark + "COUNTER PORTAL" subhead at top
- Three groups: HOME (Today, Weekly Review) · LEADS & DEALS (Leads, Pipeline, Inbox, WhatsApp, Trade Program) · CATALOG (Brands, Products, Shipments & Customs)
- Sign Out at bottom

**What's broken:**

- **[HIGH]** Heavy dark left column on a light page **drags the eye left** all day long. F-pattern reading on a dashboard means the sidebar should be quietly present, not visually dominant. Other premium dashboards (Linear, Vercel, Notion) use a subtle bg-tone-shifted sidebar, not full charcoal.
- **[HIGH]** Missing groups: no MARKETING group, no INSIGHTS group (the consolidation spec proposes 6 groups: HOME / LEADS & DEALS / CATALOG / MARKETING / INSIGHTS / OPERATIONS). Currently visible: only 3 groups, ~11 items. Several pages exist (overview, weekly-review, content-calendar, social, email-campaigns, blog-manager, marketing-analytics, sales-analytics, website-analytics, reports, finance, drive, stripe, customs) but most are **invisible to the sidebar**.
- **[MEDIUM]** No active-item indicator beyond the orange pill. No icon-only collapsed mode visual cue.
- **[LOW]** Counter Cultures wordmark uses the same display font as the storefront — good, but it competes with the page title in the header (which is also display). Tone down one of the two.

### 1.3 Header — **C** grade

**What renders:**
- Page title (left, e.g., "Today") in display serif
- Centered search bar with ⌘K hint (oversized — ~50% of header width)
- ⚡ Quick-Capture button (bright yellow, no label, requires hover to know what it is)
- Bell (no badge state visible)
- Avatar pill: "R" circle + "Roger Williams · Owner"

**What's broken:**

- **[HIGH]** The ⚡ button is the loudest visual element on the page after the page title. It needs to recede when not actively used (subtle outline + label on hover) OR move to the FAB stack with the chat widget.
- **[MEDIUM]** Search bar is too prominent. ⌘K is the entry point — a small icon button would do.
- **[MEDIUM]** Bell has no badge state today. When the alert engine ships (W8), it needs a real notification count + dot for severity.
- **[MEDIUM]** The page title in the header duplicates the H1 on most pages. Pick one location.
- **[LOW]** Avatar shows role ("Owner") that adds no value at-a-glance.

### 1.4 Pipeline (Sales view) — **B** grade

**What renders:**
- 4 KPI cards: Active Pipeline · Weighted Value · Closed Won · Active Deals
- "Deal Journey" header + "From discovery to delivery"
- 5-column Kanban: Discovery (3) · Design & Scope (2) · Proposal/Negotiation (1) · Fulfillment (2) · Delivered (4)
- Sparse cards, only 1-2 visible per column at this width

**What's broken:**

- **[CRITICAL]** Sales Pipeline still has 5 stages including Fulfillment + Delivered, even though the consolidation spec required trimming to 3 (Discovery / Design & Scope / Proposal·Negotiation). W1's pipeline trim never landed. Fulfillment + Delivered are duplicated by the Operations Pipeline's 14 stages.
- **[HIGH]** Card content is anemic: Deal ID + value + project name + day-in-stage + a copper bar — no contact, no brand chips (despite W2 brand-tagging shipping), no SLA indicator, no risk flag.
- **[MEDIUM]** "Deal Journey · From discovery to delivery" — pretty, but doesn't earn the real estate at the top of a Kanban.
- **[LOW]** No view toggle visible to switch Sales ↔ Operations even though the consolidation spec called for it.

### 1.5 Leads — **B+** grade (the strongest page)

**What renders:**
- 4 KPI cards: Total Leads (31) · New (6) · Qualified (10) · Won (0)
- Tab strip: All Leads · Stale Leads (1)
- Filter row: All Status · All Sources · All Contact Types · Export · Add Lead
- Search bar
- Table with sortable columns: Name · Brands · Source · Status · Type · Last Contact · Interest · Value · Follow-Up
- Status pills color-coded (new=copper, contacted=copper-faded, qualified=lime, proposal=pink)
- Real data populated from Leads sheet

**What's broken (small, fixable):**

- **[MEDIUM]** Brands column shows "—" for all visible rows even though brand-tagging shipped. Likely a column-name mismatch (`brand_slugs` not joined to Brand_Kit display name).
- **[LOW]** Filter chips don't show their active state in the URL — refresh loses filters.
- **[LOW]** Status pill colors don't match the brand palette (using lime/pink instead of sage/copper).

### 1.6 Cross-cutting tech findings

- **`bg-dash-*` / `text-dash-*` / `border-dash-*` utility classes are used hundreds of times across the dashboard but ARE NOT DEFINED in `app/globals.css` `@theme`.** Only `--color-brand-*` tokens exist. The dashboard is rendering on Tailwind's silent-fallback behavior plus inherited browser defaults. **This is the single biggest tech-debt item.** Means: when we redesign, we have a clean slate to actually define the dash design system properly.
- The brand palette (charcoal / terracotta / copper / sage / stone / linen / sand) is **rich and on-brand** — premium, warm, Mexican-meets-architectural. **It is barely used in the dashboard.** Sage and stone never appear. Sand only as the page bg via `--color-background`. We have the palette; we just haven't applied it.
- Display font (Cormorant Garamond) is loaded but only used for the storefront. The dashboard could lean on it for high-impact moments (page H1, KPI numbers).

---

## 2. Design principles for v2 (this is the spine of the redesign)

These are the principles the redesign honors. Every section in §3-§5 traces back here.

1. **Action over observation.** A dashboard is a tool, not a museum. Every widget on the home screen must answer "what should I do next?" not "what happened?". Metrics belong on Weekly Review and Pipeline & Sales.

2. **Eyes land on copy, not chrome.** Sidebar should be quietly present; the page should be the protagonist. Move from heavy dark sidebar → tone-shifted (linen + 4-6% darker) sidebar.

3. **Brand consistency is a feature, not vanity.** Counter Cultures sells premium goods to architects who look at hundreds of dashboards a week. Ours should feel like our storefront — warm, confident, restrained. The terracotta / copper / sage / stone / sand palette is the differentiator. **Use it.**

4. **Density without clutter.** B2B operators (Roger) work this dashboard 4-6h/day. Pretty whitespace = less productivity. Measured density via tighter row heights, smaller paddings, real data in every visible square inch.

5. **One canonical card.** Deal cards, Lead cards, Trafico cards, Shipment cards — same shape, different fields. Roger learns one mental model.

6. **Nav matches workflow, not org chart.** 6 groups (HOME · LEADS & DEALS · CATALOG · MARKETING · INSIGHTS · OPERATIONS) per the consolidation spec. Today / Weekly Review at the top — that's where the morning starts.

7. **Progressive disclosure.** Every cell that can drill down does. Click a KPI card → filtered list. Click a Kanban card → slideout. Click an inbox thread → thread detail. **No "View all →" links;** the whole card is the link.

8. **Loading + empty + error states are first-class.** Empty Trafico_Items? "No items yet — add the first via Customs." Skeletons during load. Errors with a retry CTA.

9. **The chat widget is a tool, not a popup.** Closed by default. Discoverable but never blocking. When opened, lives at FAB scale; expand-to-sidebar mode for deep work only.

10. **Mobile-aware, not mobile-first.** Roger uses WhatsApp on his phone constantly, but the dashboard is a desktop tool. Optimize for 1280-1920px viewport. Mobile gets the 4 critical pages (Today, Inbox, WhatsApp, Deal detail) — skeleton compatibility for the rest.

---

## 3. Visual language (the design system v2 — define before redesigning surfaces)

### 3.1 Tokens — define these in `app/globals.css` `@theme inline`

```css
@theme inline {
  /* Brand palette (existing) — keep */
  --color-brand-charcoal: #1A1A1A;
  --color-brand-terracotta: #C4725A;
  --color-brand-terracotta-dark: #A85D48;
  --color-brand-copper: #B87333;
  --color-brand-sage: #7A8B6F;
  --color-brand-stone: #A89F91;
  --color-brand-linen: #F5F0EB;
  --color-brand-sand: #D4C5A9;

  /* NEW dashboard surface tokens — derived from brand */
  --color-dash-bg: #FAF7F2;          /* page background — slightly cooler than linen */
  --color-dash-surface: #FFFFFF;     /* card / surface */
  --color-dash-surface-2: #F5F0EB;   /* nested surface (linen) */
  --color-dash-sidebar: #FAF7F2;     /* CHANGED — sidebar is now light, NOT dark */
  --color-dash-sidebar-active: #EFE7DA;  /* selected nav item bg */
  --color-dash-sidebar-hover: #F1EBE0;
  --color-dash-border: #E8E0D2;      /* warm border, not gray */
  --color-dash-border-strong: #D4C5A9; /* sand border for emphasis */

  --color-dash-text: #1A1A1A;        /* charcoal */
  --color-dash-text-secondary: #5C5650;
  --color-dash-text-muted: #8C857C;

  --color-dash-accent: #B87333;      /* copper — primary action */
  --color-dash-accent-soft: #F0E2CF; /* tinted accent bg */
  --color-dash-success: #7A8B6F;     /* sage */
  --color-dash-warn: #C4725A;        /* terracotta (warm warning) */
  --color-dash-danger: #A85D48;      /* terracotta-dark */
  --color-dash-info: #6E7A85;        /* steel — for neutral info */

  /* Spacing rhythm */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 10px;   /* cards default */
  --radius-lg: 16px;   /* slideouts, modals */

  /* Type scale */
  --text-display-xl: 2.5rem;     /* 40 — Cormorant — page H1 */
  --text-display-lg: 1.875rem;   /* 30 — Cormorant — section H2 */
  --text-body-lg: 1rem;          /* 16 — DM Sans */
  --text-body: 0.875rem;         /* 14 */
  --text-label: 0.75rem;         /* 12 */
  --text-micro: 0.6875rem;       /* 11 — KPI labels */
}
```

**Critical change: the sidebar goes from dark charcoal to light linen.** This is the single biggest visual lever. It restores the page as the protagonist and removes the all-day eye-drag.

The active-nav indicator becomes a **left-edge copper bar** + soft tinted bg (`--color-dash-sidebar-active`) — same affordance as Linear / Vercel.

### 3.2 Typography rules

- **Page H1:** Cormorant Garamond, 2.5rem, weight 400 — only ONE per page (in the page body, NOT the header)
- **Section H2:** Cormorant Garamond, 1.875rem, weight 400
- **Card title:** DM Sans, 0.875rem, weight 600
- **Card body:** DM Sans, 0.875rem, weight 400
- **KPI number:** Cormorant Garamond, 1.875rem, weight 400 — display-styled numbers feel premium (not "tabular admin sans")
- **Label / micro:** DM Sans, 0.75rem, uppercase, letter-spacing 0.05em
- **Mono:** JetBrains Mono — IDs, SKUs, pedimento numbers, JSON in tool chips

### 3.3 Component primitives to (re)build

| Primitive | Replaces | Spec |
|---|---|---|
| `<KpiCard>` | `app/(dashboard)/components/kpi-card.tsx` | Cormorant number + DM Sans label + delta chip + optional trend sparkline. Click = navigate to filtered list. Border `dash-border`, hover `dash-border-strong`. |
| `<EntityCard>` | none (NEW) | Single canonical card for Lead / Deal / Shipment / Trafico / Trade-app. Slots: id+value (top), title (H3), contact row, brand chips, status badge, SLA bar (optional), 3 action icons. Used in Kanban + table-row-expand + Today widgets. |
| `<DataTable>` (existing — keep, restyle) | `app/(dashboard)/components/data-table.tsx` | Tighter row height (44 → 36px), warm dividers, sticky header, persist filter state to URL. |
| `<SlideOut>` (existing — keep, restyle) | `app/(dashboard)/components/slide-out.tsx` | Width 480 desktop / full-screen mobile. Always closes via Escape. Header pinned, footer with primary action pinned. |
| `<EmptyState>` | none (NEW) | Icon + title + 1-line copy + 1 primary CTA. Replaces all "No X yet" plain-text moments. |
| `<StatusPill>` | `app/(dashboard)/components/status-badge.tsx` | Reduce to 6 brand-palette variants: new (copper), in-progress (sage), warning (terracotta), danger (terracotta-dark), success (sage-dark), neutral (stone). Drop the lime/pink/blue zoo currently in use. |
| `<NavItem>` | inside `sidebar.tsx` | Lightweight — icon + label + optional badge count. Active: copper left bar + tinted bg. |
| `<TopBar>` (sub-component of header) | `dashboard-header.tsx` | Page H1 in body, NOT header. Header becomes: hamburger (mobile) + breadcrumb + search icon (small) + notifications + avatar. |
| `<ActionFab>` | mix of widget + ⚡ + chat | Bottom-right vertical stack: ⚡ Quick Capture (top) + 💬 Chat (bottom). Both subtle when idle, copper on hover. |

---

## 4. Sidebar v2 (the second-biggest visible change)

**Visual:** light linen bg, charcoal text, copper accent for active. Narrower (220px from 240px).

**Structure (6 groups, ~14 items):**

```
🏠 HOME
├─ Today               ← lands here
└─ Weekly Review

👥 LEADS & DEALS
├─ Leads               (badge: stale count)
├─ Pipeline            [Sales / Operations tabs]
├─ Inbox               (badge: unread from CRM contacts)
└─ WhatsApp            (badge: unread)

📦 CATALOG
├─ Brands
├─ Products
└─ Shipments & Customs (badge: at-risk count)

📣 MARKETING
├─ Email Campaigns
├─ Social Hub          (consolidated Content + Social per spec)
└─ Blog

📊 INSIGHTS
├─ Pipeline & Sales    (was Sales Analytics)
└─ Marketing & Traffic (consolidated Website + Marketing per spec)

⚙️ OPERATIONS
├─ Trade Program
├─ Drive
└─ Finance / Stripe / Odoo
```

(Reports group is **dissolved** per the spec — Health Checklist → Weekly Review, Export buttons live on each parent page.)

Footer pinned: ⚙️ Settings · Sign Out (small icon row), avatar removed from sidebar (it lives in header).

---

## 5. Today page v2 (the redesign that matters most — "is the home screen designed effectively?")

The Today page is the single most important surface. Roger opens the portal here every morning. It must answer: **"What needs me today?"** in 10 seconds.

### 5.1 Anatomy (top to bottom, single column on left, action stack on right)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Header (light, slim)                                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Tuesday, Apr 19 · Buenos días Roger    [Today]                       │  ← combined greeting + day
│                                                                      │
│ ┌──────────────────────────────────────────────────────────┐ ┌─────┐ │
│ │ 🔥 NEEDS YOU                                              │ │MORE│ │
│ │ ─────────────────────────────────────                     │ │     │ │
│ │ • DEAL-118 customs clearance overdue 36h — call broker    │ │ Pip │ │
│ │ • LEAD-204 follow-up due today (3 days old)               │ │ +18%│ │
│ │ • Shipment SHP-00042 ETA shifted +4d — notify customer    │ │     │ │
│ │ • $48,200 MXN duties due Apr 19                           │ │ Rev │ │
│ │ ─────────────────────────────────────                     │ │ -10%│ │
│ │ 0 items in last 24h were not auto-handled.                │ │     │ │
│ └──────────────────────────────────────────────────────────┘ │ Lead│ │
│                                                              │ +25%│ │
│ ┌──────────────────────────────────────────────────────────┐ │     │ │
│ │ ⏱ NEW SINCE LAST CHECK (5 things)                         │ │ Deal│ │
│ │ ─────────────────────────────────────                     │ │ 12 ▲│ │
│ │ • Lead from Showroom Walk-in (Casa de Luna)               │ └─────┘ │
│ │ • DEAL-110 moved Discovery → Proposal                     │         │
│ │ • Email from gabor@arqgoded.mx — re: Quote Request        │         │
│ │ • Stripe deposit received: DEAL-118 ($45K MXN)            │         │
│ │ • WhatsApp message: Hotel Rosewood SMA                    │         │
│ └──────────────────────────────────────────────────────────┘         │
│                                                                      │
│ ┌─────────────────────────┐ ┌─────────────────────────┐             │
│ │ TODAY'S ACTIVE DEALS     │ │ MORNING SALES HEALTH      │           │
│ │ (top 5, EntityCard rows) │ │ (6/8 checks passing)      │           │
│ └─────────────────────────┘ └─────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 Design rules

- **NO greeting block taking 12% of fold** — combine greeting + date + day into a single 28pt line: `Tuesday, Apr 19 · Buenos días Roger`. Bilingual greeting because Counter Cultures is bilingual.
- **NO 5-card KPI row above the fold.** KPIs collapse into a vertical "MORE" stack on the right (4 small cards instead of 5 wide ones), de-emphasized. The stars of the show are the action lists.
- **The "NEEDS YOU" widget is the new hero.** Pulled from: customs holds > 24h (Trafico_Events), overdue follow-ups (Leads.next_followup < today), shipment delays (Trafico.delay_days >= 3), payments due (Deal_Payments.status = pending AND deadline < +3d). Empty state: "No fires today. ☕ Nicely done." (genuinely earned, not corporate-cheerful).
- **The "NEW SINCE LAST CHECK" widget shows the last 24h delta.** Filtered from Activity_Log + Email_Activity + Trafico_Events. Cap at 5; "View all →" goes to a notifications page. Each line is clickable → opens the relevant entity slideout.
- **Today's Active Deals** uses the new canonical `<EntityCard>`. Top 5 by SLA risk (highest day-in-stage / nearest follow-up). Click row → Pipeline slideout opens with the deal pre-selected.
- **Morning Sales Health** moves here (per the consolidation spec — it was on Weekly Review but Today is when Roger actually wants the morning check). 6/8 checks passing → click for the failing 2.
- **Pipeline by Stage chart is REMOVED from Today.** It belongs on Pipeline & Sales. Chart != action.
- **Recent Activity (the wall of activity below the fold) is REMOVED from Today.** It was duplicate-content with NEW SINCE LAST CHECK. Activity_Log gets its own page (`/dashboard/activity`) for deep history.

### 5.3 Empty / loading states

- **No "needs you" items today** → "No fires today. ☕ Nicely done." (sage tone, small)
- **No "new since last check" items** → "All quiet on the inbound. Last update: {time}." (stone tone)
- **No active deals** → "Pipeline is empty. [+ New Deal]"
- **Loading** → 4 skeleton blocks of the same shape, NOT a spinner

---

## 6. Implementation plan (Phase 2 — TDD-shaped tasks)

12 tasks → 8 commits. Estimated 3-4 hours execution. Each task is a small commit-worthy chunk.

### Foundational (do these first — they unblock everything else)

**Task 1 — Define dash-* tokens in `app/globals.css` `@theme`**
- Add the full token block from §3.1
- Bump `globals.css` version comment
- No JSX changes
- Verify: every existing `bg-dash-*` / `text-dash-*` / `border-dash-*` class now resolves to the new value (browser preview spot-check 4 pages)
- Commit: `feat(design): define dashboard color + spacing tokens (Tailwind v4 @theme)`

**Task 2 — Sidebar v2: light bg + 6 groups + missing items**
- Refactor `app/(dashboard)/components/sidebar.tsx`
- Light linen bg, copper left-bar active state, narrow to 220px
- Add 3 missing groups (MARKETING / INSIGHTS / OPERATIONS) with their existing routes
- Move Trade Program from LEADS & DEALS → OPERATIONS per spec
- Drop avatar from sidebar (lives in header now)
- Verify: browser preview, sidebar items count = 14; click each, no 404s
- Commit: `feat(design): sidebar v2 — light surface + 6 groups + missing modules`

**Task 3 — Header v2: minimal**
- Refactor `app/(dashboard)/components/dashboard-header.tsx`
- Remove page title from header (becomes the page H1 in body)
- Search button (icon only with ⌘K hint), small
- Notifications bell with badge slot (real count later — empty for now)
- Avatar pill on the right (no role line)
- Move ⚡ Quick-Capture into a new `<ActionFab>` bottom-right stack with the chat widget
- Commit: `feat(design): header v2 — minimal, page title moves to body`

**Task 4 — `<ActionFab>` component**
- New `app/(dashboard)/components/action-fab.tsx`
- Bottom-right vertical stack: ⚡ Quick Capture (top) + 💬 Chat (bottom)
- Both subtle copper-outline when idle, filled on hover
- Chat widget auto-open removed (now opens on FAB click only, **closed by default**)
- Commit: `feat(design): ActionFab — Quick Capture + Chat in one stack`

### Component primitives

**Task 5 — `<KpiCard>` v2**
- Refactor `app/(dashboard)/components/kpi-card.tsx`
- Cormorant number, DM Sans label
- Required prop: `href` (every KPI is a link to a filtered list)
- Optional `delta` chip + sparkline (later)
- Commit: `feat(design): KpiCard v2 — Cormorant numbers, link-by-default`

**Task 6 — `<EntityCard>` (NEW)**
- Create `app/(dashboard)/components/entity-card.tsx`
- Single canonical shape per §3.3
- Variants: lead / deal / shipment / trafico / trade-app
- Used by: Today active deals, Pipeline Kanban, Leads detail, Trafico list, Today "NEEDS YOU"
- Storybook-style demo route at `/dashboard/_design` (dev only) showing all variants
- Commit: `feat(design): EntityCard — single canonical card for all entities`

**Task 7 — `<EmptyState>` + `<StatusPill>` cleanup**
- New `app/(dashboard)/components/empty-state.tsx`
- Refactor `status-badge.tsx` → 6 brand-palette variants only
- Sweep replace lime/pink/blue badges across portal
- Commit: `feat(design): EmptyState + brand-palette StatusPill`

### Today page rewrite

**Task 8 — Today page v2: `<NeedsYou>` widget**
- Refactor `app/(dashboard)/dashboard/(portal)/overview/page.tsx` — replace the 5-KPI + chart with the new layout
- Build `<NeedsYou>` widget reading from: `Trafico_Events` (customs holds >24h), `Leads` (overdue follow-ups), `Traficos` (delay_days≥3), `Deal_Payments` (pending + deadline<+3d)
- Empty state: "No fires today. ☕ Nicely done."
- Commit: `feat(today): NeedsYou hero widget`

**Task 9 — Today page v2: `<NewSinceLastCheck>` + `<TodayActiveDeals>`**
- Build `<NewSinceLastCheck>` reading Activity_Log + Email_Activity + Trafico_Events for last 24h, cap 5
- Build `<TodayActiveDeals>` using `<EntityCard>` rows, top 5 by SLA risk
- Move Sales Health Checklist from Reports/Weekly Review → Today right-rail
- Strip the old chart + Recent Activity blocks
- Commit: `feat(today): activity feed + active deals + sales health rail`

**Task 10 — Today right-rail KPI stack (collapsed from 5 to 4)**
- Vertical stack of 4 KpiCard small variants: Pipeline · Revenue (24h delta) · New Leads (24h) · Active Deals
- Each links to its drill-down page
- Commit: `feat(today): right-rail KPI stack (de-emphasized)`

### Final

**Task 11 — Pipeline trim + standardized Deal Card**
- Trim Sales Pipeline from 5 stages to 3 (Discovery / Design & Scope / Proposal·Negotiation) — migrate the 6 mis-staged deals (per the consolidation spec migration table)
- Replace inline deal card with `<EntityCard variant="deal">`
- Add view toggle Sales ↔ Operations
- Commit: `feat(pipeline): trim to 3 stages + EntityCard standardization`

**Task 12 — Final smoke + design doc execution log**
- Browser preview: load Today, Pipeline (both views), Leads, Inbox, Brands, Shipments — verify visual consistency
- `npx tsc --noEmit` clean
- `npm run build` — Netlify-ready
- Append §7 "Execution log" to this doc with deviations + commit SHAs
- Commit: `docs(design): execution log + final smoke for dashboard v2`

---

## 7. Risks + open questions for the new chat to ask Joshua before code

These are the calls I deliberately did NOT make in this design — flag them at the start of the new chat, get explicit answers, then proceed.

1. **Sidebar light vs dark.** I'm proposing **light** (linen). Some users will love it; some will say it loses contrast. Confirm: does Joshua want to commit to light, OR keep dark with a different fix (narrower / more subtle)?
2. **`<EntityCard>` slot count.** I'm proposing 6 slots (id+value, title, contact row, brand chips, status, SLA bar). Joshua should sign off on the slots before Task 6 builds it — getting them wrong means rebuilding everything that consumes the card.
3. **Today's "NEEDS YOU" data sources.** The 4 sources (Trafico_Events / Leads.next_followup / Traficos.delay_days / Deal_Payments) make sense, but a few are sheets that don't exist yet (Deal_Payments) or are sparsely populated. Surface this so Joshua either populates them or scopes them out for v2.
4. **Pipeline stage migration.** The consolidation spec requires migrating 6 mis-staged deals (Sales Fulfillment + Delivered) to the Operations Pipeline. The migration mapping is defined; the script isn't written. Confirm Joshua wants this migration to run as part of Task 11.
5. **The chat widget auto-open default.** I'm proposing CLOSED by default. v1 was OPEN. This is the single biggest UX change for users who actually liked the auto-open. Confirm.
6. **Cormorant for KPI numbers.** Display serif numbers feel premium but some operators prefer DM Sans (more "data-y"). Joshua to A/B if uncertain — easy to revert.
7. **Token names.** I propose `--color-dash-*` for the dashboard surface tokens. Some prefer semantic names (`--color-surface`, `--color-canvas`). Confirm naming convention.

---

## 8. New chat bootstrap prompt (paste this verbatim into the new chat)

---

**Hi Claude. I want to redesign the Counter Cultures dashboard.**

Read these in order, in full, before doing anything:

1. `/Users/joshuasemolik/CLAUDE.md`
2. `/Users/joshuasemolik/Desktop/counter-cultures/CLAUDE_PROJECT_BRIEF.md`
3. `/Users/joshuasemolik/Desktop/counter-cultures/MASTER_BUILD_ROADMAP.md`
4. `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/docs/superpowers/specs/2026-04-18-dashboard-redesign.md`

Then invoke the `superpowers` skill. The design (Phase 1) is already written in §1-§5 of that doc. Your job:

1. Confirm you've read all 4 files with a 3-line summary of each
2. Ask me the 7 open questions in §7 of the redesign doc — one at a time
3. Once I've answered, write the Phase 2 TDD task plan (use the §6 task list as the spine, but break each task into atomic 2-5min steps with exact file paths + verification criteria)
4. Wait for my approval on the plan
5. Execute inline, same TDD pattern as W5 + Webchat v2 (round-trip scripts where possible, browser preview verification for UI)
6. Commit after each task with conventional messages. Do NOT push until I explicitly say so.

Repo: `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures` (branch `main`, currently 8 commits ahead of origin/main from Webchat v2 — do NOT push those either; they're mine to push when ready).

Dev login: `joshua@untold.works` / `GringoChido1!`. Preview server should already be running; if not, `npm run dev` from the repo root.

When you're done, you'll have:
- A new design system (`bg-dash-*` tokens that actually exist)
- A light-sidebar dashboard that doesn't feel like a generic admin template
- A Today page that actually answers "what should I do today?"
- A canonical `<EntityCard>` used everywhere
- A trimmed 3-stage Sales Pipeline
- A chat widget that doesn't blast you in the face on first load

Let's go.

---
