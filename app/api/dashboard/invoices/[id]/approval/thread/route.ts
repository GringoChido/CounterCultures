/**
 * GET /api/dashboard/invoices/[id]/approval/thread
 *
 * Returns the prefactura email thread for inline display on the invoice
 * workflow panel — so Roger / Finance can see the customer (or Javier's)
 * approval reply right next to the "Mark Approved" button without
 * tab-switching to Gmail.
 *
 * Coverage caveat: Gmail threads belong to the user who sent the email.
 * If the current portal user wasn't a participant, the Gmail API returns
 * 404 — we surface that as `{ accessible: false }` and the UI falls back
 * to the existing "Open in Gmail" deep-link.
 */

import { NextResponse, type NextRequest } from "next/server";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { getInvoiceApproval } from "@/app/lib/invoice-approval";
import { getThread } from "@/app/lib/gmail";

interface ShapedMessage {
  messageId: string;
  from: string;
  fromEmail: string;
  date: string;
  snippet: string;
  body: string;
  unread: boolean;
}

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
    const threadId = approval.prefacturaThreadId;
    if (!threadId) {
      return NextResponse.json({
        accessible: false,
        reason: "no_thread",
        threadId: "",
        messages: [],
      });
    }

    try {
      const thread = await getThread(threadId);
      const messages: ShapedMessage[] = thread.messages.map((m) => ({
        messageId: m.messageId,
        from: m.from,
        fromEmail: m.fromEmail,
        date: m.date,
        snippet: m.snippet,
        // Keep body for the latest-message preview but trim — large
        // bodies inflate the JSON payload unnecessarily.
        body: m.body.slice(0, 4000),
        unread: m.unread,
      }));
      return NextResponse.json({
        accessible: true,
        threadId,
        subject: thread.subject,
        messages,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "thread_fetch_failed";
      // Gmail returns 404 when the current user isn't a thread participant.
      // Don't error the whole request — return accessible:false so UI
      // gracefully shows the "Open in Gmail" fallback for the sender.
      const isNotFound =
        msg.includes("404") ||
        msg.toLowerCase().includes("not found") ||
        msg === "Gmail not connected";
      if (isNotFound) {
        return NextResponse.json({
          accessible: false,
          reason: msg === "Gmail not connected" ? "gmail_not_connected" : "not_participant",
          threadId,
          messages: [],
        });
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "thread_failed";
    console.error("[/api/dashboard/invoices/[id]/approval/thread]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
