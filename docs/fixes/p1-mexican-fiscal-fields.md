# [P1] Mexican Fiscal Fields — SAT Codes, Clave Unidad, HS, IVA

> **Status:** PENDING · **Priority:** P1 · **Effort:** 1 day (skeleton) + ongoing population · **Branch:** `claude/fix-mexican-fiscal-fields`
> **Last updated:** 2026-05-12

## Why this matters
Mexican CFDI 4.0 (factura electrónica) is mandatory for every B2B sale and most B2C sales above the threshold. Each invoice line item must carry: SAT "clave de producto y servicio" (8-digit SAT product code), "clave de unidad" (SAT unit code, e.g., H87 for piece), and — for imported goods — HS code (Harmonized System, 8-10 digits) and the correct IVA rate (16% national, 8% fronterizo, 0% certain exempt categories). Today our `CC_Products_Full` sheet has ZERO of these fields, which means automated factura generation is impossible — every factura is manual, every error is a fine, and every trade-customer order is a finance bottleneck. Adding these fields is the unblock for the entire factura automation stack.

## The problem (evidence)
- `CC_Products_Full` columns include `name`, `sku`, `price`, `category`, etc. — no `sat_code`, no `clave_unidad`, no `hs_code`, no `iva_rate`.
- `app/lib/ar-factura.ts` has TODO comments where SAT codes would slot in.
- Current factura process: Antonia opens a SAT portal, hand-keys each line item's SAT code. Error-prone, takes 15-20 min per factura.
- No mapping table from internal categories → SAT codes exists.

## Scope
**In scope:**
- Add 4 new columns to `CC_Products_Full`: `sat_code`, `clave_unidad`, `hs_code`, `iva_rate`.
- Build a category→SAT mapping table (`SAT_Code_Map` sheet) for default values.
- Auto-populate where possible (Showroom Selection ~200 products manually + category defaults for the rest).
- Editor UI on a product detail page in the dashboard for ambiguous ones.
- Wire fields into `ar-factura.ts` and CFDI generation.
- Surface "Missing SAT code" warnings in the dashboard Products view.

**Out of scope:**
- Full CFDI emit integration (separate ticket — depends on PAC provider).
- Trade-IVA rate variations (export, fronterizo) beyond a per-product override.
- Customs-broker integration for import HS codes.

## Files to touch
- `CC_Products_Full` sheet — add 4 columns.
- New `SAT_Code_Map` sheet — `category → sat_code, clave_unidad, default_iva_rate, default_hs_code`.
- New `app/lib/sat-codes.ts` — `getSatCodeForCategory(category)`, `resolveFiscalFields(product)`.
- Modify `app/lib/products-full.ts` — surface fiscal fields on the Product type.
- Modify `app/lib/ar-factura.ts` — pull fiscal fields per line; throw if missing.
- New `app/(dashboard)/dashboard/(portal)/products/[id]/fiscal/page.tsx` — staff editor for fiscal fields.
- New `app/api/dashboard/products/[id]/fiscal/route.ts` — PATCH endpoint.
- Modify Products list view — show a "missing fiscal" badge per row when fields incomplete.

## SAT_Code_Map seed (initial mapping)
| Category | sat_code | clave_unidad | default_iva | default_hs |
|---|---|---|---|---|
| sillas | 56101500 | H87 | 0.16 | 9401.71.01 |
| mesas | 56101700 | H87 | 0.16 | 9403.60.99 |
| sofas | 56101513 | H87 | 0.16 | 9401.61.01 |
| iluminacion | 39111500 | H87 | 0.16 | 9405.10.99 |
| textiles | 11160000 | M2 | 0.16 | 6304.92.01 |
| accesorios | 56110000 | H87 | 0.16 | 9403.60.99 |
| (default) | 56100000 | H87 | 0.16 | 9403.60.99 |

(Verify each with Antonia / the team's PAC vendor list before locking in.)

## The fix (step by step)
1. Add `sat_code`, `clave_unidad`, `hs_code`, `iva_rate` columns to `CC_Products_Full`. Default empty (`iva_rate` defaults to `0.16`).
2. Create `SAT_Code_Map` sheet with the seed table above. Share with service account.
3. Implement `app/lib/sat-codes.ts`:
   - `loadSatMap()` — cached.
   - `resolveFiscalFields(product)`:
     - If product has explicit `sat_code` → use product's values.
     - Else look up category in SAT_Code_Map → use map defaults.
     - Else use `(default)` row.
     - Return `{ sat_code, clave_unidad, iva_rate, hs_code }`.
4. Update Product TypeScript type with the 4 new fields.
5. Modify `ar-factura.ts`:
   - For each line item, call `resolveFiscalFields(product)`.
   - Pass `sat_code`, `clave_unidad`, `iva_rate`, `hs_code` into the CFDI XML builder.
   - If any required field still missing AND no map default → throw `MissingFiscalFieldsError(productId)` with a clear message.
6. Build the staff fiscal editor (`/dashboard/products/[id]/fiscal`):
   - Form with the 4 fields, dropdown for `clave_unidad` (H87, M2, KG, etc.), free-text for SAT codes with format validation (8 digits), default-from-map button.
   - Save → PATCH `app/api/dashboard/products/[id]/fiscal/route.ts` → write to `CC_Products_Full`.
7. Products list view: add a small "fiscal: incomplete" pill on rows where neither product nor category-map provides a SAT code.
8. Optional one-shot script `scripts/backfill-fiscal-from-map.ts` — for every product without explicit fields, copy category-map defaults into the product row (makes future edits faster).

## Acceptance criteria
- [ ] 4 new columns exist on `CC_Products_Full`.
- [ ] `SAT_Code_Map` exists with 6 categories + default.
- [ ] `resolveFiscalFields()` returns valid values for any product (explicit, map-default, or default fallback).
- [ ] `ar-factura.ts` throws a clear error if a product can't resolve.
- [ ] Staff editor saves and roundtrips correctly.
- [ ] Products list visibly flags incomplete rows.
- [ ] Top 200 Showroom Selection products have explicit fields (manual pass during ship).

## Verification
```bash
# Resolve fiscal for a known product
curl -s "$BASE_URL/api/dashboard/products/ODOO_12345/fiscal" -H "Cookie: <staff>"
# Expected: { sat_code: "56101500", clave_unidad: "H87", iva_rate: 0.16, hs_code: "9401.71.01" }

# Generate a draft factura — should not throw
curl -X POST "$BASE_URL/api/dashboard/ar/factura/preview" \
  -H "Content-Type: application/json" \
  -d '{"dealId":"DEAL-TEST-002"}'
```
Expected: returns CFDI XML preview with SAT codes populated per line.

## Dependencies
**Requires:** None for the skeleton.
**Blocks:** P1.13 (Factura Stripe bridge — emits factura post-payment), automated CFDI emit, monthly close (Antonia can't close without invoicing all closed-won deals).

## Notes
- The map's defaults are a stopgap — every Showroom Selection product should eventually have explicit fields (Antonia/Roger's PAC vendor flags wrong codes as audit risk).
- IVA fronterizo (8%) applies only for sales delivered to the northern border zone — not a product attribute. Handle at the customer/address layer, not the product layer.
- HS codes are required for export and import documentation; for domestic-only sales they're optional but recommended.
- SAT publishes the official "Catálogo de claves de producto y servicio" XLS — link in `docs/finance/sat-reference.md` (create that doc when this fix ships).
- Future: validate SAT code against the official catalog list at PATCH time to prevent typos.
