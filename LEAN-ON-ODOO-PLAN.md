# Counter Cultures — LEAN-ON-ODOO PLAN

> **⚠️ SUPERSEDED 2026-05-26 — the single active plan is now [`STATE-OF-THE-UNION.md`](STATE-OF-THE-UNION.md).** That doc absorbed this plan's active-plan role after a deep code-verified audit. Work off STATE-OF-THE-UNION.md. This file is retained for reference (its tracks/decisions are folded into the new doc); nothing is lost.

> **This is THE one plan — work off this file.** `MASTER-PLAN.md` is now the **archive**: it holds the full milestone history (§10), the Sacred Surface detail (§2), and the cutover plan (§7). **Nothing is lost** — the essentials are condensed into §0 below and the milestones are summarized in §9.
>
> **Guiding principle (2026-05-26): SIMPLIFY. Lean on Odoo.** Less custom code, not more. If Odoo already does it, use Odoo. The portal exists to make people *faster*, not to re-implement an ERP.
>
> **Launch: Mon Jul 6. Handoff to Roger's team: Tue Jul 7.**

---

## 0. How we work (the rules — condensed; full detail in the archive)

**The build loop:** pick the next item → CoWork writes a surgical `docs/fixes/*.md` prompt → Joshua runs it in Claude Code (one fix per session, fresh context, branch + commit) → CoWork verifies against code + git and logs the milestone → repeat.

**The four conditions — every change must satisfy all:** (C1) no regression on a protected system · (C2) no overlap / don't rebuild what already exists · (C3) don't disrupt an in-motion process · (C4) only enhance. **Smallest possible diff.**

**Sacred Surface** = the 13 systems that must not break (cart/checkout, PDPs, customer accounts, email infra, search, catalog cache, slug pipeline, WhatsApp inbound, admin break-glass, factura, sheet writes, tax/IVA, trade-pricing). Touching one needs **Joshua's explicit YES + before/after parity proof.** Full list + files: archive §2.

---

## 1. The model (one frame)

**Odoo is the system of record for every transaction** — quotes, POs, customers, vendors, invoices, inventory, accounting. We do **not** rebuild that. We ship **two products + one handoff:**

- **Track A — Customer Storefront** → the public e-commerce site, `www.countercultures.com.mx`. *This is the July 6 launch.*
- **Track B — Staff Portal** → a fast **dashboard / read layer over Odoo**, with **"Open in Odoo"** deep-links for anything that creates or edits.
- **Workstream H — Handoff & Ownership** → so July 7 is a clean walk-away.

Rule of thumb for every new idea: *if it creates/edits a transaction → it's Odoo. If it helps someone SEE or DECIDE faster → it's the portal. If it's the customer's experience → it's the storefront.*

---

## 2. Where we are (2026-05-26)

- **Shipped + pushed (`origin/main` @ `4913184`):** the storefront foundation (hub/nav/search/PDP/i18n/cold-start/canonical-domain), the dashboard-honesty + security fixes, and **Roger's quote cluster** — line items render (`e1f9e03`), create/edit pivoted to Odoo (`84eb9a9`), customer-page 500 fixed (`4913184`). Awaiting the Netlify deploy + slug check.
- **Storefront gap:** content. Catalog is placeholder (prices, ~0% EN/descriptions/images at 354K scale). Real merchandised catalog ≈ **4,236 SKUs**.
- **Portal:** now a read+deep-link layer; needs the usefulness pass (§4) + visual redesign.
- **Locked:** domain = `www.countercultures.com.mx`; Klaviyo = NO; Meta + Cloudflare ≈ 2 weeks out.

**🔴 Immediate next + open threads (2026-05-26):**
- **BEFORE sending Roger the test note: fix the Odoo-login experience.** Clicking "New Quote/PO/Customer" deep-links to Odoo; when the browser isn't signed in, it lands on Odoo's *unbranded* generic login ("YourLogo"). For people WITH Odoo it's a **one-time login per browser** (session persists), not every click. Smooth it: (a) brand the Odoo login, (b) enable "Sign in with Google" in Odoo for `@countercultures.com.mx`, (c) confirm a signed-in user goes straight to the new-quote form (also confirms the `/odoo/sales/new` slug). **These are Odoo-admin + Google-Cloud config, NOT portal code** — guide Joshua; don't enter passwords or reconfigure the production ERP blind.
- **❓ OPEN — does the sales team (Javier, Ian) have Odoo seats?** If NOT, "New Quote → Odoo" is a locked door for them. Options: give them seats, OR a lean portal quote screen that writes to Odoo via the shared **service account** (no Odoo login needed). Decision pending (Joshua + Roger).
- **❓ OPEN (deeper) — do we even need most of the staff dashboard?** Most screens (orders/invoices/payments/AR-AP/pipeline/reporting) duplicate Odoo for people who have Odoo. The portal's irreplaceable value = the storefront + leads/WhatsApp + access for non-Odoo people + maybe one overview. Resolving this could shrink Track B a lot (the SIMPLIFY goal). Decided by: who has Odoo + what non-Odoo people must do.
- **Roger test note** is saved at `docs/Roger-update-note.md` — send it **after** the Odoo-login fix.

---

## 3. TRACK A — Customer Storefront (THE launch)

What makes July 6 a real store, in dependency order:

| # | Item | Notes |
|---|---|---|
| **A1** | **Catalog content** *(biggest lever)* — real **prices** (fresh Odoo sync), **EN names + descriptions + images** for the ~4,236 merchandised SKUs first; long-tail behind graceful fallbacks. | Squarespace scrape (resurrect `scripts/scrape/`), AI descriptions via the **review gate**, CDN images when Cloudflare lands (~2wk). Gated on the **catalog-scope decision** (§7). |
| **A2** | **SEO / AEO** — technical (hreflang EN/ES, sitemap index, OG, canonicals ✅ domain fixed), on-page (alt text at scale, internal linking), **301 redirect map** (for cutover), AEO basics (`llms.txt`, FAQ blocks). | Canonical-domain fix already cleared the prerequisite. |
| **A3** | **Website redesign** *(Joshua leads the visuals)* — continue the design-refresh: **catalog → PDP → brand/maker pages** inherit `docs/design/DESIGN-PRINCIPLES.md`. Homepage (Phase 1) shipped. | Each surface = one session; visual-only, parity-proven. Roger's "redesign" ask lives here. |
| **A4** | **Marketing channels** *(gated)* — email (Klaviyo = NO → decide replacement/descope, §7), social (out of demo when Meta lands), WhatsApp outbound (Meta ~2wk). | Don't build ahead of the approvals; build the seams. |
| **A5** | **Lead capture + outreach** — the homepage funnels capture server-side, source-tag, alert the team, and surface in **one "Needs Outreach" queue** in the portal. | Leads stay **portal-owned** (they're pre-Odoo). When a lead becomes a deal, the deal is created in **Odoo**. |

---

## 4. TRACK B — Staff Portal: the usefulness pass (Claude leads "what")

**Principle:** the portal is the **fast daily cockpit** — the handful of things staff glance at constantly, faster and cleaner than Odoo — plus **"Open in Odoo"** for the deep work. Anything that only *duplicates* Odoo without being faster, or is fabricated/demo/gated, gets cut or deferred. *(Joshua leads the **visual** redesign of the kept surfaces when we reach them.)*

My call on the ~60 current routes:

**KEEP + SHARPEN — the cockpit (this is the portal's reason to exist):**
- `overview` — the morning glance (cash, sales, pipeline, what needs attention). Make it genuinely the homepage of the workday.
- `orders` + `orders/[id]` + `orders/[id]/preview` + `quotes/[dealId]/print` — the sales pipeline read + quote PDF (now line-items-correct).
- `customers` + `customers/[id]` — the customer **360** (history, AR, aging). High value; sharpen.
- `leads` + the new **Needs-Outreach queue** — the top of the funnel; portal-owned.
- `accounts-receivable` + `accounts-payable` + `invoices` + `payments` — **Antonina's daily finance read.** Keep sharp.
- `reports` + `reports/pnl` — reporting is core dashboard value.
- `pipeline` (read), `vendors`/`vendors/[id]`, `purchases`/`[id]`/`print`, `shipments`/`[id]` — useful read surfaces.
- `search` (⌘K), `settings` + `settings/users` + `settings/tax-rates`, `odoo` (the bridge/health page), `stripe`/`notifications`.

**DEEP-LINK TO ODOO — show a read summary + "Open in Odoo" (don't rebuild):**
- All create/edit (done). Plus the deep transaction surfaces: `products`, `inventory`, full accounting, `contacts` create/edit. Portal shows the summary; Odoo does the work.

**CUT or DEFER (not useful now / post-launch):**
- `email-campaigns` (Klaviyo = NO; sample data) · `social` (demo mode) · `marketing-analytics` / `website-analytics` / `sales-analytics` (no real source — keep honest "data pending", or hide until wired) · `content-calendar` / `blog-manager` (only if actually used) · `customs` (pedimento — deferred decision) · `trade-program` admin (trade quoting is manual+Odoo now — re-evaluate) · `design` (dev artifact) · `weekly-review` / `inbox` (evaluate — fold into overview?).
- `drive` + its 5 sub-routes — heavy, and one is the broken "Failed to load." **Decision:** keep only what's needed for daily ops (likely attachments-on-record, which Odoo handles), fix or cut the rest.

**Deliverable I'll produce next:** a per-route keep/sharpen/cut spec → becomes the portal-cleanup fix-file series.

---

## 5. WORKSTREAM H — Handoff & Ownership (parallel, start now)

(Carried from MASTER-PLAN §1.5/F — the biggest July-7 risk.)
- **H1 (longest pole):** move the CRM Sheet + Brand Kit off the personal `jsemolik@gmail.com` into a `@countercultures.com.mx` Shared Drive; resolve the two-GCP-project mismatch; rotate the service-account key; hand Roger the customer-OAuth client. **(Also: rotate the Odoo password — pasted in-thread.)**
- **H2:** credential/account inventory (Netlify, Resend, Stripe, Meta, Cloudflare, registrar, Sentry, GCP, **Odoo**) — owner + payer + key-rotation each.
- **H3:** ops runbook (weekly Odoo sync, pre-launch sync, deploy + the prebuild snapshot, cron health). **H4:** "when it breaks" guide + **name a post-handoff technical owner** (currently nobody). **H5:** the staging→prod env cutover switch.

---

## 6. Path to July 6 / handoff July 7

| When | Focus |
|---|---|
| **This week** | Scope decisions (catalog size, §7) · confirm Odoo slugs + set the **T&C in Odoo's quote template** · unblock gated deps (Meta, Cloudflare, email-tool decision) · I produce the **portal usefulness spec** (§4) · **start H1** (Google ownership). |
| **Content weeks** | **A1 content pipeline leads** (prices → EN/descriptions/images for the 4,236) · **A2 SEO technical**. |
| **Build weeks** | **A3 website redesign** follow-ons (catalog → PDP → brand pages) · **B portal cleanup** (the usefulness pass) · A2 on-page/301 map. |
| **Marketing weeks** | **A4/A5** as approvals land (email decision, social, WhatsApp outbound, lead outreach queue). |
| **Week 7 (Jun 30–Jul 6)** | **Cutover** (MASTER-PLAN §7): money-path dry run, monitoring, rollback, 301s, DNS, Resend prod-domain, launch. |
| **Throughout** | **Workstream H.** |

---

## 7. Open decisions

1. ✅ **Catalog scope — DECIDED (Joshua, 2026-05-26): ship the ~4,236 merchandised SKUs as the real store** (real price / EN / descriptions / images), 354K as SEO long-tail. This is the target for all of A1.
2. ⏸ **Email tool — PAUSED (Joshua, 2026-05-26).** Klaviyo is OUT; the replacement decision (descope / Resend-native / another ESP) is on hold and **NOT blocking** — A4 email work waits on it.
3. *(Resolved: domain = `www.countercultures.com.mx`; Meta + Cloudflare ≈ 2 weeks; T&C text canonical in `docs/CC-STANDARD-QUOTE-TERMS.md`.)*

---

## 8. What this plan DROPS (no longer in scope — superseded by lean-on-Odoo)

- The from-scratch portal **transaction builders** (New Quote/PO/Customer/Vendor) — pivoted to Odoo deep-links.
- Portal-side **T&C / product-image / attachment** fixes — Odoo's job now (T&C → Odoo quote template).
- **Lead-Engine "pipeline-ize in the portal"** — leads stay portal-capture; deals are created in **Odoo**.
- **Trade Phase 2** as a portal build — trade quoting is manual + Odoo; re-evaluate only if a clear portal need remains.
- **Fabricated dashboard analytics** — already neutralized; the unwired analytics pages get honest empty states or get cut (§4).

---

## 9. Milestones shipped (the effort so far — full forensic log in archive §10)

- **Storefront foundation:** buyer-hub + simplified nav, unified search, canonical 354K PDPs, i18n, cold-start snapshot, **canonical domain fixed** (`www.countercultures.com.mx`), base-URL unified.
- **Dashboard honesty + security:** fabricated analytics replaced with honest states; `follow-up-drip` cron + WhatsApp-webhook auth hardened; finance leads-access gap fixed.
- **Roger's quote cluster (2026-05-26) — shipped, pushed, deployed green:** quote line items render with correct totals (`e1f9e03`); **create/edit pivoted to Odoo** (`84eb9a9`); customer-page 500 fixed (`4913184`).
- **The pivot:** lean on Odoo — Odoo owns transactions; the portal is a dashboard/read layer + "Open in Odoo".
- Full per-step history (PM-1 … PM-18) + the forensic State of the Union live in `MASTER-PLAN.md` (§10 + §1.5).

---
*Status changes: log the archive (`MASTER-PLAN.md` §10), then update this file's §3 / §4 / §6 / §9.*
