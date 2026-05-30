# Counter Cultures — STATE OF THE UNION

> **This is THE single source of truth. Work off this file.**
> It supersedes `LEAN-ON-ODOO-PLAN.md` (now a pointer) and absorbs its active-plan role.
> `MASTER-PLAN.md` remains the **archive** (full milestone history §10, Sacred Surface §2, cutover §7).
>
> **Launch (customer storefront): Mon Jul 6, 2026. Handoff to Roger's team: Tue Jul 7, 2026.**
> **Guiding principle: SIMPLIFY. Lean on Odoo. Keep the client + make the dashboard earn its place. Less custom code, not more.**
>
> Authored 2026-05-26 from a deep, code-verified audit (six parallel deep-dives + manual verification of the highest-stakes findings). Evidence is cited as `file:line` so future sessions don't re-litigate. Items I could not verify from the repo are marked **⚠️ UNVERIFIED** and listed in §11.

---

## 0. How we work (the rules — condensed; full detail in `MASTER-PLAN.md` §0/§2)

**The build loop:** pick the next item → Cowork writes a surgical `docs/fixes/*.md` prompt → Joshua runs it in Claude Code (one fix per session, fresh context, branch + commit) → Cowork verifies against code + git and logs the milestone in `MASTER-PLAN.md` §10 → repeat. Cowork writes docs/specs; app-code changes go through the loop.

**The four conditions — every change must satisfy all:** (C1) no regression on a protected system · (C2) no overlap / don't rebuild what exists · (C3) don't disrupt an in-motion process · (C4) only enhance. **Smallest possible diff.**

**Sacred Surface** = the 13 systems that must not break (cart/checkout, PDPs, customer accounts, email infra, search, catalog cache, slug pipeline, WhatsApp inbound, admin break-glass, factura, sheet writes, tax/IVA, trade-pricing). Touching one needs **Joshua's explicit YES + before/after parity proof.**

**Working note:** Joshua's edits are final — keep his wording, only flag outright typos, never re-add removed content.

---

## 1. The end state — what "100% functioning" means on July 7 (thinking backwards)

The system is a well-oiled machine Roger's team runs without Joshua. Each touchpoint, defined by its done-state:

| # | Touchpoint | "100% functioning" = |
|---|---|---|
| 1 | **Website (storefront)** | A real bilingual store: correct prices, English + Spanish names/descriptions and images on the merchandised catalog, fast, indexable on the prod domain with 301s from the old Squarespace URLs, redesigned catalog/PDP/brand surfaces. A customer can find a product and either **buy it or request a quote** without a dead end. |
| 2 | **Dashboard (staff portal)** | A lean daily cockpit that is *faster than Odoo* for the handful of things staff glance at (overview, leads, customers 360, AR/AP, P&L, pipeline, customs/traffic, inbox), with **"Open in Odoo"** for everything transactional. No demo screens, no fabricated data, no dead routes. |
| 3 | **Odoo** | The confirmed system of record. Every quote/PO/customer/invoice/payment lives in Odoo; the portal reads it and deep-links into it on verified slugs. Sales (Javier/Ian) can actually create quotes. The hourly sync is healthy. The quote T&C template is set in Odoo. |
| 4 | **Google Drive** | Brand assets, deal attachments and price lists live in a **`@countercultures.com.mx` Shared Drive** (not a personal account). The Drive screen loads. Ownership is transferable. |
| 5 | **Marketing** | Honest surfaces only: real lead capture + a clear outreach queue, WhatsApp inbound live. Social/analytics either wired to a real source or hidden — nothing fabricated. Gated channels (Meta, paid) have their seams built, not fake data. |
| 6 | **Email** | Transactional email sends reliably from a **verified production domain** (order/quote/lead/notification). No route silently fails. Marketing-email scope is decided (currently: transactional-only on Resend). |

Plus the non-negotiable spine: **the money path is wired end-to-end and rehearsed**, **credentials/ownership are transferred**, and **a named technical owner exists** for after July 7.

---

## 2. Scorecard (where we are today, code-verified)

| Touchpoint | Readiness | Launch-critical gap |
|---|---|---|
| 1. Website | 🟡 ~55% | Prices ⚠️UNVERIFIED (possible $1 placeholders); images ~1–2% of full catalog; **no 301 redirect map**; catalog/PDP/brand redesign not done; latent `robots.txt` regression |
| 2. Dashboard | 🟢 ~80% | Honesty already restored; remaining is the **simplify pass** (cut ~6 dead routes, deep-link ~3, sharpen the cockpit) |
| 3. Odoo | 🟡 ~60% | **Cart sales never reach Odoo** (rule-21 contradiction); deep-link slugs unverified; **sales seats unknown**; admin lockout; T&C template not set |
| 4. Google Drive | 🟡 ~50% | CRM Sheet ownership conflict (personal vs Shared Drive); `/dashboard/drive` "Failed to load"; 3-way GCP project mismatch |
| 5. Marketing | 🟢 ~75% | Leads + WhatsApp-in real; just hide/cut demo surfaces; no dedicated outreach queue yet |
| 6. Email | 🟡 ~65% | Transactional core solid, but **5 routes hardcode an unverified prod sender → send fails in sandbox** (quote-by-email broken now); prod-domain verification deferred to cutover |
| Spine | 🔴 | Money path doesn't touch Odoo; env landmines; no money-path tests; unrehearsed cutover; **no named post-handoff owner** |

---

## 3. The critical path — blockers, ranked

These are the things that, left alone, mean July 6/7 is *not* a working product. Each has an owner-action.

### 🔴 BLOCKERS (must resolve before the relevant go-live)

**B1 — Decide the July 6 commerce model, then make the money path match it.**
Today a storefront card sale runs `handleCartPurchaseCompleted` (`dispatcher.ts:310–386`): it flips `Cart_Sessions` to paid, appends a `Deal_Payments` row, fires the rule engine — and **never creates an Odoo SO, invoice, or payment.** The Stripe→Odoo bridge (`registerStripePaymentInOdoo`, `dispatcher.ts:152–208`) only fires when `pi.metadata.odoo_invoice_id` exists, i.e. for *portal-initiated* deal payments against an already-existing Odoo invoice. So a customer can pay by card and Odoo — your system of record — has no order, no invoice, no payment, no factura. This directly contradicts `CART-RULES.md:40` (rule 21) **and** the lean-on-Odoo strategy. → **Joshua decision required (see §6, Decision A).** If card checkout is live at launch, the cart→Odoo chain (`createQuote → confirmAndInvoiceOrder → registerPayment`, all of which already exist in `app/lib/odoo/write.ts`) must be wired and tested first. If launch is browse + quote/deposit, card checkout is disabled and this drops to a fast-follow.

**B2 — Set the production env vars, or subsystems silently die at cutover.** Each of these breaks a different thing if missed:
- `STRIPE_WEBHOOK_SECRET` unset → webhook 503s every event; **no payment recorded anywhere** (`p0-stripe-webhook-secret.md`, still PENDING).
- `ODOO_STRIPE_JOURNAL_ID` unset → Stripe→Odoo payment register silently skipped (`dispatcher.ts:159–168`).
- `WHATSAPP_APP_SECRET` unset → **all** inbound WhatsApp returns 401 (fail-closed, `app/api/webhooks/whatsapp/route.ts:~189`).
- `NEXT_PUBLIC_ALLOW_INDEXING` controls whether the site is indexable at all.
There is **no single cutover switch** (MASTER-PLAN H5). → Build one checklist; verify in Week 7.

**B3 — Name a post-handoff technical owner.** Joshua walks away July 7; Roger's team is sales + finance, not engineers. If a cron stalls or a deploy fails, today nobody owns it. **Bus factor = 1.** → Flag to Roger now; this is a people decision, not code.

**B4 — Get the catalog to "a real store."** ⚠️ The single biggest unverified question: are `CC_Products_Full` prices real, or still `1.00` placeholders? The code masks sub-threshold prices everywhere (`> 10`/`> 1` guards in `pdp-client.tsx:417`, `catalog-view.tsx:1019`, JSON-LD) — so if prices are placeholders, most SKUs render **no price and no Add-to-Cart**, i.e. not a store. Must be verified before any launch decision. (See §6, Decision E.)

### 🟠 HIGH (fix this week)

**H1 — CRM Sheet ownership.** The master CRM Google Sheet (70+ tabs, every route/cron/webhook reads it) is reported to live in **personal `jsemolik@gmail.com` My Drive** (`baseline/06-data-quality.md`), though `AGENTS.md:25` claims it was moved to the Shared Drive after P0.5. **Conflicting — needs a live Drive metadata check.** If still personal, it's the largest business-continuity risk in the project.

**H2 — The latent `robots.txt` regression.** An untracked `public/robots.txt` (`Allow: /`) has reappeared. It would shadow the dynamic `app/robots.ts` (which correctly returns full `disallow: /` noindex on staging). It's currently untracked → not deployed — but the moment anyone runs `git add -A`, staging (or prod) becomes crawlable. → `git rm`/delete it now so it can't sneak in. (Commit `ed0d5f3` already deleted it once.)

**H3 — Quote-by-email is broken in sandbox.** Five routes hardcode `noreply@countercultures.com.mx` (the *unverified* prod domain) and skip the staging redirect, so Resend rejects them today: `send-quote/route.ts:14`, `shop/request-quote/route.ts:38`, `invoices/[id]/notify-ups/route.ts:20`, `traficos/[id]/send-to-broker/route.ts:69`, `share/route.ts:17`. → Switch them to the env sender (`RESEND_FROM_TRANSACTIONAL`) + `redirectRecipient`, like `email.ts` already does. Most launch-relevant: **send-quote**.

**H4 — No Squarespace→new-site 301 redirect map.** No `_redirects`, no `netlify.toml [[redirects]]`. A DNS cutover with zero redirects drops all existing SEO equity and breaks every inbound deep link. → Build the map during content weeks; deploy at cutover.

**H5 — Credential ownership + rotation (Workstream H).** See §8. Highlights: 3-way GCP project mismatch; customer-OAuth client/secret held by Joshua; Odoo password pasted in-thread (unrotated); ownership/payer for Netlify/Resend/Stripe/Meta/Cloudflare/registrar/Sentry undocumented.

### 🟡 MEDIUM (before handoff, not before launch)

- **M1 — Zero automated tests on the money/Odoo/auth path.** 8 suites / 74 tests exist (UI, search, slug, SAT fields, shipping) — none exercise `handleCartPurchaseCompleted`, the Stripe→Odoo register, webhook signature/idempotency, or the rule-engine cart transition. The one path that moves money is the least tested.
- **M2 — `follow-up-drip` is dormant** (no `netlify.toml` schedule). The CART-RULES drip cadence will never fire post-handoff unless someone wires it. → Ship it or document as deferred.
- **M3 — Repo hygiene = handoff risk.** The active plan (`LEAN-ON-ODOO-PLAN.md`, soon this file), `MASTER-PLAN.md` edits, and recent context are **untracked/uncommitted**; root has 50+ stale `PROMPT-*`/`CLAUDE-CODE-*` docs + duplicate `… 2.md` files + `docs/superpowers/`. Handing off `origin/main` today gives Roger's team neither the plan nor the context. → Commit the plan docs; sweep the cruft.
- **M4 — Factura/CFDI on Stripe orders is unbuilt** (`p1-factura-stripe-bridge.md` PENDING; `factura-queue.ts` not built). FINANCE-RULES rule 1 still says facturas auto-emit on Santander deposits only. → Confirm July 6 facturas are **manual** (Antonina in Odoo) and say so; don't ship docs implying automation that isn't there.

---

## 4. Touchpoint deep dives

### 4.1 Website / Storefront (Track A — the launch)

**Real:** PDP routes exist and render (`app/[locale]/shop/[category]/p/[slug]/page.tsx`, ISR 1800s, JSON-LD); search hardened (AND-semantics, no shared CDN cache); i18n EN/ES (~85%, 127 keys in sync); cold-start improved (~8.8s→2.5s) with a `*/3` keepalive cron; SEO foundation solid (`seo.ts` canonical `www.countercultures.com.mx`, hreflang, sitemap top-5000, flag-gated indexing).

**Partial/Missing:** **Content is the lever.** `product-content.json` = ~1,550 entries; ~1,001 have descriptions (337 human-approved, 570 AI), 907 bilingual — that's ~24% of the 4,236 merchandised set, ~0.3% of the 354K long-tail. Images: 4,236 thumbnails (1.2% of full catalog), only 96 galleries, 468 spec PDFs. **Redesign:** homepage refreshed (`348db3f`); catalog/PDP/brand pages still on the old flat design (0 `cc-lift`/`cc-card` tokens). **Prices: ⚠️UNVERIFIED** (B4). **No 301 map** (H4). **Latent robots.txt** (H2).

**Do:** verify prices → finalize the 4,236 as the launchable store (354K = SEO long-tail with graceful fallbacks) → fill EN/ES descriptions via the review gate → images as Cloudflare lands (~2wk) → redesign catalog → PDP → brand pages (one surface per session, parity-proven) → SEO on-page + 301 map.

### 4.2 Dashboard / Staff Portal (Track B — make it efficient)

Honesty + security already shipped (fabricated analytics gone; trade-program and sales-analytics now real; cron/webhook auth hardened). The remaining work is **one simplify pass.** Disposition of the ~60 routes:

**KEEP + SHARPEN — the cockpit (faster than Odoo, the reason the portal exists):**
`overview`, `leads`, `customers`(+`[id]`), `contacts`(+`[id]`), `orders`(+`[id]`/`preview`), `quotes/[dealId]/print`, `invoices`(+`[id]`), `payments`(+`[id]`), `accounts-receivable`, `accounts-payable`, `reports`/`reports/pnl`, `pipeline`(+`deals/[dealId]`), `inventory`, `products`, `purchases`(+`[id]`/`print`), `vendors`(+`[id]`), `shipments`(+`[id]`), **`customs`** (pedimento/traffic — Odoo doesn't do this), **`inbox`** (Gmail — genuinely additive), `settings`(+`tax-rates`/`users`), `stripe`, `finance/cash-bucket` (owner-gated), `trade-program` (now real), `this-week`.

**DEEP-LINK TO ODOO — show a read summary + "Open in Odoo":**
`orders/new` + `purchases/new` (already pure redirects — the pivot held), the `odoo` bridge page (banner says "Retiring" — replace with deep-links once data migrated), and `finance` (legacy CRM-Payments ledger that duplicates `/payments` — the dual-ledger to consolidate).

**CUT or DEFER (dead weight / demo / unwired):**
- **CUT:** `website-analytics` (silent redirect), `content-calendar` (silent redirect), `social` (explicit "Demo Mode", no Meta API), `design` (dev preview), `marketing-analytics` (GA4 never wired — honest-empty placeholders).
- **DEFER (Joshua's keep/cut):** `email-campaigns` (sheet-backed but no ESP — implies sending that can't happen → **hide for the demo**), `blog-manager` (real CRUD, demo view-counts), `whatsapp` ("Soon" badge), `weekly-review` (fold into overview?). Drive: keep one entry, demote the 5 sub-routes.

→ Deliverable: a single `docs/fixes/p1-dashboard-simplify.md` (a refined version exists at `p1-dashboard-simplify-phase1.md`) executing the cuts + nav trim. Joshua leads the *visual* redesign of the kept surfaces later.

> **Note the agents corrected stale docs:** `baseline/04-dashboard-state.md` and the simplify-phase1 file describe worse fabrication than the current code (the "Elena Martinez" trade-program and "$2.42M" sales-analytics fabrications are already fixed). Trust the code.

### 4.3 Odoo (system of record)

**Read path:** hourly cron (`odoo-sync`, `0 * * * *`) drains Odoo→Sheets mirror tabs. Synced: `account.move` (invoices, incl. CFDI fields), `account.payment`, `sale.order` (**header only**), `purchase.order`. **Not synced:** `sale.order.line` (live-read on demand, `client.ts:205`, `e1f9e03`), `product.*` (separate scrape pipeline), `res.partner` (no mirror — live API). The `write_date` cursor fix is in code (`sync.ts:128,150`) — ⚠️ verify the live Sheet header columns were actually migrated.

**Write path is mixed (a framing contradiction to clean up):** create/edit *mostly* deep-links into Odoo (`odoo-links.ts`, pattern `/odoo/{slug}/{id|new}`), but `app/lib/odoo/write.ts` still does server-side `createQuote`/`createCustomer`/`registerPayment`/`confirmAndInvoiceOrder` via the API key. The deep-link slugs are Odoo defaults and **⚠️ only `/odoo/settings/users` is confirmed** — the rest (`sales`, `purchase`, `accounting`, `contacts`, `inventory`) need a logged-in check (`odoo-links.ts:14–16`).

**Auth:** portal→Odoo via `ODOO_API_KEY` (`client.ts:74–90`), **not** a user password — so dashboard + sync are unaffected by the admin-login situation. Admin account = `roger@countercultures.com.mx`; Joshua is locked out (can't receive the reset email).

**Open threads (need decisions):** ⚠️ **Do Javier/Ian have Odoo seats?** If not, "New Quote → Odoo" is a locked door for sales (Decision C). Admin lockout blocks login branding, Google SSO, the slug check, and the T&C template (Decision via §6 + the separate Odoo-admin-access task).

**Finance:** AR/AP/invoices/payments = **REAL** (synced). IVA/tax = REAL (`Tax_Rates` + `sat-codes.ts`, 16% default). Factura/CFDI = **PARTIAL/STUB** (fields sync read-only; Stripe→factura bridge unbuilt — M4). Dual-payment reconciliation = **STUB**. Pedimento/customs = bespoke `Traficos` sheet (has `sample-customs-data.ts`), deferred.

### 4.4 Google Drive

Two clients, two auth models: the **service-account** client (`google-drive.ts`) reads/writes the CRM Shared Drive — powers Settings "CONNECTED", deal/email attachments, uploads — **works.** The **per-user OAuth** client (`google-drive-user.ts`) powers the `/dashboard/drive` UI off the *logged-in user's personal Drive* — and is the **"Failed to load"** culprit: the `drive.readonly` scope was bolted onto `GMAIL_SCOPES` (`gmail.ts:16–19`) *after* users connected Gmail, so their tokens lack the Drive scope → `getDriveClient()` returns null → 503/500. **Fix:** back "Recent files" with the service-account client (`p1-drive-page-fix.md`).

**Core risk:** the CRM Sheet ownership conflict (H1). Also the **3-way GCP project mismatch** (`counter-portal-493716` vs `counter-cultures-crm` vs `gen-lang-client-0620971024`) — nobody knows the canonical project, so keys can't be cleanly rotated/transferred.

### 4.5 Marketing

**Leads = REAL:** server-side capture (`leads/route.ts`, zod, formula-injection escaping, `manage_leads` gate, `Activity_Log`), source-tagged (`contact-form:${type}`, `hub_source`), alerts the team (`notifyRoger` + `notifyWhatsApp`). **Gap:** no dedicated "Needs Outreach" queue — the leads page uses a status filter (`new` = de-facto queue). Lead→deal creates a Pipeline deal (portal-owned, pre-Odoo). **WhatsApp inbound = REAL** (HMAC fail-closed; needs `WHATSAPP_APP_SECRET` — B2). **Outbound = GATED** on Meta (~2wk). **Social / marketing-analytics / sales-analytics / website-analytics** = honest-empty or labeled demo — **hide/cut for an honest launch** (§4.2). `email-campaigns` implies a sending ESP that doesn't exist → hide.

### 4.6 Email

**Transactional = REAL** (`email.ts`, env-driven, `STAGING_EMAIL_REDIRECT` allowlist, Sacred Surface #5). Working sends: contact/trade/newsletter/booking confirmations, trade welcome/decline, `notifyRoger`, `sendDocument`. **Sandbox mode** until prod-domain DNS verification at cutover. **Bug (H3):** 5 routes hardcode the unverified prod sender and skip the redirect → rejected in sandbox → **quote-by-email broken now.** **Marketing email:** Klaviyo is OUT; replacement **PAUSED, non-blocking** — launch is transactional-only on Resend.

---

## 5. Blind spots — the things you're not seeing

1. **Your "Odoo is the system of record" promise is false for card sales** (B1). This is the headline. Everything in the storefront funnels to a payment that Odoo never sees.
2. **Subsystems fail silently at cutover via missing env vars** (B2) — no single switch, and each missing var breaks a *different* thing with no loud error.
3. **There is no engineer after July 7** (B3). The most "running smooth" system still needs an owner when a cron stalls.
4. **You can't verify your own store is a store** without checking prices (B4) — and the code is designed to *hide* the symptom (no price shown), so a casual click-through looks fine while being empty.
5. **The cutover is a paper plan executed once, the day before you leave** (MASTER-PLAN line 230 admits it: "first-time, never-rehearsed… rollback plan still on paper").
6. **The money path has zero tests** (M1) — the riskiest code is the least guarded.
7. **Doc sprawl hides the real plan** (M3) — handing off `origin/main` today loses the active plan itself.
8. **The Drive screen being broken makes the whole portal look broken** to Roger on day one, even though it's just one OAuth-scope mismatch (4.4).
9. **Quote-by-email looks done but fails on send** (H3) — exactly the kind of thing that surfaces in front of a customer.

---

## 6. Open decisions that need Joshua (the forks — don't build past these)

| | Decision | Recommendation |
|---|---|---|
| **A** | **July 6 commerce model:** full live card checkout · quote/deposit-first · browse + leads only? | **Quote/deposit-first for July 6.** Given unverified prices + ~1–2% images, a full transactional checkout is risky anyway. Launch a polished browse + "request a quote"/deposit storefront; **gate live card checkout** until the cart→Odoo bridge (B1) is wired + tested. De-risks launch and is true to lean-on-Odoo. |
| **B** | **Wire cart→Odoo bridge** (rule 21) now or fast-follow? | Mandatory *before any live card sale*. Functions already exist in `odoo/write.ts`; it's a contained fix + tests. Sequence it right after the commerce-model call. |
| **C** | **Sales Odoo seats (Javier/Ian):** buy seats vs lean portal quote-create via the shared service account? | Confirm with Roger first. If seats are easy → seats (simplest, most "lean on Odoo"). If cost/friction → the service-account quote screen is the fallback so sales isn't locked out. |
| **D** | **Dashboard simplify:** approve the §4.2 cut/deep-link/keep plan? | Yes — execute as one fix-file. Biggest efficiency win with least risk. |
| **E** | **Catalog for launch:** confirm prices are real + the 4,236 is the store + image plan. | Verify prices immediately (I can probe staging if you paste a link, or via a Sheets connector). Lock 4,236 as the launchable set; images ride Cloudflare (~2wk). |
| **F** | **Handoff ownership:** name a technical owner; move CRM Sheet to Shared Drive; rotate Odoo pw + SA key; consolidate GCP; hand over OAuth secret. | Start now (longest pole). Naming the owner is a Roger conversation; the rest are guided config tasks. |
| **G** | **Email scope:** transactional-only on Resend for launch? | Yes (already the default). Fix the 5 hardcoded-sender routes (H3) regardless. |

---

## 7. The sequenced path — shortest credible route to Jul 6 / handoff Jul 7

| When | Focus |
|---|---|
| **Now (decisions)** | §6 A–G. Verify prices (B4). Confirm sales seats (C). Name the post-handoff owner (B3). Decide commerce model (A). |
| **This week** | Delete `robots.txt` (H2). Fix the 5 email senders (H3). Dashboard simplify pass (D). Drive-page service-account fix (4.4). Start Workstream H (H1 CRM Shared-Drive move, GCP consolidation, rotations). Commit the plan docs + cruft sweep (M3). Begin the Odoo-admin-access task (unblocks login branding, SSO, slug check, T&C template). |
| **Content weeks** | Catalog content pipeline: prices → EN/ES descriptions (review gate) → images (Cloudflare). SEO on-page + the **301 redirect map** (H4). |
| **Build weeks** | If card checkout is in scope: wire + test cart→Odoo (B1/M1). Redesign catalog → PDP → brand pages (one per session). |
| **Marketing weeks** | As Meta/Cloudflare land: WhatsApp outbound, social, image CDN. Lead "Needs Outreach" queue. |
| **Week 7 (Jun 30–Jul 6)** | **Cutover dry run** (money path + rollback drill), env-var checklist (B2), monitoring, DNS, Resend prod-domain, 301s, launch. |
| **Throughout** | Workstream H (ownership/handoff). |

---

## 8. Workstream H — Handoff & Ownership risk register

| Item | Current owner / location | Risk if unaddressed by Jul 7 | Action |
|---|---|---|---|
| CRM Sheet | ⚠️ personal `jsemolik@gmail.com`? (conflicts with AGENTS.md) | Whole CRM lost if account lapses | Verify; move to `@countercultures.com.mx` Shared Drive (file ID preserved) |
| GCP project / SA key | 3 conflicting project IDs | Keys can't be managed/rotated/transferred | Pick canonical project, rotate key, transfer ownership to Roger |
| Customer-OAuth client/secret | Held by Joshua | Customer sign-in breaks, can't reissue | Hand Roger the OAuth client + secret |
| Odoo | API key + **password pasted in-thread** | System-of-record creds leaked, unrotated; admin lockout | Rotate password; confirm subscription owner; create a dedicated admin user for Joshua; check Javier/Ian seats |
| Stripe | Roger "owns"; webhook secret unset | Money path dark | Grant team access; set `STRIPE_WEBHOOK_SECRET` |
| Resend | `RESEND_API_KEY` (sandbox) | Prod email never goes live | Verify prod domain at cutover; assign owner |
| Meta/WhatsApp | Pending Roger | Outbound never approved; inbound needs secret | Meta Business approval; set `WHATSAPP_APP_SECRET` |
| Netlify / Cloudflare / registrar / Sentry | Owner/payer undocumented | No one can deploy/pay/debug post-handoff | Inventory owner + payer + key-rotation each (H2) |
| **Post-handoff technical owner** | **Nobody** | Bus factor = 1 | **Name one — Roger conversation** |

---

## 9. What we are NOT doing (dropped scope — prevents unnecessary work)

- From-scratch portal **transaction builders** (New Quote/PO/Customer/Vendor) — pivoted to Odoo deep-links.
- Portal-side **T&C / product-image / attachment** fixes — Odoo's job (T&C → Odoo quote template).
- **Lead pipeline-ize in the portal** — leads stay portal-capture; deals are created in Odoo.
- **Trade Phase 2** as a portal build — manual + Odoo; re-evaluate only if a clear portal need remains.
- **Fabricated dashboard analytics** — neutralized; unwired pages get honest empty states or get cut.
- **Marketing-email tooling** — paused (transactional-only on Resend for launch).

---

## 10. Milestones shipped (forensic per-step log: `MASTER-PLAN.md` §10, PM-1…PM-21)

- **Storefront foundation:** buyer-hub + simplified nav, unified search (AND-semantics + relevance suite), canonical 354K PDPs, i18n, cold-start snapshot, **canonical domain** `www.countercultures.com.mx`, base-URL unified.
- **Dashboard honesty + security:** fabricated analytics → honest states; trade-program + sales-analytics de-fabricated; cron `CRON_PROBE_KEY` gate + WhatsApp HMAC fail-closed; finance leads-access gap fixed.
- **Roger's quote cluster (deployed green, `4913184`):** line items render (`e1f9e03`); create/edit pivoted to Odoo (`84eb9a9`); customer-page 500 fixed (`4913184`).
- **The pivot:** lean on Odoo — Odoo owns transactions; portal is a read/deep-link layer.
- **Odoo sync:** batched delta drain + `write_date` cursor (`86daa0e`, `6f15d35`).

---

## 11. Verification log (this session, 2026-05-26)

**Verified against code (file:line):** cart-purchase handler writes Sheets only, no Odoo (`dispatcher.ts:310–386`); Stripe→Odoo bridge is invoice-metadata-gated (`dispatcher.ts:152–208`); CART-RULES rule 21 requires the chain (`CART-RULES.md:40`); `public/robots.txt` = `Allow: /` vs `app/robots.ts` full-noindex; portal→Odoo via API key (`client.ts:74–90`); 5 hardcoded email senders (routes listed in H3); Odoo deep-link slugs unconfirmed except `settings/users` (`odoo-links.ts:14–16`); cron schedules (`netlify.toml`); ~74 tests, none on the money path.

**⚠️ UNVERIFIED — needs Joshua / live access (do not assume):**
1. **Live `CC_Products_Full` prices** (real vs $1) — the #1 launch question. Needs Sheets access or a staging probe (paste a staging link and I'll fetch it).
2. Whether the CRM Sheet is on personal Gmail or the Shared Drive (AGENTS.md vs baseline conflict).
3. Whether Javier/Ian hold Odoo seats.
4. Which GCP project is wired in Netlify prod; whether the SA key / Odoo password were rotated.
5. Whether `STRIPE_WEBHOOK_SECRET`, `ODOO_STRIPE_JOURNAL_ID`, `WHATSAPP_APP_SECRET`, `NEXT_PUBLIC_ALLOW_INDEXING`, `RESEND_API_KEY` are set in Netlify prod.
6. Whether the Odoo `write_date` cursor fix backfilled the live mirror columns.
7. The exact Odoo deep-link slugs (need a logged-in admin check).

---
*Status changes: log `MASTER-PLAN.md` §10 (archive), then update this file's §2 / §3 / §6 / §7.*
