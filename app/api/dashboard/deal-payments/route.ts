import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";

type DealPaymentRecord = {
  Payment_ID: string;
  Deal_ID: string;
  Type: string;
  Invoice_ID: string;
  Stripe_Invoice_ID: string;
  Stripe_Payment_ID: string;
  Amount: string;
  Currency: string;
  Stripe_Fees: string;
  Net_Received: string;
  Status: string;
  Due_Date: string;
  Paid_Date: string;
  Installment_Num: string;
};

const PAYMENT_COLUMNS: (keyof DealPaymentRecord)[] = [
  "Payment_ID",
  "Deal_ID",
  "Type",
  "Invoice_ID",
  "Stripe_Invoice_ID",
  "Stripe_Payment_ID",
  "Amount",
  "Currency",
  "Stripe_Fees",
  "Net_Received",
  "Status",
  "Due_Date",
  "Paid_Date",
  "Installment_Num",
];

// ---------------------------------------------------------------------------
// GET - list / filter deal payments
// ---------------------------------------------------------------------------

export const GET = async (request: NextRequest) => {
  const dealId = request.nextUrl.searchParams.get("dealId");

  try {
    let payments = await readSheet<DealPaymentRecord>("Deal_Payments");

    if (dealId) {
      payments = payments.filter((p) => p.Deal_ID === dealId);
    }

    return NextResponse.json({ payments });
  } catch (err) {
    console.error("[Deal Payments API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch deal payments" },
      { status: 500 }
    );
  }
};

// ---------------------------------------------------------------------------
// POST - create a new deal payment
// ---------------------------------------------------------------------------

export const POST = async (request: NextRequest) => {
  try {
    const body: DealPaymentRecord = await request.json();

    const values = PAYMENT_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("Deal_Payments", values);

    return NextResponse.json({ success: true, paymentId: body.Payment_ID });
  } catch (err) {
    console.error("[Deal Payments API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create deal payment" },
      { status: 500 }
    );
  }
};

// ---------------------------------------------------------------------------
// PUT - update an existing deal payment by Payment_ID
// ---------------------------------------------------------------------------

export const PUT = async (request: NextRequest) => {
  try {
    const body: DealPaymentRecord = await request.json();
    const { Payment_ID } = body;

    if (!Payment_ID) {
      return NextResponse.json(
        { error: "Payment_ID is required" },
        { status: 400 }
      );
    }

    const rowIdx = await findRowIndex(
      "Deal_Payments",
      "Payment_ID",
      Payment_ID
    );
    if (rowIdx === null) {
      return NextResponse.json(
        { error: "Deal payment not found" },
        { status: 404 }
      );
    }

    const values = PAYMENT_COLUMNS.map((col) => body[col] ?? "");
    await updateRow("Deal_Payments", rowIdx, values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Deal Payments API] PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update deal payment" },
      { status: 500 }
    );
  }
};
