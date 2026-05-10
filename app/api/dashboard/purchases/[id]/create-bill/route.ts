/**
 * POST /api/dashboard/purchases/[id]/create-bill
 *
 * Creates a draft vendor bill from a confirmed PO without requiring goods
 * receipt first. CC often receives the invoice before the physical shipment
 * arrives (international suppliers). The bill is created in draft state so
 * Tonina can review before posting.
 */

import { NextResponse, type NextRequest } from "next/server";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { createBillFromPO } from "@/app/lib/odoo/write";
import { invalidateOdooCache } from "@/app/lib/odoo-sheets";
import { appendRow } from "@/app/lib/dashboard-sheets";

export const POST = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const user = await requireFeature("register_payment");
    const { id } = await params;
    const poId = Number(id);
    if (!Number.isFinite(poId) || poId <= 0) {
      return NextResponse.json({ error: "Invalid PO ID" }, { status: 400 });
    }

    const result = await createBillFromPO(poId);

    const logId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    appendRow("Activity_Log", [
      logId,
      new Date().toISOString(),
      user.email,
      "purchase.create_bill",
      "purchase_order",
      String(poId),
      JSON.stringify({
        bill_id: result.billId,
        bill_name: result.billName,
        amount: result.amount,
      }),
    ]).catch((err) => console.error("[create-bill] log failed:", err));

    invalidateOdooCache("invoices");

    return NextResponse.json({ ok: true, bill: result });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : "create_bill_failed";
    console.error("[purchases/create-bill]", msg);
    const status = msg.includes("not configured")
      ? 503
      : msg.includes("not found")
        ? 404
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
