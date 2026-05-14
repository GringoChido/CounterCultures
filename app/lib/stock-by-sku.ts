/**
 * Server-side SKU → stock-quantity lookup, backed by the cached
 * CC_Products_Full catalog (which already joins Odoo Stock_Quants for
 * internal-location totals). Used by the PO generator to decide whether
 * a line item ships from stock or needs a vendor PO.
 *
 * Falls back to "unknown" (returns null) when the catalog cache is empty
 * — caller should treat null as "assume zero" and generate a PO. This
 * keeps fulfilment moving even if the products mirror is unreachable.
 */
import { getProductsBySkus } from "./products-full";

/**
 * Build a map of upper-cased SKU → on-hand qty across CC's internal
 * warehouses, restricted to the SKUs the caller asks about. Reads the
 * already-cached Products catalog so this is cheap after the first call
 * of the deploy lifecycle.
 *
 * Missing SKUs (not in the catalog mirror) are returned with qty 0 so
 * the caller can decide policy. Missing-from-catalog typically means
 * the line item came from a freeform Quote_Item — Roger orders it
 * special, so default-to-PO is the correct behavior.
 */
export const getStockMapForSkus = async (
  skus: string[],
): Promise<Map<string, number>> => {
  const out = new Map<string, number>();
  const wanted = skus.map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (wanted.length === 0) return out;

  const products = await getProductsBySkus(wanted);
  for (const sku of wanted) {
    const p = products.get(sku);
    out.set(sku, p?.stockQty ?? 0);
  }
  return out;
};

