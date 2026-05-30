# p1 — Quote PDF punch list (Roger, S01856): match the Odoo reference

**Read `AGENTS.md` first, then execute. One branch, one commit.**

## Context
Roger reviewed the portal-generated quotes for **S01856** and **S01852** (`/dashboard/orders/<id>/preview`) and listed the same problems on both. The **correct reference is Odoo's own quote PDF** (Roger attached the S01856 one): logo header, full company + customer block, single product line with its description inline, **Untaxed / VAT 16% / Total**, and the bilingual *Términos de venta / Terms of sale* + bank-deposit block at the bottom. Make the portal quote match that.

**Second confirming example — S01852 (paste-in of Roger's words):** "When I click on customer view, I see all numbers images that don't match. I have a location as a product location of the client. I don't have any taxes at the end of the sales order." Concretely, on S01852: the washbasin line shows a faucet image; the **Shipping & Handling** line shows a broken "?" image; the **customer's delivery address** ("Bodenqui 33, Hacienda de Valle Escondida, Ciudad López Mateos, Atizapán de Zaragoza CP 53937") renders as a **0-qty / $0.00 product row**; and there is **no IVA line** (Subtotal $14,985.00 = Total $14,985.00). All of these are the items below.

> **Strategic note for Joshua (decide before/after this fix):** Odoo already renders this quote perfectly, and the portal preview is literally re-rendering the same Odoo order data. Long-term, the lean-on-Odoo move is to **send Odoo's PDF** (or at minimum collapse the TWO hand-built portal templates into ONE) so they never drift again. This fix-file takes the pragmatic path — make the portal template match Odoo — because the data is all present and Roger needs it right now. If you'd rather serve Odoo's PDF, say so and I'll write that prompt instead (smaller, permanent).

## The two templates (fix the data mapping ONCE, apply to both)
- **`QuoteTemplate`** — `app/(dashboard)/components/templates/quote-template.tsx`. Used by the order **preview** (`orders/[id]/preview/page.tsx`) — **this is the PDF Roger saw** — and by `document-generator.tsx`.
- **`QuoteDocument`** — `app/components/quote-document.tsx`. Used by the **customer-facing** `/quote/[dealId]` page and the dashboard `quotes/[dealId]/print` page. Has the same class of bugs.

**Do this cleanly:** extract a shared `buildQuoteDataFromOrder(order, rawOrder, lines, partnerEmail)` helper (new `app/lib/quote-from-order.ts`) so the data mapping is fixed in ONE place, and have the preview page + document-generator + the customer/print path use it. Then apply the template fixes to both components (or, better, consolidate to one component). Don't fix the mapping inline in three files.

## The 7 fixes (each mapped to current code)

1. **Wrong / broken product images** (S01856: a toilet lever instead of the towel warmer; S01852: a faucet on the washbasin line + a broken "?" image on the Shipping & Handling line). Source: `orders/[id]/preview/page.tsx:87` — `image: /products/odoo/${product_id_id}.jpg` is set unconditionally; the local file is wrong/missing (the "?" = a 404 on a non-existent file, e.g. a shipping/service line that has no image).
   → Only set `image` when `product_id_id` is present in `app/lib/product-image-manifest.json` (the verified-image allowlist). If not in the manifest (true for shipping/service lines and any unverified product), **omit the image** (better no image than a wrong/broken one). Apply in the shared helper.

2. **Header is text, not the logo.** `quote-template.tsx:124–130` (and `quote-document.tsx:27–38`) hardcode `Counter Cultures` + a tagline.
   → Replace with the real CC logo image. **DEPENDENCY — Joshua must add the logo asset** (the "counter / faucets & hardware" mark Odoo uses) to `public/` (e.g. `public/brand/counter-logo.svg` or `.png`); it is NOT in the repo. Render `<img src="/brand/counter-logo.svg" alt="Counter Cultures" />` in the header. Keep the company address block (Calle San Juan #11-A, Col. Providencia 37737, San Miguel de Allende, Guanajuato, México · Teléfono 415.154.8375 · equipo@countercultures.com.mx · countercultures.com.mx) to match the Odoo header/footer.

3. **Customer block is name + email only.** `orders/[id]/preview/page.tsx:80–81` hardcodes `customerCompany: ""` and forces the email; template `quote-template.tsx:149–155`.
   → Match Odoo: show the customer **name** (and **company** if present). **Drop the email** (Odoo's quote doesn't show it). If you want the richer block, thread the partner's billing address + RFC from the Odoo partner (via `fetchPartnerById`/the partners source) — optional; confirm with Joshua.

4. **Odoo note/section lines render as separate 0-qty / $0 product rows.** Source: `orders/[id]/preview/page.tsx:82–88` maps EVERY Odoo `sale.order.line` to a product row, including **note/section lines** (`display_type='line_note'/'line_section'`, qty 0, price 0, no product). On S01856 this is the "Dual Connection: …" description; on **S01852 it's the customer's delivery address** ("Bodenqui 33, Hacienda de Valle Escondida…") — Roger's "I have a location as a product location of the client."
   → In the shared helper, **exclude note/section lines from the items table**: drop lines where `product_uom_qty === 0 && price_unit === 0 && !product_id_id`. **Keep real charge lines** like "Shipping & Handling" (qty 1, $1,800 — has a product/price) — only the true zero/zero/no-product note lines drop. For a genuine product **description** note (like "Dual Connection: …"), attach its text as a `description` on the preceding product line and render it as small text under the product name (matching how Odoo shows the description inline); a pure address/section line should just be dropped. (If the orders API can expose `display_type`, prefer filtering on that; otherwise the qty/price/no-product heuristic is reliable.)

5. **No IVA line.** The order already carries the tax totals — `OrderRow.amountUntaxed / amountTax / amountTotal` (`orders/[id]/preview/page.tsx:16–18`), but the template recomputes from line items and ignores tax (`quote-template.tsx:248–266`).
   → Pass `amountUntaxed`, `amountTax`, `amountTotal` into `QuoteData` and render the totals block as **Subtotal (untaxed) → IVA 16% → Total**, using the order's amounts (so it reads $540.00 / $86.40 / $626.40 like Odoo). Use `amountTax`/`amountTotal` directly rather than recomputing.

6. **Remove the "Payment Terms" block.** `orders/[id]/preview/page.tsx:91` hardcodes `paymentTerms`; template renders the two-column Payment Terms + Estimated Delivery block (`quote-template.tsx:269–282`). Roger: "that does not need to be there."
   → Delete that block (and the hardcoded `paymentTerms`/`deliveryEstimate`). Odoo has no separate payment-terms block — the terms text covers it.

7. **T&C and Notes are backwards.** The gray "Terms & Conditions" box shows hardcoded "70% deposit confirms the order…" (`quote-template.tsx:284–297`, `t.terms70`/`t.termsRelease`), while the real terms (the Odoo `note`) get dumped into "Notes" (`orders/[id]/preview/page.tsx:93`). Roger: T&C should be the terms text; Notes blank if none.
   → Set the **Terms & Conditions** content to the canonical bilingual terms from **`docs/CC-STANDARD-QUOTE-TERMS.md`** (verbatim — Términos de venta ES + Terms of sale EN + returns policy + bank-deposit block), which equals the Odoo `note`. Remove the hardcoded `terms70`/`termsRelease` + the deposit-amount line. Make **Notes render only a genuine per-quote note** (and since the Odoo `note` field holds the terms, don't render it as Notes too — Notes is blank unless there's a distinct note). ⚠️ The canonical doc flags a likely typo: EN restocking line "may be **suspected**" → almost certainly "**subject**"; confirm with Joshua before shipping.

## Acceptance criteria (side-by-side with Roger's Odoo PDF)
- Header shows the CC logo (not text); company address present.
- Customer block: name (+ company if any); no stray email.
- One product line, qty 1, $540.00, description inline; **no 0-qty/$0 row.**
- Verified product image or none (never a wrong image).
- Totals: Subtotal $540.00 · IVA 16% $86.40 · Total $626.40.
- No "Payment Terms" block.
- Terms & Conditions = the canonical bilingual terms + bank-deposit info; Notes blank (no note present).
- Same result on the customer `/quote/[dealId]` path (QuoteDocument) — or both routes use the consolidated component.

## Verification
- `npm run build` green.
- Open `/dashboard/orders/<S01856-id>/preview` → compare to the attached Odoo PDF; all 8 criteria pass.
- Open the customer `/quote/<dealId>` and `quotes/<dealId>/print` → same layout (no divergence).
- Confirm a note line in Odoo no longer appears as a $0 product row.

## Sacred Surface / §0
Customer-facing quote document (adjacent to the factura/communication surface). **Additive/visual + data-shaping** — no change to pricing math, cart, or factura. **Get Joshua's explicit YES** and include a before/after screenshot parity note (preview vs the Odoo PDF) in the final report. Logo asset is a required input from Joshua.

## Rollback
Revert the commit; isolated to the quote template(s) + the new `quote-from-order.ts` helper + the three call sites.
