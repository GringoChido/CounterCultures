# Surgical Rules — DO NOT BREAK WHAT WORKS

> Mandatory reading at the start of every Claude Code session.
> Last updated: 2026-05-15

> "Things that are built right now CAN NOT be broken or disrupted. The goal is to ENHANCE and make smoother. Make processes that all work together and smoothly." — Joshua, 2026-05-15

This file is loaded automatically via `AGENTS.md`. Every code change must respect these rules.

---

## 🛡️ Sacred Surface — must keep working through every change

These ship and work today. Any session that touches their files MUST preserve current behavior. Form can change; behavior cannot. If a change would alter the behavior of a Sacred Surface item, **STOP and ask Joshua first.**

1. **Cart + checkout** — multi-project store, cart store, IVA breakout (Subtotal / IVA 16% / Total), shipping method picker, trade code, oversized freight flow, Stripe redirect, branded Stripe Checkout, cart-share email (RF-6)
2. **PDPs (354K SKUs)** — slug routing, bilingual EN/ES, ISR, JSON-LD, search palette navigation, related products grid, trade-price rendering, "Add to Project" CTA, finish picker, qty selector, "Precio neto · IVA al finalizar" caption (RF-3)
3. **Trade pricing engine** — `app/lib/trade-pricing.ts`, tier-aware lookup with `default` fallback, Stripe charges using trade price (a22a561), PDP price display
4. **Customer accounts** — NextAuth magic-link, Google OAuth, `STAGING_EMAIL_REDIRECT` rewrite to admin@ (Customers sheet keeps original email), customer session JWT carrying `isTrade`/`tradeTier`
5. **Email infrastructure** — Resend sandbox, `app/lib/email.ts` patched, all `ALERT_TEMPLATES`, branded layouts
6. **Tax rate registry** — `TaxRates` sheet, per-line picker, replaces hardcoded 16% (P1.18)
7. **Search palette (cmd-K)** — MiniSearch brands+articles (~50KB index), server product search with debounce, quick-add CTAs (RF-7), request coalescing via `productReqRef`
8. **Catalog SWR cache** — `products-full.ts` module-scope cache, stale-while-revalidate, TTL + in-flight coalescing, `byBrand` Map
9. **Slug pipeline** — canonical `toSlug` (NFD-aware), CRM product fallback in PDP, PDP smoke tests
10. **WhatsApp inbound** — webhook → auto-lead, Conversation_Log, status transitions, marketing opt-in (RF-5)
11. **Admin break-glass** — admin@/roger@/control@ never locked out, structured auth rejection logging
12. **CFDI early-prompt + tax-rate-aware factura flow** (PR #63)
13. **Sheet write hardening** — header-keyed writes, auth gates, R2 audit concurrency fixes

---

## Operating rules (apply to every session, every commit)

1. **Read the file fully before editing.** Line numbers in `SESSIONS.md` are from the 2026-05-15 audit — verify before touching. If shifted, find the actual location.
2. **Smallest possible diff.** No drive-by refactors. If you spot something else broken, write it at the bottom of your final report — don't fix it.
3. **Additive when possible.** Add new functions/props alongside old ones; flip callers over once both work. Only delete after the new path is verified in dev + staging.
4. **Before/after verification — mandatory.** Every session must:
   - Capture current behavior (screenshot, curl, log line, or counted query)
   - Ship the change
   - Re-capture the same evidence and confirm parity-or-better
   - Document both in the final report
5. **Run the build between tasks.** If a task introduces an error, fix that task before the next.
6. **Bilingual parity.** Every user-visible string change happens in both EN and ES.
7. **One commit per logical change.** Never squash multi-fix batches. Easier to revert one piece if a regression surfaces later.
8. **No env-var renames without an alias.** Keep the old name working in parallel for one session, with a TODO to remove.
9. **If a change would alter the behavior of a Sacred Surface item, STOP and ask Joshua first.** Frame the change, explain why, get a yes.
10. **Final report mandatory.** Each session ends with: what shipped, what was measured, what was deliberately left out, any new follow-ups discovered.
11. **No new dependencies without justification.** New npm packages need a one-sentence reason and a check that nothing existing covers it.
12. **Smoke loop after risky sessions.** Run cart → PDP → cmd-K search → checkout → trade login → factura request. Twenty seconds. Catches 90% of regressions.

---

## Risk register — sessions that touch hot surfaces

- **A1, A5 (Search hot path)** — Must not regress cmd-K palette, cart quick-add, PDP related products, or brand/SKU search. Verification: manual cmd-K trace of "kohler", "grifo", a brand, a partial SKU before merging. Compare result counts and top-10 results before and after.
- **A2 (ProductVisual replacement)** — Must not break PDP hero, related products grid, catalog cards, search palette product results. Verification: load one example of each surface before/after; check for visible regressions or layout shift.
- **A6, F1 (Multi-fix batches)** — Risk multiplies with batch size. Commit and verify each FIX-N independently; if any FIX-N fails verification, revert that one and continue. Don't squash the batch.
- **D1, D3, D8 (Code deletions)** — Highest-risk category. After each deletion: `npm run build` + `npm run lint` + 20-second smoke loop. If anything imports the deleted file (even one import) defer the delete to a follow-up.
- **B3, C5 (Sheet schema changes)** — Add columns at the end of the row. Run on a branch with the catalog cache TTL temporarily set to 60s; verify catalog still loads with the new columns; only then merge. Never reorder columns of `CC_Products_Full` — `products-full.ts` reads by index.
- **A3, E6 (Cron additions)** — Confirm they don't fire alongside existing crons in a way that doubles work. Use idempotency keys. Probe-key gated.
- **F4 (Search platform migration)** — Largest blast radius of any pending session. Don't start until A1–A7 metrics prove it's still needed. If you do, ship behind a feature flag.

---

## Final report template (every session ends with this)

```
## Session <ID> — <Name> — Final Report

**Shipped:**
- <bullet list of commits with hashes>

**Sacred Surface items touched:** <list, or "none">

**Before/after evidence:**
- <screenshot, curl output, timing measurement, etc.>
- <screenshot, curl output, timing measurement, etc.>

**Smoke loop result:** <cart → PDP → search → checkout → trade login → factura request — pass/fail per step>

**Deliberately left out:** <anything intentionally out of scope>

**New follow-ups discovered (NOT fixed this session):**
- <item — write it down so Joshua can decide whether to add it to SESSIONS.md>

**Build status:** `npm run build` <pass/fail>, `npm run lint` <pass/fail>
```
