/**
 * Deal automation engine — auto-transitions, notifications, and overdue detection.
 *
 * These are helper functions called from UI actions and webhook handlers.
 * They operate on the PipelineDeal type from sample-dashboard-data.ts.
 */

import type {
  PipelineDeal,
  PipelineStage,
  DealPayment,
  PurchaseOrder,
  DealShipment,
} from "./sample-dashboard-data";

// ---------------------------------------------------------------------------
// Stripe fee calculation (3.6% + $3 MXN per transaction)
// ---------------------------------------------------------------------------

export const calculateStripeFees = (amount: number): number =>
  Math.round(amount * 0.036 + 3);

export const calculateNetReceived = (amount: number): number =>
  amount - calculateStripeFees(amount);

// ---------------------------------------------------------------------------
// Margin helpers
// ---------------------------------------------------------------------------

export const calculateLineMargin = (
  quotedPrice: number,
  dealerCost: number
): { amount: number; percent: number } => {
  const amount = quotedPrice - dealerCost;
  const percent = quotedPrice > 0 ? (amount / quotedPrice) * 100 : 0;
  return { amount: Math.round(amount), percent: Math.round(percent * 10) / 10 };
};

export const calculateDealFinancials = (deal: PipelineDeal) => {
  const lineItems = deal.lineItems ?? [];
  const payments = deal.payments ?? [];
  const purchaseOrders = deal.purchaseOrders ?? [];

  const totalQuoted = lineItems.reduce(
    (sum, li) => sum + li.quotedPrice * li.quantity,
    0
  );
  const totalDealerCost = lineItems.reduce(
    (sum, li) => sum + li.dealerCost * li.quantity,
    0
  );
  const totalShipping = lineItems.reduce(
    (sum, li) => sum + li.shippingCost * li.quantity,
    0
  );
  const totalCollected = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalStripeFees = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.stripeFees ?? calculateStripeFees(p.amount)), 0);
  const totalPaidToManufacturers = purchaseOrders
    .filter((po) => po.paymentToMfr)
    .reduce((sum, po) => sum + (po.paymentToMfr?.amount ?? 0), 0);

  const netMargin = totalQuoted - totalDealerCost - totalShipping - totalStripeFees;
  const marginPercent =
    totalQuoted > 0 ? Math.round((netMargin / totalQuoted) * 1000) / 10 : 0;

  return {
    totalQuoted,
    totalDealerCost,
    totalShipping,
    totalStripeFees,
    totalCollected,
    totalPaidToManufacturers,
    netMargin,
    marginPercent,
  };
};

// ---------------------------------------------------------------------------
// Auto-transition logic
// ---------------------------------------------------------------------------

/**
 * When a Stripe payment is confirmed, update the deal accordingly.
 */
export const onPaymentReceived = (
  deal: PipelineDeal,
  paymentId: string
): { updatedDeal: PipelineDeal; newStage?: PipelineStage } => {
  const payments = (deal.payments ?? []).map((p) =>
    p.id === paymentId
      ? {
          ...p,
          status: "paid" as const,
          paidDate: new Date().toISOString().split("T")[0],
          stripeFees: p.stripeFees ?? calculateStripeFees(p.amount),
          netReceived:
            p.netReceived ?? calculateNetReceived(p.amount),
        }
      : p
  );

  const allPaid = payments.every(
    (p) => p.status === "paid" || p.status === "cancelled"
  );
  const depositPaid = payments.some(
    (p) => (p.type === "deposit" || p.type === "full") && p.status === "paid"
  );

  let newStage: PipelineStage | undefined;

  if (allPaid) {
    newStage = "delivered"; // or "complete" if already delivered
    if (
      deal.stage === "delivered" ||
      deal.stage === "balance-pending"
    ) {
      newStage = "complete";
    }
  } else if (depositPaid && deal.stage === "deposit-pending") {
    newStage = "deposit-received";
  }

  return {
    updatedDeal: {
      ...deal,
      payments,
      stage: newStage ?? deal.stage,
      ...calculateDealFinancials({ ...deal, payments }),
    },
    newStage,
  };
};

/**
 * When a PO is marked as sent, check if all POs are sent and advance deal.
 */
export const onPOSent = (
  deal: PipelineDeal,
  poId: string
): { updatedDeal: PipelineDeal; newStage?: PipelineStage } => {
  const purchaseOrders = (deal.purchaseOrders ?? []).map((po) =>
    po.id === poId
      ? { ...po, status: "sent" as const, sentDate: new Date().toISOString().split("T")[0] }
      : po
  );

  const allSent = purchaseOrders.every(
    (po) => po.status !== "draft"
  );

  const newStage: PipelineStage | undefined = allSent ? "ordering" : undefined;

  return {
    updatedDeal: { ...deal, purchaseOrders, stage: newStage ?? deal.stage },
    newStage,
  };
};

/**
 * When all POs for a deal are confirmed, advance to in-production.
 */
export const onAllPOsConfirmed = (
  deal: PipelineDeal
): { newStage?: PipelineStage } => {
  const pos = deal.purchaseOrders ?? [];
  const allConfirmed = pos.length > 0 && pos.every(
    (po) =>
      po.status === "confirmed" ||
      po.status === "paid-to-manufacturer" ||
      po.status === "in-production" ||
      po.status === "shipped" ||
      po.status === "received"
  );

  return { newStage: allConfirmed ? "in-production" : undefined };
};

/**
 * When a shipment arrives at CC, check if all shipments are received.
 */
export const onShipmentReceived = (
  deal: PipelineDeal,
  shipmentId: string
): { updatedDeal: PipelineDeal; newStage?: PipelineStage } => {
  const shipments = (deal.shipments ?? []).map((s) =>
    s.id === shipmentId
      ? {
          ...s,
          status: "delivered-to-cc" as const,
          actualArrival: new Date().toISOString().split("T")[0],
          inspectionStatus: "pending" as const,
        }
      : s
  );

  const allReceived =
    shipments.length > 0 &&
    shipments.every(
      (s) =>
        s.status === "delivered-to-cc" || s.status === "delivered-to-customer"
    );

  return {
    updatedDeal: { ...deal, shipments },
    newStage: allReceived ? "received" : undefined,
  };
};

/**
 * When deal is marked delivered, handle balance invoice for split-pay deals.
 */
export const onDelivered = (
  deal: PipelineDeal
): { shouldCreateBalanceInvoice: boolean; newStage: PipelineStage } => {
  const payments = deal.payments ?? [];
  const hasPendingBalance = payments.some(
    (p) => p.type === "balance" && (p.status === "draft" || p.status === "sent")
  );
  const allPaid = payments.every(
    (p) => p.status === "paid" || p.status === "cancelled"
  );

  if (allPaid) {
    return { shouldCreateBalanceInvoice: false, newStage: "complete" };
  }

  if (
    deal.paymentStructure === "fifty-fifty" &&
    hasPendingBalance
  ) {
    return { shouldCreateBalanceInvoice: true, newStage: "balance-pending" };
  }

  return { shouldCreateBalanceInvoice: false, newStage: "delivered" };
};

// ---------------------------------------------------------------------------
// Overdue detection
// ---------------------------------------------------------------------------

export interface OverduePayment {
  dealId: string;
  dealName: string;
  customerName: string;
  payment: DealPayment;
  daysOverdue: number;
  severity: "warning" | "urgent" | "critical";
}

export const checkOverduePayments = (
  deals: PipelineDeal[]
): OverduePayment[] => {
  const today = new Date();
  const overduePayments: OverduePayment[] = [];

  for (const deal of deals) {
    for (const payment of deal.payments ?? []) {
      if (
        (payment.status === "sent" || payment.status === "overdue") &&
        payment.dueDate
      ) {
        const dueDate = new Date(payment.dueDate);
        if (dueDate < today) {
          const daysOverdue = Math.floor(
            (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          let severity: "warning" | "urgent" | "critical" = "warning";
          if (daysOverdue >= 30) severity = "critical";
          else if (daysOverdue >= 14) severity = "urgent";

          overduePayments.push({
            dealId: deal.id,
            dealName: deal.name,
            customerName: deal.contactName,
            payment: { ...payment, status: "overdue" },
            daysOverdue,
            severity,
          });
        }
      }
    }
  }

  return overduePayments.sort((a, b) => b.daysOverdue - a.daysOverdue);
};

// ---------------------------------------------------------------------------
// PO generation helper — splits deal line items by brand into POs
// ---------------------------------------------------------------------------

export const generatePOsFromLineItems = (
  deal: PipelineDeal,
  existingDocCount: number
): PurchaseOrder[] => {
  const lineItems = deal.lineItems ?? [];
  const brands = [...new Set(lineItems.map((li) => li.brand))];
  const year = new Date().getFullYear();

  return brands.map((brand, i) => {
    const brandItems = lineItems.filter((li) => li.brand === brand);
    const seq = String(existingDocCount + i + 1).padStart(3, "0");

    return {
      id: `CC-PO-${year}-${seq}`,
      dealId: deal.id,
      brand,
      manufacturerName: brand,
      items: brandItems.map((li) => ({
        sku: li.sku,
        productName: li.productName,
        finish: li.finish,
        quantity: li.quantity,
        dealerCost: li.dealerCost,
      })),
      totalAmount: brandItems.reduce(
        (sum, li) => sum + li.dealerCost * li.quantity,
        0
      ),
      currency: deal.currency,
      status: "draft" as const,
      shipTo: "cc-showroom" as const,
    };
  });
};

// ---------------------------------------------------------------------------
// Deal completion checklist
// ---------------------------------------------------------------------------

export interface CompletionCheckItem {
  label: { en: string; es: string };
  checked: boolean;
}

export const getDealCompletionChecklist = (
  deal: PipelineDeal
): CompletionCheckItem[] => {
  const payments = deal.payments ?? [];
  const pos = deal.purchaseOrders ?? [];
  const shipments = deal.shipments ?? [];

  const allDelivered =
    shipments.length > 0 &&
    shipments.every(
      (s) =>
        s.status === "delivered-to-cc" || s.status === "delivered-to-customer"
    );

  const allPaid = payments.length > 0 && payments.every(
    (p) => p.status === "paid" || p.status === "cancelled"
  );

  const allMfrPaid = pos.length > 0 && pos.every((po) => !!po.paymentToMfr);

  const noIssues =
    shipments.every((s) => s.inspectionStatus !== "damaged" && s.inspectionStatus !== "wrong-item") &&
    pos.every((po) => po.status !== "issue");

  return [
    {
      label: { en: "All products delivered", es: "Todos los productos entregados" },
      checked: allDelivered,
    },
    {
      label: { en: "Customer confirmed receipt", es: "Cliente confirmó recepción" },
      checked: deal.stage === "complete" || deal.stage === "delivered",
    },
    {
      label: { en: "All payments collected (100%)", es: "Todos los pagos cobrados (100%)" },
      checked: allPaid,
    },
    {
      label: { en: "All manufacturers paid", es: "Todos los fabricantes pagados" },
      checked: allMfrPaid,
    },
    {
      label: { en: "No open issues", es: "Sin incidencias abiertas" },
      checked: noIssues,
    },
  ];
};
