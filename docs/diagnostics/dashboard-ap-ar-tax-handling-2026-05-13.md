# AP / AR and tax handling — current state — 2026-05-13

## Summary

Both the Accounts Payable and Accounts Receivable pages exist, load, and are backed by real data (Odoo mirror via Google Sheets). AP shows a payment queue, open vendor bills with aging, and vendor terms. AR manages factura requests, Santander deposit tracking, and credit notes. Tax rates are hardcoded (IVA 16% for Mexico, 0% for US) — there is no mechanism to learn tax rates from vendor documents. The platform has CFDI field awareness (it stores and syncs `l10n_mx_edi_cfdi_uuid`, `cfdi_state`, etc. from Odoo) but does not parse CFDI XML documents to extract tax data. No vendor document parsing (XML, PDF, OCR) exists anywhere in the codebase.

---

## Accounts Payable — current state

- **Does the page exist and load?** Yes — `/dashboard/accounts-payable`, gated behind `view_ap` feature flag.
- **What it currently shows:**
  1. **AP Queue** (`ap-queue-section.tsx`) — upcoming vendor payments derived from POs + vendor terms. Shows vendor name, PO link, payment trigger, amount (with split fractions), due date, and whether the payment blocks PO send. Fetches from `GET /api/dashboard/ap-queue`.
  2. **Open Vendor Bills** (`open-bills-section.tsx`) — all posted `in_invoice` records with `payment_state = not_paid | partial`. Shows bill number, vendor, date, due date, days overdue, residual amount, currency, payment state. Summary cards show total open and overdue amounts by currency.
  3. **Vendor Terms** (`vendor-terms-section.tsx`) — reference table of configured vendor payment terms: credit terms, term days, billing trigger (on-ship / on-order / cash-upfront / etc.), default lead time, notes.
- **Data model backing it:**
  - `Odoo_Invoices` sheet tab (mirrored from Odoo `account.move` records where `move_type = in_invoice | in_refund`). Fields include `amount_untaxed`, `amount_tax`, `amount_total`, `amount_residual`, `currency_id`, `payment_state`, `invoice_origin` (PO link), and CFDI fields.
  - `Odoo_Purchase_Orders` sheet tab (mirrored from Odoo `purchase.order`). Fields include `amount_total`, `amount_tax`, `state`, `invoice_status`.
  - `Vendors` sheet tab — vendor terms configuration (credit terms, billing trigger, term days).
  - `Odoo_Payments` sheet tab — payment records with `payment_type = outbound` for vendor payments.
- **Actual billing/payment logic:**
  - **Bill creation:** `createBillFromPO()` in `app/lib/odoo/write.ts` creates a draft vendor bill in Odoo from a confirmed PO (bypasses Odoo's normal "receive first" requirement). Exposed via `POST /api/dashboard/purchases/[id]/create-bill`.
  - **Payment registration:** `registerPayment()` in `app/lib/odoo/write.ts` creates an `account.payment.register` wizard in Odoo, reconciles payment against the bill. Exposed via `POST /api/dashboard/payments/register`.
  - **Payment safeguards:** `payment-safeguards.ts` enforces immutable payment-bill links. Edits to amount/currency/rate on reconciled payments require explicit `force: true` confirmation.
  - **Vendor payment queue:** `computeQueuedPayments()` in `vendor-terms.ts` derives upcoming payments from PO date + vendor terms (net 30, cash-upfront, split-50-50, etc.).
  - All mutations log to `Activity_Log`.

## Accounts Receivable — current state

- **Does the page exist and load?** Yes — `/dashboard/accounts-receivable`. No explicit feature gate (visible to all authenticated users).
- **What it currently shows:**
  1. **Summary cards** — pending + draft request count, issued this month, by-company breakdown (CC Mexico vs LLC USA), open credit notes.
  2. **Factura Requests table** — filterable by state (pending/draft/issued/complete/cancelled), company (CC/LLC), and deposit type. Each row shows request name, customer, RFC type (personalized vs publico), amount, company, deposit type, source (Javier/Roger/manual), state, folio, PDF/XML Drive links, requested date.
  3. **New Factura Request form** — creates a factura request with customer name, RFC, amount, currency, bank, payment method, company, deposit type, source, order reference.
  4. **Santander Deposits section** (collapsible) — shows deposits imported via CSV upload or manual entry. Supports queue-factura action (auto-creates factura request from customer deposit) and skip action (for Roger transfers / NetPay). CSV upload is idempotent on reference.
  5. **Credit Notes tab** — table of credit notes with original folio, amount, reason, resolution status.
  6. **AR Detail Panel** (slide-out) — editable factura state, folio, PDF/XML URLs, notes. Full payment and customer metadata.
- **Data model backing it:**
  - `AR_Factura_Requests` sheet tab — factura request lifecycle (pending → draft → issued → files_attached → cancelled).
  - `AR_Credit_Notes` sheet tab — credit note tracking with reason codes and resolution status.
  - `Santander_Deposits` sheet tab — bank deposit records with source classification (customer / roger_transfer / netpay).
  - `Invoice_Approvals` sheet tab — prefactura approval workflow for personalized facturas.
  - `ar-factura.ts` — state machine and type definitions for factura lifecycle, supporting two companies (CC Mexico, LLC USA) and deposit/finiquito pairs linked by folio.
- **Actual AR logic:**
  - Factura request CRUD via `POST /api/dashboard/ar-requests`.
  - Deposit scan (`POST /api/dashboard/ar-requests/scan`) — scans Santander deposits and auto-queues factura requests for customer deposits.
  - Santander CSV upload (`POST /api/dashboard/santander-deposits/upload`) — bulk-imports deposits, deduplicates by reference, auto-queues facturas.
  - Invoice approval workflow in `invoice-approval.ts` — enforces a state gate so personalized facturas require customer approval before CFDI stamping.

## Tax handling — current state

- **Where tax rates live in the data model:**
  - **Checkout IVA:** Hardcoded as `0.16` (16%) in `app/lib/landed-cost.ts` (line 142) and inline in `checkout-stepper.tsx` (line 380: `subtotal * 0.16`).
  - **Import landed costs:** Same `IVA_RATE = 0.16` constant applied to CIF + duty + IEPS base.
  - **Odoo mirror:** `amount_tax` is synced as a scalar field from Odoo on invoices, bills, POs, and sale orders. This stores whatever tax Odoo computed, but the dashboard does not parse or use it to derive rates.
  - **Sample data:** `taxRate: 16` appears in `sample-dashboard-data.ts` as a field on sample bills, but this is demo data only.
  - **Bank fee rates:** `Bank_Fee_Rates` sheet tab stores card processing fee rates by card type and issuer country — these are banking fees, not sales/purchase tax rates.
- **How rates are currently set:** Hardcoded. IVA is always 16% for Mexico delivery. US shipments get 0% IVA. There is no per-product, per-vendor, per-region, or configurable tax rate system.
- **Any existing vendor-document parsing?** No. The only document parsing in the codebase is `pdf-extraction.ts`, which uses Claude Haiku to extract product references (brand, SKU, finish, quantity) from manufacturer spec-sheet PDFs for catalog matching. It does not extract financial data, tax amounts, or rates.
- **CFDI XML awareness?**
  - **Field-level:** Yes. The Odoo sync layer mirrors CFDI fields from Odoo: `l10n_mx_edi_cfdi_uuid`, `l10n_mx_edi_cfdi_state`, `l10n_mx_edi_payment_policy`, `l10n_mx_edi_usage` on invoices and payments; `l10n_mx_edi_fiscal_regime` and `l10n_mx_edi_usage` on partners. These are stored and displayed in the dashboard.
  - **XML parsing:** No. The platform stores Drive URLs pointing to CFDI XML files but never opens, reads, or parses them. XML files are treated as opaque attachments.
  - **Factura section in checkout:** The checkout collects SAT-required fields (RFC, Razon Social, CP Fiscal, Regimen Fiscal, Uso de CFDI) from the customer for factura issuance. These are form inputs, not extracted from documents.

## Answer to client question 1 (auto-learning tax rates from vendor docs)

> "Taxes on purchases, US tax rate, various IVA rates — can the platform learn from the vendors factura and bill we receive?"

- **Current capability:** No. The platform does not read, parse, or extract data from vendor facturas or bills. Vendor documents (PDF/XML) are stored as Google Drive attachments and linked by URL. Tax amounts synced from Odoo (`amount_tax`) are stored as totals but not decomposed into rates. The checkout IVA rate is hardcoded at 16%.
- **What would be required to build it for Mexican CFDI XML facturas:**
  - CFDI 4.0 XML has a well-defined schema. Tax data lives in structured nodes (`cfdi:Impuestos`, `cfdi:Traslados`, `cfdi:Retenciones`) with explicit `TasaOCuota` (rate), `Importe` (amount), and `Impuesto` (tax type: IVA, IEPS, ISR).
  - A parser would need to: (1) download the XML from Google Drive via the existing Drive API integration, (2) parse the XML and extract tax line items, (3) map extracted rates to the bill/PO in the dashboard data model, (4) present a confirmation UI so the finance user can review before committing.
  - This is the most tractable version of the problem because CFDI XML is standardized by Mexico's SAT — every vendor's factura follows the same schema.
  - Scope: XML parser module, Drive download integration, new sheet columns or data structure for per-line tax rates, review UI, and reconciliation logic against existing `amount_tax` totals.
- **What would be required for US bills:**
  - US vendor bills have no standardized electronic format. Tax information appears in PDFs with varying layouts.
  - Options: (a) AI-powered PDF extraction (similar to the existing `pdf-extraction.ts` pattern, using Claude to read bill PDFs and extract tax line items), or (b) manual entry with suggested rates based on vendor history.
  - US sales tax varies by state, county, and city (11,000+ jurisdictions). A lookup service (Avalara, TaxJar, etc.) would be needed for validation.
  - Scope: significantly larger than CFDI — involves PDF AI extraction, tax jurisdiction lookup integration, vendor tax profile storage, and review UI.
- **This is a feature, not a fix.** Would need a scoping/budget conversation with the client before building.

## Answer to client question 2 (are vendors billed now)

> "Are they billed now?"

The platform **receives** bills from vendors — it does not **send** bills to vendors. The flow is:

1. A Purchase Order is created and confirmed in Odoo.
2. When the vendor ships or invoices, the finance user clicks "Create Bill" on the PO detail page in the dashboard, which creates a draft vendor bill in Odoo (via `createBillFromPO`).
3. The bill appears in the AP > Open Vendor Bills section with aging and overdue tracking.
4. The finance user registers a payment against the bill via the dashboard, which reconciles in Odoo.

The AP page is functional and backed by real Odoo data — it tracks what Counter Cultures owes to vendors, not what vendors owe to Counter Cultures. The AR side handles what customers owe to Counter Cultures (factura requests, deposits, credit notes).

In short: vendors are not "billed" by the platform. The platform tracks bills that vendors issue to Counter Cultures, and manages payment against those bills.

## What I did NOT do

- I did not modify any code.
- I did not build any features.
- I did not open a PR with fixes.
