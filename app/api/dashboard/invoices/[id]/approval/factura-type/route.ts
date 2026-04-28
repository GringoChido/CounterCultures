/**
 * POST /api/dashboard/invoices/[id]/approval/factura-type
 *
 * Sets the factura type for the invoice's CFDI workflow:
 *   - "personalized": customer requested factura with their RFC. Triggers
 *     the prefactura → internal approval → stamp gate.
 *   - "general_public": Público en general. Skips the approval step;
 *     Attach CFDI is unlocked immediately.
 *
 * Gated by `send_prefactura` (anyone who can start the factura workflow
 * can also set its type). Refuses to change after stamping.
 *
 * Body: { type: "personalized" | "general_public" }
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { setFacturaType } from "@/app/lib/invoice-approval";
import { getInvoiceDetail } from "@/app/lib/odoo-sheets";
import { appendRow } from "@/app/lib/dashboard-sheets";

const Body = z.object({
  type: z.enum(["personalized", "general_public"]),
});

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const user = await requireFeature("send_prefactura");
    const { id } = await params;
    const invoiceId = Number(id);
    if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }
    const body = Body.parse(await req.json());

    const invoiceDetail = await getInvoiceDetail(String(invoiceId));
    const invoiceName = invoiceDetail?.invoice?.name ?? `INV-${invoiceId}`;

    const approval = await setFacturaType({
      invoiceId,
      invoiceName,
      type: body.type,
      byEmail: user.email,
    });

    appendRow("Activity_Log", [
      `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      new Date().toISOString(),
      user.email,
      `set_factura_type_${body.type}`,
      "invoice",
      String(invoiceId),
      JSON.stringify({ invoice_name: invoiceName, type: body.type }),
    ]).catch((err) =>
      console.error("[factura-type] Activity_Log append failed:", err)
    );

    return NextResponse.json({ ok: true, approval });
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
    const msg = err instanceof Error ? err.message : "set_type_failed";
    console.error("[factura-type]", msg);
    const status = msg.includes("already stamped") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
