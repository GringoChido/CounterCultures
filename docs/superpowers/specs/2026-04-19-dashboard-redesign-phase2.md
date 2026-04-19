# Counter Portal — Dashboard Redesign Phase 2 (⌘K + Notifications)

> **PASTE THIS INTO A NEW CHAT TO EXECUTE.**
> Self-contained design + TDD plan. No prior conversation needed.
>
> Authored: 2026-04-19 by previous session after Phase 1 design system shipped.

---

## 0. What's already done (Phase 1 — completed 2026-04-18/19)

Phase 1 of Option D shipped 8 commits:

```
7af4bee  feat(pipeline): migration script + execution log — Phase 2 complete
3cc7dee  feat(today): page rewrite — NeedsYou hero + activity feed + active deals + right-rail KPI stack
765d792  feat(design): EmptyState + brand-palette StatusPill cleanup
85f7955  feat(design): EntityCard — single canonical card for lead/deal/shipment/trafico/trade-app
8afa185  feat(design): KpiCard v2 — hero/compact variants, link-by-default, brand palette
01931f4  feat(design): header v2 + ActionFab — minimal header, FAB stack, chat closed-by-default
bf89a5a  feat(design): sidebar v2 — light surface + 6 groups + missing modules
26725ca  feat(design): define dashboard color + spacing + type tokens (Tailwind v4 @theme)
```

**This means Phase 2 stands on:**
- A real design system (`--color-dash-*` tokens defined in `app/globals.css` `@theme inline`)
- A light-linen sidebar with 6 groups
- A minimal header that already has a `<Bell>` slot (no badge logic yet — that's Phase 2)
- A FAB stack on bottom-right (chat lives here; notification flyouts can too if needed)
- `<EntityCard>` canonical card (Lead / Deal / Shipment / Trafico / Trade-app variants)
- `<EmptyState>` + 6-variant brand-palette `<StatusPill>`
- Today page is now action-first (NeedsYou hero + 24h activity feed + active deals)

**Don't redesign anything from Phase 1. Build on it.**

---

## 1. Bootstrap context (what the new chat must know)

**Read these first (in order, in full):**

1. `/Users/joshuasemolik/CLAUDE.md` — Joshua's global preferences
2. `/Users/joshuasemolik/Desktop/counter-cultures/CLAUDE_PROJECT_BRIEF.md` — what Counter Cultures is
3. `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/docs/superpowers/specs/2026-04-18-dashboard-redesign.md` — Phase 1 design + audit (now executed); read for context only — design principles in §2 still apply to Phase 2
4. This document

**Hard rules (immutable):**

- Repo: `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures`, branch `main`
- Stack: Next.js 16 (App Router) + Tailwind v4 + Framer Motion + Zustand + Lucide
- TypeScript strict, no `any`
- Sheet-backed everywhere; no sample data; sheet schema changes require Joshua's approval BEFORE writing
- TDD style: round-trip scripts at `scripts/_test-*.ts` for backend; Claude Preview MCP for UI
- Workflow: invoke `superpowers` skill at start
- Dev login: `joshua@untold.works` / `GringoChido1!`
- Push only when Joshua explicitly says

---

## 2. What's already in place that Phase 2 builds on

### 2.1 ⌘K — `app/(dashboard)/components/command-palette.tsx` (519 lines, EXISTS)

**Currently:**
- Already mounts in the layout (active and bound to ⌘K)
- Searches: navigation routes, **`SAMPLE_LEADS`**, **`SAMPLE_PIPELINE`**, products from sheets
- **Critical issue: uses SAMPLE_LEADS / SAMPLE_PIPELINE** (violates the no-sample-data hard rule). Already flagged.
- Renders results in a flat list grouped by entity type
- No keyboard-shortcut hints visible per result
- No "recent items" memory
- Missing entity types: Shipments, Traficos, Brands, Blog posts, Email campaigns, Contacts, Trade applications

### 2.2 Notifications — `app/(dashboard)/components/dashboard-header.tsx`

**Currently:**
- `<Bell>` icon renders in the header (slot reserved)
- No badge count, no dropdown, no click handler
- No `/dashboard/notifications` page
- No `Notifications` sheet
- The Today page's `<NeedsYou>` widget already aggregates the same kind of data the bell would surface — Phase 2 must NOT duplicate that logic; it must SHARE it

---

## 3. Phase 2 scope (the actual work)

### 3.1 ⌘K Global Search v2

**Behavior:**
- Open with `⌘K` / `Ctrl+K` from anywhere in `/dashboard/*` (already wired)
- Single search box; instant filter as the user types
- Results grouped by entity type with a subtle copper section header
- Keyboard nav: `↑↓` to move, `Enter` to open, `⌘+digit` to jump to a section, `Esc` to close
- Recent items: top section shows last 5 entities the user opened (persisted to localStorage `cc_palette_recent`)
- Each result is an `<EntityCard variant="search">` mini (single line: icon + name + meta) — reuse Phase 1 card primitive
- Empty state: brand-cohesive `<EmptyState>` with example queries
- Loading state: skeleton rows (no spinner)
- Click outside / Esc → close + return focus to wherever it came from

**Search across (8 entity types):**

| Type | Source | Match fields | Result icon |
|---|---|---|---|
| Lead | live `/api/dashboard/leads` (already auth-gated) | name, email, phone, company-from-interest, brand_slugs | `Users` |
| Deal | live `/api/dashboard/pipeline` | id, name, contactName, contactCompany, brand_slugs | `Kanban` |
| Trafico | live `/api/dashboard/traficos` | TRF_ID, Trafico_Number, Pedimento_Number, Broker_Name | `Truck` |
| Shipment | live `/api/dashboard/shipments` | Shipment_ID, Tracking, Brand, Carrier | `Package` |
| Brand | live `/api/dashboard/brands` (Brand_Kit Sheet) | slug, name, tagline_en | `Award` |
| Product | live `/api/dashboard/products` (already wired in current palette) | sku, brand, name, category | `Package` |
| Contact | derive from Leads + Pipeline + Trade_Applications (no separate Contacts sheet yet — Phase 3) | name, email | `User` |
| Blog post | live `/api/dashboard/blog-posts` (or articles lib) | title, slug, brand_slugs | `FileText` |

**Optional Gmail-like modifiers (nice-to-have, not blocking):**
- `lead:` / `deal:` / `brand:` / `trafico:` — restrict scope
- `from:gabor@arqgoded.mx` — across Lead.email + Deal.contactEmail + Trafico.broker_email
- Defer to Phase 3 if it adds friction

**Architecture:**
- New `app/lib/search.ts` — fetches each entity type in parallel, normalizes to `SearchResult` type (`{ id, type, title, subtitle, href, meta? }`), debounced + cached for 60s in-memory
- Refactor `command-palette.tsx`: drop SAMPLE_LEADS / SAMPLE_PIPELINE imports, consume `search.ts`, render via `<EntityCard variant="search">`
- localStorage `cc_palette_recent` (last 5, capped, wiped on Sign Out same as chat history)

### 3.2 Notification Bell + History

**Bell behavior (in header):**
- Badge count: total unread alerts (recompute on each header mount + every 60s)
- Severity dot color: red if any Critical, amber if any High, sage if all Info, no dot if zero
- Click bell → flyout dropdown shows the last 10 alerts grouped by audience (Roger / Finance / Customer-facing recap)
- Each alert row: severity dot · short title · time-ago · click → opens the relevant entity slideout
- "See all →" at bottom → navigates to `/dashboard/notifications`

**`/dashboard/notifications` page:**
- Full timeline (all alerts, all time)
- Filters: by audience, by severity, by source (customs / follow-up / payment / delay / email)
- Each row: severity dot · title · entity link · time · ack button (if not yet acked)
- Empty state via `<EmptyState>`

**Data model — DECISION NEEDED (see §4 Q3):**

Option A — Compute on the fly (no new sheet):
- Each page load reads from existing sources (Trafico_Events / Leads.next_followup / Traficos.delay_days / Deal_Payments) and synthesizes the alert list in memory
- ✅ No schema change; ✅ no duplicate data
- ❌ Can't track "acked / unread" state; ❌ can't snooze; ❌ slow at scale

Option B — Persist a `Notifications` sheet:
- New sheet (~9 cols: notification_id, severity, audience, title, body, source_entity_type, source_entity_id, status, created_at, acked_at)
- Bell + history page read from the sheet
- A nightly cron + on-write triggers from `Trafico_Events` etc. populate it
- ✅ Tracks ack/snooze; ✅ fast reads; ✅ audit trail
- ❌ Schema change (needs your approval); ❌ duplicates source data

**My recommendation: Option B**, populated via a writer helper invoked from the same trigger points as `appendTraficoEvent` (so when a Trafico hits `customs_hold > 24h`, both an event row and a notification row land). Same shared logic feeds the Today `<NeedsYou>` widget and the bell.

### 3.3 Cross-cutting

- Both surfaces use the new `dash-*` tokens (zero new colors)
- Both use existing `<EntityCard>`, `<EmptyState>`, `<StatusPill>` primitives — no new components except a tiny `<NotificationItem>` (single-line variant)
- Both auth-gated under `/api/dashboard/*` middleware (already in place)
- Bell + ⌘K both live in the existing header — no layout changes

---

## 4. Open questions for the new chat to ask Joshua before code

Ask these ONE AT A TIME. Wait for each answer.

1. **⌘K result scope.** Phase 2 design says 8 entity types. Joshua: is that right, or trim/expand? Specifically: should "Contact" wait until a real `Contacts` sheet exists (currently derived from Leads + Pipeline + Trade_Applications)?

2. **Search modifiers (`lead:`, `from:`, `brand:`).** Ship in Phase 2 or defer to Phase 3? *(Recommend defer — adds learning curve; basic fuzzy works for 90% of queries.)*

3. **Notifications data model — Option A (compute) or Option B (persist `Notifications` sheet)?** *(Recommend B — but B requires Joshua's schema approval per the hard rule. If B, get sign-off on the 9-column schema before any code.)*

4. **Notification severity tiers — how many?** Spec has 4 (Critical / High / Normal / Info). The shipments alert engine spec has 3 (Critical / High / Normal). Keep aligned with shipments spec → use 3? *(Recommend 3 — match the existing alert engine spec.)*

5. **Ack / snooze / dismiss.** Three patterns; which?
   - (a) Ack only (mark as seen, stays in history)
   - (b) Ack + snooze (re-surface in N hours)
   - (c) Ack + dismiss (gone forever)
   *(Recommend (a) only for v1. Snooze + dismiss in Phase 3.)*

6. **Notification sources for v2.** Same 4 as Today's `<NeedsYou>` (customs > 24h / overdue follow-ups / shipment delays ≥ 3d / payments due) OR also include Activity_Log + Email_Activity + Trafico_Events? *(Recommend: same 4 as NeedsYou — bell mirrors Today widget. Activity history is /dashboard/activity later.)*

7. **Recent-items memory in ⌘K.** Persist top 5 to localStorage `cc_palette_recent`, wiped on Sign Out (same as chat history)? Or persist server-side per user? *(Recommend localStorage — matches existing chat history pattern.)*

---

## 5. Phase 2 task plan (TDD-shaped — the spine)

7 tasks → 6 commits. Estimated 2-3 hours.

### Foundational

**Task 1 — Search lib + live data**
- Create `app/lib/search.ts` with `searchAllEntities(query: string): Promise<SearchResult[]>` that fetches Leads + Pipeline + Traficos + Shipments + Brands + Products + Contacts (derived) + Blog in parallel, normalizes to `SearchResult`, dedupes, scores by relevance
- Round-trip test `scripts/_test-search.ts` — call `searchAllEntities("residencial")` and assert ≥1 result with `type='deal'`
- Commit: `feat(search): live cross-entity search lib (replaces SAMPLE_* in palette)`

**Task 2 — CommandPalette refactor**
- Edit `app/(dashboard)/components/command-palette.tsx`: remove `SAMPLE_LEADS` + `SAMPLE_PIPELINE` imports, swap with `searchAllEntities` call, add 250ms debounce, add Recent section (read localStorage `cc_palette_recent`), keyboard shortcuts hint per row
- Render results as `<EntityCard variant="search">` mini-rows
- Empty state via `<EmptyState>`
- Loading state: 4 skeleton rows
- Browser preview: open ⌘K, search "residencial", confirm Deal result lands; open a result; reopen ⌘K, confirm Recent shows it
- Commit: `feat(search): CommandPalette v2 — live data, recent items, EntityCard rows`

### Notifications data model (gated by Q3 answer)

**Task 3a (if Option A) — In-memory aggregator**
- Create `app/lib/notifications.ts` with `getActiveNotifications()` that reads the same 4 sources as `<NeedsYou>` (customs holds, overdue follow-ups, delays, payments due) and returns `Notification[]`
- Refactor Today `<NeedsYou>` to consume this same lib (DRY)
- Commit: `feat(notifications): in-memory aggregator (shared with NeedsYou widget)`

**Task 3b (if Option B) — Notifications sheet + writer + reader**
- DESIGN APPROVAL FIRST — show Joshua the 9-column schema
- Scaffold the sheet in CRM Sheet (script `_create-notifications-sheet.ts`)
- Create `app/lib/notifications.ts` with `appendNotification(...)`, `listNotifications(opts)`, `ackNotification(id)`
- Round-trip test verifies append + list + ack
- Wire writers into the existing trigger points (Trafico status changes, etc.)
- Commit: `feat(notifications): Notifications sheet + writer + reader (Option B)`

### UI

**Task 4 — `<NotificationBell>` component**
- Create `app/(dashboard)/components/notification-bell.tsx`
- Reads notifications via lib, computes badge count + severity dot color
- Click → flyout dropdown (positioned absolute under bell), shows last 10 grouped by audience
- Each row: severity dot · title · time-ago · click opens entity
- "See all →" → `/dashboard/notifications`
- 60s auto-refresh
- Replace inline `<Bell>` in `dashboard-header.tsx` with `<NotificationBell />`
- Commit: `feat(notifications): NotificationBell — badge + flyout`

**Task 5 — `/dashboard/notifications` page**
- New route at `app/(dashboard)/dashboard/(portal)/notifications/page.tsx`
- Full timeline of notifications, filters (audience / severity / source), ack button per row
- Sidebar entry already exists? If not, add to "Operations" group? Or no sidebar entry — only reachable via bell "See all" + bell badge? *(Recommend: no sidebar entry; bell is the only entry point.)*
- Empty state via `<EmptyState>`
- Commit: `feat(notifications): /dashboard/notifications history page with filters + ack`

### Final

**Task 6 — Final smoke + execution log**
- Browser preview: ⌘K opens, searches live, recent items work; bell shows badge, flyout opens, history page lists + filters
- `npx tsc --noEmit` clean (filter `routes.d [0-9].ts`)
- `npm run build` passes
- Append §6 "Execution log" to this doc
- Commit: `docs(design): Phase 2 execution log + final smoke results`

---

## 6. Risks + design notes

- **Search performance:** 8 parallel fetches per palette open could be slow at scale. Cache each entity-list call for 60s. If still slow, move filtering server-side via a single `/api/dashboard/search?q=` endpoint in Phase 3.
- **Notification noise:** if Option B writers fire on every Trafico_Event, the sheet could grow fast. Cap to alerts-only (skip pure status_change events). Snooze + dedupe (same notification within 1h = update, not duplicate) saved for Phase 3.
- **Bell + Today `<NeedsYou>` must use the SAME source lib.** Otherwise you get the Today page saying "3 fires" and the bell saying "5 fires" — instant trust killer. Task 3 must be the single source feeding both.
- **Mobile:** ⌘K stays desktop-first (rarely opened on phone). Bell needs a mobile-tappable target — confirm it stays in the mobile header.

---

## 7. New chat bootstrap prompt (paste this verbatim)

---

```
Hi Claude. I'm executing **Phase 2 of 2** of a Counter Cultures
dashboard redesign. Phase 1 (design system reset + sidebar v2 +
header v2 + EntityCard + Today rewrite + Pipeline trim) shipped
across 8 commits ending at 7af4bee. Phase 2 = ⌘K global search
upgrade + notification bell + /dashboard/notifications history.

DO NOT redesign anything from Phase 1. Build on it.

READ THESE 4 FILES IN FULL, IN ORDER, BEFORE DOING ANYTHING:

1. /Users/joshuasemolik/CLAUDE.md
2. /Users/joshuasemolik/Desktop/counter-cultures/CLAUDE_PROJECT_BRIEF.md
3. /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/docs/superpowers/specs/2026-04-18-dashboard-redesign.md
4. /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/docs/superpowers/specs/2026-04-19-dashboard-redesign-phase2.md

That last file is THIS phase's full spec — what's already in
place (§2), what to build (§3), open questions (§4), task plan
spine (§5).

THEN:

1. Invoke the `superpowers` skill.

2. Confirm you've read all 4 files with a 3-line summary of each.

3. Ask me the 7 open questions in §4 of the Phase 2 doc — ONE AT
   A TIME. Wait for each answer. Question 3 (Option A vs B for
   notifications data model) is the most consequential — if I
   pick Option B, you must also get explicit schema approval on
   the 9 columns before any sheet code lands.

4. Once all 7 are answered, write the atomic TDD task plan to:
     docs/superpowers/specs/2026-04-19-dashboard-redesign-phase2-plan.md
   Use the §5 task list (7 tasks → 6 commits) as the spine. Break
   each task into 2-5min steps with exact file paths, verification
   commands, and expected output. No placeholders.

5. Wait for my approval on the plan.

6. Execute INLINE, same TDD pattern as Phase 1 + Webchat v2:
   - Round-trip scripts (scripts/_test-*.ts) for backend code
   - Browser preview verification via Claude Preview MCP for UI
   - Typecheck after each task: `npx tsc --noEmit` (filter out
     `routes.d [0-9].ts` stale files)

7. Commit after each task with conventional messages
   (feat: / refactor: / chore: / fix: / docs:). Co-author line:
   "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"

8. **DO NOT push** until I explicitly say "push".

REPO + ENV:

- Repo: /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures
- Branch: main (working tree should be clean and up-to-date with
  origin/main since Phase 1 was pushed)
- Stack: Next.js 16 App Router + Tailwind v4 + Framer Motion +
  Zustand + Lucide
- TypeScript strict, no `any`, no comments explaining obvious code
- Dev login: joshua@untold.works / GringoChido1!
- Preview server: should already be running. If not: `npm run dev`
  from repo root
- Sheet rule: schema changes need explicit approval BEFORE writing
  (see Q3 — this is likely to come up)
- Sample-data rule: NONE — sheet-backed everywhere. The current
  CommandPalette imports SAMPLE_LEADS + SAMPLE_PIPELINE — those
  imports MUST go (Task 2)

WHAT YOU'LL HAVE WHEN DONE:

- ⌘K opens a fast, fuzzy palette across 8 live entity types
- Recent-items memory persists across the session
- A working notification bell with badge + dropdown
- A /dashboard/notifications page with filters + ack
- Today's <NeedsYou> widget and the bell read from the SAME
  source — no drift between them
- Zero SAMPLE_* imports remaining in the palette

Let's go. Start with the 4-file read + confirm summary.
```

---
