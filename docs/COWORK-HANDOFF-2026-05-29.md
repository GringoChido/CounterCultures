Continue the Counter Cultures build. Read these first, in order:

1. `docs/Catalog-content-plan-2026-05-28.md` (v5) — the active plan and only source of truth. Replaces the older STATE-OF-THE-UNION and LEAN-ON-ODOO-PLAN.
2. `AGENTS.md` — rules, the people (Roger, Antonina, sales = Javier + Ian), and staging-vs-production.
3. `docs/fixes/env-vars-required.md` — env vars Joshua needs to set in the Netlify UI.
4. `docs/Roger-reply-direction-2026-05-28.md` — the in-flight reply to Roger; he has not yet confirmed the direction.
5. `MASTER-PLAN.md` §10 — full forensic history if you need to look something up.

One-line context: Counter Cultures storefront, soft-launch scope (browse + request a quote, no live card checkout on day one). The Odoo-centric direction is awaiting Roger's written confirmation. The storefront crash that has dominated the last 48 hours is fixed and live as of merge `a32a85f` (Netlify deploy `6a19241299f07c0008033d3f`, ready 2026-05-29T05:31:43Z).

---

PHASE 0 — finish closing yesterday before opening today

Three small items first. Do them in this order before any new build work.

0.1 Confirm the storefront fix is holding in production.
   Pull the Netlify Edge Function log via the dashboard (UI, not CLI — the CLI token does not have function-log scope). Look for any `[Next.js Middleware Handler] Error: ... AbortError` lines AFTER the published-at timestamp `2026-05-29T05:31:43Z`. If zero, the fix is holding. If any, capture the new line and stop — that becomes the next P0.

0.2 Draft a short, dignified message to Roger confirming the crash is fixed.
   The last he heard from Joshua on the crash thread was that the fix was not yet deployed. The message should be:
   - Three to five sentences, no more.
   - Specific: name the URL he was hitting (`?q=toto`) and confirm it now returns a working page.
   - Honest: note that cold first paint can still be slow (10–20 s on a stone-cold function) but that the crash is gone. Slow is not the same as crashing.
   - No requests, no asks, no scope reopen. Just a status confirmation.
   - Save as `docs/Roger-crash-resolved-2026-05-29.md`.
   - Do not send. Joshua sends.

0.3 Walk Joshua through setting `STRIPE_WEBHOOK_SECRET` in the Netlify UI.
   Procedure is in `docs/fixes/env-vars-required.md`. Five-minute job. Without it, every Stripe webhook returns 503 and payments succeed at Stripe with no record on our side. This is STATE-OF-THE-UNION blocker B2 and it must be cleared before any real money is processed. Verify by re-pulling the function log; the warning `[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set` should stop appearing within a webhook cycle.

After 0.1, 0.2, 0.3 are done, move to Phase 1.

---

PHASE 1 — Week 1 build, per v5 plan

The plan commits only to Week 1. Six POCs and three independent fixes, in parallel where possible.

Independent fixes (each its own surgical Claude Code fix file, one per session, smallest possible diff):
- L1: `git rm public/robots.txt`. Trivial. Verify dynamic `app/robots.ts` returns noindex on staging.
- L2: fix the five hardcoded `noreply@countercultures.com.mx` senders (file:line list in v5 §2). Pattern matches the env-based sender in `app/lib/email.ts`.
- L3: wire AI descriptions into the PDP resolver. Add step 2.5 to `app/lib/pdp-description.ts` reading `Product_Descriptions` with `status=approved`. Add a pinned test.

POCs (each with explicit acceptance criteria in v5 §4; each is one to two days of focused work):
- POC-A: AI description batch loop on 10 SKUs across 3 brands.
- POC-B: Squarespace scrape pipeline against 5 known live URLs.
- POC-C: Odoo → CC_Products_Full sync mechanism on 50 products.
- POC-D: 301 redirect mapping for SEO equity (the broader Squarespace map; today's netlify.toml redirects only cover non-localed prefixes).
- POC-E (Phase 2 derisk, can run in parallel): PAC sandbox emit of 1 test factura.
- POC-F (Phase 2 derisk, can run in parallel): Cart → Odoo dry run on 1 test cart.

Rule: nothing past Week 1 gets scheduled in this doc until POC outcomes return. If a POC fails or takes longer than 2 days, stop and replan that workstream before scaling work commits to it.

---

PHASE 2 — Eventually, not now

- L5: cold-start hydration optimization. The fix shipped 2026-05-28 contains the slowness so middleware no longer crashes waiting for it, but cold-start first paint is 10–20 s. Options ranked by surgical-ness: (a) ship a precomputed JSON catalog snapshot with the function bundle so cold hydration is fast; (b) precompute common-token shortlists; (c) move to a real search index. Pick after Phase 1 ships; not a blocker.
- The cart → Odoo bridge wiring (Phase 2 P1).
- The CFDI emission via real PAC (Phase 2 P2).

---

How we work (the build loop, condensed)
- Pick the next item.
- Write a surgical `docs/fixes/*.md` prompt (the bulletproof scaffolding established 2026-05-28: pre-flight, sacred surface, files in scope, acceptance, verification, stop conditions).
- Joshua runs it in Claude Code, one fix per session, fresh context per session, branch + commit.
- Cowork verifies against code + git, runs vitest + tsc + build, and logs the milestone in `MASTER-PLAN.md` §10.
- Repeat.

Sacred Surface rule applies to every change. The 13 systems are listed in `MASTER-PLAN.md` §2 and `AGENTS.md`. Touching one needs Joshua's explicit YES and before / after parity proof.

Working note: Joshua's edits are final. Keep his wording exactly. Only flag outright typos. Never re-add removed content.

Strategic open thread: Roger's direction confirmation. The current draft reply lays out the technical case, the metrics receipts, and the "this might not be a match" boundary. Until he confirms the Odoo-centric direction in writing, Phase 1 work can continue (it is on the website side which both directions need) but Phase 2 commitments wait.
