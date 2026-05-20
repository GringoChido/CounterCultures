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
  const fallback = STAGING_ALLOWLIST[0];
  console.info(
    `[projects/share] STAGING_EMAIL_REDIRECT active — recipient rewritten ` +
      `(original: ${to}, delivered: ${fallback})`
  );
  return fallback;
};

interface ShareItem {
  name: string;
  brand: string;
  sku: string;
  qty: number;
  unitPrice: number;
  currency: string;
  imageSrc?: string;
}

interface SharePayload {
  email: string;
  locale: "en" | "es";
  senderName?: string;
  note?: string;
  projectName: string;
  items: ShareItem[];
  subtotal: number;
  currency: string;
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
          <p style="margin: 2px 0 0; font-size: 12px; color: #6B6B6B;">${escapeHtml(item.brand)} · ${escapeHtml(item.sku)}</p>
          <p style="margin: 2px 0 0; font-size: 11px; color: #999;">×${item.qty}</p>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #F0ECE6; vertical-align: top; text-align: right; white-space: nowrap;">
          <span style="font-family: 'Courier New', monospace; font-size: 14px; color: #2C2C2C;">
            ${fmtPrice(item.unitPrice * item.qty, item.currency)}
          </span>
        </td>
      </tr>`
    )
    .join("");

  const noteBlock = p.note
    ? `<div style="margin: 16px 0; padding: 12px 16px; background: #F0ECE6; border-left: 3px solid #B87333;">
        <p style="margin: 0; font-size: 13px; color: #2C2C2C; font-style: italic;">"${escapeHtml(p.note)}"</p>
        ${p.senderName ? `<p style="margin: 4px 0 0; font-size: 12px; color: #6B6B6B;">— ${escapeHtml(p.senderName)}</p>` : ""}
      </div>`
    : "";

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
        ? `<div style="margin-bottom: 24px;">
      <img src="${escapeHtml(heroImg)}" alt="" width="100%" style="display: block; max-height: 300px; object-fit: cover;" />
    </div>`
        : ""
    }

    <p style="font-size: 16px; color: #2C2C2C; margin: 0 0 8px;">
      ${isEs ? "Proyecto compartido" : "Shared project"}: <strong>${escapeHtml(p.projectName)}</strong>
    </p>
    ${p.senderName ? `<p style="font-size: 13px; color: #6B6B6B; margin: 0 0 16px;">${isEs ? "Compartido por" : "Shared by"} ${escapeHtml(p.senderName)}</p>` : ""}

    ${noteBlock}

    <!-- Items -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      ${itemRows}
    </table>

    <!-- Totals -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 16px;">
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #6B6B6B;">Subtotal</td>
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

    <!-- Footer -->
    <hr style="border: none; border-top: 1px solid #E5E0DB; margin: 32px 0;" />
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 12px; color: #999; line-height: 1.6;">
          <a href="https://wa.me/+524151548375" style="color: #B87333; text-decoration: none;">WhatsApp</a> ·
          Calle San Juan #11-A, Col. Providencia, San Miguel de Allende
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
      `· ${i.name} (${i.brand}) · ${i.sku} ×${i.qty} — ${fmtPrice(i.unitPrice * i.qty, i.currency)}`
  );

  return [
    "Counter Cultures · San Miguel de Allende, MX",
    "",
    `${isEs ? "Proyecto compartido" : "Shared project"}: ${p.projectName}`,
    ...(p.senderName ? [`${isEs ? "Compartido por" : "Shared by"} ${p.senderName}`] : []),
    ...(p.note ? ["", `"${p.note}"`] : []),
    "",
    ...lines,
    "",
    `Subtotal: ${fmtPrice(productSubtotal, p.currency)}`,
    `IVA (16%): ${fmtPrice(ivaAmount, p.currency)}`,
    `${isEs ? "Total (IVA incluido)" : "Total (IVA included)"}: ${fmtPrice(total, p.currency)}`,
    "",
    "WhatsApp: +52 415 154 8375",
  ].join("\n");
};

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Email not configured" },
        { status: 503 }
      );
    }

    const payload: SharePayload = await req.json();
    if (!payload.email || !payload.items?.length) {
      return NextResponse.json(
        { error: "email and items required" },
        { status: 400 }
      );
    }

    const resend = new Resend(key);
    const subject =
      payload.locale === "es"
        ? `Proyecto compartido: ${payload.projectName}`
        : `Shared project: ${payload.projectName}`;

    const { error } = await resend.emails.send({
      from: FROM,
      to: redirectRecipient(payload.email),
      subject,
      html: buildHtml(payload),
      text: buildPlainText(payload),
    });

    if (error) {
      console.error("[projects/share] Resend API error:", {
        projectId: id,
        recipient: payload.email,
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
    console.error("[projects/share]", err);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
};
