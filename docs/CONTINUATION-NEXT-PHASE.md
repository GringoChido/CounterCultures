# Counter Cultures — Continuation Brief: Next Phase of the Build

_Created 2026-05-26. Hand-off from the 2026-05-25 build sprint. **Start a NEW Cowork task with this doc.**_

## How to start the new Cowork session
Kick it off with:

> "Read AGENTS.md and MASTER-PLAN.md (especially §0, §1.5, §6 Week-2 status + Week-3, §8, §10 PM-2..PM-10), plus docs/CONTINUATION-NEXT-PHASE.md. Then continue the build from where Week 2 left off."

## Where we are (2026-05-26)
- **Launch: Mon Jul 6. Hand-off to Roger's team: Jul 7.** (One-day gap — no buffer; see §1.5/D-1.)
- **Staging** = `countercultures.netlify.app` (NOT live). **Production** is still Squarespace; cutover domain is **`https://www.countercultures.com.mx`**.
- The 05-25 sprint shipped + pushed (**`df92f56`**, Netlify deploy GREEN/verified) **6 fixes**: canonical domain (`ed0d5f3`), base-URL unify (`ff477bb`), dashboard-honesty (`7c8c964`), security-hardening (`15c31f5`), mobile catalog grid (`c8e28dd`), design-refresh Phase 1 / homepage hub (`348db3f`).
- Full forensic State of the Union = MASTER-PLAN **§1.5**; per-commit detail = **§10 PM-2..PM-10**; Week-2 status = **§6**.

## How we work (the loop — keep doing this)
1. Pick the next item from MASTER-PLAN **§6**.
2. Cowork (assistant) crafts a **surgical `docs/fixes/*.md` prompt** — scope, files, acceptance, verification, §0 pre-flight + mandatory session-end report.
3. Joshua runs it in **Claude Code** — *one fix per session, fresh context, branch/commit per fix*.
4. Cowork **verifies the result against git + code** (never trust the report alone — this caught real misses: the static `robots.txt` shadow, the fabricated Overview KPIs, the dormant-drip activation), then **logs it in §10** and applies DELETE-WHEN-DONE.
5. Repeat.

**§0 is law:** nothing breaks · no overlap · no in-motion disruption · only enhance. Sacred Surface touches need Joshua's **recorded YES + before/after parity proof**. Smallest possible diff.

## Immediate next steps — the fork
**1. Design-direction decision (GATE).** Joshua looks at the warm live homepage (desktop + phone) and confirms the design-refresh direction.
- **Right →** run the design follow-on surfaces, one Claude Code session each, all inheriting `docs/design/DESIGN-PRINCIPLES.md` (driver: `docs/fixes/p1-design-refresh.md`): **catalog** (sequence AFTER the mobile grid — §0.5), **PDP** (#2), **brand/maker pages** (absorbs the old "Brand pages redesign").
- **Off →** revise `DESIGN-PRINCIPLES.md` + tokens BEFORE propagating to four more surfaces.

**2. Open decisions/actions (Joshua):**
- **Catalog-scope** (§8 #15): ship the ~4,236 merchandised SKUs as the real store, 354K as SEO long-tail (recommended). This frames the entire content pipeline.
- **Netlify env:** set `NEXT_PUBLIC_SITE_URL=https://www.countercultures.com.mx`, delete `NEXT_PUBLIC_BASE_URL`. (`WHATSAPP_APP_SECRET` waits for Meta; leave `NEXT_PUBLIC_ALLOW_INDEXING` unset so staging stays noindex.)
- Confirm staging warms to fast loads (PM-10 — cold-start, not a build problem).

**3. Doc-hygiene (§1.5/E):** apply E2–E6 corrections to §2/§0.4; re-run the §9 archive migration (root cruft: `FULL-PASS-AUDIT.md`, the "… 2.md" dupes, etc.); add `NEXT_PUBLIC_SITE_URL` + `NEXT_PUBLIC_ALLOW_INDEXING` to `.env.example` (handoff-doc gap); `rm docs/fixes/p1-dashboard-honesty.md`.

## The next MAJOR phase — Week 3: content pipeline (largest launch lever)
The catalog is placeholder data (every price `1.00`, `nameEn` == Spanish, ~0.3% descriptions / ~1.2% images at 354K). A store needs real content. Scope to the ~4,236 merchandised SKUs first (per the catalog-scope decision):
- **Squarespace scrape — resurrect + verify, then run** (`scripts/scrape/` 01→12): descriptions + images + spec-PDF URLs. Single biggest lever.
- **Cloudflare Images + R2 setup** (Joshua deferred ~2 weeks — **build the image-URL seam now** so the swap is config, not a rewrite) → **CDN image migration**.
- **SKU matching** (deterministic + `05b-llm-match.ts`).
- **AI descriptions, top SKUs** (Claude Sonnet) through the existing **review gate** (human approval is the only publish path; build-time blank-description guard already wired).
- **SEO technical pass** — titles, meta, canonicals (domain now correct), hreflang EN/ES, OG, sitemap index. (Canonical-domain fix was its prerequisite — done.)
- **Real prices:** fresh full `CC_Products_Full` sync from Odoo before launch (Q1).

## Workstream H — Handoff & Ownership (parallel, START NOW — §1.5/F)
The biggest July-7 risk. Non-code, Joshua-owned:
- **H1 (longest pole):** move the CRM Sheet + Brand Kit off the **personal `jsemolik@gmail.com`** into a `@countercultures.com.mx` Shared Drive; resolve the GCP-project mismatch (`.env.example` → `counter-portal-493716`; setup docs → `gen-lang-client-0620971024`); rotate the service-account key; hand Roger the customer-OAuth client.
- **H2:** credential/account inventory (Netlify, Resend, Stripe, Meta, Cloudflare, registrar, Sentry, GCP) — owner + payer + key-rotation for each.
- **H3–H5:** ops runbook · "when it breaks" guide + name a post-handoff technical owner · the staging→prod env cutover switch.

## Open watch-items / not-yet-done (from §1.5/D)
- **Money-path never tested end-to-end** — Stripe access is granted; set `STRIPE_WEBHOOK_SECRET` (self-serve, P0.2), then run a real order → payment → factura and confirm Dashboard → Integration Health shows Stripe CONNECTED.
- **Meta-activation prereq:** when WhatsApp goes live (~2 wks), `WHATSAPP_APP_SECRET` MUST be set in Netlify first, or the now-fail-closed inbound webhook rejects leads.
- **Lead Engine core (Wk 3–4):** pipeline-ize the 6 funnels + the unified "Needs Outreach" dashboard queue + auto-responders. **Drop-a-Spec still silently drops leads.**
- **Drive dashboard "Failed to load"** (P1.15) — still unfixed.
- **Marketing layer (Wk 5):** email campaigns (Klaviyo = NO → default descope/transactional-only on Resend), Social Hub (demo mode), WhatsApp outbound — all gated on Meta + decisions.

## Cutover — Week 7 (Jun 30 – Jul 6), see §7
First-time production-DNS event, the day before hand-off. **Rehearse it** (real money-path dry run, tested rollback, the env flip) — don't just plan it. Anything that would push launch >1 week needs Roger sign-off.

---
_Operating doc: MASTER-PLAN.md (§0 is law). Update §1 + §6 + §10 there first when status changes._
