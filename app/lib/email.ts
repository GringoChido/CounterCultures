import { Resend } from "resend";

let _resend: Resend | null = null;
const getResend = () => {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.log("[Email] RESEND_API_KEY not configured — emails will be skipped");
      return null;
    }
    _resend = new Resend(key);
  }
  return _resend;
};

const FROM = "Counter Cultures <noreply@countercultures.com.mx>";
const ROGER_EMAIL = process.env.NOTIFY_EMAIL || "roger@countercultures.com.mx";
const WHATSAPP_NUMBER = process.env.WHATSAPP_NOTIFY_NUMBER || "";

// --- Internal notification to Roger via WhatsApp API ---

export const notifyWhatsApp = async (message: string): Promise<void> => {
  const token = process.env.WHATSAPP_API_TOKEN;
  if (!token || !WHATSAPP_NUMBER) {
    console.log("[WhatsApp] Not configured — skipping:", message);
    return;
  }

  try {
    await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: WHATSAPP_NUMBER,
          type: "text",
          text: { body: message },
        }),
      }
    );
  } catch (err) {
    console.error("[WhatsApp] Failed to send:", err);
  }
};

// --- Contact form confirmation ---

export const sendContactConfirmation = async (to: string, name: string): Promise<void> => {
  await getResend()?.emails.send({
    from: FROM,
    to,
    subject: "We received your message — Counter Cultures",
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
        <h2 style="font-weight: 400; letter-spacing: 0.05em;">Thank you, ${name}</h2>
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
    to,
    subject: "Trade Application Received — Counter Cultures",
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
        <h2 style="font-weight: 400; letter-spacing: 0.05em;">Welcome, ${name}</h2>
        <p style="line-height: 1.7; color: #6B6B6B;">
          We've received the trade application for <strong>${company}</strong>. Our team reviews applications within 48 hours.
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
    to,
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
    to,
    subject: "Showroom Visit Confirmed — Counter Cultures",
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
        <h2 style="font-weight: 400; letter-spacing: 0.05em;">See you soon, ${name}</h2>
        <p style="line-height: 1.7; color: #6B6B6B;">
          Your showroom visit is confirmed:
        </p>
        <div style="background: #F5F0EB; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #2C2C2C;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 8px 0 0; color: #2C2C2C;"><strong>Time:</strong> ${time}</p>
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
    to,
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
    to: ROGER_EMAIL,
    subject,
    html: `
      <div style="font-family: monospace; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
        <pre style="white-space: pre-wrap; line-height: 1.6;">${body}</pre>
      </div>
    `,
  });
};
