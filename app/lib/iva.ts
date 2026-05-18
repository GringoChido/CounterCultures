const IVA_RATE = 0.16;

export interface IvaBreakdown {
  /** Product cost before tax */
  subtotal: number;
  /** IVA portion extracted from the published price */
  iva: number;
  /** Same as the published (tax-inclusive) price passed in */
  total: number;
}

/**
 * Published prices are tax-inclusive (IVA included).
 * This extracts the IVA portion from the total rather than adding it on top.
 *
 * Math: subtotal = total / 1.16, iva = total - subtotal
 */
export function computeIva(
  publishedTotal: number,
  country: "MX" | "US" | string
): IvaBreakdown {
  if (country !== "MX") {
    return { subtotal: publishedTotal, iva: 0, total: publishedTotal };
  }
  const subtotal = Math.round(publishedTotal / (1 + IVA_RATE));
  const iva = publishedTotal - subtotal;
  return { subtotal, iva, total: publishedTotal };
}
