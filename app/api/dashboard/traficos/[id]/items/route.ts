import { NextResponse, type NextRequest } from "next/server";
import { readSheet, appendRow, findRowIndex, updateRow } from "@/app/lib/dashboard-sheets";

type TraficoItemRecord = {
  Item_ID: string;
  TRF_ID: string;
  Deal_ID: string;
  PO_ID: string;
  Shipment_ID: string;
  Vendor_Name: string;
  Vendor_Invoice_Number: string;
  Vendor_Invoice_Date: string;
  Vendor_Invoice_Drive_ID: string;
  Products_JSON: string;
  Invoice_Subtotal: string;
  Freight_Charge: string;
  Invoice_Total: string;
  US_Carrier: string;
  US_Tracking: string;
  Country_of_Origin: string;
  Origin_Confirmed_By: string;
  USMCA_Status: string;
  USMCA_Cert_Drive_ID: string;
  Spanish_Manuals_Required: string;
  Spanish_Manuals_Status: string;
  Spanish_Manual_Drive_IDs: string;
  Is_Replacement: string;
  Is_Late_Addition: string;
  Notes: string;
};

const ITEM_COLUMNS: (keyof TraficoItemRecord)[] = [
  "Item_ID", "TRF_ID", "Deal_ID", "PO_ID", "Shipment_ID",
  "Vendor_Name", "Vendor_Invoice_Number", "Vendor_Invoice_Date", "Vendor_Invoice_Drive_ID",
  "Products_JSON", "Invoice_Subtotal", "Freight_Charge", "Invoice_Total",
  "US_Carrier", "US_Tracking",
  "Country_of_Origin", "Origin_Confirmed_By", "USMCA_Status", "USMCA_Cert_Drive_ID",
  "Spanish_Manuals_Required", "Spanish_Manuals_Status", "Spanish_Manual_Drive_IDs",
  "Is_Replacement", "Is_Late_Addition", "Notes",
];

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  try {
    let items = await readSheet<TraficoItemRecord>("Trafico_Items");
    items = items.filter((item) => item.TRF_ID === id);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[Trafico Items API] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
};

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  try {
    const body: TraficoItemRecord = await request.json();
    body.TRF_ID = id;
    const values = ITEM_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("Trafico_Items", values);
    return NextResponse.json({ success: true, itemId: body.Item_ID });
  } catch (err) {
    console.error("[Trafico Items API] POST error:", err);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
};

export const PUT = async (request: NextRequest) => {
  try {
    const body: TraficoItemRecord = await request.json();
    const { Item_ID } = body;

    if (!Item_ID) {
      return NextResponse.json({ error: "Item_ID is required" }, { status: 400 });
    }

    const rowIdx = await findRowIndex("Trafico_Items", "Item_ID", Item_ID);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const values = ITEM_COLUMNS.map((col) => body[col] ?? "");
    await updateRow("Trafico_Items", rowIdx, values);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Trafico Items API] PUT error:", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
};
