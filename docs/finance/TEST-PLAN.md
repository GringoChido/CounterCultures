# Finance / AR / AP / Pedimento — Test Plan

## Test environment

- Branch: `claude/zealous-roentgen-88d2c9`
- Build: passes `npx next build` (no TS errors, no build errors)
- Required env vars: `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_API_KEY`, `RESEND_API_KEY` (optional — email sends dry-run without it)

## 5.1 — Payment safeguards edit flow

- [ ] Open `/dashboard/payments/[id]`, click "Edit payment"
- [ ] Change only `date` or `ref` → saves without confirmation dialog
- [ ] Change `amount`, `currency`, or `fx_rate` → confirmation dialog appears asking whether to preserve reconciliations
- [ ] Confirm → saves with `force: true`, reconciliations preserved
- [ ] Cancel → reverts, no write
- [ ] Verify Activity_Log row created with before/after JSON

## 5.2 — FX rate on payments

- [ ] Open `/dashboard/payments/[id]` in edit mode
- [ ] FX rate field pre-fills from `FX_Rates` sheet (Frankfurter source)
- [ ] Can override FX rate manually; override persists to `FX_Rates` with `source=manual_override`
- [ ] Register a new payment → FX rate field visible, pre-filled
- [ ] Activity_Log records `fx_rate` in details JSON

## 5.3 — Santander deposit feed

- [ ] Open `/dashboard/accounts-receivable`
- [ ] "Santander Deposits" section visible with CSV upload button
- [ ] Upload a Santander CSV (date, reference, amount columns) → deposits appear in table
- [ ] Customer deposits auto-queue a factura request (status=pending in AR_Factura_Requests)
- [ ] Roger transfers show "Owner — no auto-factura" label, do NOT auto-queue
- [ ] NetPay deposits show "NetPay — skip" label, do NOT auto-queue
- [ ] Duplicate references (same reference + amount) are skipped on re-upload
- [ ] Manual deposit entry form works (all fields)
- [ ] "Scan deposits" button finds pending customer deposits and queues facturas

## 5.4 — Cross-linking SO↔Invoice↔Payment↔PO↔Bill

- [ ] `/dashboard/invoices/[id]` → `invoice_origin` renders as a clickable link to orders
- [ ] `/dashboard/invoices/[id]` → payments table has clickable payment names linking to `/dashboard/payments/[id]`
- [ ] `/dashboard/payments/[id]` → "Related orders" section shows unique invoice_origins as clickable links
- [ ] `/dashboard/purchases/[id]` → "Payments" section shows linked payments (joined via reconciled_bill_ids)

## 5.5 — Bill creation from PO

- [ ] Open `/dashboard/purchases/[id]` for a confirmed PO (state=purchase)
- [ ] "Create Bill" button visible in header (feature-gated by `register_payment`)
- [ ] Click → creates draft vendor bill in Odoo via `action_create_invoice`
- [ ] Button hidden for draft/cancel/fully-invoiced POs
- [ ] Activity_Log records `purchase.create_bill`
- [ ] New bill appears in Odoo invoices after sync

## 5.6 — Shipping scenario tagging

- [ ] Open `/dashboard/invoices/[id]` for a vendor bill (in_invoice or in_refund)
- [ ] "Shipping / Envío" row visible with 4 scenario buttons
- [ ] Click a scenario → tag saved via PATCH to `/api/dashboard/invoices/[id]/tags`
- [ ] Click same scenario again → deselects (tag cleared)
- [ ] Refresh page → tag persists from Invoice_Tags sheet
- [ ] Not shown on customer invoices (out_invoice)

## 5.7 — Pedimento workflow

### Multi-recipient broker email
- [ ] Open `/dashboard/shipments/[id]` for a tráfico in "collecting" or "at-warehouse" status
- [ ] Click "Send to broker" → email sent to all 3 broker contacts (broker, crossing agent, warehouse) with Roger CC'd
- [ ] Activity_Log records all recipients in details JSON
- [ ] Without RESEND_API_KEY → dry_run status, workflow still advances

### Pedimento # back-fill
- [ ] Open `/dashboard/shipments/[id]` for a tráfico with a pedimento number set
- [ ] "Apply to Odoo" button visible next to the pedimento number
- [ ] Click → writes `Ped. {number}` to the `ref` field of linked Odoo invoices/bills
- [ ] Idempotent: running again skips invoices that already contain the pedimento #
- [ ] Activity_Log records updated invoice IDs

### UPS agent notification
- [ ] Open `/dashboard/invoices/[id]` for a vendor bill
- [ ] Set shipping scenario to "Direct ship"
- [ ] "Notify UPS" button appears
- [ ] Click → sends email to 4 UPS agents with Roger CC'd
- [ ] Activity_Log records `notify_ups_agents`

## 5.8 — Bulk-pay by aging

- [ ] Open `/dashboard/vendors/[id]` for a vendor with open AP
- [ ] Open AP section shows checkboxes + "Select all (oldest first)" link
- [ ] Bills sorted by due date ascending (oldest first)
- [ ] Clicking bills toggles selection; "Running total" column appears showing cumulative amount
- [ ] Total amount displayed in header next to "Pay N bills" button
- [ ] Click "Pay N bills" → confirmation dialog → registers payments sequentially
- [ ] Success toast with total amount; page refreshes showing updated data
- [ ] Feature-gated: only visible to users with `register_payment`

## 5.9 — Banking fees

- [ ] GET `/api/dashboard/banking-fees` returns fee rates + entries
- [ ] POST a fee entry with source=santander, cardType=credit, issuerCountry=mexican → calculates fee at configured rate
- [ ] Duplicate (reference, line_id) returns `action: "duplicate"` without creating a new entry
- [ ] Fee rates in Bank_Fee_Rates sheet override defaults when populated
- [ ] Activity_Log records `post_banking_fee`

## 5.10 — Deprecated Gmail scanner

- [ ] `app/lib/factura-detector.ts` has @deprecated JSDoc
- [ ] No active callers reference `scanGmailForFacturas` or `autoQueueFacturaEmails`
- [ ] `/api/dashboard/ar-requests/scan` operates on Santander deposits, not Gmail
- [ ] AR page shows "Scan deposits" button (not "Scan Gmail")

## Regression checks

- [ ] All existing invoice detail pages load without errors
- [ ] All existing payment detail pages load without errors
- [ ] All existing purchase order detail pages load without errors
- [ ] All existing vendor profile pages load without errors
- [ ] All existing shipment detail pages load without errors
- [ ] Accounts receivable page loads without errors
- [ ] Finance page loads without errors
- [ ] Full production build passes (`npx next build`)
