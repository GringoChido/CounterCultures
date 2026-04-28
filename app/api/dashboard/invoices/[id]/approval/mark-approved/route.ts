/**
 * POST /api/dashboard/invoices/[id]/approval/mark-approved
 *
 * Logs that the customer has approved the prefactura. Advances state
 * `prefactura_sent` (or `draft`, in edge cases) → `approved`. The `approved`
 * state unlocks the CFDI attach flow downstream.
 *
 * Body: { method: "email_reply"|"signature"|"verbal"|"in_person"|"other",
 *         note?: string }
 *
 * Gated by `approve_prefactura` (default: finance + owner — not sales —
 * to keep the audit chain tight).
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { recordApproved } from "@/app/lib/invoice-approval";
import { getInvoiceDetail } from "@/app/lib/odoo-sheets";
import { appendRow } from "@/app/lib/dashboard-sheets";

const Body = z.object({
  method: z.enum(["email_reply", "signature", "verbal", "in_person", "other"]),
  note: z.string().max(2000).optional(),
});

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const user = await requireFeature("approve_prefactura");
    const { id } = await params;
    const invoiceId = Number(id);
    if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }
    const body = Body.parse(await req.json());

    const invoiceDetail = await getInvoiceDetail(String(invoiceId));
    const invoiceName = invoiceDetail?.invoice?.name ?? `INV-${invoiceId}`;

    const approval = await recordApproved({
      invoiceId,
      invoiceName,
      byEmail: user.email,
      method: body.method,
      note: body.note,
    });

    appendRow("Activity_Log", [
      `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      new Date().toISOString(),
      user.email,
      "approve_prefactura",
      "invoice",
      String(invoiceId),
      JSON.stringify({
        invoice_name: invoiceName,
        method: body.method,
        note: body.note ?? null,
      }),
    ]).catch((err) =>
      console.error("[mark-approved] Activity_Log append failed:", err)
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
    const msg = err instanceof Error ? err.message : "approve_failed";
    console.error("[mark-approved]", msg);
    const status = msg.includes("already stamped") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
