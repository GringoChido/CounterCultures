# Counter Cultures — MASTER PLAN

> **Single source of truth.** Generated 2026-05-18 from a full sweep of every PLAN/ROADMAP/SESSIONS/FIX/PROMPT doc, every git branch, every worktree, and the live `app/` tree.
>
> **Why this file exists:** doc sprawl. We had `PLAN.md` (Roger batch — stale), `COUNTER-CULTURES-ROADMAP.md` (P0–P3 — mostly current), `SESSIONS.md` (Session 1–35 — out of sync), 10+ loose `PROMPT-*.md` / `CLAUDE-CODE-*.md` files at the repo root, and 23 commits stranded in a worktree from May 10. This file consolidates all of it. No overlap.
>
> **Operating rules still apply:** `docs/SURGICAL-RULES.md` is law. Sacred Surface untouchable. One commit per logical change. Bilingual parity. Smallest possible diff.
>
> **🟢 NEW — 2026-05-25 forensic State of the Union added as [§1.5](#15-state-of-the-union--2026-05-25-forensic-5-touchpoint-handoff-read).** Read it after §0/§1. It verifies the "DONE" claims below against actual code + git (5 parallel audits), corrects what's stale in this doc, reframes the build around the 5 launch touchpoints (Website / Dashboard / Google Drive / Marketing / Email), and adds the missing **Workstream H — Handoff & Ownership Transfer** (Joshua hands the system to Roger's team on **July 7**, the day after the **July 6** launch).

---

## 0. THE BULLETPROOF RULE — read this FIRST, every session, no exceptions

> **Joshua's standing order (2026-05-18, supersedes all prior versions of this section):**
>
> **Nothing gets broken. Nothing gets overlapped. Nothing in-motion gets disrupted. We are ONLY enhancing from this point forward.**

This rule binds every Claude Code session, every PR, every commit. If a proposed change does not satisfy all four conditions in §0.1, the change does not happen. Period. No exceptions for "small" changes. No exceptions for "obvious" cleanups.

### 0.1 The four conditions — ALL must be true for any session to proceed

| # | Condition | What it means |
|---|---|---|
| **C1** | **NO REGRESSION** | The change does not alter the behavior of any Sacred Surface item (§2). Form can change. Behavior cannot. If a Sacred Surface item is *touched*, before/after evidence is mandatory and parity-or-better must be proven. |
| **C2** | **NO OVERLAP** | Before writing code, prove the feature does not already exist on `main` in some form. Grep the codebase. Check `app/lib/`. Check `§3` (recent shipping) and `§4` (stranded branches). If the feature exists partially, your session ENHANCES it — it never re-implements it from zero. |
| **C3** | **NO DISRUPTION OF IN-MOTION PROCESSES** | The processes listed in §0.4 run every day. Never touch any of them without Joshua's explicit YES recorded in the session log, before the work starts. |
| **C4** | **ONLY ENHANCE** | If a session removes existing user-visible behavior without adding equivalent-or-better behavior, the session is invalid. Cleanup of dead/dark code is allowed; cleanup of any reachable user-facing surface is not, without explicit approval. |

### 0.2 Pre-flight checklist — run BEFORE writing any code

```
[ ] Read AGENTS.md
[ ] Read docs/SURGICAL-RULES.md
[ ] Read this MASTER-PLAN.md §0, §2 (Sacred Surface), §6 (Active Queue)
[ ] Confirm my item is still PENDING in §6 (not silently DONE — check the merge log)
[ ] Grep the codebase for the feature / string / route I am about to add — confirm it does not already exist
[ ] Check §4 (stranded branches) — confirm no other branch is doing this same work
[ ] Check §8 (Joshua-decisions) — confirm no open question would change my scope
[ ] Capture before-state evidence (screenshot / curl / log line / counted query) — file it in the session log
[ ] If a Sacred Surface item or in-motion process (§0.4) is touched: I have Joshua's explicit YES, noted with timestamp in the session log
```

**If any box is unchecked, STOP and resolve before coding.** This is non-negotiable.

### 0.3 The DELETE-WHEN-DONE rule

Half the confusion that triggered this Master Plan came from completed items lingering as TODO in `PLAN.md`. To prevent the same trap:

When an item ships:

1. Same session: update its row to **`✅ DONE — sha <merge-sha> — <YYYY-MM-DD>`** in §6.
2. Next session opens: **delete the row entirely from §6.** It lives on in §10 (Change log) for history.
3. If the item was driven by a `docs/fixes/p*.md` file, `git rm` that fix file in the same PR as the work.
4. If the item was driven by a root-level `PROMPT-*.md` or `CLAUDE-CODE-*.md`, archive it per §5/§9 in the same PR.

**The plan should always show only what is still TO DO, not what was once on the agenda.**

### 0.4 In-motion processes — NEVER disrupt without explicit owner sign-off

These run every day, in staging and (some of them) in production. A change that pauses, throttles, rewrites, or even *brushes* any of these triggers C3 — invalid unless Joshua explicitly approves *in the session log* before work starts.

| Process | Primary file(s) | Why protected |
|---|---|---|
| **Stripe webhook event dispatch** | `app/api/stripe/webhook/route.ts` | Drops in this path silently lose payments. Locked until P0.2 lands. |
| **Resend sandbox email send** (recipient-locked to admin@) | `app/lib/email.ts` | Every magic-link, every alert. Break this → customers cannot sign in. |
| **CRM Google Sheets writes** (header-keyed, R2 audit concurrency) | `app/lib/sheets.ts`, `app/lib/odoo/write.ts` | Shared between staging and operations. A bad write corrupts production CRM. |
| **Cron jobs** (`/api/cron/*`, probe-key gated) | `app/api/cron/*` | Nightly sweeps, FX sync, Odoo sync. Doubling them doubles work; breaking them freezes ops silently. |
| **Customer magic-link auth flow** | `app/lib/auth-options.ts` + Resend | Account creation + sign-in. Any break locks customers out. |
| **354K-SKU products cache** | `app/lib/products-full.ts` (30-min TTL, `byBrand` Map) | Catalog, PDPs, search results all read this. Cache miss → 10s cold start. |
| **MiniSearch index build** (cmd-K palette) | `app/lib/search-index.ts` | Search palette is on every page. Index errors → site-wide search down. |
| **WhatsApp inbound → auto-lead** | `app/api/webhooks/whatsapp/route.ts`, `app/lib/whatsapp.ts`, `app/lib/conversation-log.ts` | Primary sales channel. Drops here lose deals. |
| **Stripe trade-price charge path** | `app/lib/trade-pricing.ts` → Stripe PaymentIntent | Trade users expect their tier price. Bug → overcharges trade customers. |
| **IVA computation** (post-05-18 extract-from-inclusive) | `app/lib/iva.ts` | Regression here over- or under-charges every customer. |
| **PDP description resolver** (post-05-17) | `app/lib/pdp-description.ts` | Drives PDP meta, JSON-LD, OG tags. Regression → SEO loss across 354K PDPs. |
| **i18n locale toggle** (post-05-16, cookie + plain `<a>`) | `app/i18n/*` + locale toggle component | Sticky locale + ES/EN parity. Regression → users stuck in wrong language. |

To touch any of the above, the session MUST: (1) note intent in the session log, (2) get Joshua's explicit YES, (3) capture before-state evidence first, (4) make the change, (5) re-capture and prove parity-or-better in the final report.

### 0.5 Definition of "overlap" — three flavors, all banned under C2

1. **Re-implementing something that exists.** Example: writing a brand-new `Promo_Codes` sheet writer when `app/lib/dashboard-sheets.ts` already types `"Promo_Codes"` and `app/api/dashboard/trade-program/route.ts` already writes welcome codes to it. (Cf. §6/B2 — that item is partial scaffold; the session must extend the scaffold, never restart it.)
2. **Conflicting with a locked decision.** RF-4 (keep "Trade code" naming, no "Discount Code" rename). RF-5 (WhatsApp opt-in: unchecked-by-default for LFPDPPP). Branches that propose to reverse these are listed in §8 as Joshua-decisions, not in §6 as work. Do not merge any branch in §8 without resolving the decision first.
3. **Parallel work on the same surface.** If a `claude/*` branch in §4 is in flight touching the same files as your item, merge it or kill it FIRST. Never let two sessions touch the same surface in parallel. The recurring pattern in this repo (multiple branches per logical change) is exactly how the cartwright stack got stranded — see §4A.

### 0.6 Hard ABORT triggers — STOP mid-session if any of these happen

- A Sacred Surface item shows behavior change you didn't intend.
- An in-motion process (§0.4) errors or silences after your change.
- `npm run build` or `npm run lint` fails on a step you can't fix in <10 minutes.
- Bilingual parity broke (EN changed without ES, or vice versa).
- The fix-file scope grew >25% mid-session. Narrow back to original scope; file a follow-up for the rest.
- You discover a second branch doing the same work. Resolve which one to keep first.

When triggered: commit whatever is safe, document the trigger and current state in the session log, and message Joshua before continuing.

### 0.7 Session-end report — mandatory

Use the template in `docs/SURGICAL-RULES.md` verbatim, plus one new required line:

```
**§0 compliance:** all four conditions met  /  C<n> broken with approval in <link>
```

If C3 or C4 was knowingly broken without approval, the PR does not merge.

---

## 0.A How to use this doc

1. **Open this each morning.** It is the only place kept in sync.
2. **Pick the next item from §6 (Active Queue).** Items are ordered by leverage × unblocked-ness.
3. **Run the pre-flight checklist (§0.2).** Every box.
4. **One session = one item.** Branch per fix, commit per logical change, smallest possible diff.
5. **Apply DELETE-WHEN-DONE (§0.3).** Don't let shipped items linger.
6. **PLAN.md, SESSIONS.md, COUNTER-CULTURES-ROADMAP.md are SECONDARY.** History only. Update this file first.
7. **Root-level `PROMPT-*.md` / `CLAUDE-CODE-*.md` are archive-only** — see §9.

---

## 1. Status as of 2026-05-18 (trunk = `main`, sha c5f28ff)

**Recent shipping on `main` that is NOT in PLAN.md, SESSIONS.md, or ROADMAP.md:**

| sha | date | what |
|---|---|---|
| c5f28ff | 05-18 | `fix(iva)`: extract IVA from tax-inclusive prices (Mexican-law correct) |
| ad04062 | 05-18 | PR #76 — Antonina nav feedback (P1.18 — ROADMAP says DONE 05-14, actually merged 05-18) |
| 73e08df | 05-17 | PR #77 — `fix/pdp-description-wire-up` |
| 5b125d3 | 05-17 | PR #75 — `feat/pdp-description-resolver` (new PDP description fallback chain) |
| 0d065c4 | 05-16 | `fix`: bulletproof language toggle (plain `<a>` + cookie) — completes the i18n permanent fix |

→ These three threads (IVA-inclusive extract, PDP description resolver, i18n toggle) are **shipped but uncatalogued**. They are now logged in §3 below.

**Roger Step Plan (PLAN.md) — corrected status:**

| Step | PLAN.md says | Reality | Action |
|---|---|---|---|
| Step 4 — cart copy + opt-out | DONE PR #41 | ✅ Confirmed (sha 99c08c7) | — |
| Step 5 — PDP-only thumbnails | TODO | ✅ **MERGED PR #42** (sha 5813637) | Update PLAN.md |
| Step 6 — Brand Partners 404 | TODO | ✅ **MERGED PR #43** (sha c6b2e3f) | Update PLAN.md |
| Step 7 — Search quick-look | TODO | ✅ **MERGED PR #44** (sha 3af8dc7, branch is `step-7-search-quick-look` w/ hyphen) | Update PLAN.md |
| Step 8 — Trade pricing | not listed | ✅ **MERGED PR #45** (sha af27941) | Add to PLAN.md or retire |
| Step 10 — Project pricing alt-checkout | BLOCKED | ⛔ Branch never created. Real status: deferred until §6/B item built | Delete or rewrite |
| Step 11 — PDPs (354K SKU) | (mentioned in Step 12 note) | ✅ **MERGED PR #46** (sha 369a88f) | Mark closed |
| Step 12 — Brand pages redesign | BLOCKED on Step 11 | ⛔ Branch never created. Step 11 is done, so this is NOW UNBLOCKED — needs a fix file before it moves | Promote into §6 backlog |

**Top-level ROADMAP.md status (verified against code + git):**

- P0: 4 of 5 DONE. P0.2 (Stripe webhook secret) blocked on Roger granting Stripe team access. **No movement possible without that handoff** — Roger meeting tomorrow (May 19) is the unstick.
- P1: 8 DONE / 1 PARTIAL / 9 PENDING / 1 DEFERRED. Now folded into the 7-week sprint in §6.
- P2: 1 DONE / 15 PENDING. Launch-critical subset folded into Weeks 5–6 of §6; rest deferred to post-launch iteration.
- P3: 1 DONE / 6 PENDING (incl. 1 RESEARCH). Deferred to post-launch iteration by default.
- All seven Roger Feedback (RF-1 → RF-7) DONE in PR #47.

**🎯 LAUNCH ANCHOR — Monday July 6, 2026 (added v3, 2026-05-19).** Joshua committed to a fixed July 6 launch. The plan is now a **7-week sprint** (May 18 → Jul 6) rather than an indefinite "until staging is ready" frame. Phase 2 cutover is no longer placeholder — it has dates. See §6 (Active Queue) for the week-by-week breakdown and §7 for the cutover plan.

**Pre-Launch Foundation workstream (added v3, expanded v3.1; Concern 8 added v3.2).** Nine launch-critical concerns. **Concern 0 is foundational — everything else depends on it.**

0. **Source of Truth — multi-source data tangle (added v3.1).** Five sources currently in play: Squarespace (being scraped), Odoo (ERP), Google Sheets (`CC_Products_Full`, `Trade Pricing`, `Customers`, etc.), Google Drive (brand kits, attachments), manual admin entries. No canonical answer for "where does *price X* / *description Y* / *image Z* come from." Concerns 3/4/5/7 (descriptions / images / spec sheets / prices) all assume this is solved. It isn't yet.
1. Site loads slow (performance — CDN + ISR + keep-alive + search platform)
2. Full SEO/AEO overhaul needed before launch
3. Product descriptions needed on every PDP (Squarespace scrape → AI long tail → top-5K hand-edited)
4. Image scraping at scale (Squarespace scrape + brand-site scrape)
5. Spec sheet scraping + new PDP "Specs" section
6. Google Drive can't serve a 354K-product catalog — migrate to Cloudflare Images + R2
7. Communication channels + site nav need cleanup and activation (nav IA, WhatsApp outbound, Email Campaigns, Social Hub out of demo mode)
8. **Lead Engine (added v3.2, 2026-05-20).** The 6 homepage-hub tiles are 6 lead sources — the top of the marketing funnel — but a 2026-05-20 funnel audit found they leak: 2 of 6 work end-to-end, 3 dead-end into flat sheet rows needing manual pickup, 1 (Start a Project) loses the lead entirely. Every funnel must capture server-side + source-tag, create a Pipeline deal, auto-respond instantly, alert the team, and surface in one dashboard "Needs Outreach" queue. **Core ships by launch (Joshua, 2026-05-20);** nurture/outbound automation is the Week-5 marketing layer. Full spec + gap list in §6.

Each is addressed in a specific week of §6.

**Architectural authorizations granted 2026-05-19 (record so future sessions don't try to "restore"):**

- **Sacred Surface #3 (Trade Pricing) — partial reversal authorized.** The engine and data stay. The customer-facing rendering and the auto-charge path are pulled. Trade customers now see list prices on PDP/cart/checkout (same as regular customers), and at checkout get a "Submit Order for Review" flow instead of "Pay Now." Sales team manually quotes via templated email + WhatsApp with a Stripe payment link. Explicit Joshua YES recorded in this conversation. Full spec in §6/Week 1 (Phase 1 rendering pull) + Week 2 (Phase 2 workflow build).
- **RF-4 (Trade code naming) — SUPERSEDED.** Original RF-4 locked "Trade code" naming. The field's purpose changed (no longer a trade-customer identifier; trade customers route via account login). Renamed to **"Discount Code"** — its new job is promo codes + F&F discounts. `fix/cart-discount-code-label` branch (sha `0dc2208`) now moves from "Joshua-decision hold" to **MERGE** in §4B. **Smoke-check note:** the `Promo_Codes` sheet tab is written by `app/api/dashboard/trade-program/route.ts:133` but the route has a fallback log at line 147 ("tab may not exist yet") — the physical sheet tab in CRM may need manual creation when the Discount Code work runs.
- **Webchat retirement authorized.** Persistent corner widget becomes a WhatsApp click-to-chat button. Decommission target: `app/components/ui/chat-widget.tsx` + `chat-widget-lazy.tsx`, imported at `app/[locale]/layout.tsx:290`. One-line removal in layout. ⚠️ **Do NOT touch `app/(dashboard)/components/ai-chat-widget.tsx`** — that's the internal dashboard AI assistant, not customer-facing, leave alone. One channel (WhatsApp), three surfaces (inbound webhook, persistent click-to-chat, hub tile).

**Homepage Hub + Nav Simplification (added v3.1).** Joshua identified that the site has 7+ customer entry points (Start a Project, Account, Trade, Drop a Spec, Showroom, Search, Webchat) competing for attention, and the nav is crowded. Solution: **buyer-focused 6-tile homepage hub immediately under the hero**, plus utility entry points (Sign in, Search) move to top-right corner, WhatsApp becomes persistent click-to-chat widget, and a separate "Become a Brand Partner" section lives lower on the homepage (different audience — sellers, not buyers). Top nav simplifies to 5 items max. Full spec in §6/Week 1.

**Customer accounts — visibility gap surfaced 2026-05-19.** Joshua couldn't find his own customer sign-in on staging earlier. Verified state: feature **is** shipped (PR #40) and the link **is** in the site header at `/account/sign-in` (lines 251 + 441 of `header.tsx`). Both magic-link email and Google sign-in code paths exist. **Gap:** Google OAuth client (`GOOGLE_CLIENT_ID_CUSTOMER` + `GOOGLE_CLIENT_SECRET_CUSTOMER`) needs ~30 min of config in Google Cloud Console. Scheduled for Week 1, Tue–Wed (§6 below). Nav cleanup also promoted to Week 1 — the "I missed my own sign-in" moment is the canary that nav has grown unwieldy.

**Roger check-in doc shipped 2026-05-19.** `Counter-Cultures-Halfway-Checkin-Roger.docx` + `.pdf` at project root. 4 pages. Covers: what's built, the 7-week schedule, 7 concerns flagged with how each is addressed, 4 yeses needed from Roger (Stripe access, Meta Business admin access, Cloudflare $30–35/mo, email tooling $20–50/mo) + 3 quick decisions + 2 scope confirmations.

---

## 1.5 STATE OF THE UNION — 2026-05-25 (forensic, 5-touchpoint, handoff read)

> **What this is.** A from-scratch verification of where the system actually stands, requested by Joshua. Method: five parallel read-only audits against the live `app/` tree and full git history (storefront, dashboard/portal, Google/data backbone, lead-engine/marketing, email/transactional) + direct spot-checks. Every claim below is code- or git-verified; file:line and shas are the evidence. **This section is additive — it does not alter §0/§2/§6. Where it contradicts an older row in this doc, §1.5 is the current truth and the older row is flagged for cleanup in §1.5/E.**
>
> **The frame Joshua thinks in:** 5 launch touchpoints — **Website · Dashboard · Google Drive · Marketing · Email** — mapped to the existing §6 week plan. **Launch = Mon Jul 6. Handoff to Roger's team = Tue Jul 7** (Joshua leaves). That one-day gap is itself a risk: there is no buffer to stabilize before the builder is gone (see §1.5/D-1).

### A. Headline

**The *build* is in genuinely good shape; the *content, the ownership, and the marketing layer* are not — and there is no handoff workstream at all.** Everything that was scoped as software (storefront UX, portal/CRM, search, sync, lead capture, transactional email infra) is verified shipped and mostly solid. The launch risk has moved off "is the code done" and onto four things this doc under-weights: (1) the catalog is **placeholder data** (no real prices, ~0% English, ~0% descriptions/images at 354K scale); (2) the entire system runs on **Joshua's personal Google identity** with no transfer plan; (3) **Marketing is ~0% live** and mostly gated on Roger-side approvals that have been pending for weeks; (4) there is **no runbook / ownership-transfer workstream** for a July-7 handoff. None of these are coding problems, which is exactly why a code-focused plan keeps missing them.

### B. Touchpoint scorecard

Split deliberately into **Built** (is the software there and working) vs **Launch/Handoff-ready** (will it actually serve real customers and survive Joshua leaving).

| Touchpoint | Built | Launch/Handoff-ready | One-line verdict |
|---|---|---|---|
| **1. Website** | ~85% | ~45% | Storefront, hub, nav, search, PDP, i18n, cold-start all verified done. Blocked by placeholder content + a wrong canonical domain, not by code. |
| **2. Dashboard / Portal** | ~85% | ~70% | All 26 Roger items + both "big rocks" shipped; Odoo sync fixed & live-verified. Held back by a finance-role permission gap, fabricated analytics, one un-gated cron, and the un-built "Needs Outreach" queue. |
| **3. Google Drive / Data backbone** | ~60% | ~30% | Sheets/Drive integration works and sync is healthy — but it's owned by a **personal Gmail**, image-CDN migration is 0% started, and the catalog data is placeholder. Biggest handoff risk lives here. |
| **4. Marketing** | ~20% | ~10% | Lead *capture* + source attribution work. Pipeline-ization, unified outreach queue, auto-responders, email campaigns, social, and WhatsApp outbound are all not-live — most gated on Meta/Klaviyo/Roger approvals. |
| **5. Email (transactional)** | ~90% | ~25% | Resend infra, redirect, templates, token-strip fix all verified. But **zero customer email sends until production DNS is verified**, and the flip is a 2-file/2-var change with no single switch. Customers can't even sign in until then. |

### C. What is VERIFIED done (so we never rebuild it — §0/C2)

- **Website:** 6-tile buyer hub with `?src=hub_*` tags + WhatsApp `?text=` prefill (`buyer-hub.tsx`); nav cut to 5 (`constants.ts:27`); WhatsApp float replaced webchat (`whatsapp-float.tsx`, `layout.tsx:290`; old `chat-widget*` deleted; dashboard `ai-chat-widget.tsx` correctly untouched); `/account/projects/new` exists, `two-paths-band` gone; catalog first-load `?brand=/?q=` fix with `urlReady`+AbortController (`catalog-view.tsx:208,219-232,256,267`); unified `scoreProduct` core with 15-case pinned test suite (`search-utils.ts:174`, `search-utils.test.ts`); search CDN-poisoning fix `private, no-store` (`api/products/search/route.ts:71`); cold-start snapshot hydrate + **non-blocking** background stock patch (`products-full.ts:150-178,215-257`); canonical PDP at `/shop/[category]/p/[slug]` (deprecated `/shop/quote/` deleted); cookie + plain-`<a>` i18n toggle.
- **Dashboard:** leads API hardened — zod + `Activity_Log` + `manage_leads` gate (`api/dashboard/leads/route.ts:157,207`); **Odoo→Sheets sync fully fixed and live-verified** — `batchUpsertRowsByField` kills the O(n²) writes (`dashboard-sheets.ts:333-407`), paging w/ 18s budget (`odoo/sync.ts:287-364`), `write_date` cursor on all 4 models (`108,128,150,164`), `purchase.order` added to hourly cron (`cron/odoo-sync/route.ts:39`); New Lead + New PO create flows (`createPurchaseOrder` `odoo/write.ts:478`, `create_po` gate); auth domain-locked to `@countercultures.com.mx` + break-glass (`auth-options.ts:14,18-22`) — `joshua@untold.works` correctly cannot sign in.
- **Roger's 26-item review + both "big rocks":** per `ROGER-FEEDBACK-ACTION-PLAN.md`, essentially all shipped and live (search rebuild `c41410a`, create-flows `bbfaae5`, descriptions infra/review-gate `70483d0/6c7a5c1/b0cfe0f`, CC/R&F relabel, sync restore, auth lock). 337 artisan descriptions live.
- **Email/Lead capture:** Start-a-Project is no longer a silent-drop stub — it captures via `submitLead` + alerts Roger/WhatsApp (`api/projects/[id]/request-quote/route.ts:27,36-40`); `submitLead` is now header-keyed with a `hub_source` column (`sheets.ts:336-363`); source attribution wired on contact/trade/showroom; Resend redirect intercepts every send (`email.ts:43-52`); `applyTemplateVars` strips unresolved tokens (`email-templates.ts:221-224`).
- **Git:** local `main` == `origin/main` at `6f15d35`. **Everything is pushed** (the §10 "push pending" note from 05-25 PM is stale — see E).

### D. BLIND SPOTS — the things the week-plan under-weights (Joshua asked: "help me see what I'm not seeing")

1. **Launch ≠ handoff, and there is no handoff workstream.** The entire plan optimizes for a Jul 6 *launch*. Joshua *leaves Jul 7*. There is no runbook, no ownership-transfer checklist, no "who fixes a broken cron / failed deploy / 429 storm" answer. Roger's team is sales + finance, not engineers. **This is the single biggest gap.** → new **Workstream H** below.
2. **The system runs on a personal Gmail.** The master CRM Sheet (`1iXG4A6...`) is owned by **`jsemolik@gmail.com`**, in personal My Drive, *not* a Shared Drive (`docs/baseline/06-data-quality.md:9-15`). Two *different* GCP projects/service accounts appear in the codebase vs the setup docs (`counter-portal-493716` in `.env.example:8` vs `gen-lang-client-0620971024` in `CC-Google-Workspace-Setup.html`). The customer-OAuth secret is held manually by Joshua (`§926`). **If Joshua's account goes away after handoff, Roger loses the CRM and the API credentials.** Nothing else matters if this isn't transferred.
3. **The catalog is placeholder data.** Every one of 354,449 `CC_Products_Full` rows has `list_price = 1.00 MXN`; `nameEn` == Spanish name (so `/en` shows Spanish); descriptions ~0.3% / images ~1.2% at 354K; 22 brand pages serve half-translated "Spanglish" copy (`06-data-quality.md`). The real merchandised catalog is **~4,236 SKUs**, not 354K. **Decision required: is the launch catalog the 4,236 real SKUs (achievable) or 354K (not by Jul 6)?** An e-commerce store with no prices/English/descriptions isn't a store — it's an SEO shell. The Week 3–5 content pipeline is already flagged "over capacity (~2 weeks of work)."
4. **The production domain is undecided and the SEO layer is hardcoded to the wrong one.** `BASE_URL = "https://countercultures.mx"` (no `.com`) is hardcoded in `sitemap.ts:16`, `robots.ts:42-43`, `[locale]/page.tsx:19`, `[locale]/layout.tsx:11,173`, `payment-methods/page.tsx:9`, `this-week/.../shell.tsx:33` — driving every canonical, OG, JSON-LD, sitemap URL, and the robots host. The business domain everywhere else is **`countercultures.com.mx`**. The Week 3 SEO pass and Week 7 301-redirect ranking-continuity plan are built on a domain string that may be wrong. **Lock the production domain now**, then make `BASE_URL` env-driven (`NEXT_PUBLIC_SITE_URL`, which the Stripe routes already read).
5. **Marketing is gated on Roger, and the clocks haven't started.** WhatsApp outbound needs **Meta Business approval** (1–2 wk clock, still **pending with Roger** per §6/Wk2 — Week-5 go-live slips with it); email campaigns need a **Klaviyo vendor pick + spend approval**; the image CDN needs **Cloudflare spend approval**; finance compliance + trade Phase 2 need **Stripe team access**. The build can be perfect and Marketing still won't be live Jul 6 if these aren't unblocked **this week**.
6. **No real end-to-end money-path test.** Trade pricing was pulled to a manual "quote via email + Stripe payment link" flow. Stripe webhook secret is **blocked (P0.2)** pending Roger access; the webhook is an in-motion process (§0.4). Nobody has run a real order → payment → factura end-to-end. It's a Week-7 smoke step — late, and dependent on access that's still pending.
7. **Security tail (cheap to fix, real in production):** (a) the WhatsApp inbound webhook **accepts unsigned payloads** if `WHATSAPP_APP_SECRET` is unset (`api/webhooks/whatsapp/route.ts:192-199`) → anyone with the URL can inject Leads rows in prod; (b) the `follow-up-drip` cron is **not probe-key gated** (`route.ts:59-65`) while its siblings are → spoofable trigger could spam customer drips; (c) marketing analytics ships **fabricated numbers** (see touchpoint 2) Roger's team may treat as real and export to CSV.
8. **Permission gap that will confuse the team day one.** Finance role has `manage_leads` but **not** `view_leads`/`view_pipeline` (`features.ts:72-96`) → Antonina can edit leads she can't see (403). Several `view_*` features are owner-only by default, so staff will find nav items missing.
9. **Cutover is a first-time, never-rehearsed, hard-date event** that touches production DNS for the first time, the day before the builder leaves, with the rollback plan still on paper (§7). Highest-variance moment in the whole project.

### E. Corrections this doc owes itself (so the push-from doc is accurate)

| # | Stale/incorrect in this doc | Reality (verified) | Fix |
|---|---|---|---|
| E1 | §10 (05-25 PM): Odoo-sync commits "LOCAL on `main` — push pending" | `origin/main == main` at `6f15d35`; nothing unpushed | Mark pushed; delete the "push pending" note |
| E2 | §6 Homepage-Hub spec + Lead Engine reference a live "Become a Brand Partner" section/form/API | **Removed** per Roger #13 ("do not add a place for vendors to solicit me"). `api/brand-partner` and the homepage section do **not** exist | Strike Brand Partner from §6/Lead-Engine; it's done-and-reverted, not pending |
| E3 | §2 Sacred Surface #2 lists PDP path `…/[category]/[subcategory]/p/[slug]` | Canonical PDP is `…/[category]/p/[slug]` (no subcategory) (`pdp-href.ts:27`) | Correct the path |
| E4 | §0.4 / §2 #13 describe `sheets.ts` "R2 audit concurrency" | **No R2 usage exists anywhere** in `app/` or `scripts/` | Remove the R2 claim; R2 is future (Wk 3–5) only |
| E5 | §10 Day-7: root docs archived, duplicates deleted, superpowers specs moved | Root still holds `FULL-PASS-AUDIT.md`, `…copy 2.docx`, all `PROMPT-*`/`CLAUDE-CODE-*`; working tree is dirty — the cleanup didn't durably stick (macOS-sync re-spawn likely) | Re-run §9 migration, commit it once |
| E6 | §10 Day-7: "78 branches deleted / 14 worktrees" | Now **36 local branches / 2 worktrees**; **24 branches carry unmerged commits** | Re-triage the 24 unmerged branches (most are abandoned) |
| E7 | Two live driver docs (`MASTER-PLAN.md` + `ROGER-FEEDBACK-ACTION-PLAN.md`) have **diverged** (Brand Partner) | Doc says fold Roger doc in "post-launch" | Fold now — one driver, before they diverge further |

### F. NEW — Workstream H: Handoff & Ownership Transfer (the missing pillar)

> Owner: Joshua. Target: complete by Jul 6 so Jul 7 is a clean walk-away. **None of this is coding — it's the difference between "launched" and "handed off."**

| # | Item | Why it's load-bearing |
|---|---|---|
| H1 | **Transfer Google ownership.** Move the CRM Sheet + Brand Kit out of `jsemolik@gmail.com` into a `@countercultures.com.mx` Shared Drive; decide the canonical GCP project, rotate the service-account key into it, hand Roger ownership of the project + the customer-OAuth client/secret. | D-2 — without this, the business loses its CRM + all API creds when Joshua's account lapses. |
| H2 | **Account/credential inventory + transfer:** Netlify, Resend, Stripe, Meta Business, Cloudflare (when created), domain registrar, Sentry. Who owns each, who pays, who can rotate keys. A single sheet. | No named owner = no one can fix or pay for anything post-handoff. |
| H3 | **Operations runbook:** the recurring manual tasks the system depends on — weekly `CC_Products_Full` sync, the pre-launch fresh full sync, manual trade quoting (email + Stripe link), cron health, what each `/api/cron/*` does, how to redeploy (and that `prebuild` builds the snapshot — skipping it = 10s cold starts). | The system has manual steps only Joshua knows. |
| H4 | **"When it breaks" guide:** failed deploy, 429 storm, sync stalls, magic-link not sending, webhook 5xx. Symptom → check → fix. Plus: who is the technical owner after Jul 7? (Currently nobody — flag for Roger.) | Bus factor = 1. |
| H5 | **Env-var cutover switch:** document/automate the staging→prod flip (`STAGING_EMAIL_REDIRECT` unset + `RESEND_FROM_TRANSACTIONAL` → verified domain + `BASE_URL`/`NEXT_PUBLIC_SITE_URL` → real domain + WhatsApp/Meta secrets). Today it's a multi-file, multi-var change with no single switch and no checklist. | Touchpoint 5 — customers can't sign in until this is flipped correctly. |

### G. Reprioritized critical path to Jul 6 / handoff Jul 7

Ruthless ordering — "deliver a working product," no rework, no busywork:

1. **This week — unblock the Roger-gated dependencies (D-5).** Stripe access, Meta Business admin, Cloudflare + Klaviyo spend approvals, `GOOGLE_CLIENT_SECRET_CUSTOMER`. Every one is async with a clock; nothing in Marketing/Finance/Trade-Phase-2 moves until these land. *Send the asks today.*
2. **This week — lock scope decisions (D-3, D-4).** (a) Launch catalog = the ~4,236 merchandised SKUs (real prices/EN/descriptions/images), 354K stays as SEO long-tail with graceful fallbacks. (b) Production domain = `countercultures.com.mx` (or `.mx` — decide), then make `BASE_URL` env-driven.
3. **Cheap correctness/security fixes (D-7, D-8, E1–E4)** — a half-day: gate `follow-up-drip`, require `WHATSAPP_APP_SECRET`, fix the finance `view_leads` gap, replace fabricated analytics with "data pending" states, and apply the §1.5/E doc corrections. High value, low risk.
4. **Start Workstream H now (D-1, D-2)** — H1 (Google ownership) is the longest pole and the highest stakes; begin immediately, don't leave it for Week 7.
5. **Content pipeline, triaged to the real catalog (Wk 3–5).** Real prices (fresh Odoo sync), EN names + descriptions + images for the merchandised SKUs first; long-tail AI fills behind graceful fallbacks. This is THE launch-credibility lever.
6. **Marketing — only as far as approvals allow (Wk 5).** Lead-engine core (pipeline-ize the 6 funnels + unified "Needs Outreach" queue + auto-responders) is buildable now and is the highest-leverage Marketing work that *isn't* gated. Klaviyo/Social/WhatsApp-outbound follow their approvals.
7. **Rehearse the cutover (Wk 7), not just plan it (D-6, D-9).** A real order→payment→factura dry run, a tested rollback, and the env flip (H5) — before, not on, Jul 6.

---

## 2. Sacred Surface — DO NOT BREAK

(Reference only — full detail in `docs/SURGICAL-RULES.md`. Each item lists the primary file(s) to know before editing nearby.)

| # | Surface | Primary files |
|---|---|---|
| 1 | Cart + checkout (multi-project, IVA breakout, shipping picker, trade code, oversized freight, Stripe redirect, cart-share email) | `app/lib/stores/cart-store.ts`, `app/lib/iva.ts`, `app/api/cart/*`, `app/api/checkout/*`, `app/[locale]/cart/page.tsx`, `app/[locale]/checkout/checkout-stepper.tsx` |
| 2 | PDPs (354K SKU, ISR, JSON-LD, search-palette nav, related products, trade-price, Add-to-Project, finish picker, "Precio neto" caption) | `app/[locale]/shop/[category]/[subcategory]/p/[slug]/page.tsx`, `app/lib/products-full.ts`, `app/lib/slug.ts`, `app/lib/pdp-href.ts`, `app/lib/pdp-description.ts`, `app/components/pdp/*` |
| 3 | Trade pricing engine | `app/lib/trade-pricing.ts` (+ Stripe charge path, PDP price display) |
| 4 | Customer accounts (NextAuth magic-link, Google OAuth, `STAGING_EMAIL_REDIRECT`, customer JWT) | `app/lib/auth-options.ts`, `app/lib/customer-auth.ts`, `app/api/auth/*`, `app/(customer)/account/page.tsx` |
| 5 | Email infra (Resend sandbox, ALERT_TEMPLATES, branded layouts) | `app/lib/email.ts`, `app/lib/email-templates.ts` |
| 6 | Tax-rate registry | `app/lib/tax-rates.ts`, `app/lib/iva.ts` |
| 7 | Search palette (cmd-K, MiniSearch brands+articles, server product search, quick-add CTAs) | `app/lib/search-index.ts`, `app/components/search/*`, `app/api/products/search/route.ts` |
| 8 | Catalog SWR cache (TTL + in-flight coalescing, `byBrand` Map) | `app/lib/products-full.ts` |
| 9 | Slug pipeline (canonical `toSlug` NFD-aware, CRM fallback, smoke tests) | `app/lib/slug.ts`, `app/lib/pdp-href.ts` |
| 10 | WhatsApp inbound (webhook → auto-lead, Conversation_Log) | `app/lib/whatsapp.ts`, `app/api/webhooks/whatsapp/route.ts`, `app/lib/conversation-log.ts` |
| 11 | Admin break-glass (admin@ / roger@ / control@ never locked out) | `app/lib/auth-options.ts` (lines 16–20) |
| 12 | CFDI early-prompt + tax-rate-aware factura | `app/lib/ar-factura.ts`, `app/lib/factura/provider.ts`, `app/lib/sat/*` |
| 13 | Sheet write hardening (header-keyed writes, auth gates, R2 audit concurrency) | `app/lib/sheets.ts`, `app/lib/odoo/write.ts` |

**Rule:** if a change *would alter behavior* of any of the above, STOP and confirm with Joshua before coding.

---

## 3. Recent post-roadmap work — now properly logged

These threads shipped between 2026-05-16 and 2026-05-18 with no fix-file entry. Catalog them here so they aren't accidentally re-implemented.

| Date | Thread | Files | What changed | Owner-decision needed? |
|---|---|---|---|---|
| 05-18 | IVA extract-from-inclusive | `app/lib/iva.ts` (+ callers) | Prices in the catalog are already IVA-inclusive (Mexican law). Cart math was double-adding 16%. Now extracts the IVA component from the inclusive price. | No — shipped. **But:** verify against `fix/net-price-label-iva-wording` branch (§4) which addresses the same wording question on the PDP caption. May supersede. |
| 05-17 | PDP description resolver (PR #75 + #77) | `app/lib/pdp-description.ts` (new), `app/[locale]/shop/.../page.tsx` | New fallback chain for product descriptions (CRM > Sheet > generated). Documented in `docs/commerce/PDP-DESCRIPTION-RULES.md`. | No — shipped. |
| 05-16 | i18n permanent fix (3 commits) | `app/i18n/*`, locale toggle component | Cookie-based locale toggle using plain `<a>` (not `Link`). Closes the long-running i18n flakiness. | No — shipped. **Cleanup:** `docs/i18n-migration-followups.md` lists remaining inline ternaries (P1/P2/P3) — see §6/D. |
| 05-17 | Antonina nav feedback (PR #76) | `app/[locale]/checkout/*`, factura + dashboard surfaces | P1.18 entity badges, tinted totals, PDF download fix, tax-rate registry, role-aware contact picker. | No — shipped. ROADMAP already says DONE 05-14, real merge was 05-18. |

---

## 4. Stranded work — branches with unpushed commits

These commits exist nowhere except local branches. Each has a decision attached.

### 4A. `claude/objective-cartwright-0bf816` — DELETE OUTRIGHT (23 commits, last touched 2026-05-10)

**Smoke-checked 2026-05-18. This branch is not a feature stack — it is an older snapshot of main with features main has since redone.**

Diff vs main: **2,031 files changed, +3,701 / −109,187 lines total. Within `app/` alone: 242 files / +3,546 / −47,369.**

Critical evidence that this is OLDER STATE, not new work:

| File | Cartwright vs main | Interpretation |
|---|---|---|
| `app/(customer)/account/check-email/page.tsx` | −46 lines (deleted on cartwright) | Page exists in main; cartwright would *delete* it |
| `app/api/account/whatsapp-opt-in/route.ts` | −46 lines (deleted on cartwright) | Route exists in main; cartwright would *delete* it |
| `app/api/account/preferences/route.ts` | −22 lines (deleted on cartwright) | Route exists in main; cartwright would *delete* it |
| `app/lib/email.ts` | 109-line diff (older version) | Main has the shipped Resend + STAGING_EMAIL_REDIRECT version |
| `app/lib/customer-preferences.ts` | 120-line diff (older version) | Main has the shipped version |
| `app/lib/conversation-log.ts` | exists in both | Cartwright version is older — main is canonical |
| `docs/diagnostics/email-share-cart-2026-05-13.md` | −185 lines (deleted on cartwright) | Diagnostic doc exists in main; cartwright doesn't even know about it |

**Merging or cherry-picking this branch would DELETE shipped features.** This is the C1 + C4 violation pattern §0 was written to prevent.

**Decision: ⛔ DELETE the branch and the worktree. Do NOT diff-mine. Do NOT cherry-pick.** Every commit subject in this stack is already represented on main via a later, better implementation (PR #40 customer accounts, PR #45 trade pricing, PRs #46/#75/#77 PDPs, etc., plus the Sacred Surface items 1/4/5/10/12).

**Action item — A2 in §6 (downgraded from 2 hrs to 15 min):**

```bash
git worktree remove .claude/worktrees/objective-cartwright-0bf816 --force
git branch -D claude/objective-cartwright-0bf816
```

If you are paranoid: tag it first (`git tag archive/cartwright-2026-05-10 claude/objective-cartwright-0bf816`) so the commits remain reachable for 90+ days. Then delete the branch.

### 4B. Small fix branches — ✅ TRIAGED 2026-05-21

| Branch | Disposition | Notes |
|---|---|---|
| ~~`claude/amazing-zhukovsky-707d87`~~ | ✅ MERGED 2026-05-21 | P&L latest-month default + footer Maps link + `/shop` → `/shop/catalog` + `/returns` → `/returns-warranty`. |
| ~~`claude/gallant-khayyam-1d2480`~~ | ❌ DROPPED 2026-05-21 | All 3 changes (cron auth, bootstrap, search dedup) already on main. Duplicate. |
| ~~`claude/dazzling-gates-6178ba`~~ | ❌ DROPPED 2026-05-21 | Link checker already on main (different approach but same function). |
| `fix/cart-share-email-error-handling` | 🟡 HOLD — Joshua-decision | Touches Sacred Surface #5 (email). `info@` vs `admin@` default sender? Wildcard allowlist breaks sandbox model. |
| ~~`fix/whatsapp-opt-out-default`~~ | ❌ DROPPED 2026-05-21 | LFPDPPP conflict. Explicit consent required for marketing. |
| ~~`fix/net-price-label-iva-wording`~~ | ❌ DROPPED 2026-05-21 | Stale — target file `product-detail.tsx` deleted Day 2, `order-summary.tsx` IVA wording already updated on main. |
| ~~`fix/cart-discount-code-label`~~ | ✅ MERGED 2026-05-21 | RF-4 superseded. "Trade code" → "Discount Code". |
| ~~`fix/projects-404`~~ | ✅ MERGED 2026-05-21 | Removed incorrect `/en/` locale prefix from project page URLs. |
| ~~`fix/cc-llc-color-scheme-reports-ap`~~ | ✅ MERGED 2026-05-21 | Novel CC/LLC color coding for AP views (Antonina-facing). |
| `fix/local-delivery-signature` | 🟡 HOLD — Joshua-decision | Net-new feature (Miguel local courier). Not in roadmap. Scope decision needed. |
| ~~`claude/eloquent-stonebraker-cc7e55`~~ | ✅ DELETED 2026-05-21 | No unmerged commits. Worktree removed. |

### 4C. Stash & orphan commits

- `1d2c65b` — "On main: !!GitHub_Desktop<main>" — auto-stash from 05-16. Inspect via `git show 1d2c65b`. Almost certainly garbage; will be GC'd in 90 days regardless.
- `a733935` — companion index entry. Same disposition.

### 4D. Worktrees

63 worktrees under `.claude/worktrees/`. **~42 are already merged into main** (safe to prune — see ROADMAP P2.6). **~21 contain at-least-1 unmerged commit** — most of those map to one of the §4A/B entries above.

**Action item:** P2.6 (`docs/fixes/p2-worktree-cleanup.md`) is now elevated to **Priority NOW** — see §6/A. Reclaim ~15 GB.

---

## 5. Document hygiene — what to archive, what to delete, what to consolidate

### 5A. Root-level loose docs — MOVE to `docs/archive/prompts/`

These were one-shot prompts whose output now lives in a canonical rules file or fix file. Keep for history, get them out of the way.

**Full inventory: 6 `CLAUDE-CODE-*.md` + 15 `PROMPT-*.md` + 2 miscellaneous = 23 root-level prompt files.**

| File | Output lives at / disposition | Action |
|---|---|---|
| **CLAUDE-CODE-***.md (6 files)* | | |
| `CLAUDE-CODE-AP-TAB-AND-DOC-VIEWER-FIX.md` | `docs/finance/blockers/ap-pass-baseline.md` | Archive |
| `CLAUDE-CODE-CART-FEATURE.md` | `docs/commerce/CART-RULES.md`, `LIFECYCLE-STATE-MACHINE.md`, `COMMUNICATION-MATRIX.md` | Archive |
| `CLAUDE-CODE-FINANCE-FIXES.md` | `docs/finance/CLAUDE-FINANCE-RULES.md` | Archive |
| `CLAUDE-CODE-SURGICAL-FIXES.md` | `docs/SURGICAL-RULES.md` | Archive |
| `CLAUDE-CODE-PORTAL-REMOVAL.md` | /portal redirect (shipped via cartwright stack or follow-on PR — confirm during §4A diff sweep) | Archive after confirm |
| `CLAUDE-CODE-PROMPT.md` | Generic kickoff prompt — superseded by AGENTS.md + SURGICAL-RULES | Archive |
| **PROMPT-***.md (15 files)* | | |
| `PROMPT-MASTER.md` | Likely an earlier master-plan attempt — read once before archiving, may have ideas not captured here | **Read first**, then Archive |
| `PROMPT-master-fixes.md` | Older batched-fixes prompt | Archive |
| `PROMPT-brand-heroes-batch2.md` | Brand hero image batch (Roger creative work) | Archive (or move to `docs/archive/creative/`) |
| `PROMPT-cart-checkout-mexican-modernization.md` | `docs/fixes/p1-cart-iva-shipping-methods.md`, `p1-mexican-fiscal-fields.md`, `p1-factura-stripe-bridge.md` | Archive |
| `PROMPT-category-page-redesign.md` | Shipped (category pages live under `app/[locale]/shop/[category]/`) | Archive |
| `PROMPT-category-subcategory-product-pages.md` | Shipped — Sacred Surface #2 (PDPs) | Archive |
| `PROMPT-dashboard-crm-sales-system.md` | Shipped — Sacred Surface backbone + ROADMAP P1.9 covers further work | Archive |
| `PROMPT-homepage-redesign.md` | Shipped | Archive |
| `PROMPT-i18n-permanent-fix.md` | `docs/i18n-postfix.md` + shipped on main 05-16 | Archive |
| `PROMPT-legal-policy-pages.md` | Shipped (`/privacy`, `/returns*`, `/sales-delivery`) | Archive |
| `PROMPT-performance-fix.md` | Shipped — covered by Sacred Surface #8 + ROADMAP P2.3 | Archive |
| `PROMPT-product-search-preview-insert.md` | Shipped — Sacred Surface #7 (cmd-K palette) | Archive |
| `PROMPT-restore-and-protect-pdp-descriptions.md` | Shipped — PR #75 + #77 + `docs/commerce/PDP-DESCRIPTION-RULES.md` | Archive |
| `PROMPT-product-category-audit.md` | **GAP — no fix file exists** | Convert to `docs/fixes/p2-product-category-taxonomy.md` (§6/C1), then archive |
| `PROMPT-pedimento-customs-module.md` | `docs/finance/CLAUDE-FINANCE-RULES.md` §17–22 + `/tmp/cc-worktree` branch `pedimento-prompt` | **Decide first** (§6/C2 — continue or freeze), then archive |
| **Miscellaneous** | | |
| `FULL-PASS-AUDIT.md` | `docs/baseline/*` (post-audit findings) + `docs/SURGICAL-RULES.md` | Archive |
| `HOMEPAGE-RESTRUCTURE-PROMPT.md` | Shipped (BrandStatement + expanded BrandBar) | Archive |

### 5B. Files to DELETE (genuine duplicates from macOS sync conflicts)

```
docs/SEARCH-AUDIT-2026-05-11 2.md           (identical to non-2 version)
docs/SEARCH-FIXES-IMPLEMENTATION 2.md       (identical to non-2 version)
Counter-Cultures-Full-Plan copy 2.docx
Counter-Cultures-Full-Plan copy.docx
Counter-Cultures-Proposal copy.docx
CC-Image-Library 2/                         (verify before deleting)
```

Covered by `docs/fixes/p2-doc-consolidation.md`.

### 5C. Files to RETIRE

- `docs/superpowers/specs/*.md` (15 April-2026 design docs) — work shipped, specs are historical only. Move to `docs/archive/superpowers/`.

### 5D. PLAN.md, SESSIONS.md, COUNTER-CULTURES-ROADMAP.md

**Keep all three** (don't delete the working memory) but:

- Update **PLAN.md** to reflect §1 corrections (Steps 5/6/7 DONE; Steps 10/12 either delete or rewrite).
- Add a banner at the top of each: `> This file is now SECONDARY. Source of truth: MASTER-PLAN.md.`
- Going forward, status updates land in MASTER-PLAN.md first.

---

## 6. Active Queue — 7-Week Sprint to July 6 Launch

> **Reframed 2026-05-19 (v3).** Launch is now anchored on **Monday, July 6, 2026.** The prior A/B/C/D/E priority structure is replaced by a week-by-week sprint. Old item IDs are preserved in parentheses (e.g. *was B2*) for cross-reference with existing notes.
>
> **Hard rule (§0):** every item below ENHANCES — never restarts — what's already built. Run the §0.2 pre-flight checklist before each session. Apply §0.3 DELETE-WHEN-DONE — completed rows leave §6 after the next session.

### How this is organized

- **Week 1 (May 18–25)** — Close out the original active backlog + new Week-1 additions (customer sign-in wire, nav cleanup)
- **Weeks 2–5 (May 26 – Jun 22)** — Pre-Launch Foundation (the 7 concerns)
- **Week 6 (Jun 23–29)** — Team review, bug bash, polish
- **Week 7 (Jun 30 – Jul 6)** — Pre-cutover prep, monitoring, customer comms, LAUNCH (§7 detail)
- **Post-launch** — Items that don't fit pre-launch by design (listed at the end)

Status legend: 🔴 PENDING · 🟡 IN PROGRESS · 🟢 DONE · ⛔ BLOCKED

---

> **🔄 RE-ANCHOR — 2026-05-25 (where we actually are).** Week 1 closed on schedule. A Roger-feedback detour (May 22–25 — see §10 and `ROGER-FEEDBACK-ACTION-PLAN.md`) then ran and **pulled work forward**: the **Week-5 in-house search-quality pass is done** (sha `c41410a`), and the **Week-3 artisan/AI-description** work is largely done (review gate + build guard + 337 descriptions live, incl. the copper/cobre priority). So two later-week anchors are already cleared. **To resume Week 2 with:** ~~the snapshot cold-start fast-follow~~ ✅ DONE 2026-05-25 (cold ~8.8s → ~2.5s); ~~the Odoo→Sheets PO/Sales sync lag~~ ✅ DONE + live-verified 2026-05-25 (lists now current to today's records — see §10). The original Week-2 search-migration anchor was dropped (in-house path) and the in-house search pass landed early, so **Week 2 is re-anchored (2026-05-25) on two NEW items from Roger's phone review: a smaller phone-friendly catalog grid + a design-refresh pass** (§6 Week 2), alongside the remaining verification debt and Week-1 carry-overs. Then Week 3's content pipeline (Squarespace scrape, CDN images, top-50K AI gen) leads as planned. The Roger 26-item detour is otherwise complete; fold its doc into this file post-launch to keep one driver.

### Week 1 — CLOSED ✅ (May 18–25) · Architecture FIRST, then cleanup propagated

> **Ordering principle (v3.1) — kept for the record:** consolidate sources/templates BEFORE individual fixes. *"I asked for the EN/ES picker to be removed weeks ago and it's still on some pages"* is the textbook multi-template symptom — declare ONE canonical template + ONE canonical source first; cleanup then applies once and propagates.

**All sequential Day 1–7 items shipped and pushed to `main`** (Day 1 `c67dae4` → Day 7 `4219b3b`). Full per-day detail lives in §10 Change log. Per §0.3 (DELETE-WHEN-DONE), completed rows are removed here; only unfinished work carries forward below. Day-1 audit findings that still drive scope: image coverage 1.2% and description coverage 0.3% (both more urgent than scoped → Week 2 scrape); 9 data sources, not 5; build-time Sheets API 429 = launch risk (mitigation Week 4).

#### Week 1 carry-overs → fold into Week 2

| Item | Effort | Notes |
|---|---|---|
| **Customer sign-in — final wire-up** (Joshua manual step) | 15 min (Joshua) | Code complete. Add `GOOGLE_CLIENT_SECRET_CUSTOMER` on Netlify: GCP Console → `counter-portal-493716` → Credentials → OAuth client `374048983912-ss013d...` → copy secret. Verify redirect URI includes `https://countercultures.netlify.app/api/auth/callback/google-customer`. |
| **Refactor 4 one-off product renderings** → shared `app/components/pdp/*` / `products/*`. Surfaces: catalog-view, product-drawer, catalog-search, product-detail-panel | 2–3 hrs | Inventory in `docs/data-sources-of-truth.md`. Non-customer-visible — safe to slip. |
| **Drive dashboard page fix** ("Failed to load") | 4 hrs | *(was B6)* P1.15. |
| **Project-share public viewable-link v2** — bundle with Trade Phase 2 (both touch project actions) | TBD | v1 (email + WhatsApp share from project detail) shipped Day 7 (`3b60ea2`). v2 adds a public viewable link. |
| **CC-Image-Library 2/ duplicate review** (Joshua) | 15 min (Joshua) | Flagged during Day 7 archive sweep — confirm it is not a pure duplicate before any delete (§9). |

#### Slipped from Week 1 — place during Week 2 scoping

> **Verified 2026-05-20:** none of these reached `main` (clean working tree, no stash/branch, live code in pre-work state). They are unfinished, not done.

| Item | Effort | Notes |
|---|---|---|
| **Homepage Hub + Nav Simplification** — 6-tile buyer hub under hero, separate Brand Partner section lower, top nav ≤5, WhatsApp click-to-chat replaces persistent webchat, Sign-in → top-right utility | 1.5 days | **Spec below.** Foundational — the Brand Partner section, Consultation tile, and WhatsApp click-to-chat already listed in Week 2 all hang off this. Webchat still wired (`chat-widget-lazy` imported in `app/[locale]/layout.tsx`). |
| **Squarespace scrape — resurrect + verify** | ~1 day | `scripts/scrape/` pipeline (01→12, incl. `05b-llm-match.ts`) exists from `ee9a0ae` (May 11). ENHANCE, do not rebuild (§0/C2): verify against current SS HTML + patch BEFORE Week 2's full scrape run. |
| **Deprecated checkout/Stripe route cleanup** | 2 hrs | *(was B7)* P1.16. Multiple concurrent paths still live: `checkout/{buy,submit,quote,discount-validate}`, `stripe/{checkout,payment-intent,create-payment-link,…}`. `checkout/quote` dangles post `/shop/quote/` deprecation. |
| **Sales / Marketing / Website analytics — kill hardcoded numbers** | 1 day | *(was B5)* P1.14. Conditional Wk-1 slip that didn't ship — needs a Week 2+ home. |
| **Mexican fiscal fields** (SAT codes) | 1 day | *(was B8)* P1.12. **Unblocks Factura↔Stripe.** Conditional Wk-1 slip that didn't ship. |

*(Dashboard reorganization, Search platform migration, and Finance compliance were also conditional Wk-1 slips that didn't ship — all three already appear in Week 2 below.)*

---

### Homepage Hub + Nav Simplification — spec (slipped from Week 1 → Week 2 build, ~1.5 days)

**Architecture:**

- **Top-right utility (every page):** Sign-in icon + cmd-K search icon. Compact. Never crowds the brand mark.
- **Persistent floating widget, bottom-right:** WhatsApp click-to-chat button. Replaces existing webchat. Same channel as Sacred Surface #10 (inbound) and Week 5 outbound activation — one channel, three surfaces.
- **Top nav (after cleanup):** 5 items max. Shop / Trade / Projects / About / Contact. Everything else → footer or hub.
- **Hero:** brand statement + ONE primary CTA ("Browse the Catalog"). Keep focused.
- **Immediately under hero:** the "354,449 authorized pieces" trust block.
- **In the white space below that block:** the **6-tile buyer hub**.
- **Lower on homepage:** separate "Become a Brand Partner" section (different audience — suppliers, not buyers).

**The 6 buyer tiles (each serves a distinct customer type):**

| Tile | For | Destination |
|---|---|---|
| Start a Project | Designer/builder planning multi-item buys | `/account/projects/new` (sign-in gate if anonymous) |
| Apply for Trade | Trade pro wanting tier-priced quoting access | Trade application form |
| Drop a Spec | Specifier who already knows what they want | Spec-drop intake form |
| Visit the Showroom | Local Mexico City clients | Showroom page (`/showroom` — exists per code map) |
| WhatsApp Us | Mexican-market default, all customer types | `wa.me/` click-to-chat link |
| Schedule a Consultation | High-touch buyer wanting a sales call | Google Calendar booking page (Week 2 setup) |

Icons: Phosphor or Lucide icon library (free, consistent, professional).

**"Become a Brand Partner" section (lower on homepage):**

- Distinct visual treatment (different background block)
- Single CTA → quick form (8 fields: brand, contact, email, WhatsApp, category, location, description, optional line-sheet PDF upload to R2)
- Writes to new `Brand_Applications` sheet tab + emails sales team
- Build effort: ~0.5 day (Week 2)

---

### Lead Engine — funnel standardization (spec, added 2026-05-20)

The 6 hub tiles are the **top of the marketing funnel — 6 lead sources.** A read-only buyer-hub funnel audit (2026-05-20) found the funnels leak: **2 of 6 work end-to-end** (Apply for Trade; WhatsApp / Sacred Surface #10), **3 capture but dead-end** into flat sheet rows needing manual pickup (Showroom, Drop-a-Spec, Consultation), and **1 loses the lead entirely** (Start a Project — the submit API is a stub that returns 200, creates no deal, sends nothing, while the UI claims "Roger will reply in 24h"). **Decision (Joshua, 2026-05-20): the Lead Engine CORE ships by launch;** nurture/outbound automation is the Week-5 marketing layer (Klaviyo email + WhatsApp outbound + Social).

**Per-funnel "definition of done" (all 6 funnels must meet all 6):**

1. **Capture server-side** + tag the **source** (which tile/campaign) — no localStorage-only.
2. **Create a Pipeline deal + lifecycle stage** (`evaluateAndTransition()`) — one source of truth, not a flat sheet row.
3. **Immediate auto-response to the lead** (email/WhatsApp) — acknowledgment + what's next.
4. **Team alert** (email/WhatsApp) on new activity.
5. **One unified "New Leads / Needs Outreach" dashboard queue** — owner + SLA, so reach-out is prompted, not remembered.
6. **Feed the marketing layer** — source attribution + (Week 5) nurture cadence.

Reference implementation to copy: **Apply for Trade** + **WhatsApp** already do the full loop.

**Launch-critical gaps (from the audit, reslotted):**

| # | Gap | Funnel | Week |
|---|---|---|---|
| G1 | Submit API `/api/projects/[id]/request-quote` is a STUB — the hub's flagship tile silently drops every lead. | Start a Project | **Wk 2 stop-gap** (honest capture + alert so nothing is lost) → **Wk 3 full** (Pipeline deal + auto-response, with Trade Phase 2 — this *is* its "submit for review" step). |
| G3 | No sign-in gate on `/account/projects/`. | Start a Project | Wk 2 (with hub) |
| G5 | Pre-fill the WhatsApp tile `?text=` (friction + auto-lead matching + attribution). | WhatsApp | Wk 2 (hub, zero cost) |
| — | **Source tags** on every tile destination (attribution from launch day). | All | Wk 2 (hub) |
| G2 | PDF spec drop has no server capture — extraction invisible to CC until a separate quote form. | Drop a Spec | Wk 3 |
| G4 | Showroom + Consultation leads land in flat sheets — no Pipeline deal/lifecycle, manual pickup. | Showroom, Consultation | Wk 3 |
| — | **Unified "Needs Outreach" dashboard queue** + standardized immediate auto-responders across all funnels. | All | Wk 3–4 (the "where it lives" + "instant ack" core). |
| G6 | Trade-application dedup. | Apply for Trade | Post-launch |
| G8 | Showroom gallery uses Unsplash placeholders. | Showroom | Wk 3 (content) |

**Marketing layer (Week 5, already in plan):** Klaviyo email + WhatsApp outbound + Social Hub consume these now-attributed leads with nurture cadences + conversion-by-tile analytics. The Lead Engine core guarantees Week 5 has clean, attributed pipeline to nurture instead of dead air.

---

### Week 2 — May 26 – Jun 1 · Mobile catalog grid + Design refresh (NEW ANCHORS) · re-anchored 2026-05-25

> **Anchored on Hub + Nav and Search migration** — both Stripe-independent, so the week can't stall waiting on Roger. Stripe-gated work and the full content pipeline are deferred to Week 3 (Joshua's call, 2026-05-20). Triaged to ~6 hrs/day; the flag-gated Search tail may spill into Week 3 safely.
>
> **Status 2026-05-21:** Hub + Nav fully SHIPPED (Mon `937180a`/`b2421d5`, Tue `84c5a6c` — see §10). **Search platform migration is the remaining Week-2 anchor.** Verification debt (mobile smoke, Brand Partner live-submit) carried below.
>
> **🔄 RE-ANCHOR 2026-05-25:** The original Week-2 search anchor is CLEARED — the external migration was dropped (in-house path, 2026-05-21) and the in-house search-quality pass landed early (`c41410a`). The Week-1→2 detour also cleared cold-start, the PO/Sales sync (done + live-verified), maker-page speed, and search reliability (CDN poisoning + first-load). **That frees Week 2 for two NEW anchors from Roger's 2026-05-25 phone review** — specced just below: **(1) a smaller, phone-friendly catalog grid** and **(2) a design-refresh pass.** These take priority; the verification debt and Week-1 carry-overs fill around them.

> **🔄 RE-TRIAGE — 2026-05-25 (PM, post-forensic [§1.5](#15-state-of-the-union--2026-05-25-forensic-5-touchpoint-handoff-read)).** The morning re-anchor (above) stood the two Roger phone-review anchors up as Week-2's lead. The afternoon forensic audit (§1.5) surfaced higher-priority launch-blockers that were **not in this queue**. This refines the morning order — it does not discard it. The two anchors stay; they now sit behind cheaper, higher-stakes work. **New Week-2 order, highest first:**

| # | Item | Type | Owner | Why it leads | §1.5 ref |
|---|---|---|---|---|---|
| **0a** | **Lock scope decisions** — (i) production domain (`countercultures.com.mx` vs `.mx`); (ii) launch catalog = the ~4,236 merchandised SKUs (real price/EN/desc/image), with 354K as fallback SEO surface | Decision | Joshua (+Roger for domain) | Both gate Weeks 3–5 (content) + Week 7 (301 map). The SEO layer is hardcoded to the wrong domain today. Added to §8 #14/#15. | D-3, D-4 |
| **0b** | **External dependencies — status (updated 2026-05-25 PM-2)** — **Meta** (WhatsApp outbound + Social) and **Cloudflare** (image CDN) both **deferred ~2 weeks** (Joshua) — *not sent now*; **build-around** them (feature-flag / URL-seam) so activation is a config flip, not a rebuild. `GOOGLE_CLIENT_SECRET_CUSTOMER` = Joshua self-serve. ~~Stripe access~~ ✅ granted (Roger #11) → P0.2 is a 15-min self-serve secret-set (`docs/fixes/p0-stripe-webhook-secret.md`; verify via Integration Health). ~~Klaviyo~~ ❌ declined (§8 #17). **→ Net: Week 2 has NO external blockers — build freely.** | Self-serve / build-around | Joshua | Meta + Cloudflare clocks start in ~2 wks; until then their consumers stay feature-flagged off (already true: WhatsApp dry-run + Social demo mode). | D-5 |
| **1** | **Pre-launch hardening batch** (one surgical fix-file) — gate the `follow-up-drip` cron · require `WHATSAPP_APP_SECRET` (reject unsigned inbound) · fix the finance `view_leads`/`view_pipeline` gap · replace fabricated marketing-analytics numbers with honest "data pending" states | Code · 1 session | Claude Code | Spoofable webhook + un-gated cron + fabricated numbers are live-in-prod risks; all cheap, low-risk, four unrelated files. **Leapfrogs the design polish.** | D-7, D-8 |
| **2** | **Doc-hygiene** — apply the §1.5/E corrections (strike Brand Partner from the §6 Hub spec + Lead Engine; fix the §2 PDP path; drop the §0.4/§2 "R2 audit concurrency" claim; re-run the §9 archive migration + commit once; clear the stale "push pending" note) | Doc/repo | Joshua / CoWork | Keeps the push-from doc accurate; the root is cluttered again and the working tree is dirty. | E1–E7 |
| **3** | **Phone-friendly catalog grid** (Week-2 NEW ANCHOR 1, below) | Code | Claude Code | Roger's ask; also clears the standing mobile-viewport verification debt. | — |
| **4** | **Design-refresh pass** (Week-2 NEW ANCHOR 2, below) | Code | Claude Code | Visual polish before Week-3 content fills these surfaces. | — |

**Sequencing guardrail (§0.5):** items **3 and 4 both touch `catalog-view.tsx`** (+ the shared product card) — run them in **series, never in parallel**, and keep `ProductGridSkeleton` aligned to the live grid in both. Item **1** touches four independent files and can run anytime.

**Workstream H (Handoff & Ownership — see §1.5/F) starts NOW and runs parallel through Week 7** — it is non-code and owned by Joshua. Week placement: **H1** (Google ownership transfer — move the CRM Sheet + Brand Kit off `jsemolik@gmail.com` into a `@countercultures.com.mx` Shared Drive, canonicalize the GCP project, rotate the service-account key, hand Roger the customer-OAuth client) and **H2** (credential/account inventory) begin **Week 2** — H1 is the longest pole and the highest stakes. **H3** (ops runbook) builds across **Weeks 3–6** as features settle. **H4** ("when it breaks" guide + name a post-handoff technical owner) **Week 6**. **H5** (the staging→prod env cutover switch) **Week 7**, folded into §7. *This is the difference between "launched" and "handed off."*

---

#### Week 2 NEW ANCHOR 1 — Phone-friendly catalog grid (Roger, 2026-05-25) · ~0.5–1 day

**The ask:** Roger was browsing on his phone and the catalog grid feels too large and sparse there — he wants a **smaller, denser grid that's phone-friendly.**

**Scope (layout-only, enhance):**

- Catalog product grid goes to **2 columns on phones** (today it drops to 1 wide column), with tighter card density, smaller imagery and type at narrow widths, and a comfortable tap-target size. Larger breakpoints unchanged.
- Touch points: the grid classes in `app/[locale]/shop/catalog/catalog-view.tsx`, the shared product-card component, and **`ProductGridSkeleton` must keep matching the live grid** (it was aligned during the search-regression fix — keep it aligned).
- **Closes the long-standing "mobile viewport unconfirmed" verification debt** that's been carried since the Hub ship — this work must be eyeballed on a real phone / narrow window, which also clears that debt for the Hub + Tuesday surfaces.

**Guardrails:** Sacred Surface #7 (search) / #8 (catalog cache) — layout/CSS only, no change to query semantics, fetch logic, or the cache. Prove the filtered/`?q=`/`?brand=` links and latest-wins fetch still behave (don't regress `15173da`).

#### Week 2 NEW ANCHOR 2 — Design-refresh pass (Joshua, 2026-05-25) · ~2–3 days (highest-traffic surfaces first)

**The concern:** as features and pages have piled on, the visual design has gone **flat** — inconsistent spacing, weak hierarchy, little depth. Needs a cohesive polish so the site reads as premium/considered, matching the luxury positioning.

**Scope (enhance-only, token-driven — NO behavior change):**

- **Visual audit first:** screenshot the key surfaces (homepage hub, catalog, PDP, brand/maker pages) and write a short, shared set of design principles + a small token set (type scale, spacing rhythm, elevation/shadow + border treatment, section backgrounds) before touching code, so the pass is intentional, not ad-hoc. Optional: 1–2 reference mockups for direction.
- **Apply, highest-traffic surfaces first:** homepage hub → catalog → PDP → brand/maker pages. Consistent use of the existing `brand-copper` / `brand-linen` / `dash-border` token system and Lucide/Phosphor icons; add depth (subtle elevation/layering on cards and section bands), tighten hierarchy and spacing. **No raw hex** — tokens only.
- Absorbs/supersedes the open **"Brand pages redesign" (§6 net-new C3)** decision item.

**Guardrails:** Sacred Surfaces #1 (cart) / #2 (PDP) / #7 (search) — **visual only, prove behavior parity** (Add-to-Cart, quote/checkout, search results unchanged). EN/ES parity held. Lands on the highest-traffic surfaces this week; deeper polish of secondary pages can extend into the Week-6 bug-bash if needed. This is a foundation for the brand experience, so do it before the Week-3 content pipeline fills these surfaces with descriptions/images.

---

**Morning-of asks (Joshua, Mon AM — before dev):**

- **Stripe team access** (§8 #1) — unblocks Trade Phase 2 + Finance compliance for Week 3.
- **Meta Business admin access** (§8 #2) — gates the WhatsApp submission below, which is async-critical for the Week 5 go-live.
- Set `GOOGLE_CLIENT_SECRET_CUSTOMER` on Netlify (15 min) — closes the Week-1 customer-sign-in carry-over.

| Day | Item | Effort | Notes |
|---|---|---|---|
| Wed–Thu | **Build-time products snapshot** (Sheets-API mitigation (c), pulled fwd from Wk 5) — generate a gzipped snapshot of `CC_Products_Full` at build; `load()` in `products-full.ts` hydrates from disk instead of the 10s cold Sheets fetch, with a live-Sheets fallback. Kills the cold-start AND the recurring brand-category pre-render **429 build failure**. $0, no new SaaS. | 2 days | ✅ DONE — sha `20c3800` — 2026-05-21. **Build-time 429s eliminated** (zero during `next build`). **Runtime hydration confirmed** — cold-start log: `Hydrated 354449 products from snapshot (/var/task/app/lib/generated/products-snapshot.json.gz) in ~8.8s` (includes stock-map Sheets fetch; snapshot parse alone ~2.5s at build). Warm hits 50–280ms. Catalog data frozen at deploy time (prices/SKUs update on redeploy; stock stays live). Key commits: `1185b2e` (mapping+generator), `81a9909` (prebuild+tracing), `20c3800` (import.meta.url Lambda path fix). Sacred Surface #8 unchanged — cache shape identical, source swapped Sheets→disk. |
| Fri | **WhatsApp Business setup BEGINS** — Meta verification + API account + template submission (async; goes live Wk 5) | 0.5 day active | ⚠️ **AT RISK — Meta access still PENDING with Roger (confirmed 05-21).** The 1–2 wk approval clock can't start until granted; the Wk 5 outbound go-live slips with it. Nudge Roger now. |
| Fri (if room) | **Cheap cleanup** — deprecated checkout/Stripe route cleanup (2 hr) *or* Drive dashboard fix (4 hr) | fill | Both Week-1 carry-overs. Slot only if Search finished early. |
| Carry-over (verification debt — from the 05-20/05-21 Hub ship) | **Mobile visual smoke** of the hub + Tuesday surfaces (the tooling can't simulate mobile — needs Joshua on a phone / narrow window) · **Brand Partner live-submit** end-to-end test · set **`NEXT_PUBLIC_CONSULTATION_BOOKING_URL`** once the shared team calendar exists · retire the now-dark **`/api/chat`** route · ~~**snapshot cold-start fast-follow**~~ ✅ DONE 2026-05-25 · **dup search-index doc id** fix (Sacred Surface #7) · Products **row 1223** invalid-subcategory data fix · `@netlify/plugin-nextjs` 5.15.9 → 5.15.11 bump | <1 day | ~~Snapshot cold-start~~ done (cold ~8.8s → ~2.5s). Mobile smoke + the rest are quick. All pre-launch (nothing deferred past Jul 6). See §10. |

**Deferred to Week 3 (Joshua's call, 2026-05-20):** Trade Program Phase 2 (4–5 d, Stripe-gated — project-share v2 rides with it) · the full content pipeline (Cloudflare+R2, full Squarespace scrape run, SKU matching, image migration — ~4–5 d) · Finance compliance (Stripe-gated) · Dashboard reorganization · Analytics (kill hardcoded numbers) · Mexican fiscal fields · the 4 one-off product-render refactors · **Lead Engine core** (full G1 with Trade Phase 2, G2 spec capture, G4 pipeline-ize Showroom/Consultation, the unified "Needs Outreach" dashboard queue + standardized auto-responders).

---

### Week 3 — Jun 2 – 8 · Content pipeline (slipped from Wk 2) + SEO technical + descriptions

> **⚠️ Over capacity (2026-05-20).** The full content pipeline slipped here from Week 2 (Joshua's call), on top of Week 3's existing SEO/description load — this is now ~2 weeks of work and will need its own triage when we reach it. The content pipeline is the prerequisite for everything else in Weeks 3–5, so it leads; expect the SEO-technical + AI-description rows to shift toward Week 4. **Plus the Lead Engine core** (full G1 with Trade Phase 2, G2/G4 pipeline-ization, the unified "Needs Outreach" dashboard queue + auto-responders — see the Lead Engine spec) **and Trade Phase 2 itself** now also target Week 3 → Weeks 3–4 are effectively one combined, over-capacity block. Sequence by dependency, cut overflow into Week 4 rather than overpacking, and re-triage at the top of Week 3 once Stripe access is known.

| Item | Effort | Notes |
|---|---|---|
| **Cloudflare Images + R2 set up** (accounts, API keys, Netlify env vars) | 1 day | Slipped from Wk 2. ~$30–35/mo at launch. Prerequisite for image migration. |
| **Squarespace scrape — resurrect + verify, then full run** — descriptions + images + spec PDF URLs across live SS product pages | ~2 days | Slipped from Wk 2 (+ the Wk-1 resurrect/verify of `scripts/scrape/`, 01→12). Largest single content lever. |
| **SKU matching** — deterministic + LLM-assisted disambiguation (`05b-llm-match.ts`) | 1 day | Slipped from Wk 2. |
| **Image migration to CDN** — scraped + existing Drive images → Cloudflare Images (writes new URL to catalog sheet) | 1–2 days | Slipped from Wk 2. **§0/C2:** touches the `products-full.ts` read path — ENHANCE around the shipped `BRAND_DISPLAY_MAP`, do not clobber. |
| **SEO technical pass** — page titles, meta descriptions, canonicals, hreflang (EN/ES), Open Graph, sitemap index for 354K PDPs | 2 days | NEW (v3). |
| **Scraped descriptions wired into PDPs** via existing `pdp-description.ts` resolver | 0.5 day | NEW (v3). Sacred Surface adjacent — verify resolver fallback chain still works. |
| **PDP H1 uses sidecar Spanish title when available** — consistency with meta-title + JSON-LD (Q2 resolution) | 0.5 day | **NEW (v3.1).** Audit Q2. |
| **AI descriptions wired into PDP resolver step 2.5** — `Product_Descriptions` (status=approved) reads added to `pdp-description.ts` between sidecar and CRM fallback. Keeps Roger approval gate, makes approvals actually render on PDPs (Q3 resolution). | 0.5 day | **NEW (v3.1).** Audit Q3. Necessary, not optional — Squarespace covers only 0.3% of catalog. |
| **AI-generated descriptions: top 50,000 SKUs not covered by Squarespace** — input: partner spec data + product attributes; LLM: Claude Sonnet | 2 days + ~$50 inference | NEW (v3). |
| **Priority — 96 `Counter / Gaby- Cobre` products** (names lack "Cobre"): get "cobre/copper" into name/description early in this pass | folds into AI-desc work | **NEW (2026-05-20).** The artisan brand normalization (§10) dropped "Cobre" from their brand string → "cobre"/"copper" no longer findable (high-intent MX query) and the material isn't customer-visible. A tiny targeted tag-enrichment is a faster alternative if needed sooner. |
| **Brand-site image scrape: top-tier brands** (Brizo, Delta, California Faucets, Emtek — partner scrapers from git history) | 1 day | NEW (v3). |

---

### Week 4 — Jun 9 – 15 · SEO on-page + 301 redirects + long-tail

| Item | Effort | Notes |
|---|---|---|
| **SEO on-page pass** — image alt text at scale (LLM-assisted), internal linking density (related products, related categories, related brands) | 2 days | NEW (v3). |
| **301 redirect map** — built from Squarespace sitemap → corresponding Netlify URLs. **Critical for Google ranking continuity.** | 1 day | NEW (v3). Ships as part of cutover (Week 7) but built now. |
| **Long-tail AI descriptions** — remaining ~300K SKUs that were never on Squarespace | 1–2 days + ~$300 inference | NEW (v3). |
| **Brand-site image fill-in** — remaining brands not covered Week 3 | 1 day | NEW (v3). |
| **Add `brand_id` column to CC_Products_Full** + update brand-page reads (Q5 — fixes brand-rename fragility) | 0.5 day | **NEW (v3.1).** Audit Q5. |
| **Bump `Odoo_Stock_Quants` sync to hourly** (Q7 — "In stock" badge accuracy) | 0.5 day | **NEW (v3.1).** Audit Q7. Confirm Odoo API can handle 24 daily read calls. |
| **Sheets API mitigation (a)** — submit Google Cloud Console quota-increase request for Sheets API | 30 min request + days for approval | **NEW (v3.1).** $0 cost. |
| **Sheets API mitigation (b)** — aggressive pre-render at build time + bump cache TTLs across product/brand readers | 1 day | **NEW (v3.1).** $0 cost. Trade-off: longer builds, no runtime fetches. |
| **Fresh full CC_Products_Full manual sync** from Odoo (Q1 — weekly cadence pre-launch) | 30 min ops | **NEW (v3.1).** Audit Q1. Repeat before Week 5 and again before launch. |

---

### Week 5 — Jun 16 – 22 · Top-5K polish + AEO + marketing channels live

| Item | Effort | Notes |
|---|---|---|
| **Top 5,000 product descriptions hand-edited** — highest-traffic SKUs get a human pass | 2 days | NEW (v3). |
| **Proactive spec PDF mirror to R2** — ALL remote spec URLs from sidecar fetched and stored in R2 (Q8 — partner URLs can change/expire) + **new "Specs" section on every PDP** (downloadable spec sheets, install guides, NOM certs, dimension drawings, warranty docs) | 1.5 days | **Updated v3.1.** Audit Q8 — proactive vs on-first-access. |
| **In-house search-quality pass** (replaces the dropped external search migration — Joshua, 2026-05-21) — enhance the existing `searchProducts`/`scoreRow`: typo tolerance, EN/ES synonym + alias table (incl. the **copper/cobre** gap from the artisan-brand normalization, §10 2026-05-20), and ranking tweaks. No external engine, $0. Lands here because search relevance only matters once the content pipeline (Wk 3–4 descriptions/specs) gives it something to match. | 2 days | **NEW (2026-05-21).** Closes Concern 1's search lever in-house. Sacred Surface #7 — enhance, prove parity-or-better. (Sheets-API mitigation (c) — the build-time snapshot — was pulled forward to **Week 2** and freed this slot.) **✅ CORE DONE EARLY — sha `c41410a`, 2026-05-25** (the Roger-detour search rebuild IS this item: `scoreProduct` AND-semantics + SKU-part tokenization + richer fields + pinned relevance suite, unified across catalog/dashboard/quote-builder). **Residual:** formal EN/ES synonym table (copper/cobre) — partly covered now that artisan EN descriptions carry "copper". |
| **AEO build** — `llms.txt` at root, FAQ blocks on category + brand pages, conversational content rewrites where needed for top-5K | 1 day | NEW (v3). |
| **Core Web Vitals tuning** — LCP / FID / CLS targets met per Google ranking thresholds | 0.5 day | NEW (v3). |
| **Email Campaigns activated** — connect Klaviyo (or selected vendor), import audience segments, build welcome / abandoned-cart / post-purchase templates | 1 day | NEW (v3). |
| **Social Hub out of demo mode** — connect real Meta API (Instagram + Facebook), enable scheduled posting, wire engagement metrics back to dashboard | 0.5 day | NEW (v3). |
| **WhatsApp outbound goes live** — assuming Meta approval landed during Weeks 2–4 | 0.5 day | NEW (v3). |
| **Stale-quote follow-up engine** | 1 day | P2.1 — only if room. Otherwise post-launch. |
| **Inventory low-stock notifications** | 1 day | P2.9 — same: only if room. |

---

### Week 6 — Jun 23 – 29 · Team review + bug bash

| Item | Effort | Notes |
|---|---|---|
| **Full team review** — Joshua + Roger + Antonina + Sales each spend 30 min clicking through staging as a customer and as their staff role | 0.5 day (people) | NEW (v3). Catches "this looks weird" issues that automated tests miss. |
| **P2 cleanup queue** — pick from `docs/fixes/p2-*.md`. Highest-leverage: P2.2 product image 404 cleanup, P2.4 Brand-Kit Spanglish cleanup, P2.8 test-data cleanup, P2.10 P&L cross-currency bug, P2.13 blog analytics, P2.15 Sheets race conditions | 2–3 days | Original D-cluster. |
| **Bug bash** — known issues from team review + accumulated TODOs | 1 day | NEW (v3). |
| **i18n inline-ternary cleanup P1** (per `docs/i18n-migration-followups.md`) | 0.5 day | Original D-cluster. |

---

### Week 7 — Jun 30 – Jul 6 · Pre-cutover prep + LAUNCH

See §7 for full Phase 2 / cutover detail. Summary:

| Item | Effort | Notes |
|---|---|---|
| **Pre-cutover health checks** — full staging smoke loop, performance baselines captured | 0.5 day | |
| **Monitoring + alerting in place** — error tracking, uptime monitor, cron health, Stripe webhook delivery monitor | 1 day | |
| **Rollback plan finalized** — written, tested, criteria for triggering it | 0.5 day | |
| **DNS migration window planned** — coordinate with registrar (Squarespace / Google Domains), low-traffic window picked, change-management plan | 0.5 day | |
| **Customer comms drafted** — heads-up email to existing customers about the new site experience | 0.5 day | |
| **301 redirect map deployed + verified** (built Week 4) | 0.5 day | |
| **Resend production-domain verification** — `countercultures.com.mx` finally verified (was Phase 2 work, happens now) | 0.5 day | |
| **🚀 LAUNCH — Monday July 6, 2026** | — | |

---

### Net-new scope items pending decisions (not yet placed in a week)

| ID | Item | Action |
|---|---|---|
| *(was C1)* | Product taxonomy enforcement audit (from `PROMPT-product-category-audit.md`) | Write `docs/fixes/p2-product-category-taxonomy.md`. Schedule into Week 4–5 SEO work if Joshua agrees taxonomy is part of SEO pass. |
| *(was C2)* | Pedimento (customs) module | **Joshua / Roger decision at tomorrow's meeting (§8).** If yes → Week 5 or post-launch. If no → archive branch + prompt. |
| *(was C3)* | Brand pages redesign (ex–Step 12) | **ABSORBED 2026-05-25** into the Week-2 design-refresh pass (brand/maker pages are an in-scope surface there). No longer a standalone decision. |
| *(was C4)* | Miguel local-delivery scheduler | **Roger decision tomorrow (§8).** If yes → Week 5–6. If no → freeze branch. |
| *(was C5)* | Cart-share email wildcard allowlist + `info@` default sender | **Joshua decision (§8).** If yes → fold into Resend Week-1 work. |

---

### Post-launch iteration (after July 6 — by design, not by accident)

| Item | Why it's post-launch |
|---|---|
| **Sheets → Postgres migration** (P3.5) | 2–3 weeks on its own. Only do it if post-launch performance measurements show we still need it (with Cloudflare + search platform doing the heavy lifting, we probably won't). |
| **Multi-image completeness for the long tail** | Launch with one image minimum per SKU; filling out 5+ images per long-tail SKU is iterative over the first 60 days. |
| **Advanced AEO build-out** | Basic AEO ships pre-launch. Per-category FAQ depth, long-tail content rewrites, author/expertise signaling = iteration. |
| **P3.1** NOM compliance tracking | Not launch-blocking. |
| **P3.2** Brand logos populated | Not launch-blocking. |
| **P3.3** Product schemas A/B reconciliation | Combine with C1 taxonomy work post-launch. |
| **P3.4** Trade tier system v2 (Gold/Silver/Bronze) | Roger feature decision; not launch-blocking. |
| **P3.6** Customer accounts v2 (wishlists, order history UI, address book) | Launch with v1 (current `/account/*` pages); v2 features are iteration. |
| **Stale-quote engine + inventory notifications** | Only if Week 5 slot stays empty; otherwise post-launch. |

---

### The concerns — quick mapping to weeks (for the Roger doc audience)

| Concern | Addressed |
|---|---|
| 1. Site loads slow | Wk 2 (**build-time products snapshot** — kills the 10s cold-start + the brand-category 429; replaces the dropped external search migration) · Wk 5 (Core Web Vitals + in-house search-quality pass) · Wk 3 (CDN + ISR via content pipeline) |
| 2. SEO/AEO overhaul | Wk 3 (technical) · Wk 4 (on-page + 301 map) · Wk 5 (AEO build) |
| 3. Product descriptions | Wk 2 (SS scrape) · Wk 3 (top-50K AI) · Wk 4 (long-tail AI) · Wk 5 (top-5K hand-edit) |
| 4. Image scraping | Wk 2 (SS scrape + CDN migration) · Wk 3–4 (brand-site fill-in) |
| 5. Spec sheets | Wk 2 (SS scrape pulls links) · Wk 5 (R2 migration + PDP "Specs" UI) |
| 6. Drive scalability | Wk 2 (Cloudflare set up + image migration) |
| 7. Comms channels + nav | Wk 1 (nav cleanup) · Wk 2 (WhatsApp Business kickoff) · Wk 5 (Email + Social + WhatsApp outbound live) |
| 8. Lead Engine (funnels → CRM → outreach) | Wk 2 (hub source-tags + G1 stop-gap + G3 gate + WhatsApp prefill) · Wk 3–4 (core: pipeline-ize all funnels + unified "Needs Outreach" dashboard queue + auto-responders) · Wk 5 (nurture/outbound automation) |

---

## 7. Phase 2 — Cutover Plan (Week 7: Jun 30 – Jul 6)

> **Updated v3.** Phase 2 is no longer a "DO NOT START YET" placeholder. It has a date: **launch Monday, July 6, 2026.** This section is the detailed Week-7 checklist.

### Pre-cutover window (Tue Jun 30 – Sun Jul 5)

**Tue Jun 30 — Health checks**
- [ ] Full staging smoke loop (cart → PDP → cmd-K → checkout → trade login → factura request)
- [ ] Performance baselines captured (catalog LCP, PDP LCP, search latency, Core Web Vitals)
- [ ] All P0 + P1 items in §6 confirmed DONE
- [ ] No open ⛔ BLOCKED items remaining

**Wed Jul 1 — Monitoring + alerting**
- [ ] Error tracking deployed (Sentry or equivalent) with alerts → admin@ + Joshua
- [ ] Uptime monitor for staging URL + key endpoints
- [ ] Stripe webhook delivery monitor (alert on 5xx > 1%)
- [ ] Cron health dashboard (last-run timestamps for all `/api/cron/*`)
- [ ] Resend delivery monitoring (bounce rate, send volume)

**Thu Jul 2 — Rollback plan finalized**
- [ ] Written, peer-reviewed (Joshua + Roger sign-off)
- [ ] Triggering criteria documented (uptime % thresholds, error-rate thresholds, transaction-failure thresholds)
- [ ] Rollback mechanism tested end-to-end on a dry run
- [ ] Comms templates ready ("We're temporarily back on Squarespace while we resolve X")

**Fri Jul 3 — DNS + Resend prep**
- [ ] DNS migration window picked (low-traffic — Sunday Jul 5 night is ideal)
- [ ] Registrar coordination (Squarespace / Google Domains) — change-management plan agreed
- [ ] **Resend production-domain verification** — add DKIM/SPF records for `countercultures.com.mx`, verify in Resend dashboard. **First time touching production DNS** — Joshua + Roger coordinate.
- [ ] 301 redirect map (built Week 4) deployed to staging, verified link-by-link for top 100 traffic URLs
- [ ] Stripe environment handover decision (stay on current Stripe account, or new one for the new site?) — Roger call

**Sat Jul 4 — Customer comms + final dry run**
- [ ] Heads-up email drafted, reviewed, scheduled to send Sun evening
- [ ] FAQ for change-of-experience items written (where to find sign-in, multi-project cart explainer, trade pricing changes if any)
- [ ] Final smoke loop on staging — green
- [ ] Sales team briefed (Javier + Ian)
- [ ] Antonina briefed (finance UI changes, factura flow)

**Sun Jul 5 — DNS migration**
- [ ] Customer comms email sends 6pm
- [ ] DNS cutover at low-traffic window (evening / overnight)
- [ ] Propagation verified (`dig countercultures.com.mx`)
- [ ] First end-to-end production order test by Joshua at 11pm
- [ ] Hand-off to monitoring; on-call coverage agreed

### Launch day — Monday July 6

- [ ] 8am: full smoke loop on production. Cart → PDP → cmd-K → checkout → trade login → factura request. Each step screenshotted.
- [ ] 9am: Roger sign-off
- [ ] 10am: announce internally (sales + Antonina)
- [ ] Post-launch monitoring: error rate, conversion rate, page speed, Stripe delivery — checked every 2 hours through the first day, then every 6 hours through the first week

### Post-launch monitoring window (first 30 days)

- Performance: monitor cold-start TTFB and catalog LCP. If still >2s, re-evaluate Sheets → Postgres migration.
- SEO: monitor Google Search Console for ranking drops, 404s in error log, 301 redirect coverage gaps.
- Email deliverability: bounce rate, complaint rate, inbox placement (Gmail/Outlook seed test).
- Customer support volume: any spike → investigate immediately (likely a UX issue we missed).

### What if cutover slips

The launch date is locked. If a Week-7 item slips:
- **Hard-block** items (uptime monitor, rollback plan, 301 redirect map) — push launch by 1–3 days, not weeks. Communicate to Roger same day.
- **Soft-block** items (email FAQ, sales briefing) — launch anyway, fix-in-flight.

Anything that would push launch by >1 week needs Roger sign-off and a re-plan session.

---

## 8. Open decisions

> Updated v3. Tomorrow's Roger meeting (May 19) resolves most of the Roger-block items.

### Tomorrow (Roger meeting — May 19) — 4 yeses + 3 decisions + 2 scope confirmations

These are in the `Counter-Cultures-Halfway-Checkin-Roger.docx` deliverable. Don't leave the meeting without resolving each:

**Access + spend (the 4 yeses):**
1. **Stripe team access** for `admin@countercultures.com.mx` (unblocks B10/B11 in original numbering — finance compliance items in §6/Week-1)
2. **Meta Business admin access** for Joshua (unblocks WhatsApp Business setup + Social Hub out of demo mode)
3. **Cloudflare Images + R2 approval** (~$30–35/month at launch)
4. **Email campaign tooling approval** (~$20–50/month — Klaviyo or similar)

**Quick decisions:**
5. ~~**Cart label:** keep "Trade code" or rename to "Discount Code"?~~ ✅ **RESOLVED 2026-05-19 — RENAME to "Discount Code."** RF-4 superseded by the broader Trade Program rework (see §3). `fix/cart-discount-code-label` branch moves to MERGE in Week 1 (§6).
6. **WhatsApp marketing default:** keep "unchecked at signup" (LFPDPPP-compliant) or flip to "checked by default"? Recommend keep. `fix/whatsapp-opt-out-default` likely DROP regardless — LFPDPPP risk.
7. **Brand pages redesign** (ex-PLAN.md Step 12): does Roger still want this now that PDPs are live? What shape? If yes → schedule into Week 4–5 (§6).

**Scope confirmations:**
8. **Pedimento (customs) module** — continue building, or shelve until post-launch? If continue → schedule into Week 5 (§6). If freeze → archive `PROMPT-pedimento-customs-module.md` + `/tmp/cc-worktree pedimento-prompt` branch.
9. **Miguel local-delivery scheduler** (`fix/local-delivery-signature` branch) — in scope for July 6 launch or post-launch? If launch-scope → Week 5–6.

### Joshua's own decisions (do not need Roger)

10. **`fix/cart-share-email-error-handling` branch** — approve the wildcard `@countercultures.com.mx` allowlist + `info@` default sender? Changes the sandbox-only model documented in `p1-resend-setup.md`. If yes → fold into Week-1 Resend wrap-up.
11. **Email campaign tooling vendor:** Klaviyo vs Mailchimp vs Customer.io vs ActiveCampaign? Decision happens once Roger approves the spend in #4. Recommended: Klaviyo (best e-commerce-Stripe integration, free up to 250 contacts).

### Open data-quality questions from 2026-05-19 audit

> All 8 questions from the audit have been resolved 2026-05-19. Decisions folded into §6 schedule.

✅ All resolved. See "Resolved since v2" below for the decisions.

### Surfaced 2026-05-20 — artisan / house brand formalization (Roger decision)

13. **Formalize CC artisan / house brands?** The 2026-05-20 artisan normalization (§10) makes Santiago, Gaby, Meza, Independencia, Steven, and a "Counter Cultures" house brand (~34 products) display as clean brand text, but none have Brand Kit entries, so they render unlinked (no brand page — same as JCR/Waterworks). Decision for Roger: (a) add these as Brand Kit entries so they get brand pages, and/or (b) build a single "Counter Cultures — our artisans / house line" page instead of per-maker pages. **Not launch-blocking** — nice fast-follow. If yes → Week 4–5 or post-launch.

### Deferred — requires finance review

12. **Odoo categ_id brand-category cleanup.** The `brand` column in CC_Products_Full is populated from `product.template.categ_id`, a many2one relational field — there is no dedicated brand field in Odoo. Reassigning categ_id is finance-affecting: expense accounts differ between junk categories (501.01.01 Costo de venta) and canonical brand categories (601.10.01 Otros gastos generales). Display-layer normalization (`BRAND_DISPLAY_MAP` in `products-full.ts`) shipped 2026-05-19 as a stopgap. The permanent fix (reassigning ~180 products across 13 junk categories to their correct brand categories in Odoo) requires Antonina's review of the accounting-property implications before any writes. **BLOCKED on Antonina review.**

### Surfaced 2026-05-25 (forensic §1.5) — launch-blocking decisions

14. **Production domain — ✅ RESOLVED (Joshua, 2026-05-25): `https://www.countercultures.com.mx`** (the `www` subdomain — the exact transfer target at cutover). The hardcoded `BASE_URL = "https://countercultures.mx"` is therefore **wrong on two counts** (missing `www`, missing `.com`) in `sitemap.ts:16`, `robots.ts:42-43`, `[locale]/page.tsx:19`, `[locale]/layout.tsx:11,173`, `payment-methods/page.tsx:9`, `this-week/.../shell.tsx:33` (+ the `pdp-link-404s.test.ts` expectation). **Now a launch-critical code fix** (candidate fix-file): make `BASE_URL` env-driven (`NEXT_PUBLIC_SITE_URL`, which the Stripe routes already read), defaulting to `https://www.countercultures.com.mx`; decide staging indexability (recommend **noindex staging / index prod**); plan the apex→`www` 301 at cutover (§7). Touches Sacred Surface #2 metadata (canonical/OG/JSON-LD) → needs a recorded §0 YES.
15. **Launch catalog scope.** Ship the ~4,236 merchandised SKUs as the real store (real prices / EN names / descriptions / images), with the 354K as graceful-fallback SEO long-tail — or hold for broader 354K coverage (not achievable by Jul 6)? Drives the entire Week 3–5 content-pipeline triage. **Recommend: the 4,236 first.** Root cause: `CC_Products_Full` is placeholder — every row `list_price = 1.00`, `nameEn` == Spanish name (so `/en` shows Spanish), ~0.3% descriptions / ~1.2% images at 354K scale (`docs/baseline/06-data-quality.md`). Owner: Joshua + Roger.
16. **Stripe team access — RESOLVED, not pending (corrected 2026-05-25 forensic).** Roger #11 ("add admin email to Stripe") is **done** — access is granted (`ROGER-FEEDBACK-ACTION-PLAN.md:94`). The §1/§8 "pending yes #1" and the P0.2 "BLOCKED — awaiting Stripe team access" status are **stale**. Webhook code is complete (`app/api/stripe/webhook/route.ts` — boot-validates, 503s only when unconfigured, verifies via `constructEvent`; the P0.2 fix-file states "no code edits expected"). **Remaining = a 15-min env-only self-serve:** copy the `whsec_` signing secret from Stripe Dashboard → Webhooks → set `STRIPE_WEBHOOK_SECRET` on Netlify → redeploy → send a test event → confirm `/dashboard/settings` Integration Health shows Stripe **CONNECTED** (`integration-health/route.ts` self-reports), then reconcile any outage-window payments. Unblocks P1.13 (Factura↔Stripe bridge) + the §1.5/D-6 money-path test.
17. **Email-campaign tooling — Klaviyo = NO (Joshua, 2026-05-25).** Supersedes #11 ("recommended: Klaviyo") and removes the Klaviyo line from the 0b asks. The email-campaigns dashboard page renders sample data only (no integration). **OPEN — the Week-5 email layer needs a direction:** (a) **descope** automated campaigns for launch, transactional-only via the existing Resend infra (leanest, no new SaaS / in-motion process — recommended for Jul 6); (b) build basic lifecycle emails (welcome / abandoned-cart / post-purchase) on Resend; (c) a different ESP (Joshua's call). Budget line "email tooling ~$20–50/mo" (§1) pauses pending this.

### Resolved since v2 — do not re-litigate

- ~~Brand-partner outreach email template~~ → **DROPPED 2026-05-19.** Decision: scrape brand sites directly. Roger's bandwidth stays free; saves 1–2 weeks of waiting on replies.
- ~~CDN selection research (Cloudflare vs Cloudinary vs imgix)~~ → **LOCKED on Cloudflare Images + R2.**
- ~~Launch date framing (when does Phase 2 start)~~ → **LOCKED: Monday July 6, 2026.**
- ~~Cart label rename (RF-4)~~ → **RESOLVED 2026-05-19 (v3.1) — RENAME to "Discount Code."** Field's purpose changed under the Trade Program rework — it's no longer a trade-customer identifier; trade customers route via account login. New job: promo + F&F discount codes.
- ~~Trade Program model (auto-pricing vs review flow)~~ → **PIVOTED 2026-05-19 (v3.1) — review flow.** Trade customers see list prices on PDP/cart/checkout (same as regular); checkout becomes "Submit Order for Review"; sales team manually quotes via email + WhatsApp with Stripe payment link. Phase 1 (rendering pull) Week 1, Phase 2 (workflow build) Week 2.
- ~~Webchat module retention~~ → **RETIRED 2026-05-19 (v3.1).** WhatsApp click-to-chat replaces webchat as the persistent corner widget. One channel, three surfaces.
- ~~Schedule a Consultation booking tool (Calendly vs Google Calendar)~~ → **LOCKED on Google Calendar Appointment Scheduling.** Zero new SaaS cost; uses existing Workspace.
- ~~Brand Partner application form scope~~ → **LOCKED on quick form.** 8 fields + optional line-sheet PDF upload to R2. Writes to `Brand_Applications` sheet + sales notification.
- ~~Q1: CC_Products_Full refresh mechanism~~ → **RESOLVED 2026-05-19.** Prices set by partners, change rarely. **Manual weekly sync pre-launch, fresh full sync immediately before July 6.** No cron build needed.
- ~~Q2: Product name bilingual split~~ → **RESOLVED 2026-05-19.** PDP H1 uses sidecar Spanish title when available (consistency with meta-title). Wire in Week 3.
- ~~Q3: AI descriptions wiring~~ → **RESOLVED 2026-05-19.** Wire `Product_Descriptions` (approved-only) into PDP resolver chain at step 2.5 (after sidecar, before fallback). Keeps Roger approval gate, expands coverage. Coverage math context: Squarespace scrape covers only ~1,215 SKUs (0.3%); AI fills the remaining ~352K long tail. **AI descriptions are necessary, not optional, for launch credibility.** Schedule: Week 3.
- ~~Q4: Sidecar price on quote catalog~~ → **SELF-RESOLVED.** Dies when `/shop/quote/` template is deprecated in Day 2-3 PDP consolidation.
- ~~Q5: Brand name join fragility~~ → **RESOLVED 2026-05-19.** Add `brand_id` column to CC_Products_Full as part of Week 4 SEO/data work.
- ~~Q6: Subcategory gap~~ → **RESOLVED 2026-05-19.** Acceptable for launch — search palette handles fine-grained discovery.
- ~~Q7: Stock freshness~~ → **RESOLVED 2026-05-19.** Bump `Odoo_Stock_Quants` sync to hourly in Week 4. Operational caveat: confirm Odoo API can handle 24 daily read calls (almost certainly yes).
- ~~Q8: Spec sheet mirroring strategy~~ → **RESOLVED 2026-05-19.** Proactive mirror — all remote spec URLs migrated to R2 in Week 5.
- ~~Build-time Sheets API 429 mitigation~~ → **RESOLVED 2026-05-19. All three options approved, $0 incremental cost.** (a) Google Sheets API quota increase request — Week 4, 30-min request + auto-approval. (b) Aggressive pre-render + cache TTL bump — Week 4, 1 day. (c) Build-time JSON snapshot of CC_Products_Full — Week 5, 2 days. Postgres migration deferred to post-launch unless production measurements show we still need it.

---

## 9. Migration mechanics (one-time cleanup)

When you have 30 minutes:

```bash
# 1. Create archive directories
mkdir -p docs/archive/prompts docs/archive/superpowers

# 2. Move root-level loose prompts (§5A — 23 files total, minus 3 to hold)
#    Hold: PROMPT-MASTER.md (read first), PROMPT-product-category-audit.md (§6/C1),
#          PROMPT-pedimento-customs-module.md (§6/C2 decision pending).

# 6 CLAUDE-CODE-* files
git mv CLAUDE-CODE-AP-TAB-AND-DOC-VIEWER-FIX.md docs/archive/prompts/
git mv CLAUDE-CODE-CART-FEATURE.md docs/archive/prompts/
git mv CLAUDE-CODE-FINANCE-FIXES.md docs/archive/prompts/
git mv CLAUDE-CODE-PORTAL-REMOVAL.md docs/archive/prompts/
git mv CLAUDE-CODE-PROMPT.md docs/archive/prompts/
git mv CLAUDE-CODE-SURGICAL-FIXES.md docs/archive/prompts/

# 12 PROMPT-* files (holding 3)
git mv PROMPT-master-fixes.md docs/archive/prompts/
git mv PROMPT-brand-heroes-batch2.md docs/archive/prompts/
git mv PROMPT-cart-checkout-mexican-modernization.md docs/archive/prompts/
git mv PROMPT-category-page-redesign.md docs/archive/prompts/
git mv PROMPT-category-subcategory-product-pages.md docs/archive/prompts/
git mv PROMPT-dashboard-crm-sales-system.md docs/archive/prompts/
git mv PROMPT-homepage-redesign.md docs/archive/prompts/
git mv PROMPT-i18n-permanent-fix.md docs/archive/prompts/
git mv PROMPT-legal-policy-pages.md docs/archive/prompts/
git mv PROMPT-performance-fix.md docs/archive/prompts/
git mv PROMPT-product-search-preview-insert.md docs/archive/prompts/
git mv PROMPT-restore-and-protect-pdp-descriptions.md docs/archive/prompts/

# 2 misc
git mv FULL-PASS-AUDIT.md docs/archive/prompts/
git mv HOMEPAGE-RESTRUCTURE-PROMPT.md docs/archive/prompts/

# 3. Move superpowers specs (§5C)
git mv docs/superpowers/specs/*.md docs/archive/superpowers/

# 4. Delete duplicates (§5B)
git rm "docs/SEARCH-AUDIT-2026-05-11 2.md"
git rm "docs/SEARCH-FIXES-IMPLEMENTATION 2.md"
git rm "Counter-Cultures-Full-Plan copy 2.docx"
git rm "Counter-Cultures-Full-Plan copy.docx"
git rm "Counter-Cultures-Proposal copy.docx"
# verify CC-Image-Library 2/ first

# 5. Add banner to PLAN.md / SESSIONS.md / COUNTER-CULTURES-ROADMAP.md
# (manual edit — see §5D)

git commit -m "docs(plan): consolidate to MASTER-PLAN.md, archive superseded prompts and specs"
```

---

## 10. Change log

- **2026-05-25 (PM-8 — design-refresh Phase 1 SHIPPED `348db3f` + verified safe)** — Ran `docs/fixes/p1-design-refresh.md` (Phase 1). **Verified (git + grep):** new `docs/design/DESIGN-PRINCIPLES.md` (the contract) + `app/globals.css` (3 section-spacing tokens + 7 `cc-lift-*` / `cc-card` / `cc-image-card` utility classes) + 9 homepage section files (2–8 lines each). **Zero behavior lines changed** (diff grep for href/onClick/useState/fetch/`?src`/Link → none); hub `?src=` tags intact (6); Sacred Surface #1/#2/#7 NOT touched; only **1 pre-existing** raw hex (`#B87333` in the featured-brands gradient — tiny future cleanup, not introduced). Fix-file **kept** (drives the follow-on surfaces). §0 YES recorded. **Scope note:** applied to the whole HOMEPAGE (9 sections), broader than the fix-file's literal "hub only" — but contained to the homepage (catalog/PDP/brand pages NOT touched), visual-only; the consistent-homepage call is reasonable. **⚠️ DECISION GATE:** this is the *reference implementation* the catalog/PDP/brand-page follow-ons will inherit — Joshua must confirm the visual DIRECTION (ideally on pushed staging) before propagating. **6 fixes now committed locally, UNPUSHED.** Follow-on surfaces (one session each, after direction confirmed): catalog (mobile-grid already shipped, so unblocked), PDP (#2), brand/maker pages (absorbs C3).
- **2026-05-25 (PM-7 — mobile catalog grid SHIPPED `c8e28dd` + verified)** — Ran `docs/fixes/p1-mobile-catalog-grid.md`. **Verified (full diff reviewed):** single file `catalog-view.tsx`, `className`-only (12+/12−) — phones now 2 dense columns (`grid-cols-1`→`grid-cols-2`, `gap-2 sm:gap-4`), responsive card padding/type + `min-h-[40px]` tap target, category hidden on phones; `ProductGridSkeleton` matched (no load-time shift); tokens only (no raw hex). Sacred Surface #7/#8 query/fetch/cache + the `15173da` first-load logic untouched; scoped to the catalog's **inline** `ProductCard` (no cross-surface ripple). §0 YES recorded. **Closes the standing "mobile viewport unconfirmed" verification debt** (375px before/after confirmed: 1 wide column → 2). Fix-file retired. **Next Week-2 anchor: design-refresh Phase 1** (`p1-design-refresh.md` — foundation + homepage hub; needs Joshua's eye on the before/after). **⚠️ 5 fixes are committed locally on `main` but UNPUSHED** (`ed0d5f3`, `ff477bb`, `7c8c964`, `15c31f5`, `c8e28dd`) — push soon (with the Netlify env pass) so they deploy and can be eyeballed on real staging.
- **2026-05-25 (PM-6 — security hardening (1a) SHIPPED `15c31f5` + verified; drip kept dormant)** — Ran `docs/fixes/p1-security-endpoint-hardening.md`. **Verified (git + grep):** 2 files, auth-only. `follow-up-drip` cron now uses the canonical `CRON_PROBE_KEY` / `x-cron-probe-key` gate (fail-closed, 403) like its siblings; WhatsApp webhook fails closed — `WHATSAPP_APP_SECRET` unset → reject (401), valid-signature path untouched (Sacred Surface #10 parity, §0 YES recorded). **Verify-pass catch:** the session also added a NEW daily schedule + scheduled-function that would have **activated the dormant customer follow-up drip** (a planned Week-5/P2.1 item, not security scope) → Joshua's call: **kept OFF**; the `netlify.toml` schedule + `netlify/functions/follow-up-drip.ts` were reverted; endpoint stays gated-but-dormant. Fix-file deleted. **⚠️ Meta-activation prerequisite:** because the webhook now fails closed, `WHATSAPP_APP_SECRET` MUST be set in Netlify *before* WhatsApp goes live (~2 wks, with Meta) or inbound leads reject — add to the Meta-activation checklist. **Cheap correctness/security batch (§1.5/G step 3) + the domain fixes are COMPLETE** — 4 commits today: `ed0d5f3` (canonical), `ff477bb` (unify), `7c8c964` (dashboard-honesty), `15c31f5` (security). **Next in §6 Week 2: build anchors — mobile catalog grid → design refresh (run in series; both touch `catalog-view.tsx`; visual-only, need §0 YES + parity proof).** Loose ends: `rm docs/fixes/p1-dashboard-honesty.md` (untracked); §1.5/E5 doc-cruft cleanup + the `.env.example` doc gap still pending.
- **2026-05-25 (PM-5 — dashboard-honesty (1b) SHIPPED `7c8c964` + independently verified)** — Ran `docs/fixes/p1-dashboard-honesty.md` + a one-step follow-up to finish the Overview tab. **Verified (git + grep):** `app/lib/features.ts` finance role now grants `view_leads` + `view_pipeline` — the "Antonina can manage leads she can't see" gap (§1.5/D-8) is **closed**; all fabricated analytics gone — Marketing Overview starts empty (em-dash KPIs + `DataPendingPlaceholder`), charts render only on real API data; `SAMPLE_REVENUE_TREND` deleted; CSV exports honest. grep for `6,400`/`42.3%`/`SAMPLE_REVENUE_TREND`/`fallbackVisitorsOverTime` → only a tombstone comment remains. 5 files committed (incl. new `data-pending-placeholder.tsx`); MASTER-PLAN/cruft/other fix-file excluded; not pushed. **Verify-pass catch:** the session's first pass still let the Marketing **Overview** fall back to fabricated `6,400`/`42.3%`/visitor charts when the API has no real data (the current state — no traffic source wired) → fixed in the follow-up *before* commit. (Root: my fix-file under-specified "keep wired widgets"; corrected.) **Tiny loose end:** `docs/fixes/p1-dashboard-honesty.md` is still on disk (untracked — `git rm` no-ops; just `rm` it). **Queue:** 1a (`p1-security-endpoint-hardening.md`, §0 YES already recorded) staged next; then Week-2 build anchors (mobile grid → design refresh).
- **2026-05-25 (PM-4 — canonical-domain + base-URL unify BOTH COMMITTED & independently verified)** — *(Bookkeeping: an earlier reply claimed a PM-4 was logged for the canonical commit; that edit never landed — this is the real record.)* Two commits verified via git + grep (not just reported):
  - **`ed0d5f3` — canonical domain.** PM-3's robots corrections were applied (flag-only `isProduction`; `public/robots.txt` deleted) and committed clean: wrong-domain grep **0** (was 38); `SITE_URL` env-driven; fix-file `git rm`'d; MASTER-PLAN/`.claude`/audit-xlsx/cruft excluded.
  - **`ff477bb` — base-URL unify** (P1.16-adjacent). `NEXT_PUBLIC_BASE_URL` killed (7 readers → **0**); `countercultures.netlify.app` gone from `app/` (3 → **0**, incl. the share-button comment); `email.ts` no longer falls back to staging; `today-kpis` self-fetch → `process.env.URL`; chat-tools deep link deploy-aware; dev localhost fallbacks preserved. Sacred Surface #1 + #5 touched with §0 YES recorded; prod parity proven. 10 `app/` files; fix-file retired; MASTER-PLAN/cruft excluded.
  - **Net public-URL env surface = `NEXT_PUBLIC_SITE_URL` + `NEXT_PUBLIC_ALLOW_INDEXING` only** (`process.env.URL` is Netlify-auto; `NEXT_PUBLIC_BASE_URL` is dead — delete from Netlify).
  - **Two verify-pass notes (neither blocks):** (1) `.env.example` documents **none** of `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_ALLOW_INDEXING` — the new control surface is undocumented for anyone inheriting the repo → small **handoff-doc gap**, add them with comments (folds into Workstream H2 env inventory). (2) Local `next build` hit the known Sheets-API **429** on SSG export — expected locally (the products snapshot is `prebuild`-generated on Netlify per `20c3800`, absent locally → live-Sheets fallback); **confirm the Netlify deploy build is green.**
  - **Queue:** `p1-dashboard-honesty.md` (1b) + `p1-security-endpoint-hardening.md` (1a) staged; then Week-2 build anchors (mobile grid → design refresh).
- **2026-05-25 (PM-3 — canonical-domain fix SHIPPED + independently verified; robots noindex needs a 2-line correction before commit)** — Ran `docs/fixes/p1-canonical-domain.md` in Claude Code. **Verified good (not just reported):** `grep "countercultures\.mx" app/ scripts/` → **0** wrong-domain occurrences (was 38); `SITE_URL` env-driven in `app/lib/seo.ts` (`NEXT_PUBLIC_SITE_URL ?? "https://www.countercultures.com.mx"`); 39 files updated (incl. 6 API-route fallbacks, `pdp-href.ts`, `constants.ts`, `stripe-deposit.ts`, the 404 test); tsc/test/build green per the session report. Sacred Surface #2 metadata = domain-only change (structure intact). **Two robots holes the session under-stated (fix before commit — covered by the same §0 YES):** (1) a stray static `public/robots.txt` (`Allow: /`) still exists and can shadow the dynamic `app/robots.ts` at the Netlify edge → **delete it** (the dynamic route now covers `/api` + `/dashboard`, adds AEO crawlers, and the staging noindex). (2) `app/robots.ts` `isProduction` is gated on `SITE_URL === prod-domain || ALLOW_INDEXING` — so once staging's canonical is set to the prod domain (which the fix instructed), **staging flips to indexable**. Fix: gate on the **explicit `NEXT_PUBLIC_ALLOW_INDEXING` flag only**. **Netlify env (corrected):** staging → `NEXT_PUBLIC_SITE_URL=https://www.countercultures.com.mx`, NO indexing flag (→ noindex); prod → same + `NEXT_PUBLIC_ALLOW_INDEXING=true`. **Commit hygiene:** commit the ~37 domain files + `robots.ts` as one change; `git rm docs/fixes/p1-canonical-domain.md` in the same commit (§0.3 DELETE-WHEN-DONE); keep `MASTER-PLAN.md`, the audit `.xlsx`, `.claude/launch.json`, and the root doc-cruft OUT. (Working tree confirms **E5** — the root cleanup never stuck: `FULL-PASS-AUDIT.md`, the `… 2.md` dupes, etc. still untracked at root.)
- **2026-05-25 (PM-2 — forensic State of the Union + decisions locked)** — Five-audit forensic verification added as **§1.5** (5-touchpoint readiness; doc corrections; new **Workstream H — Handoff & Ownership**). §6 Week-2 **re-triaged** (security batch + scope decisions ahead of the design polish). Decisions locked today:
  - **(1) Stripe access already granted** (Roger #11) — the §1/§8 "pending yes" was **stale**. Webhook code is complete; remaining is a **15-min self-serve** secret-set (P0.2, `docs/fixes/p0-stripe-webhook-secret.md`). Roger ask killed.
  - **(2) Klaviyo = NO** (§8 #17) — Week-5 email layer **defaults to descope / transactional-only on Resend** (reversible; revisit post-launch or if Joshua brings an ESP).
  - **(3) Production domain LOCKED = `https://www.countercultures.com.mx`** (§8 #14) — exposes the hardcoded `BASE_URL = "https://countercultures.mx"` as wrong on two counts → **fix-file written** `docs/fixes/p1-canonical-domain.md` (§0 YES recorded: Joshua "Lets GO" 2026-05-25; touches Sacred Surface #2 metadata).
  - **(4) Cloudflare image-CDN deferred ~2 weeks** — **build the image-URL seam now** so the swap is config, not a rebuild.
  - **(5) Meta (WhatsApp outbound + Social) waiting** — already feature-flagged (dry-run / demo mode); a **config flip** when approval lands, no rework.
  - **Net: Week 2 has NO external blockers — build freely.** Staged fix-files: `p1-dashboard-honesty.md` (1b), `p1-security-endpoint-hardening.md` (1a, §0 YES recorded), `p1-canonical-domain.md`. **Build-around principle:** anything gated on Cloudflare/Meta gets a feature-flag/abstraction seam, never a hard dependency.
- **2026-05-25 (PM — PO/Sales sync FULLY FIXED + verified live; search-reliability + leads hardening back-logged; 2 new Week-2 items captured)** — Closes the Roger Monday "lists aren't current" item for real, and records three same-day fixes the detour entry below didn't capture.
  - **Odoo→Sheets sync lag — root-caused, fixed in two commits, then verified live.** `55a0dbe` only *added* `purchase.order` to the sync; the lists still trailed Odoo because the bulk sync had two defects. (1) **O(n²) writes** — `syncBulkIncremental` upserted each row via `upsertRowByField`, and every write called `invalidateSheet`, so the next row re-read the entire 1,300–1,850-row tab. ~750 Sheets calls per model → timeout / 60-reads-per-min quota → the hourly cron died after a handful of rows, oldest-first. Fix `86daa0e`: new `batchUpsertRowsByField` (one header read + one tab read + one `values.append` + chunked `batchUpdate`, single cache invalidation); `syncBulkIncremental` now pages until the delta queue drains (18s soft budget); per-page limit 250→500. (2) **No `write_date` cursor on sale.order + account.payment** — those two `*_FIELDS` never fetched `write_date`, so the cursor never advanced off the 1900 fallback and the cron re-scanned the oldest records every run (why Purchases caught up but Sales barely moved, +2). Fix `6f15d35`: added `write_date` to both field maps + idempotent `ensureColumns` so the column exists and the cursor persists. Files: `app/lib/dashboard-sheets.ts`, `app/lib/odoo/sync.ts`, `app/api/cron/odoo-sync/route.ts`. **Live-verified ~23:04 UTC** via the authenticated portal API: Purchases newest **P01351** (was frozen at P01333), Sales now carries **S01857** with today-dated S0185x at the top (was frozen at S01829); newest records in both lists are dated **today (2026-05-25)**; Invoices/Payments (same sync path) healthy. Both commits are LOCAL on `main` — push pending (batched). Sacred Surface: sync path only — mirror shape, spot-refresh, dashboard read/sort, auth, and response shapes all unchanged.
  - **Search reliability — two fixes the detour entry missed.** `715ec87` (SEVERE): `/api/products/search` was sending `Cache-Control: public, s-maxage=60` + SWR-300, so Netlify's CDN served ONE query's response for every query (the edge cache key ignored the query string) — after any search, all searches returned the same poisoned result. Changed to `private, no-store`. `15173da`: the catalog page read `useSearchParams()` (empty on first client render) and fired an unfiltered fetch, briefly rendering the full 354K catalog for a filtered link; fixed with a mount-time read of `window.location.search` + an `urlReady` gate + AbortController latest-wins. Both caught during the pre-Roger smoke test and confirmed live.
  - **Leads API hardening (`037f165`).** `app/api/dashboard/leads` POST/PATCH now have server-side zod validation, an `Activity_Log` write (create_lead / update_lead), and a `manage_leads` feature gate (owner/sales/finance); GET stays open to any authenticated staff. Caller-graph verified — the public lead funnels write through different routes, so gating the dashboard route does not touch public capture.
  - **New scope captured → Week 2 (Roger + Joshua, 2026-05-25):** (1) a **smaller, phone-friendly catalog grid** — Roger reviewed on his phone; the current grid is too large/sparse on mobile. This also finally retires the long-standing "mobile viewport unconfirmed" verification debt. (2) A **design-refresh pass** — as features pile on, the visual design has gone flat; it needs a cohesive depth/hierarchy polish across the customer-facing surfaces. Both placed in §6 Week 2 below.
- **2026-05-25 (snapshot cold-start fast-follow SHIPPED — cold-start ~8.8s → ~2.5s)** — The Week-2 carry-over fast-follow for Sacred Surface #8 (catalog cache). `buildStockMap()` — a live Google Sheets fetch (~6s on cold Lambda) — was blocking the critical path of `loadFromSnapshot`/`loadFromSheets`. Fix: on cold starts (no existing cache), build the cache with an empty stock map immediately (~2.5s parse-only), then fire `buildStockMap()` as a guarded background task that patches `stockQty`/`inStock` in-place on the same `IndexedProduct` objects (synchronous loop, atomic under Node's single-threaded model — no torn reads, no cache rebuild). `byBrand` shares object references so both views update. TTL refreshes still block on stock (users see stale cache). Behavioral change: for the first few seconds after a cold start, stock badges show "not in stock" then self-heal — same graceful state `buildStockMap` already produces when the mirror is empty. File changed: `app/lib/products-full.ts`. Cache shape (`Cache`, `IndexedProduct`, `byBrand`) unchanged. §6 carry-over row updated.
- **2026-05-25 (Roger-feedback detour, May 22–25 — SHIPPED; pulled the Week-5 search-quality pass + Week-3 descriptions FORWARD)** — A Roger-driven detour ran off the Week 1→2 boundary. Detailed 26-item record in `ROGER-FEEDBACK-ACTION-PLAN.md` (the detour's working doc — fold/retire into this file post-launch). Beyond the Roger fixes it completed work scheduled for later weeks. All verified live on Netlify (deploys green; PDP description guard passed each build).
  - **Search — the Week-5 in-house search-quality pass, done early (sha `c41410a`).** Unified product relevance on ONE core (`scoreProduct` in `app/lib/search-utils.ts`, used by `searchProducts` + both product API routes + the dashboard ⌘K): AND-semantics multi-word, SKU-part tokenization (hyphen/dot split + joined form), richer index fields (`_skuParts`/`_cat`/`_finishes`/`_desc`), whole-query exact-match boost; pinned by a real relevance suite in `search-utils.test.ts`. Roger confirmed California Faucets search works. Sacred Surface #7 enhanced (parity-or-better). **Residual of the Wk-5 item:** a formal EN/ES synonym table (copper/cobre) — now partly covered because artisan EN descriptions carry "copper".
  - **Product descriptions — Week-3 artisan/AI-description work, done early.** Built the review gate the Day-1 audit demanded: step 10 stages drafts (never writes live), new `scripts/scrape/13-emit-copy-review-xlsx.ts` / `14-merge-copy-review.ts` (human approval is the ONLY publish path), build-time blank-description guard wired into `npm run build`. **337 human-approved artisan descriptions LIVE** (Mistoa / Familia Meza / Castro / Manriquez) — including the Week-3 **copper/cobre priority** (Gaby-Cobre→Castro copy now reads "cobre martillado"). ES coverage 17%→25%, EN 15%→23%. Commits `70483d0` / `6c7a5c1` / `b0cfe0f` / `61cfeac`. **Remaining Week-3:** full Squarespace scrape run, CDN image migration, top-50K AI generation, retroactive review of the ~570 already-live AI entries (Emtek/Delta/Brizo).
  - **Portal create flows (Roger #16/#19, sha `bbfaae5`):** New Lead (sheet-backed) + New PO (Odoo `purchase.order` via new `createPurchaseOrder` + a new `create_po` feature gate) entry points; CC/R&F company relabel across the quote + PO builders.
  - **Roger Monday fixes (sha `55a0dbe`):** catalog honors `?brand=`/`?q=` on first load; per-customer **bilingual quote language** (EN/ES set on `res.partner.lang`); **`purchase.order` added to the hourly Odoo→Sheets sync** — it was never synced, so the portal PO mirror was frozen (~1292 while Odoo was at 1346); now backfills.
  - **Catalog / maker performance:** maker cards re-pointed from the dynamic `/shop/catalog?brand=` (cold-loads the 354K index, ~5s) to the ISR-cached, pre-built `/brands/[slug]` pages, with a catalog fallback so they show the right products (Castro 175 / Manriquez 245 / Familia Meza 28 / Mistoa 14). Shas `8edbfd7` (instant-shell skeleton + signal-skip for filtered views) + `7ada68e` (maker relink). **✅ RESOLVED — the snapshot cold-start fast-follow shipped 2026-05-25:** `buildStockMap` is now non-blocking on cold hydrate (cold-start ~8.8s → ~2.5s). Stock patches in-place in the background within seconds; catalog renders immediately with stock badges appearing once the background fetch completes.
  - **QA hardening pass (sha `0321086`):** repo-wide sweep — 0 P0; small fixes (more LLC→R&F labels, dead env var, escapes); 24 findings logged in `docs/QA-FINDINGS-2026-05-25.md`.
- **2026-05-21 (build-time products snapshot SHIPPED — build-time 429 killed; cold-start reduced but still stock-bound)** — 354K-product catalog now hydrates from a 5.5MB gzipped snapshot generated at prebuild, instead of hitting Google Sheets on every cold start (~10s + recurring 429s). Runtime hydration confirmed in Lambda logs: `Hydrated 354449 products from snapshot (/var/task/app/lib/generated/products-snapshot.json.gz) in ~8.8s` (includes live stock-map fetch; parse alone ~2.5s). Warm hits 50–280ms. Key technical hurdle: Turbopack virtualizes `__dirname` to `/ROOT/app/lib/` in the Lambda — the real filesystem path (`/var/task/app/lib/`) is only reachable via `import.meta.url`. `process.cwd()` triggers Turbopack's whole-project NFT trace, bloating the function past Netlify's upload limit. Five deploy attempts (3 failures) to nail the path resolution. Catalog data now frozen at deploy time (behavioral change — prices/SKUs update on redeploy; stock stays live via `buildStockMap()`). Commits: `1185b2e` (shared mapping + snapshot generator), `81a9909` (prebuild wiring + Netlify tracing), `ef632c1` (warn-level logging), `20c3800` (import.meta.url Lambda path fix). Sacred Surface #8 — cache shape identical, source swapped Sheets→disk, fallback preserved.
  - **Correction to the original goal:** the runtime **cold-start is NOT eliminated — still ~8.8s**, now dominated by the live `buildStockMap()` Sheets fetch (the snapshot removed only the product-data fetch; gzip+parse alone is ~2.5s). The build-time 429 IS eliminated, and warm performance is excellent. ~~**Recommended fast-follow:** make stock non-blocking on cold hydrate → cold-start drops to ~2.5s.~~ **✅ SHIPPED 2026-05-25** — see entry below.
  - **New follow-ups surfaced (NOT fixed this session):** (1) Products row 1223 "BLANCO - Contra Canasta" carries invalid subcategory "drains" under category "kitchen" (logged 16× at build) — data fix in the Products sheet; (2) duplicate search-index doc id `article:publicado-por-vb-compartido-con-counter-cultures-all-rights-reserved` (dup slug in Posts/`articles.ts` — touches Sacred Surface #7, MiniSearch); (3) `@netlify/plugin-nextjs` 5.15.9 → 5.15.11 outdated.
  - **Commit-hygiene note:** 5 intermediate path-fix commits (`8e1acf9`, `3f60384`, `6081f1d`, `b10f2c6`, `ef632c1`) remain on `main`, superseded by `20c3800`; not squashed (would require a force-push on already-pushed `main` — correctly avoided per §0 "nothing gets disrupted").
- **2026-05-21 (search-platform migration DROPPED — in-house path locked)** — Sparring decision after a cost + capability review of the Wk-2 "Search platform migration" anchor.
  - **Finding:** the shipped `searchProducts` (in-memory scored scan over the 354K cache, fronted by `s-maxage=60` + SWR-300 CDN caching) is launch-adequate — a 354K linear scan is tens of ms in V8, faceting is precomputed at cache-build, and popular/repeat queries never reach Node. The two genuine pains are NOT fixed by buying an engine: (a) the 10s **cold-start** is a Sheets-cache problem, solvable in-house via a build-time snapshot; (b) **search quality** (typos/synonyms/ranking) barely matters until the content pipeline gives products descriptions/specs to match against.
  - **Cost context (354K records):** Algolia ~$150–300+/mo, metered (rises with traffic; as-you-type multiplies request counts); Meili Cloud hits a $300 cliff (100K-doc Build cap); Typesense Cloud ~$58/mo flat; self-host Meili/Typesense ~$20–50/mo + a server to operate (a new in-motion process). All rejected for launch.
  - **Decision (Joshua):** drop the external migration; keep in-house search. **Nothing post-launch — all acknowledged before July 6.** Re-slots: the **build-time products snapshot** pulled **Wk 5 → Wk 2** (Wed–Thu; kills the cold-start + the brand-category 429 build failure; $0); an **in-house search-quality pass** (typo tolerance, EN/ES synonym + alias incl. the copper/cobre gap, ranking) takes the freed **Wk 5** slot (Sacred Surface #7, enhance-only). §6 Week 2 + Week 5 + the Concern-1 map updated to match.
  - Decision only — no code yet. The Wed–Thu snapshot execution prompt is written and ready for a fresh session.
- **2026-05-21 (Week 2 Tuesday queue SHIPPED — click-to-chat + Brand Partner + Consultation + projects/new)** — Hub-finish day. 4 commits pushed to `main` (HEAD `84c5a6c`); Netlify staging published clean (2,670 pages, 5 functions, 0 errors — the recurring brand-category Sheets 429 did NOT bite this build). Verified against the repo (commits + code), not just the session report.
  - `9f01a23` — `feat(chat): retire webchat → WhatsApp click-to-chat float`. `ChatWidgetLazy` swapped for new `app/components/ui/whatsapp-float.tsx` (fixed bottom-right `wa.me` anchor reusing `SITE_CONFIG.showroom.whatsapp` — no second number — bilingual greeting + aria-label, `src=whatsapp_float` tag, `MessageCircle` icon consistent with the hub tile). `chat-widget.tsx` + `chat-widget-lazy.tsx` deleted. Dashboard `ai-chat-widget.tsx` UNTOUCHED (verified).
  - `f664f80` — `feat(brand-partner): add Brand Partner section + form + API`. New supplier-facing `brand-partner-section.tsx` (EN/ES parity, 7 text fields, distinct bg block) mounted on the homepage below HospitalityTeaser; `app/api/brand-partner/route.ts` zod-validates and writes a header-keyed row to a NEW `Brand_Applications` tab (auto-created via `ensureTab` + `ensureColumns`), then alerts via `notifyRoger` + `notifyWhatsApp`. Line-sheet PDF upload deferred to Week 3 (R2 dependency) with a TODO hook. **The Leads-mirror was added, then REMOVED before push (Joshua's call, 2026-05-21):** the supplier funnel stays OFF the buyer Leads path; capture is guaranteed by the dedicated tab + the two alerts. *(Caveat: the amended commit message still mentions a Leads mirror — stale text artifact; the code does not mirror, verified by grep. Not worth a force-push on already-pushed `main`.)*
  - `d9b2fa2` — `feat(hub): consultation tile → booking URL + start-project → /new`. Consultation tile reads `NEXT_PUBLIC_CONSULTATION_BOOKING_URL`: set → external booking link with `?src=hub_consultation`; unset → original contact-form fallback (NO regression — lead still captured via `submitLead`, untouched). Start-a-Project tile re-pointed to `/account/projects/new?src=hub_start_project`.
  - `84c5a6c` — `feat(projects): add /account/projects/new + delete dead two-paths-band`. New English-only create-project page (consistent with the non-localized `(customer)/account` area — verified zero `es:` strings + middleware bypasses next-intl) that reuses `useProjectStore.create` and redirects to the project detail; inherits the G3 sign-in gate via `middleware.ts` `startsWith("/account/projects")` (verified 307 when unauthed). Dead `two-paths-band.tsx` removed (zero imports).
  - **Smoke (Netlify staging):** EN + ES homepage all green (float, Brand Partner section, tile re-point, consultation fallback, zero old chat/two-paths refs); `POST /api/brand-partner` invalid → 400; `GET /account/projects/new` unauthed → 307. Desktop visual confirmed.
  - **Open / residual (carried to §6 Week 2):** (1) **Mobile viewport STILL unconfirmed** — computer-use Chrome is read-only and the extension can't reach the staging URL; 2nd surface now shipped without a mobile eyeball (hub redesign + these). Needs a real phone / narrow-window check by Joshua. (2) Brand Partner **live form submission untested** (skipped to avoid CRM pollution + a live `notifyWhatsApp`) — write path verified by construction, not end-to-end. (3) Consultation stays on the fallback until Joshua builds the shared team calendar + sets `NEXT_PUBLIC_CONSULTATION_BOOKING_URL` on Netlify. (4) Real `sales@` recipient for `Brand_Applications` is a post-staging-redirect config step. (5) `/api/chat` route now dark — retire in a follow-up.
  - §0 compliance: all four conditions met (verified). Guardrails UNTOUCHED — dashboard `ai-chat-widget.tsx`, `email.ts` (#5), `sheets.ts`/`submitLead` (Leads writer), `whatsapp.ts` + inbound webhook (#10), `conversation-log.ts`, `middleware.ts`. Webchat retirement pre-authorized (§1); the WhatsApp float is the equivalent-or-better replacement (C4). EN/ES parity held (account area single-locale by design). `tsc --noEmit` clean.
- **2026-05-20 (Lead Engine — hub attribution + Leads schema fix SHIPPED)** — Closes the "are we gathering the leads, correctly?" loop on the hub funnels.
  - `7e8ea0c` — capture hub-tile source attribution: the contact/Consultation, Apply-for-Trade, and Showroom forms read the `?src=hub_*` tag and persist it on the lead. (WhatsApp + Start-a-Project tiles are GA-only — the src never reaches our server / is lost across the multi-step project flow.)
  - `ade7acb` + `cf41c74` — **fixed a pre-existing data-integrity bug the attribution work exposed.** `submitLead` (the web-form lead writer behind contact, showroom, trade Leads-mirror, project quote-request) wrote a POSITIONAL row that diverged from the header-keyed Leads schema from column G on — `value` got a timestamp, the lead's `message` landed in `next_followup`, hub-source landed in `last_contact_date`. Consequence: the overdue-follow-up automation (notifications.ts / sales-health.ts) did date math on `next_followup` (which held message text) → **web-form leads were never flagged for follow-up.** Fix: `submitLead` now builds a header-keyed row (matching the gmail/whatsapp writers) — `message`→`notes`, `value` blank, `next_followup` blank, `last_contact_date`=now — and writes attribution to a new `hub_source` column (U, auto-created via `ensureColumns`). Verified in-tree (`SUBMIT_LEAD_COLUMNS` object→row at `sheets.ts`) and on staging (message under notes, next_followup blank, hub_source carries the tag; untagged lead still writes; follow-up automation now safely skips blank-next_followup web leads).
  - **Open:** (1) historical web-form lead rows remain misaligned — optional one-time backfill, separate task. (2) WhatsApp + Start-a-Project attribution stays GA-only. (3) The deeper Lead Engine core (G2 spec-drop server capture, G4 Pipeline deals for Showroom/Consultation, unified "Needs Outreach" dashboard queue) remains Week 3.
  - §0: Sacred Surface #13 — all 5 submitLead callers still write; alignment now matches the canonical writers; gmail/whatsapp/Trade writers untouched; historical rows unchanged.
- **2026-05-20 (Week 2 — Buyer Hub REDESIGN SHIPPED)** — `b2421d5` feat(home): unify hub onto the catalog linen section, card tiles with copper icons, add catalog search input (5 files). Fixes the Day-1 layout miss after Joshua review (mock-aligned).
  - **Unified light section:** dark charcoal band removed — buyer-hub now renders as children inside CatalogDepthBand (one `bg-brand-linen` block: stat + search on top, "Your starting point" + 6 cards below). page.tsx no longer renders a separate hub section.
  - **Card tiles + bigger icons:** white-on-linen bordered cards, 44–46px copper-circle anchors with reversed Lucide icons, serif titles, copper CTAs; responsive `grid-cols-1 sm:2 lg:3`.
  - **Catalog search input** (new `catalog-search-input.tsx`): pill + copper button, bilingual placeholder. Submits to `/shop/catalog?q=…` — REUSES Sacred Surface #7 (verified `catalog-view.tsx:179` reads `searchParams.get("q")` into query state → catalog actually searches). No new index/endpoint; header ⌘K pill untouched.
  - **Lead-engine wins intact (verified post-refactor):** `?src=hub_*` tags + WhatsApp `?text=` prefill survive the 167-line rewrite; G1 stop-gap (route) + G3 gate (middleware) untouched.
  - **Open:** mobile viewport visually UNCONFIRMED — executor couldn't simulate a mobile width via the Chrome extension; responsive classes correct but unviewed. Desktop EN+ES confirmed on staging. Eyeball on a phone/narrow window.
  - §0: enhanced the shipped hub (no rebuild); search reuses #7; ⌘K / sign-in / i18n preserved; tokens + Lucide only.
- **2026-05-20 (Week 2 Day 1 — Buyer Hub + Nav SHIPPED)** — `937180a` feat(home): buyer hub + nav simplification + sign-in top-right + lead-engine cheap wins (7 files, +319/−68). Replaces TwoPathsBand with a 6-tile router hub under the trust band; top nav cut to ≤5; Sign-in → top-right utility (sign-in / cmd-K / i18n toggle all preserved). EN/ES parity, tokens only.
  - **Lead Engine cheap wins all landed (verified in-tree, not just reported):** source tags on every tile (`?src=hub_*`); WhatsApp prefill (`?text=` greeting); **G3** — `/account/projects` now sign-in-gated in `middleware.ts`; **G1 stop-gap** — `/api/projects/[id]/request-quote` rewritten from a fake-200 stub to honest capture (`submitLead`) + Roger email + WhatsApp alert. The flagship tile no longer silently drops leads.
  - **Open / follow-ons:** (1) tile 1 "Start a Project" links to `/account/projects` (list) because `/account/projects/new` doesn't exist yet — create that page and re-point the tile so the funnel actually starts a project. (2) **Visual smoke NOT done** — local dev blocked by the pre-existing Turbopack/Sheets cold-start hang, so "looks good / no overlap / no mobile overflow" is UNVERIFIED and pending on Netlify staging. (3) `two-paths-band.tsx` left as dead unimported file — delete in a follow-on. (4) Full G1 (Pipeline deal + customer auto-response) remains Week 3 with Trade Phase 2.
  - **Velocity flag:** the Sheets cold-start hang has now blocked local smoke twice (artisan build + this). Consider pulling the Week-4 Sheets mitigation (or a dev-mode snapshot/mock) forward — it taxes every `[locale]` session's verification.
  - §0 compliance (per report): only TwoPathsBand removed; hub routes, never re-implements; tsc + eslint clean; Sacred Surface sign-in / #7 / i18n preserved. Visual parity unverified pending staging.
- **2026-05-20 (buyer-hub funnel audit + Lead Engine decision)** — Read-only end-to-end audit of the 6 hub funnels (entry → capture → Pipeline → auto-response → team alert → close). Finding: **2 of 6 work end-to-end** (Apply for Trade; WhatsApp / Sacred Surface #10); **3 dead-end** into flat sheet rows needing manual pickup (Showroom, Drop-a-Spec, Consultation); **1 loses the lead entirely** (Start a Project — `/api/projects/[id]/request-quote` is a stub returning 200 while the UI claims "Roger will reply in 24h").
  - **Decision (Joshua):** stand up a **Lead Engine** — every funnel must capture server-side + source-tag, create a Pipeline deal + lifecycle, auto-respond instantly, alert the team, and surface in one dashboard "Needs Outreach" queue. **Core ships by launch;** nurture/outbound = Week-5 marketing layer. Logged as **Concern 8** (§1) + the **"Lead Engine — funnel standardization"** spec (§6). Gaps reslotted: cheap hub items + G1 stop-gap → Week 2; core (full G1 with Trade Phase 2, G2/G4 pipeline-ization, dashboard queue, auto-responders) → Week 3–4; nurture → Week 5. Weeks 3–4 flagged as a combined over-capacity block.
  - Read-only — no code changed. The Day-1 hub build proceeds independently.
- **2026-05-20 (artisan / house-line brand normalization SHIPPED)** — Extended `BRAND_DISPLAY_MAP` with Case 4 (CC artisan / house line). Read-layer only — no Odoo writes. Direct continuation of the 2026-05-19 brand work below.
  - `6c12d0a` — `feat(products): extend BRAND_DISPLAY_MAP with CC artisan/house line (Case 4, +10 → 36)` (one file, +12/−1).
  - 10 new entries (map 26 → 36) covering 486 products: `Counter / Santiago`→Santiago (245), `Counter / Gaby- Cobre`→Gaby (174), `Counter`→Counter Cultures (31), `Counter/Meza`→Meza (28), `COUNTER/CHINA`→Counter Cultures (3), `gaby`→Gaby (1), `independencia`→Independencia (1), `mosaico steven`→Steven (1); `cobuild`/`coobuild`→blank (2). Maker name is kept; the `Counter /` prefix and any material/provenance (Cobre, China) drops off the brand.
  - **Verified:** type check clean (`tsc --noEmit`); dev-server `/api/products/search` confirms `byBrand` groups under clean names (Santiago 245, Gaby 176, Meza 28, Counter Cultures 45). Parity: 354,449 rows load, cache structure unchanged. New maker brands render as **unlinked text** (no Brand Kit entry → `brandSlug` null, no brand page, no 404 — same graceful degradation as JCR/Waterworks). Blank brands suppressed by the existing `brand && (...)` guards. `npm run build` again hit the pre-existing Sheets-API 429 at brand-category pre-render (§1/§6, "confirmed unchanged" on Day 2) — NOT caused by this read-layer edit; verified via tsc + dev smoke instead.
  - **Net improvement, with one bounded regression (accepted, logged):** product search `scoreRow` scores `_brand` (weight 1), so the ~448 maker-name products gain clean-token search. BUT the **96 of 174** `Counter / Gaby- Cobre` products whose *names* lack "Cobre" lose "cobre"/"copper" findability — the brand string was the only place the material appeared. The 78 with "Cobre" in the name are unaffected (name match, weight 3). "Cobre" is a high-intent query on a MX bath site → flagged as a **priority** inside the Week 3 description pass.
  - **Surfaced for decision:** whether to formalize the CC artisan / house brands (Santiago, Gaby, Meza, "Counter Cultures", etc.) as Brand Kit entries + brand pages — logged in §8 #13 (Roger decision, not launch-blocking).
  - §0 compliance: all four conditions met. C3 — `products-full.ts` (in-motion 354K cache; Sacred Surface #2/#8) extended under the same recorded `BRAND_DISPLAY_MAP` authorization (2026-05-19, continued 2026-05-20). Gate (b) (material-in-name) tripped at ITEM 1 (44.8% of Gaby-Cobre names carry the material, 55.2% don't) and was cleared by explicit human go-ahead — not auto-proceed — with the 96-product copper gap logged as bounded content debt.
- **2026-05-19 (brand normalization SHIPPED)** — Display-layer brand normalization via `BRAND_DISPLAY_MAP` in `products-full.ts`. Read-layer only — no Odoo writes.
  - `dac88b8` — `docs(diagnostics): brand-field data-quality audit` (diagnostic + cleanup plan at `docs/diagnostics/brand-field-audit-2026-05-19.md`)
  - `a9a9b2a` — `feat(products): display-layer brand normalization via BRAND_DISPLAY_MAP`
  - `d1ae6fd` — `docs: update brand map count to 26, add §10 change log entry`
  - 26-entry map: 9 misspellings → canonical Brand Kit names (V&B→Villeroy & Boch, CALIFIORNIA→California Faucets, etc.), 2 retailer hybrids → real manufacturer (Build / Kingston Brass→Kingston Brass, Build / Delta→Delta), 15 junk/retailer/accounting strings → blank (Amazon, Build, Lamp Plus, Lamps Plus, All, service, MISC, etc.). The 2 entries beyond the original 24-string plan are "Lamp Plus" and "Lamps Plus" — retailer spelling variants discovered during implementation, same blanking category.
  - Empty brands excluded from `brandCounts` and `ProductFilter` facet list. All render sites guarded: ProductCard, ui/product-card, PDP meta+OG+JSON-LD, cart-drawer, product-drawer, product-detail-panel, search-palette. JSON-LD `brand` property omitted entirely for blank-brand products.
  - **Sleeper win:** brand page exact-string-match join (`product.brand === brandKit.name`) now works for previously-mismatched products — Villeroy & Boch page went from 7 to 24 products, Kingston Brass from 142 to 164.
  - **Search palette guard:** `search-palette.tsx` subtitle changed from `` `${p.brand} · ${p.sku}` `` to `[p.brand, p.sku].filter(Boolean).join(" · ")` — prevents leading `· ` on blank-brand results. Dashboard `command-palette.tsx` already safe (uses `.filter(Boolean)` in `search.ts`).
  - MASTER-PLAN §8: added "Deferred — requires finance review" subsection for the Odoo categ_id cleanup (BLOCKED on Antonina review — expense accounts differ: 501.01.01 vs 601.10.01). ROADMAP P2.17 also logged.
  - §0 compliance: C3 — `products-full.ts` cache touched with Joshua's recorded authorization (2026-05-19). Parity proven: 354K SKUs load, cache structure unchanged, only the 26 mapped brand strings transform. No finance-affecting changes. Sacred Surface intact.
- **2026-05-25 (Day 7 SHIPPED — Week 1 COMPLETE)** — Project email+WhatsApp share + doc archive + worktree/branch prune + lint fixes.
  - **Project Share (Item 1):** New `ShareProjectButton` component on project detail page with two tabs — Email (recipient, sender name, optional note → Resend branded HTML via `/api/projects/[id]/share`) and WhatsApp (`wa.me/?text=` pre-filled summary, no phone number — sender picks recipient). Reuses cart-share Resend pattern exactly (93294ba {data,error} destructure, STAGING_EMAIL_REDIRECT, computeIva, branded HTML with hero image + item table + IVA breakdown). Bilingual EN/ES via T translation object. All design tokens (brand-copper, dash-border, vendor-whatsapp, etc.) — no raw hex.
  - **Doc archive sweep (Item 2a):** 20 files moved from root to `docs/archive/prompts/`, 15 superpowers specs to `docs/archive/superpowers/`, 5 duplicates deleted (2 git-tracked + 3 gitignored docx), 1 deprecated fix file retired. 3 files HELD at root per §9 (PROMPT-MASTER, product-category-audit, pedimento-customs-module). `CC-Image-Library 2/` flagged for Joshua review (not a pure duplicate).
  - **Worktree + branch prune (Item 2b):** 40 merged worktrees removed (54→14 remaining). 78 merged branches deleted. 2 expected holdbacks: `feat/ap-tab-and-doc-viewer` (remote tracking mismatch), `pedimento-prompt` (locked to worktree).
  - **Lint fixes (Item 3):** `text-red-600` → `text-dash-danger` in `add-to-cart-button.tsx` and `save-cart-button.tsx`. Pre-existing errors, now clean.
  - §0 compliance: all four conditions met. Sacred Surface #1 (Cart) NOT modified. Sacred Surface #5 (Email infra) — `app/lib/email.ts` NOT modified; new project-share endpoint is a standalone copy of the cart-share pattern. `STAGING_EMAIL_REDIRECT` intact start-to-end. No in-motion process (§0.4) disrupted. TypeScript check passes clean. Lint clean on all changed files.
- **2026-05-24 (Day 6 SHIPPED)** — Cart save/share investigation + Notifications template-literal fix + test-deal filter.
  - **Cart save/share (Item 1):** Investigated three candidate root causes per §6. Finding: the original RF-6 bug (Resend SDK v6 error silently discarded) was already fixed on main via `93294ba`. Deployed staging endpoint confirmed working — both allowlisted and non-allowlisted emails return 200 OK. Held branch `fix/cart-share-email-error-handling` (§4B/§8) NOT needed for the fix — it adds enhancements (wildcard allowlist + `info@` default sender) that remain on Joshua-decision hold. Added redirect logging to `app/api/cart/share/route.ts` for observability parity with `app/lib/email.ts`. Sacred Surface #1 (Cart) behavior unchanged. `STAGING_EMAIL_REDIRECT` confirmed intact start-to-end.
  - **Notifications template-literal leak (Item 2):** Root cause: `applyTemplateVars` returned raw `{token}` when vars were missing. R-14-issue template uses `{issue_type}`, `{issue_summary}`, `{recommended_action}` — none of which were populated by any call site. Fix: (1) `applyTemplateVars` now strips unresolved tokens (returns `""` instead of raw `{token}`) — prevents ALL template-literal leaks across every template. (2) T-14 dispatch in `stale-deal-sweep/route.ts` now passes the three vars with meaningful content (issue type, summary, recommended action). (3) Test-deal filter added to `dispatchAlertsForTransition` — skips all alert sends when deal name or contact contains "test" (case-insensitive). Prevents inbox pollution during staging dev work.
  - §0 compliance: all four conditions met. Sacred Surface #1 (Cart) verified working — no behavior change. Sacred Surface #5 (Email infra) — `app/lib/email.ts` NOT modified. `STAGING_EMAIL_REDIRECT` intact. No in-motion process (§0.4) disrupted. Build passes. Lint clean on changed files.
- **2026-05-23 (Day 5 SHIPPED)** — Discount Code build + search-palette stale-results fix.
  - `90118c2` — `feat(checkout): discount code build + search palette stale-results fix (Day 5)` — Discount Code functionality wired (the field renamed Day 3 via `fix/cart-discount-code-label` now validates through `/api/checkout/discount-validate`); search-palette stale-results bug fixed.
  - `076a1b1` — `docs(master-plan): mark Week 1 Day 5 DONE`.
  - §0 compliance: all four conditions met. Sacred Surface #1 (Cart) + #7 (Search palette) — form/behavior verified. Discount Code = promo + F&F codes (RF-4 superseded; not a trade identifier).
- **2026-05-22 (Day 4 SHIPPED)** — Trade Program Phase 1 — rendering pull.
  - `cae07f1` — `feat(trade): pull trade-price rendering — Phase 1 (Day 4)` — Sacred Surface #3 partial reversal Phase 1: customer-facing trade-price rendering + auto-charge path pulled; trade customers now see list prices on PDP/cart/checkout (engine + data retained). Phase 2 (workflow build — "Submit Order for Review") is Week 2. (The Discount Code *label* rename shipped Day 3 via `fix/cart-discount-code-label`; the Discount Code *build* shipped Day 5 — above.)
  - §0 compliance: all four conditions met. Sacred Surface #3 reversal authorized in §1 (2026-05-19). Engine untouched; only customer-facing rendering pulled.
- **2026-05-21 (Day 3 SHIPPED)** — PDP cleanup propagation + branch triage + Resend verified. Three sub-sessions.
  - **PDP cleanup pass (Item 1):** Removed SKU visual display from PDP (JSON-LD sku/mpn still populated from data), deleted "PRICES IVA INCLUDED" priceNote from PDP + product-drawer, removed per-PDP EN/ES description language picker, replaced all "Request a Quote" CTAs with "Add to Cart" across PDP, AddToCartButton, product-drawer, project-list-bar, and both brand page routes. Grep-verified: zero "Request a Quote" or "Solicitar Cotización" CTA references remain. Brand pages: "Request a Quote" → "Contact Us"/"Contáctanos". Product-drawer: "Quote on request" → "Price on request"/"Precio bajo consulta".
  - **Full Catalog section delete (Item 2):** Deleted ~90-line "Beyond our selection" block from `app/[locale]/brands/[slug]/page.tsx` (hero stats + category chips + signature grid + "Open catalog" CTA). Brand+category page confirmed never had this section (MASTER-PLAN line reference was incorrect).
  - **Branch triage (Item 3 — §4B):** 11 branches processed. MERGED 4: `fix/cart-discount-code-label` (RF-4 superseded, "Trade code" → "Discount Code"), `fix/projects-404` (removes incorrect `/en/` prefix from project URLs), `fix/cc-llc-color-scheme-reports-ap` (CC/LLC color coding for AP views — Antonina-facing), `claude/amazing-zhukovsky-707d87` (P&L latest-month default + footer Maps link + `/shop` → `/shop/catalog` + `/returns` → `/returns-warranty` redirects). DROPPED 4: `fix/whatsapp-opt-out-default` (LFPDPPP conflict), `fix/net-price-label-iva-wording` (stale — `product-detail.tsx` deleted Day 2, `order-summary.tsx` already updated), `claude/gallant-khayyam-1d2480` (all 3 changes already on main), `claude/dazzling-gates-6178ba` (link checker already on main). DELETED 1: `claude/eloquent-stonebraker-cc7e55` (no unmerged commits). HOLD 2: `fix/cart-share-email-error-handling` (Joshua-decision — Sacred Surface #5), `fix/local-delivery-signature` (Joshua-decision — net-new feature). All worktrees for processed branches removed.
  - **Customer sign-in (Item 4):** `GOOGLE_CLIENT_ID_CUSTOMER` already set on Netlify. `GOOGLE_CLIENT_SECRET_CUSTOMER` MISSING — Joshua must retrieve from GCP Console (`counter-portal-493716` project, OAuth client `374048983912-ss013d...`). Code side complete.
  - **Resend P1.1 (Item 5):** Verified complete. `RESEND_FROM_TRANSACTIONAL=onboarding@resend.dev` across all Netlify contexts. `STAGING_EMAIL_REDIRECT` limits delivery to `admin@` + `roger@countercultures.com.mx`. P1.1 DONE.
  - §0 compliance: all four conditions met. Sacred Surface #2 (PDP) form-change only — Add to Cart behavior unchanged, JSON-LD preserved. Sacred Surface #1 (cart) form-change only — "Trade code" label → "Discount Code". TypeScript type check passes clean after all merges.
- **2026-05-20 (Envira investigation — null finding)** — Joshua's hypothesis that "Envira" might be a brand in Odoo. Direct Odoo JSON-RPC query (read-only) + Sheets API queries across every relevant tab confirmed: **"envira" does not exist in any reachable data source.** Coverage: Odoo brand models (don't exist) + `res.partner` (0) + `product.template` 354,449 records (0) + Brand Kit Sheet 168 rows (0) + CRM Products/Products_Odoo/Products_Quote/Product_Descriptions/Brand_NOM_Status/Brand_Lead_Times tabs (0) + CC_Products_Full 354,449 rows (0) + sidecar `product-content.json` 1.1 MB (0) + `app/` and `docs/` source (0). Total ~362K records searched. Day 3 Item 3 (Rodger Envira data cleanup) ⛔ SKIPPED. Reopen only with sample URL or corrected spelling. Investigation scripts archived in outputs.
- **2026-05-20 (Day 2 SHIPPED — PDP template consolidation)** — Deprecated `/shop/quote/` template removed (6 route files + 1 API route deleted), `toQuoteProduct()` removed, canonical PDP at `app/[locale]/shop/[category]/p/[slug]/page.tsx` locked with header comment + contract documented in `docs/data-sources-of-truth.md`. Net diff: **+83 / −1,061 lines** (978 net deleted). Smoke loop clean on all 6 Sacred Surface steps. 301 redirect verified (`/en/shop/quote/p-12345 → /en/shop/catalog`).
  - `cfdc60b` — `feat(pdp): consolidate to single canonical PDP template (Day 2)`
  - `35b40f8` — `docs(master-plan): mark Week 1 Day 2 PDP consolidation DONE`
  - **Q4 (sidecar-price-on-quote-catalog) self-resolved** as predicted — `toQuoteProduct()` is gone.
  - **4 one-off product renderings discovered** during audit (catalog-view, product-drawer, catalog-search, product-detail-panel). Exceeded the ≥3 threshold, so per Day 2 prompt instruction the refactor was deferred. Documented in `docs/data-sources-of-truth.md` and slotted into Day 5–6 (§6).
  - **Day 2 carry-overs** (fix/* branch triage, customer sign-in wire-up, Resend setup) moved to Day 3.
  - **Pre-existing build failure** (Sheets API 429 on brand-category pre-render) confirmed unchanged. Mitigation scheduled Week 4 per §1 + §8.
  - §0 compliance: all four conditions met. Sacred Surface #2 touched, form-change only, zero behavior change proven by smoke loop.
- **2026-05-19 (Day 1 audit follow-up — decisions locked)** — Joshua resolved all 8 open data-quality questions from the audit + the 3-option Sheets API mitigation plan. Folded into §6 schedule: Week 3 picks up Q2 (PDP H1 Spanish title) + Q3 (AI descriptions wired to resolver step 2.5). Week 4 picks up Q5 (`brand_id` column) + Q7 (hourly stock sync) + Sheets API mitigations (a) + (b). Week 5 picks up Q8 (proactive spec mirror) + mitigation (c). Q1 (CC_Products_Full refresh) needs no code — manual weekly sync pre-launch, fresh full sync before launch. Q6 (subcategory gap) accepted as launch-acceptable. All 8 moved to §8 "Resolved since v2." Zero incremental infrastructure cost for the mitigations.
- **2026-05-19 (Day 1 SHIPPED)** — First execution session of the 7-week sprint. Three Day-1 items shipped per the architecture-first ordering.
  - `359203b` — `docs: add data sources-of-truth audit (Concern 0)` — new `docs/data-sources-of-truth.md` (281 lines, 16 data elements audited, 3 tangles identified, 8 open questions surfaced for Joshua)
  - `f5fd240` — `docs(plan): mark Steps 5/6/7 DONE, delete Steps 10/12, mark file secondary`
  - `c67dae4` — `docs(master-plan): mark Week 1 Day 1 items DONE`
  - Cartwright branch deleted (`claude/objective-cartwright-0bf816` → archived as tag `archive/cartwright-2026-05-10`)
  - §0 compliance: all four conditions met. No Sacred Surface behavior touched.
  - **Audit findings that change scope:** image coverage 1.2% (was assumed higher); description coverage 0.3%; 9 data sources, not 5; build-time Sheets API 429 surfaced as launch risk (mitigation needed pre-launch via longer TTLs + Sheets quota increase). 8 open data-quality questions moved to §8 for sequencing.
- **2026-05-19 (v3.1)** — Post-meeting rollup + architectural pivots. The Roger meeting happened; Joshua delivered 8 committed fixes + 4 strategic additions. Major changes:
  - **Architecture-first ordering principle** added to §6 Week 1 — *"declare ONE canonical template + ONE canonical source first; cleanup then applies once and propagates."* Triggered by Joshua's observation that the EN/ES picker is still on some PDPs *"weeks after I asked for it removed"* — the textbook multi-template symptom. Week 1 now leads with Source-of-Truth Audit + PDP template consolidation before any cleanup work.
  - **Concern 0 added — Source of Truth.** Five data sources currently in play with no canonical answer per element (Squarespace, Odoo, Sheets, Drive, manual). Concerns 3/4/5/7 all depend on this being resolved. Mon Wk-1 deliverable: `docs/data-sources-of-truth.md`.
  - **Sacred Surface #3 (Trade Pricing) — partial reversal authorized in §3.** Engine stays. Customer-facing rendering and auto-charge path pulled. Trade customers now see list prices + get "Submit Order for Review" checkout flow. Sales team manually quotes via email + WhatsApp + Stripe payment link. Phased: Wk 1 rendering pull (1 day) + Wk 2 workflow build (4–5 days).
  - **RF-4 SUPERSEDED — "Discount Code" rename locked.** Field's purpose changed; `fix/cart-discount-code-label` branch moves from "drop or hold" to MERGE in Week 1 §4B. Resolves the longest-standing open Joshua-decision.
  - **Webchat retirement authorized.** Persistent corner widget becomes WhatsApp click-to-chat. Social Hub webchat module decommissioned. One channel (WhatsApp), three surfaces (inbound webhook, persistent click-to-chat, hub tile).
  - **Homepage Hub + Nav Simplification** — 6-tile buyer hub immediately under hero (Start a Project, Apply for Trade, Drop a Spec, Visit the Showroom, WhatsApp Us, Schedule a Consultation), separate Brand Partner section lower on page (different audience — sellers, not buyers), top nav reduces to ≤5 items, Sign in moves to top-right utility, WhatsApp becomes persistent click-to-chat. ~1.5 days, Week 1.
  - **8 Roger meeting fixes folded into Week 1:** Source-of-Truth audit (Concern 0), Search palette stale-results investigation, "Full Catalog X pieces" section delete from all brand pages, PDP template consolidation, PDP cleanup pass (SKU codes / IVA-included badge / per-PDP EN/ES picker / "Rodger Envira" data cleanup / Add-to-Cart + Add-to-Project only), Price source consolidation (folds into Concern 0), Cart save/share investigation + fix.
  - **Google Calendar locked** for Schedule a Consultation (zero new SaaS cost — Workspace built-in Appointment Scheduling). Week 2 setup.
  - **Brand Partner form** — quick form (8 fields + optional R2 PDF upload), writes to `Brand_Applications` sheet, emails sales team. Week 2 build.
  - **Week 1 capacity check:** the new architecture-first ordering + 8 Roger fixes + Trade Phase 1 + Discount Code rename + Homepage Hub = ~5–6 days of work in a 5-day week. Acceptable. Items that may slip to Week 2 are explicitly listed (Dashboard reorg, Analytics, Mexican fiscal fields, Search platform — none of these are launch-blockers if they shift one week).
  - **§8 decisions cleaned up:** RF-4 marked RESOLVED; Trade Program model + Webchat retirement + Schedule a Consultation tool + Brand Partner form scope all moved to "Resolved since v2 — do not re-litigate" section.
- **2026-05-19 (v3)** — Roger check-in rollup. Triggered by producing `Counter-Cultures-Halfway-Checkin-Roger.docx/.pdf` for the May 19 halfway meeting. Major changes:
  - **🎯 Launch date locked: Monday, July 6, 2026.** Anchor noted in §1; §6 reframed entirely around it.
  - **§6 Active Queue fully restructured** — old A/B/C/D/E priority categories replaced with a week-by-week sprint (Week 1 → Week 7). Old item IDs preserved in parentheses for cross-reference.
  - **Pre-Launch Foundation workstream formalized** — 7 launch-critical concerns identified during 2026-05-18/19 sparring (performance, SEO/AEO, descriptions, images, spec sheets, Drive scalability, comms+nav). Each is mapped to a specific week.
  - **Customer-accounts visibility gap surfaced 2026-05-19** — Joshua couldn't find his own sign-in on staging. Verified: it IS shipped (PR #40), the link IS in the header at `/account/sign-in` (lines 251 + 441 of `header.tsx`), magic-link path works, Google sign-in needs ~30 min GCP config. Scheduled in Week 1.
  - **Nav cleanup promoted to Week 1** — the "I missed my own sign-in" canary.
  - **New scope rolled into Weeks 2–5:** Squarespace scrape resurrection + run (single biggest content-migration lever), Cloudflare Images + R2 set up + migration, SEO technical (Wk 3) + on-page (Wk 4) + AEO (Wk 5), tiered product descriptions (scraped → AI top-50K → AI long tail → hand-edited top-5K), brand-site image scrape fill-in, spec PDF migration + new PDP "Specs" section, WhatsApp Business setup (Wk 2 kickoff → Wk 5 live), Email Campaigns activation, Social Hub out of demo mode.
  - **§7 Phase 2 promoted from placeholder to concrete Week-7 cutover plan** with daily checklist for Tue Jun 30 – Mon Jul 6.
  - **§8 Joshua-decisions refreshed:** 4 yeses + 3 decisions + 2 scope confirmations for tomorrow's Roger meeting; 2 Joshua-only decisions pending; 3 items resolved (brand-outreach email DROPPED, CDN locked on Cloudflare, launch date locked on Jul 6).
  - **New budget lines:** Cloudflare Images + R2 ~$30–35/month at launch; email campaign tooling ~$20–50/month. Combined ~$50–85/month, less than the Squarespace bill.
- **2026-05-18 (v2)** — Bulletproof rewrite. Added §0 Bulletproof Rule (four conditions, pre-flight checklist, DELETE-WHEN-DONE, in-motion process protection list, overlap definition, ABORT triggers, session-end compliance line). Reordered the prior "How to use" content to §0.A. Smoke-checked every claim in v1:
  - ✓ All 16 Sacred Surface file paths verified present in `app/`
  - ✓ All six referenced merge PRs (#42, #43, #44, #75, #76, #77) verified in git log
  - ✓ All five P0 fix files verified present
  - ✓ IVA-extract commit (c5f28ff) verified to touch `app/lib/iva.ts`
  - ✓ Notifications template leak (B3) verified still present at `app/lib/email-templates.ts:881-882`
  - ⚠ **Cartwright finding upgraded to DELETE-OUTRIGHT** (§4A) — diff evidence proves it would DELETE shipped features (`account/check-email/page.tsx`, `account/whatsapp-opt-in/route.ts`, etc.). Effort dropped from 2 hrs → 15 min. No diff-mining, no cherry-pick.
  - ⚠ **B2 (Promo codes) updated to "ENHANCE — do not restart"** — `Promo_Codes` is already a typed sheet tab in `app/lib/dashboard-sheets.ts` and is being written by `app/api/dashboard/trade-program/route.ts`. Only checkout-side UI + Stripe re-quote remains. Effort cut from 1 day → 4–6 hrs.
- **2026-05-18 (v1)** — Initial consolidation. Built from PLAN.md, COUNTER-CULTURES-ROADMAP.md, SESSIONS.md, all `docs/fixes/*.md`, all root prompts, all `docs/baseline/*`, all `docs/superpowers/specs/*`, full git branch + worktree audit, codebase structural map. Reconciled stale status (Steps 5/6/7 in PLAN.md; recent un-cataloged main commits). Logged 23-commit cartwright stack as triage item.

---

*Maintained by Joshua. When status changes, update §1 + §6 in this file first. §0 is law — apply DELETE-WHEN-DONE so this file only ever shows what is still TO DO.*
