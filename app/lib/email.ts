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

// Staging guardrail: when STAGING_EMAIL_REDIRECT is set, only allowlisted
// recipients receive emails. Others are rewritten to the first address on the
// list. Supports comma-separated allowlist (e.g. "admin@x.com,roger@x.com").
// Unset = production mode (recipients flow through as-is).
const STAGING_EMAIL_REDIRECT = process.env.STAGING_EMAIL_REDIRECT;
const STAGING_ALLOWLIST = STAGING_EMAIL_REDIRECT
  ? STAGING_EMAIL_REDIRECT.split(",").map((e) => e.trim().toLowerCase())
  : [];

const redirectRecipient = (to: string): string => {
  if (!STAGING_ALLOWLIST.length) return to;
  if (STAGING_ALLOWLIST.includes(to.toLowerCase())) return to;
  const fallback = STAGING_ALLOWLIST[0];
  console.info(
    `[Email] STAGING_EMAIL_REDIRECT active — recipient rewritten ` +
      `(original: ${to}, delivered: ${fallback})`
  );
  return fallback;
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

// --- Trade welcome (on approval) ---

export const sendTradeWelcomeEmail = async (
  to: string,
  name: string,
  company: string,
  welcomeCode: string
): Promise<void> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://countercultures.netlify.app";
  await getResend()?.emails.send({
    from: FROM,
    to: redirectRecipient(to),
    subject: "Welcome to the Trade Program — Counter Cultures",
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
        <h2 style="font-weight: 400; letter-spacing: 0.05em;">Welcome to the Trade Program</h2>
        <p style="line-height: 1.7; color: #6B6B6B;">
          ${escapeHtml(name || "Hello")}, your trade application for <strong>${escapeHtml(company)}</strong> has been approved.
        </p>
        <p style="line-height: 1.7; color: #6B6B6B;">
          Your trade pricing is now active. Sign in to see exclusive trade pricing on every product page.
        </p>
        <div style="background: #F5F0EB; padding: 20px; border-radius: 4px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #6B6B6B;">Your welcome code (one-time use):</p>
          <p style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.15em; color: #B87333;">${escapeHtml(welcomeCode)}</p>
        </div>
        <a href="${baseUrl}/account/sign-in" style="display: inline-block; background: #B87333; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-size: 14px; font-weight: 600; letter-spacing: 0.04em;">Sign In to Your Account</a>
        <hr style="border: none; border-top: 1px solid #E5E0DB; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">Counter Cultures · San Miguel de Allende, México</p>
      </div>
    `,
  });
};

// --- Trade decline (on rejection) ---

export const sendTradeDeclineEmail = async (
  to: string,
  name: string,
  notes?: string
): Promise<void> => {
  const reasonBlock = notes
    ? `<p style="line-height: 1.7; color: #6B6B6B;">Our team noted: <em>${escapeHtml(notes)}</em></p>`
    : "";
  await getResend()?.emails.send({
    from: FROM,
    to: redirectRecipient(to),
    subject: "Trade Application Update — Counter Cultures",
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
        <h2 style="font-weight: 400; letter-spacing: 0.05em;">Trade Application Update</h2>
        <p style="line-height: 1.7; color: #6B6B6B;">
          ${escapeHtml(name || "Hello")}, thank you for your interest in the Counter Cultures Trade Program.
        </p>
        <p style="line-height: 1.7; color: #6B6B6B;">
          After reviewing your application, we weren't able to extend trade pricing at this time.
        </p>
        ${reasonBlock}
        <p style="line-height: 1.7; color: #6B6B6B;">
          If your circumstances change or you have additional information to share, we welcome you to reapply.
          You can also reach us directly by replying to this email.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E0DB; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">Counter Cultures · San Miguel de Allende, México</p>
      </div>
    `,
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
