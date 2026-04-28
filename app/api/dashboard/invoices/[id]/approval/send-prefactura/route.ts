/**
 * POST /api/dashboard/invoices/[id]/approval/send-prefactura
 *
 * Sends the prefactura PDF to the customer for review and advances the
 * approval state to "prefactura_sent". The PDF itself is uploaded by the
 * user as a multipart attachment — Roger generates the prefactura
 * elsewhere (Odoo or his current tool) and just hands it to the dashboard
 * to email + track.
 *
 * Body (multipart/form-data):
 *   to        — recipient email (defaults to invoice partner email)
 *   cc        — optional cc list (comma-separated)
 *   subject   — email subject line
 *   body      — plain-text body
 *   file      — prefactura PDF attachment (single file)
 *
 * Gated by `send_prefactura` feature. Sends via the user's per-user Gmail
 * (so the customer's reply lands in the rep's own inbox).
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { sendMessage } from "@/app/lib/gmail";
import { getInvoiceDetail } from "@/app/lib/odoo-sheets";
import { recordPrefacturaSent } from "@/app/lib/invoice-approval";
import { logEmailActivity } from "@/app/lib/email-activity";
import { appendRow } from "@/app/lib/dashboard-sheets";

const fieldSchema = z.object({
  to: z.string().email(),
  cc: z.string().optional(),
  subject: z.string().min(1).max(300),
  body: z.string().min(1),
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

    const formData = await req.formData();
    const fields = fieldSchema.parse({
      to: formData.get("to")?.toString() ?? "",
      cc: formData.get("cc")?.toString() ?? "",
      subject: formData.get("subject")?.toString() ?? "",
      body: formData.get("body")?.toString() ?? "",
    });

    // The prefactura PDF — required, since the whole point is sending it.
    const pdfFile = formData.get("file");
    if (!(pdfFile instanceof File) || pdfFile.size === 0) {
      return NextResponse.json(
        { error: "Prefactura PDF required (form field 'file')" },
        { status: 400 }
      );
    }
    const pdfBuf = Buffer.from(await pdfFile.arrayBuffer());

    // Look up invoice for the audit row + name
    const invoiceDetail = await getInvoiceDetail(String(invoiceId));
    const invoiceName = invoiceDetail?.invoice?.name ?? `INV-${invoiceId}`;

    // Send via the user's Gmail. attachments take a list of {filename,
    // mimeType, content} — we pass the prefactura as the only attachment.
    const sendResult = await sendMessage({
      to: fields.to,
      cc: fields.cc || undefined,
      subject: fields.subject,
      body: fields.body,
      attachments: [
        {
          filename: pdfFile.name || `${invoiceName}-prefactura.pdf`,
          mimeType: pdfFile.type || "application/pdf",
          content: pdfBuf,
        },
      ],
    });

    // Advance the workflow state. Captures the Gmail thread ID so the
    // invoice page can deep-link to the thread (which contains the RFC,
    // payment receipt, and final factura per Finance's note that these
    // threads are the existing system of record).
    const approval = await recordPrefacturaSent({
      invoiceId,
      invoiceName,
      byEmail: user.email,
      recipient: fields.to,
      threadId: sendResult.threadId,
    });

    // Mirror the existing send/reply pattern — log to Email_Activity so
    // the customer thread surfaces in the dashboard's activity views.
    logEmailActivity({
      userEmail: user.email,
      gmailMessageId: sendResult.messageId,
      gmailThreadId: sendResult.threadId,
      direction: "outbound",
      action: "sent",
      senderEmail: user.email,
      recipientEmails: [fields.to, ...(fields.cc?.split(",").map((s) => s.trim()).filter(Boolean) ?? [])],
      subject: fields.subject,
      snippet: fields.body.slice(0, 200),
    }).catch((err) =>
      console.error("[send-prefactura] Email_Activity log failed:", err)
    );

    appendRow("Activity_Log", [
      `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      new Date().toISOString(),
      user.email,
      "send_prefactura",
      "invoice",
      String(invoiceId),
      JSON.stringify({
        invoice_name: invoiceName,
        recipient: fields.to,
        cc: fields.cc || null,
        gmail_message_id: sendResult.messageId,
        gmail_thread_id: sendResult.threadId,
      }),
    ]).catch((err) =>
      console.error("[send-prefactura] Activity_Log append failed:", err)
    );

    return NextResponse.json({ ok: true, approval, gmail: sendResult });
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
    const msg = err instanceof Error ? err.message : "send_prefactura_failed";
    console.error("[send-prefactura]", msg);
    const status =
      msg === "Gmail not connected"
        ? 409
        : msg.includes("not configured")
          ? 503
          : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
