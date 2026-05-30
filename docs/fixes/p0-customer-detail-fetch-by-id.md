# p0 — Customer detail still 404s from an order/invoice link (fetch partner by id)

**Read `AGENTS.md` first, then execute. One fix, one branch, one commit.** Follow-up to `fe0acbf` (Odoo_Partners live fallback).

## Symptom (Joshua, 2026-05-27)
After `fe0acbf` deployed green (Netlify deploy `6a1636bd`, live), opening a customer **from an order or invoice's customer-name link** still shows **"Customer not found — HTTP 404."**

## Root cause (verified)
- Order detail links `href={`/dashboard/customers/${order.partnerId}`}` (`orders/[id]/page.tsx:314`); invoice detail the same (`invoices/[id]/page.tsx:604`). `partnerId` = the Odoo partner integer id (`partner_id_id`).
- The customer-detail API → `getCustomerProfile(id)` → `getOdooPartners()` then `partners.find(p => p.id === id)`; returns `null` (→ 404) when that id isn't in the list (`odoo-sheets.ts:610-612`).
- `fe0acbf`'s live fallback (`fetchPartners`, `client.ts:297`) fetches partners with the domain **`customer_rank>0 OR supplier_rank>0 OR is_company`**. Orders/invoices frequently reference a **child contact / invoice-or-delivery address** partner whose `customer_rank=0`, `supplier_rank=0`, `is_company=false` → **excluded from the list → still 404 on click.**
- (Secondary risk: if any non-MX field in the bulk read is invalid on the live instance, the whole `searchRead` throws → caught → empty list → everything 404s. The fix below also hardens this.)

## Fix

### 1. `app/lib/odoo/client.ts` — add `fetchPartnerById(id)`
A single-record live read so ANY partner that exists in Odoo resolves, regardless of rank/company:
- `const recs = await read("res.partner", [Number(id)], fields)` (or `searchRead("res.partner", [["id","=",Number(id)]], fields, 1)`).
- Use the same field set + shaping as `fetchPartners` (reuse the shaping helpers/`PARTNER_FIELDS_*`). Return the single shaped `OdooPartnerLive` or `null` if not found.
- **Defensive fields (also apply to `fetchPartners`):** wrap the read in try/catch — if it throws (an optional field doesn't exist on this instance), retry once with a MINIMAL CORE set that always renders: `id, name, display_name, email, phone, mobile, vat, is_company, parent_id, child_ids, customer_rank, supplier_rank, country_id, city, street, comment, create_date, write_date`. Optional fields (MX, credit/debit, property_*) degrade to "" — the page still renders. This guarantees a field-name mismatch can never re-cause a 404/blank.
- Export `fetchPartnerById`.

### 2. `app/lib/odoo-sheets.ts` — use it when the partner isn't in the list
In `getCustomerProfile(partnerIdInt)` (line 610) and `getVendorProfile(partnerIdInt)` (line 384): after `const partner = partners.find(...)`, if `!partner` **and** `isConfigured()`, `const partner = await fetchPartnerById(partnerIdInt)`; only `return null` if that is also null. Then continue building the profile exactly as today (invoices/payments/orders are joined by `partner_id_id`, which still works). Optionally push the fetched partner into `partnersCache.data` so repeat views hit cache.

## Acceptance criteria
- Open any order → click the customer name → the 360 loads, **no 404** (even for contact/address partners).
- Same from an invoice, and from a vendor record (`getVendorProfile`).
- The customers **list** still works (no regression to `getCustomerList`/`getOdooPartners`).
- If an optional Odoo field is missing on the instance, the page still renders (degraded fields show "—"), never 404.

## Verification
- `npm run build` green.
- Pick a real order in the dashboard whose customer is a contact/address; confirm its `/dashboard/customers/<partnerId>` returns 200 with the partner.
- Check the function logs: no "field … does not exist" error from the live read (if present, the minimal-core retry should have caught it — confirm the page rendered anyway).

## Sacred Surface / §0
Touches the Odoo read layer only (no sheet-write change). **Additive** — adds a per-id fallback + defensive field handling; the populated-list path and existing joins are unchanged. **§0 YES recorded (Joshua, 2026-05-27 — authorized).** Include the before/after parity note (list path unchanged) in the final report.

## Rollback
Revert the commit; isolated to the two profile readers + the new client helper.
