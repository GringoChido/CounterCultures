# p0 — Customers 404 / empty: `Odoo_Partners` mirror has no writer

**Read `AGENTS.md` first, then execute this file. One fix, one branch, one commit.**

## Symptom (Joshua, 2026-05-26)
- `/dashboard/customers` shows nothing (empty list).
- Any `/dashboard/customers/[id]` shows **"Customer not found — HTTP 404"**.
- (Same root cause also blanks partner **names** on orders / invoices / vendors detail.)

This is **NOT** an Odoo login/auth problem. The portal→Odoo connection works (invoices/payments/sale-orders are syncing via `ODOO_API_KEY`). The customer screens read a Google Sheet mirror tab that **nothing populates**.

## Root cause (verified, file:line)
- The customer detail API returns 404 only when `getCustomerProfile()` returns `null` (`app/api/dashboard/customers/[id]/route.ts:11-13`).
- `getCustomerProfile()` → `getOdooPartners()` → `readSheet("Odoo_Partners")` (`app/lib/odoo-sheets.ts:238-242, 590-594`). `getCustomerList()` uses the same source (`odoo-sheets.ts:736-741`).
- `readSheet` returns `[]` (does **not** throw) when a tab is empty (`app/lib/dashboard-sheets.ts:146`) → empty partners → `find()` is undefined → `null` → **404** (a 500 would mean a read error; we get 404, so the tab is simply empty).
- **`Odoo_Partners` has no writer anywhere in the repo.** The Odoo→Sheets sync targets are only `account.move`, `account.payment`, `sale.order`, `purchase.order` (`app/lib/odoo/sync.ts:177-196`). There is **no `res.partner` target**. Grep confirms `Odoo_Partners` appears only in the `SheetTab` type (`dashboard-sheets.ts:59`) and the reader (`odoo-sheets.ts:240`).

So the tab was hand-seeded once (or by a since-removed script) and is now empty. Every partner read fails.

## Fix — two additive parts (both use the existing `ODOO_API_KEY`, no new creds)

### Part A — INSTANT restore: live-read fallback in `getOdooPartners()`
Mirror the proven pattern used for sale-order lines (`fetchSaleOrderLines`, commit `e1f9e03`): when the mirror tab is empty, read live from Odoo and cache.

1. In `app/lib/odoo/client.ts`, add `fetchPartners()` — a live `res.partner` read via the existing JSON-RPC client. Request **exactly** the fields the UI reads (see field list below). Use a domain that returns customers + vendors and their related contacts:
   `['|','|', ('customer_rank','>',0), ('supplier_rank','>',0), ('is_company','=',true)]`
   - **Verify field names against the live instance before shipping** (esp. the MX-localization fields `l10n_mx_edi_fiscal_regime`, `l10n_mx_edi_usage`, and computed `credit`/`debit`/`total_invoiced`). If any field errors, drop it from the read rather than letting the whole call throw.
   - Shape each record to match the `OdooPartner` row shape the readers expect: many2one → display string in the base key + integer id in `<field>_id` (e.g. `parent_id` → `parent_id_id`); `child_ids` → pipe-joined ids; booleans as `"True"`/`"False"` strings to match the existing sheet convention (`partner.is_company === "True"` check in `customers/[id]/page.tsx:225`).
2. In `app/lib/odoo-sheets.ts` `getOdooPartners()` (line 238): after `readSheet("Odoo_Partners")`, if the result is empty **and** Odoo is configured, fall back to `fetchPartners()`. Keep the existing `partnersCache` TTL so the live read happens at most once per TTL, not per request. When the sheet has rows, behavior is **unchanged** (parity).

### Part B — DURABLE: add `res.partner` to the hourly sync
So the mirror stays warm and the live fallback is rarely hit.

3. In `app/lib/odoo/sync.ts`, add a `res.partner` → `Odoo_Partners` entry to the sync targets array (alongside `account.move` etc., `~line 177-196`) with a field map covering the columns below, including `write_date` (load-bearing for the incremental cursor — see `PROMPT-odoo-sync-writedate-cursor.md`). Use the same domain as Part A. Run `ensureColumns` for the new tab like the other targets.

### Field list (from the `OdooPartner` interface, `customers/[id]/page.tsx:33-63`)
`id, name, display_name, email, phone, mobile, street, street2, city, state_id (m2o), zip, country_id (m2o), vat, l10n_mx_edi_fiscal_regime, l10n_mx_edi_usage, is_company, customer_rank, supplier_rank, property_payment_term_id (m2o), property_product_pricelist (m2o), user_id (m2o), comment, create_date, write_date, credit, debit, credit_limit, total_invoiced, parent_id (m2o → parent_id_id), child_ids (x2many)`

## Acceptance criteria
- `/dashboard/customers` lists partners again; clicking one opens the 360 (no 404).
- Partner **names** render on `/dashboard/orders/[id]`, `/dashboard/invoices/[id]`, `/dashboard/vendors`.
- With the tab populated (after one sync, or live fallback), `getOdooPartners()` reads the sheet (fast path); fallback only fires on empty.
- No change to any existing tab's writes; no change to behavior when `Odoo_Partners` is non-empty.

## Verification
- `npm run build` + `npm test` green.
- Hit `/api/dashboard/customers` and `/api/dashboard/customers/<a-real-odoo-partner-id>` locally/preview → 200 with data.
- Confirm `fetchPartners()` field list matches the live Odoo `res.partner` (no field-not-found error).
- Confirm the new sync target wrote `Odoo_Partners` (row count > 0) on a manual `odoo-sync` run.

## Sacred Surface / §0
Touches **sheet writes** (new `Odoo_Partners` write target) and the Odoo read layer. The change is **additive**: it adds a new mirror target + an empty-only fallback; existing tab writes and populated-tab reads are untouched. **§0 YES recorded (Joshua, 2026-05-26 — authorized this fix).** Still produce the before/after parity note (sheet-populated read path unchanged) in the final report.

## Rollback
Revert the commit. The fallback and new sync target are isolated; no schema migration beyond the new tab's header columns.
