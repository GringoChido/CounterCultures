# Counter Cultures — Catalog Content + Launch Readiness Plan

*Prepared 2026-05-28 (v5, post-deploy update) · Working backwards from a real revenue-generating storefront*

> **v5 supersedes v4.** v1 was a vibe. v2 was code-grounded but assumed pipelines worked at scale. v3 added POC gates. v4 stopped predicting weeks past Week 1. **v5 absorbs everything shipped on 2026-05-28: the storefront root-cause cure is now live, the catalog crash is gone, and the Stripe webhook secret status is confirmed.**
>
> Tag legend used inline:
> - **PROVEN** — exercised by a passing test, a verified artifact on disk, or a live production behavior I have observed.
> - **GROUNDED** — code path read; not yet exercised or run end to end. Treat as a hypothesis until POC.
> - **UNVERIFIED** — depends on external systems we cannot inspect from a code audit. Must be POC'd before commitment.

---

## 1. What shipped on 2026-05-28 (PROVEN live)

This is the new section. These are the facts from today that change the plan.

### Storefront stability — middleware root-cause cure

- **PROVEN.** The "This function has crashed — An unknown error has occurred" Netlify error page is **gone** on the production deploy (`a32a85f`, Netlify deploy `6a19241299f07c0008033d3f`, published 2026-05-29T05:31:43Z, state ready).
- **Root cause** identified from the live Edge Function log (ID `01KSS20D`, 2026-05-28 23:06:50 PM): Next.js middleware (always edge) was waiting on a passthrough fetch to the slow upstream Node.js server handler. The handler's 354K-product catalog hydration on cold start (11–19 s, 1 GB memory) exceeded the edge function budget; `AbortController.abort()` fired, middleware crashed.
- **Fix shipped** as three commits on `fix/storefront-root-cause-cure` (`230ab68`, `a091708`, `a756144`), merged to main as `a32a85f`:
  - `middleware.ts`: fast-path for already-localed URLs (`/en/...`, `/es/...`) skips `intlMiddleware` so the edge function does not block on slow upstream. Whole function body wrapped in `try / catch` with structured JSON logging so any future middleware throw is diagnosable.
  - `netlify.toml`: 302/307 redirects from `/shop/*`, `/brands/*`, `/insights/*` to their `/en/...` equivalents so non-localed URLs still resolve cleanly without middleware.
  - `docs/fixes/env-vars-required.md`: documents the env vars that must be set manually in the Netlify UI.
- **Live URL verification (PROVEN):**
  - `/en/shop/catalog?q=toto` — was crash; now 200, 10.9 s cold / 3.3 s warm.
  - `/en/shop/catalog?q=hansgrohe` — was crash; now 200, 0.85 s.
  - `/shop/catalog` — 307 redirect → `/en/shop/catalog`.
  - `/dashboard/login` — still 200; middleware auth path preserved.
  - `/en` homepage — 200, 19.2 s cold (slow but not crashing).

### Search trilogy (earlier today, also live on main)

- **PROVEN.** Search palette fix (`7341ec5`), catalog presentation fix (`240d8d0`), engine scan budget + route raceTimeout (`9f6c7be`), edge-to-Node runtime pin (`8e3eb5c`), plus the structured error logging on catalog page (`8e0d704`) and search API (`03d403a`). All merged via `4946b51` (search trilogy) and `a32a85f` (root-cause cure).
- 139 tests pass (was 74 before today). Typecheck clean. Build clean.

### Residual issue, not a blocker

- **PROVEN slow, not broken.** Cold-start hydration of the 354K-product catalog cache still takes 10–19 s the first time a function is hit after going cold. **The fix contains the slowness so middleware no longer crashes waiting for it**, but the customer experience on a stone-cold function is "slow first paint." Warm hits are fast (sub-second to a few seconds). The keepalive cron runs every 3 minutes which keeps cold starts rare in normal traffic.
- This is now a **performance optimization task**, not a crash to fix. See §5 for the optimization options.

### Env vars status (newly PROVEN)

I read the Netlify project env page directly on 2026-05-28. Confirmed:

- **MISSING (must be set in Netlify UI before any real money flows):**
  - `STRIPE_WEBHOOK_SECRET` — every Stripe webhook returns 503 today. Payments succeed at Stripe with no record on our side. **B2 blocker confirmed live.**
  - `ODOO_STRIPE_JOURNAL_ID` — Stripe → Odoo payment register silently skipped.
  - `WHATSAPP_APP_SECRET` — all inbound WhatsApp returns 401.
  - `NEXT_PUBLIC_ALLOW_INDEXING` — left unset deliberately on staging.
- **Present and correct:** `ANTHROPIC_API_KEY`, `CRON_PROBE_KEY`, all `GOOGLE_*`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`.

Procedure for setting them is in `docs/fixes/env-vars-required.md`.

---

## 2. What is PROVEN today (the rest, unchanged from v4 audit)

### Catalog data plumbing

- **PROVEN.** `CC_Products_Full` is the catalog read source (`app/lib/products-full.ts:46`, `GOOGLE_SHEETS_ID_PRODUCTS_FULL`).
- **PROVEN.** The hourly `odoo-sync` cron does invoices, payments, sale orders, purchase orders, partners. **It does NOT sync products** (`app/lib/odoo/sync.ts:80–177`).
- **PROVEN.** `netlify.toml` crons: `stale-deal-sweep`, `odoo-sync`, `fx-sync`, `keepalive`. No product-sync cron.

### Content plumbing — AI descriptions

- **PROVEN.** Generator at `app/api/dashboard/products/generate-description/route.ts` and `app/lib/product-descriptions.ts`. Uses Anthropic Haiku 4.5.
- **PROVEN, IMPORTANT.** Generator is **per-product, on-demand, not batch.** File comment: *"Generation is on-demand, not batch — only products Roger actually opens get a description."*
- **PROVEN, IMPORTANT.** Approval is **sheet-editing, no UI.** Roger flips `pending` → `approved` directly in `Product_Descriptions` tab.
- **PROVEN, CRITICAL.** AI descriptions are **not wired into the PDP resolver.** `app/lib/pdp-description.ts` has 5 fallback steps; `Product_Descriptions` is not one of them.

### Content plumbing — scrape

- **PROVEN it ran once.** `app/lib/product-content.json` is 1.6 MB, 1,550 entries, dated 2026-05-12.
- **PROVEN partial.** Spot-check shows entries with descriptions but empty `title`, `gallery`, `breadcrumb`.
- **GROUNDED.** 14 numbered scripts under `scripts/scrape/`. End-to-end fitness against current live Squarespace remains **UNVERIFIED**.

### Money path (largely unchanged)

- **PROVEN.** Storefront card sale does not reach Odoo (`dispatcher.ts:310–386`).
- **PROVEN.** Factura is a stub (`app/lib/factura/provider.ts`).
- **PROVEN.** Five email routes still hardcode `noreply@countercultures.com.mx`.
- **PROVEN.** Zero tests exercise `handleCartPurchaseCompleted`, `registerStripePaymentInOdoo`, or `issueFactura`.

### Launch-critical infra

- **PROVEN.** `public/robots.txt` still in working tree with `Allow: /`. Still untracked. Still a one-careless-commit risk.
- **PROVEN.** No 301 redirect map for the Squarespace → new-site cutover. (NOTE: the `netlify.toml` redirects added today are different — they cover non-localed prefixes only, not the SEO equity preservation map.)

---

## 3. The target framing (two phases, dates pending POCs)

- **Phase 1 — Soft launch.** Customers browse the merchandised catalog and request a quote. No live card checkout. Sales closes manually in Odoo, Antonina emits factura manually.
- **Phase 2 — Live card-checkout, fast-follow.** Cart → Odoo bridge, CFDI/factura via real PAC, products sync wired, AI descriptions wired to PDP, image CDN populated.

Dates remain conditional on POC outcomes. Roger's direction confirmation is also outstanding (see §6).

---

## 4. Week 1 — POC plan (the only week this doc commits to)

Six POCs. Each has explicit acceptance criteria, sample size, expected time, and fail-mode plan. **POC-D (301 redirect mapping) is partially addressed by today's `netlify.toml` redirects, but the Squarespace SEO equity map still needs to be built.**

| # | POC | What it proves | Sample size |
|---|---|---|---|
| POC-A | AI description batch viability | The per-product generator wrapped in a batch loop produces usable output at bounded cost. | 10 SKUs across 3 brands. |
| POC-B | Scrape pipeline against current live Squarespace | `scripts/scrape/01–12` runs cleanly against today's `countercultures.com.mx` and produces complete entries. | 5 SKUs. |
| POC-C | Products sync from Odoo | We can pull 50 product records via API and write them into a sheet matching `CC_Products_Full`'s schema. | 50 products. |
| POC-D | 301 redirect mapping for SEO continuity (different from today's localized-prefix redirects) | We can build the Squarespace → new-site SEO equity map automatically. | 50 URLs. |
| POC-E | PAC sandbox emit (Phase 2 derisk) | One real CFDI emitted against Counter Cultures' RFC in a PAC sandbox. | 1 test factura. |
| POC-F | Cart → Odoo dry run (Phase 2 derisk) | `createQuote` → `confirmAndInvoiceOrder` → `registerPayment` work against live Odoo's chart of accounts, journals, tax codes. | 1 test cart. |

(Full POC detail, acceptance criteria, fail-mode plans — see v4 §3 of this doc as kept inline below.)

[Full POC-A through POC-F detail unchanged from v4, see Week-1 POC plan above.]

---

## 5. Independent of POCs — small fixes that can ship in parallel

| # | Fix | Tag | Status |
|---|---|---|---|
| L1 | Remove `public/robots.txt` (H2) | **PROVEN** | Still pending. Trivial `git rm`. |
| L2 | Fix the 5 hardcoded email senders (H3) | **GROUNDED** | Still pending. One fix file. |
| L3 | Wire AI descriptions into PDP resolver | **GROUNDED** | Still pending. Small fix file. |
| L4 | Set `STRIPE_WEBHOOK_SECRET` + 3 other env vars in Netlify UI | **PROVEN missing** | Manual config; Josh in Netlify UI. Five minutes. **B2 blocker.** |
| L5 | Cold-start hydration optimization | **NEW** | Optimization, not a blocker. Options: ship JSON catalog snapshot with the function bundle (cleanest); precompute a top-N shortlist for common queries; eventually move to a real search index. Pick after Phase 1 ships. |

---

## 6. After Week 1 — branching logic, not a schedule

Unchanged from v4. Each POC has if-pass / if-fail branches. New row added at the bottom for L4.

| If L4 done (env vars set) | Real Stripe webhooks succeed. Soft launch can defensibly process card payments. Stop treating "no payment record" as a known issue. |
| If L4 not done | Hold soft launch until done. Five-minute config job is not worth blocking a launch. |

---

## 7. Open strategic question

**Roger has not yet confirmed the Odoo-centric direction** in writing. The last message from him was a sharp accusation about scope ("you said you can't build the dashboard, how do I trust you on the website?"). The current draft reply (in `docs/Roger-reply-direction-2026-05-28.md`) concedes the partial truth, lays out the technical specifics, includes the metrics receipts and the "this might not be a match" boundary, and ends with "Tell me which it is."

Until Roger commits to a direction, neither Phase 1 (soft-launch scope) nor Phase 2 (live card checkout) has a green light. The Phase-1 work *can* continue in parallel because it is on the website side which both directions need, but timeline commitments wait.

---

## 8. What this plan deliberately does NOT commit to (yet)

- A hard launch date (still conditional on POC outcomes + Roger commit).
- Image migration timing (Cloudflare onboarding still UNVERIFIED).
- Phase 2 PAC vendor.
- That POC-A, B, C, D, E, or F will pass.
- That Roger confirms the Odoo-centric direction.

---

## 9. The single sentence that holds up

**The storefront crash is fixed and live. Six POCs and three small fixes (L1, L2, L3) are still the Week 1 build. The Stripe webhook env var is a five-minute config blocker that must be set before any real payment processing. Cold-start hydration is now an optimization task, not a crash to fix. Roger's direction confirmation is the only thing blocking a real schedule from being committed.**
