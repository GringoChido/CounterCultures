/**
 * Per-item landed-cost allocation (R4 Note 6 — sub-gap 6d).
 *
 * Once a tráfico has a totalImportCost (cálculo + truck-crossing fee +
 * factura adjustments), each PedimentoItem inherits a fair share of
 * those import costs proportional to its vendor-invoice subtotal.
 * That share, divided by the item's quantity, becomes the per-unit
 * landed cost — which Roger uses to confirm margin on the deal line
 * items.
 *
 * Allocation strategy: invoice-total-weighted (no weights/volumes
 * available in the model today). When the total invoice amount is
 * zero, allocation falls back to even-split across items so we don't
 * produce NaN.
 *
 * Math:
 *   item.allocatedImportCost = totalImportCost * (item.invoiceTotal / Σ invoiceTotal)
 *   item.perUnitLanded       = (item.invoiceTotal + item.allocatedImportCost) / Σ qty
 */

import type { Trafico, PedimentoItem } from "./customs-data";

export interface PerItemAllocation {
  itemId: string;
  vendorName: string;
  invoiceTotal: number;
  /** Share of the tráfico's total import cost this item carries. */
  allocatedImportCost: number;
  /** Allocation as a fraction of the total import cost (0..1). */
  allocationPercent: number;
  /** Total landed cost = invoiceTotal + allocatedImportCost. */
  totalLandedCost: number;
  /** Sum of quantities across this item's products. */
  totalQty: number;
  /** totalLandedCost / totalQty (0 when no qty). */
  perUnitLanded: number;
}

export interface PerDealAllocation {
  dealId: string;
  itemCount: number;
  invoiceSubtotal: number;
  allocatedImportCost: number;
  totalLandedCost: number;
}

const sumInvoice = (items: PedimentoItem[]): number =>
  items.reduce((acc, it) => acc + (it.invoiceTotal ?? 0), 0);

const sumQty = (item: PedimentoItem): number =>
  item.products.reduce((acc, p) => acc + (p.quantity ?? 0), 0);

/**
 * Compute per-item allocations for a tráfico. Returns one entry per
 * item, in the same order as the input.
 */
export const allocateLandedCost = (
  trafico: Pick<Trafico, "items" | "totalImportCost" | "calculoTotal">
): PerItemAllocation[] => {
  const items = trafico.items ?? [];
  if (items.length === 0) return [];

  const totalImportCost =
    trafico.totalImportCost ?? trafico.calculoTotal ?? 0;
  const totalInvoice = sumInvoice(items);

  return items.map((item) => {
    const invoiceTotal = item.invoiceTotal ?? 0;
    const share =
      totalInvoice > 0
        ? invoiceTotal / totalInvoice
        : 1 / items.length;
    const allocatedImportCost = Math.round(totalImportCost * share * 100) / 100;
    const totalLandedCost = Math.round((invoiceTotal + allocatedImportCost) * 100) / 100;
    const totalQty = sumQty(item);
    const perUnitLanded = totalQty > 0 ? Math.round((totalLandedCost / totalQty) * 100) / 100 : 0;
    return {
      itemId: item.id,
      vendorName: item.vendorName,
      invoiceTotal,
      allocatedImportCost,
      allocationPercent: Math.round(share * 10000) / 100,
      totalLandedCost,
      totalQty,
      perUnitLanded,
    };
  });
};

/**
 * Roll up per-item allocations into per-deal totals. Useful for the
 * deal detail page where Roger wants "for this deal, what did the
 * goods actually cost landed?" without thinking item-by-item.
 */
export const rollupByDeal = (
  trafico: Pick<Trafico, "items" | "totalImportCost" | "calculoTotal">
): PerDealAllocation[] => {
  const allocations = allocateLandedCost(trafico);
  const byDeal = new Map<string, PerDealAllocation>();
  for (let i = 0; i < (trafico.items ?? []).length; i++) {
    const item = trafico.items[i];
    const dealId = item.dealId;
    if (!dealId) continue;
    const alloc = allocations[i];
    const existing = byDeal.get(dealId);
    if (existing) {
      existing.itemCount += 1;
      existing.invoiceSubtotal = Math.round((existing.invoiceSubtotal + alloc.invoiceTotal) * 100) / 100;
      existing.allocatedImportCost = Math.round((existing.allocatedImportCost + alloc.allocatedImportCost) * 100) / 100;
      existing.totalLandedCost = Math.round((existing.totalLandedCost + alloc.totalLandedCost) * 100) / 100;
    } else {
      byDeal.set(dealId, {
        dealId,
        itemCount: 1,
        invoiceSubtotal: alloc.invoiceTotal,
        allocatedImportCost: alloc.allocatedImportCost,
        totalLandedCost: alloc.totalLandedCost,
      });
    }
  }
  return Array.from(byDeal.values());
};
