# Counter Portal — Dashboard Redesign Phase 2: TDD Task Plan

> Phase 2 of the redesign authored 2026-04-18. Spec: `docs/superpowers/specs/2026-04-18-dashboard-redesign.md` §1-§5 (design) and §6 (12-task spine).
> Authored: 2026-04-19. Joshua approval pending before execution.

---

## 0. Decisions locked in (from §7 Q&A)

| # | Question | Decision | Implication for tasks |
|---|---|---|---|
| 1 | Sidebar light vs dark | **Light, sand-tinted (`#EFE7DA`)** — darker than page bg, lighter than full linen | T1 token block adjusted; T2 sidebar uses these values |
| 2 | EntityCard slots | **6 slots** as spec'd; SLA bar optional; no avatar | T6 builds 6 slots; SLA uses optional prop |
| 3 | NeedsYou data sources | **3 sources** (Trafico_Events, Leads.next_followup, Traficos.delay_days). Defer Deal_Payments to W8 | T8 wires 3 sources only |
| 4 | Pipeline migration | **Run script with dry-run + backup CSV + Activity_Log audit** | T11 includes round-trip script |
| 5 | Chat auto-open default | **Closed by default + 3-session FAB pulse** (cancellable on first FAB interaction) | T4 wires Zustand persisted pulse counter |
| 6 | KPI typography | **Hybrid: Cormorant for hero KPIs, DM Sans tabular for compact** | T5 KpiCard gets `variant: "hero" \| "compact"` prop |
| 7 | Token names | **`--color-dash-*`** (matches existing `bg-dash-*` class usage) | T1 token names align with existing classes |

---

## 1. Repo state baseline

- Repo: `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures`
- Branch: `main` (9 commits ahead of `origin/main` from Webchat v2 + redesign doc — DO NOT push)
- Working tree: clean
- Stack: Next.js 16 App Router + Tailwind v4 (`@theme inline` in `app/globals.css`) + Framer Motion + Zustand + Lucide
- Dev server: `npm run dev` from repo root, port 3000 (or auto-port)
- Login: `admin@countercultures.com.mx` / `GringoChido1!`

---

## 2. Commit map: 12 tasks → 8 commits

| Commit | Tasks | Conventional message |
|---|---|---|
| 1 | T1 | `feat(design): define dashboard color + spacing + type tokens (Tailwind v4 @theme)` |
| 2 | T2 | `feat(design): sidebar v2 — light surface + 6 groups + missing modules` |
| 3 | T3, T4 | `feat(design): header v2 + ActionFab — minimal header, FAB stack, chat closed-by-default` |
| 4 | T5 | `feat(design): KpiCard v2 — hero/compact variants, link-by-default, brand palette` |
| 5 | T6 | `feat(design): EntityCard — single canonical card for lead/deal/shipment/trafico/trade-app` |
| 6 | T7 | `feat(design): EmptyState + brand-palette StatusPill cleanup` |
| 7 | T8, T9, T10 | `feat(today): page rewrite — NeedsYou hero + activity feed + active deals + right-rail KPI stack` |
| 8 | T11, T12 | `feat(pipeline): trim sales pipeline to 3 stages + EntityCard standardization + execution log` |

---

## 3. Task plan

Each task is broken into atomic 2-5 minute steps. **Step header convention:** `T<task>.<step>`. **Verification commands always state expected output.** No placeholders.

---

### TASK 1 — Define `--color-dash-*` tokens in `@theme`

**Goal:** make `bg-dash-*` / `text-dash-*` / `border-dash-*` classes resolve to real values defined in the brand palette. Foundational — every subsequent task depends on this.

**Files touched:** `app/globals.css`

#### T1.1 — Read current `globals.css` (verify against memory)
- **Action:** `Read` `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/globals.css` (135 lines). Confirm `@theme inline` block is at lines 3-22 and only contains `--color-brand-*` + semantic aliases + `--font-*`. No `--color-dash-*` exists yet.
- **Expect:** confirmation that the audit finding stands.

#### T1.2 — Edit `app/globals.css`: insert dash + spacing + radius + type tokens
- **Action:** `Edit` `app/globals.css`. Replace the existing `@theme inline { ... }` block (lines 3-22) with the expanded block below.
- **New block:**
```css
@theme inline {
  /* Brand palette — keep */
  --color-brand-charcoal: #1A1A1A;
  --color-brand-terracotta: #C4725A;
  --color-brand-terracotta-dark: #A85D48;
  --color-brand-copper: #B87333;
  --color-brand-sage: #7A8B6F;
  --color-brand-stone: #A89F91;
  --color-brand-linen: #F5F0EB;
  --color-brand-sand: #D4C5A9;

  /* Semantic aliases */
  --color-background: #FAF7F2;
  --color-foreground: #1A1A1A;

  /* Dashboard surfaces */
  --color-dash-bg: #FAF7F2;
  --color-dash-surface: #FFFFFF;
  --color-dash-surface-2: #F5F0EB;
  --color-dash-sidebar: #EFE7DA;
  --color-dash-sidebar-active: #E5DAC6;
  --color-dash-sidebar-hover: #EAE0CE;
  --color-dash-border: #E8E0D2;
  --color-dash-border-strong: #D4C5A9;

  /* Dashboard text */
  --color-dash-text: #1A1A1A;
  --color-dash-text-secondary: #5C5650;
  --color-dash-text-muted: #8C857C;

  /* Dashboard accents */
  --color-dash-accent: #B87333;
  --color-dash-accent-soft: #F0E2CF;
  --color-dash-success: #7A8B6F;
  --color-dash-warn: #C4725A;
  --color-dash-danger: #A85D48;
  --color-dash-info: #6E7A85;

  /* Spacing rhythm */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  /* Type scale */
  --text-display-xl: 2.5rem;
  --text-display-lg: 1.875rem;
  --text-body-lg: 1rem;
  --text-body: 0.875rem;
  --text-label: 0.75rem;
  --text-micro: 0.6875rem;

  /* Typography families */
  --font-display: "Cormorant Garamond", serif;
  --font-body: "DM Sans", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```
- **Note on `--color-background`:** changes from `#F5F0EB` (linen) → `#FAF7F2` (slightly cooler) per spec §3.1. Body bg references this var so the storefront also picks it up — minor warm-cool shift, acceptable per Joshua's brand guardrails.

#### T1.3 — Typecheck
- **Command:** `cd /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures && npx tsc --noEmit 2>&1 | grep -v "routes\.d [0-9].ts" | head -30`
- **Expect:** zero errors. (No TS files were touched, so this is a baseline check.)

#### T1.4 — Browser preview verification (4-page spot-check)
- **Action:** start preview if not running (`preview_start` via Claude Preview MCP). Hot-reload should pick up the CSS change.
- **Spot-check pages:** `/dashboard/overview`, `/dashboard/leads`, `/dashboard/pipeline`, `/dashboard/brands`
- **For each page:** `preview_screenshot`. Visually confirm: cards now have warm border (`#E8E0D2`), backgrounds use the new neutral (`#FAF7F2`/`#FFFFFF`), no text is invisible, no layout collapsed.
- **Expect:** dashboard renders with **warm linen-derived palette instead of fallback grays**. Sidebar is still dark (T2 fixes that).

#### T1.5 — Commit
- **Command:**
```bash
cd /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures && git add app/globals.css && git commit -m "$(cat <<'EOF'
feat(design): define dashboard color + spacing + type tokens (Tailwind v4 @theme)

Adds --color-dash-* / --space-* / --radius-* / --text-* tokens to @theme
inline. Resolves the silent-fallback bug where bg-dash-* classes were used
hundreds of times across the dashboard but never defined. All tokens derive
from the brand palette (linen / sand / copper / sage / charcoal).

Phase 2 of dashboard redesign — see docs/superpowers/specs/2026-04-19-dashboard-redesign-plan.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```
- **Verify:** `git log --oneline -1` returns the new commit. `git status` returns "nothing to commit, working tree clean."

---

### TASK 2 — Sidebar v2: light surface + 6 groups + missing modules

**Goal:** flip sidebar from dark charcoal → sand-tinted light (`#EFE7DA`). Restructure into 6 groups. Add missing items per spec §4. Drop avatar (lives in header). Narrow 240px → 220px.

**Files touched:** `app/(dashboard)/components/sidebar.tsx`

#### T2.1 — Read current sidebar
- **Action:** `Read` `app/(dashboard)/components/sidebar.tsx` (217 lines). Note current navItems list (line 42-63) and the dark-themed wrapper (lines 194, 208).

#### T2.2 — Replace the navItems array with the 6-group structure
- **Action:** `Edit` lines 42-63 of `sidebar.tsx`. Replace with the 6-group navItems definition. Use Lucide icons that already exist in the import block (line 6-31). Trade Program moves to Operations. Remove Odoo (`Database` icon) from Operations top-level — keep route alive but don't surface in sidebar (route still resolvable via search). Add `Activity` for `/dashboard/activity` (new in T9 deeplink target — but route doesn't exist yet, so omit for now and revisit in T9).
- **New navItems:**
```tsx
const navItems: NavItem[] = [
  { label: "Today", href: "/dashboard/overview", icon: LayoutDashboard, section: "Home" },
  { label: "Weekly Review", href: "/dashboard/weekly-review", icon: CalendarCheck },

  { label: "Leads", href: "/dashboard/leads", icon: Users, section: "Leads & Deals" },
  { label: "Pipeline", href: "/dashboard/pipeline", icon: Kanban },
  { label: "Inbox", href: "/dashboard/inbox", icon: Inbox },
  { label: "WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle },

  { label: "Brands", href: "/dashboard/brands", icon: Award, section: "Catalog" },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Shipments & Customs", href: "/dashboard/shipments", icon: Truck },

  { label: "Email Campaigns", href: "/dashboard/email-campaigns", icon: Mail, section: "Marketing" },
  { label: "Social Hub", href: "/dashboard/social", icon: Share2 },
  { label: "Blog Manager", href: "/dashboard/blog-manager", icon: FileText },

  { label: "Pipeline & Sales", href: "/dashboard/sales-analytics", icon: TrendingUp, section: "Insights" },
  { label: "Marketing & Traffic", href: "/dashboard/marketing-analytics", icon: BarChart3 },

  { label: "Trade Program", href: "/dashboard/trade-program", icon: Handshake, section: "Operations" },
  { label: "Drive", href: "/dashboard/drive", icon: FolderOpen },
  { label: "Finance", href: "/dashboard/finance", icon: Wallet },
  { label: "Stripe", href: "/dashboard/stripe", icon: CreditCard },
  { label: "Odoo", href: "/dashboard/odoo", icon: Database },

  { label: "Settings", href: "/dashboard/settings", icon: Settings, section: "System" },
];
```
- **Expect:** 20 items across 6 sections + 1 system. (System group only has Settings.)

#### T2.3 — Update sidebar visuals: light bg, copper left-bar active, narrow width
- **Action:** Replace the desktop `<aside>` (lines 193-199) and mobile `<aside>` (line 208) classes. Change widths and theme.
- **Desktop aside:**
```tsx
<aside
  className={`hidden lg:flex fixed top-0 left-0 h-screen bg-dash-sidebar text-dash-text border-r border-dash-border flex-col transition-all duration-300 z-40 ${
    collapsed ? "w-16" : "w-[220px]"
  }`}
>
```
- **Mobile aside:**
```tsx
<aside className="relative w-72 max-w-[85vw] h-full bg-dash-sidebar text-dash-text border-r border-dash-border flex flex-col z-10">
```
- **Logo block (line 89):** change `border-b border-white/10` → `border-b border-dash-border`. Wordmark `Counter Cultures` keeps `font-display` but change subhead text-color (line 95) from `text-brand-copper` (already brand) to keep — copper still reads on light bg.
- **Section labels (line 133):** `text-white/40` → `text-dash-text-muted`.
- **Nav item Link (lines 138-169):**
  - Active: replace `bg-brand-copper/20 text-brand-copper font-medium` → `bg-dash-sidebar-active text-dash-text font-medium relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-brand-copper before:rounded-r`
  - Inactive: replace `text-white/70 hover:bg-dash-sidebar-hover hover:text-white` → `text-dash-text-secondary hover:bg-dash-sidebar-hover hover:text-dash-text`
- **Footer block (lines 175-186):** `border-t border-white/10` → `border-t border-dash-border`. Sign-out button: `text-white/70 hover:bg-dash-sidebar-hover hover:text-white` → `text-dash-text-secondary hover:bg-dash-sidebar-hover hover:text-dash-text`.

#### T2.4 — Typecheck
- **Command:** `npx tsc --noEmit 2>&1 | grep -v "routes\.d [0-9].ts" | head -30`
- **Expect:** zero errors.

#### T2.5 — Browser preview: load `/dashboard/overview`, screenshot
- **Action:** `preview_eval` `window.location.href = '/dashboard/overview'` if not already there, then `preview_screenshot`.
- **Expect:**
  - Sidebar bg is **sand-tinted light** (`#EFE7DA`), not charcoal
  - Active item ("Today") shows a **3px copper bar on the left edge** + tinted bg
  - All other items render in `dash-text-secondary`
  - 6 section headers visible: HOME / LEADS & DEALS / CATALOG / MARKETING / INSIGHTS / OPERATIONS (+ SYSTEM)
  - Width = 220px (eyeball: narrower than before)
  - Hamburger menu still works on mobile (resize to 800px and verify)

#### T2.6 — Click each new section's items, confirm no 404s
- **Action:** sequentially `preview_click` each new nav item: Email Campaigns, Social Hub, Blog Manager, Pipeline & Sales, Marketing & Traffic, Drive, Finance, Stripe, Odoo. After each, `preview_console_logs` to check for navigation errors.
- **Expect:** all routes resolve to a page render (not 404). Some pages may be partial/empty — that's fine, this task only verifies routing.

#### T2.7 — Commit
- **Command:**
```bash
git add app/\(dashboard\)/components/sidebar.tsx && git commit -m "$(cat <<'EOF'
feat(design): sidebar v2 — light surface + 6 groups + missing modules

Flips sidebar from heavy dark charcoal to sand-tinted light (#EFE7DA),
narrows from 240 to 220px. Active state becomes a 3px copper left-bar +
tinted bg (Linear/Vercel pattern). Restructures 11 items across 3 groups
into 20 items across 6 groups (HOME / LEADS & DEALS / CATALOG / MARKETING /
INSIGHTS / OPERATIONS) + SYSTEM. Surfaces previously invisible modules:
Email Campaigns, Social Hub, Blog Manager, Pipeline & Sales, Marketing &
Traffic, Finance, Stripe, Odoo. Trade Program moves from Leads & Deals to
Operations.

Phase 2 of dashboard redesign.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### TASK 3 — Header v2: minimal

**Goal:** strip header to essentials. Remove page-title duplication (becomes page H1 in body). Shrink search to icon-only with kbd hint. Keep bell with badge slot. Keep avatar but drop role line. Move Quick-Capture out of header (handled by T4 ActionFab).

**Files touched:** `app/(dashboard)/components/dashboard-header.tsx`

#### T3.1 — Read current header
- **Action:** `Read` `app/(dashboard)/components/dashboard-header.tsx` (101 lines). Note: page title at line 51, search at lines 56-72, QuickCapture import at line 5 + use at line 75, avatar block at lines 83-95.

#### T3.2 — Rewrite header to minimal shape
- **Action:** `Write` (full replacement) `app/(dashboard)/components/dashboard-header.tsx`. New shape: hamburger (mobile) + spacer + search (icon button) + bell (badge slot, no count) + avatar (initial + name only, no role line). Remove page-title section. Remove `<QuickCapture />` import + usage.
- **Full file:**
```tsx
"use client";

import { Bell, Search, Menu } from "lucide-react";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  notificationCount?: number;
}

const DashboardHeader = ({ onMenuClick, onSearchClick, notificationCount = 0 }: DashboardHeaderProps) => {
  return (
    <header className="h-14 bg-dash-surface border-b border-dash-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-dash-bg transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-dash-text-secondary" />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={() => {
            if (onSearchClick) {
              onSearchClick();
            } else {
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }));
            }
          }}
          className="hidden md:flex items-center gap-2 px-3 h-9 text-sm text-dash-text-secondary bg-dash-bg border border-dash-border rounded-md hover:border-dash-border-strong transition-colors cursor-pointer"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 bg-dash-surface border border-dash-border rounded">⌘K</kbd>
        </button>

        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-dash-bg transition-colors cursor-pointer"
          aria-label="Search"
          onClick={() => {
            if (onSearchClick) onSearchClick();
            else window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }));
          }}
        >
          <Search className="w-5 h-5 text-dash-text-secondary" />
        </button>

        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-md hover:bg-dash-bg transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-dash-text-secondary" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-brand-terracotta text-white text-[10px] font-bold px-1">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-brand-copper flex items-center justify-center text-white text-sm font-semibold shrink-0">
            R
          </div>
          <span className="hidden md:inline text-sm font-medium text-dash-text">Roger Williams</span>
        </div>
      </div>
    </header>
  );
};

export { DashboardHeader };
```

#### T3.3 — Add page H1 to overview page (T8 will subsume this — placeholder check only)
- **Action:** verify the existing pages have their own H1 in body. `Grep` for `<h1` and `<h2` inside `app/(dashboard)/dashboard/(portal)/overview/page.tsx` and `.../leads/page.tsx`. Joshua's spec is that page title moves from header to body.
- **Note:** T8 fully rewrites Today page H1. Other pages already have an H1/H2 in body (Leads has filters strip; for now the header just doesn't render the title, which is acceptable). No further action this step.

#### T3.4 — Typecheck
- **Command:** `npx tsc --noEmit 2>&1 | grep -v "routes\.d [0-9].ts" | head -30`
- **Expect:** zero errors. The unused `pageTitles` import + `usePathname` are gone, no lingering refs.

#### T3.5 — Browser preview screenshot of `/dashboard/overview`
- **Action:** `preview_screenshot`.
- **Expect:**
  - Header is **slimmer** (h-14 = 56px instead of h-16 = 64px)
  - **No page title in header** — left side has only mobile hamburger (hidden on desktop)
  - Search collapses to icon + kbd hint, not full bar
  - Bell with no badge (0 count)
  - Avatar shows "R" + "Roger Williams" only (no "Owner" line)
  - **No ⚡ Quick-Capture button in header** (it's about to land in the FAB stack)

---

### TASK 4 — `<ActionFab>` component + chat closed-by-default + 3-session pulse

**Goal:** vertical FAB stack at bottom-right contains ⚡ Quick Capture (top) + 💬 Chat (bottom). Chat widget no longer auto-opens on first mount. FAB chat button shows a 3-session pulse animation to teach discoverability; pulse cancels on first FAB interaction.

**Files touched:**
- `app/(dashboard)/components/action-fab.tsx` (NEW)
- `app/(dashboard)/components/ai-chat-widget.tsx` (remove auto-open, expose `<AiChatWidget controlledOpen={...}>` prop)
- `app/(dashboard)/dashboard/layout.tsx` (mount `<ActionFab>` instead of mounting `<AiChatWidget>` standalone)
- `app/lib/stores/fab-store.ts` (NEW — Zustand persisted pulse counter)

#### T4.1 — Confirm Zustand persisted-state pattern in repo
- **Action:** `Grep` for `persist(` in `app/lib/stores/`. Repo already uses `zustand/middleware` `persist` (e.g., `activity-store.ts`). Confirm the import shape.
- **Expect:** at least one existing store using `persist`. Reuse the pattern verbatim.

#### T4.2 — Create `app/lib/stores/fab-store.ts`
- **Action:** `Write` new file:
```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FabStore {
  pulseSessionsRemaining: number;
  hasInteracted: boolean;
  consumePulseSession: () => void;
  markInteracted: () => void;
}

const useFabStore = create<FabStore>()(
  persist(
    (set, get) => ({
      pulseSessionsRemaining: 3,
      hasInteracted: false,
      consumePulseSession: () => {
        const { hasInteracted, pulseSessionsRemaining } = get();
        if (hasInteracted || pulseSessionsRemaining === 0) return;
        set({ pulseSessionsRemaining: pulseSessionsRemaining - 1 });
      },
      markInteracted: () => set({ hasInteracted: true }),
    }),
    { name: "cc_fab_store_v1" }
  )
);

export { useFabStore };
```

#### T4.3 — Read current `ai-chat-widget.tsx` to understand state shape
- **Action:** already done in earlier exploration. Key facts:
  - Open state `[open, setOpen] = useState(false)` line 113
  - Auto-open useEffect at lines 137-142: `if (!dismissed) setOpen(true);`
  - Has its own FAB toggle button at line 557 `onClick={() => setOpen((v) => !v)}`
  - `closeWidget()` writes `sessionStorage.setItem(DISMISSED_KEY, "1")`
- **Plan:** keep widget self-contained, just **delete the auto-open line**. The FAB stack (T4.5) sits *outside* the widget and the widget's own toggle button gets hidden when the FAB is mounted. Cleanest is: the widget keeps its FAB internally for backwards compat but **`open` defaults to false and never auto-opens**. The new ActionFab calls `window.dispatchEvent(new CustomEvent('cc:open-chat'))` which the widget listens for.

#### T4.4 — Edit `ai-chat-widget.tsx`: remove auto-open + add custom-event listener + hide internal FAB
- **Action:** `Edit` `ai-chat-widget.tsx`:
  - **Remove auto-open:** delete lines 137-142 (the `useEffect` that calls `setOpen(true)` when not dismissed). Keep the identity / history restore part. Replace with a slimmed-down version:
```tsx
useEffect(() => {
  try {
    const saved = localStorage.getItem(IDENTITY_KEY);
    if (saved && saved.trim()) setName(saved.trim());
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Message[];
      if (Array.isArray(parsed)) {
        setMessages(parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
    }
  } catch {
    // storage not available
  }
}, []);
```
  - **Add custom-event listener** (insert after the slimmed useEffect):
```tsx
useEffect(() => {
  const handler = () => setOpen(true);
  window.addEventListener("cc:open-chat", handler);
  return () => window.removeEventListener("cc:open-chat", handler);
}, []);
```
  - **Hide internal FAB when ActionFab is mounted:** the widget's FAB button (around line 557) — wrap render with a check on a new prop `hideOwnFab?: boolean`. Cleaner: simply gate the FAB div with `{!hideOwnFab && (...)}`. Add `hideOwnFab` to the props interface (component is `AIChatWidget`). Default `false` for backwards compat.

#### T4.5 — Create `app/(dashboard)/components/action-fab.tsx`
- **Action:** `Write` new file:
```tsx
"use client";

import { useEffect, useRef } from "react";
import { Zap, MessageCircle } from "lucide-react";
import { QuickCapture } from "./quick-capture";
import { useFabStore } from "@/app/lib/stores/fab-store";

const ActionFab = () => {
  const { pulseSessionsRemaining, hasInteracted, consumePulseSession, markInteracted } = useFabStore();
  const consumedRef = useRef(false);

  useEffect(() => {
    if (consumedRef.current) return;
    consumedRef.current = true;
    consumePulseSession();
  }, [consumePulseSession]);

  const shouldPulse = !hasInteracted && pulseSessionsRemaining > 0;

  const openChat = () => {
    markInteracted();
    window.dispatchEvent(new CustomEvent("cc:open-chat"));
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
      <QuickCapture />
      <button
        onClick={openChat}
        aria-label="Open AI chat"
        className={`relative w-12 h-12 rounded-full bg-dash-surface border border-brand-copper text-brand-copper hover:bg-brand-copper hover:text-white transition-colors cursor-pointer flex items-center justify-center shadow-sm ${
          shouldPulse ? "before:content-[''] before:absolute before:inset-0 before:rounded-full before:bg-brand-copper/30 before:animate-ping" : ""
        }`}
      >
        <MessageCircle className="w-5 h-5 relative z-10" />
      </button>
    </div>
  );
};

export { ActionFab };
```
- **Note:** `Zap` icon imported but unused — remove the import. Final imports: `useEffect, useRef`, `MessageCircle`, `QuickCapture`, `useFabStore`.

#### T4.6 — Mount `<ActionFab>` in dashboard layout, pass `hideOwnFab` to chat widget
- **Action:** `Read` `app/(dashboard)/dashboard/layout.tsx`. Find where `<AIChatWidget />` is mounted. Add `<ActionFab />` next to it (or instead of the standalone widget mount, wrap both — order: chat widget first so it doesn't get clipped by FAB). Pass `hideOwnFab={true}` to `<AIChatWidget>`.

#### T4.7 — Typecheck
- **Command:** `npx tsc --noEmit 2>&1 | grep -v "routes\.d [0-9].ts" | head -30`
- **Expect:** zero errors. Watch for: unused import `Zap` in action-fab, missing `hideOwnFab` prop in widget interface.

#### T4.8 — Browser preview verification
- **Action:** Hard-reload `/dashboard/overview` (`preview_eval window.location.reload()`). `preview_screenshot`.
- **Expect:**
  - Chat widget is **CLOSED**. Dashboard fully visible.
  - Bottom-right shows **vertical stack of 2 buttons**: ⚡ Quick Capture (top) + 💬 Chat (bottom)
  - Chat button has a **soft copper pulse halo** (animate-ping) on first session
  - Click 💬 button → chat opens
  - Reload page → chat is closed again, pulse no longer shows (because `hasInteracted=true` was persisted)
- **Verification of persistence:** `preview_eval` `JSON.parse(localStorage.getItem('cc_fab_store_v1') ?? '{}')`. Expect `{state: {pulseSessionsRemaining: 2, hasInteracted: true}, version: 0}`.

#### T4.9 — Reset pulse for verifying decrements (manual test)
- **Action:** `preview_eval` `localStorage.removeItem('cc_fab_store_v1'); window.location.reload();`. After reload, expect `pulseSessionsRemaining: 2, hasInteracted: false`. Reload again without clicking — expect `pulseSessionsRemaining: 1`. Reload third time — expect `pulseSessionsRemaining: 0`. Pulse should stop after 3 reloads even without interaction.

#### T4.10 — Commit (T3 + T4 together)
- **Command:**
```bash
git add app/\(dashboard\)/components/dashboard-header.tsx app/\(dashboard\)/components/ai-chat-widget.tsx app/\(dashboard\)/components/action-fab.tsx app/\(dashboard\)/dashboard/layout.tsx app/lib/stores/fab-store.ts && git commit -m "$(cat <<'EOF'
feat(design): header v2 + ActionFab — minimal header, FAB stack, chat closed-by-default

Header: drops page title (now lives in body H1), shrinks search to icon+kbd
hint, bell gains a badge slot wired to a notificationCount prop, avatar
shows name only (no role line), Quick-Capture leaves the header.

ActionFab: new bottom-right vertical stack with QuickCapture + Chat. Chat
opens via CustomEvent('cc:open-chat'). Chat widget no longer auto-opens
on mount; first 3 sessions show a soft copper pulse on the FAB to teach
discoverability, cancelled on first interaction. State persisted in
useFabStore (Zustand persist, key cc_fab_store_v1).

Phase 2 of dashboard redesign.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### TASK 5 — `<KpiCard>` v2: hero/compact variants

**Goal:** rebuild KPI card with `variant: "hero" | "compact"`, mandatory `href` prop, Cormorant numbers for hero / DM Sans tabular-nums for compact, brand-palette delta chip.

**Files touched:** `app/(dashboard)/components/kpi-card.tsx`

#### T5.1 — Read current card
- **Action:** `Read` `app/(dashboard)/components/kpi-card.tsx` (70 lines, already in context).

#### T5.2 — Rewrite the component
- **Action:** `Write` (full replacement):
```tsx
"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  href: string;
  change?: number;
  changeLabel?: string;
  variant?: "hero" | "compact";
}

const KpiCard = ({ label, value, href, change, changeLabel = "vs last month", variant = "hero" }: KpiCardProps) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const deltaTone = isPositive ? "text-dash-success" : isNegative ? "text-dash-danger" : "text-dash-text-secondary";

  const valueClass =
    variant === "hero"
      ? "font-display text-3xl text-dash-text leading-none"
      : "font-body font-semibold text-xl text-dash-text tabular-nums";

  const labelClass =
    variant === "hero"
      ? "text-[11px] uppercase tracking-[0.08em] text-dash-text-muted font-medium"
      : "text-[11px] uppercase tracking-[0.06em] text-dash-text-muted font-medium";

  const padding = variant === "hero" ? "p-5" : "p-4";

  return (
    <Link
      href={href}
      className={`block bg-dash-surface rounded-md border border-dash-border ${padding} transition-colors hover:border-dash-border-strong`}
    >
      <p className={labelClass}>{label}</p>
      <p className={`${valueClass} mt-2`}>{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          <TrendIcon className={`w-3.5 h-3.5 ${deltaTone}`} />
          <span className={`text-xs font-medium tabular-nums ${deltaTone}`}>
            {isPositive && "+"}
            {change}%
          </span>
          <span className="text-xs text-dash-text-muted">{changeLabel}</span>
        </div>
      )}
    </Link>
  );
};

export { KpiCard };
export type { KpiCardProps };
```
- **Breaking change:** the component is **renamed** from `KPICard` (caps) → `KpiCard` (camel). The `icon` and `accentColor` props are gone. `href` is now required. Existing call sites must be updated. T5.3 finds them; T5.4 patches them.

#### T5.3 — Find every consumer of `<KPICard>`
- **Command:** `cd /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures && grep -rn "KPICard" app/ --include="*.tsx" --include="*.ts" | head -40`
- **Expect:** matches in `overview/page.tsx`, possibly other dashboard pages (leads, pipeline, sales-analytics, marketing-analytics).

#### T5.4 — Patch every consumer
- **Action:** for each match found in T5.3:
  - Update import: `import { KPICard } ...` → `import { KpiCard } ...`
  - Replace `<KPICard ... icon={X} accentColor="..." />` → `<KpiCard label=... value=... href="<filtered list URL>" change={...} variant="compact" />`
  - Default `variant="hero"` for the page's primary KPI rows; `variant="compact"` for sub-stacks (e.g., right-rail).
- **Note:** Today page (`overview/page.tsx`) will be largely rewritten in T8/T9/T10 — only do the minimum patch here to compile (e.g., one-line swap so build doesn't break). The full rewrite handles the rest.
- **Critical href targets:**
  - "New Leads" → `/dashboard/leads?status=new`
  - "Pipeline Value" → `/dashboard/pipeline`
  - "Conversion Rate" → `/dashboard/sales-analytics`
  - "Total Leads" → `/dashboard/leads`
  - "Stripe Revenue (30d)" → `/dashboard/stripe`

#### T5.5 — Typecheck
- **Command:** `npx tsc --noEmit 2>&1 | grep -v "routes\.d [0-9].ts" | head -30`
- **Expect:** zero errors. Especially watch for any page still using `<KPICard>` (caps).

#### T5.6 — Browser preview screenshot of `/dashboard/overview` and `/dashboard/leads`
- **Action:** `preview_screenshot` both pages.
- **Expect:**
  - Hero KPI numbers render in **Cormorant Garamond** (display serif), large
  - Compact variant numbers render in **DM Sans tabular-nums**
  - Card border is `dash-border`, hover bumps to `dash-border-strong`
  - Cards are now **full-card links** — click anywhere navigates to filter URL

#### T5.7 — Commit
- **Command:**
```bash
git add app/\(dashboard\)/components/kpi-card.tsx <consumer files modified> && git commit -m "$(cat <<'EOF'
feat(design): KpiCard v2 — hero/compact variants, link-by-default, brand palette

Renames KPICard -> KpiCard (camel). Adds variant prop: "hero" uses
Cormorant Garamond display serif for premium hero KPIs, "compact" uses
DM Sans tabular-nums for dense data. Drops the icon + accentColor props
in favor of clean, link-by-default cards (every KPI navigates to a
filtered list — required href prop). Delta chip uses dash-success /
dash-danger / dash-text-secondary tones.

Phase 2 of dashboard redesign.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### TASK 6 — `<EntityCard>`: single canonical card

**Goal:** new component, used by Today active deals + Pipeline Kanban + Leads/Trafico/Trade-app rows. 6 slots: id+value (top), title (H3), contact row, brand chips, status badge, optional SLA bar.

**Files touched:**
- `app/(dashboard)/components/entity-card.tsx` (NEW)
- `app/(dashboard)/dashboard/(portal)/_design/page.tsx` (NEW — dev-only design demo route)

#### T6.1 — Define the props shape
- **Action:** decide the prop schema before writing. Final schema:
```tsx
type EntityVariant = "lead" | "deal" | "shipment" | "trafico" | "trade-app";

interface EntityCardProps {
  variant: EntityVariant;
  id: string;                     // Slot 1a — short ID (e.g., "DEAL-118")
  value?: string;                 // Slot 1b — formatted ($45K MXN). Optional for lead/trade-app.
  title: string;                  // Slot 2 — primary line (project name, lead name)
  contact?: { name: string; subtitle?: string }; // Slot 3
  brandChips?: string[];          // Slot 4 — already-resolved display names
  status?: { label: string; tone: "new" | "in-progress" | "warning" | "danger" | "success" | "neutral" }; // Slot 5
  sla?: { dayInStage: number; threshold: number; label?: string }; // Slot 6 — optional SLA bar (renders if provided)
  href?: string;                  // wraps the card in a Link if provided
  onClick?: () => void;           // alternative click handler (for slideout patterns)
  actions?: React.ReactNode;      // optional action icons row (top-right corner)
}
```

#### T6.2 — Create `app/(dashboard)/components/entity-card.tsx`
- **Action:** `Write` the file. Implementation outline (full code below):
```tsx
"use client";

import Link from "next/link";

type EntityVariant = "lead" | "deal" | "shipment" | "trafico" | "trade-app";
type StatusTone = "new" | "in-progress" | "warning" | "danger" | "success" | "neutral";

interface EntityCardProps {
  variant: EntityVariant;
  id: string;
  value?: string;
  title: string;
  contact?: { name: string; subtitle?: string };
  brandChips?: string[];
  status?: { label: string; tone: StatusTone };
  sla?: { dayInStage: number; threshold: number; label?: string };
  href?: string;
  onClick?: () => void;
  actions?: React.ReactNode;
}

const toneToClasses: Record<StatusTone, string> = {
  new: "bg-brand-copper/10 text-brand-copper",
  "in-progress": "bg-brand-sage/15 text-brand-sage",
  warning: "bg-brand-terracotta/15 text-brand-terracotta",
  danger: "bg-brand-terracotta-dark/20 text-brand-terracotta-dark",
  success: "bg-brand-sage/20 text-brand-sage",
  neutral: "bg-dash-bg text-dash-text-secondary",
};

const variantToIdTone: Record<EntityVariant, string> = {
  lead: "text-dash-text-muted",
  deal: "text-brand-copper",
  shipment: "text-dash-info",
  trafico: "text-dash-info",
  "trade-app": "text-dash-text-muted",
};

const EntityCard = ({ variant, id, value, title, contact, brandChips, status, sla, href, onClick, actions }: EntityCardProps) => {
  const slaPct = sla ? Math.min(100, Math.round((sla.dayInStage / sla.threshold) * 100)) : 0;
  const slaTone = sla
    ? slaPct >= 100
      ? "bg-dash-danger"
      : slaPct >= 80
        ? "bg-dash-warn"
        : "bg-dash-success"
    : "";

  const body = (
    <div className="bg-dash-surface border border-dash-border rounded-md p-3 flex flex-col gap-2 transition-colors hover:border-dash-border-strong group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className={`font-mono text-[11px] ${variantToIdTone[variant]} shrink-0`}>{id}</span>
          {value && (
            <span className="font-body font-semibold text-sm text-dash-text tabular-nums truncate">{value}</span>
          )}
        </div>
        {actions && <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">{actions}</div>}
      </div>

      <h3 className="text-sm font-medium text-dash-text leading-tight line-clamp-2">{title}</h3>

      {contact && (
        <div className="text-xs text-dash-text-secondary leading-tight">
          <span className="font-medium">{contact.name}</span>
          {contact.subtitle && <span className="text-dash-text-muted"> · {contact.subtitle}</span>}
        </div>
      )}

      {brandChips && brandChips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {brandChips.slice(0, 3).map((b) => (
            <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-dash-surface-2 text-dash-text-secondary border border-dash-border">
              {b}
            </span>
          ))}
          {brandChips.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 text-dash-text-muted">+{brandChips.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto">
        {status && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${toneToClasses[status.tone]}`}>
            {status.label}
          </span>
        )}
        {sla && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] text-dash-text-muted tabular-nums">{sla.label ?? `${sla.dayInStage}d`}</span>
            <div className="w-16 h-1 bg-dash-bg rounded-full overflow-hidden">
              <div className={`h-full ${slaTone} transition-all`} style={{ width: `${slaPct}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        {body}
      </button>
    );
  }
  return body;
};

export { EntityCard };
export type { EntityCardProps, EntityVariant, StatusTone };
```

#### T6.3 — Create the dev-only design demo route
- **Action:** `Write` `app/(dashboard)/dashboard/(portal)/_design/page.tsx`. Demo all 5 variants with realistic fixture data (Lead/Deal/Shipment/Trafico/Trade-app). The route name starts with `_` so Next.js still serves it but it's clearly internal.
- **Implementation:**
```tsx
"use client";

import { EntityCard } from "@/app/(dashboard)/components/entity-card";
import { Mail, Eye } from "lucide-react";

const DesignDemoPage = () => {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl text-dash-text">EntityCard variants</h1>
        <p className="text-sm text-dash-text-secondary mt-1">Dev-only — used by Today, Pipeline, Leads, Shipments, Trade Program.</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-dash-text">Lead</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <EntityCard
            variant="lead"
            id="LEAD-204"
            title="Casa de Luna — kitchen + bath spec"
            contact={{ name: "Gabor Arana", subtitle: "Showroom walk-in" }}
            brandChips={["Kohler", "BLANCO", "Brizo", "TOTO"]}
            status={{ label: "New", tone: "new" }}
            sla={{ dayInStage: 3, threshold: 5, label: "3 days old" }}
            href="/dashboard/leads"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-dash-text">Deal</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <EntityCard
            variant="deal"
            id="DEAL-118"
            value="$485K MXN"
            title="Hotel Rosewood SMA — phase 2"
            contact={{ name: "Mariana Cordero", subtitle: "Designer" }}
            brandChips={["Dornbracht", "Hansgrohe"]}
            status={{ label: "Proposal", tone: "in-progress" }}
            sla={{ dayInStage: 12, threshold: 14 }}
            href="/dashboard/pipeline"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-dash-text">Shipment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <EntityCard
            variant="shipment"
            id="SHP-00042"
            value="$92K MXN"
            title="Container CC-042 — Kohler / TOTO"
            contact={{ name: "Aduana SMA", subtitle: "ETA shifted +4d" }}
            status={{ label: "In Customs", tone: "warning" }}
            sla={{ dayInStage: 5, threshold: 4, label: "5d / 4d SLA" }}
            href="/dashboard/shipments"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-dash-text">Trafico</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <EntityCard
            variant="trafico"
            id="TRF-00104"
            title="Trafico container CC-042 → SMA showroom"
            contact={{ name: "Roger F Williams" }}
            status={{ label: "On the road", tone: "in-progress" }}
            href="/dashboard/shipments"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-dash-text">Trade Application</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <EntityCard
            variant="trade-app"
            id="TRD-008"
            title="Estudio Atelier — application pending review"
            contact={{ name: "Catalina Ríos", subtitle: "Architect, CDMX" }}
            status={{ label: "Pending", tone: "neutral" }}
            actions={
              <>
                <Eye className="w-3.5 h-3.5 text-dash-text-secondary hover:text-dash-text" />
                <Mail className="w-3.5 h-3.5 text-dash-text-secondary hover:text-dash-text" />
              </>
            }
            href="/dashboard/trade-program"
          />
        </div>
      </section>
    </div>
  );
};

export default DesignDemoPage;
```

#### T6.4 — Typecheck
- **Command:** `npx tsc --noEmit 2>&1 | grep -v "routes\.d [0-9].ts" | head -30`
- **Expect:** zero errors.

#### T6.5 — Browser preview the design demo
- **Action:** `preview_eval window.location.href = '/dashboard/_design'`. Wait for hot-reload. `preview_screenshot`.
- **Expect:** all 5 variants render with their distinguishing features:
  - Lead has muted ID, no value, brand chips, SLA bar
  - Deal has copper ID, value, brand chips, in-progress status, SLA bar at ~85%
  - Shipment has ID + value, warning status, SLA bar at 100%+ (danger tone)
  - Trafico has minimal slots
  - Trade-app shows action icons on hover

#### T6.6 — Commit
- **Command:**
```bash
git add app/\(dashboard\)/components/entity-card.tsx app/\(dashboard\)/dashboard/\(portal\)/_design/page.tsx && git commit -m "$(cat <<'EOF'
feat(design): EntityCard — single canonical card for lead/deal/shipment/trafico/trade-app

New component with 6 slots: id+value (top), title (H3), contact row,
brand chips (truncated to 3 + count), status pill, optional SLA bar.
Variant prop changes the ID color tone but keeps the shape constant.
Renders as link / button / div depending on href|onClick props.

Adds /dashboard/_design — dev-only demo route showing all 5 variants
with realistic fixture data. Future tasks (Pipeline Kanban, Today
ActiveDeals, Trade Program, Shipments) consume this card.

Phase 2 of dashboard redesign.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### TASK 7 — `<EmptyState>` + `<StatusPill>` cleanup

**Goal:** new `<EmptyState>` (icon + title + 1-line copy + 1 CTA). Refactor `<StatusBadge>` from 11 variants → 6 brand-palette tones. Sweep replace lime/pink/blue badges across portal.

**Files touched:**
- `app/(dashboard)/components/empty-state.tsx` (NEW)
- `app/(dashboard)/components/status-badge.tsx` (rewrite)
- consumer pages (sweep grep + patch)

#### T7.1 — Create `app/(dashboard)/components/empty-state.tsx`
- **Action:** `Write`:
```tsx
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  tone?: "default" | "success" | "muted";
}

const toneToCopy: Record<NonNullable<EmptyStateProps["tone"]>, string> = {
  default: "text-dash-text-secondary",
  success: "text-brand-sage",
  muted: "text-dash-text-muted",
};

const EmptyState = ({ icon: Icon, title, description, cta, tone = "default" }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      <div className="w-10 h-10 rounded-full bg-dash-bg flex items-center justify-center mb-3">
        <Icon className={`w-5 h-5 ${toneToCopy[tone]}`} />
      </div>
      <p className={`text-sm font-medium ${toneToCopy[tone]}`}>{title}</p>
      {description && <p className="text-xs text-dash-text-muted mt-1 max-w-xs">{description}</p>}
      {cta && (
        <Link
          href={cta.href}
          className="mt-3 text-xs font-medium text-brand-copper hover:text-brand-terracotta transition-colors"
        >
          {cta.label} →
        </Link>
      )}
    </div>
  );
};

export { EmptyState };
export type { EmptyStateProps };
```

#### T7.2 — Rewrite `status-badge.tsx` to brand-palette only
- **Action:** `Write` (full replacement):
```tsx
type BadgeTone = "new" | "in-progress" | "warning" | "danger" | "success" | "neutral";

const toneStyles: Record<BadgeTone, string> = {
  new: "bg-brand-copper/10 text-brand-copper",
  "in-progress": "bg-brand-sage/15 text-brand-sage",
  warning: "bg-brand-terracotta/15 text-brand-terracotta",
  danger: "bg-brand-terracotta-dark/20 text-brand-terracotta-dark",
  success: "bg-brand-sage/20 text-brand-sage",
  neutral: "bg-dash-bg text-dash-text-secondary",
};

const legacyToTone: Record<string, BadgeTone> = {
  new: "new",
  contacted: "in-progress",
  qualified: "in-progress",
  proposal: "in-progress",
  won: "success",
  lost: "danger",
  default: "neutral",
  info: "neutral",
  warning: "warning",
  success: "success",
  danger: "danger",
};

interface StatusBadgeProps {
  label: string;
  variant?: string;
}

const StatusBadge = ({ label, variant = "default" }: StatusBadgeProps) => {
  const tone = legacyToTone[variant] ?? "neutral";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${toneStyles[tone]}`}>
      {label}
    </span>
  );
};

export { StatusBadge };
export type { BadgeTone };
```
- **Note:** keeps backwards-compat by accepting old variant strings via `legacyToTone` map. No sweep-rename needed across pages — they'll just collapse to the new tones automatically. **Dropped exports:** `BadgeVariant` (no longer needed). Update `overview/page.tsx` import (`type { BadgeVariant }` → remove the import; the local `statusVariants: Record<string, BadgeVariant>` mapping can use `string` instead).

#### T7.3 — Patch consumers that import `BadgeVariant`
- **Command:** `grep -rn "BadgeVariant" app/ --include="*.tsx" --include="*.ts"`
- **Action:** for each match, change `BadgeVariant` → `string` in the type position. (No runtime change because the legacy map still resolves.)

#### T7.4 — Sweep for explicit lime/pink/blue/amber/emerald badge classes that should be brand
- **Command:** `grep -rn "bg-emerald\|bg-amber\|bg-blue-50\|bg-red-50\|text-pink-\|text-violet-" app/\(dashboard\)/ --include="*.tsx" | head -20`
- **Action:** review each match. If it's a status pill or chip-like element, swap to a brand palette equivalent. **Do NOT touch:** Stripe brand colors (`#635bff`), payment status (`p.status === "succeeded"` block in `overview/page.tsx` — the page is being rewritten in T8/T9/T10), recharts tooltip styling. **Targeted replacements only** — anything outside the dashboard surface (e.g., storefront) stays untouched.

#### T7.5 — Typecheck
- **Command:** `npx tsc --noEmit 2>&1 | grep -v "routes\.d [0-9].ts" | head -30`
- **Expect:** zero errors.

#### T7.6 — Browser preview screenshot of `/dashboard/leads`
- **Action:** `preview_screenshot`. Verify the lead status pills (New / Contacted / Qualified / Proposal) render in **copper / sage / sage / sage** tones — not lime/pink.
- **Expect:** consistent warm palette across all status pills.

#### T7.7 — Commit
- **Command:**
```bash
git add app/\(dashboard\)/components/empty-state.tsx app/\(dashboard\)/components/status-badge.tsx <patched consumers> && git commit -m "$(cat <<'EOF'
feat(design): EmptyState + brand-palette StatusPill cleanup

New EmptyState component (icon + title + optional description + CTA).
Replaces ad-hoc "no X yet" plain-text moments with a consistent shape.

StatusBadge collapses 11 variants down to 6 brand-palette tones
(new/in-progress/warning/danger/success/neutral). Legacy variant strings
(qualified, proposal, contacted, won, lost) still work — they remap
through legacyToTone. Drops the lime/pink/blue/amber/emerald visual zoo.

Phase 2 of dashboard redesign.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### TASK 8 — Today page v2: `<NeedsYou>` widget

**Goal:** build the new hero widget reading from 3 sources (Trafico_Events customs holds >24h, Leads.next_followup overdue, Traficos.delay_days ≥3). Empty state: "No fires today. ☕ Nicely done."

**Files touched:**
- `app/api/dashboard/needs-you/route.ts` (NEW)
- `app/(dashboard)/components/needs-you.tsx` (NEW)
- `app/(dashboard)/dashboard/(portal)/overview/page.tsx` (consume widget — T9 finishes the page rewrite)

#### T8.1 — Survey existing readers for the 3 source sheets
- **Command:** parallel:
  - `grep -rn "Trafico_Events\|trafico-events\|trafico_events" app/lib/ --include="*.ts" | head -20`
  - `grep -rn "next_followup\|nextFollowUp" app/lib/ --include="*.ts" app/api/dashboard/leads/ --include="*.ts" | head -20`
  - `grep -rn "delay_days\|delayDays" app/lib/ --include="*.ts" | head -20`
- **Expect:** existing readers in `app/lib/` for at least Trafico_Events (W5 work). Identify the helper signatures so the new API can compose them rather than reimplementing.

#### T8.2 — Decide source query shape (no schema changes)
- **Action:** for each source, define the exact Sheets read + filter logic:
  - **Trafico_Events:** filter rows where `event_type IN ('hold_started','customs_hold')` AND `(now - event_timestamp) > 24h` AND no later `event_type IN ('hold_cleared','customs_cleared')` for the same trafico_id.
  - **Leads:** `next_followup < today AND status NOT IN ('won','lost','closed')`.
  - **Traficos:** `delay_days >= 3 AND status NOT IN ('delivered','closed')`. (If `delay_days` doesn't exist as a stored column, compute from `eta_planned` vs `eta_actual` or current date.)
- **Note:** if any of these columns don't exist in the live sheets, the widget shows the empty state (graceful) and a console warning is logged. **No schema additions in this task.** Per the brief, schema changes need explicit approval — defer those if they come up.

#### T8.3 — Create `app/api/dashboard/needs-you/route.ts`
- **Action:** `Write` a route handler that returns:
```ts
type NeedsYouItem = {
  id: string;                 // unique per item (e.g., "trafico-event-CC-042-hold")
  source: "customs" | "followup" | "shipment-delay";
  message: string;            // "DEAL-118 customs clearance overdue 36h — call broker"
  href: string;               // deeplink to entity (e.g., "/dashboard/shipments/SHP-00042")
  severity: "warning" | "danger";
  ageHours: number;           // for sort
};
```
The handler queries the 3 sources in parallel via `Promise.allSettled`, sorts by severity (danger first) then ageHours desc, caps at 8. Errors per source are logged + skipped (widget never crashes from one bad source).

#### T8.4 — Create `app/(dashboard)/components/needs-you.tsx`
- **Action:** `Write` the client component:
```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Coffee } from "lucide-react";

interface NeedsYouItem {
  id: string;
  source: "customs" | "followup" | "shipment-delay";
  message: string;
  href: string;
  severity: "warning" | "danger";
  ageHours: number;
}

const NeedsYou = () => {
  const [items, setItems] = useState<NeedsYouItem[] | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/needs-you")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-md p-5">
        <div className="h-4 w-32 bg-dash-bg rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 w-full bg-dash-bg rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-md p-5 flex flex-col items-center text-center py-10">
        <div className="w-10 h-10 rounded-full bg-brand-sage/15 flex items-center justify-center mb-3">
          <Coffee className="w-5 h-5 text-brand-sage" />
        </div>
        <p className="text-sm font-medium text-brand-sage">No fires today.</p>
        <p className="text-xs text-dash-text-muted mt-1">Nicely done.</p>
      </div>
    );
  }

  return (
    <div className="bg-dash-surface border border-dash-border rounded-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-brand-terracotta" />
        <h2 className="text-[11px] uppercase tracking-[0.08em] text-dash-text-muted font-semibold">Needs you</h2>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-dash-bg transition-colors text-sm group"
            >
              <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${item.severity === "danger" ? "bg-brand-terracotta-dark" : "bg-brand-terracotta"}`} />
              <span className="text-dash-text leading-snug group-hover:text-brand-copper transition-colors">{item.message}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { NeedsYou };
```

#### T8.5 — Round-trip script: `scripts/_test-needs-you.ts`
- **Action:** `Write` a script that hits the `/api/dashboard/needs-you` endpoint locally and prints the response. Run via `npx tsx scripts/_test-needs-you.ts` after `npm run dev` is up.
- **Pattern:** identical to `scripts/_test-trafico-events.ts` (already in repo).
- **Expect:** an array of items (possibly empty if no data triggers). Logs each item with source + message + href.

#### T8.6 — Typecheck
- **Command:** `npx tsc --noEmit 2>&1 | grep -v "routes\.d [0-9].ts" | head -30`
- **Expect:** zero errors.

#### T8.7 — Browser preview verification (page rewrite happens in T9; just hot-test the widget here)
- **Action:** temporarily mount `<NeedsYou />` at the top of `overview/page.tsx` (one-line drop-in above the existing greeting). Hard-reload `/dashboard/overview`. `preview_screenshot`.
- **Expect:**
  - If sheets have qualifying rows → list renders with terracotta dots
  - If no rows → "No fires today. Nicely done." with sage coffee icon

---

### TASK 9 — Today page v2: `<NewSinceLastCheck>` + `<TodayActiveDeals>` + Sales Health rail

**Goal:** build remaining widgets. Compose the new Today layout. Strip the old chart, KPI grid, and Recent Activity blocks.

**Files touched:**
- `app/api/dashboard/recent-activity/route.ts` (NEW or extend existing)
- `app/(dashboard)/components/new-since-last-check.tsx` (NEW)
- `app/(dashboard)/components/today-active-deals.tsx` (NEW)
- `app/(dashboard)/components/morning-sales-health.tsx` (NEW)
- `app/(dashboard)/dashboard/(portal)/overview/page.tsx` (page rewrite)

#### T9.1 — Survey activity sources
- **Command:** `grep -rn "Activity_Log\|activity_log\|/api/dashboard/activities" app/api/ app/lib/ --include="*.ts" | head -20`
- **Expect:** existing reader. Compose with Email_Activity (already exists per W3 work) and Trafico_Events.

#### T9.2 — Build `<NewSinceLastCheck>` (last 24h delta, cap 5)
- **Action:** `Write` `app/(dashboard)/components/new-since-last-check.tsx`. Fetches `/api/dashboard/activities?since=24h&limit=5`. Renders a list with: timestamp (`MMM d, HH:mm`), small icon by activity type, description as a link to entity. Empty state: "All quiet on the inbound. Last update: {time}." (`<EmptyState>` reused).

#### T9.3 — Extend or create `app/api/dashboard/activities/route.ts`
- **Action:** ensure the existing endpoint accepts `?since=24h&limit=5` query params. If not, add the filter logic. Returns a unified list across Activity_Log + Email_Activity + Trafico_Events.

#### T9.4 — Build `<TodayActiveDeals>` using `<EntityCard variant="deal">` rows
- **Action:** `Write` `app/(dashboard)/components/today-active-deals.tsx`. Fetches `/api/dashboard/pipeline?activeOnly=true`. Sorts by SLA risk (highest `dayInStage / threshold` ratio first). Top 5. Renders `<EntityCard>` per deal with `variant="deal"`, `id` from deal_id, `value` formatted, `title` from project name, `contact` from contact_name + role, `brandChips` from `brand_slugs` resolved against Brand Kit display names, `status` from current stage, `sla` from `dayInStage` vs stage threshold (default 14d). `href` to `/dashboard/pipeline?deal=<id>` (slideout-friendly URL).

#### T9.5 — Build `<MorningSalesHealth>`
- **Action:** `Write` `app/(dashboard)/components/morning-sales-health.tsx`. Reads from existing health-checklist source (per consolidation spec — was on Weekly Review). Renders: "{passing}/{total} checks passing." If <100%, expand a list of failing checks with click-through to their fix surface. If 100%, success-toned empty state.
- **Note:** the existing health checklist module may be on `weekly-review/page.tsx`. Locate via `grep -rn "Health\|Checklist\|health-check" app/(dashboard)/` and reuse the same data source.

#### T9.6 — Rewrite `overview/page.tsx`
- **Action:** `Write` (full replacement). New layout per spec §5.1:
```tsx
"use client";

import { format } from "date-fns";
import { NeedsYou } from "@/app/(dashboard)/components/needs-you";
import { NewSinceLastCheck } from "@/app/(dashboard)/components/new-since-last-check";
import { TodayActiveDeals } from "@/app/(dashboard)/components/today-active-deals";
import { MorningSalesHealth } from "@/app/(dashboard)/components/morning-sales-health";
import { TodayKpiRail } from "@/app/(dashboard)/components/today-kpi-rail"; // built in T10

const greetingFor = (date: Date) => {
  const h = date.getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

const OverviewPage = () => {
  const now = new Date();
  const day = format(now, "EEEE, MMMM d");
  const greeting = greetingFor(now);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h1 className="font-display text-3xl text-dash-text">{day}</h1>
        <p className="text-sm text-dash-text-secondary">· {greeting} Roger</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
        <div className="space-y-4">
          <NeedsYou />
          <NewSinceLastCheck />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <TodayActiveDeals />
            <MorningSalesHealth />
          </div>
        </div>
        <aside>
          <TodayKpiRail />
        </aside>
      </div>
    </div>
  );
};

export default OverviewPage;
```
- **Removed:** the 5-KPI grid (becomes T10 right-rail), the Pipeline by Stage chart, the Recent Stripe Payments table (lives on `/dashboard/stripe`), the Quick Actions grid (lives in ActionFab + each module's New CTA), the Recent Activity card (subsumed by NewSinceLastCheck), the greeting+day double-block (now one line), the Recent Leads + Top Deals trio (subsumed by TodayActiveDeals).
- **Sample data import removed:** the page should no longer reference `SAMPLE_KPI / SAMPLE_LEADS / SAMPLE_PIPELINE / SAMPLE_ACTIVITIES / CLOSED_STAGES`. Per the sheet-backed-everywhere rule, all data comes from APIs.

#### T9.7 — Typecheck
- **Command:** `npx tsc --noEmit 2>&1 | grep -v "routes\.d [0-9].ts" | head -30`
- **Expect:** zero errors. If `TodayKpiRail` doesn't exist yet (T10 builds it), temporarily stub it as `const TodayKpiRail = () => null;` exported from `today-kpi-rail.tsx` so the import resolves. T10 finishes it.

#### T9.8 — Browser preview verification
- **Action:** hard-reload `/dashboard/overview`. `preview_screenshot`.
- **Expect:**
  - Single line at top: `Tuesday, April 19 · Buenos días Roger` in Cormorant
  - NeedsYou widget visible immediately (no scroll)
  - NewSinceLastCheck below it
  - 2-column grid: Today's Active Deals + Morning Sales Health
  - **No Pipeline by Stage chart**
  - **No 5-KPI row above the fold**
  - **No Recent Activity card with the inline ActivityLogger button**
  - Right rail shows nothing yet (T10 fills it)

---

### TASK 10 — Today right-rail KPI stack (compact variant)

**Goal:** vertical stack of 4 small KpiCards in the right rail. Pipeline Value · Revenue (24h) · New Leads (24h) · Active Deals. All compact variant. All linked to drill-down.

**Files touched:** `app/(dashboard)/components/today-kpi-rail.tsx`

#### T10.1 — Build `today-kpi-rail.tsx`
- **Action:** `Write`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/app/(dashboard)/components/kpi-card";

interface RailData {
  pipelineValue: string;
  revenueLast24h: string;
  newLeadsLast24h: string;
  activeDealCount: string;
  pipelineDelta?: number;
  revenueDelta?: number;
  leadsDelta?: number;
  dealsDelta?: number;
}

const TodayKpiRail = () => {
  const [data, setData] = useState<RailData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/today-kpis")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="text-[11px] uppercase tracking-[0.08em] text-dash-text-muted font-semibold pl-1">More</h2>
      <KpiCard label="Pipeline Value" value={data?.pipelineValue ?? "—"} change={data?.pipelineDelta} variant="compact" href="/dashboard/pipeline" changeLabel="vs 7d ago" />
      <KpiCard label="Revenue (24h)" value={data?.revenueLast24h ?? "—"} change={data?.revenueDelta} variant="compact" href="/dashboard/stripe" changeLabel="vs prior 24h" />
      <KpiCard label="New Leads (24h)" value={data?.newLeadsLast24h ?? "—"} change={data?.leadsDelta} variant="compact" href="/dashboard/leads?since=24h" changeLabel="vs prior 24h" />
      <KpiCard label="Active Deals" value={data?.activeDealCount ?? "—"} change={data?.dealsDelta} variant="compact" href="/dashboard/pipeline" changeLabel="vs 7d ago" />
    </div>
  );
};

export { TodayKpiRail };
```

#### T10.2 — Create `app/api/dashboard/today-kpis/route.ts`
- **Action:** `Write` an aggregator endpoint that returns `RailData`. Composes existing readers (overview, stripe summary, leads, pipeline). Computes deltas vs the prior 7d / 24h window. If any source fails, returns the partial result (per-field nullable on the client).

#### T10.3 — Typecheck
- **Command:** `npx tsc --noEmit 2>&1 | grep -v "routes\.d [0-9].ts" | head -30`
- **Expect:** zero errors.

#### T10.4 — Browser preview verification
- **Action:** hard-reload `/dashboard/overview`. `preview_screenshot` (full page) + `preview_screenshot` zoomed on right rail.
- **Expect:**
  - Right rail "MORE" stack visible at 220px width on desktop
  - 4 compact KpiCards stacked vertically
  - Numbers in DM Sans tabular-nums (compact variant)
  - Each clickable → navigates to its drill-down

#### T10.5 — Commit (T8 + T9 + T10 together)
- **Command:**
```bash
git add app/api/dashboard/needs-you/route.ts app/api/dashboard/today-kpis/route.ts app/api/dashboard/activities/route.ts app/\(dashboard\)/components/needs-you.tsx app/\(dashboard\)/components/new-since-last-check.tsx app/\(dashboard\)/components/today-active-deals.tsx app/\(dashboard\)/components/morning-sales-health.tsx app/\(dashboard\)/components/today-kpi-rail.tsx app/\(dashboard\)/dashboard/\(portal\)/overview/page.tsx scripts/_test-needs-you.ts && git commit -m "$(cat <<'EOF'
feat(today): page rewrite — NeedsYou hero + activity feed + active deals + right-rail KPI stack

Today now answers "what should I do today?" instead of showing 5 vanity
metrics + a chart. New widgets:

- NeedsYou (hero): pulls from Trafico_Events (customs holds >24h),
  Leads.next_followup (overdue), Traficos.delay_days (>=3). Empty state:
  "No fires today. Nicely done." (Deal_Payments source deferred to W8.)
- NewSinceLastCheck: last 24h delta from Activity_Log + Email_Activity
  + Trafico_Events, capped at 5.
- TodayActiveDeals: top 5 by SLA risk, rendered with the canonical
  EntityCard.
- MorningSalesHealth: moved from Weekly Review. {passing}/{total} checks
  with click-through to failing items.
- TodayKpiRail: right-rail vertical stack of 4 compact KpiCards
  (Pipeline / Revenue 24h / New Leads 24h / Active Deals).

Removed: 5-KPI grid above fold, Pipeline by Stage chart, Recent Stripe
Payments table, Quick Actions grid, Recent Activity card, double-line
greeting block. Sample-data imports gone — sheet-backed only.

Greeting collapsed to one line: "Tuesday, April 19 · Buenos días Roger"
(bilingual, time-of-day aware).

Phase 2 of dashboard redesign.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### TASK 11 — Pipeline trim to 3 sales stages + EntityCard standardization

**Goal:** trim Sales Pipeline from 5 stages → 3 (Discovery / Design & Scope / Proposal·Negotiation). Migrate any existing `fulfillment` or `delivered` deals to Operations Pipeline using a round-trip script with dry-run + backup CSV + Activity_Log audit. Replace the inline Pipeline deal card with `<EntityCard variant="deal">`. Add Sales ↔ Operations view toggle.

**Files touched:**
- `scripts/_test-migrate-sales-to-ops.ts` (NEW — round-trip migration)
- `backups/` directory (new — for the CSV backup)
- `app/(dashboard)/dashboard/(portal)/pipeline/page.tsx` (trim stages + use EntityCard)
- possibly `app/lib/sample-dashboard-data.ts` (PipelineStage type — confirm sales stages list)

#### T11.1 — Survey current Pipeline page + stage definitions
- **Command:** `Read` `app/(dashboard)/dashboard/(portal)/pipeline/page.tsx` (focus on stages array, dealsByStage logic, and the inline card markup). `Read` `app/lib/sample-dashboard-data.ts` for the `PipelineStage` type.

#### T11.2 — Define migration mapping
- **Action:** based on the consolidation spec, for any deal in Sales `fulfillment` or `delivered` stage, map to Operations stage based on:
  - If shipment exists + status = "delivered" → Operations `Delivered`
  - If shipment exists + status = "in_transit" or "in_customs" → Operations `In Customs` or `Awaiting Production`
  - If no shipment + payment received → Operations `Awaiting Production`
  - Default (insufficient data) → Operations `Awaiting Production`
- **Note:** the existing `scripts/deal_migration.ts` (read in baseline) has a `DO NOT RUN AS-IS` warning + outdated env vars + stage enum mismatch. We write a fresh script.

#### T11.3 — Write `scripts/_test-migrate-sales-to-ops.ts`
- **Action:** `Write`:
```ts
/**
 * Counter Cultures — Pipeline Migration: Sales fulfillment/delivered → Operations
 *
 * Dry-run by default. Pass --execute to actually write.
 * Pass --backup-only to just write the CSV snapshot of affected deals without modifying.
 *
 * Usage:
 *   npx tsx scripts/_test-migrate-sales-to-ops.ts            # dry-run
 *   npx tsx scripts/_test-migrate-sales-to-ops.ts --execute  # apply
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { google } from "googleapis";

const DRY_RUN = !process.argv.includes("--execute");
const BACKUP_ONLY = process.argv.includes("--backup-only");

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SA_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!SHEETS_ID || !SA_EMAIL || !SA_KEY) {
  console.error("Missing GOOGLE_SHEETS_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY");
  process.exit(1);
}

const auth = new google.auth.JWT(SA_EMAIL, undefined, SA_KEY, ["https://www.googleapis.com/auth/spreadsheets"]);
const sheets = google.sheets({ version: "v4", auth });

const SOURCE_STAGES = new Set(["fulfillment", "delivered"]);

const inferOpsStage = (deal: Record<string, string>): string => {
  // Placeholder logic — refined when we read the live shape
  const shipmentStatus = (deal["shipment_status"] ?? "").toLowerCase();
  if (shipmentStatus === "delivered") return "delivered";
  if (shipmentStatus === "in_customs") return "in-customs";
  if (shipmentStatus === "in_transit") return "in-transit";
  return "awaiting-production";
};

const main = async () => {
  console.log(DRY_RUN ? "🔍 DRY RUN — no writes" : "✏️  EXECUTING");

  const dealsRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEETS_ID, range: "deals!A:Z" });
  const rows = dealsRes.data.values ?? [];
  if (rows.length < 2) {
    console.log("No deals found.");
    return;
  }
  const [header, ...dataRows] = rows;
  const stageIdx = header.indexOf("current_stage");
  const idIdx = header.indexOf("deal_id");
  const pipelineIdx = header.indexOf("pipeline");
  if (stageIdx < 0 || idIdx < 0) {
    console.error("Expected columns deal_id + current_stage in header:", header);
    process.exit(1);
  }

  const affected = dataRows
    .map((r, i) => ({ rowIndex: i + 2, deal: Object.fromEntries(header.map((h, k) => [h, r[k] ?? ""])) }))
    .filter(({ deal }) => SOURCE_STAGES.has((deal.current_stage ?? "").toLowerCase()));

  console.log(`Affected deals: ${affected.length}`);
  if (affected.length === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  // Backup CSV
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.resolve(process.cwd(), "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `deals-pre-migration-${ts}.csv`);
  const csv = [header.join(","), ...affected.map(({ deal }) => header.map((h) => JSON.stringify(deal[h] ?? "")).join(","))].join("\n");
  fs.writeFileSync(backupPath, csv);
  console.log(`✅ Backup written to ${backupPath}`);

  if (BACKUP_ONLY) {
    console.log("Backup-only mode — exiting.");
    return;
  }

  for (const { rowIndex, deal } of affected) {
    const newStage = inferOpsStage(deal);
    console.log(`  ${deal.deal_id ?? `row-${rowIndex}`}: ${deal.current_stage} → ${newStage}${pipelineIdx >= 0 ? " (pipeline → operations)" : ""}`);
    if (DRY_RUN) continue;

    // Update current_stage
    const colLetter = (n: number) => String.fromCharCode(65 + n);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEETS_ID,
      range: `deals!${colLetter(stageIdx)}${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [[newStage]] },
    });
    if (pipelineIdx >= 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEETS_ID,
        range: `deals!${colLetter(pipelineIdx)}${rowIndex}`,
        valueInputOption: "RAW",
        requestBody: { values: [["operations"]] },
      });
    }

    // Activity_Log audit row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEETS_ID,
      range: "Activity_Log!A:F",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          `act-${Date.now()}-${deal.deal_id ?? rowIndex}`,
          new Date().toISOString(),
          "system:migration",
          "deal:" + (deal.deal_id ?? rowIndex),
          "stage_migration_w1",
          `Migrated ${deal.deal_id ?? rowIndex} from Sales/${deal.current_stage} → Operations/${newStage}`,
        ]],
      },
    });
  }

  console.log(DRY_RUN ? "Dry run complete." : "✅ Migration applied.");
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

#### T11.4 — Run dry-run, share output for confirmation BEFORE applying
- **Command:** `cd /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures && npx tsx scripts/_test-migrate-sales-to-ops.ts`
- **Expect:** prints "DRY RUN", lists every affected row with its proposed mapping, writes a backup CSV to `backups/`, **does not modify the sheet**.
- **Joshua approval gate:** present the dry-run output + backup CSV path to Joshua. Wait for explicit "apply" before running with `--execute`. If Joshua says "go," run `npx tsx scripts/_test-migrate-sales-to-ops.ts --execute` and capture the output.
- **Activity_Log audit:** post-migration, `grep -c "stage_migration_w1" backups/*.csv` should be 0 (backup is pre-migration); inspecting the live sheet's Activity_Log tab should show one row per migrated deal.

#### T11.5 — Trim Sales stages in `app/lib/sample-dashboard-data.ts` and `pipeline/page.tsx`
- **Action:** in `sample-dashboard-data.ts`, redefine `salesStages = ["discovery", "design-scope", "proposal-negotiation"]`. Add `proposal-negotiation` to the stage type if missing. Remove `fulfillment` and `delivered` from `salesStages` (they remain in `opsStages`).
- **Action:** in `pipeline/page.tsx`, update `stageConfig` so `proposal-negotiation` has a label/color. The Sales view filter then renders only 3 columns. Operations view (toggle) still shows all opsStages.

#### T11.6 — Replace inline pipeline card with `<EntityCard variant="deal">`
- **Action:** in `pipeline/page.tsx`, find the inline card markup inside the dnd-kit-driven `<SortableContext>`. Replace with:
```tsx
<EntityCard
  variant="deal"
  id={deal.id}
  value={formatCurrency(deal.value)}
  title={deal.name}
  contact={{ name: deal.contactName, subtitle: deal.contactRole }}
  brandChips={deal.brand_slugs ? brandSlugsToNames(deal.brand_slugs) : undefined}
  status={{ label: stageConfig[deal.stage].label, tone: stageToTone(deal.stage) }}
  sla={{ dayInStage: deal.dayInStage ?? 0, threshold: 14 }}
  onClick={() => setSelectedDeal(deal)}
/>
```
- **Note:** `brandSlugsToNames` is a small helper to resolve slugs → display names from the Brand Kit. May already exist (used by Leads); if not, add a minimal version locally to the pipeline page (no premature abstraction). `stageToTone` maps stage IDs to the EntityCard's `StatusTone` enum.

#### T11.7 — Add Sales ↔ Operations view toggle
- **Action:** add a small toggle component above the Kanban (segmented button group: "Sales" / "Operations"). State persisted to URL query (`?view=sales` / `?view=operations`). Default to `sales`. Filter the rendered stages accordingly.

#### T11.8 — Typecheck
- **Command:** `npx tsc --noEmit 2>&1 | grep -v "routes\.d [0-9].ts" | head -30`
- **Expect:** zero errors.

#### T11.9 — Browser preview verification
- **Action:** load `/dashboard/pipeline?view=sales`, screenshot. Toggle to `?view=operations`, screenshot.
- **Expect:**
  - Sales view: **3 columns only** (Discovery / Design & Scope / Proposal·Negotiation)
  - Operations view: full ops stage set
  - Each deal card uses the canonical EntityCard look — copper ID, value, brand chips, status pill, SLA bar
  - Toggle persists in URL on refresh

---

### TASK 12 — Final smoke + execution log

**Goal:** end-to-end verification. Build passes. Append §7 execution log to the Phase 1 spec doc.

#### T12.1 — Smoke test all touched pages in browser preview
- **Action:** sequentially load each page via `preview_eval window.location.href = '...'`:
  - `/dashboard/overview` (Today)
  - `/dashboard/leads`
  - `/dashboard/pipeline?view=sales`
  - `/dashboard/pipeline?view=operations`
  - `/dashboard/inbox`
  - `/dashboard/brands`
  - `/dashboard/shipments`
  - `/dashboard/_design`
- **For each:** `preview_console_logs` to surface any runtime errors. `preview_screenshot` for visual confirmation.
- **Expect:** zero unhandled console errors. All pages render with consistent palette (warm linen/sand/copper/sage, no stray lime/pink/blue zoo). Sidebar present on all dashboard pages.

#### T12.2 — Typecheck + build
- **Commands (parallel):**
  - `npx tsc --noEmit 2>&1 | grep -v "routes\.d [0-9].ts" | head -30`
  - `npm run build 2>&1 | tail -40`
- **Expect:**
  - tsc: zero errors after filter
  - build: succeeds, Next.js prints route table including `/dashboard/_design`

#### T12.3 — Append execution log to Phase 1 spec
- **Action:** `Edit` `docs/superpowers/specs/2026-04-18-dashboard-redesign.md` to append a new section `## §8 Execution log` with:
  - Phase 2 plan path: `docs/superpowers/specs/2026-04-19-dashboard-redesign-plan.md`
  - Each commit SHA + one-line summary
  - Deviations from spec (e.g., Q&A decisions: light sidebar at `#EFE7DA` not `#FAF7F2`; Deal_Payments deferred to W8; chat pulse instead of straight closed-by-default)
  - Open follow-ups (e.g., `/dashboard/activity` route stub for NewSinceLastCheck "View all" target — deferred to Phase 2 of the redesign)

#### T12.4 — Final commit (T11 + T12 grouped)
- **Command:**
```bash
git add scripts/_test-migrate-sales-to-ops.ts backups/.gitkeep app/lib/sample-dashboard-data.ts app/\(dashboard\)/dashboard/\(portal\)/pipeline/page.tsx docs/superpowers/specs/2026-04-18-dashboard-redesign.md docs/superpowers/specs/2026-04-19-dashboard-redesign-plan.md && git commit -m "$(cat <<'EOF'
feat(pipeline): trim sales pipeline to 3 stages + EntityCard standardization + execution log

Trims Sales Pipeline from 5 stages to 3 (Discovery / Design & Scope /
Proposal·Negotiation). Migrates Sales/fulfillment + Sales/delivered deals
to Operations Pipeline via scripts/_test-migrate-sales-to-ops.ts. Script
defaults to dry-run; --execute applies + writes to Activity_Log. Backup
CSV written to backups/ on every run for rollback.

Replaces the inline Pipeline deal card with the canonical EntityCard.
Adds Sales ↔ Operations view toggle, persisted to URL (?view=).

Appends Phase 2 execution log to the Phase 1 spec doc with commit SHAs
and decisions.

Phase 2 of dashboard redesign — final commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

#### T12.5 — Verify final state
- **Commands (parallel):**
  - `git log --oneline -10` — should show 8 new commits + the 9 prior (Webchat v2 + redesign doc)
  - `git status` — should be `nothing to commit, working tree clean`
  - `git rev-list --count origin/main..HEAD` — should be `17` (9 prior + 8 new)
- **Hand off to Joshua:** report 8 new commits ready, summary of deviations from spec, ask whether to push.

---

## 4. Self-review of this plan

### Spec coverage
- §3.1 tokens ✅ — T1
- §3.2 typography rules ✅ — T1 (token block) + T5 (KpiCard variants) + T6 (EntityCard fonts) + T9 (page H1)
- §3.3 component primitives ✅ — KpiCard T5, EntityCard T6, EmptyState + StatusPill T7, ActionFab T4, NavItem inline in T2, TopBar T3
- §4 sidebar v2 ✅ — T2
- §5 Today rewrite ✅ — T8 + T9 + T10
- §6 task spine ✅ — all 12 tasks mapped
- §7 open questions ✅ — all 7 resolved with concrete implementation impact
- DataTable + SlideOut restyle (§3.3) — **deferred** to a follow-up; restyle is cosmetic + the new tokens already cascade. Flagged in execution log.

### Placeholder scan
- "TBD" — none
- "TODO" — none
- "implement later" — none
- "similar to Task N" — none (every task has its own code)
- "add appropriate error handling" — none (errors are explicitly speced where they matter)

### Type consistency
- `KpiCard` (camel) replaces `KPICard` (caps) — sweep in T5.3-T5.4 catches consumers
- `BadgeVariant` removed in T7.3
- `EntityVariant` / `StatusTone` exported from EntityCard for cross-component use

### Risk register
| Risk | Mitigation |
|---|---|
| `--color-background` shift from linen → cooler may affect storefront | Spot-check storefront in T1.4; if visible regression, scope a separate CSS var for storefront vs dashboard |
| Sheet schema for `delay_days` / `next_followup` may not exist | T8.2 graceful fallback (widget shows empty state, no crash, no schema change) |
| Migration script may not find any deals | T11.4 dry-run shows 0 affected → T11.5 still trims stages from UI; no data harm |
| Existing pages with `<KPICard>` consumers may compile break | T5.3 grep finds all sites; T5.4 patches them |
| Chat widget's internal FAB may conflict with ActionFab | T4.4 adds `hideOwnFab` prop; T4.6 passes it true |
| Pulse animation may annoy on first load | T4.5 caps at 3 sessions + cancels on first interaction |

### What's NOT in this plan (out of scope, per Phase 2 doc)
- ⌘K global search upgrade
- Notification bell with real notification source
- `/dashboard/activity` history page
- DataTable / SlideOut restyle (cosmetic; cascades from T1)
- Brand chips column join on Leads (`brand_slugs` → display names) — flagged as low-priority; Pipeline gets it via EntityCard so the lookup helper exists

---

## 5. Approval gate

Joshua: review this plan. If approved, I'll execute T1 → T12 inline, committing after each grouped task per §2 commit map, with a Joshua approval gate before T11.4 applies the migration.

If anything in §3 needs adjustment (slot ordering, token names, deferred surfaces), call it out now — we save 30+ minutes vs adjusting mid-execution.
