import { Resend } from "resend";

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

let _resend: Resend | null = null;
const getResend = () => {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn("[Email] RESEND_API_KEY not configured — emails will be skipped");
      return null;
    }
    _resend = new Resend(key);
  }
  return _resend;
};

// Resend sender: env-driven so we can swap between sandbox and a verified
// Counter Cultures domain without touching code. Display name stays
// "Counter Cultures" — only the @-domain changes.
// Phase 1 (staging) — `RESEND_FROM_TRANSACTIONAL=onboarding@resend.dev` (sandbox).
// Phase 2 (cutover) — flip to a verified Counter-Cultures sender at Resend.
const FROM_ADDRESS = process.env.RESEND_FROM_TRANSACTIONAL || "onboarding@resend.dev";
const FROM = `Counter Cultures <${FROM_ADDRESS}>`;
const ROGER_EMAIL = process.env.NOTIFY_EMAIL || "roger@countercultures.com.mx";
const WHATSAPP_NUMBER = process.env.WHATSAPP_NOTIFY_NUMBER || "";

// Staging guardrail: when STAGING_EMAIL_REDIRECT is set, every email
// recipient gets rewritten to that address before send. Unset = production
// mode (recipients flow through as-is). Removed at Phase 2 cutover once a
// verified Counter Cultures sender domain is live and any-recipient sending
// is allowed by Resend.
const STAGING_EMAIL_REDIRECT = process.env.STAGING_EMAIL_REDIRECT;

const redirectRecipient = (to: string): string => {
  if (!STAGING_EMAIL_REDIRECT) return to;
  if (to === STAGING_EMAIL_REDIRECT) return to;
  console.info(
    `[Email] STAGING_EMAIL_REDIRECT active — recipient rewritten ` +
      `(original: ${to}, delivered: ${STAGING_EMAIL_REDIRECT})`
  );
  return STAGING_EMAIL_REDIRECT;
};

// --- Internal notification to Roger via WhatsApp API ---
//
// W8: delegates to the whatsapp.ts module so the WHATSAPP_ENABLED flag
// gates every send (dry-run vs. live). Free-text is only for internal
// use — customer-facing comms go through sendWhatsAppTemplate.
import { sendWhatsAppFreeText } from "./whatsapp";

export const notifyWhatsApp = async (message: string): Promise<void> => {
  if (!WHATSAPP_NUMBER) {
    console.warn("[WhatsApp] WHATSAPP_NOTIFY_NUMBER not set — skipping");
    return;
  }
  const result = await sendWhatsAppFreeText(WHATSAPP_NUMBER, message);
  if (result.status === "failed") {
    console.error("[WhatsApp] Failed to send:", result.error);
  }
};

// --- Contact form confirmation ---

export const sendContactConfirmation = async (to: string, name: string): Promise<void> => {
  await getResend()?.emails.send({
    from: FROM,
    to: redirectRecipient(to),
    subject: "We received your message — Counter Cultures",
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
        <h2 style="font-weight: 400; letter-spacing: 0.05em;">Thank you, ${escapeHtml(name)}</h2>
        <p style="line-height: 1.7; color: #6B6B6B;">
          We've received your message and will get back to you within 2 business hours during showroom hours (Mon–Fri, 10:00–18:00 CST).
        </p>
        <p style="line-height: 1.7; color: #6B6B6B;">
          If you need immediate assistance, message us on
          <a href="https://wa.me/+524151234567" style="color: #B87333;">WhatsApp</a>.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E0DB; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">Counter Cultures · San Miguel de Allende, México</p>
      </div>
    `,
  });
};

// --- Trade application confirmation ---

export const sendTradeConfirmation = async (to: string, name: string, company: string): Promise<void> => {
  await getResend()?.emails.send({
    from: FROM,
    to: redirectRecipient(to),
    subject: "Trade Application Received — Counter Cultures",
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
        <h2 style="font-weight: 400; letter-spacing: 0.05em;">Welcome, ${escapeHtml(name)}</h2>
        <p style="line-height: 1.7; color: #6B6B6B;">
          We've received the trade application for <strong>${escapeHtml(company)}</strong>. Our team reviews applications within 48 hours.
        </p>
        <p style="line-height: 1.7; color: #6B6B6B;">
          Once approved, you'll receive your trade credentials with access to exclusive pricing, specification sheets, and your dedicated account manager.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E0DB; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">Counter Cultures · San Miguel de Allende, México</p>
      </div>
    `,
  });
};

// --- Newsletter welcome ---

export const sendNewsletterWelcome = async (to: string): Promise<void> => {
  await getResend()?.emails.send({
    from: FROM,
    to: redirectRecipient(to),
    subject: "Welcome to Counter Cultures",
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
        <h2 style="font-weight: 400; letter-spacing: 0.05em;">You're in.</h2>
        <p style="line-height: 1.7; color: #6B6B6B;">
          Expect monthly design inspiration, new arrivals, and artisan spotlights — never spam.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E0DB; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">Counter Cultures · San Miguel de Allende, México</p>
      </div>
    `,
  });
};

// --- Showroom booking confirmation ---

export const sendBookingConfirmation = async (
  to: string,
  name: string,
  date: string,
  time: string
): Promise<void> => {
  await getResend()?.emails.send({
    from: FROM,
    to: redirectRecipient(to),
    subject: "Showroom Visit Confirmed — Counter Cultures",
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
        <h2 style="font-weight: 400; letter-spacing: 0.05em;">See you soon, ${escapeHtml(name)}</h2>
        <p style="line-height: 1.7; color: #6B6B6B;">
          Your showroom visit is confirmed:
        </p>
        <div style="background: #F5F0EB; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #2C2C2C;"><strong>Date:</strong> ${escapeHtml(date)}</p>
          <p style="margin: 8px 0 0; color: #2C2C2C;"><strong>Time:</strong> ${escapeHtml(time)}</p>
          <p style="margin: 8px 0 0; color: #2C2C2C;"><strong>Location:</strong> Providencia, San Miguel de Allende</p>
        </div>
        <p style="line-height: 1.7; color: #6B6B6B;">
          Need to reschedule? Reply to this email or message us on
          <a href="https://wa.me/+524151234567" style="color: #B87333;">WhatsApp</a>.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E0DB; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">Counter Cultures · San Miguel de Allende, México</p>
      </div>
    `,
  });
};

// --- Send document to customer ---

export const sendDocument = async (
  to: string,
  subject: string,
  htmlBody: string,
  pdfBuffer: Buffer,
  fileName: string
): Promise<void> => {
  await getResend()?.emails.send({
    from: FROM,
    to: redirectRecipient(to),
    subject,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
        ${htmlBody}
        <hr style="border: none; border-top: 1px solid #E5E0DB; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">Counter Cultures · Providencia, San Miguel de Allende, México</p>
      </div>
    `,
    attachments: [
      {
        filename: fileName,
        content: pdfBuffer.toString("base64"),
      },
    ],
  });
};

// --- Internal notification to Roger ---

export const notifyRoger = async (subject: string, body: string): Promise<void> => {
  await getResend()?.emails.send({
    from: FROM,
    to: redirectRecipient(ROGER_EMAIL),
    subject,
    html: `
      <div style="font-family: monospace; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
        <pre style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(body)}</pre>
      </div>
    `,
  });
};
