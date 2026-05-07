import { NextResponse, type NextRequest } from "next/server";
import { getPaymentDetail } from "@/app/lib/odoo-sheets";
import {
  applyPaymentUpdate,
  checkInvoicePaymentLinks,
  type PaymentUpdate,
} from "@/app/lib/payment-safeguards";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const detail = await getPaymentDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const links = await checkInvoicePaymentLinks(id);

    return NextResponse.json({ ...detail, paymentLinks: links });
  } catch (err) {
    console.error("[payment detail API] error:", err);
    return NextResponse.json({ error: "Failed to load payment" }, { status: 500 });
  }
};

/**
 * PATCH /api/dashboard/payments/[id]
 *
 * Update editable fields on a payment (date, ref, memo, amount).
 * Reconciliation links (payment ↔ bill/invoice) are ALWAYS preserved.
 * Attempting to clear reconciled_invoice_ids or reconciled_bill_ids
 * returns a 403.
 */
export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const body = (await req.json()) as PaymentUpdate;
    const result = await applyPaymentUpdate(id, body);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, warnings: result.warnings },
        { status: result.error?.includes("cannot be removed") ? 403 : 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      warnings: result.warnings,
      message:
        result.warnings.length > 0
          ? "Payment updated with warnings — bill/invoice links preserved"
          : "Payment updated — bill/invoice links preserved",
    });
  } catch (err) {
    console.error("[payment PATCH] error:", err);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
};
