/**
 * POST /api/dashboard/payments/register
 *
 * Registers a payment against an Odoo invoice. Gated by the `register_payment`
 * feature (default: owner + finance roles). Records the actor in the local
 * Activity_Log so we have per-user attribution even though Odoo will stamp
 * the payment as the shared API user.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { registerPayment } from "@/app/lib/odoo/write";
import { invalidateOdooCache } from "@/app/lib/odoo-sheets";
import { appendRow } from "@/app/lib/dashboard-sheets";

const Body = z.object({
  invoiceId: z.number().int().positive(),
  amount: z.number().positive(),
  journalId: z.number().int().positive(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ref: z.string().max(120).optional(),
  memo: z.string().max(500).optional(),
});

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const user = await requireFeature("register_payment");
    const body = Body.parse(await req.json());

    const result = await registerPayment(body);

    // Audit: log the actual portal user who registered the payment.
    // Activity_Log schema: id | timestamp | actor_email | action | entity_type | entity_id | details
    const logId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    appendRow("Activity_Log", [
      logId,
      new Date().toISOString(),
      user.email,
      "register_payment",
      "invoice",
      String(body.invoiceId),
      JSON.stringify({
        odoo_payment_id: result.paymentId,
        payment_name: result.paymentName,
        amount: result.amount,
        journal_id: result.journalId,
        payment_date: result.paymentDate,
        ref: body.ref ?? null,
      }),
    ]).catch((err) =>
      console.error("[payments/register] Activity_Log append failed:", err)
    );

    // Invalidate the read mirror so the dashboard's next read either
    // re-fetches from Sheets (assumes upstream re-extract has run) or shows
    // the optimistic state. The new payment row will not appear until the
    // next /tmp/extract_batch45_payments.py + upload runs.
    invalidateOdooCache("payments");
    invalidateOdooCache("invoices");

    return NextResponse.json({ ok: true, payment: result });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid body", issues: err.issues },
        { status: 400 }
      );
    }
    const msg = err instanceof Error ? err.message : "register_payment_failed";
    console.error("[/api/dashboard/payments/register]", msg);
    const status = msg.includes("not configured")
      ? 503
      : msg.includes("Odoo authentication failed")
        ? 502
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
