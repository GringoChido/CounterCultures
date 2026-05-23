import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { createQuote } from "@/app/lib/odoo/write";
import { invalidateOdooCache } from "@/app/lib/odoo-sheets";
import { appendRow } from "@/app/lib/dashboard-sheets";

const LineSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().positive(),
  priceUnit: z.number().optional(),
  discount: z.number().min(0).max(100).optional(),
});

const Body = z.object({
  partnerId: z.number().int().positive(),
  lines: z.array(LineSchema).min(1),
  validity_date: z.string().optional(),
  payment_term_id: z.number().int().positive().optional(),
  pricelist_id: z.number().int().positive().optional(),
  companyId: z.number().int().positive().optional(),
  salespersonId: z.number().int().positive().optional(),
  note: z.string().optional(),
});

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const user = await requireFeature("create_quote");
    const body = Body.parse(await req.json());

    const result = await createQuote(body);

    appendRow("Activity_Log", [
      `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      new Date().toISOString(),
      user.email,
      "create_quote",
      "sale_order",
      String(result.orderId),
      JSON.stringify({
        partner_id: body.partnerId,
        order_name: result.orderName,
        line_count: body.lines.length,
      }),
    ]).catch((err) =>
      console.error("[orders/create] Activity_Log append failed:", err)
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
    const msg = err instanceof Error ? err.message : "create_quote_failed";
    console.error("[/api/dashboard/orders/create]", msg);
    const status = msg.includes("not configured")
      ? 503
      : msg.includes("Odoo authentication failed")
        ? 502
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
