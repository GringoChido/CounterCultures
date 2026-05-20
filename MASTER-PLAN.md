# Counter Cultures — MASTER PLAN

> **Single source of truth.** Generated 2026-05-18 from a full sweep of every PLAN/ROADMAP/SESSIONS/FIX/PROMPT doc, every git branch, every worktree, and the live `app/` tree.
>
> **Why this file exists:** doc sprawl. We had `PLAN.md` (Roger batch — stale), `COUNTER-CULTURES-ROADMAP.md` (P0–P3 — mostly current), `SESSIONS.md` (Session 1–35 — out of sync), 10+ loose `PROMPT-*.md` / `CLAUDE-CODE-*.md` files at the repo root, and 23 commits stranded in a worktree from May 10. This file consolidates all of it. No overlap.
>
> **Operating rules still apply:** `docs/SURGICAL-RULES.md` is law. Sacred Surface untouchable. One commit per logical change. Bilingual parity. Smallest possible diff.

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

**Pre-Launch Foundation workstream (added v3, expanded v3.1).** Eight launch-critical concerns. **Concern 0 is foundational — everything else depends on it.**

0. **Source of Truth — multi-source data tangle (added v3.1).** Five sources currently in play: Squarespace (being scraped), Odoo (ERP), Google Sheets (`CC_Products_Full`, `Trade Pricing`, `Customers`, etc.), Google Drive (brand kits, attachments), manual admin entries. No canonical answer for "where does *price X* / *description Y* / *image Z* come from." Concerns 3/4/5/7 (descriptions / images / spec sheets / prices) all assume this is solved. It isn't yet.
1. Site loads slow (performance — CDN + ISR + keep-alive + search platform)
2. Full SEO/AEO overhaul needed before launch
3. Product descriptions needed on every PDP (Squarespace scrape → AI long tail → top-5K hand-edited)
4. Image scraping at scale (Squarespace scrape + brand-site scrape)
5. Spec sheet scraping + new PDP "Specs" section
6. Google Drive can't serve a 354K-product catalog — migrate to Cloudflare Images + R2
7. Communication channels + site nav need cleanup and activation (nav IA, WhatsApp outbound, Email Campaigns, Social Hub out of demo mode)

Each is addressed in a specific week of §6.

**Architectural authorizations granted 2026-05-19 (record so future sessions don't try to "restore"):**

- **Sacred Surface #3 (Trade Pricing) — partial reversal authorized.** The engine and data stay. The customer-facing rendering and the auto-charge path are pulled. Trade customers now see list prices on PDP/cart/checkout (same as regular customers), and at checkout get a "Submit Order for Review" flow instead of "Pay Now." Sales team manually quotes via templated email + WhatsApp with a Stripe payment link. Explicit Joshua YES recorded in this conversation. Full spec in §6/Week 1 (Phase 1 rendering pull) + Week 2 (Phase 2 workflow build).
- **RF-4 (Trade code naming) — SUPERSEDED.** Original RF-4 locked "Trade code" naming. The field's purpose changed (no longer a trade-customer identifier; trade customers route via account login). Renamed to **"Discount Code"** — its new job is promo codes + F&F discounts. `fix/cart-discount-code-label` branch (sha `0dc2208`) now moves from "Joshua-decision hold" to **MERGE** in §4B. **Smoke-check note:** the `Promo_Codes` sheet tab is written by `app/api/dashboard/trade-program/route.ts:133` but the route has a fallback log at line 147 ("tab may not exist yet") — the physical sheet tab in CRM may need manual creation when the Discount Code work runs.
- **Webchat retirement authorized.** Persistent corner widget becomes a WhatsApp click-to-chat button. Decommission target: `app/components/ui/chat-widget.tsx` + `chat-widget-lazy.tsx`, imported at `app/[locale]/layout.tsx:290`. One-line removal in layout. ⚠️ **Do NOT touch `app/(dashboard)/components/ai-chat-widget.tsx`** — that's the internal dashboard AI assistant, not customer-facing, leave alone. One channel (WhatsApp), three surfaces (inbound webhook, persistent click-to-chat, hub tile).

**Homepage Hub + Nav Simplification (added v3.1).** Joshua identified that the site has 7+ customer entry points (Start a Project, Account, Trade, Drop a Spec, Showroom, Search, Webchat) competing for attention, and the nav is crowded. Solution: **buyer-focused 6-tile homepage hub immediately under the hero**, plus utility entry points (Sign in, Search) move to top-right corner, WhatsApp becomes persistent click-to-chat widget, and a separate "Become a Brand Partner" section lives lower on the homepage (different audience — sellers, not buyers). Top nav simplifies to 5 items max. Full spec in §6/Week 1.

**Customer accounts — visibility gap surfaced 2026-05-19.** Joshua couldn't find his own customer sign-in on staging earlier. Verified state: feature **is** shipped (PR #40) and the link **is** in the site header at `/account/sign-in` (lines 251 + 441 of `header.tsx`). Both magic-link email and Google sign-in code paths exist. **Gap:** Google OAuth client (`GOOGLE_CLIENT_ID_CUSTOMER` + `GOOGLE_CLIENT_SECRET_CUSTOMER`) needs ~30 min of config in Google Cloud Console. Scheduled for Week 1, Tue–Wed (§6 below). Nav cleanup also promoted to Week 1 — the "I missed my own sign-in" moment is the canary that nav has grown unwieldy.

**Roger check-in doc shipped 2026-05-19.** `Counter-Cultures-Halfway-Checkin-Roger.docx` + `.pdf` at project root. 4 pages. Covers: what's built, the 7-week schedule, 7 concerns flagged with how each is addressed, 4 yeses needed from Roger (Stripe access, Meta Business admin access, Cloudflare $30–35/mo, email tooling $20–50/mo) + 3 quick decisions + 2 scope confirmations.

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

- `docs/fixes/p1-resend-untold-works-domain.md` — marked DEPRECATED 2026-05-12. Delete.
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

### Week 1 — May 18–25 · Architecture FIRST, then cleanup propagates

> **Ordering principle (v3.1):** consolidate sources/templates BEFORE individual fixes. Joshua's insight 2026-05-19 — *"I asked for the EN/ES picker to be removed weeks ago and it's still on some pages"* — is the textbook symptom of the multi-template problem. Whacking moles when there are multiple spawn points is infinite work. **Declare ONE canonical template + ONE canonical source first; cleanup then applies once and propagates everywhere.**

#### Day 1 — Mon · ✅ COMPLETE 2026-05-19

All three Day 1 items shipped. Details in §10 Change log. Audit lives at `docs/data-sources-of-truth.md` and is now the canonical reference for all data-source decisions.

**Audit findings that change scope for subsequent days:**

- **Image coverage is 1.2%** (4,236 of 354K). Concern 4 (Week 2 image scrape + brand-site fill-in) is more urgent than scoped.
- **Description coverage is 0.3%** (1,215 of 354K). Concern 3 (Week 2 SS scrape + Week 3-5 AI + hand-edit) is more urgent than scoped.
- **9 data sources, not 5.** Added: Local files, Brand Kit, Sidecar JSON, Gmail subject-line scanner.
- **Build-time Sheets API 429 = launch risk.** Brand-category pre-render hit the rate limit. Needs mitigation before launch (longer TTLs + Sheets quota increase) — see §1 (Pre-launch infrastructure risks).

**8 open data-quality questions** moved to §8 for sequencing.

#### Day 2 — Tue · ✅ COMPLETE 2026-05-20 (PDP consolidation)

PDP template consolidation shipped. Details in §10 Change log. Remaining Day 2 items (fix/* branch triage, customer sign-in wire-up, Resend setup) carry forward to Day 3.

| Item | Status | Notes |
|---|---|---|
| **PDP template consolidation** | ✅ DONE — sha cfdc60b — 2026-05-20 | /shop/quote/ deprecated, 301 redirects added, toQuoteProduct removed, canonical PDP locked, product-render surface inventory documented. 4 one-off renderings found → Day 3 follow-up. |
| **Small `fix/*` branch triage** | 🔴 PENDING — carries to Day 3 | *(was A3)* |
| **Customer sign-in: final wire-up** | 🔴 PENDING — carries to Day 3 | NEW (v3). |
| **Resend setup — finish sandbox-mode rewrite** | 🔴 PENDING — carries to Day 3 | *(was B1)* |

#### Day 3 — Wed · ✅ COMPLETE 2026-05-21 (PDP cleanup + branch triage + Resend verified)

PDP cleanup propagated via canonical template. Branch triage executed per §4B. Resend sandbox verified. Customer sign-in partially blocked (missing env var). Details in §10 Change log.

| Item | Status | Notes |
|---|---|---|
| **PDP cleanup pass** | ✅ DONE — 2026-05-21 | Removed: SKU visual display, "PRICES IVA INCLUDED" badge/priceNote, per-PDP EN/ES description picker, "Request a Quote" CTA everywhere (replaced with "Add to Cart" universally). Also cleaned product-drawer, project-list-bar, brand pages. Zero "Request a Quote" references remain in codebase (grep-verified). |
| **Delete "Full Catalog X pieces" section from brand pages** | ✅ DONE — 2026-05-21 | Deleted ~90-line "Beyond our selection" block from `brands/[slug]/page.tsx`. Brand+category page confirmed: never had this section. |
| ~~**"Rodger Envira" data cleanup**~~ | ~~30 min~~ | ⛔ **SKIPPED 2026-05-20.** Comprehensive search (Odoo + 6 sheets + sidecar + codebase = ~362K records) returned 0 matches. String doesn't exist in any reachable data source. Reopen only if Joshua confirms exact spelling or provides a sample PDP URL. |
| **Carry-over: Small `fix/*` branch triage** | ✅ DONE — 2026-05-21 | **MERGED (4):** `fix/cart-discount-code-label`, `fix/projects-404`, `fix/cc-llc-color-scheme-reports-ap`, `claude/amazing-zhukovsky-707d87`. **DROPPED (4):** `fix/whatsapp-opt-out-default` (LFPDPPP), `fix/net-price-label-iva-wording` (stale), `claude/gallant-khayyam-1d2480` (duplicate), `claude/dazzling-gates-6178ba` (duplicate). **HOLD (2):** `fix/cart-share-email-error-handling` (Joshua-decision), `fix/local-delivery-signature` (Joshua-decision). |
| **Carry-over: Customer sign-in final wire-up** | 🟡 PARTIAL — `GOOGLE_CLIENT_ID_CUSTOMER` set, `GOOGLE_CLIENT_SECRET_CUSTOMER` MISSING on Netlify | Code is complete. Joshua must: (1) go to GCP Console → `counter-portal-493716` → Credentials, (2) find OAuth client `374048983912-ss013d...`, (3) copy secret, (4) add as `GOOGLE_CLIENT_SECRET_CUSTOMER` on Netlify. Also verify redirect URI includes `https://countercultures.netlify.app/api/auth/callback/google-customer`. |
| **Carry-over: Resend setup — finish sandbox-mode rewrite** | ✅ DONE — verified 2026-05-21 | `RESEND_FROM_TRANSACTIONAL=onboarding@resend.dev` set across all contexts. `STAGING_EMAIL_REDIRECT` limits delivery to `admin@` + `roger@countercultures.com.mx`. P1.1 COMPLETE. |

#### Day 5 OR Day 6 — 4 one-off product rendering refactors (deferred from Day 2 audit)

| Item | Effort | Notes |
|---|---|---|
| **Refactor 4 one-off product renderings** to use shared components from `app/components/pdp/*` or `app/components/products/*`. Surfaces: catalog-view, product-drawer, catalog-search, product-detail-panel. Inventory documented in `docs/data-sources-of-truth.md` per Day 2 audit. | 2–3 hrs | **NEW (v3.1).** Slotted into Day 5 visible-bug bash, or pulled into Day 6 polish if Day 5 fills with bug work. Non-customer-visible cleanup — safe to slip. |

#### Day 4 — Thu · Trade Program Phase 1 (rendering pull) + Discount Code field

| Item | Effort | Notes |
|---|---|---|
| ✅ **Trade Program Phase 1 — pull rendering** — feature-flag trade-price display OFF on PDP + cart + checkout total. All users (including trade customers) see list prices. Trade customers still get cart and Add-to-Cart; "Pay Now" button temporarily replaced with disabled "Submit Order for Review — Coming Soon" placeholder until Phase 2 lands (Week 2). | 1 day | **DONE 2026-05-19.** Reverses Sacred Surface #3 rendering layer — §3 authorization noted. Feature flag: `NEXT_PUBLIC_TRADE_PRICE_DISPLAY` (default off). Engine (`trade-pricing.ts`) intact. |
| ✅ **Discount Code field at checkout** — rename "Trade code" → "Discount Code" (per merged `fix/cart-discount-code-label` branch). Field's new purpose: promo + F&F codes. Builds on existing `Promo_Codes` sheet-tab scaffold + trade-program welcome-code writer. Add checkout-side UI + validation endpoint + Stripe re-quote. | 4–6 hrs | **DONE 2026-05-19.** Validation endpoint at `/api/checkout/discount-validate`. Server re-validates in buy route; per-line Stripe distribution with drift reconciliation. Activity_Log redemption logging. Bilingual UI (EN/ES). |

#### Day 5 — Fri · Visible-bug bash + final cleanup

| Item | Effort | Notes |
|---|---|---|
| ✅ **Search palette stale-results investigation + fix** | 4 hrs | **DONE 2026-05-19.** Root cause: `productResults` React state not cleared on query change (stale results persisted across 250ms debounce). Fix: clear on new query + reset on palette re-open. `cachedFetch` TTL was NOT the cause (URL-keyed). `search-index.ts` untouched. |
| ✅ **Cart save/share investigation + fix** | 4 hrs | **DONE 2026-05-24.** Root cause was candidate (c) — endpoint bug: Resend SDK v6 error silently discarded. Already fixed on main via `93294ba`. Deployed staging endpoint confirmed working (200 OK from Resend). Held branch `fix/cart-share-email-error-handling` NOT needed for fix (enhancements only — remains on §8 hold). Added redirect logging to cart-share route for observability parity. |
| ✅ **Notifications template-literal leak** (`{issue_type}` literal rendering) + test-deal filter | 4 hrs | **DONE 2026-05-24.** `applyTemplateVars` now strips unresolved tokens (empty string instead of raw `{token}`). T-14 dispatch in stale-deal-sweep now passes `issue_type`, `issue_summary`, `recommended_action` vars. Test-deal filter added to `dispatchAlertsForTransition` — skips alerts when deal name or contact contains "test". |
| **Drive dashboard page fix** ("Failed to load") | 4 hrs | *(was B6)* P1.15. |
| **Doc archive sweep** — move §5A files, delete §5B duplicates, retire §5C deprecated | 30 min | *(was A4)* See §9 script. |
| **Worktree prune** — drop the ~42 merged worktrees | 30 min | *(was A5)* Recovers ~15 GB. |

#### Spans Week 1 (parallel background work)

| Item | Effort | Notes |
|---|---|---|
| **Homepage Hub + Nav Simplification** — buyer-focused 6-tile hub immediately under hero, separate "Become a Brand Partner" section lower (different audience), top nav reduces to ≤5 items, WhatsApp click-to-chat replaces persistent webchat, Sign in moves to top-right utility position. | 1.5 days | **NEW (v3.1).** Spec below. Spans Wed–Thu. |
| **Resurrect Squarespace scrape scripts from git history** (in parallel — sets up Week 2's scrape run) | ~2 days background | NEW (v3). Verify scripts still match current SS HTML; patch if needed. |
| **Deprecated checkout/Stripe routes cleanup** (3 concurrent implementations) | 2 hrs | *(was B7)* P1.16. Touches the consolidation work; do during Tue–Wed PDP refactor. |

#### Slips to Week 2 if Week 1 is over capacity (acceptable, not launch-critical for Wk 1)

| Item | Effort | Notes |
|---|---|---|
| **Dashboard reorganization** — role-based sidebar (Joshua / Roger / Antonina / Sales), kill stub routes, fix SOON badges | 2 days | *(was B4)* P1.9. Bundles P2.11 + P2.12. |
| **Sales / Marketing / Website analytics — kill hardcoded numbers** | 1 day | *(was B5)* P1.14. |
| **Mexican fiscal fields** (SAT codes) | 1 day | *(was B8)* P1.12. **Unblocks Factura↔Stripe.** |
| **Search platform migration begins** (Algolia / Meili / Typesense, feature-flagged) | 2–3 days | *(was B9)* P1.11. Highest blast radius — fits better as Week 2 main focus. |
| **Finance compliance (Stripe-dependent)** — wire auto-factura + consolidate dual ledgers | 1–2 days | ⛔ Contingent on Stripe access from Roger meeting. |

---

### Homepage Hub + Nav Simplification — spec (Week 1 build, ~1.5 days)

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

### Week 2 — May 26 – Jun 1 · Trade Program Phase 2 + Cloudflare + Squarespace scrape + WhatsApp kickoff

| Item | Effort | Notes |
|---|---|---|
| **Trade Program Phase 2 — workflow build** — real "Submit Order for Review" button, new endpoint `/api/checkout/trade-review`, customer confirmation page, account-page pending-orders view, sales-side dashboard queue, templated quote-out comms (email + WhatsApp + Stripe payment link), new lifecycle states `trade_review_pending → trade_quoted → trade_paid`, multi-project cart $100K CTA renamed to "Submit Project for Review" | 4–5 days | **NEW (v3.1).** Sacred Surface #3 reversal completes here. |
| **Cloudflare Images + R2 set up** (accounts, API keys, Netlify env vars) | 1 day | NEW (v3). ~$30–35/month at launch. |
| **Full Squarespace scrape run** — descriptions + images + spec PDF URLs across all live SS product pages | 1 day | NEW (v3). Largest single content-migration lever. |
| **SKU matching** — deterministic + LLM-assisted disambiguation | 1 day | NEW (v3). |
| **Image migration to CDN** — scraped images → Cloudflare Images; existing Drive images → Cloudflare Images | 1–2 days | NEW (v3). |
| **Brand Partner form build** — quick form + R2 PDF upload + `Brand_Applications` sheet writer | 0.5 day | **NEW (v3.1).** |
| **Schedule a Consultation — Google Calendar setup** — configure Appointment Scheduling, decide booking-routing (Roger's calendar / Javier-or-Ian round-robin / shared team), link the hub tile out | 1 hr config + 30 min frontend | **NEW (v3.1).** Zero new SaaS cost — uses existing Workspace. |
| **Search platform migration** (Algolia / Meili / Typesense, feature-flagged, smoke loop verified) | 2–3 days | *(was B9)* — moved from Wk 1. |
| **WhatsApp Business setup BEGINS** — Meta Business verification + API account + template submission (Meta approval async, takes 1–2 weeks; goes live Week 5) | 0.5 day active + async | NEW (v3). |
| **Finance compliance** — wire Stripe payments into auto-factura + dual-ledger reconciliation (if Stripe access granted in Roger meeting) | 1–2 days | *(was B10 + B11)* — moved from Wk 1 if Stripe access took a week. |
| **Dashboard reorganization** — role-based sidebar | 2 days | *(was B4)* — slips from Wk 1 if capacity tight. |

---

### Week 2 — May 26 – Jun 1 · Cloudflare + Squarespace scrape + WhatsApp kickoff

| Item | Effort | Notes |
|---|---|---|
| **Cloudflare Images + R2 set up** (accounts, API keys, Netlify env vars) | 1 day | NEW (v3). $30–35/month at launch. |
| **Full Squarespace scrape run** — descriptions + images + spec PDF URLs across all live SS product pages | 1 day | NEW (v3). Largest single content-migration lever in the project. |
| **SKU matching** — deterministic match + LLM-assisted disambiguation for ambiguous cases (script `05b-llm-match.ts` resurrected) | 1 day | NEW (v3). |
| **Image migration to CDN** — scraped images → Cloudflare Images; existing Drive images → Cloudflare Images (script writes new URL to catalog sheet) | 1–2 days | NEW (v3). |
| **Search platform migration finishes** (rollout behind feature flag, smoke loop verified) | 0.5 day | Tail of Week 1 work. |
| **WhatsApp Business setup BEGINS** — Meta Business verification + WhatsApp Business API account + message template submission (Meta approval takes 1–2 weeks; runs async) | 0.5 day active + async | NEW (v3). Goes live in Week 5. |

---

### Week 3 — Jun 2 – 8 · SEO technical + descriptions wired

| Item | Effort | Notes |
|---|---|---|
| **SEO technical pass** — page titles, meta descriptions, canonicals, hreflang (EN/ES), Open Graph, sitemap index for 354K PDPs | 2 days | NEW (v3). |
| **Scraped descriptions wired into PDPs** via existing `pdp-description.ts` resolver | 0.5 day | NEW (v3). Sacred Surface adjacent — verify resolver fallback chain still works. |
| **PDP H1 uses sidecar Spanish title when available** — consistency with meta-title + JSON-LD (Q2 resolution) | 0.5 day | **NEW (v3.1).** Audit Q2. |
| **AI descriptions wired into PDP resolver step 2.5** — `Product_Descriptions` (status=approved) reads added to `pdp-description.ts` between sidecar and CRM fallback. Keeps Roger approval gate, makes approvals actually render on PDPs (Q3 resolution). | 0.5 day | **NEW (v3.1).** Audit Q3. Necessary, not optional — Squarespace covers only 0.3% of catalog. |
| **AI-generated descriptions: top 50,000 SKUs not covered by Squarespace** — input: partner spec data + product attributes; LLM: Claude Sonnet | 2 days + ~$50 inference | NEW (v3). |
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
| **Sheets API mitigation (c)** — build-time JSON snapshot of CC_Products_Full written to disk; runtime reads from disk instead of Sheets API | 2 days | **NEW (v3.1).** $0 cost. Architectural insurance policy + sets up post-launch Postgres path. |
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
| *(was C3)* | Brand pages redesign (ex–Step 12) | **Roger decision tomorrow (§8).** If yes → Week 4–5. |
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

### The 7 concerns — quick mapping to weeks (for the Roger doc audience)

| Concern | Addressed |
|---|---|
| 1. Site loads slow | Wk 1 (search migration begins) · Wk 2 (CDN + ISR) · Wk 5 (Core Web Vitals) |
| 2. SEO/AEO overhaul | Wk 3 (technical) · Wk 4 (on-page + 301 map) · Wk 5 (AEO build) |
| 3. Product descriptions | Wk 2 (SS scrape) · Wk 3 (top-50K AI) · Wk 4 (long-tail AI) · Wk 5 (top-5K hand-edit) |
| 4. Image scraping | Wk 2 (SS scrape + CDN migration) · Wk 3–4 (brand-site fill-in) |
| 5. Spec sheets | Wk 2 (SS scrape pulls links) · Wk 5 (R2 migration + PDP "Specs" UI) |
| 6. Drive scalability | Wk 2 (Cloudflare set up + image migration) |
| 7. Comms channels + nav | Wk 1 (nav cleanup) · Wk 2 (WhatsApp Business kickoff) · Wk 5 (Email + Social + WhatsApp outbound live) |

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

# 5. Retire deprecated fix file
git rm docs/fixes/p1-resend-untold-works-domain.md

# 6. Add banner to PLAN.md / SESSIONS.md / COUNTER-CULTURES-ROADMAP.md
# (manual edit — see §5D)

git commit -m "docs(plan): consolidate to MASTER-PLAN.md, archive superseded prompts and specs"
```

---

## 10. Change log

- **2026-05-24 (Day 6 SHIPPED)** — Cart save/share investigation + Notifications template-literal fix + test-deal filter.
  - **Cart save/share (Item 1):** Investigated three candidate root causes per §6. Finding: the original RF-6 bug (Resend SDK v6 error silently discarded) was already fixed on main via `93294ba`. Deployed staging endpoint confirmed working — both allowlisted and non-allowlisted emails return 200 OK. Held branch `fix/cart-share-email-error-handling` (§4B/§8) NOT needed for the fix — it adds enhancements (wildcard allowlist + `info@` default sender) that remain on Joshua-decision hold. Added redirect logging to `app/api/cart/share/route.ts` for observability parity with `app/lib/email.ts`. Sacred Surface #1 (Cart) behavior unchanged. `STAGING_EMAIL_REDIRECT` confirmed intact start-to-end.
  - **Notifications template-literal leak (Item 2):** Root cause: `applyTemplateVars` returned raw `{token}` when vars were missing. R-14-issue template uses `{issue_type}`, `{issue_summary}`, `{recommended_action}` — none of which were populated by any call site. Fix: (1) `applyTemplateVars` now strips unresolved tokens (returns `""` instead of raw `{token}`) — prevents ALL template-literal leaks across every template. (2) T-14 dispatch in `stale-deal-sweep/route.ts` now passes the three vars with meaningful content (issue type, summary, recommended action). (3) Test-deal filter added to `dispatchAlertsForTransition` — skips all alert sends when deal name or contact contains "test" (case-insensitive). Prevents inbox pollution during staging dev work.
  - §0 compliance: all four conditions met. Sacred Surface #1 (Cart) verified working — no behavior change. Sacred Surface #5 (Email infra) — `app/lib/email.ts` NOT modified. `STAGING_EMAIL_REDIRECT` intact. No in-motion process (§0.4) disrupted. Build passes. Lint clean on changed files.
- **2026-05-21 (Day 3 SHIPPED)** — PDP cleanup propagation + branch triage + Resend verified. Three sub-sessions.
  - **PDP cleanup pass (Item 1):** Removed SKU visual display from PDP (JSON-LD sku/mpn still populated from data), deleted "PRICES IVA INCLUDED" priceNote from PDP + product-drawer, removed per-PDP EN/ES description language picker, replaced all "Request a Quote" CTAs with "Add to Cart" across PDP, AddToCartButton, product-drawer, project-list-bar, and both brand page routes. Grep-verified: zero "Request a Quote" or "Solicitar Cotización" CTA references remain. Brand pages: "Request a Quote" → "Contact Us"/"Contáctanos". Product-drawer: "Quote on request" → "Price on request"/"Precio bajo consulta".
  - **Full Catalog section delete (Item 2):** Deleted ~90-line "Beyond our selection" block from `app/[locale]/brands/[slug]/page.tsx` (hero stats + category chips + signature grid + "Open catalog" CTA). Brand+category page confirmed never had this section (MASTER-PLAN line reference was incorrect).
  - **Branch triage (Item 3 — §4B):** 11 branches processed. MERGED 4: `fix/cart-discount-code-label` (RF-4 superseded, "Trade code" → "Discount Code"), `fix/projects-404` (removes incorrect `/en/` prefix from project URLs), `fix/cc-llc-color-scheme-reports-ap` (CC/LLC color coding for AP views — Antonina-facing), `claude/amazing-zhukovsky-707d87` (P&L latest-month default + footer Maps link + `/shop` → `/shop/catalog` + `/returns` → `/returns-warranty` redirects). DROPPED 4: `fix/whatsapp-opt-out-default` (LFPDPPP conflict), `fix/net-price-label-iva-wording` (stale — `product-detail.tsx` deleted Day 2, `order-summary.tsx` already updated), `claude/gallant-khayyam-1d2480` (all 3 changes already on main), `claude/dazzling-gates-6178ba` (link checker already on main). DELETED 1: `claude/eloquent-stonebraker-cc7e55` (no unmerged commits). HOLD 2: `fix/cart-share-email-error-handling` (Joshua-decision — Sacred Surface #5), `fix/local-delivery-signature` (Joshua-decision — net-new feature). All worktrees for processed branches removed.
  - **Customer sign-in (Item 4):** `GOOGLE_CLIENT_ID_CUSTOMER` already set on Netlify. `GOOGLE_CLIENT_SECRET_CUSTOMER` MISSING — Joshua must retrieve from GCP Console (`counter-portal-493716` project, OAuth client `374048983912-ss013d...`). Code side complete.
  - **Resend P1.1 (Item 5):** Verified complete. `RESEND_FROM_TRANSACTIONAL=onboarding@resend.dev` across all Netlify contexts. `STAGING_EMAIL_REDIRECT` limits delivery to `admin@` + `roger@countercultures.com.mx`. P1.1 DONE.
  - §0 compliance: all four conditions met. Sacred Surface #2 (PDP) form-change only — Add to Cart behavior unchanged, JSON-LD preserved. Sacred Surface #1 (cart) form-change only — "Trade code" label → "Discount Code". TypeScript type check passes clean after all merges.
- **2026-05-20 (Day 2 SHIPPED)** — PDP template consolidation. Single session, single commit.
  - `cfdc60b` — `feat(pdp): consolidate to single canonical PDP template (Day 2)` — deleted /shop/quote/ route (6 files, ~1,061 lines), removed toQuoteProduct + searchQuoteCatalog + getQuoteCatalogBySlug from products-full.ts, removed orphaned quote functions from sheets.ts, renamed getQuoteCatalogBrands → getCatalogBrands, added 301 redirects for /shop/quote/* → /shop/catalog, added PDP contract header comment to canonical template, appended product-render surface inventory + PDP contract to data-sources-of-truth.md.
  - Product-render audit found 4 one-off renderings: catalog-view.tsx, product-drawer.tsx, catalog-search.tsx (dashboard), product-detail-panel.tsx (dashboard). Documented for Day 3 follow-up (≥3 threshold = don't refactor in this session).
  - §0 compliance: all four conditions met. Sacred Surface #2 behavior unchanged (form only — deprecated template removed, canonical template preserved). Smoke loop: cart ✓ PDP ✓ cmd-K ✓ checkout ✓ login ✓ redirect ✓.
  - Tangle 1/Q4 (sidecar price on quote catalog) self-resolved as predicted — the only reader of sidecar `price` was `toQuoteProduct()`, now deleted.
- **2026-05-20 (Envira investigation — null finding)** — Joshua's hypothesis that "Envira" might be a brand in Odoo. Direct Odoo JSON-RPC query (read-only) + Sheets API queries across every relevant tab confirmed: **"envira" does not exist in any reachable data source.** Coverage: Odoo brand models (don't exist) + `res.partner` (0) + `product.template` 354,449 records (0) + Brand Kit Sheet 168 rows (0) + CRM Products/Products_Odoo/Products_Quote/Product_Descriptions/Brand_NOM_Status/Brand_Lead_Times tabs (0) + CC_Products_Full 354,449 rows (0) + sidecar `product-content.json` 1.1 MB (0) + `app/` and `docs/` source (0). Total ~362K records searched. Day 3 Item 3 (Rodger Envira data cleanup) ⛔ SKIPPED. Reopen only with sample URL or corrected spelling. Investigation scripts archived in outputs.
- **2026-05-20 (Day 2 SHIPPED — PDP template consolidation)** — Second execution session. Deprecated `/shop/quote/` template removed (6 route files + 1 API route deleted), `toQuoteProduct()` removed, canonical PDP at `app/[locale]/shop/[category]/p/[slug]/page.tsx` locked with header comment + contract documented in `docs/data-sources-of-truth.md`. Net diff: **+83 / −1,061 lines** (978 net deleted). Smoke loop clean on all 6 Sacred Surface steps. 301 redirect verified (`/en/shop/quote/p-12345 → /en/shop/catalog`).
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
