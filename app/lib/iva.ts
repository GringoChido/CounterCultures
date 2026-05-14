const IVA_RATE = 0.16;

export interface IvaBreakdown {
  subtotal: number;
  iva: number;
  total: number;
}

export function computeIva(
  subtotalMXN: number,
  country: "MX" | "US" | string
): IvaBreakdown {
  const iva = country === "MX" ? Math.round(subtotalMXN * IVA_RATE) : 0;
  return { subtotal: subtotalMXN, iva, total: subtotalMXN + iva };
}
