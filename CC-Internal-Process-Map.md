# Counter Cultures — Internal Process Map

## The Real Workflow: From "I Want That Faucet" to Money in the Bank

This document maps what ACTUALLY happens inside Counter Cultures when a customer wants to buy something. Not the happy path. The real path — with every decision point, branch, edge case, and handoff.

The dashboard needs to handle ALL of this.

---

## PHASE 1: THE INQUIRY

### Trigger: A lead comes in

A customer reaches out through one of six channels:
- Website contact form
- AI chatbot conversation
- WhatsApp message (2am, in Spanish, about a TOTO toilet)
- Showroom walk-in
- Trade program application
- Referral from an architect

**What the dashboard does automatically:**
- Creates a lead record in the CRM (Leads sheet)
- Tags the source channel
- Sends Roger a notification (email + WhatsApp)
- If chatbot: captures the conversation transcript and any product interests
- If trade application: flags as trade lead with different pricing tier

**What Roger does manually:**
- Reviews the lead
- Reads the inquiry — what are they actually looking for?
- Checks: is this a homeowner, an architect, a designer, a contractor?
- Decides: is this worth pursuing or is it a tire-kicker?

### Decision Point: Qualify the Lead

```
Is this a real buyer?
├── YES → Move to Pipeline (stage: Qualified)
│         Roger adds: project type, estimated value, timeline, notes
│
├── MAYBE → Nurture
│           Roger responds with info, adds to follow-up queue
│           Dashboard schedules follow-up reminder (3 days, 7 days)
│
└── NO → Archive
          Polite response, lead stays in CRM for future reference
```

---

## PHASE 2: DISCOVERY & SCOPING

### What Roger needs to figure out before he can quote

This is where it gets real. The customer says "I want to redo my kitchen." That means Roger needs to uncover:

**The Product Selection Problem:**
- What specific products do they want? (Brand? Model? Finish?)
- Do they know what they want, or do they need guidance?
- Are the products they want in the current catalog (491 products)?
- If not — can Counter Cultures source it? (Special order from a brand they carry? A brand they don't carry?)
- What finishes are available? (A faucet might come in 14 finishes — customer needs to pick)
- Are there compatibility issues? (This sink only works with these faucet models)

**The Availability Problem:**
- Is this product currently manufactured? (Check: is SKU status "CURRENT" in Master Price List?)
- Has the price changed since the Price List was last synced?
- What's the manufacturer's current lead time for this specific product?
- Is there any stock in-country, or does it ship from the US/Europe/Asia?

**The Pricing Problem:**
- What's the dealer cost? (Master Price List: Dealer Cost column)
- What's the MAP price? (Minimum Advertised Price — some brands enforce this)
- Is this a trade client? (Different margin structure — preferred pricing)
- Is this a retail customer? (Full MSRP or negotiated?)
- Are there volume discounts? (Buying 8 of the same faucet for a hotel project)
- What are the shipping costs? (Varies by brand, weight, origin country)
- Are there import duties or customs fees? (International brands shipping to Mexico)

**What the dashboard should help with:**
- Product search with real-time pricing from the Master Price List
- Dealer cost, MSRP, MAP, and calculated margin displayed per product
- Availability status check (Current / Discontinued / Special Order)
- AI assistant: "What's the dealer cost on the Brizo Litze faucet in Luxe Gold?"
- Shipping cost estimates by brand/product category
- Trade vs. retail pricing toggle

### Decision Point: Can We Fulfill This?

```
Can Counter Cultures supply everything the customer wants?
│
├── YES, all from current catalog
│   → Straightforward quote. Proceed to Phase 3.
│
├── PARTIALLY — some items are special order
│   → Roger contacts manufacturer rep for availability + lead time
│   → Gets a special order quote from manufacturer
│   → May require manufacturer prepayment
│   → Longer lead time communicated to customer
│   → Flag these line items as "Special Order" on the quote
│
├── PARTIALLY — customer wants a brand CC doesn't carry
│   → Roger decides: can we source it through a distributor?
│   → If yes: get pricing, add margin, include in quote
│   → If no: recommend alternative from catalog, or decline that line item
│
└── NO — completely outside CC's scope
    → Refer to another vendor, maintain relationship
```

---

## PHASE 3: BUILDING THE QUOTE

### This is where the Document Workstation earns its keep

Roger is now building a quote. Here's what's actually involved:

**Step 1: Product Line Items**

For EACH product on the quote:

| Field | Source | Who enters it |
|---|---|---|
| Product name + SKU | Master Price List / catalog | Auto-populated from product search |
| Brand | Master Price List | Auto-populated |
| Finish / variant | Customer selection | Roger selects |
| Quantity | Customer request | Roger enters |
| Dealer cost | Master Price List | Auto-populated (hidden from customer) |
| MSRP | Master Price List | Auto-populated |
| Quoted price | Roger's decision | Roger enters (between dealer cost and MSRP) |
| Margin $ | Calculated | Auto: Quoted Price - Dealer Cost |
| Margin % | Calculated | Auto: (Quoted - Dealer) / Quoted × 100 |
| Shipping cost | Estimate by brand | Roger enters or auto-estimate |
| Lead time | Manufacturer data | Roger enters |
| Status | Catalog check | Auto: Current / Special Order |

**Step 2: Quote-Level Calculations**

```
Subtotal (all line items)
+ Shipping (sum of per-item or flat rate)
+ IVA (16% Mexican tax — on the full amount? on products only? Roger needs to decide policy)
= TOTAL QUOTED TO CUSTOMER

Internal tracking (not on quote):
  Total Dealer Cost (what CC pays manufacturers)
  Total Margin (Total Quoted - Total Dealer Cost - Shipping Cost)
  Margin % (overall deal profitability)
```

**Step 3: Quote Terms**

Roger needs to decide (and the quote template needs to support):
- **Payment structure:**
  - Full upfront (simple, CC collects before ordering)
  - 50/50 (50% deposit to start order, 50% on delivery)
  - Net 30 (trade clients only — CC fronts the order, collects later)
  - Custom installments (large projects)
- **Quote validity:** How long is this price good for? (15 days? 30 days? Manufacturer prices can change)
- **Delivery estimate:** Per-item or total project (varies by manufacturer lead time + shipping)
- **Currency:** MXN or USD? (Some trade clients prefer USD. Exchange rate implications.)
- **What's included:** Just product? Product + shipping? Product + shipping + installation referral?
- **What's NOT included:** Installation, plumbing work, demolition, etc. (liability protection)

### Decision Point: Quote Variations

```
Quote built. Now what?
│
├── Single version, customer approves → Phase 4
│
├── Customer wants changes
│   → Roger creates Quote v2 (or v3, v4...)
│   → Previous versions archived in Drive, marked as "Superseded"
│   → Documents sheet tracks version history
│   → Only the latest version is "Active"
│
├── Customer wants to remove items
│   → Roger creates revised quote with fewer line items
│   → Margin recalculated
│
├── Customer asks for a discount
│   → Roger checks: what's my margin on this deal?
│   → How low can I go? (Floor = dealer cost + shipping + minimum margin)
│   → Apply discount: per-item, flat amount, or percentage off total
│   → New quote version generated
│
├── Customer goes silent
│   → Dashboard auto-reminder: follow up in 3 days
│   → If no response: follow up in 7 days
│   → If still nothing: follow up in 14 days with "pricing may change" nudge
│   → After 30 days: pipeline stage → "Stale", notification to Roger
│
└── Customer says no
    → Pipeline → Lost. Log reason. Archive quote. Learn from it.
```

---

## PHASE 4: INVOICING & PAYMENT COLLECTION

### From approved quote to money in the bank

Customer says "yes, let's do it." Now:

**Step 1: Generate Invoice from Quote**

The invoice should pull directly from the approved quote — not be rebuilt from scratch. One click: "Convert Quote to Invoice."

| Quote Field | Invoice Field |
|---|---|
| Quote number CC-Q-2026-001 | References: "Per Quote CC-Q-2026-001" |
| Line items + pricing | Same line items + pricing |
| Total | Invoice total |
| Payment terms from quote | Payment schedule on invoice |
| — | Invoice number: CC-INV-2026-001 |
| — | Due date (based on terms) |
| — | Stripe payment link |

**Step 2: Payment Structure Handling**

This is where it gets complicated and where the dashboard really matters.

```
What's the payment structure?
│
├── FULL UPFRONT
│   → One Stripe invoice for 100% of total
│   → Customer pays → Stripe confirms → Pipeline: "Paid"
│   → Finance dashboard: full amount collected
│   → Proceed to manufacturer ordering
│
├── 50/50 SPLIT
│   → Invoice 1: 50% deposit (CC-INV-2026-001A)
│   │   → Stripe payment link sent
│   │   → Customer pays deposit
│   │   → Pipeline: "Deposit Received"
│   │   → Finance: 50% collected, 50% outstanding
│   │   → Roger can now order from manufacturers (has deposit as security)
│   │
│   → Invoice 2: 50% balance (CC-INV-2026-001B)
│       → Triggered when: order is ready for delivery / products arrive
│       → Stripe payment link sent
│       → Customer pays balance
│       → Pipeline: "Fully Paid"
│       → Finance: 100% collected
│       → Release delivery
│
├── NET 30 (Trade only)
│   → Full invoice sent, due in 30 days
│   → Roger orders from manufacturers immediately (CC fronts the cost)
│   → Finance dashboard: amount outstanding, due date, days remaining
│   → Auto-reminder at 7 days before due
│   → Auto-reminder on due date
│   → Auto-escalation if 15 days overdue → Roger notified
│   → RISK: CC has paid manufacturers but hasn't collected from client
│
├── CUSTOM INSTALLMENTS (Large projects)
│   → Multiple Stripe invoices with scheduled due dates
│   → Each installment tracked separately in Finance
│   → Dashboard shows: installment 1 ✅ paid, installment 2 ⏳ due Apr 15, installment 3 📅 May 15
│   → Manufacturer ordering may be staged to match installment schedule
│
└── CURRENCY SPLIT
    → Customer pays in USD, Roger pays manufacturers in USD, margin tracked in MXN
    → OR: customer pays in MXN, Roger pays some manufacturers in USD
    → Exchange rate recorded at time of each transaction
    → Margin calculation must account for currency conversion
```

**Step 3: What Stripe Actually Does**

- Roger creates invoice in dashboard → Stripe API generates it
- Invoice includes: CC branding, line items, total, payment link
- Customer receives via email (Resend) and/or WhatsApp (share link)
- Customer pays via card or bank transfer
- Stripe webhook fires → dashboard receives payment confirmation
- Pipeline auto-updates stage
- Finance dashboard updates: revenue in, payout pending
- Stripe fees deducted: 3.6% + $3 MXN per transaction (track this — it affects real margin)

**Step 4: Payment Tracking in Finance Dashboard**

For every deal, the finance person needs to see:

```
MONEY IN (from customer):
  Invoice total:        $145,000 MXN
  Stripe fees:          -$5,223 MXN (3.6% + $3)
  Net received:         $139,777 MXN
  Payment status:       Deposit received ($72,500) / Balance pending ($72,500)

MONEY OUT (to manufacturers):
  Brand A (Brizo):      $38,000 MXN dealer cost — PO sent, awaiting invoice
  Brand B (TOTO):       $22,000 MXN dealer cost — paid, confirmed
  Brand C (Cal Faucets): $15,000 MXN dealer cost — not yet ordered
  Total cost:           $75,000 MXN

MARGIN:
  Gross margin:         $145,000 - $75,000 = $70,000 MXN (48.3%)
  After Stripe fees:    $139,777 - $75,000 = $64,777 MXN (44.7%)
  Status:               ⚠️ Brizo PO unpaid — margin at risk until fulfilled
```

---

## PHASE 5: ORDERING FROM MANUFACTURERS

### The part nobody sees but everything depends on

Customer has paid (or paid the deposit). Now Roger needs to actually order the products.

**The Multi-Brand Problem:**

A single customer order might include products from 3 different brands. That means:

```
Customer Order: Arq. Carolina Mendoza — Kitchen Remodel
│
├── Brizo (faucet + pot filler)
│   → Manufacturer: Brizo / Delta Faucet (US)
│   → Contact: [manufacturer rep]
│   → Order method: dealer portal? email? phone?
│   → Payment terms: prepay? net 30? credit account?
│   → Lead time: 3-4 weeks
│   → Ships from: Indianapolis, USA → SMA, Mexico
│   → Import duties: yes (customs broker needed?)
│
├── TOTO (toilet + bidet seat)
│   → Manufacturer: TOTO USA
│   → Different contact, different portal, different terms
│   → Lead time: 2-3 weeks
│   → Ships from: Morrow, Georgia, USA
│
└── California Faucets (custom finish shower system)
    → Manufacturer: California Faucets (Huntington Beach, CA)
    → CUSTOM FINISH = longer lead time (6-8 weeks)
    → May require 50% prepay to manufacturer
    → Ships from: California, USA
```

**For EACH manufacturer/brand in the order:**

**Step 1: Create Purchase Order**

| PO Field | Source |
|---|---|
| PO number | Auto: CC-PO-2026-001 |
| Manufacturer name | From product brand |
| Products + SKUs | From approved quote line items for this brand |
| Quantities | From quote |
| Dealer cost per item | Master Price List |
| Total PO amount | Calculated |
| Ship-to address | CC showroom OR customer direct (Roger decides) |
| Requested delivery date | Based on project timeline |
| Customer reference | "For: Carolina Mendoza — Kitchen Remodel" (internal, not shown to mfr) |

**Step 2: Send PO to Manufacturer**

```
How does this manufacturer accept orders?
│
├── Dealer portal (Kohler, TOTO, some others)
│   → Roger logs into portal, enters order
│   → PO from dashboard = Roger's reference document
│   → Portal gives confirmation number → Roger enters it in dashboard
│
├── Email to sales rep
│   → Roger sends PO PDF to manufacturer rep
│   → Rep confirms via email
│   → Roger updates dashboard: PO confirmed, expected ship date
│
└── Phone call + email follow-up
    → Roger calls rep, discusses order
    → Sends PO as formal confirmation
    → Roger updates dashboard with details
```

**Step 3: Pay the Manufacturer**

```
What are this manufacturer's payment terms?
│
├── Prepay required (common for custom/special orders)
│   → Finance person sends wire/transfer for dealer cost amount
│   → Dashboard: PO status → "Paid to Manufacturer"
│   → Record: payment date, amount, method, reference number
│   → MARGIN RISK: CC has paid out, customer balance may still be outstanding
│
├── Net 30 from manufacturer (CC has a credit account)
│   → Order placed, manufacturer ships
│   → Invoice from manufacturer arrives (usually email)
│   → Finance person has 30 days to pay
│   → Dashboard: PO status → "Manufacturer Invoice Received, Due [date]"
│   → Auto-reminder before due date
│
└── Credit card on file
    → Manufacturer charges CC's card when order ships
    → Dashboard: auto-record when charge appears
```

**Dashboard tracking per PO:**

```
PO: CC-PO-2026-001
  Brand: Brizo
  Deal: Carolina Mendoza — Kitchen Remodel
  Products: Litze Faucet (qty 1), Litze Pot Filler (qty 1)
  Dealer cost: $38,000 MXN
  Status: Confirmed → Manufacturer Paid → In Production → Shipped → Received
  Ship date: Apr 15
  Expected arrival: Apr 28
  Tracking: [carrier] [tracking number]
  Payment to mfr: Paid Apr 8, wire transfer, ref #12345
```

---

## PHASE 6: SHIPMENT TRACKING & RECEIVING

### Multiple shipments, different timelines, one customer

**The Convergence Problem:**

Carolina's order has 3 brands shipping from 3 different locations on 3 different timelines. She doesn't care about the complexity — she just wants to know when her stuff arrives.

```
Carolina Mendoza — Kitchen Remodel
│
├── Shipment 1: Brizo (faucet + pot filler)
│   Status: In Transit
│   Carrier: FedEx
│   Tracking: 7891234567
│   Left: Indianapolis, Apr 15
│   Customs: Cleared Apr 18
│   Expected: Apr 22
│   Destination: CC Showroom (for inspection before delivery)
│
├── Shipment 2: TOTO (toilet + bidet)
│   Status: Delivered to CC Showroom
│   Received: Apr 18
│   Inspected: ✅ No damage
│   Stored: Showroom warehouse, bay 3
│
└── Shipment 3: California Faucets (custom shower system)
    Status: In Production (custom finish)
    Expected ship: May 10
    Expected arrival: May 20
    ⚠️ This delays the full project delivery
```

**What happens when a shipment arrives at CC showroom:**

1. Roger (or staff) inspects the shipment
   - Check quantities against PO
   - Check for damage
   - Verify correct finishes/models
   - Photo documentation (stored in Drive under deal folder)

2. Decision point: damage or discrepancy?
   ```
   Everything correct?
   ├── YES → Mark received in dashboard, update status
   │
   ├── DAMAGED → Document damage with photos
   │   → File claim with carrier
   │   → Contact manufacturer for replacement
   │   → Customer notified of delay
   │   → Dashboard: shipment status → "Damaged — Replacement Ordered"
   │   → New PO for replacement? Or manufacturer handles directly?
   │
   └── WRONG ITEM → Contact manufacturer
       → Return process (varies by brand)
       → Correct item re-ordered
       → Customer notified
   ```

3. Storage until all shipments arrive (if consolidating for one delivery)

**What the customer sees:**

Roger decides: deliver items as they arrive, or wait until everything is in and deliver all at once?

```
Delivery strategy?
│
├── DELIVER AS AVAILABLE
│   → Each shipment delivered individually
│   → More delivery trips, but customer gets items sooner
│   → Customer needs to be available multiple times
│   → Each delivery = delivery receipt + confirmation email
│
└── CONSOLIDATE AND DELIVER ONCE
    → Wait for all shipments to arrive at CC showroom
    → One delivery trip, one handoff
    → Customer only needs to be available once
    → BUT: delayed by slowest shipment (California Faucets custom = May 20)
    → Dashboard: show "Waiting for: California Faucets shower system"
```

**Customer communication during this phase:**

- When each PO is confirmed: "Your [Brand] order is confirmed — estimated [X] weeks"
- When shipment ships: auto WhatsApp/email with tracking
- When shipment arrives at CC: "Your [Brand] products have arrived and been inspected"
- When ready for delivery: "All items received — let's schedule your delivery"
- If delay: proactive update — "Your California Faucets shower system has a custom finish that takes 6-8 weeks. Current ETA: May 20. The rest of your order is ready."

---

## PHASE 7: DELIVERY & HANDOFF

### The last mile

**Step 1: Schedule Delivery**

- Roger contacts customer to schedule
- WhatsApp or phone — confirm date, time window, delivery address
- Dashboard: delivery scheduled, date, address, notes ("Gate code: 1234", "Ask for the housekeeper Maria")

**Step 2: Delivery Day**

- Products loaded for transport
- Delivered to customer site
- Customer (or architect/contractor) receives and inspects
- Packing slip / delivery receipt signed (or confirmed via WhatsApp)

**Step 3: Post-Delivery**

```
Delivery complete?
│
├── YES, all good
│   → Dashboard: pipeline → "Delivered"
│   → Delivery receipt saved to Drive
│   → If balance outstanding (50/50 deal): trigger Invoice 2
│   → 7-day follow-up: automated email/WhatsApp — "How's everything?"
│   → Ask for review/testimonial
│   → Pipeline → "Complete" (after final payment received)
│
├── ISSUE — something's wrong
│   → Customer reports damage during delivery
│   → OR customer reports wrong item
│   → OR product is defective after installation
│   → Roger handles warranty claim with manufacturer
│   → Dashboard: deal status → "Post-Delivery Issue"
│   → Track resolution: claim filed → replacement ordered → resolved
│
└── PARTIAL DELIVERY
    → Some items delivered, others still pending
    → Dashboard: deal status stays "In Fulfillment"
    → Delivered items logged, pending items tracked
    → Cycle back to Phase 6 for remaining shipments
```

---

## PHASE 8: CLOSING THE BOOKS

### When is a deal actually "done"?

A deal is COMPLETE when ALL of the following are true:

- [ ] All products delivered to customer
- [ ] Customer has confirmed receipt (delivery receipt signed or WhatsApp confirmed)
- [ ] All customer payments collected (100% — no outstanding balance)
- [ ] All manufacturers paid (every PO settled)
- [ ] No open issues (no damage claims, no returns, no disputes)

**The finance person's final checklist for each deal:**

```
Deal: Carolina Mendoza — Kitchen Remodel
│
├── COLLECTED FROM CUSTOMER
│   Invoice CC-INV-2026-001A (deposit):   $72,500 MXN  ✅ Paid Apr 3
│   Invoice CC-INV-2026-001B (balance):   $72,500 MXN  ✅ Paid May 22
│   Stripe fees total:                    -$5,223 MXN
│   Net collected:                         $139,777 MXN
│
├── PAID TO MANUFACTURERS
│   PO CC-PO-2026-001 (Brizo):           $38,000 MXN  ✅ Paid Apr 8
│   PO CC-PO-2026-002 (TOTO):            $22,000 MXN  ✅ Paid Apr 5
│   PO CC-PO-2026-003 (Cal Faucets):     $15,000 MXN  ✅ Paid Apr 10
│   Total paid out:                        $75,000 MXN
│
├── FINAL MARGIN
│   Revenue:          $145,000 MXN
│   Stripe fees:      -$5,223 MXN
│   Manufacturer cost: -$75,000 MXN
│   Shipping costs:   -$8,500 MXN
│   ─────────────────────────────
│   Net profit:        $56,277 MXN (38.8% margin)
│
└── STATUS: ✅ COMPLETE — Closed May 25, 2026
```

---

## EDGE CASES THE DASHBOARD MUST HANDLE

### 1. Customer Cancellation
- Customer cancels after paying deposit
- Has Roger already ordered from manufacturers?
  - If NO: refund deposit (minus restocking fee?), cancel deal
  - If YES: can Roger cancel with manufacturer?
    - Custom orders usually non-refundable
    - Standard items might be cancellable
    - CC might eat the cost → margin becomes negative
- Dashboard: deal → "Cancelled", track refund, log reason

### 2. Price Change After Quote
- Roger quoted $145,000 based on current Master Price List
- Manufacturer raises prices before Roger places PO
- New dealer cost is higher → margin shrinks
- Decision: honor the quote (eat the difference) or renegotiate with customer?
- Dashboard: flag when PO dealer cost ≠ quote dealer cost

### 3. Product Discontinued After Quote
- Customer approved quote, but SKU discontinued before PO
- Roger needs to find a replacement, requote
- Dashboard: flag when product status changes during active deal

### 4. Partial Payment
- Customer pays deposit but ghosts on the balance
- Products are sitting in CC showroom
- How long does Roger wait? What's the policy?
- Dashboard: auto-escalation — 7 days, 14 days, 30 days overdue
- Eventually: conversation about cancellation or storage fees

### 5. Return / Exchange
- Customer changes mind after delivery
- Manufacturer return policies vary by brand
- Some products non-returnable (custom finishes, installed items)
- Dashboard: track return status, restocking fees, refund processing

### 6. Multi-Phase Project
- Large project delivered in phases (Phase 1: kitchen, Phase 2: bathrooms, Phase 3: hardware)
- Each phase might be a separate set of POs with separate timelines
- But it's ONE deal with ONE customer
- Dashboard: deal with sub-orders or child POs grouped by phase

---

## WHAT THIS MEANS FOR THE DASHBOARD

Every feature we build needs to account for this reality:

**Pipeline stages need to be granular:**
```
Lead → Qualified → Discovery → Quoting → Quote Sent → Quote Approved →
Deposit Invoiced → Deposit Received → POs Placed → In Production →
Shipping → Received at CC → Quality Check → Delivery Scheduled →
Delivered → Balance Invoiced → Fully Paid → Complete
```

**Documents are tied to DEALS, not just customers:**
- One deal might have: 3 quote versions, 2 invoices (deposit + balance), 3 POs (one per brand), 3 delivery receipts, 1 final receipt

**Finance tracking is per-deal AND per-PO:**
- Money in: tracked per invoice, per payment
- Money out: tracked per PO, per manufacturer payment
- Margin: calculated in real time, updated as costs change

**The Document Workstation needs to:**
- Generate quotes with per-item margin visibility (internal view)
- Convert quotes to invoices with one click
- Split invoices for deposit/balance structures
- Generate POs grouped by brand from a single deal
- Track document versions (Quote v1, v2, v3)
- Link everything back to the deal

---

*This is the real operating system for Counter Cultures. The deck shows the story. This document IS the story.*
