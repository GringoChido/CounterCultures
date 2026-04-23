import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { appendRow } from "@/app/lib/dashboard-sheets";
import { getProductById } from "@/app/lib/products-full";

interface RequestBody {
  locale?: "en" | "es";
  contact: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    projectName?: string;
  };
  notes?: string;
  items: Array<{
    productId: string;
    sku: string;
    name: string;
    brand: string;
    quantity: number;
  }>;
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const nowIso = () => new Date().toISOString();

const FROM = "Counter Cultures <noreply@countercultures.com.mx>";
const ROGER = process.env.NOTIFY_EMAIL || "roger@countercultures.com.mx";

/**
 * Public-side bulk quote request from /shop/catalog Project List.
 *
 * Flow:
 *   1. Validate payload.
 *   2. Create a Pipeline deal (stage: discovery, source: website).
 *   3. Append each Project List item to Deal_Line_Items (snapshot-at-add).
 *   4. Email Roger a summary with the deal link.
 *   5. (Optional) Send the customer a confirmation.
 *
 * Everything is best-effort: a sheet append failure doesn't fail the whole
 * request — the customer still sees a thank-you and the email goes out.
 */
export const POST = async (req: NextRequest) => {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { contact, items, notes, locale = "en" } = body;
  if (!contact?.name?.trim() || !contact?.email?.trim()) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "At least one product is required" },
      { status: 400 }
    );
  }
  if (items.length > 200) {
    return NextResponse.json(
      { error: "Too many items (max 200)" },
      { status: 400 }
    );
  }

  const dealId = newId("DEAL");
  const companyLabel = contact.company?.trim() || contact.name.trim();
  const dealName = (contact.projectName?.trim() ||
    `Quote request from ${contact.name.trim()}`).slice(0, 200);

  // 1. Pipeline deal
  try {
    await appendRow("Pipeline", [
      dealId,
      dealName,
      companyLabel,
      "discovery",
      "",                // value
      "25",              // probability
      "",                // expected_close
      "",                // owner
      "website",         // source
      nowIso(),          // created_at
      [notes ? `Customer notes: ${notes}` : "", `Contact: ${contact.name} <${contact.email}>${contact.phone ? ` · ${contact.phone}` : ""}`].filter(Boolean).join("\n"),
      "",                // brand_slugs
      "",                // source_message_id
      nowIso(),          // stage_entered_at
      "",                // pending_move_to
      "",                // pending_move_at
      "",                // date_at_border
      "",                // date_customs_cleared
    ]);
  } catch (err) {
    console.error("[shop/request-quote] Pipeline append failed:", err);
  }

  // 2. Line items — snapshot-at-add pattern, optionally enrich from products-full cache
  for (const it of items) {
    const q = Math.max(1, Math.floor(it.quantity) || 1);
    let listPrice = 0;
    try {
      const p = await getProductById(it.productId);
      if (p) listPrice = p.listPrice;
    } catch {
      // ignore
    }
    try {
      await appendRow("Deal_Line_Items", [
        newId("ITEM"),
        dealId,
        it.productId,
        it.sku ?? "",
        it.name ?? "",
        it.brand ?? "",
        "",                        // finish
        String(q),
        "0",                       // dealer_cost
        String(listPrice),         // quoted_price seed
        String(listPrice),         // msrp
        "0",                       // shipping
        "",                        // lead_time
        "current",
        "",                        // country_of_origin
        "",                        // hs_code
        nowIso(),
        nowIso(),
      ]);
    } catch (err) {
      console.error("[shop/request-quote] Line item append failed:", err);
    }
  }

  // 3. Email Roger
  const resendKey = process.env.RESEND_API_KEY;
  const lines = items
    .map(
      (i) =>
        `  • ${i.brand ? `[${i.brand}] ` : ""}${i.name || i.sku} — SKU ${i.sku || "—"} — Qty ${i.quantity}`
    )
    .join("\n");
  const totalUnits = items.reduce((s, i) => s + (i.quantity || 0), 0);

  const htmlItems = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #E5E0DB;font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#6B6B6B;">${escapeHtml(i.sku || "—")}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #E5E0DB;font-size:13px;">${escapeHtml(i.name || i.sku || "—")}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #E5E0DB;font-size:12px;color:#6B6B6B;">${escapeHtml(i.brand || "—")}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #E5E0DB;font-size:13px;text-align:center;">${i.quantity}</td>
        </tr>`
    )
    .join("");

  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: FROM,
        to: ROGER,
        replyTo: contact.email,
        subject: `Quote request — ${companyLabel} — ${items.length} items`,
        html: `
<div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;color:#2C2C2C;padding:24px;">
  <div style="border-bottom:2px solid #B87333;padding-bottom:12px;margin-bottom:20px;">
    <h1 style="font-weight:300;font-size:22px;margin:0;color:#1a1a1a;">New quote request</h1>
    <p style="font-family:'SF Mono',Menlo,monospace;font-size:10px;letter-spacing:0.15em;color:#B87333;text-transform:uppercase;margin:4px 0 0;">
      From the public catalog
    </p>
  </div>

  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
    <tr><td style="padding:4px 0;color:#6B6B6B;">Contact</td><td style="padding:4px 0;">${escapeHtml(contact.name)}</td></tr>
    <tr><td style="padding:4px 0;color:#6B6B6B;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(contact.email)}" style="color:#B87333;">${escapeHtml(contact.email)}</a></td></tr>
    ${contact.phone ? `<tr><td style="padding:4px 0;color:#6B6B6B;">Phone</td><td style="padding:4px 0;">${escapeHtml(contact.phone)}</td></tr>` : ""}
    ${contact.company ? `<tr><td style="padding:4px 0;color:#6B6B6B;">Company</td><td style="padding:4px 0;">${escapeHtml(contact.company)}</td></tr>` : ""}
    ${contact.projectName ? `<tr><td style="padding:4px 0;color:#6B6B6B;">Project</td><td style="padding:4px 0;">${escapeHtml(contact.projectName)}</td></tr>` : ""}
    <tr><td style="padding:4px 0;color:#6B6B6B;">Items</td><td style="padding:4px 0;">${items.length} line${items.length === 1 ? "" : "s"} · ${totalUnits} total units</td></tr>
    <tr><td style="padding:4px 0;color:#6B6B6B;">Deal</td><td style="padding:4px 0;font-family:'SF Mono',Menlo,monospace;font-size:11px;">${dealId}</td></tr>
    <tr><td style="padding:4px 0;color:#6B6B6B;">Locale</td><td style="padding:4px 0;">${locale}</td></tr>
  </table>

  <table style="width:100%;border-collapse:collapse;border:1px solid #E5E0DB;margin-bottom:16px;">
    <thead>
      <tr style="background:#F5F0EB;">
        <th style="padding:6px 8px;text-align:left;font-size:10px;letter-spacing:0.12em;color:#B87333;text-transform:uppercase;">SKU</th>
        <th style="padding:6px 8px;text-align:left;font-size:10px;letter-spacing:0.12em;color:#B87333;text-transform:uppercase;">Product</th>
        <th style="padding:6px 8px;text-align:left;font-size:10px;letter-spacing:0.12em;color:#B87333;text-transform:uppercase;">Brand</th>
        <th style="padding:6px 8px;text-align:center;font-size:10px;letter-spacing:0.12em;color:#B87333;text-transform:uppercase;">Qty</th>
      </tr>
    </thead>
    <tbody>${htmlItems}</tbody>
  </table>

  ${notes ? `<div style="margin-bottom:16px;padding:12px 14px;background:#F5F0EB;border-left:3px solid #B87333;font-size:13px;color:#2C2C2C;white-space:pre-wrap;">${escapeHtml(notes)}</div>` : ""}

  <p style="font-size:12px;color:#6B6B6B;margin:12px 0;">
    Deal created in Pipeline as <strong>${dealId}</strong>. Line items pre-populated with list-price seeds — edit real dealer + quoted prices on the Pipeline page before sending the customer a quote.
  </p>
  <p style="font-size:11px;color:#999;margin-top:16px;border-top:1px solid #E5E0DB;padding-top:10px;">
    Reply directly to this email to respond to the customer.
  </p>
</div>
`.trim(),
        text: `New quote request — ${companyLabel}

Contact: ${contact.name} <${contact.email}>${contact.phone ? ` · ${contact.phone}` : ""}
${contact.company ? `Company: ${contact.company}\n` : ""}${contact.projectName ? `Project: ${contact.projectName}\n` : ""}Items: ${items.length} lines · ${totalUnits} total
Deal: ${dealId}

${lines}

${notes ? `\nNotes from customer:\n${notes}` : ""}
`,
      });
    } catch (err) {
      console.error("[shop/request-quote] Resend to Roger failed:", err);
    }

    // Customer confirmation
    try {
      const resend = new Resend(resendKey);
      const greeting = locale === "es" ? "Hola" : "Hi";
      const body1 =
        locale === "es"
          ? "Gracias por tu solicitud. Tenemos tu lista y te responderemos con precios y tiempos de entrega en menos de 24 horas hábiles."
          : "Thanks for your request. We've got your list and will reply with pricing and lead times within 24 business hours.";
      const body2 =
        locale === "es"
          ? "Mientras tanto, si tienes alguna pregunta urgente, escríbenos a"
          : "If anything urgent comes up in the meantime, reach us at";
      await resend.emails.send({
        from: FROM,
        to: contact.email,
        replyTo: ROGER,
        subject:
          locale === "es"
            ? `Recibimos tu solicitud — Counter Cultures`
            : `We received your request — Counter Cultures`,
        html: `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2C2C2C;padding:24px;">
  <div style="border-bottom:2px solid #B87333;padding-bottom:12px;margin-bottom:20px;">
    <h1 style="font-weight:300;font-size:24px;margin:0;color:#1a1a1a;">Counter Cultures</h1>
  </div>
  <h2 style="font-weight:400;font-size:18px;margin:0 0 8px;">${greeting}, ${escapeHtml(contact.name.split(" ")[0])}</h2>
  <p style="line-height:1.7;color:#6B6B6B;">${body1}</p>
  <p style="line-height:1.7;color:#6B6B6B;">
    ${body2} <a href="mailto:info@countercultures.com.mx" style="color:#B87333;">info@countercultures.com.mx</a>.
  </p>
  <hr style="border:none;border-top:1px solid #E5E0DB;margin:24px 0;"/>
  <p style="font-size:11px;color:#999;">Counter Cultures · Providencia, San Miguel de Allende, Guanajuato, México</p>
</div>
`.trim(),
      });
    } catch (err) {
      console.error("[shop/request-quote] customer confirmation failed:", err);
    }
  }

  return NextResponse.json({ success: true, dealId });
};
