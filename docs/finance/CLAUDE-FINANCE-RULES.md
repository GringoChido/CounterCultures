# Counter Cultures — Finance Rules of Record

Source: Tonina (AP lead), 2026 feedback documents (Claude .instructions.docx + Factura flow and banking fees.docx).
This file is canonical. Every Claude session touching AR / AP / Facturas / Payments / Pedimento / Banking must read it before editing code.

## Facturas / SAT

1. Facturas auto-create ONLY when a deposit is received into the SANTANDER account (CC's fiscal account in Mexico).
2. ALL Santander deposits require a factura — no exceptions for customer deposits.
3. Owner (Roger) transfers into Santander are NOT auto-factura'd. They land in an "Owner deposits" review queue. Tonina creates the factura manually if/when required.
4. Tonina is notified of owner transfers via email, WhatsApp, or by reviewing Roger's Excel movements. The system surfaces these in a dedicated UI for manual handling.
5. NetPay deposits do NOT generate SAT facturas, but the associated processing fees must still be recorded as expenses.
6. The legacy Gmail-subject scanner (COMPROBANTE_ pattern) is DEPRECATED. It remains as a manual fallback only.

## Payments

7. Once a payment is applied to a bill or invoice, that link is NEVER silently removed.
8. Editing a payment (date, ref, amount, currency, rate) goes through `payment-safeguards.ts`. If the edit affects amount/currency/rate, a confirmation dialog asks the user whether to preserve reconciliations. Default = preserve.
9. Every payment records the FX rate used. Pre-fill from `FX_Rates` sheet (Frankfurter/ECB). User can override per-payment or for the whole day. Manual overrides persist to `FX_Rates` with `source=manual_override`.
10. Bulk payments to vendors apply by AGING (oldest first) by default. Override allowed for deposit-on-large-bills exception.
11. Bulk payment UI shows a running balance as bills are selected so Tonina can match her bank transfer amount.

## Vendor bills / POs

12. The dashboard exposes a "Receive & Bill" action that validates the Odoo picking and creates the draft bill in one step, so Tonina is not forced to receive inventory in Odoo before generating a bill from a foreign vendor.
13. Vendor bills are tagged with one of three shipping scenarios: `dropship_to_client`, `direct_to_mexico_ups`, `agent_in_laredo`. Each scenario surfaces its downstream action.
14. For `direct_to_mexico_ups`: notify the four UPS agents (`yulissagarcia@`, `fabianmartinez@`, `fatimasanchez@`, `cristinaavila@` — all `@ups.com`) with Roger CC'd.
15. For `agent_in_laredo`: log shipment to the Laredo Drive sheet (https://docs.google.com/spreadsheets/d/1y2OIJ1WN0IWFyN5W8IMAIADMWl2FOgvYA8EqIJFvwfw).
16. Vendor bill ↔ originating PO is always bidirectionally linked. Invoice_origin renders as a click-through.

## Pedimento / Importation

17. Two pedimento processes exist: formal (with Pedimento #) and informal (smaller / special-case inventory).
18. Initiating pedimento triggers an email to the three broker contacts: Jeanefer Contreras (`jeanefer_jeco@hotmail.com`), Merle Orozco (`quique73@globalpc.net`), TGR Logística (`auxiliartraficotgr@hotmail.com`), with Roger CC'd.
19. Pre-flight checklist required before broker submission: USMCA certs, Spanish manuals with importer block (Roger name, RFC, address, phone), payment receipts, SAT cadena.
20. When the pedimento is finalized, the pedimento # is appended to the `narration` (or `ref`) field of every Odoo invoice/bill linked to the trafico. One-click "Apply pedimento #" button on the shipment detail page.
21. The expediente PDF/XML bundle is uploaded to Drive AND attached to the most recent bill from "GESTORES ADUANALES DEL NORESTE Y CIA".
22. Carrier color codes for tracking: OUTGOING / Enrique / Gestores / FedEx / UPS — stored on the trafico row, rendered as colored badges.

## Banking fees

23. Santander card deposits incur a fee that varies by card type (Debit/Credit) × issuer country (Mexican/Foreigner). The system auto-posts a fee bill against vendor "Comisiones Bancarias - Santander" + a matching payment from the Santander journal. Idempotent on `(reference, line_id)`.
24. NetPay payments follow the same pattern with a NetPay vendor; do NOT trigger SAT factura.
25. The $232 MXN monthly NetPay terminal rental is a recurring auto-posted bill, paid from the NetPay journal.
26. Bank fee rates live in the `Bank_Fee_Rates` sheet tab and are editable by AP.

## Cross-linking (Odoo parity)

27. Every detail page renders bidirectional links between Sale Order ↔ Customer Invoice ↔ Payment ↔ Purchase Order ↔ Vendor Bill ↔ Vendor Payment ↔ Trafico.
28. Where a field like `invoice_origin` contains a reference number, it renders as a click-through to the originating record.

## Currency

29. Every money field stores both `amount` and `currency`. Never coerce silently.
30. FX source for v1 is Frankfurter (ECB). Banxico, Stripe, and Wise are deferred to a future pass.

## Naming / language

31. Tonina works primarily in Spanish. Every UI label has an EN + ES pair.
32. Preserve her terms: expediente, pedimento, cadena, alta en padrón de importador, comprobante, factura.

## Operational

33. Every mutating action logs to `Activity_Log` with actor, entity, before/after.
34. Every mutating action is feature-gated via `useFeatures()`.
35. New feature keys default ON for Owner + Manager + AP, OFF for Read-Only.

## Attachments / Documents

36. Operations attachments (vendor bills, POs, sale orders, inbox messages when wired) render a unified sequence viewer with keyboard navigation, so reviewers do not have to open each file singularly.
37. Attachments matching the logo/noise heuristic auto-hide from the default sequence. Users can override per file; overrides persist in the `Attachment_Visibility` sheet tab keyed on `(res_model, res_id, filename_hash)` and the toggle is logged to `Activity_Log`.

## Navigation

38. Accounts Payable has a dedicated tab at `/dashboard/accounts-payable`. The tab is sidebar-pinned (between AR and P&L Reports) and gated behind `view_ap`.
39. The AP queue, the open vendor bills aging table, and the vendor terms table all live on the AP page. The AP queue API is `GET /api/dashboard/ap-queue` and remains the single source of truth.
