/**
 * Outbound send from the dashboard.
 *
 * Calls app/lib/whatsapp.ts (Meta Graph API), captures the wamid Meta
 * returns, and appends an outbound row to WhatsApp_Messages so the
 * thread shows the message immediately. Status transitions (delivered,
 * read, failed) flow back through the existing /api/webhooks/whatsapp
 * statuses path.
 *
 * When WHATSAPP_ENABLED=false (dev / missing creds), returns 503. The
 * UI surfaces this as "outbound disabled" rather than a broken send.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  isWhatsAppEnabled,
  sendWhatsAppFreeText,
} from "@/app/lib/whatsapp";
import { appendRowByHeader } from "@/app/lib/dashboard-sheets";

interface SendBody {
  toWaId?: string;
  body?: string;
}

export const POST = async (req: NextRequest): Promise<Response> => {
  const json = (await req.json().catch(() => ({}))) as SendBody;
  const toWaId = (json.toWaId ?? "").trim();
  const body = (json.body ?? "").trim();

  if (!toWaId || !body) {
    return NextResponse.json(
      { error: "toWaId and body are required" },
      { status: 400 }
    );
  }

  if (!isWhatsAppEnabled()) {
    return NextResponse.json(
      {
        error:
          "WhatsApp outbound is disabled. Set WHATSAPP_ENABLED=true and configure WHATSAPP_API_TOKEN + WHATSAPP_PHONE_ID.",
      },
      { status: 503 }
    );
  }

  // Meta expects no leading "+" on the wa_id when posting messages.
  const to = toWaId.startsWith("+") ? toWaId.slice(1) : toWaId;
  const result = await sendWhatsAppFreeText(to, body);

  if (result.status === "failed" || !result.messageId) {
    return NextResponse.json(
      { error: result.error ?? "send failed" },
      { status: 502 }
    );
  }

  const nowIso = new Date().toISOString();
  const messageId = result.messageId;
  const phoneNumberId = process.env.WHATSAPP_PHONE_ID ?? "";

  const fields: Record<string, string> = {
    message_id: messageId,
    wa_id: to,
    contact_name: "",
    direction: "outbound",
    type: "text",
    body,
    media_id: "",
    status: "sent",
    template_name: "",
    phone_number_id: phoneNumberId,
    created_at: nowIso,
    updated_at: nowIso,
    linked_lead_id: "",
    error: "",
  };

  try {
    await appendRowByHeader("WhatsApp_Messages", fields);
  } catch (err) {
    console.error(
      "[whatsapp-send] persist outbound failed:",
      err instanceof Error ? err.message : err
    );
  }

  return NextResponse.json({ message: fields });
};
