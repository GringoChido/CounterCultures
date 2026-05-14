# Counter Cultures — Roadmap

> Living document. Update status as you go. Generated from the May 2026 baseline audit.
> Last refreshed: 2026-05-12

---

## 🚨 SCOPE FRAME — Phase 1 vs Phase 2 (read before anything)

**The Next.js app in this repo, deployed to `countercultures.netlify.app`, is STAGING.** It is not live to customers. The LIVE production site is the Squarespace site at `https://countercultures.com.mx`, which is NOT in this repo.

**Phase 1 (NOW) — Build staging to "smooth and efficient."** Everything below — P0, P1, P2, P3 — is Phase 1 work that hardens, completes, and matures the Netlify staging app. None of it touches the production domain or the live Squarespace site.

**Phase 2 (LATER) — Production cutover from Squarespace to Netlify.** A separate, deliberate project that runs only after Phase 1 is shippable. Scope (not yet detailed):

- DNS migration off Squarespace / Google Domains (likely to Cloudflare)
- Resend production-domain verification on `countercultures.com.mx`
- SEO continuity — 301 redirect map from Squarespace URLs to Netlify URLs (critical; missing this loses years of ranking)
- Existing-customer comms (heads-up email, FAQ for any change-of-experience items)
- Stripe handover from the live store to the new Stripe environment, if needed
- Rollback plan + monitoring window
- Pre- and post-cutover health checks (live site uptime, email deliverability, SEO health)

**If you find yourself working on anything Phase 2 (production DNS, Squarespace, registrar, live-customer-affecting), STOP and confirm with Joshua first.** The May 2026 audit accidentally drifted toward Phase 2 thinking on Session 2 (Resend); see the corrected fix file.

---

## How to use this

1. Pick the highest-priority **PENDING** item from the tables below.
2. Start a fresh Claude Code session (one fix per session is best — see `docs/baseline/00-how-we-work.md`).
3. Tell Claude: `Read AGENTS.md and docs/fixes/<filename>, then execute.`
4. Claude works, you review, you commit on a feature branch.
5. Update status here to **DONE**, close the session, merge.

For background and evidence behind any fix, see `docs/baseline/` (the read-mostly evidence layer).

---

## Status legend

- 🔴 **PENDING** — not started
- 🟡 **IN PROGRESS** — actively being worked
- 🟢 **DONE** — shipped + verified
- ⚪ **BLOCKED** — waiting on something (note what in the fix file)

---

## P0 — Ship today (security + critical bugs)

| # | Fix | File | Status | Effort |
|---|-----|------|--------|--------|
| P0.1 | **Portal Users bootstrap is open** — anyone @countercultures.com.mx can sign in | [`docs/fixes/p0-portal-users-bootstrap.md`](docs/fixes/p0-portal-users-bootstrap.md) | 🟢 DONE | 30 min |
| P0.2 | **Stripe webhook secret missing** — events drop silently (503) | [`docs/fixes/p0-stripe-webhook-secret.md`](docs/fixes/p0-stripe-webhook-secret.md) | ⚪ BLOCKED — awaiting Stripe team access from Roger | 15 min |
| P0.3 | **Cron probe key unset** — `/api/cron/*` is unauthenticated | [`docs/fixes/p0-cron-probe-key.md`](docs/fixes/p0-cron-probe-key.md) | 🟢 DONE (env var set + cron routes hardened to require probe key + 3 scheduled-function wrappers send probe key) | 10 min |
| P0.4 | **MiniSearch duplicate-ID error** — search palette crashes site-wide | [`docs/fixes/p0-minisearch-duplicate-id.md`](docs/fixes/p0-minisearch-duplicate-id.md) | 🟢 DONE (data dupe deleted row 15 + code dedup guard added in `app/lib/search-index.ts`) | 30 min |
| P0.5 | **CRM lives in personal Gmail My Drive** — move to Shared Drive | [`docs/fixes/p0-crm-shared-drive.md`](docs/fixes/p0-crm-shared-drive.md) | 🟢 DONE (moved into Counter Cultures Shared Drive) | 15 min |

**P0 status: 4 of 5 DONE on 2026-05-12.** ✅ Portal Users + Cron probe key + MiniSearch dupe + CRM Shared Drive shipped. ⚪ Stripe webhook blocked on Roger granting Stripe team access to Joshua. Code changes for P0.1/P0.3/P0.4 are sitting uncommitted locally — commit/push/deploy completes the rollout.

---

## P1 — Ship this week (broken features + new structure)

| # | Fix | File | Status | Effort |
|---|-----|------|--------|--------|
| P1.1 | **Resend setup (staging-only sandbox mode)** — email infra for staging tests; production DNS verification is Phase 2 | [`docs/fixes/p1-resend-setup.md`](docs/fixes/p1-resend-setup.md) | 🟡 PARTIAL — env vars set in Netlify + debug route written; needs sandbox-mode rewrite (no `countercultures.com.mx` DNS) | 30 min |
| P1.2 | **Customer accounts + storage** — magic-link + Google OAuth, Customers sheet | [`docs/fixes/p1-customer-accounts.md`](docs/fixes/p1-customer-accounts.md) | 🟢 DONE — PR [#40](https://github.com/GringoChido/CounterCultures/pull/40); Google OAuth client needs manual creation in GCP | 2 days |
| P1.3 | **Trade pricing spreadsheet + lookup engine** — separate Sheet, tier-ready schema | [`docs/fixes/p1-trade-pricing.md`](docs/fixes/p1-trade-pricing.md) | 🟢 DONE 2026-05-13 (PR #45 + adapter fix 5a155dc) — Trade Pricing sheet, tier-aware lookup engine, PDP trade price rendering | 1 day |
| P1.4 | **Promo / F&F code on PAY page** — new scope; cart input + validation + Stripe re-quote | [`docs/fixes/p1-promo-code-checkout.md`](docs/fixes/p1-promo-code-checkout.md) | 🔴 PENDING | 1 day |
| P1.5 | **Product detail pages** — 354K SKUs have no PDPs (biggest UX/SEO win) | [`docs/fixes/p1-product-detail-pages.md`](docs/fixes/p1-product-detail-pages.md) | 🟢 DONE 2026-05-13 (PR #46) — full 354K catalog now has PDPs with ISR + JSON-LD + bilingual + search palette navigation | 2-3 days |
| P1.6 | **Trade Program — kill hardcoded mocks, wire real data** | [`docs/fixes/p1-trade-program-real-data.md`](docs/fixes/p1-trade-program-real-data.md) | 🔴 PENDING | 1 day |
| P1.7 | **Notifications template-literal leak** — `{issue_type}` showing as text in UI | [`docs/fixes/p1-notifications-template-leak.md`](docs/fixes/p1-notifications-template-leak.md) | 🔴 PENDING | 4 hrs |
| P1.8 | **Dual payment ledgers consolidation** — Payments (4,674) vs Finance (48) | [`docs/fixes/p1-dual-payment-ledgers.md`](docs/fixes/p1-dual-payment-ledgers.md) | 🔴 PENDING | 1 day |
| P1.9 | **Dashboard reorganization** — role-based sidebar, kill stub routes, fix SOON badges | [`docs/fixes/p1-dashboard-reorganization.md`](docs/fixes/p1-dashboard-reorganization.md) | 🔴 PENDING | 2 days |
| P1.10 | **Image CDN setup** — DEFERRED. CDN config can be added now but isn't blocking staging; revisit at Phase 2 cutover unless catalog perf becomes a problem in staging | [`docs/fixes/p1-image-cdn.md`](docs/fixes/p1-image-cdn.md) | ⚪ DEFERRED TO PHASE 2 | 1 day |
| P1.11 | **Search platform migration** — Algolia/Meili/Typesense pick + indexer | [`docs/fixes/p1-search-platform.md`](docs/fixes/p1-search-platform.md) | 🔴 PENDING | 2-3 days |
| P1.12 | **Mexican fiscal fields (SAT codes + unit codes)** | [`docs/fixes/p1-mexican-fiscal-fields.md`](docs/fixes/p1-mexican-fiscal-fields.md) | 🔴 PENDING | 1 day |
| P1.13 | **Factura ↔ Stripe bridge** — wire Stripe payments into the auto-factura path | [`docs/fixes/p1-factura-stripe-bridge.md`](docs/fixes/p1-factura-stripe-bridge.md) | 🔴 PENDING | 2 days |
| P1.14 | **Sales / Marketing / Website analytics — kill hardcoded numbers** | [`docs/fixes/p1-analytics-real-data.md`](docs/fixes/p1-analytics-real-data.md) | 🔴 PENDING | 1 day |
| P1.15 | **Drive dashboard page** — "Failed to load" despite service account connected | [`docs/fixes/p1-drive-page-fix.md`](docs/fixes/p1-drive-page-fix.md) | 🔴 PENDING | 4 hrs |
| P1.16 | **Deprecated checkout/Stripe routes — final cleanup** (3 concurrent implementations) | [`docs/fixes/p1-deprecated-routes-cleanup.md`](docs/fixes/p1-deprecated-routes-cleanup.md) | 🔴 PENDING | 2 hrs |
| P1.17 | **Cart IVA + shipping method picker + oversized freight flow** — IVA on cart page, 3-option shipping picker at checkout, oversized → custom freight quote | [`docs/fixes/p1-cart-iva-shipping-methods.md`](docs/fixes/p1-cart-iva-shipping-methods.md) | 🟢 DONE 2026-05-14 | 4 hrs |

---

## P2 — Ship this month (UX / perf / cleanup)

| # | Fix | File | Status | Effort |
|---|-----|------|--------|--------|
| P2.1 | **Stale-quote follow-up engine** — $35M MXN in 741 stale quotes | [`docs/fixes/p2-stale-quotes-engine.md`](docs/fixes/p2-stale-quotes-engine.md) | 🔴 PENDING | 1 day |
| P2.2 | **Product image 404 cleanup** — 30% broken thumbnails on catalog | [`docs/fixes/p2-product-image-404s.md`](docs/fixes/p2-product-image-404s.md) | 🔴 PENDING | 4 hrs |
| P2.3 | **Cold lambda mitigation** — 10.7s TTFB on cold start | [`docs/fixes/p2-cold-lambda-mitigation.md`](docs/fixes/p2-cold-lambda-mitigation.md) | 🔴 PENDING | 1 day |
| P2.4 | **Brand Kit Spanglish cleanup** — 22 brands with AI-mid-translation gibberish | [`docs/fixes/p2-brand-kit-spanglish.md`](docs/fixes/p2-brand-kit-spanglish.md) | 🔴 PENDING | 4 hrs |
| P2.5 | **Doc duplicates consolidation** — 3 × Full-Plan.docx, 2 × Proposal.docx | [`docs/fixes/p2-doc-consolidation.md`](docs/fixes/p2-doc-consolidation.md) | 🔴 PENDING | 1 hr |
| P2.6 | **Worktree cleanup** — 15 GB across 14 unmerged worktrees | [`docs/fixes/p2-worktree-cleanup.md`](docs/fixes/p2-worktree-cleanup.md) | 🔴 PENDING | 1 hr |
| P2.7 | **Stale code sweep** — ~3,150 lines of confirmed-dead code | [`docs/fixes/p2-stale-code-sweep.md`](docs/fixes/p2-stale-code-sweep.md) | 🔴 PENDING | 4 hrs |
| P2.8 | **Test data cleanup** — 7 of 8 shipments are E99-TEST, test deals in notifications | [`docs/fixes/p2-test-data-cleanup.md`](docs/fixes/p2-test-data-cleanup.md) | 🔴 PENDING | 4 hrs |
| P2.9 | **Inventory low-stock notifications** — alert Antonia/Roger on threshold | [`docs/fixes/p2-inventory-notifications.md`](docs/fixes/p2-inventory-notifications.md) | 🔴 PENDING | 1 day |
| P2.10 | **P&L cross-currency calc bug** — GP showing 178.1% | [`docs/fixes/p2-pnl-currency-bug.md`](docs/fixes/p2-pnl-currency-bug.md) | 🔴 PENDING | 4 hrs |
| P2.11 | **"SOON" badges are wrong** — Email Campaigns is fully built; Social Hub is Demo Mode | [`docs/fixes/p2-soon-badges-fix.md`](docs/fixes/p2-soon-badges-fix.md) | 🔴 PENDING | 30 min |
| P2.12 | **Odoo page + dev-only routes — remove from nav** | [`docs/fixes/p2-stub-routes-removal.md`](docs/fixes/p2-stub-routes-removal.md) | 🔴 PENDING | 30 min |
| P2.13 | **Blog Manager analytics — wire views tracking** | [`docs/fixes/p2-blog-analytics.md`](docs/fixes/p2-blog-analytics.md) | 🔴 PENDING | 4 hrs |
| P2.14 | **WhatsApp Business setup** — currently dry-run mode | [`docs/fixes/p2-whatsapp-setup.md`](docs/fixes/p2-whatsapp-setup.md) | 🔴 PENDING | 1 day |
| P2.15 | **Race conditions on Sheets writes** — add optimistic locking pattern | [`docs/fixes/p2-sheets-race-conditions.md`](docs/fixes/p2-sheets-race-conditions.md) | 🔴 PENDING | 1 day |

---

## P3 — Nice to have (polish / longer-term)

| # | Fix | File | Status | Effort |
|---|-----|------|--------|--------|
| P3.1 | **NOM compliance tracking** — populate `nom_status_summary` (currently all "unknown") | [`docs/fixes/p3-nom-tracking.md`](docs/fixes/p3-nom-tracking.md) | 🔴 PENDING | 1 day |
| P3.2 | **Brand logos populated** — `logo_drive_id` empty on all 168 brands | [`docs/fixes/p3-brand-logos.md`](docs/fixes/p3-brand-logos.md) | 🔴 PENDING | 1 day |
| P3.3 | **Schema A/B Products reconciliation** — two id-spaces, no mapping | [`docs/fixes/p3-product-schemas.md`](docs/fixes/p3-product-schemas.md) | 🔴 PENDING | 2 days |
| P3.4 | **Trade tier system (v2)** — Gold/Silver/Bronze (structure ready, just populate) | [`docs/fixes/p3-trade-tiers.md`](docs/fixes/p3-trade-tiers.md) | 🔴 PENDING | 1 day |
| P3.5 | **Sheets → Postgres migration plan** — main CRM is near 10M cell cap | [`docs/fixes/p3-database-migration.md`](docs/fixes/p3-database-migration.md) | 🔴 PENDING | RESEARCH |
| P3.6 | **Customer accounts v2** — wishlists, order history UI, address book mgmt | [`docs/fixes/p3-customer-accounts-v2.md`](docs/fixes/p3-customer-accounts-v2.md) | 🔴 PENDING | 2-3 days |

---

## Roger feedback batch — 2026-05-13

Confirmed with Joshua + Roger on 2026-05-13. PR [#47](https://github.com/GringoChido/CounterCultures/pull/47).

| # | Fix | Status |
|---|-----|--------|
| RF-1 | **Multi-project system** — PDP Save-to-Project CTA, project store, 5 API routes, account pages, $100K progress bar + special pricing CTA | ✅ DONE |
| RF-2 | **Cart IVA breakout** — Subtotal (neto) / IVA 16% / Total in cart + checkout | ✅ DONE |
| RF-3 | **PDP net-price caption** — "Precio neto · IVA al finalizar la compra" under every PDP price | ✅ DONE |
| RF-4 | **Discount code rename** — Already uses "Trade code" / no "promo code" strings found — no changes needed | ✅ DONE (no-op) |
| RF-5 | **WhatsApp marketing opt-in** — Unchecked checkbox at signup, toggle in settings, LFPDPPP compliant | ✅ DONE |
| RF-6 | **Cart-share email v2** — Branded redesign with hero image, itemized table, 3-line IVA totals | ✅ DONE |
| RF-7 | **Search quick-add CTAs** — + Cart buttons on search palette product results | ✅ DONE |

---

## Sprint suggestion (your first week)

**Day 1 — Security pass (P0 cluster):** Knock out P0.1 → P0.5 in one focused session (~1.5 hrs).

**Day 2 — Email infrastructure:** P1.1 (Resend). Unblocks P1.2, P1.6, P2.1, plus reduces manual finance ops.

**Day 3-4 — Customer & Trade scaffolding:** P1.2 (Customer accounts) + P1.3 (Trade pricing) + P1.4 (Promo codes). These three together create the full v2 customer/pricing structure.

**Day 5 — The big SEO/UX win:** P1.5 (Product detail pages). 354K SKUs become discoverable.

**Week 2:** P1.6 (Trade Program real data), P1.9 (Dashboard reorg), P1.10 (Image CDN), P1.11 (Search platform).

**Week 3:** All P2 cleanup + remaining P1 fiscal/factura work.

---

## How fixes interact (dependency notes)

- **P1.1 (Resend) unblocks:** P1.2, P1.6, P1.14, P2.1, P2.9 — set this up first.
- **P1.2 (Customer accounts) unblocks:** the full v2 experience. Trade and promo features become real once accounts exist.
- **P1.5 (Product detail pages) unblocks:** real SEO. Without PDPs, no organic acquisition.
- **P0.5 (CRM Shared Drive) unblocks:** any team-handoff scenario. Required before non-Joshua users can be added to Users sheet.
- **P1.11 (Search platform) replaces:** MiniSearch + the 354K-row substring scan. Big perf win + makes P0.4 obsolete on the article side.

---

*Generated from the May 2026 baseline audit. See `docs/baseline/` for all the evidence behind every item above.*
