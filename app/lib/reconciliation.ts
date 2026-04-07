/**
 * Reconciliation engine for Counter Cultures Pedimento module.
 *
 * "Reconciliation on absolutely everything." — Every dollar in, every dollar out.
 * Every invoice vs PO, every calculo vs factura, every payment vs estimate.
 */

import type {
  Trafico,
  PedimentoItem,
  ReconciliationCheck,
  ReconciliationResult,
  ReconciliationLevel,
} from "./customs-data";
import type { PurchaseOrder } from "./sample-dashboard-data";

// ---------------------------------------------------------------------------
// Threshold constants
// ---------------------------------------------------------------------------

const CALCULO_VS_PAYMENT_THRESHOLD = 1;     // > $1 MXN = yellow
const CALCULO_VS_FACTURA_YELLOW = 0.01;     // > 1% = yellow
const CALCULO_VS_FACTURA_RED = 0.05;        // > 5% = red
const CROSSING_FEE_BASELINE = 2668;         // $2,668 MXN
const CROSSING_FEE_VARIANCE_THRESHOLD = 500; // > $500 = yellow

// ---------------------------------------------------------------------------
// Individual check functions
// ---------------------------------------------------------------------------

const checkInvoiceVsPO = (
  item: PedimentoItem,
  po: PurchaseOrder | undefined
): ReconciliationCheck | null => {
  if (!po) return null;

  const poTotal = po.totalAmount;
  const invoiceTotal = item.invoiceTotal;
  const variance = invoiceTotal - poTotal;
  const variancePercent = poTotal > 0 ? (variance / poTotal) * 100 : 0;

  let level: ReconciliationLevel = "pass";
  if (Math.abs(variance) > 0.01) level = "warning";

  return {
    id: `inv-po-${item.id}`,
    traficoId: item.traficoId,
    checkType: "invoice-vs-po",
    label: {
      en: `${item.vendorName} invoice vs PO`,
      es: `Factura ${item.vendorName} vs OC`,
    },
    expected: poTotal,
    actual: invoiceTotal,
    variance: Math.round(variance * 100) / 100,
    variancePercent: Math.round(variancePercent * 10) / 10,
    level,
    note: level === "warning"
      ? `Variance of $${Math.abs(variance).toFixed(2)} between invoice and PO`
      : undefined,
  };
};

const checkCalculoVsPayment = (trafico: Trafico): ReconciliationCheck | null => {
  if (!trafico.calculoTotal || !trafico.calculoPayment) return null;

  const expected = trafico.calculoTotal;
  const actual = trafico.calculoPayment.amount;
  const variance = actual - expected;
  const variancePercent = expected > 0 ? (variance / expected) * 100 : 0;

  let level: ReconciliationLevel = "pass";
  if (Math.abs(variance) > CALCULO_VS_PAYMENT_THRESHOLD) level = "warning";

  return {
    id: `calc-pay-${trafico.id}`,
    traficoId: trafico.id,
    checkType: "calculo-vs-payment",
    label: {
      en: "Calculo vs Payment Sent",
      es: "Calculo vs Pago Enviado",
    },
    expected,
    actual,
    variance: Math.round(variance * 100) / 100,
    variancePercent: Math.round(variancePercent * 10) / 10,
    level,
    note: level === "warning"
      ? `$${Math.abs(variance).toFixed(2)} difference (likely rounding)`
      : undefined,
  };
};

const checkCalculoVsFactura = (trafico: Trafico): ReconciliationCheck | null => {
  if (!trafico.calculoTotal || !trafico.facturaAmount) return null;

  const expected = trafico.calculoTotal;
  const actual = trafico.facturaAmount;
  const variance = actual - expected;
  const variancePercent = expected > 0 ? Math.abs(variance / expected) : 0;

  let level: ReconciliationLevel = "pass";
  if (variancePercent > CALCULO_VS_FACTURA_RED) level = "error";
  else if (variancePercent > CALCULO_VS_FACTURA_YELLOW) level = "warning";

  return {
    id: `calc-fact-${trafico.id}`,
    traficoId: trafico.id,
    checkType: "calculo-vs-factura",
    label: {
      en: "Calculo vs Final Factura",
      es: "Calculo vs Factura Final",
    },
    expected,
    actual,
    variance: Math.round(variance * 100) / 100,
    variancePercent: Math.round(variancePercent * 1000) / 10,
    level,
    note: level !== "pass"
      ? `${(variancePercent * 100).toFixed(1)}% variance — ${level === "error" ? "escalate to Roger" : "review line items"}`
      : undefined,
  };
};

const checkCrossingFeeBaseline = (trafico: Trafico): ReconciliationCheck | null => {
  if (!trafico.truckCrossingFee) return null;

  const expected = CROSSING_FEE_BASELINE;
  const actual = trafico.truckCrossingFee;
  const variance = actual - expected;

  let level: ReconciliationLevel = "pass";
  if (Math.abs(variance) > CROSSING_FEE_VARIANCE_THRESHOLD) level = "warning";

  return {
    id: `cross-fee-${trafico.id}`,
    traficoId: trafico.id,
    checkType: "crossing-fee-baseline",
    label: {
      en: "Crossing Fee vs Baseline",
      es: "Tarifa de Cruce vs Base",
    },
    expected,
    actual,
    variance,
    variancePercent: expected > 0 ? Math.round((variance / expected) * 1000) / 10 : 0,
    level,
    note: level === "warning" ? "Crossing fee significantly different from baseline" : undefined,
  };
};

const checkCostAllocationBalance = (
  trafico: Trafico,
  allocations: { dealId: string; percent: number }[]
): ReconciliationCheck => {
  const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0);
  const variance = totalPercent - 100;

  return {
    id: `alloc-${trafico.id}`,
    traficoId: trafico.id,
    checkType: "cost-allocation-balance",
    label: {
      en: "Cost Allocation Balance",
      es: "Balance de Asignación de Costos",
    },
    expected: 100,
    actual: Math.round(totalPercent * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    variancePercent: variance,
    level: Math.abs(variance) > 0.01 ? "error" : "pass",
    note: Math.abs(variance) > 0.01 ? "Allocations do not sum to 100%" : undefined,
  };
};

// ---------------------------------------------------------------------------
// Main reconciliation function
// ---------------------------------------------------------------------------

export const reconcileTrafico = (
  trafico: Trafico,
  purchaseOrders?: PurchaseOrder[]
): ReconciliationResult => {
  const checks: ReconciliationCheck[] = [];

  // 1. Invoice vs PO for each item
  for (const item of trafico.items) {
    const po = purchaseOrders?.find((p) => p.id === item.poId);
    const check = checkInvoiceVsPO(item, po);
    if (check) checks.push(check);
  }

  // 2. Calculo vs Payment
  const calcPayCheck = checkCalculoVsPayment(trafico);
  if (calcPayCheck) checks.push(calcPayCheck);

  // 3. Calculo vs Factura
  const calcFactCheck = checkCalculoVsFactura(trafico);
  if (calcFactCheck) checks.push(calcFactCheck);

  // 4. Crossing fee baseline
  const crossFeeCheck = checkCrossingFeeBaseline(trafico);
  if (crossFeeCheck) checks.push(crossFeeCheck);

  // 5. USMCA savings (informational)
  const savings = calculateUSMCASavings(trafico);
  if (savings.totalSaved > 0) {
    checks.push({
      id: `usmca-${trafico.id}`,
      traficoId: trafico.id,
      checkType: "usmca-savings",
      label: {
        en: "USMCA Savings",
        es: "Ahorros USMCA",
      },
      expected: 0,
      actual: savings.totalSaved,
      variance: savings.totalSaved,
      variancePercent: 0,
      level: "info",
      note: `IGI waived: $${savings.igiWaived.toLocaleString()}, DTA waived: $${savings.dtaWaived.toLocaleString()}`,
    });
  }

  const totalVariance = checks
    .filter((c) => c.checkType !== "usmca-savings" && c.checkType !== "cost-allocation-balance")
    .reduce((sum, c) => sum + Math.abs(c.variance), 0);

  return {
    traficoId: trafico.id,
    checks,
    totalVariance: Math.round(totalVariance * 100) / 100,
    hasWarnings: checks.some((c) => c.level === "warning"),
    hasErrors: checks.some((c) => c.level === "error"),
  };
};

// ---------------------------------------------------------------------------
// Pro-rata cost allocation
// ---------------------------------------------------------------------------

export const calculateProRataAllocation = (
  trafico: Trafico,
  dealItems: PedimentoItem[]
): { dealId: string; percent: number; allocatedCost: number }[] => {
  const totalInvoiceValue = trafico.items.reduce(
    (sum, item) => sum + item.invoiceTotal,
    0
  );
  const totalImportCost = trafico.totalImportCost ?? 0;

  if (totalInvoiceValue === 0 || totalImportCost === 0) return [];

  // Group by dealId
  const dealTotals = new Map<string, number>();
  for (const item of dealItems) {
    const dealId = item.dealId ?? "inventory";
    dealTotals.set(dealId, (dealTotals.get(dealId) ?? 0) + item.invoiceTotal);
  }

  return Array.from(dealTotals.entries()).map(([dealId, dealInvoiceTotal]) => {
    const percent = (dealInvoiceTotal / totalInvoiceValue) * 100;
    const allocatedCost = (percent / 100) * totalImportCost;

    return {
      dealId,
      percent: Math.round(percent * 100) / 100,
      allocatedCost: Math.round(allocatedCost * 100) / 100,
    };
  });
};

// ---------------------------------------------------------------------------
// USMCA savings calculation
// ---------------------------------------------------------------------------

export const calculateUSMCASavings = (
  trafico: Trafico
): { igiWaived: number; dtaWaived: number; totalSaved: number } => {
  // Items with USMCA cert get IGI=0 and DTA=0
  const itemsWithCert = trafico.items.filter(
    (item) =>
      item.usmcaStatus === "on-file" || item.usmcaStatus === "received"
  );

  if (itemsWithCert.length === 0) {
    return { igiWaived: 0, dtaWaived: 0, totalSaved: 0 };
  }

  // Estimate savings based on calculo breakdown
  // IGI and DTA from the calculo would not apply if USMCA cert is presented
  const breakdown = trafico.calculoBreakdown;
  if (!breakdown) {
    return { igiWaived: 0, dtaWaived: 0, totalSaved: 0 };
  }

  // Pro-rata the IGI and DTA savings based on certified items' invoice value
  const totalInvoiceValue = trafico.items.reduce(
    (sum, item) => sum + item.invoiceTotal,
    0
  );
  const certifiedInvoiceValue = itemsWithCert.reduce(
    (sum, item) => sum + item.invoiceTotal,
    0
  );
  const certRatio = totalInvoiceValue > 0 ? certifiedInvoiceValue / totalInvoiceValue : 0;

  const igiWaived = Math.round(breakdown.igi * certRatio * 100) / 100;
  const dtaWaived = Math.round(breakdown.dta * certRatio * 100) / 100;

  return {
    igiWaived,
    dtaWaived,
    totalSaved: Math.round((igiWaived + dtaWaived) * 100) / 100,
  };
};

// ---------------------------------------------------------------------------
// Full allocation with breakdown
// ---------------------------------------------------------------------------

export const calculateFullAllocation = (
  trafico: Trafico
): {
  dealId: string;
  percent: number;
  allocatedTaxes: number;
  allocatedBrokerFees: number;
  allocatedWarehouse: number;
  allocatedTruckFee: number;
  totalImportCost: number;
}[] => {
  const totalInvoiceValue = trafico.items.reduce(
    (sum, item) => sum + item.invoiceTotal,
    0
  );
  const breakdown = trafico.calculoBreakdown;
  const truckFee = trafico.truckCrossingFee ?? 0;

  if (totalInvoiceValue === 0 || !breakdown) return [];

  // Group by dealId
  const dealTotals = new Map<string, number>();
  for (const item of trafico.items) {
    const dealId = item.dealId ?? "inventory";
    dealTotals.set(dealId, (dealTotals.get(dealId) ?? 0) + item.invoiceTotal);
  }

  return Array.from(dealTotals.entries()).map(([dealId, dealInvoiceTotal]) => {
    const percent = dealInvoiceTotal / totalInvoiceValue;

    return {
      dealId,
      percent: Math.round(percent * 10000) / 100,
      allocatedTaxes: Math.round(breakdown.taxSubtotal * percent * 100) / 100,
      allocatedBrokerFees: Math.round(breakdown.brokerSubtotal * percent * 100) / 100,
      allocatedWarehouse: Math.round(breakdown.warehouseSubtotal * percent * 100) / 100,
      allocatedTruckFee: Math.round(truckFee * percent * 100) / 100,
      totalImportCost: Math.round(
        (breakdown.taxSubtotal + breakdown.brokerSubtotal + breakdown.warehouseSubtotal + truckFee) *
          percent *
          100
      ) / 100,
    };
  });
};
