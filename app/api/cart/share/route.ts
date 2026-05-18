import { NextResponse } from "next/server";
import { Resend } from "resend";
import { computeIva } from "@/app/lib/iva";

const FROM_ADDRESS =
  process.env.RESEND_FROM_TRANSACTIONAL || "onboarding@resend.dev";
const FROM = `Counter Cultures <${FROM_ADDRESS}>`;
const STAGING_EMAIL_REDIRECT = process.env.STAGING_EMAIL_REDIRECT;
const STAGING_ALLOWLIST = STAGING_EMAIL_REDIRECT
  ? STAGING_EMAIL_REDIRECT.split(",").map((e) => e.trim().toLowerCase())
  : [];

const redirectRecipient = (to: string): string => {
  if (!STAGING_ALLOWLIST.length) return to;
  if (STAGING_ALLOWLIST.includes(to.toLowerCase())) return to;
  return STAGING_ALLOWLIST[0];
};

interface ShareItem {
  name: string;
  brand: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  imageSrc?: string;
  selectedFinish?: string;
}

interface SharePayload {
  to: string;
  locale: "en" | "es";
  items: ShareItem[];
  subtotal: number;
  currency: string;
  shareUrl: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fmtPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const buildHtml = (p: SharePayload): string => {
  const isEs = p.locale === "es";
  const { iva: ivaAmount, subtotal: productSubtotal, total } = computeIva(p.subtotal, "MX");

  const heroImg = p.items.find((i) => i.imageSrc)?.imageSrc;

  const itemRows = p.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #F0ECE6; vertical-align: top;">
          ${
            item.imageSrc
              ? `<img src="${escapeHtml(item.imageSrc)}" alt="" width="56" height="56" style="display: block; object-fit: cover; border: 1px solid #F0ECE6;" />`
              : `<div style="width: 56px; height: 56px; background: #F0ECE6;"></div>`
          }
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #F0ECE6; vertical-align: top;">
          <p style="margin: 0; font-size: 14px; color: #2C2C2C;">${escapeHtml(item.name)}</p>
          <p style="margin: 2px 0 0; font-size: 12px; color: #6B6B6B;">${escapeHtml(item.brand)}${item.selectedFinish ? ` · ${escapeHtml(item.selectedFinish)}` : ""}</p>
          <p style="margin: 2px 0 0; font-size: 11px; color: #999;">×${item.quantity}</p>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #F0ECE6; vertical-align: top; text-align: right; white-space: nowrap;">
          <span style="font-family: 'Courier New', monospace; font-size: 14px; color: #2C2C2C;">
            ${fmtPrice(item.unitPrice * item.quantity, item.currency)}
          </span>
        </td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin: 0; padding: 0; background: #FAF8F5; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #FAF8F5; padding: 32px 24px;">
    <!-- Logo -->
    <p style="font-size: 22px; font-weight: 300; letter-spacing: 0.08em; color: #2C2C2C; margin: 0 0 4px;">
      Counter Cultures
    </p>
    <p style="font-size: 10px; letter-spacing: 0.2em; color: #B87333; text-transform: uppercase; margin: 0 0 24px;">
      San Miguel de Allende, MX
    </p>

    ${
      heroImg
        ? `<!-- Hero image -->
    <div style="margin-bottom: 24px;">
      <img src="${escapeHtml(heroImg)}" alt="" width="100%" style="display: block; max-height: 300px; object-fit: cover;" />
    </div>`
        : ""
    }

    <p style="font-size: 16px; color: #2C2C2C; margin: 0 0 24px;">
      ${isEs ? "Tu selección de Counter Cultures" : "Your Counter Cultures selection"}
    </p>

    <!-- Items -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      ${itemRows}
    </table>

    <!-- Totals -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 16px;">
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #6B6B6B;">
          ${isEs ? "Subtotal" : "Subtotal"}
        </td>
        <td style="padding: 6px 0; text-align: right; font-family: 'Courier New', monospace; font-size: 14px; color: #2C2C2C;">
          ${fmtPrice(productSubtotal, p.currency)}
        </td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #6B6B6B;">IVA (16%)</td>
        <td style="padding: 6px 0; text-align: right; font-family: 'Courier New', monospace; font-size: 14px; color: #2C2C2C;">
          ${fmtPrice(ivaAmount, p.currency)}
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 0;"><hr style="border: none; border-top: 1px solid #B87333; margin: 8px 0;" /></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 16px; color: #2C2C2C; font-weight: 400;">${isEs ? "Total (IVA incluido)" : "Total (IVA included)"}</td>
        <td style="padding: 8px 0; text-align: right; font-family: 'Courier New', monospace; font-size: 20px; color: #2C2C2C;">
          ${fmtPrice(total, p.currency)}
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="margin: 32px 0; text-align: center;">
      <a href="${escapeHtml(p.shareUrl)}" style="display: inline-block; padding: 14px 32px; background: #B87333; color: #ffffff; text-decoration: none; font-size: 14px; letter-spacing: 0.05em;">
        ${isEs ? "Continúa tu selección en Counter Cultures" : "Continue your selection at Counter Cultures"}
      </a>
    </div>

    <!-- Footer -->
    <hr style="border: none; border-top: 1px solid #E5E0DB; margin: 32px 0;" />
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 12px; color: #999; line-height: 1.6;">
          <a href="https://wa.me/+524151548375" style="color: #B87333; text-decoration: none;">WhatsApp</a> ·
          Calle San Juan #11-A, Col. Providencia, San Miguel de Allende ·
          <a href="${escapeHtml(p.shareUrl.split("/cart")[0] || "")}/account/sign-in" style="color: #B87333; text-decoration: none;">
            ${isEs ? "Iniciar sesión" : "Sign in"}
          </a>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
};

const buildPlainText = (p: SharePayload): string => {
  const isEs = p.locale === "es";
  const { iva: ivaAmount, subtotal: productSubtotal, total } = computeIva(p.subtotal, "MX");

  const lines = p.items.map(
    (i) =>
      `· ${i.name} (${i.brand})${i.selectedFinish ? ` — ${i.selectedFinish}` : ""} ×${i.quantity} — ${fmtPrice(i.unitPrice * i.quantity, i.currency)}`
  );

  return [
    "Counter Cultures · San Miguel de Allende, MX",
    "",
    isEs ? "Tu selección:" : "Your selection:",
    "",
    ...lines,
    "",
    `Subtotal: ${fmtPrice(productSubtotal, p.currency)}`,
    `IVA (16%): ${fmtPrice(ivaAmount, p.currency)}`,
    `${isEs ? "Total (IVA incluido)" : "Total (IVA included)"}: ${fmtPrice(total, p.currency)}`,
    "",
    isEs ? "Continúa tu selección:" : "Continue your selection:",
    p.shareUrl,
    "",
    "WhatsApp: +52 415 154 8375",
  ].join("\n");
};

export const POST = async (req: Request) => {
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Email not configured" },
        { status: 503 }
      );
    }

    const payload: SharePayload = await req.json();
    if (!payload.to || !payload.items?.length) {
      return NextResponse.json(
        { error: "to and items required" },
        { status: 400 }
      );
    }

    const resend = new Resend(key);
    const subject =
      payload.locale === "es"
        ? "Tu selección de Counter Cultures"
        : "Your Counter Cultures selection";

    const { error } = await resend.emails.send({
      from: FROM,
      to: redirectRecipient(payload.to),
      subject,
      html: buildHtml(payload),
      text: buildPlainText(payload),
    });

    if (error) {
      console.error("[cart/share] Resend API error:", {
        recipient: payload.to,
        code: error.name,
        message: error.message,
      });
      return NextResponse.json(
        { ok: false, error: "Email delivery failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cart/share]", err);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
};
