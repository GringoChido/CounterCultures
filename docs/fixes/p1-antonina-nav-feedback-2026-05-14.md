# [P1] Antonina's Nav Feedback (2026-05-14) — Entity Label Carryover, Contact Classification, PDF, Tax Rates

> **Status:** PENDING · **Priority:** P1 · **Effort:** ~1 day · **Branch:** `fix/antonina-nav-feedback-2026-05-14`
> **Source:** `uploads/Site navigation questions and observations may 14 2026.docx` (Antonina Trischitta, Finance lead)
> **Last updated:** 2026-05-14

---

## Why this matters

Antonina is the finance/AP operator who actually uses this app every day. She's testing the recent CC vs LLC entity work and the new contact-classification icon, and she's flagged five concrete blockers that prevent her from trusting the system in production:

1. The CC/LLC entity label shows on the AP **list** but disappears the moment she opens a bill — she can't tell which legal entity she's working in once inside the transaction.
2. The totals block on bill/order screens has no entity-colored background, so there's no visual safeguard against keying a CC bill into LLC books or vice-versa.
3. A PDF can't be downloaded (second day in a row).
4. The contact-classification icon exists, but she **cannot apply a classification to any contact**, and searching/filtering by classification returns zero results even with filters off.
5. Tax rates can't be created on the fly with custom names.

Each of these is a "stop me from using the tool" issue. Roger and Antonina are the only operators — if she can't run AP and classify contacts, the staging app is not "smooth and efficient" and we can't progress toward production cutover (see `AGENTS.md` staging-vs-production rules).

---

## The problem (evidence)

### 1. CC/LLC label doesn't carry over
- `CompanyBadge` already exists in `app/(dashboard)/components/company-badge.tsx` with `cc` / `llc` variants and theme tokens (`bg-company-cc-soft`, `bg-company-llc-soft`, etc.).
- It is rendered on the AP **list** view, but **not** on:
  - the AP bill detail screen (the screen Antonina screenshotted)
  - sale/purchase operations tied to the same transaction (PO, bill, related payments, related factura, related AR invoice)
  - the totals block of those screens
- There is no single helper that resolves "which entity does this transaction belong to" from a bill/PO/invoice/payment record, so every screen has to re-derive it ad-hoc and most just skip it.

### 2. Totals background not entity-colored
- On bill/order detail screens the totals card uses a generic surface color.
- Antonina explicitly liked the current accent color used on the list badge and asked for the same hue as the **totals background** — she wants entity color to be a peripheral-vision cue, not just a chip.

### 3. PDF download broken
- Antonina reports: "The PDF cannot be downloaded, I saw this yesterday as well." (Likely the bill or factura PDF — confirm which entry point in QA.)
- No client error message — the button appears to do nothing or fail silently.
- Candidate routes to inspect: `app/api/dashboard/invoices/[id]/cfdi/route.ts`, any bill-PDF route under `app/api/dashboard/...`, and the client-side download handler that calls them.

### 4. Contact classification non-functional
- `app/lib/contact-classifications.ts` defines the taxonomy (`Vendor`, `Customer`, `Employee`, `Service provider`, `Supplies vendor`) and the badge.
- `app/(dashboard)/dashboard/(portal)/contacts/page.tsx` renders the column and a `classFilters` state, but:
  - There is **no UI to set or change a contact's classification** from the list, the contact dropdown, or the contact detail page (`contacts/[id]/page.tsx`).
  - The API at `app/api/dashboard/contacts/route.ts` accepts a `classifications` query param but the underlying CRM sheet column either isn't being read or isn't being written.
  - Searching by classification returns empty results regardless of filter state.

### 5. Vendor / Customer / Employee path resolution
- Some contacts wear multiple hats (e.g., a freelancer who is both a vendor and an occasional service provider; Antonina herself is an employee but also appears on bills).
- Today the contact picker doesn't filter by role-appropriate classification:
  - Creating a **bill** should default the contact picker to contacts classified as `Vendor` / `Supplies vendor` / `Service provider`.
  - Creating an **invoice / sale order** should default to contacts classified as `Customer`.
  - Multi-classified contacts must still be selectable from either path.

### 6. Tax rates inflexible
- Antonina asked specifically: *"DId you do anything about the taxes application and the flexibility to create new rates when necessary with the proper name assigned?"*
- Today IVA is hardcoded at 16% via `app/lib/iva.ts`. There is no way for finance to add a named rate (e.g., `IVA 8% fronterizo`, `IEPS 8%`, `Retención 4% honorarios`, `0% exenta`) and apply it per line on a bill/invoice.

### 7. "What does this mean?" — unidentified UI element
- Antonina points at something on the bill screenshot that she doesn't recognize. We don't have her annotation, so this fix must include a deliberate pass to find and label any unexplained UI on the bill/order detail screens, and either remove or document it. Ask Joshua to forward the annotated screenshot before merging.

---

## Scope

**In scope (this fix):**

- A single `getTransactionEntity(record)` helper that returns `"cc" | "llc"` from any AP/AR/PO/payment record.
- Render `CompanyBadge` + apply entity-colored totals background on:
  - AP bill detail page (and the bill form's totals card)
  - PO detail page
  - AR invoice detail page
  - Sale order / quote detail page
  - Any "related payment" panel that lists transactions
- Diagnose and fix the PDF download (server route + client handler + browser tab handling).
- Wire contact classification end-to-end:
  - Multi-select editor on contact detail page + an inline editor in the contacts table.
  - PATCH endpoint that writes `classifications` to the CRM sheet.
  - Verify list search/filter actually filters by the persisted column (currently broken).
  - Add the classification chip to the contact picker dropdown wherever a contact is selected (bill, PO, invoice, sale order, quote).
- Role-aware contact picker: filter by classification based on the document being created (bill → vendor-side, invoice → customer-side), with an "All contacts" override toggle so multi-role contacts remain reachable.
- Tax rate registry: a small `TaxRates` sheet (or JSON store) where finance can add `{ name, kind, rate, applies_to, active }`, surfaced as a per-line picker on bills/invoices, with IVA 16% as the seeded default.
- Audit pass on the bill detail screen for unlabeled UI; label, remove, or document each.

**Out of scope (separate tickets):**

- Full CFDI 4.0 emit flow — covered by `docs/fixes/p1-mexican-fiscal-fields.md`.
- Trade-customer tier-specific tax behavior — `docs/fixes/p1-trade-pricing.md`.
- Squarespace / production-domain anything — see `AGENTS.md`.

---

## Files to touch (proposed)

| File | Change |
|---|---|
| `app/lib/transaction-entity.ts` | **NEW.** `getTransactionEntity(record)`, `getEntityTheme(entity)`. One source of truth. |
| `app/(dashboard)/components/company-badge.tsx` | Add a `TotalsBackground` (or `EntityTintedCard`) wrapper that consumes the same theme tokens. |
| `app/(dashboard)/dashboard/(portal)/accounts-payable/page.tsx` | (no change — already shows badge in list) |
| `app/(dashboard)/dashboard/(portal)/accounts-payable/[id]/page.tsx` *(create if missing)* | Render `CompanyBadge` in header; wrap totals card in `EntityTintedCard`. |
| `app/(dashboard)/dashboard/(portal)/purchases/[id]/page.tsx` | Same treatment for POs. |
| `app/(dashboard)/dashboard/(portal)/accounts-receivable/page.tsx` and AR detail screens | Same treatment. |
| `app/(dashboard)/dashboard/(portal)/invoices/[id]/page.tsx` | Same treatment. |
| `app/(dashboard)/dashboard/(portal)/quotes/[id]/page.tsx`, `orders/[id]/page.tsx` | Same treatment. |
| `app/api/dashboard/invoices/[id]/cfdi/route.ts` *(and bill PDF route)* | Investigate + fix download. |
| Client PDF-download buttons | Replace silent `window.open` with `fetch → blob → anchor` pattern + visible error toast on failure. |
| `app/(dashboard)/dashboard/(portal)/contacts/[id]/page.tsx` | Multi-select classification editor; saves via PATCH. |
| `app/(dashboard)/dashboard/(portal)/contacts/page.tsx` | Inline classification editor in row; verify filter behavior. |
| `app/api/dashboard/contacts/route.ts` | Read+write `classifications` column; honor `?classifications=` filter; honor `?role=vendor\|customer\|employee` shorthand. |
| `app/api/dashboard/contacts/[id]/route.ts` *(create if missing)* | `PATCH` for classifications + other contact fields. |
| `app/(dashboard)/components/contact-picker.tsx` *(or wherever the dropdown lives — `customer-combobox.tsx` is the closest existing component)* | Add `roleFilter` prop; show classification chip in each option; "All contacts" toggle. |
| `app/lib/contact-classifications.ts` | Add `roleFilterFor(documentType)` mapping. |
| `app/lib/tax-rates.ts` | **NEW.** Tax-rate registry (sheet-backed), `listActiveTaxRates()`, `getTaxRate(id)`, seeded with IVA 16%. |
| `app/api/dashboard/tax-rates/route.ts` | **NEW.** `GET` list, `POST` create, `PATCH /[id]` edit, `DELETE /[id]` deactivate. |
| `app/(dashboard)/dashboard/(portal)/settings/tax-rates/page.tsx` | **NEW.** Finance-only settings screen to manage rates. |
| Bill/invoice line editors | Replace hardcoded 16% with tax-rate picker per line; fall back to IVA 16% when empty. |
| `docs/finance/CLAUDE-FINANCE-RULES.md` | Append rule: every AP/AR record must carry `entity ∈ {cc, llc}`; tax rate must reference `TaxRates.id`. |

---

## Step by step

1. **Entity helper first.** Create `app/lib/transaction-entity.ts` exporting `getTransactionEntity(record)` (handles bill, PO, invoice, sale order, payment) and `getEntityTheme(entity)` (returns the same tokens `CompanyBadge` uses). Unit-test the resolution table.

2. **Totals-card wrapper.** In `company-badge.tsx`, add `EntityTintedCard` — a card component that picks `bg-company-cc-soft` or `bg-company-llc-soft` (or a stronger variant, ~15% opacity, that meets WCAG AA against the dash text token). Confirm with Joshua/Antonina the exact shade is what she wants before rolling out.

3. **Wire the badge + tinted totals** into every detail screen in the Files-to-touch table. The header gets the badge; the totals card gets the tinted background. Verify mixed-entity workflows (e.g., LLC bill paying for CC purchase) raise an explicit warning rather than just rendering with the LLC tint.

4. **PDF download.** Reproduce with one of Antonina's bills. Check: (a) server route returns `application/pdf` with correct `Content-Disposition`; (b) client uses `fetch + blob` so popup-blockers don't eat it; (c) errors surface as a toast, not silence. If the bill PDF route doesn't exist at all, build it next to the existing CFDI route.

5. **Contact classification — write path.**
   - Add `classifications` to the contact PATCH endpoint; persist as comma-separated to the CRM sheet column.
   - Multi-select editor on contact detail page using existing `ClassificationBadge` component.
   - Inline multi-select on the contacts table row.

6. **Contact classification — read path.**
   - Confirm `app/api/dashboard/contacts/route.ts` reads the column on every GET.
   - Honor `?classifications=Vendor,Customer` (AND? OR? — implement OR, document it).
   - Add `?role=vendor|customer|employee` shorthand.
   - Verify the list filter UI actually drives the request — currently appears not to.

7. **Role-aware picker.** Update the contact picker used in bill/PO/invoice/sale-order forms to accept `roleFilter` and default to it based on document type. Show classification chip inside each option. Include an "All contacts" toggle for multi-role cases.

8. **Tax rate registry.**
   - Create `TaxRates` sheet (or JSON store): `id, name, kind ('IVA'|'IEPS'|'Retencion'|'Other'), rate, applies_to ('AR'|'AP'|'Both'), active, created_by, created_at`. Seed with `IVA 16%`, `IVA 8% fronterizo`, `IVA 0% exenta`, `Retencion 4% honorarios`.
   - CRUD endpoints + settings page.
   - Replace the hardcoded `0.16` per line on bills/invoices with a picker bound to the registry.
   - Cart/checkout still uses `iva.ts` default — keep it pointed at `IVA 16%` by ID.

9. **Unlabeled UI audit.** Open every bill/order detail screen, list every visible control/badge/number, and either label or remove the unexplained ones. Ask Joshua to forward Antonina's annotated screenshot before closing.

10. **Update docs.** Append the new finance rules to `docs/finance/CLAUDE-FINANCE-RULES.md` and mark this item complete in `COUNTER-CULTURES-ROADMAP.md`.

---

## Acceptance criteria

- Opening any bill, PO, invoice, sale order, quote, or payment shows a `CompanyBadge` in the page header.
- The totals card on those screens is tinted with the entity color; CC and LLC are visually distinct from across the room.
- A mixed-entity record (e.g., LLC payer + CC payee) renders a warning banner instead of silently picking one tint.
- Clicking "Download PDF" on a bill/invoice produces a PDF file or a visible error toast — never silence.
- A finance user can:
  - Open any contact and assign one or more classifications, save, and see them persist on reload.
  - Filter the contacts list by classification, with results that match the saved data.
  - Open a bill picker and see only vendor-side contacts by default, with an "All contacts" toggle to reach multi-role contacts.
  - Open an invoice/quote picker and see only customer-side contacts by default.
- A finance user can create a new tax rate (e.g., `IEPS 8%`) on the Tax Rates settings page, then pick it on a bill line; the total recalculates correctly.
- `CLAUDE-FINANCE-RULES.md` lists the entity-carryover rule and tax-rate registry rule.
- Roadmap entry is updated to "DONE" with a link to the PR.

---

## Verification (manual QA script — run before merging)

1. **Entity tint sanity.** Open two CC bills + two LLC bills + one PO from each entity. Confirm badge + totals tint match in every case.
2. **Mixed-entity guard.** Force-create a bill on CC against an LLC PO (or vice versa). Confirm warning banner appears.
3. **PDF.** Download a CC bill PDF, an LLC bill PDF, and a CFDI factura PDF. All three files open in Preview.
4. **Contacts.** Pick three test contacts; set them to `Vendor`, `Customer`, and `Vendor + Service provider` respectively. Reload — values persist. Filter the list by `Customer` — the customer-only contact appears, the others don't. Filter by `Service provider` — the multi-role contact appears.
5. **Picker.** Start a new bill — only vendor-side contacts in the picker by default. Toggle "All contacts" — multi-role customer appears. Start a new invoice — only customer-side contacts by default.
6. **Tax rates.** From settings, add `IEPS 8%`. Open a bill, set one line to that rate, confirm the bill total matches manual math: `(subtotal_line × 1.08) + (other_lines × 1.16)`.
7. **Annotated screenshot review.** Walk Antonina's screenshot with Joshua, confirm every previously-mystery element is now labeled/removed.

---

## Notes for the agent

- This is a STAGING app — see `AGENTS.md`. Aggressive refactors are safe.
- Do **not** touch `countercultures.com.mx`, Squarespace, DNS, or production Stripe.
- Wherever the doc says **Antonia / Tonina / Antonina**, it's the same person (Antonina Trischitta, `control@countercultures.com.mx`). Follow `AGENTS.md` identity note.
- Branch per fix, commit per fix, update `COUNTER-CULTURES-ROADMAP.md`, close session.
- If Antonina's screenshot is needed to resolve "What does this mean?" — ask Joshua before merging.

---

## How to run

> Open a fresh Claude Code session against `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures` and paste:
>
> ```
> Read AGENTS.md and docs/fixes/p1-antonina-nav-feedback-2026-05-14.md, then execute.
> ```
