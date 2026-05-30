# Week 6 — Shipments UI + Landed-Cost — Execution Plan

> **Status:** Draft awaiting Joshua's approval (2026-04-19)
> **Workflow:** superpowers/Phase 2 plan
> **Companion:** `docs/superpowers/specs/2026-04-19-week6-shipments-ui-design.md`

Conventions:
- TDD: every code task is `RED failing test → GREEN minimal implement → refactor`.
- Typecheck after each task: `npx tsc --noEmit` (filter `routes.d [0-9].ts` stale files).
- Round-trip scripts in `scripts/_test-*.ts` for backend (no Vitest in this repo).
- Browser verification via Claude Preview MCP for UI.
- Commits: conventional prefixes + Co-Authored-By line. No push until Joshua says "push".

---

## Task 0 — Baseline smoke

Just verify green starting state; no code changes.

```bash
cd /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures
git status                                       # expect: clean, on main
npx tsc --noEmit 2>&1 | grep -v "routes.d \["    # expect: no errors
npx tsx scripts/_test-shipments-sheets.ts        # W5 sheet verifier
npx tsx scripts/_test-shipments-reference.ts     # W5 lib reads
npx tsx scripts/_test-reference-apis.ts          # W5 route registration
npx tsx scripts/_test-trafico-events.ts          # W5 writer round-trip
```

Expected: all pass. If any fail, stop and investigate before proceeding. No commit.

---

## Task 1 — Fix `Trafico_Items` missing-header bug

**Why first:** W5 §8 flagged this as a pre-existing bug that silently breaks
`findRowIndex` on Trafico_Items PUT. W6's hydrator round-trip test (task 2) will create
+ read items; broken header = silent failures masquerading as hydrator bugs. Fix
upstream first.

### 1.1 Write the fix script

File: `scripts/_fix-trafico-items-header.ts`

Pattern identical to existing `scripts/_fix-traficos-header.ts`. Idempotent: read row 1;
if empty-cells-count > threshold OR first cell doesn't equal `"Item_ID"`, overwrite row
1 with the 25 header names from `app/api/dashboard/traficos/[id]/items/route.ts` line 32
(`ITEM_COLUMNS`). Bold the header row.

### 1.2 Run it, verify idempotent

```bash
npx tsx scripts/_fix-trafico-items-header.ts
# First run: "Seeded 25 header cells + bolded row 1"
# Second run: "Header already correct — no changes"
```

### 1.3 Verify via Sheets API

```bash
npx tsx -e '
import { readSheet } from "./app/lib/dashboard-sheets";
(async () => {
  const rows = await readSheet("Trafico_Items");
  console.log("Row count:", rows.length);
  if (rows.length > 0) console.log("First row keys:", Object.keys(rows[0]).slice(0, 5));
})();
'
```

Expected: no crash. Keys should include `Item_ID`, `TRF_ID`, `Deal_ID`, `PO_ID`, `Shipment_ID`.

### 1.4 Commit

```
fix(sheets): Trafico_Items missing header row

Closes W5 §8 open follow-up. Same pattern as _fix-traficos-header.ts —
idempotent header seed + bold. findRowIndex on Trafico_Items PUT was
silently failing without row 1 headers.
```

---

## Task 2 — Trafico hydrator lib (`app/lib/trafico-hydrator.ts`)

### 2.1 RED: write the failing round-trip test

File: `scripts/_test-trafico-hydrator.ts`

Test plan:
1. POST a test Trafico via `/api/dashboard/traficos` with `TRF_ID = "CC-TRF-TEST-HYDRATOR-001"`, `Status = "calculo-received"`, `Calculo_Breakdown_JSON = '{"igi":100,"iva":160,...}'`, `Status_History_JSON = '[{"status":"collecting","timestamp":"2026-04-19T00:00:00Z","actor":"test"}]'`
2. POST two Trafico_Items: vendor Kohler (USMCA), vendor Dornbracht (partial USMCA)
3. Call `hydrateTrafico("CC-TRF-TEST-HYDRATOR-001")`
4. Assert:
   - `result.trafico.id === "CC-TRF-TEST-HYDRATOR-001"`
   - `result.trafico.items.length === 2`
   - `result.trafico.items[0].vendorName === "Kohler"`
   - `result.trafico.items[0].products.length > 0` (if Products_JSON non-empty)
   - `result.trafico.calculoBreakdown?.igi === 100`
   - `result.trafico.statusHistory.length >= 1`
   - `result.events.length >= 1` (auto-logged creation event from W5 Traficos POST wiring)
5. Cleanup: remove test rows (`scripts/_cleanup-test-rows.ts` pattern)

Run it:
```bash
npx tsx scripts/_test-trafico-hydrator.ts
```

Expected: **FAIL** with `Cannot find module 'app/lib/trafico-hydrator'` or similar.

### 2.2 GREEN: implement `app/lib/trafico-hydrator.ts`

Exports:
- `HydratedTrafico = { trafico: Trafico, events: TraficoEvent[] }`
- `hydrateTrafico(trfId: string): Promise<HydratedTrafico | null>` (null if 404)

Internal helpers (file-local):
- `safeParseJSON<T>(raw: string, fallback: T): T` — try/catch, log on fail
- `parsePedimentoItem(row: TraficoItemRecord): PedimentoItem`
- `mapFlatToRichTrafico(row: TraficoRecord, items: PedimentoItem[]): Trafico`

Read the types from `app/lib/customs-data.ts` and match them exactly. The hydrator only
assembles; never mutates source rows.

### 2.3 Verify GREEN

```bash
npx tsx scripts/_test-trafico-hydrator.ts
npx tsc --noEmit 2>&1 | grep -v "routes.d \["
```

Both must pass clean.

### 2.4 No commit yet — bundled with Task 3

---

## Task 3 — `/api/dashboard/traficos/[id]/rich` route

### 3.1 RED: write the failing auth-gate test

File: `scripts/_test-rich-route.ts` (append or new)

Assertion: `fetch("http://localhost:3000/api/dashboard/traficos/FOO/rich")` returns
`401` (route registered + auth-gated by middleware, same as W5 reference routes).

### 3.2 GREEN: implement route

File: `app/api/dashboard/traficos/[id]/rich/route.ts`

```
GET({ params: { id } }): 
  const hydrated = await hydrateTrafico(id);
  if (!hydrated) return 404;
  return NextResponse.json(hydrated);
```

### 3.3 Verify

- `scripts/_test-rich-route.ts` passes (401)
- Browser preview: auth-logged-in, visit `/api/dashboard/traficos/<real TRF_ID>/rich` → 200 with hydrated shape
- `npx tsc --noEmit` clean

### 3.4 Commit (bundles Task 2 + Task 3)

```
feat(shipments): flat→rich Trafico hydrator + /rich route

Closes W5 Task 9 deferred item. Reconstructs the rich Trafico type
from customs-data.ts by reading Traficos + Trafico_Items + Trafico_Events
and parsing Calculo_Breakdown_JSON, Status_History_JSON, Products_JSON.
Used by Pipeline Customs tab (Task 4) and shipments detail view (Task 9).
```

---

## Task 4 — Pipeline Customs tab: slim → rich rendering

### 4.1 Identify current slim rendering

```
grep -n "TODO.*hydrator\|slim.*shape\|flat→rich" app/(dashboard)/dashboard/(portal)/pipeline/page.tsx
```

Locate the slim JSX block left as a placeholder in W5 Task 9.

### 4.2 Replace with hydrator-powered JSX

Fetch hydrated Trafico via `/api/dashboard/traficos/[id]/rich`. Render:
- Header: TRF_ID + Trafico_Number + status badge (from `TRAFICO_STATUS_CONFIG`)
- Items list: `trafico.items.map(item => ...)` — vendor + invoice # + USMCA status + item total
- Doc checklist: `getDocumentChecklist(trafico)` from `customs-data.ts` → completion %
- Calculo breakdown: if `trafico.calculoBreakdown` present, small summary (IGI + IVA + total)
- Timeline: first 3 events from `result.events` in reverse-chronological
- "View full detail →" link to `/dashboard/shipments/[id]`

Keep the slim fallback for the case where `rich` 404s or errors (network issues).

### 4.3 Browser preview verification

```
preview_start → /dashboard/pipeline → click a deal with a Trafico → Customs tab
```

Expected: rich shape renders; no console errors; items list + doc % + timeline visible.

### 4.4 Commit

```
feat(pipeline): Customs tab renders rich Trafico shape

Replaces W5's slim placeholder rendering with full hydrator-backed
items list, doc checklist %, calculo summary, and event timeline.
```

---

## Task 5 — `landed-cost.ts` pure module + 7 assertions

### 5.1 RED: write the failing test

File: `scripts/_test-landed-cost.ts`

Structure:
```ts
import { computeLandedCost, computeQuoteRisk } from "../app/lib/landed-cost";
import type { LandedCostInput } from "../app/lib/landed-cost";

// Load reference snapshot — tests use real live Sheets (empty by default, 
// which is the default-fallback code path)
const snapshot = await loadReferenceSnapshot();

// Case 1: spec worked example
const result1 = await computeLandedCost({...}, snapshot);
assert(Math.abs(result1.landedCostMxn - 100022) < 1);
// ... etc for 7 cases
```

Seven cases per design §5. Use inline data for snapshot overrides (don't write to Sheets
for test-specific rows; mock the snapshot at the function boundary).

### 5.2 GREEN: implement `app/lib/landed-cost.ts`

Exports:
- `interface LandedCostInput { ... }` — exact from spec §Part 3 line 321
- `interface LandedCostOutput { ... }` — exact from spec §Part 3 line 333
- `interface ReferenceSnapshot { brandNomStatus, brandLeadTimes, hsCodes, ftaRates }`
- `loadReferenceSnapshot(): Promise<ReferenceSnapshot>`
- `computeLandedCost(input, snapshot): LandedCostOutput` — pure, no IO
- `computeQuoteRisk(output): 'green'|'yellow'|'red'` — pure
- `computeShipmentRisk(trafico): 'green'|'yellow'|'red'` — pure

Fallback table (spec Appendix defaults used when sheets empty):
- FTA rate → MFN fallback from `HS_Code_Lookup.default_duty_rate_mfn`, else 0.10
- Brand lead times → spec §Part 3 table (Kohler 14d prod, Dornbracht 28d, etc.)
- Domestic freight → 1,800 MXN (Guanajuato default per spec line 572)
- Broker fee → `max(CIF × 0.015, 2500)` per spec line 462
- Pedimento fee → 3,000 MXN flat per spec line 463

Warnings populate as each fallback fires. Risk flag derives from warnings + NOM.

### 5.3 Verify

```bash
npx tsx scripts/_test-landed-cost.ts
# All 7 assertions pass

npx tsc --noEmit 2>&1 | grep -v "routes.d \["
# Clean
```

### 5.4 No commit — bundled with Task 6

---

## Task 6 — `/api/dashboard/landed-cost` route

### 6.1 RED: auth-gate test

`scripts/_test-landed-cost-route.ts` — same auth-gated pattern (401).

### 6.2 GREEN: implement route

File: `app/api/dashboard/landed-cost/route.ts`

```
POST(body: LandedCostInput):
  const snapshot = await loadReferenceSnapshot();
  const output = computeLandedCost(body, snapshot);
  return NextResponse.json(output);
```

Input validation: Zod schema matching LandedCostInput. Reject with 400 on schema fail.

### 6.3 Verify

- `_test-landed-cost-route.ts` passes
- Browser preview: `curl -X POST .../api/dashboard/landed-cost -d '<spec example>'` returns full output
- Typecheck clean

### 6.4 Commit (bundles Task 5 + Task 6)

```
feat(shipments): landed-cost calculator core + API route

Pure computeLandedCost() per spec §Part 3. Soft-fallback for empty
reference sheets (MFN duty, spec-default lead times, 1800 MXN Guanajuato
freight) surfaces via warnings[]. Matches spec worked example within 1 MXN.
POST /api/dashboard/landed-cost wraps the pure fn with Zod-validated input.
```

---

## Task 7 — `<LandedCostCalculator>` shared component

### 7.1 RED: render test via browser preview

Scaffold the component with minimal JSX; mount in a temporary `/dashboard/dev/calculator`
route if needed for isolated verification. Verify it renders without crashes.

### 7.2 GREEN: full component

File: `app/(dashboard)/components/landed-cost-calculator.tsx`

Props:
```ts
interface Props {
  variant: "preview" | "full";
  defaultValues?: Partial<LandedCostInput>;
  onQuote?: (output: LandedCostOutput) => void;
  dealId?: string;         // persists output to Deal if provided
}
```

- Form uses React Hook Form + Zod (matches repo conventions per CLAUDE.md)
- Fields: brand select (from Brand_Kit), product SKU (free text + Shopify product ID placeholder), FOB USD, quantity, destination type (warehouse/jobsite), destination city (if jobsite), quote date (defaults today)
- On submit → POST `/api/dashboard/landed-cost` → render `<LandedCostBreakdown output={...}>`
- `"preview"` variant: compact vertical layout, no breakdown line-items (just totals + risk pill)
- `"full"` variant: full breakdown table, yellow "estimate — unverified" banner if warnings present
- Bilingual labels via `BilingualContent` pattern (keep SSR-safe)

### 7.3 Verify

Browser preview — mount on a throwaway `/dashboard/dev/calculator` page or the deal
slideout (Task 8). Submit spec worked example; confirm output matches.

### 7.4 Commit

```
feat(shipments): LandedCostCalculator component

Shared React component for quote-time landed-cost computation. Variants:
"preview" (compact form + totals) and "full" (detailed breakdown + warnings
banner). Uses React Hook Form + Zod; bilingual labels; posts to
/api/dashboard/landed-cost.
```

---

## Task 8 — Three surface integrations (Deal slideout + Add-Lead + card hover)

Bundled into one commit because each surface is a thin mount of an existing component.

### 8.1 Deal slideout

Identify deal slideout file: `app/(dashboard)/dashboard/(portal)/pipeline/page.tsx`
(line ~840 per W5 doc). Add a "Landed Cost" tab between existing tabs. Mount:

```tsx
<LandedCostCalculator
  variant="full"
  dealId={deal.Deal_ID}
  defaultValues={{ brandId: deal.Brand_Slugs?.split("|")[0], ... }}
  onQuote={(out) => persistToDeal(deal.Deal_ID, out)}
/>
```

Persisting to Deal: extend `Deals` sheet with a `Landed_Cost_Summary_JSON` column (or,
if schema change needs approval, skip persistence for W6 and let the calculator
recompute on each view). **Flagging: schema edit to Deals needs Joshua's approval.**
Default for W6: **no persistence, recompute on view.** Flagging it is cheap enough that
card hover doesn't need the cache for W6.

### 8.2 Add-Lead form

Identify lead form file (likely `app/(dashboard)/components/add-lead-form.tsx` or
`lead-form.tsx`). When user has selected a brand + entered FOB + quantity, show:

```tsx
<LandedCostCalculator variant="preview" defaultValues={...} />
```

Collapsed by default; expand on user click.

### 8.3 Pipeline card hover

Component: `app/(dashboard)/components/landed-cost-summary-hover.tsx`

Reads deal's Brand + any captured FOB from Lead → triggers a *cached* compute on hover
(dedupe per deal per session). Shows a tooltip: `"Est. landed cost: 135,030 MXN · Risk: 🟢"`.

If no calculable inputs present, hide the widget (don't show "N/A").

### 8.4 Browser preview verification

For each surface:
- Deal slideout: open a deal with brand → Landed Cost tab → submit → breakdown renders
- Add-Lead form: pick brand → enter FOB → preview widget updates
- Card hover: hover a deal card with brand+FOB captured → tooltip appears with estimate

### 8.5 Commit

```
feat(pipeline): landed-cost on deal slideout + Add-Lead + card hover

Mounts LandedCostCalculator in three surfaces per W6 spec:
- Deal slideout: full variant in a Landed Cost tab (W6 compute on view;
  Deals.Landed_Cost_Summary_JSON persistence deferred pending schema approval).
- Add-Lead form: preview variant, collapsed by default.
- Pipeline card hover: read-only summary tooltip (risk pill + total).
```

---

## Task 9 — `/dashboard/shipments/[id]` detail view

### 9.1 RED: route-exists + timeline-renders browser test

Create a throwaway test: `preview_start → /dashboard/shipments/<real TRF_ID>`.
Expected: **page not found** or build error. That's the RED state.

### 9.2 GREEN: implement detail page

File: `app/(dashboard)/dashboard/(portal)/shipments/[id]/page.tsx`

Layout (server component where possible, `"use client"` only where state needed):
- Header: TRF_ID + Trafico_Number + Status pill + "Open in Customs →" link to `/dashboard/customs/[id]` if that route exists, else Drive link
- Section 1 — **Timeline**: reverse-chronological Trafico_Events list. Each event: icon + actor + timestamp + event type + message
- Section 2 — **Items**: each PedimentoItem expanded — vendor, invoice #, USMCA status badge, Spanish manuals status, products[] table
- Section 3 — **Documents**: `getDocumentChecklist(trafico)` → grid of 11 doc statuses (✅/🟡/❌/—) with Drive links where uploaded. Upload button for missing docs → opens Drive picker or file input that POSTs to `/api/dashboard/shipments/[id]/docs`.
- Section 4 — **Calculo breakdown** (if present): table of IGI, DTA, IVA, honorarios, warehouse handling
- Section 5 — **Landed cost per Deal**: if `Trafico_Items[].Deal_ID` resolves, show per-Deal allocation (using `reconciliation.ts` helpers if they exist; otherwise sum `items.filter(i => i.dealId === X).reduce((s, i) => s + i.invoiceTotal + allocatedOverheads)`). Deferred if `reconciliation.ts` doesn't already compute allocations — flag as TODO rather than building new allocation logic in W6.

Use existing components: `<StatusPill>`, `<EmptyState>`, `<KPICard>` — no new primitives.

### 9.3 Doc upload route

File: `app/api/dashboard/shipments/[id]/docs/route.ts`

POST multipart: file + `docKey` (one of `ficha`, `calculo`, `carta318`, etc.). Upload
via existing `app/lib/google-drive.ts` to the Trafico's docs folder; PATCH the Trafico
row with the new Drive ID in the matching column (`Ficha_Drive_ID`, `Calculo_Drive_ID`, etc.).

Append `Trafico_Events` row: `event_type = "doc_attached"`, `doc_key = <docKey>`, `doc_drive_id = <new id>`.

### 9.4 Verify

Browser preview:
- Visit `/dashboard/shipments/<real TRF_ID>` → page renders with sections populated
- Upload a test PDF → doc checklist item turns ✅ → timeline shows new `doc_attached` event
- Typecheck clean

### 9.5 Commit

```
feat(shipments): /dashboard/shipments/[id] Trafico detail view

Server-rendered detail page powered by the hydrator. Sections: status
header, Trafico_Events timeline, PedimentoItem list with USMCA/Spanish
manuals status, 11-step document checklist with Drive upload, calculo
breakdown summary, per-Deal allocation. Includes POST
/api/dashboard/shipments/[id]/docs for document uploads to Drive.
```

---

## Task 10 — Bulk status update + live shipment risk flag

### 10.1 RED: `computeShipmentRisk()` assertions

Append to `scripts/_test-landed-cost.ts` (same file — both are pure risk functions):

```ts
assert(computeShipmentRisk({ status: "awaiting-documents", ..., delay_days: 8 }) === "red");
assert(computeShipmentRisk({ ..., delay_days: 4 }) === "yellow");
assert(computeShipmentRisk({ ..., delay_days: 0, nom_status: "needs-cert" }) === "red");
assert(computeShipmentRisk({ ..., nom_status: "in-progress", days_to_eta: 10 }) === "red");
assert(computeShipmentRisk({ ..., nom_status: "in-progress", days_to_eta: 30 }) === "green");
```

### 10.2 GREEN: add `computeShipmentRisk()` to `app/lib/landed-cost.ts`

Pure function per spec §risk_flag lines 531-538. No side effects.

### 10.3 Wire risk flag into Pipeline card warning icon

In `pipeline/page.tsx` card component: if `deal` has a linked Trafico via `Trafico_Items.Deal_ID`, compute shipment risk → render warning icon (red `AlertTriangle` / yellow `AlertCircle` / none for green) next to deal amount.

### 10.4 Bulk status update UI on `/dashboard/shipments` list page

Add checkbox column + "Update status →" dropdown. Selecting N rows + choosing new
status → PATCH each via existing `/api/dashboard/traficos/[id]` (PATCH). Note:
existing `/dashboard/shipments` reads legacy Shipments sheet, not Traficos. Per §3
of design doc, we keep that as-is. **Re-scope: apply bulk status update on
`/dashboard/customs` list instead** (that's the Traficos list). Flag in commit message.

### 10.5 Verify

- Risk-flag assertions pass
- Browser preview: Customs list → select 2 Traficos → "Update status" → both rows reflect new status → each emits an auto-logged `status_change` event (W5 wiring)
- Pipeline card shows warning icon for deals with a linked Trafico in `needs-cert` or delayed state

### 10.6 Commit

```
feat(shipments): bulk status update + live shipment risk flag

computeShipmentRisk() pure fn per spec §risk_flag thresholds (delay_days,
days_in_customs, nom_status). Pipeline deal cards now render warning
icons for linked Traficos in yellow/red state. Bulk status update UI
added to /dashboard/customs (the Traficos list) — /dashboard/shipments
list stays on the legacy Shipments sheet for W6 per design §3.
```

---

## Task 11 — Final smoke + execution log + commit

### 11.1 Run full smoke suite

```bash
npx tsx scripts/_test-shipments-sheets.ts
npx tsx scripts/_test-shipments-reference.ts
npx tsx scripts/_test-reference-apis.ts
npx tsx scripts/_test-trafico-events.ts
npx tsx scripts/_test-trafico-hydrator.ts
npx tsx scripts/_test-rich-route.ts
npx tsx scripts/_test-landed-cost.ts
npx tsx scripts/_test-landed-cost-route.ts
npx tsc --noEmit 2>&1 | grep -v "routes.d \["
```

Expected: all pass, typecheck clean.

### 11.2 Append execution log

Append a §12 execution log section to the design doc with:
- Per-task commit hash
- Any deviations from plan (pre-fab template: "Plan said X, actual Y, reason Z")
- Open follow-ups (not-blocking-W7)
- Final smoke results
- Broker validation TODO (design §9 risk — requires Joshua spot-check post-merge)

### 11.3 Commit

```
docs(design): W6 execution log + final smoke results

Closes Week 6. Shipments UI + landed-cost calculator + hydrator shipped.
Broker QA (spec day-5) pending spot-check — not in-session.
```

---

## Commits target recap

| # | Commit message prefix | Tasks bundled |
|---|---|---|
| 1 | `fix(sheets):` | Task 1 |
| 2 | `feat(shipments):` hydrator + /rich | Tasks 2-3 |
| 3 | `feat(pipeline):` Customs tab rich shape | Task 4 |
| 4 | `feat(shipments):` calculator + API | Tasks 5-6 |
| 5 | `feat(shipments):` calculator component | Task 7 |
| 6 | `feat(pipeline):` three-surface integration | Task 8 |
| 7 | `feat(shipments):` detail view + docs upload | Task 9 |
| 8 | `feat(shipments):` bulk + risk flag | Task 10 |
| 9 | `docs(design):` W6 log | Task 11 |

= **9 commits**, ~3-4 hours inline.

---

## Approval request (second gate)

Joshua — please approve this plan (or push back on specifics) before I execute.
Specifically:

1. **Task bundling (9 commits)** — OK?
2. **Task 8 — no Deals schema edit** — calculator recomputes on every view; skip
   persistence in W6 and skip the Deals column addition. OK?
3. **Task 10 — bulk-status on `/dashboard/customs` not `/dashboard/shipments`** — the
   Traficos list is where the TRF_ID rows live. The `/dashboard/shipments` list stays
   on legacy `Shipments` sheet until W7. OK?
4. **Task 9.2 §5 — per-Deal allocation** — if `reconciliation.ts` doesn't already
   compute allocations, I'll render a simple sum (`items.filter × unit_cost`) and flag
   a TODO rather than building allocation logic in W6. OK?

Once approved, execution begins inline per the W5 pattern.
