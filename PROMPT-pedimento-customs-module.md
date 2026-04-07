# Claude Code Prompt: Pedimento (Customs Import) Module — Dashboard Implementation

Copy everything below this line and paste it into Claude Code as a single prompt.

---

## Task

You are building the **Pedimento (Mexican Customs Import) Module** into the Counter Cultures dashboard. This is the system that handles everything that happens when a US-origin product needs to cross the Mexican border — from the moment a vendor ships it to the moment the customs case file is closed and the import cost hits the deal P&L.

The current dashboard has a Shipments page, a Finance page, and a Pipeline with post-sale Operations stages. But "customs" is a single status label in the shipment tracker. In reality, the Pedimento is a **15-step subprocess** involving a customs broker, 11 distinct documents, tax payments, compliance requirements, and full reconciliation — any of which can stall a crossing for days or weeks.

You are building the customs engine: the data models, the Pedimento Tracker page, the document checklist, the reconciliation engine, the automation triggers, and the integration with the existing Finance Dashboard and Shipment Tracker.

## Read These First (ALL OF THEM — IN ORDER)

1. **Read `AGENTS.md`** — Next.js breaking changes. Check `node_modules/next/dist/docs/` before writing code.
2. **Read `PEDIMENTO-PROCESS-SPEC.md`** — **THIS IS YOUR PRIMARY REQUIREMENTS DOCUMENT.** It contains the full 11-step process flow, two real-world case studies from actual crossings, the complete data model (TypeScript interfaces), all Google Sheet tab schemas, the dashboard wireframes, reconciliation rules, automation triggers, and the 4-phase implementation plan. Read it cover to cover. Everything you build must match this spec.
3. **Read `PROCESS-ENGINE-PROMPT.md`** — The existing Process Engine spec. Your work extends this system. The `Trafico` model links to existing `PurchaseOrder`, `DealShipment`, `DealPayment`, and `ExtendedDealFields` interfaces defined here. Do NOT duplicate — extend.
4. **Read `DOCUMENT-WORKSTATION-PROMPT.md`** — The Document Workstation spec. Import documents will be managed through Drive. Understand the existing document management patterns.
5. **Read `CC-Internal-Process-Map.md`** — The full business process. Customs sits between Phase 6 (Shipment Tracking) and Phase 7 (Delivery & Installation).

## What Already Exists (DO NOT REWRITE — EXTEND)

### Existing Data Models (sample-dashboard-data.ts)

These types are already defined and in use. **Do not redefine them.** Import and extend:

```typescript
// ALREADY EXISTS — just import these
FulfillmentStage        // Has "shipping" → your module fires between "shipping" and "received-at-cc"
DealShipment            // Has carrier, tracking, status — you ADD multi-leg support + pedimentoId
DealPayment             // Payment tracking — you ADD import payment types
PurchaseOrder           // PO tracking — you link PedimentoItems to these
ExtendedDealFields      // Per-deal financials — you ADD importCosts
PipelineDeal            // The deal itself — no changes needed
DealLineItem            // Line items — you ADD countryOfOrigin, requiresImport
```

### Existing Dashboard Pages

| Page | File | What It Does | How You Integrate |
|---|---|---|---|
| **Pipeline** | `pipeline/page.tsx` | Kanban with Sales/Operations views, deal SlideOut | Add "Customs" tab to deal SlideOut showing linked Tráficos |
| **Shipments** | `shipments/page.tsx` | Shipment tracker with status timeline | Expand "customs" status into sub-statuses, add multi-leg tracking |
| **Finance** | `finance/page.tsx` | Financial dashboard with KPIs, invoices, payables | Add import costs section, update margin calculations |
| **Drive** | `drive/page.tsx` | Google Drive file browser | Import documents stored here, folder structure must match |

### Existing Sidebar (sidebar.tsx)

21 nav items already. Finance and Shipments are in the "Operations" section. Add **"Customs"** between Shipments and Products in the Operations section with a `Ship` or `FileCheck` icon from Lucide.

### Existing Sheet Tabs (dashboard-sheets.ts)

```typescript
// ALREADY EXISTS — add new tabs alongside these
type SheetTab = "Leads" | "Pipeline" | "Contacts" | ... | "Purchase_Orders" | "Shipments" | "Deal_Payments" | "Manufacturers";
```

### Existing Document Numbering (document-numbers.ts)

Add new document type prefixes:
```typescript
// Add to existing system:
"CC-TRF"    // Tráfico (batch crossing)     CC-TRF-2026-001
"CC-PED"    // Pedimento reference           CC-PED-2026-001
"CC-CALC"   // Cálculo                       CC-CALC-2026-001
```

---

## What to Build

### Phase 1: Data Foundation

#### A. New TypeScript Interfaces

**File:** `app/lib/customs-data.ts` (NEW FILE)

Create the following interfaces exactly as specified in `PEDIMENTO-PROCESS-SPEC.md` Section "Dashboard Automation Plan → 1. New Data Model":

1. **`Trafico`** — The batch crossing parent container. This is the core entity. One Tráfico = one physical border crossing that may contain items from multiple vendors, multiple POs, and multiple customer deals.

2. **`PedimentoItem`** — Each vendor's shipment within a Tráfico. Links back to `dealId`, `poId`, and `shipmentId` from the existing models.

3. **`TraficoStatus`** — The 16-state enum tracking crossing progress from `"collecting"` through `"complete"`.

4. **`ShipmentLeg`** — Multi-leg tracking (US-to-border + domestic-to-SMA).

5. **`BrokerMessage`** — Communication log for broker interactions.

6. **`ReconciliationCheck`** — Individual reconciliation comparison (e.g., cálculo vs factura).

**CRITICAL:** Copy the interfaces EXACTLY from `PEDIMENTO-PROCESS-SPEC.md`. They were designed from two real crossings (Feb E27-26 and March E40-26) and every field exists because real data needed it.

#### B. Extend Existing Interfaces

**File:** `app/lib/sample-dashboard-data.ts` (MODIFY)

Add to `DealLineItem`:
```typescript
countryOfOrigin?: "US" | "Canada" | "China" | "Mexico" | "India" | "Other";
requiresImport?: boolean;  // Auto-calculated: true if origin != "Mexico"
hsCode?: string;            // Harmonized System code for customs classification
```

Add to `DealShipment`:
```typescript
legs?: ShipmentLeg[];       // Multi-leg tracking (US carrier + domestic carrier)
traficoId?: string;         // Links to parent Tráfico
pedimentoItemId?: string;   // Links to specific item in crossing
```

Add to `ExtendedDealFields`:
```typescript
importCosts?: {
  traficoId: string;
  traficoNumber: string;
  allocationPercent: number;    // This deal's share of total crossing
  allocatedTaxes: number;
  allocatedBrokerFees: number;
  allocatedWarehouse: number;
  allocatedTruckFee: number;
  totalImportCost: number;
};
```

#### C. New Google Sheet Tabs

**File:** `app/lib/dashboard-sheets.ts` (MODIFY)

Add four new tabs to the `SheetTab` type:

```typescript
| "Traficos"              // Batch crossings
| "Trafico_Items"         // Individual shipments per crossing
| "USMCA_Certificates"   // Certificate library for reuse
| "Spanish_Manuals"       // Translated manual library for reuse
```

Column schemas for each tab are specified in `PEDIMENTO-PROCESS-SPEC.md` Sections 2, 2b, 3, and 4. Follow them exactly.

#### D. New API Routes

Create CRUD routes following the same pattern as existing routes in `app/api/dashboard/`:

- `app/api/dashboard/traficos/route.ts` — Tráfico CRUD (list, create, update)
- `app/api/dashboard/traficos/[id]/route.ts` — Single tráfico operations
- `app/api/dashboard/traficos/[id]/items/route.ts` — Items within a tráfico
- `app/api/dashboard/usmca-certificates/route.ts` — Certificate library CRUD
- `app/api/dashboard/spanish-manuals/route.ts` — Manual library CRUD

---

### Phase 2: Pedimento Tracker Page (The Main UI)

**File:** `app/(dashboard)/dashboard/(portal)/customs/page.tsx` (NEW)

This is the customs team's home base. Layout and wireframe are in `PEDIMENTO-PROCESS-SPEC.md` Section 5.

#### KPI Cards (top row, 4 cards using existing KPICard component)

| Card | Value | Source |
|---|---|---|
| Active Crossings | Count of Tráficos where status NOT in ["complete", "issue"] | Traficos sheet |
| Awaiting Documents | Count where status = "awaiting-documents" | Traficos sheet |
| Payment Pending | Sum of `calculoTotal` where status = "payment-pending" | Traficos sheet |
| Import Cost MTD | Sum of `totalImportCost` for tráficos completed this month | Traficos sheet |

#### Main Content: Active Tráficos List

For each active tráfico, show a card with:

1. **Header:** Tráfico number (e.g., "E40-26"), pedimento number, status badge
2. **Summary:** Item count, total invoice value USD, total import cost MXN
3. **Vendor list:** Each PedimentoItem showing vendor name, invoice number, value
4. **Progress stepper:** Visual 15-step status progression (filled/current/empty dots or segments)
5. **Document checklist:** The 11-document trail with status icons:
   - ✅ Uploaded (green check, clickable to view in Drive)
   - ⏳ In Progress (amber clock)
   - ❌ Missing/Required (red X)
   - ○ Not Yet Applicable (gray circle)
6. **Key dates:** Initiated, cálculo received, payment sent, crossing approved, delivered
7. **Quick actions:**
   - "Send to Broker" → Emails invoice batch to broker contacts
   - "Approve Cálculo" → Shows payment instructions
   - "Upload Payment Receipt" → File upload + auto-advance status
   - "Sign Expediente" → Digital signature workflow

#### Detail SlideOut (click a tráfico to expand)

Full detail view with tabs:
- **Overview** — All tráfico fields, timeline, notes
- **Items** — Table of PedimentoItems with vendor, products, tracking, origin, USMCA status
- **Financials** — Cálculo breakdown (taxes, broker fees, warehouse handling), payment details, factura comparison
- **Documents** — The full 11-document checklist with upload/view/download actions
- **Reconciliation** — Side-by-side comparisons (see Phase 4)
- **Communication** — Broker message log

#### Sidebar Navigation

Add to `sidebar.tsx` in the Operations section, between Shipments and Products:

```typescript
{ label: "Customs", href: "/dashboard/customs", icon: FileCheck, section: undefined },
```

Import `FileCheck` from lucide-react (or use `Ship` if `FileCheck` isn't available).

---

### Phase 3: Integration with Existing Pages

#### A. Shipments Page Enhancement

**File:** `shipments/page.tsx` (MODIFY)

The existing shipment tracker shows a single status timeline per shipment. For shipments linked to a Tráfico:

1. **Expand the "customs" status** into a mini-stepper showing the Tráfico sub-status (e.g., "at-warehouse → awaiting-documents → calculo-received")
2. **Show two tracking legs** when `shipment.legs` exists:
   - Leg 1: US carrier (FedEx/UPS) — manufacturer to border
   - Leg 2: Domestic carrier (Tres Guerras, etc.) — border to SMA
3. **Add a "View in Customs" link** that navigates to the customs page filtered to that tráfico

#### B. Finance Page Enhancement

**File:** `finance/page.tsx` (MODIFY)

The existing margin calculation is:
```
Net Margin = Total Collected - Dealer Cost - Stripe Fees - Shipping
```

**Update to include import costs:**
```
Net Margin = Total Collected - Dealer Cost - Stripe Fees - US Shipping
           - Import Duties & Taxes - Broker Fees - Warehouse Handling
           - Truck Crossing Fee - Domestic Shipping
```

Add a new section: **Import Costs Summary**
- Table of recent tráficos with: Date, Tráfico #, Invoice Value USD, Total Cost MXN, Status
- Running totals: Total import costs MTD, YTD
- USMCA savings tracker: How much was saved by presenting certificates

Update the **Deal P&L** section (Financial Summary tab in deal SlideOut) to show:
```
─── MONEY OUT ──────────────────────────
PO costs:              $75,000 MXN  ✅
Import costs:          $25,733 MXN  ✅    ← NEW LINE
  └── Tráfico E27-26: $12,866 (pro-rata 50%)
Stripe fees:           -$5,223 MXN
────────────────────────────────────────
```

#### C. Pipeline Deal SlideOut Enhancement

**File:** `pipeline/page.tsx` (MODIFY)

Add a **"Customs"** tab to the deal detail SlideOut (alongside existing Line Items, Payments, POs, Shipments, Financial Summary tabs).

This tab shows:
- All tráficos linked to this deal (via `PedimentoItem.dealId`)
- Per-tráfico status, document checklist, allocated import cost
- USMCA certificate status for each line item
- Total import cost allocated to this deal

---

### Phase 4: Reconciliation Engine

**File:** `app/lib/reconciliation.ts` (NEW)

This is the bookkeeping backbone. Joshua was emphatic: "reconciliation on absolutely everything."

#### Reconciliation Checks (from PEDIMENTO-PROCESS-SPEC.md Section 10)

| Check | Comparison | Threshold | Flag Level |
|---|---|---|---|
| Vendor invoice vs PO amount | `PedimentoItem.invoiceTotal` vs `PurchaseOrder.totalAmount` | Any difference | Yellow |
| Cálculo vs payment sent | `Trafico.calculoTotal` vs `Trafico.calculoPayment.amount` | > $1 MXN | Yellow |
| Cálculo vs final factura | `Trafico.calculoTotal` vs `Trafico.facturaAmount` | > 1% = Yellow, > 5% = Red | Yellow/Red |
| Crossing fee vs baseline | `Trafico.truckCrossingFee` vs $2,668 baseline | > $500 | Yellow |
| Cost allocation balance | Sum of all deal allocations | Must = 100% | Red if unbalanced |
| USMCA savings verification | With-cert duty vs without-cert duty | Informational | Green (savings) |

#### Reconciliation UI

Add a **"Reconciliation"** tab to the Tráfico detail SlideOut. Layout in `PEDIMENTO-PROCESS-SPEC.md` Section 10 shows the exact wireframe. Implement it.

Also add a **Reconciliation Dashboard** section to the Customs page showing:
- KPIs: Open crossings, variances flagged, unmatched payments, total variance
- Per-tráfico reconciliation summary with expandable detail

#### Helper Functions

```typescript
// app/lib/reconciliation.ts

export function reconcileTrafico(trafico: Trafico): ReconciliationResult {
  // Run ALL checks for a given tráfico
  // Return array of ReconciliationCheck results with pass/warn/fail status
}

export function calculateProRataAllocation(
  trafico: Trafico,
  dealItems: PedimentoItem[]
): { dealId: string; percent: number; allocatedCost: number }[] {
  // Pro-rata by invoice value:
  // dealAllocation = (sum of deal's item invoice totals / total crossing invoice value) × totalImportCost
}

export function calculateUSMCASavings(trafico: Trafico): {
  igiWaived: number;
  dtaWaived: number;
  totalSaved: number;
} {
  // Compare items with USMCA cert (IGI=0, DTA=0) vs what they'd pay without
}
```

---

### Phase 5: Automation Triggers

**File:** `app/lib/customs-automation.ts` (NEW)

Implement the 16 automation triggers from `PEDIMENTO-PROCESS-SPEC.md` Section 6. Key ones:

```typescript
// When a PO ships and destination is CC showroom (US-origin product):
onPOShipped(po: PurchaseOrder) {
  // 1. Check if there's an open Tráfico in "collecting" status
  // 2. If yes → add as new PedimentoItem to that tráfico
  // 3. If no → create new Tráfico with status "collecting"
  // 4. Auto-populate vendor info, tracking, origin from PO/line items
}

// When "Send to Broker" is clicked:
onSendToBroker(traficoId: string) {
  // 1. Compile all vendor invoices for items in this tráfico
  // 2. Draft email to broker (jeanefer_jeco@hotmail.com) + CC TGR + CC Enrique
  // 3. Attach invoice PDFs from Drive
  // 4. Advance status to "sent-to-broker"
  // 5. Log in BrokerMessage
}

// When origin is confirmed for an item:
onOriginConfirmed(itemId: string, origin: string) {
  // 1. If US/Canada → check USMCA_Certificates sheet for matching vendor + SKU
  // 2. If cert found and blanket period is valid → auto-attach, mark "on-file"
  // 3. If no cert → flag as "requested", draft email to vendor
  // 4. If non-USMCA origin → mark "not-applicable", note duty will apply
}

// When cálculo is uploaded:
onCalculoReceived(traficoId: string, calculoDocId: string) {
  // 1. Parse key amounts (or prompt user to enter: total, taxes, broker, warehouse)
  // 2. Store in Trafico.calculoBreakdown
  // 3. Advance to "calculo-received"
  // 4. Show payment instructions (two transfers: PED to BBVA + CRUZ to Banamex)
  // 5. Notify Roger for approval
}

// When payment receipts uploaded:
onPaymentSent(traficoId: string) {
  // 1. Match payment amounts to cálculo + truck fee
  // 2. Run reconciliation check (cálculo vs payment)
  // 3. Advance to "payment-sent"
  // 4. Email receipts to broker
}

// When broker confirms crossing:
onCrossingApproved(traficoId: string) {
  // 1. Advance to "crossing-approved"
  // 2. Prompt for domestic carrier + tracking info
  // 3. Update linked DealShipments with Leg 2 info
  // 4. Calculate estimated arrival (4-6 weeks from payment = ~2-4 weeks from crossing)
}

// When factura is uploaded:
onFacturaReceived(traficoId: string, facturaDocId: string) {
  // 1. Store factura amount
  // 2. Auto-run reconciliation: cálculo vs factura
  // 3. If variance > 1% → yellow flag
  // 4. If variance > 5% → red flag, notify Roger
  // 5. Advance to "factura-received"
}

// When expediente is signed:
onExpedienteSigned(traficoId: string) {
  // 1. Advance to "complete"
  // 2. Run FULL reconciliation (all checks)
  // 3. Calculate pro-rata cost allocation across linked deals
  // 4. Update each deal's ExtendedDealFields.importCosts
  // 5. Update Finance Dashboard margin calculations
  // 6. Store expediente in Drive under Import Documents folder
}
```

---

### Phase 6: Sample Data

**File:** `app/lib/sample-customs-data.ts` (NEW)

Create sample data based on the TWO REAL crossings documented in `PEDIMENTO-PROCESS-SPEC.md`:

**Sample Tráfico 1: E27-26 (Feb 2026) — Complete**
- Status: `"complete"`
- 7 items from 4 vendors (Ferguson, JCR Distributors, California Faucets, JamesLitho)
- Invoice value: $2,611.34 USD
- Total import cost: $25,733.21 MXN (two payments: $23,065.21 PED + $2,668 CRUZ)
- USMCA cert: Ferguson/Kohler (blanket through Oct 2026)
- All 11 documents present
- Use REAL cálculo breakdown from spec (taxes $12,076.75, broker $4,508.76, warehouse $6,480.00)

**Sample Tráfico 2: E40-26 (March 2026) — Complete**
- Status: `"complete"`
- 8 partidas from 3 vendors (Cal Faucets, Build.com/Ferguson, JCR Distributors)
- Invoice value: $3,946.40 USD
- Total import cost: $34,724.29 MXN (one consolidated payment)
- TOTO lavatory origin split: 2 from Mexico (0% duty), 8 from India (35% duty = $4,511 extra!)
- All 11 documents present
- Use REAL cálculo breakdown from spec

**Sample Tráfico 3: E52-26 (April 2026) — In Progress**
- Status: `"calculo-received"` (mid-process)
- 3 items from 2 vendors
- Waiting for Roger to approve cálculo and send payment
- Missing: factura, expediente, domestic tracking
- Shows the "active crossing" state in the tracker

**Sample Tráfico 4: E55-26 (April 2026) — Early Stage**
- Status: `"collecting"`
- 2 items arriving at TGR warehouse, not yet sent to broker
- Shows the "pre-broker" state

---

## Important Rules

1. **Do NOT rewrite existing components.** Extend the existing data models — don't replace them. Add new tabs to SlideOuts — don't redesign them. Add the Customs page as a new route — don't merge it into Shipments.

2. **Do NOT change the visual design.** Use the existing dashboard design system: same card styles, dark theme, brand colors (copper/terracotta accents), Lucide icons, Sonner toasts, Framer Motion transitions. Your new page should look like it's always been there.

3. **Use existing component patterns:**
   - `"use client"` directive on all interactive pages
   - `KPICard` for metric cards
   - `SlideOut` for detail panels
   - `@dnd-kit` only if drag-drop is needed (status progression uses buttons, not drag)
   - Status badges with consistent color mapping
   - Tables with hover states and expandable rows

4. **Use existing APIs.** Sheets operations through `dashboard-sheets.ts`. Drive through `google-drive.ts`. Don't create parallel implementations.

5. **Degrade gracefully with sample data.** When Sheets isn't connected, render from `sample-customs-data.ts`. All new features must work in dev without API keys.

6. **All text bilingual.** The customs process uses heavy Spanish terminology. UI labels should use `{ en: string; es: string }` or ternary locale checks. Keep Spanish document names as-is (Cálculo, Factura, Expediente, Tráfico) — these are proper nouns in context.

7. **Financial precision matters.** Exchange rates have 4 decimal places. MXN amounts have 2 decimal places. Pro-rata allocations must sum to exactly 100%. Flag rounding differences (like the $0.30 from the Feb crossing) rather than hiding them.

8. **Reconciliation is non-negotiable.** Every dollar in, every dollar out. Every invoice vs PO. Every cálculo vs factura. Every payment vs estimate. The reconciliation engine runs on every tráfico and surfaces variances with threshold-based flagging.

9. **Broker fees are fixed at $4,508.76.** Both real crossings confirm this. Use it as a baseline but still reconcile — flag if it ever differs.

10. **Crossing fee baseline is $2,668 MXN.** Same across both crossings. Default this in payment forms, editable if different.

11. **Read `AGENTS.md` first** — Next.js breaking changes apply.

12. **After all changes, run `npm run build`** to verify everything compiles.

---

## File Summary — What You're Creating/Modifying

### New Files
| File | Purpose |
|---|---|
| `app/lib/customs-data.ts` | Trafico, PedimentoItem, TraficoStatus, ShipmentLeg, BrokerMessage, ReconciliationCheck interfaces |
| `app/lib/sample-customs-data.ts` | 4 sample tráficos based on real Feb + March 2026 crossings |
| `app/lib/reconciliation.ts` | Reconciliation engine: threshold checks, pro-rata allocation, USMCA savings calc |
| `app/lib/customs-automation.ts` | 16 automation triggers for status transitions and notifications |
| `app/(dashboard)/dashboard/(portal)/customs/page.tsx` | Pedimento Tracker — the main customs dashboard page |
| `app/api/dashboard/traficos/route.ts` | Tráfico list + create API |
| `app/api/dashboard/traficos/[id]/route.ts` | Tráfico get + update API |
| `app/api/dashboard/traficos/[id]/items/route.ts` | Tráfico items CRUD |
| `app/api/dashboard/usmca-certificates/route.ts` | USMCA certificate library API |
| `app/api/dashboard/spanish-manuals/route.ts` | Spanish manual library API |

### Modified Files
| File | Changes |
|---|---|
| `app/lib/sample-dashboard-data.ts` | Add `countryOfOrigin`, `requiresImport`, `hsCode` to DealLineItem. Add `legs`, `traficoId` to DealShipment. Add `importCosts` to ExtendedDealFields. |
| `app/lib/dashboard-sheets.ts` | Add 4 new sheet tabs: Traficos, Trafico_Items, USMCA_Certificates, Spanish_Manuals |
| `app/lib/document-numbers.ts` | Add CC-TRF, CC-PED, CC-CALC document type prefixes |
| `app/(dashboard)/components/sidebar.tsx` | Add "Customs" nav item in Operations section |
| `app/(dashboard)/dashboard/(portal)/shipments/page.tsx` | Multi-leg tracking, customs sub-status expansion, "View in Customs" link |
| `app/(dashboard)/dashboard/(portal)/finance/page.tsx` | Import costs in margin calc, import costs summary section, USMCA savings tracker |
| `app/(dashboard)/dashboard/(portal)/pipeline/page.tsx` | Add "Customs" tab to deal SlideOut |

---

## Success Criteria

When this is done:

**Roger should be able to:**
1. See all active border crossings in one place with real-time status
2. Know exactly which documents are missing for each crossing
3. Review and approve a cálculo, then see payment instructions with pre-filled amounts and bank details
4. See import costs allocated to each customer deal in the P&L
5. Track USMCA savings — how much money certificates saved this year
6. Catch broker overcharges via automatic cálculo-vs-factura reconciliation

**Antonina (bookkeeper) should be able to:**
1. Click "Send to Broker" to compile and email all invoices for a crossing
2. Upload payment receipts and have them auto-matched to the cálculo
3. See a complete document checklist and know what's still needed
4. Reconcile every dollar — invoice vs PO, cálculo vs payment, cálculo vs factura

**The dashboard should automatically:**
1. Create a new Tráfico when imported products ship to TGR warehouse
2. Look up USMCA certificates from the library when origin is confirmed
3. Look up Spanish manuals from the library when products are identified
4. Flag variances between cálculo and factura with threshold-based severity
5. Allocate import costs pro-rata across linked customer deals
6. Update deal P&L to include the true all-in margin (with import costs)
7. Track multi-leg shipments (US carrier to border → domestic carrier to SMA)
8. Calculate estimated delivery: 4-6 weeks from payment confirmation

Go.
