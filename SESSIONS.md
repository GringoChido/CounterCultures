# Counter Cultures — Session Plan

> Every fix as a paste-ready Claude Code prompt, in execution order.
> Last updated: 2026-05-12 (post-reframe)

## ⚠️ Phase 1 / Phase 2 — read first

**Every session below is Phase 1: harden the Netlify staging app until it's smooth and efficient enough to replace Squarespace.** None of these sessions touch the live production domain `countercultures.com.mx`, the Squarespace site, or production DNS. Production cutover is **Phase 2** — a separate, deliberate, future project not yet scoped. See `COUNTER-CULTURES-ROADMAP.md` and `AGENTS.md` for the full frame.

---

## How to use this

1. Open this file. Find the next ⬜ unchecked session.
2. Start a fresh Claude Code session.
3. Copy the prompt block (the quoted text) and paste.
4. Claude works. You review. You commit.
5. Update status here AND in `COUNTER-CULTURES-ROADMAP.md` to ✅.
6. Close session. Move to next.

**One session = one fix.** Exceptions are batched explicitly (Session 1 and Session 18 below).

---

## Week 1 — Security + Infrastructure

### 🟢 Session 1 — Security + env vars (P0 cluster) — DONE 2026-05-12 (except P0.2 blocked) · ⏱️ ~90 min · BATCHED

The 5 P0 fixes are all "set the right thing, redeploy, verify" — combine them.

**Paste:**

> Read AGENTS.md. Then read and execute these 5 fix files IN ORDER, branching per fix:
> 1. docs/fixes/p0-crm-shared-drive.md
> 2. docs/fixes/p0-portal-users-bootstrap.md
> 3. docs/fixes/p0-stripe-webhook-secret.md
> 4. docs/fixes/p0-cron-probe-key.md
> 5. docs/fixes/p0-minisearch-duplicate-id.md
>
> Stop after each fix, verify per its Verification section, commit, then move to the next.

**Dependencies:** none · **Status:** 🟢 DONE (P0.1, P0.3, P0.4, P0.5) · ⏸️ P0.2 Stripe blocked on Roger granting Stripe team access · Code changes for P0.1/P0.3/P0.4/MiniSearch sitting uncommitted — run `git status` and commit/push to deploy

---

### 🟡 Session 2 — Resend STAGING SANDBOX mode · ⏱️ ~30 min · REFRAMED

**Scope-corrected** (formerly tried to verify the production domain — that's Phase 2). Phase 1 uses Resend's sandbox sender (`onboarding@resend.dev`) and authorized test recipients (Joshua + Roger). Zero production DNS work.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-resend-setup.md, then execute. This is STAGING SANDBOX MODE — do not verify any domain at Resend, do not touch production DNS, do not modify nameservers anywhere. Use Resend's sandbox sender and authorized-recipient model.

**Dependencies:** none · **Status:** 🟡 PARTIAL — Netlify env vars + debug route exist, needs sandbox-sender update + Cloudflare zone cleanup

---

### ⬜ Session 3 — Customer accounts (magic-link + Google OAuth) · ⏱️ ~2 days

The foundational v1 customer account system.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-customer-accounts.md, then execute.

**Dependencies:** Session 2 (Resend) · **Status:** ⬜

---

### ⬜ Session 4 — Trade pricing spreadsheet + lookup engine · ⏱️ ~1 day

New separate Sheet, tier-ready schema.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-trade-pricing.md, then execute.

**Dependencies:** Session 3 (Customer accounts — for the is_trade + trade_tier fields) · **Status:** ⬜

---

### ⬜ Session 5 — Promo / F&F code on PAY page · ⏱️ ~1 day

New input on /checkout/pay, mutually exclusive with trade pricing.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-promo-code-checkout.md, then execute.

**Dependencies:** Session 4 (Trade pricing — for the mutually-exclusive logic) · **Status:** ⬜

---

## Week 2 — The Big SEO/UX Win

### ⬜ Session 6 — Product detail pages · ⏱️ ~2–3 days · THE BIGGEST ONE

354K SKUs become discoverable. Real product URLs. Real SEO.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-product-detail-pages.md, then execute.

**Dependencies:** none (but Session 4 helps for trade-price rendering on PDPs) · **Status:** ⬜

---

### ⬜ Session 7 — Trade Program real data (kill mocks) · ⏱️ ~1 day

Replace Elena Martinez / Coastal Living Interiors / Hacienda Renovations / Pacific Homes Builder with real customer data.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-trade-program-real-data.md, then execute.

**Dependencies:** Sessions 2, 3 (Resend + Customer accounts) · **Status:** ⬜

---

### ⬜ Session 8 — Dashboard reorganization (role-based) · ⏱️ ~2 days

Joshua / Roger / Antonia / Sales each get their own sidebar shape.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-dashboard-reorganization.md, then execute.

**Dependencies:** Session 1 (Users sheet seeded so roles are real) · **Status:** ⬜

---

## Week 3 — Performance + Architecture

### ⬜ Session 9 — Image CDN (Cloudflare Images) · ⏱️ ~1 day

Kills the 5.5s catalog load + the 18-of-60 image 404s.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-image-cdn.md, then execute.

**Dependencies:** none · **Status:** ⬜

---

### ⬜ Session 10 — Search platform migration (Meilisearch) · ⏱️ ~2–3 days

Replaces MiniSearch + 354K substring scan. Kills the 10s cold-lambda problem.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-search-platform.md, then execute.

**Dependencies:** none (but obsoletes Session 1's MiniSearch fix on the article side) · **Status:** ⬜

---

### ⬜ Session 11 — Mexican fiscal fields (SAT codes) · ⏱️ ~1 day

Adds clave de producto/servicio, clave de unidad, HS code, IVA rate per product.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-mexican-fiscal-fields.md, then execute.

**Dependencies:** none · **Status:** ⬜

---

### ⬜ Session 12 — Factura ↔ Stripe bridge · ⏱️ ~2 days

Stripe payments now auto-emit facturas (the compliance gap).

**Paste:**

> Read AGENTS.md and docs/fixes/p1-factura-stripe-bridge.md, then execute.

**Dependencies:** Session 1 (Stripe webhook), Session 11 (fiscal fields) · **Status:** ⬜

---

### ⬜ Session 13 — Notifications template-literal leak · ⏱️ ~4 hrs

Stop showing `{issue_type}` to users.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-notifications-template-leak.md, then execute.

**Dependencies:** none · **Status:** ⬜

---

### ⬜ Session 14 — Dual payment ledgers reconciliation · ⏱️ ~1 day

Payments (4,674 Odoo) vs Finance (48 CRM) — one source of truth.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-dual-payment-ledgers.md, then execute.

**Dependencies:** Session 1 (Stripe webhook) · **Status:** ⬜

---

### ⬜ Session 15 — Analytics real data (kill hardcoded numbers) · ⏱️ ~1 day

Sales Analytics, Marketing & Traffic, Website Analytics — wire to reality.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-analytics-real-data.md, then execute.

**Dependencies:** none · **Status:** ⬜

---

### ⬜ Session 16 — Drive page fix · ⏱️ ~4 hrs

"Failed to load Drive" → working file browser.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-drive-page-fix.md, then execute.

**Dependencies:** none · **Status:** ⬜

---

### ⬜ Session 17 — Deprecated routes cleanup · ⏱️ ~2 hrs

Delete the 3 concurrent checkout implementations.

**Paste:**

> Read AGENTS.md and docs/fixes/p1-deprecated-routes-cleanup.md, then execute.

**Dependencies:** none · **Status:** ⬜

---

## Week 4 — Cleanup + Quick Wins

### ⬜ Session 18 — P2 quick wins (BATCHED) · ⏱️ ~2 hrs · BATCHED

4 tiny fixes combined.

**Paste:**

> Read AGENTS.md. Then read and execute these 4 fix files IN ORDER, branching per fix:
> 1. docs/fixes/p2-soon-badges-fix.md
> 2. docs/fixes/p2-stub-routes-removal.md
> 3. docs/fixes/p2-doc-consolidation.md
> 4. docs/fixes/p2-worktree-cleanup.md
>
> Stop after each fix, verify, commit, then move to next.

**Dependencies:** none · **Status:** ⬜

---

### ⬜ Session 19 — Stale code sweep · ⏱️ ~4 hrs

~3,150 lines of dead code removed.

**Paste:**

> Read AGENTS.md and docs/fixes/p2-stale-code-sweep.md, then execute.

**Dependencies:** Session 17 (deprecated routes already gone) · **Status:** ⬜

---

### ⬜ Session 20 — Test data cleanup · ⏱️ ~4 hrs

E99-TEST shipments + DEAL-__TEST_DEAL_W7_* notifications purged.

**Paste:**

> Read AGENTS.md and docs/fixes/p2-test-data-cleanup.md, then execute.

**Dependencies:** none · **Status:** ⬜

---

### ⬜ Session 21 — Product image 404 cleanup · ⏱️ ~4 hrs

The 30% broken-thumbnail problem.

**Paste:**

> Read AGENTS.md and docs/fixes/p2-product-image-404s.md, then execute.

**Dependencies:** Session 9 (Image CDN — context for routing) · **Status:** ⬜

---

### ⬜ Session 22 — Brand Kit Spanglish cleanup · ⏱️ ~4 hrs

The 22 brands with AI mid-translation gibberish.

**Paste:**

> Read AGENTS.md and docs/fixes/p2-brand-kit-spanglish.md, then execute.

**Dependencies:** none · **Status:** ⬜

---

### ⬜ Session 23 — P&L cross-currency bug · ⏱️ ~4 hrs

Gross Profit no longer shows 178.1%.

**Paste:**

> Read AGENTS.md and docs/fixes/p2-pnl-currency-bug.md, then execute.

**Dependencies:** none · **Status:** ⬜

---

## Week 5 — Operational Excellence

### ⬜ Session 24 — Stale-quotes follow-up engine · ⏱️ ~1 day

The $35M MXN backlog gets working again.

**Paste:**

> Read AGENTS.md and docs/fixes/p2-stale-quotes-engine.md, then execute.

**Dependencies:** Session 2 (Resend) · **Status:** ⬜

---

### ⬜ Session 25 — Inventory low-stock notifications · ⏱️ ~1 day

Daily digest to Roger + Antonia.

**Paste:**

> Read AGENTS.md and docs/fixes/p2-inventory-notifications.md, then execute.

**Dependencies:** Session 2 (Resend) · **Status:** ⬜

---

### ⬜ Session 26 — Blog analytics (wire views) · ⏱️ ~4 hrs

91 posts at 0 views → real tracking.

**Paste:**

> Read AGENTS.md and docs/fixes/p2-blog-analytics.md, then execute.

**Dependencies:** none · **Status:** ⬜

---

### ⬜ Session 27 — WhatsApp Business setup · ⏱️ ~1 day

Primary sales channel actually wired.

**Paste:**

> Read AGENTS.md and docs/fixes/p2-whatsapp-setup.md, then execute.

**Dependencies:** none (but mostly account-setup time, not code) · **Status:** ⬜

---

### ⬜ Session 28 — Sheets race conditions (optimistic locking) · ⏱️ ~1 day

Two reps can't silently overwrite each other anymore.

**Paste:**

> Read AGENTS.md and docs/fixes/p2-sheets-race-conditions.md, then execute.

**Dependencies:** none · **Status:** ⬜

---

### ⬜ Session 29 — Cold lambda mitigation · ⏱️ ~1 day

OPTIONAL — may be obsoleted by Session 10 (search platform). Re-evaluate after Session 10.

**Paste:**

> Read AGENTS.md and docs/fixes/p2-cold-lambda-mitigation.md, then execute.

**Dependencies:** Session 10 (search platform — re-evaluate need first) · **Status:** ⬜

---

## Phase 2 placeholder — DO NOT START YET

Production cutover from Squarespace → Netlify. Not in scope until Phase 1 (staging) is shippable. To be detailed in a separate `PHASE-2-CUTOVER.md` document when ready. Likely scope:

- DNS migration off Squarespace / Google Domains
- Resend production-domain verification on `countercultures.com.mx`
- SEO 301 redirect map from Squarespace URLs to Netlify URLs (critical for ranking continuity)
- Existing customer comms
- Stripe environment handover if needed
- Rollback plan + monitoring window
- Pre- and post-cutover health checks

---

## Backlog (P3 — nice-to-have)

### ⬜ Session 30 — NOM compliance tracking · ⏱️ ~1 day

**Paste:**

> Read AGENTS.md and docs/fixes/p3-nom-tracking.md, then execute.

---

### ⬜ Session 31 — Brand logos populated · ⏱️ ~1 day

**Paste:**

> Read AGENTS.md and docs/fixes/p3-brand-logos.md, then execute.

---

### ⬜ Session 32 — Product schemas reconciliation · ⏱️ ~2 days

**Paste:**

> Read AGENTS.md and docs/fixes/p3-product-schemas.md, then execute.

---

### ⬜ Session 33 — Trade tiers v2 (Gold/Silver/Bronze) · ⏱️ ~1 day

**Paste:**

> Read AGENTS.md and docs/fixes/p3-trade-tiers.md, then execute.

**Dependencies:** Session 4 (Trade pricing structure exists) · **Status:** ⬜

---

### ⬜ Session 34 — Sheets → Postgres migration plan · ⏱️ RESEARCH

**Paste:**

> Read AGENTS.md and docs/fixes/p3-database-migration.md, then execute the RESEARCH portion only. Surface options + tradeoffs + cost model. Do NOT begin migration without explicit approval.

---

### ⬜ Session 35 — Customer accounts v2 (order history, wishlist, address book) · ⏱️ ~2–3 days

**Paste:**

> Read AGENTS.md and docs/fixes/p3-customer-accounts-v2.md, then execute.

**Dependencies:** Session 3 (v1 customer accounts shipped) · **Status:** ⬜

---

## Summary

**Total sessions: 35** · **Total estimated effort: ~10–12 weeks** at 3 sessions/week.

**Critical path (don't skip / don't reorder):**
- Session 1 → 2 → 3 → 4 → 5 (the v2 customer experience build)
- Session 1 → 11 → 12 (the Mexican factura compliance build)
- Session 6 (PDPs) can run in parallel with anything above

**Independent (do anytime):** Sessions 9, 10, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26, 28

**Status legend:**
- ⬜ Not started
- 🟨 In progress
- ✅ Done
- ⛔ Blocked

Check each session as you finish. Also update `COUNTER-CULTURES-ROADMAP.md` so the master view stays in sync.
