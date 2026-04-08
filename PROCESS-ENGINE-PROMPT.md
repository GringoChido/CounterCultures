# Claude Code Prompt: Counter Cultures Process Engine — The Operational Backbone

Copy everything below this line and paste it into Claude Code as a single prompt.

---

## Task

You are building the **operational process engine** into the Counter Cultures dashboard. This is the system that handles what ACTUALLY happens inside the business — from the moment a customer says "I want that faucet" to the moment the money is in the bank and the books are closed.

The current dashboard has a pipeline kanban, a Stripe page, a Drive file browser, and sample data. But it doesn't model the real business process: multi-brand purchase orders, split payments, manufacturer ordering, shipment tracking, per-deal margin calculations, or any of the decision points Roger faces daily.

You are building the engine underneath. The data models, the pipeline stages, the financial tracking, the PO system, the shipment tracker, and the deal lifecycle.

## Read These First (ALL OF THEM)

1. **Read `AGENTS.md`** — Next.js 16 breaking changes. Check `node_modules/next/dist/docs/` before writing code.
2. **Read `CC-Internal-Process-Map.md`** — **THIS IS YOUR PRIMARY REQUIREMENTS DOCUMENT.** It maps every phase, every decision point, every edge case in the business. Read it cover to cover before writing a single line of code. Everything you build must handle the scenarios described here.
3. **Read `CC-Branded-Assets-Library.md`** — the document types and where they live in Google Drive.
4. **Read `DOCUMENT-WORKSTATION-PROMPT.md`** — the Document Workstation spec. Your work provides the data layer and process logic that the Document Workstation renders and acts on. These two systems must be compatible.

## What Already Exists (DO NOT REWRITE — EXTEND)

### Current Pipeline (pipeline/page.tsx)
- Kanban board with drag-and-drop (@dnd-kit)
- 15 stages focused on the SALES process: target-identified → contacted → conversation-started → qualified → discovery → design-scope → proposal → proposal-sent → negotiation → follow-up-negotiation → verbal-yes → closed-won → won → closed-lost → lost
- Deal SlideOut with contact info, metrics, products, notes
- KPI cards: Active Pipeline, Weighted Value, Closed Won, Active Deals
- **Problem:** Pipeline ends at "won." Nothing after that — no ordering, no fulfillment, no financial close.

### Current Data Model (sample-dashboard-data.ts)
```typescript
interface PipelineDeal {
  id, name, contactName, value, currency, stage, probability
  expectedClose, assignedRep, products, createdAt, notes
  contactCompany?, contactRole?, projectType?, timeline?
  decisionMakerName?, leadSource?, followUpDate?, competitor?, lostReason?
}
```
**Problem:** `products` is a string, not structured data. No concept of line items, dealer costs, margins, brands, quantities. No concept of payments received, POs placed, shipments tracked.

### Current Stripe Page (stripe/page.tsx)
- Reads from Stripe API: payments, customers, payouts, products, invoices
- **Problem:** Stripe data is isolated. No connection between a Stripe payment and a pipeline deal. No margin calculation. No manufacturer cost tracking.

### Current Sheets Tabs (dashboard-sheets.ts)
```typescript
type SheetTab = "Leads" | "Pipeline" | "Contacts" | "Activity_Log" | "Reps" |
  "Trade_Applications" | "Products" | "Content_Calendar" | "Email_Campaigns" |
  "Social_Posts" | "Website_Analytics" | "Sales_Metrics" | "Marketing_Metrics" |
  "Settings" | "Documents";
```

### Current Document System (document-numbers.ts)
- Auto-numbering: CC-Q-YYYY-NNN, CC-INV-YYYY-NNN, CC-PO-YYYY-NNN, CC-DR-YYYY-NNN
- DocumentRecord interface with basic fields
- Already imported in pipeline/page.tsx

---

## What to Build

### 1. Extended Data Models

**File:** `app/lib/sample-dashboard-data.ts` — extend existing types

#### A. Restructured PipelineDeal

The deal needs to carry structured product data, financial tracking, and fulfillment status:

```typescript
// ADD these new types alongside existing ones (don't remove existing types)

export type FulfillmentStage =
  | "quote-approved"     // Customer said yes
  | "deposit-invoiced"   // Deposit invoice sent
  | "deposit-received"   // Deposit payment cleared
  | "pos-placed"         // Purchase orders sent to manufacturers
  | "in-production"      // Manufacturers processing (esp. custom orders)
  | "shipping"           // Products in transit to CC
  | "received-at-cc"     // Arrived at showroom, inspection pending
  | "quality-checked"    // Inspected, all good (or issues flagged)
  | "delivery-scheduled" // Delivery date set with customer
  | "delivered"          // Products handed off to customer
  | "balance-invoiced"   // Balance invoice sent (for split-pay deals)
  | "fully-paid"         // All money collected
  | "complete"           // Everything done — books closed
  | "issue"              // Post-delivery problem

export type PaymentStructure = "full-upfront" | "fifty-fifty" | "net-30" | "custom";

export interface DealLineItem {
  id: string;
  productName: string;
  sku: string;
  brand: string;
  finish?: string;
  quantity: number;
  dealerCost: number;        // From Master Price List
  quotedPrice: number;       // What customer pays (Roger sets this)
  msrp: number;              // Reference
  mapPrice?: number;         // Minimum advertised price
  shippingCost: number;      // Per-item or estimated
  leadTime?: string;         // "3-4 weeks"
  status: "current" | "special-order" | "custom" | "discontinued";
  marginAmount: number;      // quotedPrice - dealerCost (auto-calculated)
  marginPercent: number;     // marginAmount / quotedPrice * 100 (auto-calculated)
}

export interface DealPayment {
  id: string;
  type: "deposit" | "balance" | "full" | "installment";
  invoiceId: string;         // CC-INV-2026-001A
  stripeInvoiceId?: string;  // Stripe's invoice ID
  stripePaymentId?: string;  // Stripe's payment intent ID
  amount: number;
  currency: string;
  stripeFees?: number;       // 3.6% + $3 MXN
  netReceived?: number;      // amount - stripeFees
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | "refunded";
  dueDate?: string;
  paidDate?: string;
  installmentNumber?: number; // For custom installments: 1 of 3, 2 of 3, etc.
}

export interface PurchaseOrder {
  id: string;                // CC-PO-2026-001
  dealId: string;
  brand: string;
  manufacturerName: string;
  manufacturerContact?: string;
  items: {
    sku: string;
    productName: string;
    finish?: string;
    quantity: number;
    dealerCost: number;
  }[];
  totalAmount: number;       // Sum of items × dealerCost
  currency: string;
  status: "draft" | "sent" | "confirmed" | "paid-to-manufacturer" | "in-production" | "shipped" | "received" | "issue";
  sentDate?: string;
  confirmedDate?: string;
  paymentToMfr?: {
    date: string;
    amount: number;
    method: string;          // "wire" | "credit-card" | "credit-account"
    reference: string;
  };
  shipTo: "cc-showroom" | "customer-direct";
  requestedDeliveryDate?: string;
  estimatedShipDate?: string;
  trackingCarrier?: string;
  trackingNumber?: string;
  receivedDate?: string;
  receivedCondition?: "good" | "damaged" | "wrong-item" | "partial";
  receivedNotes?: string;
  driveFileId?: string;      // PO document in Drive
}

export interface DealShipment {
  id: string;
  dealId: string;
  poId: string;              // Which PO this shipment is from
  brand: string;
  carrier?: string;
  trackingNumber?: string;
  status: "label-created" | "in-transit" | "customs" | "out-for-delivery" | "delivered-to-cc" | "delivered-to-customer";
  shipDate?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  destination: "cc-showroom" | "customer-direct";
  items: { sku: string; productName: string; quantity: number }[];
  inspectionStatus?: "pending" | "passed" | "damaged" | "wrong-item";
  inspectionNotes?: string;
  inspectionPhotos?: string[]; // Drive file IDs
}

// Extended PipelineDeal — add these fields to the EXISTING interface
// (keep all existing fields, add new optional ones)
export interface ExtendedDealFields {
  // Structured product data
  lineItems?: DealLineItem[];

  // Financial
  paymentStructure?: PaymentStructure;
  payments?: DealPayment[];
  customerType?: "retail" | "trade";
  dealCurrency?: "MXN" | "USD";
  taxRate?: number;           // IVA percentage (default 16)

  // Fulfillment
  fulfillmentStage?: FulfillmentStage;
  purchaseOrders?: PurchaseOrder[];
  shipments?: DealShipment[];
  deliveryStrategy?: "as-available" | "consolidate";
  deliveryDate?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;

  // Financial summary (calculated)
  totalQuoted?: number;
  totalDealerCost?: number;
  totalShipping?: number;
  totalStripeFees?: number;
  totalCollected?: number;
  totalPaidToManufacturers?: number;
  netMargin?: number;
  marginPercent?: number;

  // Versioning
  quoteVersions?: { version: number; docId: string; status: "active" | "superseded" }[];
}
```

**Implementation:** Extend the existing `PipelineDeal` interface by adding the `ExtendedDealFields` as optional properties. This way existing code doesn't break — new fields are progressively adopted.

#### B. New Sheet Tabs

Add to the `SheetTab` type in `dashboard-sheets.ts`:

```typescript
| "Purchase_Orders"   // PO tracking
| "Shipments"         // Shipment tracking
| "Deal_Payments"     // Payment tracking per deal (not just Stripe)
| "Manufacturers"     // Manufacturer contact info + ordering methods
```

**Purchase_Orders columns:**
`PO_ID, Deal_ID, Brand, Manufacturer, Items_JSON, Total_Amount, Currency, Status, Sent_Date, Confirmed_Date, Payment_Date, Payment_Method, Payment_Ref, Payment_Amount, Ship_To, Requested_Delivery, Estimated_Ship, Carrier, Tracking, Received_Date, Condition, Notes, Drive_File_ID`

**Shipments columns:**
`Shipment_ID, Deal_ID, PO_ID, Brand, Carrier, Tracking, Status, Ship_Date, Est_Arrival, Actual_Arrival, Destination, Items_JSON, Inspection_Status, Inspection_Notes, Photo_IDs`

**Deal_Payments columns:**
`Payment_ID, Deal_ID, Type, Invoice_ID, Stripe_Invoice_ID, Stripe_Payment_ID, Amount, Currency, Stripe_Fees, Net_Received, Status, Due_Date, Paid_Date, Installment_Num`

**Manufacturers columns:**
`Brand, Manufacturer_Name, Contact_Name, Contact_Email, Contact_Phone, Order_Method, Payment_Terms, Default_Lead_Time, Notes`

### 2. Extended Pipeline Stages

**File:** `app/lib/sample-dashboard-data.ts` and `app/(dashboard)/dashboard/(portal)/pipeline/page.tsx`

The current pipeline ends at "won." Real business continues for weeks after. Add post-sale stages:

```typescript
// Add to PipelineStage type
export type PipelineStage =
  // ... existing stages ...
  // Post-sale stages (NEW)
  | "quote-approved"
  | "deposit-pending"
  | "deposit-received"
  | "ordering"           // POs being placed with manufacturers
  | "in-production"      // Waiting on manufacturers
  | "shipping"           // Products in transit
  | "received"           // At CC showroom, inspecting
  | "delivery-scheduled"
  | "delivered"
  | "balance-pending"    // Waiting for final payment (split-pay deals)
  | "complete"           // All paid, all delivered, books closed
  | "post-delivery-issue"
```

**In the pipeline Kanban UI:**

The current kanban shows all stages as columns. With 15 + 12 new stages = 27 total, that's too many columns.

**Solution: Two-view pipeline.**

Add a **view toggle** at the top of the pipeline page:
- **Sales View** (default): Shows the existing sales stages (target-identified through won/lost). This is the deal-winning pipeline.
- **Operations View** (new): Shows the post-sale fulfillment stages (quote-approved through complete). This is the deal-fulfilling pipeline.

Both views show the same deals — just different stages. A deal in "won" on the Sales View appears as "quote-approved" on the Operations View. It flows through Operations until "complete."

**In stageConfig, add the new stages:**

```typescript
// Post-sale stages
"quote-approved":      { label: "Quote Approved",    color: "text-emerald-400", bgColor: "bg-emerald-400" },
"deposit-pending":     { label: "Deposit Pending",   color: "text-amber-400",   bgColor: "bg-amber-400" },
"deposit-received":    { label: "Deposit Received",  color: "text-green-400",   bgColor: "bg-green-400" },
"ordering":            { label: "Ordering",           color: "text-blue-400",    bgColor: "bg-blue-400" },
"in-production":       { label: "In Production",     color: "text-violet-400",  bgColor: "bg-violet-400" },
"shipping":            { label: "Shipping",           color: "text-cyan-400",    bgColor: "bg-cyan-400" },
"received":            { label: "Received at CC",    color: "text-teal-400",    bgColor: "bg-teal-400" },
"delivery-scheduled":  { label: "Delivery Scheduled", color: "text-indigo-400", bgColor: "bg-indigo-400" },
"delivered":           { label: "Delivered",          color: "text-green-400",   bgColor: "bg-green-400" },
"balance-pending":     { label: "Balance Pending",   color: "text-amber-400",   bgColor: "bg-amber-400" },
"complete":            { label: "Complete",           color: "text-emerald-500", bgColor: "bg-emerald-500" },
"post-delivery-issue": { label: "Issue",             color: "text-red-400",     bgColor: "bg-red-400" },
```

### 3. Deal Detail Panel — Operations Tab

**File:** Extend the SlideOut in `pipeline/page.tsx`

The deal SlideOut currently shows: contact info, deal metrics, products, notes. Add tabs:

**Tab 1: Details** (existing content, keep as-is)

**Tab 2: Line Items** (new)
- Structured product table replacing the simple `products` string
- Columns: Product, Brand, Finish, Qty, Dealer Cost, Quoted Price, Margin %, Shipping, Lead Time, Status
- Add/remove rows with product search autocomplete (searches Products sheet)
- Totals row at bottom
- "Recalculate Margins" button that refreshes dealer costs from Master Price List
- Deal margin summary box (total quoted, total dealer cost, total shipping, estimated Stripe fees, net margin)

**Tab 3: Payments** (new)
- Shows all DealPayment records for this deal
- Each row: Invoice #, Type (Deposit/Balance/Full), Amount, Status badge, Due Date, Paid Date, Stripe Fees, Net
- Summary at top: Total Due, Total Collected, Outstanding, Stripe Fees, Net Received
- Quick actions: "Create Deposit Invoice" / "Create Balance Invoice" / "Send Payment Reminder"
- If a payment is overdue: red badge + days overdue

**Tab 4: Purchase Orders** (new)
- Shows all PurchaseOrder records for this deal, grouped by brand
- Each PO row: PO #, Brand, # Items, Total (dealer cost), Status, Sent Date, Payment Status
- Per-PO detail expand: item list, manufacturer contact, tracking info
- Quick actions: "Generate POs from Line Items" (auto-splits by brand), "Mark as Sent", "Record Manufacturer Payment"
- If POs not yet generated: prominent "Generate POs" button with explanation

**Tab 5: Shipments** (new)
- Shows all DealShipment records
- Each row: PO reference, Brand, Carrier, Tracking #, Status, ETA
- Visual timeline per shipment: Shipped → In Transit → Customs → At CC → Inspected → Delivered
- Consolidation indicator: "Waiting for 1 more shipment before delivery" (if delivery strategy = consolidate)
- Quick actions: "Mark Received", "Log Inspection", "Schedule Delivery"

**Tab 6: Documents** (from Document Workstation prompt — reference only, built separately)

**Tab 7: Financial Summary** (new)
- The "Closing the Books" view from the Internal Process Map
- Three sections:

```
─── MONEY IN ───────────────────────────
Invoice CC-INV-2026-001A (deposit):  $72,500 MXN  ✅ Paid Apr 3
Invoice CC-INV-2026-001B (balance):  $72,500 MXN  ⏳ Due May 15
Stripe fees:                         -$2,613 MXN
Net collected:                       $69,887 MXN (of $139,777 expected)

─── MONEY OUT ──────────────────────────
PO CC-PO-2026-001 (Brizo):          $38,000 MXN  ✅ Paid to mfr
PO CC-PO-2026-002 (TOTO):           $22,000 MXN  ✅ Paid to mfr
PO CC-PO-2026-003 (Cal Faucets):    $15,000 MXN  ⏳ Not yet paid
Total manufacturer cost:              $75,000 MXN

─── DEAL P&L ───────────────────────────
Total quoted:          $145,000 MXN
Stripe fees:           -$5,223 MXN
Manufacturer costs:    -$75,000 MXN
Shipping:              -$8,500 MXN
────────────────────────────────────────
Net profit:            $56,277 MXN
Margin:                38.8%
Status:                ⚠️ Balance outstanding, 1 PO unpaid
```

- Deal completion checklist at the bottom:
  - [ ] All products delivered
  - [ ] Customer confirmed receipt
  - [ ] All payments collected (100%)
  - [ ] All manufacturers paid
  - [ ] No open issues
  - When all checked: "Mark Deal Complete" button

### 4. Finance Dashboard Enhancement

**File:** Create new page `app/(dashboard)/dashboard/(portal)/finance/page.tsx`

Add "Finance" to sidebar navigation in `sidebar.tsx` (insert below Stripe).

This is the finance person's home base. NOT the Stripe page (which shows raw Stripe data). This page shows business financial health.

**KPI cards:**
- Revenue This Month (from Deal_Payments where status = paid, this month)
- Outstanding Invoices (total amount where status = sent or overdue)
- Manufacturer Payables (POs confirmed but not yet paid to manufacturer)
- Average Deal Margin % (across completed deals)

**Sections:**

**A. Outstanding Invoices Table**
- All invoices with status "sent" or "overdue"
- Columns: Invoice #, Customer, Deal, Amount, Due Date, Days Outstanding, Status
- Overdue rows highlighted red
- Actions: "Send Reminder", "Open in Preview", "Mark Paid" (manual fallback if Stripe webhook missed)

**B. Manufacturer Payables Table**
- All POs with status "confirmed" or "in-production" where payment_to_mfr is empty
- Columns: PO #, Brand/Manufacturer, Amount (dealer cost), Deal Reference, Confirmed Date, Notes
- Actions: "Record Payment" (opens modal: date, amount, method, reference number)

**C. Completed Deals This Month**
- Deals where stage = "complete" this month
- Columns: Deal Name, Customer, Revenue, Stripe Fees, Mfr Costs, Shipping, Net Margin, Margin %
- Totals row at bottom
- Bar chart: margin by brand (which brands are most profitable?)

**D. Cash Flow Summary**
- Simple view: Money In (this month) vs Money Out (this month) vs Net
- Money In = sum of DealPayments paid this month
- Money Out = sum of PO payments to manufacturers this month
- Net = difference

### 5. Shipment Tracker Page

**File:** Create new page `app/(dashboard)/dashboard/(portal)/shipments/page.tsx`

Add "Shipments" to sidebar navigation (insert below Stripe or below new Finance page).

This tracks all in-flight shipments across all deals.

**KPI cards:**
- In Transit (count of shipments with status in-transit or customs)
- At CC Showroom (received, awaiting inspection or delivery)
- Deliveries This Week (scheduled)
- Issues (damaged, wrong item)

**Main view: Active Shipments table**
- Columns: PO #, Brand, Customer/Deal, Carrier, Tracking #, Status, ETA, Destination
- Status badges with colors matching the visual timeline
- Click row → expand to show items, inspection status, delivery details
- Actions per shipment: "Track" (opens carrier tracking page), "Mark Received", "Log Issue", "Schedule Delivery"

**Filter bar:** By status, by brand, by deal, by date range

### 6. Auto-Transitions & Webhooks

**File:** Create `app/lib/deal-automation.ts`

Logic for automatic stage transitions and notifications:

```typescript
// When Stripe webhook confirms payment:
onPaymentReceived(stripePaymentId) {
  // Find the DealPayment matching this Stripe payment
  // Update payment status to "paid"
  // If this was the deposit → move deal to "deposit-received"
  // If this was the balance → move deal to "fully-paid"
  // If full-upfront → move deal to "deposit-received" (skip deposit-pending)
  // Send confirmation to customer (email + WhatsApp)
  // Notify Roger
  // Log activity
}

// When Roger marks a PO as "sent":
onPOSent(poId) {
  // If ALL POs for this deal are sent → move deal to "ordering"
  // Log activity
}

// When all POs for a deal are "confirmed":
onAllPOsConfirmed(dealId) {
  // Move deal to "in-production" (or "shipping" if already shipped)
}

// When a shipment is marked "delivered-to-cc":
onShipmentReceived(shipmentId) {
  // Move deal to "received" (if all shipments for this deal are received)
  // Trigger inspection reminder
}

// When deal is marked "delivered":
onDelivered(dealId) {
  // If payment structure is "fifty-fifty" and balance not yet invoiced:
  //   → Auto-create balance invoice
  //   → Move deal to "balance-pending"
  // If fully paid:
  //   → Move deal to "delivered" (awaiting completion checklist)
  // Schedule 7-day follow-up
}

// Overdue payment detection (run daily or on page load):
checkOverduePayments() {
  // Find all DealPayments where status = "sent" and dueDate < today
  // Update status to "overdue"
  // If 7 days overdue → send reminder
  // If 14 days overdue → send stronger reminder
  // If 30 days overdue → notify Roger, flag deal
}
```

**Implementation:** These can be helper functions called from the relevant UI actions and from a Stripe webhook handler. For the overdue check, run it when the Finance page loads.

### 7. Stripe Webhook Enhancement

**File:** Extend `app/api/stripe/webhook/route.ts` (or create if it doesn't exist)

When Stripe sends a payment confirmation:
1. Look up the Deal_Payment record by Stripe invoice ID
2. Update payment status to "paid", record paid date
3. Calculate and store Stripe fees
4. Update deal's total collected
5. Trigger `onPaymentReceived` automation
6. Log activity

### 8. Sample Data for Development

**File:** Extend `app/lib/sample-dashboard-data.ts`

Create 3-4 sample deals that span the FULL process — not just the sales pipeline:

**Sample Deal 1: "Arq. Carolina Mendoza — Kitchen Remodel" (Active, mid-fulfillment)**
- 5 line items across 3 brands (Brizo, TOTO, California Faucets)
- 50/50 payment: deposit paid, balance pending
- 2 POs sent and confirmed (Brizo paid, TOTO paid), 1 PO pending (Cal Faucets — custom finish)
- 1 shipment delivered to CC (TOTO), 1 in transit (Brizo), 1 in production (Cal Faucets)
- Fulfillment stage: "in-production" (waiting on custom finish)
- Shows realistic margin calculation with Stripe fees

**Sample Deal 2: "Hotel Boutique San Miguel — 12 Bathrooms" (Large, complex)**
- 15+ line items, 4 brands, high value ($800K+ MXN)
- Custom installment payments (3 installments)
- Multiple POs, staggered ordering
- Shows multi-phase project complexity

**Sample Deal 3: "Luis Torres — Master Bath" (Simple, near-complete)**
- 3 line items, 1 brand
- Full upfront payment: paid
- 1 PO, 1 shipment, delivered
- Fulfillment stage: "complete"
- Shows the finished state — all checkboxes green

**Sample Deal 4: "Diana Reyes — Guest Bathroom" (Problem deal)**
- Damaged shipment scenario
- One product discontinued after quote
- Balance overdue
- Shows edge case handling

---

## Important Rules

1. **Do NOT rewrite existing components from scratch.** Extend the PipelineDeal interface — don't replace it. Add new tabs to the SlideOut — don't redesign it. Add new stages — don't remove old ones. Existing code must keep working.
2. **Do NOT change the visual design.** Use the existing dashboard design system: the same card styles, colors, fonts, badges, table patterns. Your new pages and tabs should look like they've always been there.
3. **Use existing patterns.** Client components with `"use client"`, Framer Motion for animations, Lucide React for icons, Sonner for toasts, @dnd-kit for drag-drop, KPICard for metrics, SlideOut for detail panels.
4. **Use existing APIs.** Sheets operations through `dashboard-sheets.ts`. Stripe through existing `/api/stripe/` routes. Drive through `google-drive.ts`. Don't create parallel implementations.
5. **Degrade gracefully.** When Sheets/Stripe aren't connected, use sample data. Your new features should render with sample data so development works without API keys.
6. **All text bilingual.** Use `{ en: string; es: string }` objects or ternary locale checks.
7. **Margin calculations must be precise.** Stripe fees are 3.6% + $3 MXN per transaction. Include them in every margin calculation. Display both gross margin (before fees) and net margin (after fees). Never show the customer dealer costs or margins — internal view only.
8. **Read `AGENTS.md` first** — Next.js 16 breaking changes.
9. **After all changes, run `npm run build`** to verify everything compiles.

---

## File Summary — What You're Creating/Modifying

### New Files
- `app/(dashboard)/dashboard/(portal)/finance/page.tsx` — Finance dashboard
- `app/(dashboard)/dashboard/(portal)/shipments/page.tsx` — Shipment tracker
- `app/lib/deal-automation.ts` — Auto-transition and notification logic
- `app/api/dashboard/purchase-orders/route.ts` — PO CRUD API
- `app/api/dashboard/shipments/route.ts` — Shipment CRUD API
- `app/api/dashboard/deal-payments/route.ts` — Payment tracking API

### Modified Files
- `app/lib/sample-dashboard-data.ts` — Extended types + 4 sample deals with full process data
- `app/lib/dashboard-sheets.ts` — New sheet tabs (Purchase_Orders, Shipments, Deal_Payments, Manufacturers)
- `app/(dashboard)/dashboard/(portal)/pipeline/page.tsx` — Sales/Operations view toggle, new post-sale stages, extended deal SlideOut with Line Items / Payments / POs / Shipments / Financial Summary tabs
- `app/(dashboard)/components/sidebar.tsx` — Add Finance and Shipments to navigation
- `app/lib/document-numbers.ts` — Extend DocumentRecord interface with Version, Parent_Doc_ID, Brand, Dealer_Cost_Total, Margin_Amount, Margin_Percent fields
- `app/api/stripe/webhook/route.ts` — Payment received → deal automation

---

## Success Criteria

When this is done, Roger should be able to:

1. **Win a deal** on the Sales pipeline, and it automatically appears on the Operations pipeline as "Quote Approved"
2. **See per-item margins** on every deal — which products make money, which don't
3. **Generate POs split by brand** from a single deal with one click
4. **Track manufacturer payments** — what's been paid, what's outstanding, what's the cash flow
5. **Track shipments** from 3 different manufacturers converging for one customer
6. **See the financial summary** of any deal: money in, money out, Stripe fees, net margin
7. **Know when an invoice is overdue** without checking Stripe manually
8. **Close a deal** with a completion checklist that ensures nothing is missed

The finance person should be able to:

1. **See all outstanding invoices** in one place with days overdue
2. **See all manufacturer payables** — who needs to be paid and when
3. **Record manufacturer payments** with date, method, and reference
4. **See this month's P&L** — revenue, costs, margins by deal and by brand

Go.
