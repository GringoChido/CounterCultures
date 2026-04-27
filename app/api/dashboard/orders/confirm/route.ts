/**
 * POST /api/dashboard/orders/confirm
 *
 * Confirms a quote → sale order in Odoo and generates the customer
 * invoice(s) in one round-trip. Gated by `create_invoice`.
 *
 * Body: { orderId: number }
 * Response: { ok: true, orderState, invoiceIds[], invoiceNames[] }
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { confirmAndInvoiceOrder } from "@/app/lib/odoo/write";
import { invalidateOdooCache } from "@/app/lib/odoo-sheets";
import { appendRow } from "@/app/lib/dashboard-sheets";

const Body = z.object({
  orderId: z.number().int().positive(),
});

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const user = await requireFeature("create_invoice");
    const body = Body.parse(await req.json());

    const result = await confirmAndInvoiceOrder(body.orderId);

    appendRow("Activity_Log", [
      `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      new Date().toISOString(),
      user.email,
      "confirm_order_to_invoice",
      "sale_order",
      String(body.orderId),
      JSON.stringify({
        order_state: result.orderState,
        invoice_ids: result.invoiceIds,
        invoice_names: result.invoiceNames,
      }),
    ]).catch((err) =>
      console.error("[orders/confirm] Activity_Log append failed:", err)
    );

    invalidateOdooCache("sales");
    invalidateOdooCache("invoices");

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
    const msg = err instanceof Error ? err.message : "confirm_failed";
    console.error("[/api/dashboard/orders/confirm]", msg);
    const status = msg.includes("not configured")
      ? 503
      : msg.includes("Odoo authentication failed")
        ? 502
        : msg.includes("did not advance")
          ? 409
          : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
