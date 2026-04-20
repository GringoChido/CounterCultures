/**
 * Flat→rich Trafico hydrator. Closes W5 §8 deferred item.
 *
 * Reads the 3 source sheets (Traficos, Trafico_Items, Trafico_Events) and
 * reconstructs the rich `Trafico` type from `customs-data.ts` by parsing
 * the JSON-blob columns (Calculo_Breakdown_JSON, Calculo_Payment_JSON,
 * Truck_Payment_JSON, Status_History_JSON, Products_JSON).
 *
 * JSON-parse failures fall back to undefined / [] — the hydrator never
 * crashes on malformed source data. Same graceful-degradation philosophy
 * as the W6 landed-cost calculator.
 *
 * Documents partial-coverage: the flat Traficos schema today only has
 * `Calculo_Drive_ID` and `Factura_Drive_ID`. The other 9 doc keys from
 * `getDocumentChecklist` (ficha, carta318, COVE, pedimento, etc.) have
 * no flat column yet — they're left undefined. Schema additions for full
 * 11-doc coverage are deferred to a future spec (need explicit approval
 * per the W5 ground rule).
 */

import { readSheet } from "./dashboard-sheets";
import {
  type Trafico,
  type TraficoStatus,
  type PedimentoItem,
} from "./customs-data";
import { getTraficoEvents, type TraficoEvent } from "./trafico-events";

// Source row shapes (mirror dashboard-sheets readSheet generics)
type TraficoRow = Record<string, string>;
type TraficoItemRow = Record<string, string>;

export interface HydratedTrafico {
  trafico: Trafico;
  events: TraficoEvent[];
}

const safeParseJSON = <T>(raw: string, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const parseNum = (raw: string): number | undefined => {
  if (!raw) return undefined;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : undefined;
};

const parsePedimentoItem = (row: TraficoItemRow): PedimentoItem => ({
  id: row.Item_ID,
  traficoId: row.TRF_ID,
  dealId: row.Deal_ID || undefined,
  poId: row.PO_ID || undefined,
  shipmentId: row.Shipment_ID || undefined,
  vendorName: row.Vendor_Name,
  vendorInvoiceNumber: row.Vendor_Invoice_Number,
  vendorInvoiceDate: row.Vendor_Invoice_Date,
  vendorInvoiceDocId: row.Vendor_Invoice_Drive_ID || undefined,
  products: safeParseJSON(row.Products_JSON, []),
  invoiceSubtotal: parseNum(row.Invoice_Subtotal) ?? 0,
  freightCharge: parseNum(row.Freight_Charge) ?? 0,
  invoiceTotal: parseNum(row.Invoice_Total) ?? 0,
  usCarrier: row.US_Carrier,
  usTracking: row.US_Tracking,
  countryOfOrigin: (row.Country_of_Origin || undefined) as PedimentoItem["countryOfOrigin"],
  originConfirmedBy: row.Origin_Confirmed_By || undefined,
  usmcaStatus: (row.USMCA_Status || "not-applicable") as PedimentoItem["usmcaStatus"],
  usmcaCertId: row.USMCA_Cert_Drive_ID || undefined,
  spanishManualsRequired: row.Spanish_Manuals_Required?.toLowerCase() === "true",
  spanishManualsStatus: (row.Spanish_Manuals_Status || "not-needed") as PedimentoItem["spanishManualsStatus"],
  spanishManualDocIds: row.Spanish_Manual_Drive_IDs
    ? row.Spanish_Manual_Drive_IDs.split("|").filter(Boolean)
    : undefined,
  isReplacement: row.Is_Replacement?.toLowerCase() === "true" ? true : undefined,
  isLateAddition: row.Is_Late_Addition?.toLowerCase() === "true" ? true : undefined,
  notes: row.Notes || undefined,
});

const buildDocuments = (row: TraficoRow, items: PedimentoItem[]): Trafico["documents"] => {
  const vendorInvoiceIds = items
    .map((i) => i.vendorInvoiceDocId)
    .filter((id): id is string => Boolean(id));
  return {
    calculoId: row.Calculo_Drive_ID || undefined,
    vendorInvoiceIds,
    coveIds: [],
    acuseIds: [],
    brokerFacturaId: row.Factura_Drive_ID || undefined,
    // The remaining 8 doc keys (ficha, carta318, pedimento, facturaCruce,
    // tgrInvoice, comprobantePago, manifestacionValor, etc.) have no flat
    // column today. Left undefined; full coverage needs a schema add.
  };
};

const mapFlatToRichTrafico = (
  row: TraficoRow,
  items: PedimentoItem[]
): Trafico => {
  const calculoBreakdown = row.Calculo_Breakdown_JSON
    ? safeParseJSON<Trafico["calculoBreakdown"]>(
        row.Calculo_Breakdown_JSON,
        undefined
      )
    : undefined;

  const calculoPayment = row.Calculo_Payment_JSON
    ? safeParseJSON<Trafico["calculoPayment"]>(
        row.Calculo_Payment_JSON,
        undefined
      )
    : undefined;

  const truckFeePayment = row.Truck_Payment_JSON
    ? safeParseJSON<Trafico["truckFeePayment"]>(
        row.Truck_Payment_JSON,
        undefined
      )
    : undefined;

  const statusHistory = safeParseJSON<Trafico["statusHistory"]>(
    row.Status_History_JSON,
    []
  );

  return {
    id: row.TRF_ID,
    traficoNumber: row.Trafico_Number,
    pedimentoNumber: row.Pedimento_Number || undefined,

    brokerName: row.Broker_Name,
    brokerEmail: row.Broker_Email,
    crossingAgent: row.Crossing_Agent || undefined,
    crossingAgentEmail: undefined,

    warehouseName: row.Warehouse_Name,
    warehouseAddress: row.Warehouse_Address,
    warehousePhone: undefined,
    warehouseEmail: undefined,

    status: (row.Status || "collecting") as TraficoStatus,
    statusHistory,

    items,
    documents: buildDocuments(row, items),

    invoiceValueUSD: parseNum(row.Invoice_Value_USD),
    exchangeRate: parseNum(row.Exchange_Rate),
    customsValueMXN: parseNum(row.Customs_Value_MXN),

    calculoBreakdown,
    calculoTotal: parseNum(row.Calculo_Total_MXN),
    truckCrossingFee: parseNum(row.Truck_Crossing_Fee),
    truckFeePayee: row.Truck_Fee_Payee || undefined,
    truckFeeBank: undefined,

    calculoPayment,
    truckFeePayment,

    totalImportCost: parseNum(row.Total_Import_Cost),
    facturaAmount: parseNum(row.Factura_Amount),
    facturaDifference: parseNum(row.Factura_Difference),

    domesticCarrier: row.Domestic_Carrier || undefined,
    domesticTracking: row.Domestic_Tracking || undefined,
    domesticShipDate: row.Domestic_Ship_Date || undefined,
    domesticEstArrival: row.Domestic_Est_Arrival || undefined,
    domesticActualArrival: row.Domestic_Actual_Arrival || undefined,

    expedienteStatus: (row.Expediente_Status || "not-sent") as Trafico["expedienteStatus"],
    expedienteSignedDate: row.Expediente_Signed_Date || undefined,

    initiatedDate: row.Initiated_Date || undefined,
    importClosedDate: row.Import_Closed_Date || undefined,
    calculoReceivedDate: row.Calculo_Received_Date || undefined,
    paymentSentDate: row.Payment_Sent_Date || undefined,
    crossingApprovedDate: row.Crossing_Approved_Date || undefined,
    completedDate: row.Completed_Date || undefined,

    notes: row.Notes || undefined,
  };
};

export const hydrateTrafico = async (
  trfId: string
): Promise<HydratedTrafico | null> => {
  const [allTraficos, allItems, events] = await Promise.all([
    readSheet<TraficoRow>("Traficos"),
    readSheet<TraficoItemRow>("Trafico_Items"),
    getTraficoEvents(trfId),
  ]);

  const row = allTraficos.find((t) => t.TRF_ID === trfId);
  if (!row) return null;

  const items = allItems
    .filter((i) => i.TRF_ID === trfId)
    .map(parsePedimentoItem);

  const trafico = mapFlatToRichTrafico(row, items);
  return { trafico, events };
};
