/**
 * POST /api/dashboard/invoices/payment-link
 *
 * Generates (or returns a cached) Stripe payment link for an Odoo invoice.
 * Gated by `send_payment_link`. The link carries `metadata.odoo_invoice_id`
 * so the Stripe → Odoo webhook bridge auto-registers the payment when the
 * customer pays.
 *
 * Body:
 *   {
 *     odooInvoiceId: number,
 *     invoiceName: string,
 *     partnerName: string,
 *     amount: number,        // residual in invoice currency
 *     currency: "MXN" | "USD",
 *     customerEmail?: string
 *   }
 *
 * Response: { url, paymentLinkId, amount, currency, cached }
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { getOrCreateInvoiceLink } from "@/app/lib/stripe-invoice-link";
import { appendRow } from "@/app/lib/dashboard-sheets";

const Body = z.object({
  odooInvoiceId: z.number().int().positive(),
  invoiceName: z.string().min(1).max(200),
  partnerName: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.enum(["MXN", "USD"]),
  customerEmail: z.string().email().optional(),
});

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const user = await requireFeature("send_payment_link");
    const body = Body.parse(await req.json());

    const result = await getOrCreateInvoiceLink(body);
    if (!result) {
      return NextResponse.json(
        {
          error:
            "Couldn't create payment link. Stripe may not be configured, the currency may be unsupported, or the amount is below Stripe's minimum (10 MXN / 0.50 USD).",
        },
        { status: 422 }
      );
    }

    appendRow("Activity_Log", [
      `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      new Date().toISOString(),
      user.email,
      result.cached ? "payment_link_reused" : "payment_link_created",
      "invoice",
      String(body.odooInvoiceId),
      JSON.stringify({
        payment_link_id: result.paymentLinkId,
        amount: result.amount,
        currency: result.currency,
        invoice_name: body.invoiceName,
      }),
    ]).catch((err) =>
      console.error("[invoices/payment-link] Activity_Log failed:", err)
    );

    return NextResponse.json({ ok: true, ...result });
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
    const msg = err instanceof Error ? err.message : "payment_link_failed";
    console.error("[/api/dashboard/invoices/payment-link]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
