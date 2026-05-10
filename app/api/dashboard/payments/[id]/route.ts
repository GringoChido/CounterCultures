import { NextResponse, type NextRequest } from "next/server";
import { getPaymentDetail } from "@/app/lib/odoo-sheets";
import {
  applyPaymentUpdate,
  checkInvoicePaymentLinks,
  type PaymentUpdate,
} from "@/app/lib/payment-safeguards";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { appendRow } from "@/app/lib/dashboard-sheets";

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
 * Update editable fields on a payment (date, ref, memo, amount, journal_id,
 * currency_id, exchange_rate). Reconciliation links are ALWAYS preserved.
 * If amount/currency/rate changes on a reconciled payment, returns
 * requiresConfirmation=true unless force=true is passed.
 */
export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const user = await requireFeature("edit_payment");
    const body = (await req.json()) as PaymentUpdate;
    const result = await applyPaymentUpdate(id, body);

    if (result.requiresConfirmation) {
      return NextResponse.json({
        ok: false,
        requiresConfirmation: true,
        warnings: result.warnings,
        preservedLinks: result.preservedLinks,
      });
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, warnings: result.warnings },
        { status: result.error?.includes("cannot be removed") ? 403 : 400 }
      );
    }

    const logId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    appendRow("Activity_Log", [
      logId,
      new Date().toISOString(),
      user.email,
      "payment.edit",
      "payment",
      id,
      JSON.stringify({
        fields_changed: Object.keys(body).filter((k) => k !== "force"),
        forced: body.force ?? false,
      }),
    ]).catch((err) =>
      console.error("[payments/PATCH] Activity_Log append failed:", err)
    );

    return NextResponse.json({
      ok: true,
      warnings: result.warnings,
      message:
        result.warnings.length > 0
          ? "Payment updated with warnings — bill/invoice links preserved"
          : "Payment updated — bill/invoice links preserved",
    });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    console.error("[payment PATCH] error:", err);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
};
