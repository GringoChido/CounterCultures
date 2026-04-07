import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";

type ShipmentRecord = {
  Shipment_ID: string;
  Deal_ID: string;
  PO_ID: string;
  Brand: string;
  Carrier: string;
  Tracking: string;
  Status: string;
  Ship_Date: string;
  Est_Arrival: string;
  Actual_Arrival: string;
  Destination: string;
  Items_JSON: string;
  Inspection_Status: string;
  Inspection_Notes: string;
  Photo_IDs: string;
};

const SHIPMENT_COLUMNS: (keyof ShipmentRecord)[] = [
  "Shipment_ID",
  "Deal_ID",
  "PO_ID",
  "Brand",
  "Carrier",
  "Tracking",
  "Status",
  "Ship_Date",
  "Est_Arrival",
  "Actual_Arrival",
  "Destination",
  "Items_JSON",
  "Inspection_Status",
  "Inspection_Notes",
  "Photo_IDs",
];

// ---------------------------------------------------------------------------
// GET - list / filter shipments
// ---------------------------------------------------------------------------

export const GET = async (request: NextRequest) => {
  const dealId = request.nextUrl.searchParams.get("dealId");
  const poId = request.nextUrl.searchParams.get("poId");

  try {
    let shipments = await readSheet<ShipmentRecord>("Shipments");

    if (dealId) {
      shipments = shipments.filter((s) => s.Deal_ID === dealId);
    }

    if (poId) {
      shipments = shipments.filter((s) => s.PO_ID === poId);
    }

    return NextResponse.json({ shipments });
  } catch (err) {
    console.error("[Shipments API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
};

// ---------------------------------------------------------------------------
// POST - create a new shipment
// ---------------------------------------------------------------------------

export const POST = async (request: NextRequest) => {
  try {
    const body: ShipmentRecord = await request.json();

    const values = SHIPMENT_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("Shipments", values);

    return NextResponse.json({ success: true, shipmentId: body.Shipment_ID });
  } catch (err) {
    console.error("[Shipments API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
};

// ---------------------------------------------------------------------------
// PUT - update an existing shipment by Shipment_ID
// ---------------------------------------------------------------------------

export const PUT = async (request: NextRequest) => {
  try {
    const body: ShipmentRecord = await request.json();
    const { Shipment_ID } = body;

    if (!Shipment_ID) {
      return NextResponse.json(
        { error: "Shipment_ID is required" },
        { status: 400 }
      );
    }

    const rowIdx = await findRowIndex("Shipments", "Shipment_ID", Shipment_ID);
    if (rowIdx === null) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    const values = SHIPMENT_COLUMNS.map((col) => body[col] ?? "");
    await updateRow("Shipments", rowIdx, values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Shipments API] PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update shipment" },
      { status: 500 }
    );
  }
};
