# Week 6 — Shipments UI + Landed-Cost Calculator — Design Doc

> **Status:** Draft awaiting Joshua's approval (2026-04-19)
> **Workflow:** superpowers/Phase 1 design
> **Implements:** W6 of MASTER_BUILD_ROADMAP.md (lines 242-262)
> **Builds on:** W5 foundation (`docs/superpowers/specs/2026-04-18-week5-shipments-design.md`)

---

## 1. Context — what W5 shipped, what W6 adds

W5 scaffolded 5 new sheets (`Brand_NOM_Status`, `Brand_Lead_Times`, `HS_Code_Lookup`,
`FTA_Rates`, `Trafico_Events`) with headers but empty data rows; added typed read
helpers (`app/lib/shipments-reference.ts`); 4 GET reference routes; `Trafico_Events`
writer wired into Traficos POST/PUT auto-logging; Pipeline Customs tab on live data
(slim rendering). W5 left explicit W6 follow-ups: flat→rich Trafico hydrator,
`Trafico_Items` missing-header bug.

W6 ships:
- Flat→rich Trafico hydrator (closes W5 deferred item — Q3 = **full hydrator**)
- `/dashboard/shipments/[id]` Trafico detail view with Trafico_Events timeline + doc checklist + per-item landed cost + doc upload to Drive
- Bulk status update + live shipment risk flag (spec thresholds unchanged — Q5 = **(a)**)
- Pure landed-cost calculator module + API route
- Shared `<LandedCostCalculator>` component on 3 surfaces: Add-Lead (preview), Deal slideout (full), Pipeline card hover (read-only mini-summary) — Q2 = **(c) + (d)**
- Soft-fallback for missing reference data with populated `warnings[]` + yellow "estimate — unverified" banner — Q1 = **(b)**
- **Deferred to W6.5**: Quote PDF with landed-cost breakdown — Q4 = **(d)**. Browser print-to-PDF covers the interim; W7 pipeline automation is not blocked.

---

## 2. Decisions locked from Phase-1 Q&A

| # | Question | Answer |
|---|---|---|
| 1 | Reference data fallback | **(b)** soft-fallback with spec defaults + `warnings[]` + yellow "estimate — unverified" banner |
| 2 | Widget placement | **(c)** shared component + both surfaces (Add-Lead preview + Deal slideout full) + **(d)** Pipeline card hover mini-summary |
| 3 | Trafico hydrator scope | **(a)** full hydrator — powers detail view AND Pipeline Customs tab; fixes `Trafico_Items` missing-header bug in passing |
| 4 | Quote PDF | **(d)** defer to W6.5; browser print covers interim |
| 5 | Risk flag thresholds | **(a)** proposal as-is — two separate functions: `computeQuoteRisk()` (quote-time) + `computeShipmentRisk()` (live shipment, spec §risk_flag rules unchanged) |

---

## 3. Architectural decision surfaced during discovery

**`/dashboard/shipments` today reads the legacy flat `Shipments` sheet (15 cols,
per-vendor/per-PO rows). `/dashboard/customs` reads `Traficos` (41 cols, batch crossing
parent).** Per spec §0.5 Reality check, Traficos are canonical. Two interpretations of
the roadmap's "/dashboard/shipments/[id] detail view":

- **(a)** `[id]` = TRF_ID → Trafico detail view (matches spec canonical). ← **chosen**
- **(b)** `[id]` = Shipment_ID → legacy per-vendor flat detail view (doesn't match spec canonical).

**Going with (a).** The new detail view lives at `/dashboard/shipments/[id]` and is
powered by the hydrator. The existing `/dashboard/shipments` list page stays on the
legacy `Shipments` sheet — upgrading it to a Traficos-backed list is W7 scope (not a
W6 blocker). The `/dashboard/customs` Traficos list still exists and its rows deep-link
to the new `/dashboard/shipments/[id]` detail view.

If Joshua wants the list page upgraded in W6, that's ~2 extra tasks and I'll fold them
in. Flagging for explicit approval.

---

## 4. New code footprint

### 4.1 New libs (`app/lib/`)

| File | Purpose | New/Modified |
|---|---|---|
| `app/lib/trafico-hydrator.ts` | `hydrateTrafico(trfId)` — reads Traficos + Trafico_Items + Trafico_Events; parses `Calculo_Breakdown_JSON`, `Calculo_Payment_JSON`, `Truck_Payment_JSON`, `Status_History_JSON`, `Products_JSON`; reconstructs rich `Trafico` type from `app/lib/customs-data.ts`. Used by detail view, Pipeline Customs tab, landed-cost allocation. | New |
| `app/lib/landed-cost.ts` | Pure calculator. `computeLandedCost(input): LandedCostOutput`. Resolves FTA→MFN fallback, computes duty/IEPS/IVA/broker/pedimento/domestic, derives lead times, derives NOM compliance, returns `warnings[]` for any fallbacks used. Also exports `computeQuoteRisk(output)` and `computeShipmentRisk(trafico)` pure fns. | New |
| `app/lib/shipments-reference.ts` | Add helper `getReferenceSnapshot()` that reads all 4 reference sheets in parallel (one RPC batch) so the calculator doesn't fire 4 sequential Sheets reads per call. | Modified |

### 4.2 New API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/dashboard/traficos/[id]/rich` | GET | Returns hydrated `Trafico` shape |
| `/api/dashboard/landed-cost` | POST | Accepts `LandedCostInput`, returns `LandedCostOutput` |
| `/api/dashboard/shipments/[id]/docs` | POST | Upload doc to Drive, attach to Trafico (piggybacks existing `google-drive.ts`) |

### 4.3 New pages + components

| Path | Purpose |
|---|---|
| `app/(dashboard)/dashboard/(portal)/shipments/[id]/page.tsx` | Trafico detail view: header, status pill, timeline from Trafico_Events, item list, doc checklist (reuses `getDocumentChecklist`), calculo breakdown, landed-cost allocation per Deal, doc upload button |
| `app/(dashboard)/components/landed-cost-calculator.tsx` | Shared component; `variant: "preview" \| "full"`; accepts `defaultValues` for prefill |
| `app/(dashboard)/components/landed-cost-breakdown.tsx` | Read-only line-item breakdown table (reused by detail view for per-Deal allocation display) |
| `app/(dashboard)/components/landed-cost-summary-hover.tsx` | Pipeline card hover widget — read-only risk pill + total |

### 4.4 Modified surfaces

| File | Change |
|---|---|
| `app/(dashboard)/dashboard/(portal)/pipeline/page.tsx` | (1) Customs tab — replace slim rendering with rich hydrator call + items list + doc % + calculo. (2) Deal card hover — add `<LandedCostSummaryHover>` when deal has cached summary. (3) Deal slideout — add `<LandedCostCalculator variant="full">` tab. |
| `app/(dashboard)/components/lead-form.tsx` (or equivalent) | Inline `<LandedCostCalculator variant="preview">` when brand + product + FOB entered |
| `app/(dashboard)/dashboard/(portal)/shipments/page.tsx` | Add row link to `/shipments/[id]` (using `Shipment_ID` as [id] routes to legacy shape; TRF_ID routes to rich — both handled by same detail page via ID-prefix detection). **Decision: keep legacy list untouched; rely on `/dashboard/customs` for Trafico list navigation.** The detail route only handles TRF_IDs in W6; Shipment_ID → detail is W7+ when the list is migrated. |
| `app/lib/trafico-events.ts` | No change; writer already in place. |

### 4.5 One-shot fix script

| File | Purpose |
|---|---|
| `scripts/_fix-trafico-items-header.ts` | Same pattern as W5's `_fix-traficos-header.ts`; idempotent; seeds the 25-column header row if missing. |

### 4.6 Verification scripts

| File | Asserts |
|---|---|
| `scripts/_test-landed-cost.ts` | 7 deterministic assertions (see §5 below) |
| `scripts/_test-trafico-hydrator.ts` | Round-trip: create test Trafico + 2 items + event → hydrate → assert rich shape matches |
| `scripts/_test-shipment-detail-view.ts` (optional — browser verify may cover this) | Or — browser preview eval |

---

## 5. The calculator — deterministic test cases

The calculator is pure and deterministic. Tests run via `scripts/_test-landed-cost.ts`
(no Vitest in this repo — we use round-trip scripts + assertion blocks per W5 pattern).

| # | Case | Inputs | Expected |
|---|---|---|---|
| 1 | Spec worked example (Dornbracht DE / HS 7324.90 / 4×$812 USD / fx=20 / SMA warehouse) | See spec §Worked example line 467 | `landedCostMxn` within 1 MXN of spec's `100,022`; `dutyRate = 0.07`; `dutyRateBasis = "TLCUEM 7%"`; `riskFlag = "green"` (once NOM row populated) |
| 2 | USMCA / Kohler / US origin / HS 7324.10 | `{brandId:"kohler", fobPriceUsd:500, quantity:1, hsCode:"7324.10", ...}` | `dutyRate = 0.0`; `dutyRateBasis = "USMCA 0%"` |
| 3 | Empty `FTA_Rates` sheet | Same as #2 but with empty FTA table | `dutyRate = 0.10` (MFN fallback from `HS_Code_Lookup.default_duty_rate_mfn`); `warnings` includes `"Used MFN 10% — no FTA rate on file for US/7324.10"`; `riskFlag = "yellow"` |
| 4 | Empty `Brand_Lead_Times` sheet | Dornbracht input with empty `Brand_Lead_Times` | `leadTimeDays.total` uses spec Appendix fallback (28+22+3+2 = 55 days); `warnings` includes `"Used default lead times — Dornbracht not in Brand_Lead_Times"`; `riskFlag = "yellow"` |
| 5 | NOM `needs-cert` for brand × applicable NOM | Sun Valley Bronze with `Brand_NOM_Status` row status=`needs-cert` | `nomCompliance.status = "needs-cert"`; `riskFlag = "red"`; `warnings` includes the NOM code |
| 6 | NOM `partial` but SKU out-of-scope | Dornbracht partial (thermostats only), input SKU is a kitchen faucet | `nomCompliance.status = "needs-cert"` (partial → needs-cert when SKU not in `applies_to_skus`); `riskFlag = "red"` |
| 7 | NOM `in-progress` | Any brand × NOM `in-progress` | `nomCompliance.status = "in-progress"`; `riskFlag = "yellow"` |

### 5.1 `computeQuoteRisk()` logic (re-stated from Q5)

```
if nomCompliance.status in {"needs-cert", "blocked"}                          → red
elif warnings contains "partial NOM out-of-scope SKU"                          → red
elif warnings contains "MFN fallback (no FTA row)"                             → yellow
elif nomCompliance.status == "in-progress"                                     → yellow
elif warnings contains "default lead times (Brand_Lead_Times empty)"           → yellow
else                                                                            → green
```

### 5.2 `computeShipmentRisk(trafico)` logic (live shipment, per spec §risk_flag)

```
if nom_status == 'needs-cert' or 'blocked'                  → red
elif delay_days >= 7                                         → red
elif nom_status == 'in-progress' and days_to_eta < 14        → red
elif delay_days in [3..6]                                    → yellow
elif days_in_customs > 24h                                   → yellow
else                                                          → green
```

`delay_days` derived from `initiatedDate` or `calculoReceivedDate` depending on phase;
`days_in_customs` derived from status_history timestamps where status was a customs
phase (`awaiting-documents` through `crossing-approved`).

---

## 6. Hydrator — flat → rich mapping

`hydrateTrafico(trfId)` pseudocode:

```
1. readSheet<TraficoRecord>("Traficos") → find row by TRF_ID (or 404)
2. readSheet<TraficoItemRecord>("Trafico_Items") → filter TRF_ID === trfId
3. readSheet<TraficoEvent>("Trafico_Events") → filter trafico_id === trfId
4. For each TraficoItemRecord:
     - Parse Products_JSON → products[]
     - Map usmcaStatus (empty → "not-applicable")
     - Map spanishManualsRequired (string "true"/"false" → bool)
     - Map Spanish_Manual_Drive_IDs (pipe-separated → string[])
     - Return PedimentoItem
5. Parse Calculo_Breakdown_JSON → calculoBreakdown (optional)
6. Parse Calculo_Payment_JSON → calculoPayment (optional)
7. Parse Truck_Payment_JSON → truckFeePayment (optional)
8. Parse Status_History_JSON → statusHistory (fallback to Trafico_Events if empty)
9. Assemble rich Trafico object per customs-data.ts definition
10. Return { trafico, events }
```

JSON-parse failures → log + return empty array / undefined for that field. Never crash
the hydrator over malformed JSON. Same graceful-degradation philosophy as the calculator.

---

## 7. Task plan outline (14 tasks → ~9 commits, ~3-4h)

Written in detail in `docs/superpowers/specs/2026-04-19-week6-shipments-ui-plan.md`.
Summary:

| # | Task | Commit target |
|---|---|---|
| 1 | Baseline smoke — W5 tests pass, typecheck clean | — |
| 2 | Fix `Trafico_Items` missing-header bug (one-shot script) | `fix(sheets): Trafico_Items missing header row` |
| 3 | `trafico-hydrator.ts` lib — RED failing round-trip test → GREEN implement | — |
| 4 | `/api/dashboard/traficos/[id]/rich` route | Bundled with §3: `feat(shipments): flat→rich Trafico hydrator + /rich route` |
| 5 | Pipeline Customs tab upgraded to rich shape | `feat(pipeline): Customs tab renders rich Trafico shape` |
| 6 | `landed-cost.ts` pure module + 7 assertions in `_test-landed-cost.ts` — RED → GREEN | — |
| 7 | `/api/dashboard/landed-cost` route | Bundled with §6: `feat(shipments): landed-cost calculator core + API route` |
| 8 | `<LandedCostCalculator>` shared component (variants preview/full) | `feat(shipments): LandedCostCalculator component` |
| 9 | Deal slideout + Add-Lead form + Pipeline card hover integrations | `feat(pipeline): landed-cost on deal slideout + Add-Lead + card hover` |
| 10 | `/dashboard/shipments/[id]` detail view — page + timeline + doc checklist + upload | `feat(shipments): /dashboard/shipments/[id] Trafico detail view` |
| 11 | Doc upload route (`/api/dashboard/shipments/[id]/docs`) | Bundled with §10 |
| 12 | `computeShipmentRisk()` + bulk status update UI on list page | `feat(shipments): bulk status update + live shipment risk flag` |
| 13 | Final typecheck + smoke scripts + docs log | `docs(design): W6 execution log + final smoke` |

Target: ~9 commits. Conventional prefixes: `feat:` / `fix:` / `docs:`.

---

## 8. Out of scope for W6 (deferred)

| Item | Lands in |
|---|---|
| Quote PDF with landed-cost breakdown | W6.5 follow-up (Q4 = (d)) |
| Upgrading `/dashboard/shipments` list to Traficos-backed | W7 |
| Alert engine (R-*/F-*/C-* templates) | W8 (already in `email-templates.ts`) |
| Pipeline auto-stage rules keyed on Trafico status | W7 |
| Reference sheet inline-edit UI (write APIs) | If Roger/broker asks for it |
| Per-user actor on Trafico_Events | Phase 2 auth work |
| `USMCA_Certificates` + `Spanish_Manuals` sheet join (hydrator needs them only if Trafico_Items rows don't carry the Drive IDs inline; they do) | Not needed — W5 §8 over-scoped |

---

## 9. Risks / open items

| Risk | Mitigation |
|---|---|
| Reference sheets stay empty all of W6 → every quote shows yellow banner | Expected; Q1=(b) design accepts this. Roger/Joshua/broker populate on their own timeline; each populated row turns yellows → green incrementally without code changes. |
| Calculator output disagrees with broker by > 2% on real shipments | W6 day-5 spec item says "QA validates calculator within 2% of broker's manual calculation" — confirmation requires Joshua's broker spot-check. Can't be closed in-session. Flag as "W6 ship-but-pending broker validation." |
| Shipments list page routing — detail view only handles TRF_IDs in W6 | Accept. List page deep-links not wired in W6. `/dashboard/customs` already lists Traficos and can deep-link to the new detail page. |
| `Status_History_JSON` malformed on existing Trafico rows | Hydrator falls back to `Trafico_Events`. No crash. |
| `Calculo_Breakdown_JSON` empty for early-stage Traficos | Field is optional in rich shape. No crash. |

---

## 10. Self-review checklist (pre-plan)

- ✅ All 5 Q&A decisions reflected in design
- ✅ Spec coverage: §Part 3 calculator math, §NOM matrix, §lead-time table, §risk flag, §Worked example — all have test assertions or component ownership
- ✅ No placeholders in interfaces (LandedCostInput/Output are exact from spec §Part 3)
- ✅ W5 deferred items addressed: hydrator (task 3-4), Trafico_Items header bug (task 2)
- ✅ Reference data fallback strategy concrete: spec Appendix values used as defaults, warnings[] populated, yellow banner rendered
- ✅ Two risk functions disambiguated (quote vs. live shipment)
- ✅ No sample data — all surfaces sheet-backed
- ✅ TDD-shaped task plan forthcoming
- ⚠ Broker validation (spec day-5 item) can't close in-session — flagged as pending
- ⚠ List page → detail view routing left for W7 — explicit decision, not oversight

---

## 11. Approval request

Joshua, please approve or redirect on:

1. **Design doc as a whole** — OK to proceed to plan write?
2. **§3 architectural call** — keep `/dashboard/shipments` list page on legacy
   `Shipments` sheet for W6 (detail view handles TRF_IDs only, deep-linking lives on
   `/dashboard/customs` list); upgrade list page in W7. If you'd rather upgrade the
   list page in W6, I'll add 2 tasks (~30min).
3. **§7 task bundling** — comfortable with ~9 commits target (some tasks bundled)?
4. **§9 risks** — acknowledge broker validation is post-merge + deferred to a spot-
   check; OK that W6 "ships but pending validation"?

Once approved I'll write the detailed plan doc with step-level TDD tasks and wait for a
second approval before execution.

---

## 12. Execution log (2026-04-19, completed)

All 11 plan tasks shipped inline in one session. Tree at `9d6f12b`, **9 commits** ahead of `origin/main` (1 behind the previous design doc's `7adbbea`).

| # | Task | Commit |
|---|---|---|
| 1 | Fix `Trafico_Items` missing-header bug | [`114c909`](#) |
| 2-3 | Flat→rich Trafico hydrator + `/rich` route | [`cf6df62`](#) |
| 4 | Pipeline Customs tab — slim → rich rendering | [`908fc0c`](#) |
| 5-6 | Landed-cost calculator core + `/landed-cost` route | [`006aa5a`](#) |
| 7 | `<LandedCostCalculator>` shared component | [`218f653`](#) |
| 8 | Deal slideout + Add-Lead integrations (card hover folded into Task 10) | [`924b1a6`](#) |
| 9 | `/dashboard/shipments/[id]` detail view + docs upload route | [`9eaec02`](#) |
| 10 | Bulk status update + Pipeline card risk badge + new `/trafico-items` GET | [`9d6f12b`](#) |
| 11 | Final smoke + execution log (this commit) | TBD |

### Final smoke (2026-04-19)

```
✅ scripts/_test-shipments-sheets.ts        — 5 tabs present + correct headers
✅ scripts/_test-shipments-reference.ts     — 4 lib reads return arrays (still 0 rows in production)
✅ scripts/_test-trafico-events.ts          — append + read round-trip OK (3 total events)
✅ scripts/_test-trafico-hydrator.ts        — seed 1 trafico + 2 items → hydrate → 6 assertion groups
✅ scripts/_test-landed-cost.ts             — 31 assertions pass (7 calculator cases + 7 risk thresholds + sub-asserts)
✅ scripts/_test-reference-apis.ts          — 4 routes registered + auth-gated
✅ scripts/_test-rich-route.ts              — registered + auth-gated
✅ scripts/_test-landed-cost-route.ts       — registered + auth-gated
✅ npx tsc --noEmit                         — clean
```

Live happy paths verified via Claude Preview MCP eval against `:55556`:
- `/api/dashboard/traficos/<TRF_ID>/rich` → 200 with hydrated shape
- `/api/dashboard/landed-cost` POST (Dornbracht, $812×4) → $102,622 MXN landed (MFN fallback because production sheets empty), yellow pill, 3 warnings — exactly the soft-fallback behavior Q1=(b) specified
- `/dashboard/shipments/__TEST_HYDRATOR_…__` → full detail page with Vendors, Document Checklist (0/11), Cálculo breakdown ($285 taxes / $2,030 broker / $500 warehouse), Timeline (right column)
- `/dashboard/leads` Add Lead → select brand → "Estimate landed cost (optional)" `<details>` appears → expand → calculator prefilled
- `/dashboard/pipeline` → click any deal → "Landed Cost" tab between Customs and P&L → submit Kohler $500 → `$21,974 MXN` landed
- `/dashboard/customs` → checkbox column + select-all + "1 selected · Set status…" bar with all 16 status options
- `/api/dashboard/trafico-items` (new) → 6 items (test seed)

### Deviations from plan

- **Plan §Task 8 — card hover deferred to Task 10**: the original Q3-decision (no Deals schema persistence) means there's no cached landed-cost output to read on hover. Computing on every card hover would be N+1. Folded into Task 10 where `Trafico_Items` is already batch-fetched for bulk status work — single fetch powers both the bulk-action UI and the card-level risk badges. Card now shows shipment-status risk (issue → red, awaiting-documents/payment-pending → yellow), which is more useful than landed-cost on hover anyway (the slideout has the calculator).
- **Plan §Task 10 — coarse status-based risk heuristic instead of full `computeShipmentRisk`**: the spec's `computeShipmentRisk` keys on `delay_days` + `days_in_customs` + `nom_status`. Computing those needs date math against `initiated_date` + status_history timestamps + brand→NOM joins per Trafico. For W6, the status-based heuristic ("issue" → red, "awaiting-documents" / "payment-pending" → yellow) is pragmatic and surfaces attention-worthy deals using existing data. Real `delay_days` math lands in W7 alongside pipeline auto-stage rules. The pure `computeShipmentRisk` function from `landed-cost.ts` is built and tested (7 threshold transitions verified) and ready for W7 to wire in.
- **Plan §Task 7 — RHF skipped, plain useState used**: `react-hook-form` is in package.json but not actually used in any existing component. Matched the repo's existing pattern (plain useState) per CLAUDE.md "don't introduce abstractions beyond what the task requires."
- **Plan §Task 9 — server component pivoted to "use client"**: the dashboard route is auth-gated by middleware; server components would need to forward session cookies. Kept consistent with the rest of the dashboard (all `"use client"`).
- **Plan §Task 9 §5 — per-Deal allocation deferred**: `reconciliation.ts` has allocation logic but it's coupled to the rich Trafico shape and doesn't expose a clean per-Deal API. Detail view shows item-level totals but skips the per-deal split — flagged as a follow-up. The Vendors / Items section already shows each item's deal_id chip linking back to Pipeline.
- **Plan §Task 9 — docs upload covers only 3/11 doc keys**: flat Traficos schema only has `Calculo_Drive_ID`, `Factura_Drive_ID`, and `Expediente_Drive_ID` columns. The other 8 doc keys (ficha, carta318, COVE, pedimento, facturaCruce, tgrInvoice, comprobantePago, manifestacionValor) need a schema add. Detail view notes the limitation in a footer line.

### Open follow-ups (not blocking W7)

- **Doc storage schema add** — 8 missing doc-key columns on Traficos OR a new Trafico_Documents child sheet. Requires explicit Joshua approval per W5 ground rule.
- **Quote PDF (Q4 = (d) deferred)** — W6.5 spike. Ship LandedCostCalculator output to a PDF via `@react-pdf/renderer` or browser print template. Browser print already works as interim.
- **Per-user actor on auto-log** — same as W5 §8 follow-up. All Trafico_Events and doc-attached events still log `actor: "portal"`. Phase 2 auth work.
- **Real `computeShipmentRisk` wiring** — once W7 adds richer date tracking (especially the date a Trafico entered its current status), upgrade the Pipeline card heuristic to use the spec's true thresholds. The pure function is already built and tested.
- **Reference data population** — Brand_NOM_Status / Brand_Lead_Times / HS_Code_Lookup / FTA_Rates still 0 rows. Roger / Joshua / broker populate out-of-band; calculator gracefully shows yellow "estimate — unverified" banner until then.
- **Broker validation** — spec day-5 item (validate calculator within 2% of broker's manual calc). Pending Joshua's spot-check post-merge — can't close in-session.
- **W6 test rows in Sheets** — `__TEST_HYDRATOR_*` Trafico + 2 items left in production Sheet from hydrator round-trip tests. Same v1 cleanup compromise as W5.
- **`/dashboard/shipments` list page upgrade** — still on legacy Shipments sheet per design §3. W7 scope.

### What ships at W6

- ✅ Every quote shows landed cost at quote time (Deal slideout Landed Cost tab + Add-Lead preview)
- ✅ Architects see real-cost transparency including duty/IVA/broker/freight breakdown
- ✅ Working /dashboard/shipments/[id] Trafico detail view (timeline + items + docs + calculo)
- ✅ Risk badges on Pipeline cards for problematic Traficos
- ✅ Flat→rich Trafico hydrator (closes W5 deferred item) + Trafico_Items header bug fix
- ✅ Calculator gracefully handles empty reference data with surfaced warnings (Q1=(b))
- ✅ Bulk status update on Customs list with auto-logged audit trail
- ⚠ Quote PDF deferred to W6.5 (Q4=(d))
- ⚠ Broker validation pending post-merge spot-check

W6 ships. W7 (Pipeline automation + SLAs) can begin on the foundation.
