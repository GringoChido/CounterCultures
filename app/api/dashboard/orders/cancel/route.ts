/**
 * POST /api/dashboard/orders/cancel
 *
 * "Mark dead" — cancels a sale order in Odoo (state → cancel). Used to
 * close out stale quotes the customer has gone silent on. Gated by
 * `cancel_order`. The order is preserved in Odoo; only the state changes.
 *
 * Body: { orderId: number }
 * Response: { ok: true, orderId, state }
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { cancelOrder } from "@/app/lib/odoo/write";
import { invalidateOdooCache } from "@/app/lib/odoo-sheets";
import { appendRow } from "@/app/lib/dashboard-sheets";

const Body = z.object({
  orderId: z.number().int().positive(),
  reason: z.string().max(500).optional(),
});

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const user = await requireFeature("cancel_order");
    const body = Body.parse(await req.json());

    const result = await cancelOrder(body.orderId);

    appendRow("Activity_Log", [
      `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      new Date().toISOString(),
      user.email,
      "cancel_order",
      "sale_order",
      String(body.orderId),
      JSON.stringify({
        new_state: result.state,
        reason: body.reason ?? null,
      }),
    ]).catch((err) =>
      console.error("[orders/cancel] Activity_Log append failed:", err)
    );

    invalidateOdooCache("sales");

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
    const msg = err instanceof Error ? err.message : "cancel_failed";
    console.error("[/api/dashboard/orders/cancel]", msg);
    const status = msg.includes("not configured")
      ? 503
      : msg.includes("not found")
        ? 404
        : msg.includes("locked")
          ? 409
          : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
