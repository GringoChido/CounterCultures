import { NextResponse, type NextRequest } from "next/server";
import { sendMessage, type MailAttachment } from "@/app/lib/gmail";
import { logEmailActivity } from "@/app/lib/email-activity";
import { getStatusForUser } from "@/app/lib/gmail-tokens";
import { getCurrentUserEmail } from "@/app/lib/auth";
import { isConfigured } from "@/app/lib/odoo/client";

const ALLOWED_REPORTS = new Set([
  "sale.report_saleorder",
  "purchase.report_purchaseorder",
  "account.report_invoice",
  "account.report_invoice_with_payments",
]);

const fetchOdooPdf = async (
  reportName: string,
  reportId: string
): Promise<Buffer | null> => {
  if (!isConfigured()) return null;
  const ODOO_URL = process.env.ODOO_URL ?? "";
  const ODOO_DB = process.env.ODOO_DB ?? "";
  const ODOO_USERNAME = process.env.ODOO_USERNAME ?? "";
  const ODOO_API_KEY = process.env.ODOO_API_KEY ?? "";
  try {
    const loginRes = await fetch(`${ODOO_URL}/web/session/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        params: { db: ODOO_DB, login: ODOO_USERNAME, password: ODOO_API_KEY },
      }),
    });
    const nativeCookies = loginRes.headers.getSetCookie?.() ?? [];
    const fallbackCookie = loginRes.headers.get("set-cookie");
    const cookies = nativeCookies.length > 0
      ? nativeCookies
      : fallbackCookie
        ? fallbackCookie.split(/,(?=\s*\w+=)/)
        : [];
    const sessionCookie = cookies
      .map((c) => c.split(";")[0].trim())
      .find((c) => c.startsWith("session_id="));
    if (!sessionCookie) return null;
    const pdfRes = await fetch(`${ODOO_URL}/report/pdf/${reportName}/${reportId}`, {
      headers: { Cookie: sessionCookie },
      redirect: "follow",
    });
    const ct = pdfRes.headers.get("content-type") ?? "";
    if (!pdfRes.ok || !ct.toLowerCase().startsWith("application/pdf")) return null;
    return Buffer.from(await pdfRes.arrayBuffer());
  } catch {
    return null;
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const { to, cc, bcc, subject, body, attachReport } = await request.json();
    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "to, subject, and body are required" },
        { status: 400 }
      );
    }

    const attachments: MailAttachment[] = [];
    let pdfAttached = false;
    if (
      attachReport &&
      typeof attachReport.report === "string" &&
      typeof attachReport.id === "string" &&
      typeof attachReport.fileName === "string" &&
      ALLOWED_REPORTS.has(attachReport.report)
    ) {
      const pdf = await fetchOdooPdf(attachReport.report, attachReport.id);
      if (pdf) {
        attachments.push({
          filename: attachReport.fileName,
          mimeType: "application/pdf",
          content: pdf,
        });
        pdfAttached = true;
      }
    }

    const result = await sendMessage({ to, cc, bcc, subject, body, attachments });

    const portalUser = await getCurrentUserEmail();
    const status = portalUser
      ? await getStatusForUser(portalUser)
      : { connected: false as const, gmailAddress: undefined };
    await logEmailActivity({
      userEmail: status.gmailAddress || "",
      gmailMessageId: result.messageId,
      gmailThreadId: result.threadId,
      direction: "outbound",
      action: "sent",
      senderEmail: status.gmailAddress || "",
      recipientEmails: [to, cc, bcc].filter(Boolean) as string[],
      subject,
      snippet: body.slice(0, 200),
    }).catch((err) => console.error("[Gmail send] activity log failed:", err));

    return NextResponse.json({ ...result, pdfAttached });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "send_failed";
    console.error("[Gmail send]", msg);
    const status = msg === "Gmail not connected" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
