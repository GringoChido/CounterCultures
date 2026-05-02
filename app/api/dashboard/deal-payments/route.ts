import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRowByHeader,
  updateRowByHeader,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";
import { ensureColumns } from "@/app/lib/sheet-migrations";
import { requireFeature, FeatureDeniedError, getCurrentUser } from "@/app/lib/auth";
import { hasFeature } from "@/app/lib/features";

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
  /**
   * R2-4: three-bucket fiscal disposition. "cfdi" = stamped CFDI,
   * "general" = factura general al público, "cash_bucket" = off-books
   * earmarked cash. Empty for legacy rows.
   */
  Fiscal_Disposition: string;
  /**
   * R2-4: required when Fiscal_Disposition === "cash_bucket". One of
   * "rent" | "petty_cash" | "salaries" | "other".
   */
  Cash_Earmark: string;
  /**
   * R2-4 polish: free-text memo accompanying off-books cash entries
   * (and any payment for that matter). Captures "April rent —
   * Pasaje del Correo" so Roger can answer "what was this for?"
   * months later.
   */
  Memo: string;
};

// Canonical R2 columns. The header-keyed write helpers don't use this for
// positioning — they read the live sheet header — but it documents the
// schema this route knows how to round-trip.
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
  "Fiscal_Disposition",
  "Cash_Earmark",
  "Memo",
];

const recordToFields = (body: DealPaymentRecord): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const col of PAYMENT_COLUMNS) {
    out[col] = body[col] ?? "";
  }
  return out;
};

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
    // Auth gate: any payment write requires register_payment. Cash-bucket
    // entries additionally require view_cash_bucket — without it we won't
    // accept Fiscal_Disposition === "cash_bucket" so a sales-role user
    // can't sneak an off-books row in via direct API call.
    const user = await requireFeature("register_payment");
    const body: DealPaymentRecord = await request.json();
    if (
      (body.Fiscal_Disposition ?? "").toLowerCase() === "cash_bucket" &&
      !hasFeature(user, "view_cash_bucket")
    ) {
      return NextResponse.json(
        {
          error: "Forbidden",
          feature: "view_cash_bucket",
          detail: "Cash-bucket payments are owner-gated.",
        },
        { status: 403 }
      );
    }

    // Self-heal: ensure the R2-4 + Memo columns exist before we attempt to
    // write them. Idempotent.
    await ensureColumns("Deal_Payments", ["Fiscal_Disposition", "Cash_Earmark", "Memo"]);

    await appendRowByHeader("Deal_Payments", recordToFields(body));

    return NextResponse.json({ success: true, paymentId: body.Payment_ID });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
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
    await requireFeature("register_payment");
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

    // Owner gate on existing cash-bucket rows too — non-owners can't flip
    // an existing row's disposition or earmark.
    const user = await getCurrentUser();
    if (
      user &&
      (body.Fiscal_Disposition ?? "").toLowerCase() === "cash_bucket" &&
      !hasFeature(user, "view_cash_bucket")
    ) {
      return NextResponse.json(
        { error: "Forbidden", feature: "view_cash_bucket" },
        { status: 403 }
      );
    }

    await updateRowByHeader("Deal_Payments", rowIdx, recordToFields(body));

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    console.error("[Deal Payments API] PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update deal payment" },
      { status: 500 }
    );
  }
};
