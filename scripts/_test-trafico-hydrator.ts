/**
 * Round-trip test for the flat→rich Trafico hydrator.
 *
 * 1. Writes a test Trafico to the Traficos sheet (with Calculo_Breakdown_JSON,
 *    Status_History_JSON, Calculo_Payment_JSON populated)
 * 2. Writes 2 Trafico_Items for it (Kohler USMCA, Dornbracht partial)
 * 3. Calls hydrateTrafico(trfId)
 * 4. Asserts rich Trafico shape matches what customs-data.ts defines
 *
 * Leaves __TEST__ rows behind (cleanup is a separate concern, same
 * pattern as _test-trafico-events.ts).
 *
 * Run: npx tsx scripts/_test-trafico-hydrator.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const TEST_TRF_ID = `__TEST_HYDRATOR_${Date.now()}__`;

const CALCULO_BREAKDOWN = {
  igi: 100,
  prv: 0,
  cnt: 0,
  dta: 25,
  iva: 160,
  taxSubtotal: 285,
  honorarios: 1500,
  complementarios: 0,
  prevalidacion: 200,
  validacion: 0,
  sellosFiscales: 50,
  ivaCuentaMexicana: 280,
  brokerSubtotal: 2030,
  revisionClasificacion: 300,
  cargaDescarga: 200,
  coordinacionManejo: 0,
  etiquetasManuales: 0,
  otrosVUCEM: 0,
  reTrabajo: 0,
  warehouseSubtotal: 500,
};

const STATUS_HISTORY = [
  { status: "collecting", timestamp: "2026-04-19T00:00:00Z", actor: "test" },
  { status: "sent-to-broker", timestamp: "2026-04-19T12:00:00Z", actor: "test" },
];

const TRAFICO_COLUMNS = [
  "TRF_ID", "Trafico_Number", "Pedimento_Number", "Status",
  "Broker_Name", "Broker_Email", "Crossing_Agent",
  "Warehouse_Name", "Warehouse_Address",
  "Invoice_Value_USD", "Exchange_Rate", "Customs_Value_MXN",
  "Calculo_Total_MXN", "Calculo_Breakdown_JSON", "Calculo_Drive_ID",
  "Truck_Crossing_Fee", "Truck_Fee_Payee",
  "Calculo_Payment_JSON", "Truck_Payment_JSON",
  "Total_Import_Cost",
  "Factura_Amount", "Factura_Difference", "Factura_Drive_ID",
  "Domestic_Carrier", "Domestic_Tracking", "Domestic_Ship_Date",
  "Domestic_Est_Arrival", "Domestic_Actual_Arrival",
  "Expediente_Status", "Expediente_Drive_ID", "Expediente_Signed_Date",
  "Initiated_Date", "Import_Closed_Date", "Calculo_Received_Date",
  "Payment_Sent_Date", "Crossing_Approved_Date", "Completed_Date",
  "Notes", "Status_History_JSON", "Item_Count",
];

const ITEM_COLUMNS = [
  "Item_ID", "TRF_ID", "Deal_ID", "PO_ID", "Shipment_ID",
  "Vendor_Name", "Vendor_Invoice_Number", "Vendor_Invoice_Date", "Vendor_Invoice_Drive_ID",
  "Products_JSON", "Invoice_Subtotal", "Freight_Charge", "Invoice_Total",
  "US_Carrier", "US_Tracking",
  "Country_of_Origin", "Origin_Confirmed_By", "USMCA_Status", "USMCA_Cert_Drive_ID",
  "Spanish_Manuals_Required", "Spanish_Manuals_Status", "Spanish_Manual_Drive_IDs",
  "Is_Replacement", "Is_Late_Addition", "Notes",
];

const traficoRecord: Record<string, string> = {
  TRF_ID: TEST_TRF_ID,
  Trafico_Number: "E99-TEST",
  Pedimento_Number: "",
  Status: "calculo-received",
  Broker_Name: "Jeanefer Contreras",
  Broker_Email: "jeanefer@example.com",
  Crossing_Agent: "Quique",
  Warehouse_Name: "TGR Logistic Inc",
  Warehouse_Address: "4602 Modern Lane, Laredo TX",
  Invoice_Value_USD: "2500",
  Exchange_Rate: "17.35",
  Customs_Value_MXN: "43375",
  Calculo_Total_MXN: "2815",
  Calculo_Breakdown_JSON: JSON.stringify(CALCULO_BREAKDOWN),
  Calculo_Drive_ID: "",
  Truck_Crossing_Fee: "2668",
  Truck_Fee_Payee: "Carlos Enrique Garza Roque",
  Calculo_Payment_JSON: "",
  Truck_Payment_JSON: "",
  Total_Import_Cost: "5483",
  Factura_Amount: "",
  Factura_Difference: "",
  Factura_Drive_ID: "",
  Domestic_Carrier: "",
  Domestic_Tracking: "",
  Domestic_Ship_Date: "",
  Domestic_Est_Arrival: "",
  Domestic_Actual_Arrival: "",
  Expediente_Status: "not-sent",
  Expediente_Drive_ID: "",
  Expediente_Signed_Date: "",
  Initiated_Date: "2026-04-19",
  Import_Closed_Date: "",
  Calculo_Received_Date: "",
  Payment_Sent_Date: "",
  Crossing_Approved_Date: "",
  Completed_Date: "",
  Notes: "Hydrator round-trip test",
  Status_History_JSON: JSON.stringify(STATUS_HISTORY),
  Item_Count: "2",
};

const item1: Record<string, string> = {
  Item_ID: `__TEST_ITEM_A_${Date.now()}__`,
  TRF_ID: TEST_TRF_ID,
  Deal_ID: "DEAL-TEST-001",
  PO_ID: "",
  Shipment_ID: "",
  Vendor_Name: "Kohler",
  Vendor_Invoice_Number: "K-INV-123",
  Vendor_Invoice_Date: "2026-04-10",
  Vendor_Invoice_Drive_ID: "",
  Products_JSON: JSON.stringify([
    { sku: "K-2215-0", description: "Kitchen faucet", quantity: 2, unitPrice: 500, amount: 1000 },
  ]),
  Invoice_Subtotal: "1000",
  Freight_Charge: "100",
  Invoice_Total: "1100",
  US_Carrier: "FedEx",
  US_Tracking: "TRACK001",
  Country_of_Origin: "US",
  Origin_Confirmed_By: "Roger",
  USMCA_Status: "on-file",
  USMCA_Cert_Drive_ID: "drive_id_usmca_001",
  Spanish_Manuals_Required: "false",
  Spanish_Manuals_Status: "not-needed",
  Spanish_Manual_Drive_IDs: "",
  Is_Replacement: "false",
  Is_Late_Addition: "false",
  Notes: "",
};

const item2: Record<string, string> = {
  Item_ID: `__TEST_ITEM_B_${Date.now()}__`,
  TRF_ID: TEST_TRF_ID,
  Deal_ID: "DEAL-TEST-002",
  PO_ID: "",
  Shipment_ID: "",
  Vendor_Name: "Dornbracht",
  Vendor_Invoice_Number: "DB-INV-456",
  Vendor_Invoice_Date: "2026-04-12",
  Vendor_Invoice_Drive_ID: "",
  Products_JSON: JSON.stringify([
    { sku: "DB-25MM-001", description: "Vaia thermostat", quantity: 1, unitPrice: 812, amount: 812 },
    { sku: "DB-HANDLE-001", description: "Handle set", quantity: 1, unitPrice: 250, amount: 250 },
  ]),
  Invoice_Subtotal: "1062",
  Freight_Charge: "150",
  Invoice_Total: "1212",
  US_Carrier: "UPS",
  US_Tracking: "TRACK002",
  Country_of_Origin: "Other",
  Origin_Confirmed_By: "Roger",
  USMCA_Status: "not-applicable",
  USMCA_Cert_Drive_ID: "",
  Spanish_Manuals_Required: "true",
  Spanish_Manuals_Status: "in-translation",
  Spanish_Manual_Drive_IDs: "drive_id_manual_001|drive_id_manual_002",
  Is_Replacement: "false",
  Is_Late_Addition: "false",
  Notes: "",
};

const main = async () => {
  const { appendRow } = await import("../app/lib/dashboard-sheets");

  console.log("→ Seeding test Trafico + 2 items");
  await appendRow("Traficos", TRAFICO_COLUMNS.map((c) => traficoRecord[c] ?? ""));
  await appendRow("Trafico_Items", ITEM_COLUMNS.map((c) => item1[c] ?? ""));
  await appendRow("Trafico_Items", ITEM_COLUMNS.map((c) => item2[c] ?? ""));
  console.log(`  seeded Trafico ${TEST_TRF_ID} + 2 items`);

  console.log("→ hydrateTrafico(trfId)");
  const { hydrateTrafico } = await import("../app/lib/trafico-hydrator");
  const hydrated = await hydrateTrafico(TEST_TRF_ID);

  if (!hydrated) throw new Error("hydrateTrafico returned null for a trafico we just wrote");

  const { trafico, events } = hydrated;

  // Top-level identity
  if (trafico.id !== TEST_TRF_ID) throw new Error(`id mismatch: ${trafico.id}`);
  if (trafico.traficoNumber !== "E99-TEST") throw new Error(`traficoNumber mismatch: ${trafico.traficoNumber}`);
  if (trafico.status !== "calculo-received") throw new Error(`status mismatch: ${trafico.status}`);
  console.log("  ✓ top-level identity OK");

  // Items
  if (trafico.items.length !== 2) throw new Error(`items count: ${trafico.items.length}`);
  const kohler = trafico.items.find((i) => i.vendorName === "Kohler");
  const dorn = trafico.items.find((i) => i.vendorName === "Dornbracht");
  if (!kohler || !dorn) throw new Error("missing expected vendor items");
  if (kohler.usmcaStatus !== "on-file") throw new Error(`kohler.usmcaStatus: ${kohler.usmcaStatus}`);
  if (kohler.products.length !== 1) throw new Error(`kohler.products: ${kohler.products.length}`);
  if (kohler.products[0].sku !== "K-2215-0") throw new Error(`kohler SKU: ${kohler.products[0].sku}`);
  if (dorn.products.length !== 2) throw new Error(`dorn.products: ${dorn.products.length}`);
  if (dorn.spanishManualsRequired !== true) throw new Error(`dorn.spanishManualsRequired bool mismatch`);
  if (!dorn.spanishManualDocIds || dorn.spanishManualDocIds.length !== 2)
    throw new Error(`dorn.spanishManualDocIds not parsed (expected 2)`);
  console.log("  ✓ items[] shape OK (2 items, products parsed, USMCA/manuals correct)");

  // Calculo breakdown
  if (!trafico.calculoBreakdown) throw new Error("calculoBreakdown not parsed");
  if (trafico.calculoBreakdown.igi !== 100) throw new Error(`igi: ${trafico.calculoBreakdown.igi}`);
  if (trafico.calculoBreakdown.iva !== 160) throw new Error(`iva: ${trafico.calculoBreakdown.iva}`);
  if (trafico.calculoBreakdown.brokerSubtotal !== 2030)
    throw new Error(`brokerSubtotal: ${trafico.calculoBreakdown.brokerSubtotal}`);
  console.log("  ✓ calculoBreakdown parsed OK");

  // Status history
  if (trafico.statusHistory.length < 2) throw new Error(`statusHistory count: ${trafico.statusHistory.length}`);
  console.log(`  ✓ statusHistory parsed (${trafico.statusHistory.length} entries)`);

  // Events from Trafico_Events — not auto-logged since we bypassed the POST route
  if (!Array.isArray(events)) throw new Error("events not an array");
  console.log(`  ✓ events[] returned (${events.length} rows for this TRF_ID)`);

  // Financials
  if (trafico.invoiceValueUSD !== 2500) throw new Error(`invoiceValueUSD: ${trafico.invoiceValueUSD}`);
  if (trafico.exchangeRate !== 17.35) throw new Error(`exchangeRate: ${trafico.exchangeRate}`);
  if (trafico.customsValueMXN !== 43375) throw new Error(`customsValueMXN: ${trafico.customsValueMXN}`);
  console.log("  ✓ numeric financials parsed from strings OK");

  console.log(
    `\n✅ Trafico hydrator round-trip OK. (Test rows left behind: Trafico ${TEST_TRF_ID} + 2 items — cleanup is a separate concern.)`
  );
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
