/**
 * Share endpoint — powers <ShareButton />.
 *
 * POST: logs a share event to Activity_Log (audit) and, if medium = "email",
 * actually sends the email via Resend. For medium = "whatsapp" the client
 * opens the returned `wa.me` URL in a new tab — we only record here.
 *
 * No sample data: if Resend isn't configured, the email is skipped and the
 * Activity_Log row still lands. Every share is auditable regardless.
 */

import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { appendRow } from "@/app/lib/dashboard-sheets";
import type { EntityType } from "@/app/lib/notes";

const FROM = "Counter Cultures <noreply@countercultures.com.mx>";

let _resend: Resend | null = null;
const getResend = (): Resend | null => {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
};

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const waDigits = (raw: string): string => raw.replace(/\D/g, "");

interface ShareRequest {
  entityType: EntityType;
  entityId: string;
  recipient: {
    name: string;
    email?: string;
    whatsappPhone?: string;
  };
  medium: "whatsapp" | "email";
  summary: string;
  deepLink: string;
  authorEmail: string;
}

export const POST = async (request: NextRequest) => {
  try {
    const body = (await request.json()) as Partial<ShareRequest>;
    const {
      entityType,
      entityId,
      recipient,
      medium,
      summary,
      deepLink,
      authorEmail,
    } = body;

    if (
      !entityType ||
      !entityId ||
      !recipient?.name ||
      !medium ||
      !summary ||
      !deepLink
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let waUrl: string | null = null;

    if (medium === "whatsapp") {
      const digits = waDigits(recipient.whatsappPhone ?? "");
      if (!digits) {
        return NextResponse.json(
          { error: `${recipient.name} has no WhatsApp phone on file` },
          { status: 400 }
        );
      }
      const text = encodeURIComponent(`${summary}\n\n${deepLink}`);
      waUrl = `https://wa.me/${digits}?text=${text}`;
    }

    if (medium === "email") {
      if (!recipient.email) {
        return NextResponse.json(
          { error: `${recipient.name} has no email on file` },
          { status: 400 }
        );
      }
      const resend = getResend();
      if (resend) {
        await resend.emails.send({
          from: FROM,
          to: recipient.email,
          subject: `Shared with you: ${summary.split("\n")[0].slice(0, 80)}`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
              <p style="line-height: 1.7; color: #6B6B6B; font-size: 13px;">From ${escapeHtml(
                authorEmail || "the Counter Portal"
              )}</p>
              <div style="line-height: 1.7; color: #2C2C2C; white-space: pre-wrap;">${escapeHtml(
                summary
              )}</div>
              <p style="margin-top: 24px;">
                <a href="${escapeHtml(deepLink)}" style="display: inline-block; padding: 10px 16px; background: #B87333; color: #fff; text-decoration: none; border-radius: 8px;">Open in Counter Portal →</a>
              </p>
              <hr style="border: none; border-top: 1px solid #E5E0DB; margin: 32px 0;" />
              <p style="font-size: 12px; color: #999;">Counter Cultures · San Miguel de Allende, México</p>
            </div>
          `,
        });
      } else {
        console.warn("[Share] RESEND_API_KEY not configured — email skipped, audit row still written");
      }
    }

    // Audit trail — every share lands here regardless of medium
    const activityId = `SHR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await appendRow("Activity_Log", [
      activityId,
      "share",
      `Shared ${entityType} ${entityId} with ${recipient.name} via ${medium}: ${summary.split("\n")[0].slice(0, 120)}`,
      recipient.name,
      authorEmail || "",
      new Date().toISOString(),
      "", // contact_id
      entityType === "deal" ? entityId : "",
      "",
    ]);

    return NextResponse.json({ ok: true, waUrl });
  } catch (err) {
    console.error("[Share API] POST error:", err);
    return NextResponse.json({ error: "Failed to share" }, { status: 500 });
  }
};
