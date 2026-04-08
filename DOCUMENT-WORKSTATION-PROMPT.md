# Claude Code Prompt: Document Workstation — Preview, Search, Edit, Send

Copy everything below this line and paste it into Claude Code as a single prompt.

---

## Task

You are building a **Document Workstation** into the Counter Cultures dashboard. The goal: Roger (or his finance person) can search for any document, preview it, create new documents from templates pre-filled with deal data, edit the variable fields, and send it — all without leaving the dashboard. The existing PreviewPanel becomes the center of this workflow.

**This is NOT a redesign.** You are extending what already exists. The dashboard, the Drive page, the pipeline, the PreviewPanel — they're all built. You're wiring them together into a document workflow and adding the missing pieces (document generation, smart forms, send actions).

## Read These First (ALL THREE — they are your requirements)

1. **Read `AGENTS.md`** — Next.js 16 breaking changes warning. Check `node_modules/next/dist/docs/` before writing code.
2. **Read `CC-Branded-Assets-Library.md`** in the project root — the full inventory of every branded document type, where it lives in Google Drive, and where it gets triggered in the workflow.
3. **Read `CC-Internal-Process-Map.md`** in the project root — **THIS IS CRITICAL.** It maps the REAL internal workflow from inquiry to close: multi-brand POs, split payments (deposit/balance), manufacturer ordering, shipment tracking, margin calculations, edge cases (cancellations, price changes, partial payments, returns). The Document Workstation must handle all of this — not just the happy path. Every quote, invoice, PO, and receipt exists inside this process.
4. Familiarize yourself with the existing dashboard architecture by reading the key files listed below.

### Key Process Requirements from the Internal Process Map

The Document Workstation must handle these real-world scenarios:

- **Multi-brand orders:** One customer deal → multiple POs (one per manufacturer). The quote has 5 products from 3 brands. "Convert to POs" should generate 3 separate POs, each with only that brand's products and dealer costs.
- **Quote versioning:** Customers revise. Quote v1, v2, v3 — track all versions, only latest is "Active." Previous versions marked "Superseded."
- **Quote → Invoice conversion:** One click. Line items, pricing, customer info carry over. Invoice references the quote number.
- **Split invoices:** 50/50 deposit deals generate Invoice A (deposit) and Invoice B (balance). Each tracked separately. Balance invoice triggered when products arrive.
- **Per-item margin visibility:** On the Smart Form (Roger's internal view), every line item shows: quoted price, dealer cost, margin $, margin %. The customer-facing preview hides dealer cost and margin. Two views, same document.
- **PO → manufacturer payment tracking:** Each PO tracks: sent date, confirmed date, payment date, payment method, payment reference, amount. Finance person updates these.
- **Stripe fee awareness:** When calculating real margin, deduct Stripe fees (3.6% + $3 MXN per transaction) from revenue. Show: gross margin AND net margin after fees.
- **Deal-level financial summary:** For any deal, the dashboard should show the Phase 8 "Closing the Books" view: total collected, total Stripe fees, total paid to manufacturers, total shipping, net profit, margin %.
- **Document → Deal linkage:** Every document belongs to a deal. The Documents sheet needs Deal_ID. From any deal, you see all its documents. From any document, you can navigate to its deal.
- **Auto-follow-up on unpaid invoices:** When an invoice is overdue, flag it in the finance dashboard. Auto-reminders at 7, 14, 30 days.

## Existing Architecture (DO NOT rewrite these — extend them)

### Components You're Building On

| Component | File | What It Does Now |
|---|---|---|
| **PreviewPanel** | `app/(dashboard)/components/preview-panel.tsx` | Right-side panel that embeds Google Drive file previews via iframe. Has fullscreen toggle. Currently view-only. |
| **SlideOut** | `app/(dashboard)/components/slide-out.tsx` | Right-sliding detail panel (480px default). Used in Pipeline for deal details. Framer Motion animated. |
| **Modal** | `app/(dashboard)/components/modal.tsx` | Centered modal with backdrop, keyboard support, customizable width. |
| **Pipeline Page** | `app/(dashboard)/dashboard/(portal)/pipeline/page.tsx` | Kanban board with drag-drop. Deal cards with SlideOut detail view. Has deal data: name, contact, value, products, stage, notes. |
| **Drive Page** | `app/(dashboard)/dashboard/(portal)/drive/page.tsx` | File browser with folder grid, file table, search, upload, create folder, and preview button that opens PreviewPanel. |
| **Google Drive API** | `app/lib/google-drive.ts` | Service account auth. Functions: `listFiles`, `searchFiles`, `getFile`, `getBreadcrumbs`, `createFolder`, `uploadFile`, `trashFile`. |
| **Drive API Route** | `app/api/dashboard/drive/route.ts` | Handles list, folders, search, breadcrumbs, upload, trash, createFolder actions. |
| **Email Library** | `app/lib/email.ts` | Resend integration. Functions: `sendContactConfirmation`, `sendTradeConfirmation`, `notifyRoger`, etc. |
| **Dashboard Sheets** | `app/lib/dashboard-sheets.ts` | CRUD for Google Sheets tabs: Leads, Pipeline, Contacts, Products, etc. |
| **Command Palette** | `app/(dashboard)/components/command-palette.tsx` | Cmd+K search across dashboard. |
| **AI Chat Widget** | `app/(dashboard)/components/ai-chat-widget.tsx` | AI assistant sidebar. |

### Data Available Per Deal (PipelineDeal interface)

```typescript
interface PipelineDeal {
  id, name, contactName, value, currency, stage, probability
  expectedClose, assignedRep, products, createdAt, notes
  contactCompany?, contactRole?, projectType?, timeline?
  decisionMakerName?, leadSource?, followUpDate?, competitor?, lostReason?
}
```

### Design System

- Fonts: Cormorant (display), DM Sans (body), JetBrains Mono (labels/mono)
- Colors: defined in CSS variables (--bg-dark, --card-bg, --accent-warm, --accent-green, etc.)
- Existing UI components in `app/components/ui/` — use Button, Input, Select, etc. from there
- Framer Motion for animations (already a dependency)
- Lucide React for icons (already a dependency)
- Sonner for toast notifications (already a dependency)

---

## What to Build

### 1. Enhanced PreviewPanel → Document Workstation Panel

**File:** Extend `app/(dashboard)/components/preview-panel.tsx`

The PreviewPanel currently only previews files. Upgrade it to be the Document Workstation — the single pane where documents are viewed, edited, and sent.

**New capabilities to add:**

**A. Action Bar at the bottom of the PreviewPanel:**
When a document is open in preview, show a bottom action bar with:
- **"Edit"** button → switches to Smart Form mode (see #2 below)
- **"Send"** button → opens a send dialog (email via Resend, or WhatsApp share link)
- **"Download PDF"** button → triggers Google Drive export-as-PDF and downloads
- **"Save to Drive"** button → if editing, saves the generated document back to the appropriate Drive folder
- **"Open in Drive"** button → opens the file in Google Drive in a new tab (this already partially exists)

**B. Document metadata strip** at the top of the preview:
- Show: document type (Quote, Invoice, PO, etc.), associated deal/customer name, created date, status (Draft / Sent / Signed)
- Pull this from the file's name convention (e.g., `CC-Q-2026-001.pdf` → Quote, 2026, #001) and/or from a Documents tab in Google Sheets that tracks generated docs

**C. Context awareness:**
When the PreviewPanel is opened FROM a pipeline deal (not from the Drive browser), it should know which deal it's associated with. Pass the deal ID/data as a prop so the action bar can pre-fill the "Send" dialog with the customer's email and name.

### 2. Smart Form Document Generator

**New component:** `app/(dashboard)/components/document-generator.tsx`

This is what opens when Roger clicks "Create Quote," "Create Invoice," or "Create PO" from a deal, OR when he clicks "Edit" on an existing document in the PreviewPanel.

**Layout — split view inside the PreviewPanel area:**
- **Left side (40%):** Smart Form — editable fields pre-populated from deal data
- **Right side (60%):** Live Preview — the branded document, regenerating in real time as fields change

**Smart Form fields vary by document type:**

**Quote (the most complex document — get this right):**
- Customer name (pre-filled from deal.contactName)
- Customer company (pre-filled from deal.contactCompany)
- Customer email (pre-filled from Contacts sheet lookup)
- Customer type toggle: **Retail** or **Trade** (affects pricing tier)
- Currency toggle: **MXN** or **USD**
- Products table — each row:
  - Product name + SKU (searchable dropdown from catalog, auto-fills from deal.products)
  - Brand (auto from product)
  - Finish / variant (dropdown from product options)
  - Quantity (editable)
  - Dealer cost (auto from Master Price List — **INTERNAL ONLY, hidden on customer preview**)
  - MSRP / MAP reference (auto — helps Roger decide pricing)
  - **Quoted price** (Roger sets — this is what the customer pays)
  - Shipping cost estimate (Roger enters, or auto-estimate by brand)
  - Lead time estimate (Roger enters, or default by brand)
  - **Line margin $** (auto-calculated: quoted price - dealer cost — **INTERNAL ONLY**)
  - **Line margin %** (auto-calculated — **INTERNAL ONLY**)
  - Status badge: "In Stock" / "Special Order" / "Custom" (from catalog)
- Add/remove product rows (with product search autocomplete)
- Discount field (percentage or fixed, applied to subtotal)
- Notes field (free text — shown on customer quote)
- Internal notes (free text — **NOT shown on customer quote**, saved with deal)
- Payment terms dropdown: Full Upfront / 50% Deposit + 50% on Delivery / Net 30 (Trade only) / Custom
- Quote validity period (default: 15 days)
- Delivery estimate (free text or auto-calculate from longest lead time)
- **DEAL MARGIN SUMMARY** (shown at bottom of Smart Form, internal only):
  ```
  Subtotal (quoted):    $145,000 MXN
  Total dealer cost:    -$75,000 MXN
  Shipping:             -$8,500 MXN
  Est. Stripe fees:     -$5,223 MXN (calculated at 3.6% + $3)
  ─────────────────────────────────
  Est. net margin:      $56,277 MXN (38.8%)
  ```

**The live preview has TWO MODES — toggle between them:**
- **Customer view** (default): the branded PDF the customer will receive. Shows: products, quoted prices, totals, terms, CC branding. Hides: dealer cost, margin, internal notes.
- **Internal view**: same layout but includes dealer cost column, margin column, and internal notes. Roger uses this to review profitability before sending.

**Invoice:**
- Same customer fields as Quote
- Invoice number (auto-generated: CC-INV-YYYY-NNN)
- **References quote:** "Per Quote CC-Q-2026-001" (auto-linked if converted from quote)
- Products/line items (carried from quote or editable)
- Tax calculation (IVA 16% — configurable: on products only, or products + shipping)
- **Payment type:** Full / Deposit (with % field) / Balance / Installment (with installment # and schedule)
- Stripe payment link (auto-generated via Stripe API, or manual entry)
- Due date (auto-calculated from payment terms, or manual)
- Notes
- **If split invoice:** clearly labeled "DEPOSIT INVOICE (1 of 2)" or "BALANCE INVOICE (2 of 2)"

**Purchase Order (to manufacturer):**
- **Auto-generated from invoice/quote line items, filtered to one brand**
- Manufacturer/brand name (auto)
- Manufacturer contact info (from a Manufacturers reference — Roger fills in once, reused)
- PO number (auto-generated: CC-PO-YYYY-NNN)
- Products table: SKU, product name, finish, quantity, **dealer cost** (not customer price — this is what CC pays)
- Total PO amount at dealer cost
- Ship-to address: dropdown — "CC Showroom" (default) or "Customer Direct" (with address from deal)
- Requested delivery date
- Notes for manufacturer
- **Internal reference** (not on PO sent to manufacturer): Deal name, customer name, customer quoted price, margin on this PO's products

**Delivery Receipt:**
- Customer name, delivery address, date
- Products delivered (from PO received items)
- Condition: checkbox per item (Good / Damaged / Wrong Item)
- Customer signature line (or "Confirmed via WhatsApp" with date)
- Notes
- Photos section (link to Drive folder with inspection photos)

**The live preview** should render as a branded HTML template (CC logo, colors, fonts, showroom address, terms) that matches the Dark Botanical design system. Use an iframe or a React component that renders the document in real time.

**Implementation approach:**
- Create HTML/React templates for each document type in `app/(dashboard)/components/templates/` — one per doc type (quote-template.tsx, invoice-template.tsx, po-template.tsx, etc.)
- Templates receive form data as props and render the branded document
- Use `html2pdf.js` (or similar client-side lib) to convert the rendered HTML to PDF for saving/downloading
- When "Save to Drive" is clicked: generate PDF → upload to correct Drive folder via existing `uploadFile` API → save reference in a Documents sheet tab

### 3. Documents Tab on Pipeline Deals

**File:** Extend `app/(dashboard)/dashboard/(portal)/pipeline/page.tsx`

In the existing SlideOut panel that opens when Roger clicks a deal, add a **"Documents" tab** alongside the existing deal details.

**Documents tab shows:**
- List of all documents associated with this deal (quotes, invoices, POs, delivery receipts)
- Each row: document type icon, name, date created, status (Draft/Sent/Paid/Signed)
- Click any document → opens in PreviewPanel with the action bar
- **"+ New Document" button** with dropdown: New Quote, New Invoice, New PO, New Delivery Receipt
- Clicking any option opens the Document Generator (Smart Form + Live Preview) pre-filled with this deal's data

**How documents are linked to deals:**
- Create a new `Documents` tab in the Google Sheets CRM (via dashboard-sheets.ts)
- Columns: `Doc_ID, Deal_ID, Type, File_Name, Drive_File_ID, Customer_Name, Status, Created_Date, Sent_Date, Amount, Version, Parent_Doc_ID, Brand, Currency, Stripe_Fees, Dealer_Cost_Total, Margin_Amount, Margin_Percent`
- When a document is generated and saved, a row is added here
- When the Documents tab on a deal loads, it queries this sheet filtered by Deal_ID
- `Version` tracks quote iterations (v1, v2, v3). `Parent_Doc_ID` links Invoice back to its Quote, and POs back to their Invoice.
- `Brand` is populated on POs (one PO per brand). Quotes and invoices leave this blank (they span multiple brands).

**Quick actions on the Documents tab:**
- On a Quote row: "Convert to Invoice" button → generates invoice pre-filled from that quote, references the quote number
- On an Invoice row: "Generate POs" button → creates one PO per brand from the invoice line items, each PO containing only that brand's products at dealer cost
- On a Quote row: "New Version" button → duplicates the quote as v2/v3, marks previous version as "Superseded"
- On an Invoice row: "Split Invoice" button → for 50/50 deals, generates Invoice A (deposit %) and Invoice B (balance %)

**Deal Financial Summary panel** (shown above the documents list):
```
COLLECTED:     $72,500 / $145,000 MXN (Deposit received, balance pending)
STRIPE FEES:   -$2,613 MXN
PAID OUT:      $38,000 / $75,000 MXN (Brizo paid, TOTO + Cal Faucets pending)
NET MARGIN:    $56,277 MXN (38.8%) — final after all payments
STATUS:        ⚠️ 2 POs unpaid, balance invoice not yet sent
```

### 4. Universal Document Search

**File:** Extend `app/(dashboard)/components/command-palette.tsx` AND the Drive page

**Command Palette (Cmd+K):**
- Currently searches dashboard sections. Extend it to also search documents.
- When Roger types "Carolina quote" → search both the Documents sheet (by customer name + type) AND Google Drive (via `searchFiles`)
- Results show: document name, type, associated deal, date
- Clicking a result opens it in the PreviewPanel with the full action bar

**Drive page search:**
- The existing search on the Drive page already calls `searchFiles`. Enhance the results to show document metadata (type, deal, customer) when the file matches the naming convention.
- Add a "Documents" filter/view on the Drive page that shows only generated documents (not raw files), pulled from the Documents sheet, with columns: Type, Customer, Deal, Date, Status, Actions (Preview, Send, Download).

### 5. Send Dialog

**New component:** `app/(dashboard)/components/send-dialog.tsx`

Opens when Roger clicks "Send" from the PreviewPanel action bar or from the Documents tab.

**Fields:**
- **To:** email address (pre-filled from deal contact)
- **Channel toggle:** Email (Resend) or WhatsApp (share link)
- **Subject:** pre-filled based on document type ("Your Quote from Counter Cultures — [Deal Name]")
- **Message:** pre-filled template with personalization, editable. Short and professional.
- **Attachment:** the document (shown as a preview thumbnail)
- **Send button**

**On send:**
- If email: use Resend API (extend `app/lib/email.ts` with a `sendDocument` function that accepts to, subject, body, and PDF attachment)
- If WhatsApp: generate a Google Drive share link (viewer access) and open WhatsApp with pre-filled message containing the link
- Update the Documents sheet: set `Status` to "Sent", set `Sent_Date` to now
- Show success toast via Sonner
- Log activity in the Activity_Log sheet

### 6. Auto-Number System

**New utility:** `app/lib/document-numbers.ts`

Documents need sequential numbering. Create functions:

```typescript
getNextDocumentNumber(type: 'quote' | 'invoice' | 'po' | 'receipt'): string
// Returns: CC-Q-2026-001, CC-INV-2026-002, CC-PO-2026-001, etc.
// Reads the Documents sheet to find the highest number for that type+year
// Increments by 1
```

### 7. New API Routes

**`app/api/dashboard/documents/route.ts`**
- `list`: Query Documents sheet, optionally filtered by deal_id or type
- `create`: Add new document record to Documents sheet
- `update`: Update status (Draft → Sent → Paid)
- `generate-pdf`: Accept HTML string, convert to PDF, upload to Drive, return file ID

**`app/api/dashboard/documents/send/route.ts`**
- `send-email`: Send document via Resend with PDF attachment
- `send-whatsapp`: Generate Drive share link, return WhatsApp deep link

---

## Document Templates to Create

Create branded HTML/React templates in `app/(dashboard)/components/templates/`:

1. **`quote-template.tsx`** — Quote / Estimate
2. **`invoice-template.tsx`** — Invoice (with Stripe payment link)
3. **`po-template.tsx`** — Purchase Order to manufacturer
4. **`delivery-receipt-template.tsx`** — Delivery confirmation / packing slip

Each template:
- Receives document data as props (customer, products, amounts, notes, dates)
- Renders a print-ready branded document using the Dark Botanical design system
- Includes: CC logo (SVG from `/public/images/`), showroom address, phone, email
- Includes: document number, date, customer info, line items with totals, terms, footer
- Must look professional when exported to PDF
- Bilingual support: accept a `locale` prop to render in EN or ES

---

## Important Rules

1. **Do NOT rewrite existing components from scratch.** Extend them. Add props, add tabs, add modes. The PreviewPanel, SlideOut, Modal, Pipeline, and Drive pages all work — build on top of them.
2. **Do NOT change the visual design or layout of existing pages.** The dashboard layout, sidebar, header, color scheme, component styling — leave it all alone. Your additions should match the existing aesthetic.
3. **Use existing patterns.** The codebase uses `"use client"` for interactive components, Framer Motion for animations, Lucide React for icons, Sonner for toasts, `@dnd-kit` for drag-drop. Follow these patterns.
4. **Use existing APIs.** Google Drive operations go through `app/lib/google-drive.ts`. Sheets operations go through `app/lib/dashboard-sheets.ts`. Email goes through `app/lib/email.ts`. Don't create parallel implementations.
5. **Create a new `Documents` tab in the Sheets CRM.** Add it to the `TABS` constant in `dashboard-sheets.ts`. Columns: `Doc_ID, Deal_ID, Type, File_Name, Drive_File_ID, Customer_Name, Status, Created_Date, Sent_Date, Amount`.
6. **Handle the case where Google services aren't connected.** The dashboard currently uses sample data when APIs aren't configured. Your document features should degrade gracefully — show a "Connect Google Workspace to enable documents" message, don't crash.
7. **All text must be bilingual.** Use the same `{ en: string; es: string }` pattern or ternary locale checks that exist throughout the codebase.
8. **Read `AGENTS.md` first** — Next.js 16 has breaking changes. Check `node_modules/next/dist/docs/` if you hit build issues.
9. **After all changes, run `npm run build`** to verify everything compiles. Fix any errors.

---

## File Summary — What You're Creating/Modifying

### New Files
- `app/(dashboard)/components/document-generator.tsx` — Smart Form + Live Preview split view
- `app/(dashboard)/components/send-dialog.tsx` — Email/WhatsApp send modal
- `app/(dashboard)/components/templates/quote-template.tsx`
- `app/(dashboard)/components/templates/invoice-template.tsx`
- `app/(dashboard)/components/templates/po-template.tsx`
- `app/(dashboard)/components/templates/delivery-receipt-template.tsx`
- `app/api/dashboard/documents/route.ts` — Documents CRUD API
- `app/api/dashboard/documents/send/route.ts` — Send via email/WhatsApp API
- `app/lib/document-numbers.ts` — Auto-numbering utility

### Modified Files
- `app/(dashboard)/components/preview-panel.tsx` — Add action bar, metadata strip, Smart Form mode, context awareness
- `app/(dashboard)/dashboard/(portal)/pipeline/page.tsx` — Add Documents tab to deal SlideOut
- `app/(dashboard)/dashboard/(portal)/drive/page.tsx` — Add Documents filter/view
- `app/(dashboard)/components/command-palette.tsx` — Add document search results
- `app/lib/dashboard-sheets.ts` — Add Documents tab to TABS constant
- `app/lib/email.ts` — Add `sendDocument` function for email with PDF attachment
- `app/lib/google-drive.ts` — Add `exportAsPdf` and `setSharePermission` functions if needed

---

## The User Flow (This Is What Success Looks Like)

**Scenario: Roger creates and sends a quote**

1. Roger is in Pipeline view. He clicks on the deal "Arq. Carolina Mendoza — $145,000 MXN"
2. The SlideOut opens showing deal details. He clicks the **"Documents"** tab.
3. He sees no documents yet. He clicks **"+ New Document" → "New Quote"**.
4. The **Document Generator** opens in the PreviewPanel area:
   - Left side: Smart Form, pre-filled with Carolina's name, company, the 3 California Faucets products from the deal, pricing from the Master Price List
   - Right side: Live Preview showing a branded CC quote — logo, Dark Botanical styling, her name, the products, total, terms
5. Roger adjusts: changes quantity on one item from 1 to 2, adds a note "Includes showroom consultation." The preview updates in real time.
6. He clicks **"Save Draft"** → PDF is generated, uploaded to Drive (`Sales/Quotes/CC-Q-2026-001.pdf`), document record added to Sheets
7. He clicks **"Send"** → Send Dialog opens, pre-filled with Carolina's email, subject line "Your Quote from Counter Cultures", professional message body. He clicks Send.
8. Email goes out via Resend with the PDF attached. Document status updates to "Sent". Activity logged. Toast: "Quote sent to Carolina Mendoza."
9. Later, Roger searches Cmd+K → types "Carolina" → sees the quote in results → clicks → PreviewPanel opens with the quote and action bar → he can resend or download.

**That's the whole loop. Search → Preview → Edit → Send. One panel. No Drive folder digging. No email attachment hunting.**

Go.
