/**
 * GET /api/dashboard/invoices/[id]/approval
 *
 * Returns the current approval state for the invoice — what stage the
 * prefactura/CFDI workflow is in, with timestamps + actor history. Used
 * by the InvoiceWorkflowPanel to render the right action buttons.
 *
 * Always returns a record (defaults to "draft" if no row exists yet).
 */

import { NextResponse, type NextRequest } from "next/server";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { getInvoiceApproval } from "@/app/lib/invoice-approval";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    await requireFeature("view_invoices");
    const { id } = await params;
    const invoiceId = Number(id);
    if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }
    const approval = await getInvoiceApproval(invoiceId);
    return NextResponse.json({ approval });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "approval_state_failed";
    console.error("[/api/dashboard/invoices/[id]/approval]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
