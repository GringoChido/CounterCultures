import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";

type PurchaseOrderRecord = {
  PO_ID: string;
  Deal_ID: string;
  Brand: string;
  Manufacturer: string;
  Items_JSON: string;
  Total_Amount: string;
  Currency: string;
  Status: string;
  Sent_Date: string;
  Confirmed_Date: string;
  Payment_Date: string;
  Payment_Method: string;
  Payment_Ref: string;
  Payment_Amount: string;
  Ship_To: string;
  Requested_Delivery: string;
  Estimated_Ship: string;
  Carrier: string;
  Tracking: string;
  Received_Date: string;
  Condition: string;
  Notes: string;
  Drive_File_ID: string;
};

const PO_COLUMNS: (keyof PurchaseOrderRecord)[] = [
  "PO_ID",
  "Deal_ID",
  "Brand",
  "Manufacturer",
  "Items_JSON",
  "Total_Amount",
  "Currency",
  "Status",
  "Sent_Date",
  "Confirmed_Date",
  "Payment_Date",
  "Payment_Method",
  "Payment_Ref",
  "Payment_Amount",
  "Ship_To",
  "Requested_Delivery",
  "Estimated_Ship",
  "Carrier",
  "Tracking",
  "Received_Date",
  "Condition",
  "Notes",
  "Drive_File_ID",
];

// ---------------------------------------------------------------------------
// GET - list / filter purchase orders
// ---------------------------------------------------------------------------

export const GET = async (request: NextRequest) => {
  const dealId = request.nextUrl.searchParams.get("dealId");

  try {
    let orders = await readSheet<PurchaseOrderRecord>("Purchase_Orders");

    if (dealId) {
      orders = orders.filter((o) => o.Deal_ID === dealId);
    }

    return NextResponse.json({ purchaseOrders: orders });
  } catch (err) {
    console.error("[Purchase Orders API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
};

// ---------------------------------------------------------------------------
// POST - create a new purchase order
// ---------------------------------------------------------------------------

export const POST = async (request: NextRequest) => {
  try {
    const body: PurchaseOrderRecord = await request.json();

    const values = PO_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("Purchase_Orders", values);

    return NextResponse.json({ success: true, poId: body.PO_ID });
  } catch (err) {
    console.error("[Purchase Orders API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
};

// ---------------------------------------------------------------------------
// PUT - update an existing purchase order by PO_ID
// ---------------------------------------------------------------------------

export const PUT = async (request: NextRequest) => {
  try {
    const body: PurchaseOrderRecord = await request.json();
    const { PO_ID } = body;

    if (!PO_ID) {
      return NextResponse.json(
        { error: "PO_ID is required" },
        { status: 400 }
      );
    }

    const rowIdx = await findRowIndex("Purchase_Orders", "PO_ID", PO_ID);
    if (rowIdx === null) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    const values = PO_COLUMNS.map((col) => body[col] ?? "");
    await updateRow("Purchase_Orders", rowIdx, values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Purchase Orders API] PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update purchase order" },
      { status: 500 }
    );
  }
};
