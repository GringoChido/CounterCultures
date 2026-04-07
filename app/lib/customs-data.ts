/**
 * Customs (Pedimento) data models for Counter Cultures.
 *
 * A Trafico is one batch crossing event — the parent container.
 * Multiple vendor orders are consolidated at TGR warehouse in Laredo,
 * then crossed together as a single tráfico.
 *
 * Based on real import crossings: E27-26 (Feb 2026) and E40-26 (Mar 2026).
 */

// ---------------------------------------------------------------------------
// Trafico Status — 16-state progression
// ---------------------------------------------------------------------------

export type TraficoStatus =
  | "collecting"             // Shipments arriving at TGR warehouse, not yet sent to broker
  | "sent-to-broker"         // Antonina sent invoice batch to broker
  | "at-warehouse"           // Broker confirms goods at bodega
  | "import-open"            // Broker reviewing, may ask origin/cert questions
  | "awaiting-documents"     // Waiting for USMCA cert, manuals, origin confirmation
  | "import-closed"          // Roger confirmed all items accounted for
  | "calculo-received"       // Tax estimate received from broker
  | "payment-pending"        // CC needs to pay taxes + truck fee
  | "payment-sent"           // Both SPEI transfers sent, awaiting confirmation
  | "crossing-approved"      // Cleared to cross border
  | "in-transit-domestic"    // On domestic carrier (border → SMA)
  | "delivered-to-cc"        // Arrived at CC showroom
  | "factura-received"       // Final invoice from broker
  | "expediente-pending"     // Case file needs signatures
  | "complete"               // All done, books closed
  | "issue";                 // Problem (held at border, missing docs, etc.)

export const TRAFICO_STATUS_CONFIG: Record<
  TraficoStatus,
  { label: { en: string; es: string }; bg: string; text: string; step: number }
> = {
  "collecting":          { label: { en: "Collecting",         es: "Recopilando" },          bg: "bg-gray-500/10",    text: "text-gray-400",    step: 1 },
  "sent-to-broker":      { label: { en: "Sent to Broker",     es: "Enviado al Agente" },    bg: "bg-blue-500/10",    text: "text-blue-400",    step: 2 },
  "at-warehouse":        { label: { en: "At Warehouse",       es: "En Bodega" },            bg: "bg-blue-500/10",    text: "text-blue-400",    step: 3 },
  "import-open":         { label: { en: "Import Open",        es: "Importación Abierta" },  bg: "bg-indigo-500/10",  text: "text-indigo-400",  step: 4 },
  "awaiting-documents":  { label: { en: "Awaiting Documents", es: "Esperando Documentos" }, bg: "bg-amber-500/10",   text: "text-amber-400",   step: 5 },
  "import-closed":       { label: { en: "Import Closed",      es: "Importación Cerrada" },  bg: "bg-violet-500/10",  text: "text-violet-400",  step: 6 },
  "calculo-received":    { label: { en: "Cálculo Received",   es: "Cálculo Recibido" },     bg: "bg-orange-500/10",  text: "text-orange-400",  step: 7 },
  "payment-pending":     { label: { en: "Payment Pending",    es: "Pago Pendiente" },       bg: "bg-amber-500/10",   text: "text-amber-400",   step: 8 },
  "payment-sent":        { label: { en: "Payment Sent",       es: "Pago Enviado" },         bg: "bg-cyan-500/10",    text: "text-cyan-400",    step: 9 },
  "crossing-approved":   { label: { en: "Crossing Approved",  es: "Cruce Aprobado" },       bg: "bg-teal-500/10",    text: "text-teal-400",    step: 10 },
  "in-transit-domestic": { label: { en: "In Transit (MX)",    es: "En Tránsito (MX)" },     bg: "bg-cyan-500/10",    text: "text-cyan-400",    step: 11 },
  "delivered-to-cc":     { label: { en: "Delivered to CC",    es: "Entregado en CC" },       bg: "bg-teal-500/10",    text: "text-teal-400",    step: 12 },
  "factura-received":    { label: { en: "Factura Received",   es: "Factura Recibida" },      bg: "bg-emerald-500/10", text: "text-emerald-400", step: 13 },
  "expediente-pending":  { label: { en: "Expediente Pending", es: "Expediente Pendiente" },  bg: "bg-lime-500/10",    text: "text-lime-400",    step: 14 },
  "complete":            { label: { en: "Complete",           es: "Completo" },              bg: "bg-green-500/10",   text: "text-green-400",   step: 15 },
  "issue":               { label: { en: "Issue",              es: "Problema" },              bg: "bg-red-500/10",     text: "text-red-400",     step: 0 },
};

// ---------------------------------------------------------------------------
// ShipmentLeg — Multi-leg tracking (US carrier + domestic carrier)
// ---------------------------------------------------------------------------

export interface ShipmentLeg {
  leg: "us-to-border" | "domestic-to-sma" | "direct";
  carrier: string;
  trackingNumber: string;
  status: string;
  shipDate?: string;
  estimatedArrival?: string;
  actualArrival?: string;
}

// ---------------------------------------------------------------------------
// PedimentoItem — Each vendor's shipment within a Tráfico
// ---------------------------------------------------------------------------

export interface PedimentoItem {
  id: string;
  traficoId: string;              // Parent tráfico
  dealId?: string;                // Which customer deal (if any — some are inventory)
  poId?: string;                  // Which PO
  shipmentId?: string;            // Which DealShipment

  // Vendor info
  vendorName: string;             // "Ferguson", "JCR Distributors", "California Faucets"
  vendorInvoiceNumber: string;    // "Order #94108221", "INV260000100", "+4644937"
  vendorInvoiceDate: string;
  vendorInvoiceDocId?: string;    // Drive file ID

  // Products
  products: {
    sku: string;                  // "K-2215-0", "FR\\PES-360-MBK"
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];

  invoiceSubtotal: number;        // Product subtotal
  freightCharge: number;          // Shipping/freight
  invoiceTotal: number;           // Grand total

  // Tracking (US leg)
  usCarrier: string;              // "FedEx", "UPS Ground"
  usTracking: string;             // Tracking number(s)

  // Origin
  countryOfOrigin?: "US" | "Canada" | "China" | "Mexico" | "India" | "Other";
  originConfirmedBy?: string;     // "Roger" — who confirmed origin
  usmcaStatus: "on-file" | "requested" | "received" | "not-needed" | "not-applicable";
  usmcaCertId?: string;           // Drive file ID of cert

  // Spanish manuals
  spanishManualsRequired: boolean;
  spanishManualsStatus: "not-needed" | "on-file" | "in-translation" | "sent-to-broker";
  spanishManualDocIds?: string[];

  // Notes
  isReplacement?: boolean;        // For damaged item replacements
  isLateAddition?: boolean;       // Added after import was "closed"
  notes?: string;
}

// ---------------------------------------------------------------------------
// Trafico — The batch crossing parent container
// ---------------------------------------------------------------------------

export interface Trafico {
  id: string;                    // CC-TRF-2026-001
  traficoNumber: string;         // Broker's reference, e.g., "E27-26"
  pedimentoNumber?: string;      // Official customs #, e.g., "26 240 3482-6101796"

  // Broker
  brokerName: string;            // "Jeanefer Contreras"
  brokerEmail: string;           // "jeanefer_jeco@hotmail.com"
  crossingAgent?: string;        // "Lic. Carlos Enrique Garza Roque"
  crossingAgentEmail?: string;   // "quique73@globalpc.net"

  // Warehouse
  warehouseName: string;         // "TGR Logistic Inc"
  warehouseAddress: string;      // "4602 Modern Lane, Laredo TX 78041"
  warehousePhone?: string;       // "(956) 704-5008"
  warehouseEmail?: string;       // "auxiliartraficotgr@hotmail.com"

  // Status
  status: TraficoStatus;
  statusHistory: {
    status: TraficoStatus;
    timestamp: string;
    note?: string;
    actor?: string;              // Who triggered: "antonina", "jeanefer", "roger"
  }[];

  // Items in this crossing
  items: PedimentoItem[];

  // Documents — the 11-step trail (Google Drive file IDs)
  documents: {
    fichaId?: string;              // 1. Hoja de Tráfico (traffic sheet / master inventory)
    calculoId?: string;            // 2. Cálculo de Impuestos (tax estimate)
    carta318Id?: string;           // 3. Carta 3.1.8 (customs declaration letter, signed)
    vendorInvoiceIds: string[];    // 4. Vendor invoices (one per vendor in crossing)
    coveIds: string[];             // 5. COVE documents (electronic value declarations)
    acuseIds: string[];            // 5b. Acuse de Digitalización (digitization receipts)
    pedimentoId?: string;          // 6. Pedimento (official customs declaration)
    pedimentoProformaId?: string;  // 6b. Proforma pedimento (detailed version)
    facturaCruceId?: string;       // 7. Factura Cruce / Carta Porte (crossing transport invoice)
    facturaCruceXmlId?: string;    // 7b. XML version (CFDI 4.0)
    tgrInvoiceId?: string;         // 8. TGR Warehouse Invoice (handling charges in USD)
    brokerFacturaId?: string;      // 9. Factura GTA (broker's official CFDI invoice)
    brokerFacturaXmlId?: string;   // 9b. XML version
    comprobantePagoId?: string;    // 10. Comprobante de Pago (SPEI payment receipt)
    manifestacionValorId?: string; // 11. Manifestación de Valor (customs value worksheet)
  };

  // Financials — the cálculo breakdown (from real document)
  invoiceValueUSD?: number;       // Total invoice value in USD ($2,611.34)
  exchangeRate?: number;          // TC USD CAAAREM (17.3500)
  customsValueMXN?: number;       // Valor en Aduana ($53,366.52)

  calculoBreakdown?: {
    // Taxes (Cuadro de Contribuciones)
    igi: number;                  // Ad Valorem duty
    prv: number;
    cnt: number;
    dta: number;                  // Customs processing
    iva: number;                  // 16% tax
    taxSubtotal: number;

    // Broker fees (Cuenta Mexicana)
    honorarios: number;
    complementarios: number;
    prevalidacion: number;
    validacion: number;
    sellosFiscales: number;
    ivaCuentaMexicana: number;
    brokerSubtotal: number;

    // Warehouse handling (Cuenta Americana)
    revisionClasificacion: number;
    cargaDescarga: number;
    coordinacionManejo: number;
    etiquetasManuales: number;
    otrosVUCEM: number;
    reTrabajo: number;
    warehouseSubtotal: number;
  };

  calculoTotal?: number;          // Total cálculo amount
  truckCrossingFee?: number;      // $2,668.00 MXN baseline
  truckFeePayee?: string;         // "Carlos Enrique Garza Roque"
  truckFeeBank?: string;          // "Banamex, CLABE 002821700962028128"

  // Payment tracking
  calculoPayment?: {
    amount: number;
    date: string;
    method: string;               // "SPEI"
    bank: string;                 // "Santander → BBVA Mexico"
    reference: string;
    concept: string;              // "PED"
    payeeName: string;            // "TGR Logistics / Gestores Aduanales"
    payeeClabe: string;           // "012821001951426792"
  };
  truckFeePayment?: {
    amount: number;
    date: string;
    method: string;               // "SPEI"
    bank: string;                 // "Santander → Banamex"
    reference: string;
    concept: string;              // "CRUZ"
  };

  totalImportCost?: number;       // calculoTotal + truckCrossingFee

  facturaAmount?: number;         // Final actual cost (may differ from cálculo)
  facturaDifference?: number;     // facturaAmount - calculoTotal (auto-calc)

  // Domestic shipping (Mexico leg: Laredo → SMA)
  domesticCarrier?: string;       // "Tres Guerras" or other
  domesticTracking?: string;
  domesticShipDate?: string;
  domesticEstArrival?: string;
  domesticActualArrival?: string;

  // Expediente
  expedienteStatus: "not-sent" | "received" | "e-signed" | "returned";
  expedienteSignedDate?: string;

  // Key dates
  initiatedDate?: string;         // When Antonina sent invoices to broker
  importClosedDate?: string;      // When Roger confirmed "close the import"
  calculoReceivedDate?: string;
  paymentSentDate?: string;
  crossingApprovedDate?: string;
  completedDate?: string;

  // Notes
  notes?: string;
}

// ---------------------------------------------------------------------------
// BrokerMessage — Communication log for broker interactions
// ---------------------------------------------------------------------------

export interface BrokerMessage {
  id: string;
  traficoId: string;
  direction: "to-broker" | "from-broker";
  channel: "email" | "whatsapp";
  subject?: string;
  body?: string;
  attachmentIds?: string[];      // Drive file IDs
  timestamp: string;
  automatedTrigger?: string;     // Which automation sent this
}

// ---------------------------------------------------------------------------
// ReconciliationCheck — Individual reconciliation comparison
// ---------------------------------------------------------------------------

export type ReconciliationLevel = "pass" | "info" | "warning" | "error";

export interface ReconciliationCheck {
  id: string;
  traficoId: string;
  checkType:
    | "invoice-vs-po"
    | "calculo-vs-payment"
    | "calculo-vs-factura"
    | "crossing-fee-baseline"
    | "cost-allocation-balance"
    | "usmca-savings";
  label: { en: string; es: string };
  expected: number;
  actual: number;
  variance: number;
  variancePercent: number;
  level: ReconciliationLevel;
  note?: string;
}

export interface ReconciliationResult {
  traficoId: string;
  checks: ReconciliationCheck[];
  totalVariance: number;
  hasWarnings: boolean;
  hasErrors: boolean;
}

// ---------------------------------------------------------------------------
// Import cost allocation — linked to deals
// ---------------------------------------------------------------------------

export interface ImportCostAllocation {
  traficoId: string;
  traficoNumber: string;
  allocationPercent: number;    // This deal's share of total crossing
  allocatedTaxes: number;
  allocatedBrokerFees: number;
  allocatedWarehouse: number;
  allocatedTruckFee: number;
  totalImportCost: number;
}

// ---------------------------------------------------------------------------
// Document checklist helpers
// ---------------------------------------------------------------------------

export type DocumentCheckStatus = "uploaded" | "in-progress" | "missing" | "not-applicable";

export interface DocumentCheckItem {
  key: string;
  label: { en: string; es: string };
  status: DocumentCheckStatus;
  driveFileId?: string;
  date?: string;
}

export const getDocumentChecklist = (trafico: Trafico): DocumentCheckItem[] => {
  const docs = trafico.documents;

  return [
    {
      key: "ficha",
      label: { en: "Ficha (Hoja de Tráfico)", es: "Ficha (Hoja de Tráfico)" },
      status: docs.fichaId ? "uploaded" : trafico.status === "collecting" ? "not-applicable" : "missing",
      driveFileId: docs.fichaId,
    },
    {
      key: "calculo",
      label: { en: "Cálculo de Impuestos", es: "Cálculo de Impuestos" },
      status: docs.calculoId ? "uploaded" : TRAFICO_STATUS_CONFIG[trafico.status].step < 7 ? "not-applicable" : "missing",
      driveFileId: docs.calculoId,
    },
    {
      key: "carta318",
      label: { en: "Carta 3.1.8", es: "Carta 3.1.8" },
      status: docs.carta318Id ? "uploaded" : TRAFICO_STATUS_CONFIG[trafico.status].step < 6 ? "not-applicable" : "missing",
      driveFileId: docs.carta318Id,
    },
    {
      key: "vendorInvoices",
      label: { en: "Vendor Invoices", es: "Facturas de Proveedor" },
      status: docs.vendorInvoiceIds.length > 0 ? "uploaded" : "missing",
    },
    {
      key: "cove",
      label: { en: "COVE Documents + Acuse", es: "Documentos COVE + Acuse" },
      status: docs.coveIds.length > 0 ? "uploaded" : TRAFICO_STATUS_CONFIG[trafico.status].step < 6 ? "not-applicable" : "missing",
    },
    {
      key: "pedimento",
      label: { en: "Pedimento", es: "Pedimento" },
      status: docs.pedimentoId ? "uploaded" : TRAFICO_STATUS_CONFIG[trafico.status].step < 9 ? "not-applicable" : "missing",
      driveFileId: docs.pedimentoId,
    },
    {
      key: "facturaCruce",
      label: { en: "Factura Cruce (Carta Porte)", es: "Factura Cruce (Carta Porte)" },
      status: docs.facturaCruceId ? "uploaded" : TRAFICO_STATUS_CONFIG[trafico.status].step < 10 ? "not-applicable" : "missing",
      driveFileId: docs.facturaCruceId,
    },
    {
      key: "tgrInvoice",
      label: { en: "TGR Warehouse Invoice", es: "Factura TGR (Bodega)" },
      status: docs.tgrInvoiceId ? "uploaded" : TRAFICO_STATUS_CONFIG[trafico.status].step < 7 ? "not-applicable" : "missing",
      driveFileId: docs.tgrInvoiceId,
    },
    {
      key: "brokerFactura",
      label: { en: "Factura GTA (Broker)", es: "Factura GTA (Agente)" },
      status: docs.brokerFacturaId ? "uploaded" : TRAFICO_STATUS_CONFIG[trafico.status].step < 13 ? "not-applicable" : "missing",
      driveFileId: docs.brokerFacturaId,
    },
    {
      key: "comprobantePago",
      label: { en: "Comprobante de Pago", es: "Comprobante de Pago" },
      status: docs.comprobantePagoId ? "uploaded" : TRAFICO_STATUS_CONFIG[trafico.status].step < 9 ? "not-applicable" : "missing",
      driveFileId: docs.comprobantePagoId,
    },
    {
      key: "manifestacionValor",
      label: { en: "Manifestación de Valor", es: "Manifestación de Valor" },
      status: docs.manifestacionValorId ? "uploaded" : TRAFICO_STATUS_CONFIG[trafico.status].step < 14 ? "not-applicable" : "missing",
      driveFileId: docs.manifestacionValorId,
    },
  ];
};
