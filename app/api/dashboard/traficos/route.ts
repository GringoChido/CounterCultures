import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  findRowIndex,
  updateRow,
} from "@/app/lib/dashboard-sheets";

type TraficoRecord = {
  TRF_ID: string;
  Trafico_Number: string;
  Pedimento_Number: string;
  Status: string;
  Broker_Name: string;
  Broker_Email: string;
  Crossing_Agent: string;
  Warehouse_Name: string;
  Warehouse_Address: string;
  Invoice_Value_USD: string;
  Exchange_Rate: string;
  Customs_Value_MXN: string;
  Calculo_Total_MXN: string;
  Calculo_Breakdown_JSON: string;
  Calculo_Drive_ID: string;
  Truck_Crossing_Fee: string;
  Truck_Fee_Payee: string;
  Calculo_Payment_JSON: string;
  Truck_Payment_JSON: string;
  Total_Import_Cost: string;
  Factura_Amount: string;
  Factura_Difference: string;
  Factura_Drive_ID: string;
  Domestic_Carrier: string;
  Domestic_Tracking: string;
  Domestic_Ship_Date: string;
  Domestic_Est_Arrival: string;
  Domestic_Actual_Arrival: string;
  Expediente_Status: string;
  Expediente_Drive_ID: string;
  Expediente_Signed_Date: string;
  Initiated_Date: string;
  Import_Closed_Date: string;
  Calculo_Received_Date: string;
  Payment_Sent_Date: string;
  Crossing_Approved_Date: string;
  Completed_Date: string;
  Notes: string;
  Status_History_JSON: string;
  Item_Count: string;
};

const TRAFICO_COLUMNS: (keyof TraficoRecord)[] = [
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

export const GET = async (request: NextRequest) => {
  const status = request.nextUrl.searchParams.get("status");

  try {
    let traficos = await readSheet<TraficoRecord>("Traficos");

    if (status) {
      traficos = traficos.filter((t) => t.Status === status);
    }

    return NextResponse.json({ traficos });
  } catch (err) {
    console.error("[Traficos API] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch traficos" }, { status: 500 });
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const body: TraficoRecord = await request.json();
    const values = TRAFICO_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("Traficos", values);
    return NextResponse.json({ success: true, trfId: body.TRF_ID });
  } catch (err) {
    console.error("[Traficos API] POST error:", err);
    return NextResponse.json({ error: "Failed to create trafico" }, { status: 500 });
  }
};

export const PUT = async (request: NextRequest) => {
  try {
    const body: TraficoRecord = await request.json();
    const { TRF_ID } = body;

    if (!TRF_ID) {
      return NextResponse.json({ error: "TRF_ID is required" }, { status: 400 });
    }

    const rowIdx = await findRowIndex("Traficos", "TRF_ID", TRF_ID);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Trafico not found" }, { status: 404 });
    }

    const values = TRAFICO_COLUMNS.map((col) => body[col] ?? "");
    await updateRow("Traficos", rowIdx, values);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Traficos API] PUT error:", err);
    return NextResponse.json({ error: "Failed to update trafico" }, { status: 500 });
  }
};
