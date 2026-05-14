import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRowByHeader,
  updateRowByHeader,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";
import { ensureColumns } from "@/app/lib/sheet-migrations";

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
  // PR 9 — Skydropx integration columns
  Label_Drive_File_ID: string;
  Tracking_URL: string;
  Skydropx_Mode: string; // "dry-run" | "live"
  Rate_MXN: string;
  Carrier_Display: string;
  /**
   * R4 Note 7: which delivery shape this shipment follows. Empty / unknown
   * collapses to "standard" downstream. See app/lib/delivery-methods.ts.
   */
  Delivery_Method: string;
  /** Used when Delivery_Method = "dropship": the supplier doing the direct ship. */
  Dropship_Supplier: string;
  /**
   * Free text — the final landing point when CC isn't the destination
   * (e.g. "Manzanillo · cliente directo", "Monterrey · obra Linda Vista").
   */
  Final_Destination: string;
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
  "Label_Drive_File_ID",
  "Tracking_URL",
  "Skydropx_Mode",
  "Rate_MXN",
  "Carrier_Display",
  "Delivery_Method",
  "Dropship_Supplier",
  "Final_Destination",
];

const R4_NOTE_7_COLUMNS = [
  "Delivery_Method",
  "Dropship_Supplier",
  "Final_Destination",
];

const recordToFields = (body: Partial<ShipmentRecord>): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const col of SHIPMENT_COLUMNS) {
    out[col] = body[col] ?? "";
  }
  return out;
};

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

    // Self-heal R4 Note 7 columns before write so legacy sheets pick up
    // delivery method without a manual migration.
    await ensureColumns("Shipments", R4_NOTE_7_COLUMNS);
    await appendRowByHeader("Shipments", recordToFields(body));

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

    await ensureColumns("Shipments", R4_NOTE_7_COLUMNS);
    await updateRowByHeader("Shipments", rowIdx, recordToFields(body));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Shipments API] PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update shipment" },
      { status: 500 }
    );
  }
};
