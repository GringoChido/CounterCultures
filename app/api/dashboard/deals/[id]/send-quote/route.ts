import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { loadQuoteData, fmtMxn } from "@/app/lib/quote-data";
import { buildQuoteShareUrl } from "@/app/lib/quote-token";

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const FROM = "Counter Cultures <noreply@countercultures.com.mx>";

/**
 * Send the customer-facing quote link via email. Body can provide `to` and
 * `message`, or we fall back to the deal's stored customer email (future).
 *
 * Body: { to: string, cc?: string, message?: string }
 */
export const POST = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: dealId } = await context.params;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 503 }
    );
  }

  let body: { to?: string; cc?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const to = (body.to ?? "").trim();
  if (!to || !/.+@.+\..+/.test(to)) {
    return NextResponse.json(
      { error: "Recipient email required" },
      { status: 400 }
    );
  }

  const data = await loadQuoteData(dealId);
  if (!data) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const base = req.nextUrl.origin;
  const shareUrl = buildQuoteShareUrl(dealId, base);

  const companyName = data.deal.company || data.deal.name || "there";
  const personalMsgHtml = body.message
    ? `<p style="line-height:1.7;color:#6B6B6B;white-space:pre-wrap;">${escapeHtml(body.message)}</p>`
    : "";

  const html = `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2C2C2C;padding:32px 24px;">
  <div style="border-bottom:2px solid #B87333;padding-bottom:16px;margin-bottom:24px;">
    <h1 style="font-family:Georgia,serif;font-weight:300;font-size:28px;letter-spacing:0.02em;margin:0;color:#1a1a1a;">
      Counter Cultures
    </h1>
    <p style="font-family:'SF Mono',Menlo,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#B87333;margin:4px 0 0;">
      Premium Kitchen, Bath &amp; Architectural Hardware
    </p>
  </div>

  <h2 style="font-family:Georgia,serif;font-weight:400;letter-spacing:0.02em;font-size:22px;color:#1a1a1a;margin:0 0 12px;">
    Your quote is ready
  </h2>
  <p style="line-height:1.7;color:#6B6B6B;margin:0 0 16px;">
    Hi ${escapeHtml(companyName)},<br/><br/>
    Here's your quote from Counter Cultures: <strong>${escapeHtml(data.docNumber)}</strong> for a total of
    <strong>${escapeHtml(fmtMxn(data.grandTotal))}</strong> MXN. It's valid through
    ${escapeHtml(new Date(data.validUntil).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))}.
  </p>

  ${personalMsgHtml}

  <div style="margin:28px 0;">
    <a href="${shareUrl}" style="display:inline-block;background:#B87333;color:#fff;padding:14px 28px;text-decoration:none;border-radius:4px;font-weight:600;font-size:14px;letter-spacing:0.02em;">
      View quote &amp; pay deposit →
    </a>
  </div>

  <p style="line-height:1.7;color:#6B6B6B;font-size:13px;margin:0 0 8px;">
    The link opens your full quote with line items, lead times, and a secure
    option to pay your 50% deposit via Stripe to confirm the order.
  </p>
  <p style="line-height:1.6;color:#999;font-size:11px;word-break:break-all;">
    If the button doesn't open, copy this link:<br/>
    <a href="${shareUrl}" style="color:#B87333;">${shareUrl}</a>
  </p>

  <hr style="border:none;border-top:1px solid #E5E0DB;margin:28px 0;"/>
  <p style="font-size:11px;color:#999;line-height:1.6;margin:0;">
    Counter Cultures · Providencia, San Miguel de Allende, Guanajuato, México<br/>
    info@countercultures.com.mx · +52-415-154-8375
  </p>
</div>
`.trim();

  const plain = [
    `Hi ${companyName},`,
    ``,
    `Your Counter Cultures quote ${data.docNumber} is ready.`,
    `Total: ${fmtMxn(data.grandTotal)} MXN. Valid through ${data.validUntil}.`,
    ``,
    body.message ?? "",
    ``,
    `View quote & pay deposit:`,
    shareUrl,
    ``,
    `Counter Cultures · info@countercultures.com.mx · +52-415-154-8375`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const resend = new Resend(key);
    const result = await resend.emails.send({
      from: FROM,
      to,
      cc: body.cc ? [body.cc] : undefined,
      replyTo: "roger@countercultures.com.mx",
      subject: `Your Counter Cultures quote — ${data.docNumber}`,
      html,
      text: plain,
    });
    return NextResponse.json({
      success: true,
      messageId: result.data?.id ?? null,
      shareUrl,
    });
  } catch (err) {
    console.error("[send-quote] Resend failed:", err);
    const message = err instanceof Error ? err.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
