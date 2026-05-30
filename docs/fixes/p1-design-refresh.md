# Fix: design-refresh pass — PHASE 1 (foundation + homepage hub) (Week-2 Anchor 2)

> **Source:** MASTER-PLAN.md §6 Week-2 NEW ANCHOR 2 (Joshua, 2026-05-25); absorbs the "Brand pages redesign" (§6 net-new C3).
> **Sacred Surface: #1 (cart) / #2 (PDP) / #7 (search) — VISUAL ONLY, prove behavior parity.** **§0 YES recorded: Joshua, 2026-05-25.**
> **Risk: MEDIUM** (broad visual surface) — contained by: token-driven, no behavior change, **one surface per session.**
> **⚠️ THIS IS PHASE 1 ONLY** — the foundation (design principles + token set) + the **homepage hub** as the reference implementation. **Catalog, PDP, and brand/maker pages are FOLLOW-ON sessions** (one surface each) so no session exceeds one logical change (§0.6). **Sequencing (§0.5):** the catalog-polish follow-on must run AFTER the mobile-grid fix — both touch `catalog-view.tsx`. Phase 1 here touches the homepage hub, NOT catalog, so it's safe to run right after the mobile-grid fix.

## The concern
As features piled on, the visual design went flat — inconsistent spacing, weak hierarchy, little depth. Establish a cohesive, premium look matching the luxury positioning — **without changing behavior.**

## §0 pre-flight
```
[ ] Read AGENTS.md, docs/SURGICAL-RULES.md, MASTER-PLAN §0 / §1.5 / §2 (#1,#2,#7) / §6 Week-2 Anchor 2
[ ] Confirm §0 YES (Joshua, 2026-05-25)
[ ] READ THE EXISTING TOKEN SYSTEM FIRST — app/globals.css + the Tailwind config + where brand-copper / brand-linen / dash-border are defined. EXTEND it; never replace or fork it.
[ ] Capture before-state screenshots of the homepage hub (EN + ES, desktop + phone)
```

## Scope — PHASE 1
**IN:**
1. **Design principles doc** — write `docs/design/DESIGN-PRINCIPLES.md` (~1 page): the shared rules the follow-on surface sessions will apply — type scale, spacing rhythm, elevation/shadow treatment, border treatment, section-background usage, icon usage (Lucide/Phosphor). This is the contract.
2. **Token set** — add a small, named set of tokens that **EXTEND** the existing system (no raw hex): a spacing scale, 2–3 elevation/shadow tokens, a border-treatment token, a type scale. Define them where the existing tokens live (globals.css / Tailwind config).
3. **Apply to the homepage hub ONLY** (highest-traffic, most-visible surface): consistent spacing rhythm, tightened hierarchy, subtle depth (elevation/layering on the buyer-hub cards + the section bands), using `brand-copper` / `brand-linen` / `dash-border` + Lucide/Phosphor icons. **No raw hex.**

**OUT (explicitly — these are FOLLOW-ON sessions, NOT this one):**
- Catalog (must run AFTER the mobile-grid fix — §0.5), PDP (#2), brand/maker pages (absorbs C3). List them as follow-ups; do NOT touch here.
- Any behavior / logic / data change. Add-to-Cart, quote/checkout, search, links, hub `?src=` tags, WhatsApp float — all untouched.
- **§0.6:** if Phase 1 grows beyond the foundation + the homepage hub, ABORT and split.

## Guardrails
- Visual only. Prove parity on every Sacred-Surface element present on the homepage: the catalog search input still submits to `/shop/catalog?q=`; hub tiles still carry `?src=hub_*`; the WhatsApp float is untouched.
- EN/ES parity held. Tokens only — no raw hex anywhere.

## Acceptance
- `docs/design/DESIGN-PRINCIPLES.md` exists (the contract for the follow-on surfaces).
- New tokens defined alongside the existing system; **`grep` for raw hex in the touched files → none introduced.**
- Homepage hub visibly tighter + more premium (depth on cards + bands, consistent spacing/hierarchy) — before/after screenshots EN+ES, desktop+phone.
- Hub behavior identical (tile links, `?src=` tags, search submit, WhatsApp float).
- `tsc`/`lint`/`build` green; EN/ES parity.

## Follow-on sessions (one surface each, AFTER this — keep this fix-file as their driver)
- **Catalog** (run AFTER the mobile-grid fix — §0.5) · **PDP** (Sacred Surface #2) · **brand/maker pages** (absorbs C3). Each: apply the DESIGN-PRINCIPLES tokens, prove behavior parity, capture before/after screenshots.

## Commit + DELETE-WHEN-DONE
- One commit (the principles doc + token defs + homepage-hub files). **Do NOT delete this fix-file** — it drives the follow-on surface sessions; instead note remaining surfaces in §6 (or here). Exclude MASTER-PLAN/cruft. No push. Report the sha.

## Session-end report (§0.7)
Use the template, plus:
`**§0 compliance:** Sacred Surface #1/#2/#7 — visual-only, parity proven on the homepage (cart/search/links unchanged); §0 YES recorded (2026-05-25); before/after EN+ES screenshots; tokens only (no raw hex). C1/C2/C4 met.`
