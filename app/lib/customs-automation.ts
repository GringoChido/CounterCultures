/**
 * Customs automation triggers for Counter Cultures Pedimento module.
 *
 * These functions handle status transitions, document lookups, and
 * notification drafting for the customs crossing workflow.
 */

import type {
  Trafico,
  TraficoStatus,
  PedimentoItem,
  BrokerMessage,
} from "./customs-data";
import type { PurchaseOrder, DealShipment } from "./sample-dashboard-data";

// ---------------------------------------------------------------------------
// Status transition helper
// ---------------------------------------------------------------------------

const advanceStatus = (
  trafico: Trafico,
  newStatus: TraficoStatus,
  actor?: string,
  note?: string
): Trafico => ({
  ...trafico,
  status: newStatus,
  statusHistory: [
    ...trafico.statusHistory,
    {
      status: newStatus,
      timestamp: new Date().toISOString(),
      actor,
      note,
    },
  ],
});

// ---------------------------------------------------------------------------
// 1. When a PO ships and destination is CC showroom (US-origin product)
// ---------------------------------------------------------------------------

export const onPOShipped = (
  po: PurchaseOrder,
  openTraficos: Trafico[]
): { action: "add-to-existing" | "create-new"; trafico?: Trafico; newItem: Partial<PedimentoItem> } => {
  const newItem: Partial<PedimentoItem> = {
    id: `PI-${Date.now()}`,
    dealId: po.dealId,
    poId: po.id,
    vendorName: po.manufacturerName,
    vendorInvoiceNumber: po.id,
    vendorInvoiceDate: new Date().toISOString().split("T")[0],
    products: po.items.map((item) => ({
      sku: item.sku,
      description: item.productName,
      quantity: item.quantity,
      unitPrice: item.dealerCost,
      amount: item.dealerCost * item.quantity,
    })),
    invoiceSubtotal: po.totalAmount,
    freightCharge: 0,
    invoiceTotal: po.totalAmount,
    usCarrier: po.trackingCarrier ?? "",
    usTracking: po.trackingNumber ?? "",
    usmcaStatus: "not-needed",
    spanishManualsRequired: false,
    spanishManualsStatus: "not-needed",
  };

  // Check for open tráfico in "collecting" status
  const collectingTrafico = openTraficos.find((t) => t.status === "collecting");

  if (collectingTrafico) {
    return { action: "add-to-existing", trafico: collectingTrafico, newItem };
  }

  return { action: "create-new", newItem };
};

// ---------------------------------------------------------------------------
// 2. When "Send to Broker" is clicked
// ---------------------------------------------------------------------------

export const onSendToBroker = (
  trafico: Trafico
): { updatedTrafico: Trafico; emailDraft: BrokerMessage } => {
  const updatedTrafico = advanceStatus(trafico, "sent-to-broker", "antonina", "Invoices sent to broker");

  const invoiceSummary = trafico.items
    .map((item) => `- ${item.vendorName}: ${item.vendorInvoiceNumber} ($${item.invoiceTotal.toFixed(2)} USD)`)
    .join("\n");

  const emailDraft: BrokerMessage = {
    id: `MSG-${Date.now()}`,
    traficoId: trafico.id,
    direction: "to-broker",
    channel: "email",
    subject: `New import shipment — ${trafico.items.length} vendor invoices for crossing`,
    body: `Hola Jeanefer,\n\nAdjunto las facturas para el siguiente cruce:\n\n${invoiceSummary}\n\nTotal: $${trafico.invoiceValueUSD?.toFixed(2) ?? "TBD"} USD\n\nSaludos,\nAntonina`,
    attachmentIds: trafico.items
      .map((item) => item.vendorInvoiceDocId)
      .filter((id): id is string => !!id),
    timestamp: new Date().toISOString(),
    automatedTrigger: "send-to-broker",
  };

  return { updatedTrafico, emailDraft };
};

// ---------------------------------------------------------------------------
// 3. When origin is confirmed for an item
// ---------------------------------------------------------------------------

export interface USMCACertificate {
  certId: string;
  brand: string;
  manufacturer: string;
  validFrom: string;
  validTo: string;
  productsCovered: string[]; // SKUs or "all"
  driveFileId: string;
}

export const onOriginConfirmed = (
  item: PedimentoItem,
  origin: PedimentoItem["countryOfOrigin"],
  certLibrary: USMCACertificate[]
): {
  updatedItem: PedimentoItem;
  certFound: boolean;
  certRequested: boolean;
} => {
  const updatedItem: PedimentoItem = { ...item, countryOfOrigin: origin };

  if (origin === "US" || origin === "Canada") {
    // Check USMCA certificate library
    const matchingCert = certLibrary.find((cert) => {
      const today = new Date().toISOString().split("T")[0];
      const validFrom = cert.validFrom <= today;
      const validTo = cert.validTo >= today;
      const brandMatch = cert.manufacturer.toLowerCase().includes(item.vendorName.toLowerCase()) ||
        cert.brand.toLowerCase().includes(item.vendorName.toLowerCase());
      const skuMatch = cert.productsCovered.includes("all") ||
        item.products.some((p) => cert.productsCovered.includes(p.sku));

      return validFrom && validTo && brandMatch && skuMatch;
    });

    if (matchingCert) {
      updatedItem.usmcaStatus = "on-file";
      updatedItem.usmcaCertId = matchingCert.driveFileId;
      return { updatedItem, certFound: true, certRequested: false };
    }

    updatedItem.usmcaStatus = "requested";
    return { updatedItem, certFound: false, certRequested: true };
  }

  if (origin === "Mexico") {
    updatedItem.usmcaStatus = "not-applicable";
    return { updatedItem, certFound: false, certRequested: false };
  }

  // Non-USMCA origin (China, India, Other) — full duty applies
  updatedItem.usmcaStatus = "not-applicable";
  return { updatedItem, certFound: false, certRequested: false };
};

// ---------------------------------------------------------------------------
// 4. When calculo is uploaded
// ---------------------------------------------------------------------------

export const onCalculoReceived = (
  trafico: Trafico,
  calculoDocId: string,
  calculoTotal?: number
): { updatedTrafico: Trafico; paymentInstructions: PaymentInstruction[] } => {
  let updated = advanceStatus(trafico, "calculo-received", "jeanefer", "Calculo received from broker");
  updated = {
    ...updated,
    documents: { ...updated.documents, calculoId: calculoDocId },
    calculoTotal: calculoTotal ?? updated.calculoTotal,
    calculoReceivedDate: new Date().toISOString().split("T")[0],
  };

  const paymentInstructions: PaymentInstruction[] = [
    {
      label: { en: "Import Taxes (PED)", es: "Impuestos de Importación (PED)" },
      amount: calculoTotal ?? 0,
      payee: "TGR Logistics / Gestores Aduanales del Noreste",
      bank: "BBVA Mexico",
      clabe: "012821001951426792",
      concept: "PED",
    },
    {
      label: { en: "Truck Crossing Fee (CRUZ)", es: "Tarifa de Cruce (CRUZ)" },
      amount: 2668,
      payee: "Carlos Enrique Garza Roque",
      bank: "Banamex",
      clabe: "002821700962028128",
      concept: "CRUZ",
    },
  ];

  return { updatedTrafico: updated, paymentInstructions };
};

export interface PaymentInstruction {
  label: { en: string; es: string };
  amount: number;
  payee: string;
  bank: string;
  clabe: string;
  concept: string;
}

// ---------------------------------------------------------------------------
// 5. When payment receipts uploaded
// ---------------------------------------------------------------------------

export const onPaymentSent = (
  trafico: Trafico,
  calculoPaymentRef?: string,
  truckFeePaymentRef?: string
): { updatedTrafico: Trafico; reconciliationNeeded: boolean } => {
  const today = new Date().toISOString().split("T")[0];

  let updated = advanceStatus(trafico, "payment-sent", "roger", "Payments sent");
  updated = {
    ...updated,
    paymentSentDate: today,
    calculoPayment: updated.calculoPayment ?? {
      amount: trafico.calculoTotal ?? 0,
      date: today,
      method: "SPEI",
      bank: "Santander → BBVA Mexico",
      reference: calculoPaymentRef ?? "",
      concept: "PED",
      payeeName: "TGR Logistics / Gestores Aduanales",
      payeeClabe: "012821001951426792",
    },
    truckFeePayment: updated.truckFeePayment ?? {
      amount: trafico.truckCrossingFee ?? 2668,
      date: today,
      method: "SPEI",
      bank: "Santander → Banamex",
      reference: truckFeePaymentRef ?? "",
      concept: "CRUZ",
    },
    totalImportCost: (trafico.calculoTotal ?? 0) + (trafico.truckCrossingFee ?? 2668),
  };

  return { updatedTrafico: updated, reconciliationNeeded: true };
};

// ---------------------------------------------------------------------------
// 6. When broker confirms crossing
// ---------------------------------------------------------------------------

export const onCrossingApproved = (
  trafico: Trafico
): { updatedTrafico: Trafico; needsDomesticTracking: boolean } => {
  const updated = advanceStatus(trafico, "crossing-approved", "jeanefer", "Crossing approved by customs");
  return {
    updatedTrafico: {
      ...updated,
      crossingApprovedDate: new Date().toISOString().split("T")[0],
    },
    needsDomesticTracking: true,
  };
};

// ---------------------------------------------------------------------------
// 7. When factura is uploaded
// ---------------------------------------------------------------------------

export const onFacturaReceived = (
  trafico: Trafico,
  facturaDocId: string,
  facturaAmount: number
): {
  updatedTrafico: Trafico;
  varianceLevel: "pass" | "warning" | "error";
  variance: number;
} => {
  const calculoTotal = trafico.calculoTotal ?? 0;
  const variance = facturaAmount - calculoTotal;
  const variancePercent = calculoTotal > 0 ? Math.abs(variance / calculoTotal) : 0;

  let varianceLevel: "pass" | "warning" | "error" = "pass";
  if (variancePercent > 0.05) varianceLevel = "error";
  else if (variancePercent > 0.01) varianceLevel = "warning";

  let updated = advanceStatus(trafico, "factura-received", "jeanefer", `Factura received: $${facturaAmount.toFixed(2)}`);
  updated = {
    ...updated,
    documents: { ...updated.documents, brokerFacturaId: facturaDocId },
    facturaAmount,
    facturaDifference: Math.round(variance * 100) / 100,
  };

  return { updatedTrafico: updated, varianceLevel, variance };
};

// ---------------------------------------------------------------------------
// 8. When expediente is signed — triggers full reconciliation + allocation
// ---------------------------------------------------------------------------

export const onExpedienteSigned = (
  trafico: Trafico
): { updatedTrafico: Trafico; readyForReconciliation: boolean } => {
  let updated = advanceStatus(trafico, "complete", "roger", "Expediente signed, crossing complete");
  updated = {
    ...updated,
    expedienteStatus: "e-signed",
    expedienteSignedDate: new Date().toISOString().split("T")[0],
    completedDate: new Date().toISOString().split("T")[0],
  };

  return { updatedTrafico: updated, readyForReconciliation: true };
};

// ---------------------------------------------------------------------------
// 9. Estimated delivery date calculation
// ---------------------------------------------------------------------------

export const estimateDeliveryDate = (paymentDate: string): { earliest: string; latest: string } => {
  const payment = new Date(paymentDate);
  const earliest = new Date(payment);
  earliest.setDate(earliest.getDate() + 28); // 4 weeks
  const latest = new Date(payment);
  latest.setDate(latest.getDate() + 42); // 6 weeks

  return {
    earliest: earliest.toISOString().split("T")[0],
    latest: latest.toISOString().split("T")[0],
  };
};

// ---------------------------------------------------------------------------
// 10. Link shipments with multi-leg tracking
// ---------------------------------------------------------------------------

export const createDomesticLeg = (
  shipment: DealShipment,
  domesticCarrier: string,
  domesticTracking: string
): DealShipment => ({
  ...shipment,
  legs: [
    {
      leg: "us-to-border",
      carrier: shipment.carrier ?? "",
      trackingNumber: shipment.trackingNumber ?? "",
      status: "delivered",
      shipDate: shipment.shipDate,
    },
    {
      leg: "domestic-to-sma",
      carrier: domesticCarrier,
      trackingNumber: domesticTracking,
      status: "in-transit",
    },
  ],
});
