/**
 * Meta WhatsApp Cloud API webhook (R4 Note 1).
 *
 * GET  — verification handshake. Meta hits this with hub.mode=subscribe,
 *        hub.verify_token, hub.challenge. We echo back the challenge
 *        when the verify token matches WHATSAPP_WEBHOOK_VERIFY_TOKEN.
 * POST — message ingestion. Meta posts a notification payload for every
 *        inbound message (and other events). We only act on `messages`
 *        entries for now — status/delivery callbacks are acknowledged
 *        with 200 but otherwise ignored.
 *
 * Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */

import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createLeadFromWhatsApp } from "@/app/lib/whatsapp-create-lead";
import { notifyRoger, notifyWhatsApp } from "@/app/lib/email";
import {
  appendRowByHeader,
  findRowIndex,
  updateRowByHeader,
} from "@/app/lib/dashboard-sheets";
import { appendMessage } from "@/app/lib/conversation-log";
import { findActiveDealByPhone } from "@/app/lib/deal-lookup";

interface MetaContact {
  wa_id: string;
  profile?: { name?: string };
}

interface MetaTextMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body?: string };
  image?: { id?: string; caption?: string };
  document?: { id?: string; caption?: string; filename?: string };
  audio?: { id?: string };
  video?: { id?: string; caption?: string };
}

interface MetaStatusError {
  code?: number;
  title?: string;
  message?: string;
  error_data?: { details?: string };
}

interface MetaStatus {
  id: string;
  status: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: MetaStatusError[];
}

interface MetaWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: MetaContact[];
        messages?: MetaTextMessage[];
        statuses?: MetaStatus[];
      };
    }>;
  }>;
}

const getMediaId = (m: MetaTextMessage): string => {
  if (m.type === "image") return m.image?.id ?? "";
  if (m.type === "document") return m.document?.id ?? "";
  if (m.type === "audio") return m.audio?.id ?? "";
  if (m.type === "video") return m.video?.id ?? "";
  return "";
};

interface PersistInboundInput {
  m: MetaTextMessage;
  contactName: string;
  body: string;
  phoneNumberId: string;
  linkedLeadId: string;
}

const persistInboundMessage = async (input: PersistInboundInput): Promise<void> => {
  const { m, contactName, body, phoneNumberId, linkedLeadId } = input;
  try {
    const existing = await findRowIndex("WhatsApp_Messages", "message_id", m.id);
    if (existing !== null) return;
    const nowIso = new Date().toISOString();
    await appendRowByHeader("WhatsApp_Messages", {
      message_id: m.id,
      wa_id: m.from,
      contact_name: contactName,
      direction: "inbound",
      type: m.type,
      body,
      media_id: getMediaId(m),
      status: "received",
      template_name: "",
      phone_number_id: phoneNumberId,
      created_at: isoFromMetaTimestamp(m.timestamp),
      updated_at: nowIso,
      linked_lead_id: linkedLeadId,
      error: "",
    });
  } catch (err) {
    console.error(
      `[whatsapp-webhook] persist inbound failed wa_msg=${m.id}:`,
      err instanceof Error ? err.message : err
    );
  }
};

const processStatusUpdate = async (s: MetaStatus): Promise<void> => {
  try {
    const idx = await findRowIndex("WhatsApp_Messages", "message_id", s.id);
    if (idx === null) return;
    const errMessage = s.errors?.[0]?.message ?? s.errors?.[0]?.error_data?.details ?? "";
    await updateRowByHeader("WhatsApp_Messages", idx, {
      status: s.status,
      updated_at: new Date().toISOString(),
      error: s.status === "failed" ? errMessage : "",
    });
  } catch (err) {
    console.error(
      `[whatsapp-webhook] status update failed wa_msg=${s.id}:`,
      err instanceof Error ? err.message : err
    );
  }
};


const summarizeMessage = (m: MetaTextMessage): string => {
  if (m.type === "text" && m.text?.body) return m.text.body;
  if (m.type === "image") return `📷 Image${m.image?.caption ? `: ${m.image.caption}` : ""}`;
  if (m.type === "document")
    return `📎 Document${m.document?.filename ? `: ${m.document.filename}` : ""}${m.document?.caption ? ` — ${m.document.caption}` : ""}`;
  if (m.type === "audio") return "🎙️ Audio message";
  if (m.type === "video") return `🎥 Video${m.video?.caption ? `: ${m.video.caption}` : ""}`;
  return `[${m.type} message]`;
};

const isoFromMetaTimestamp = (raw: string): string => {
  const seconds = parseInt(raw, 10);
  if (!Number.isFinite(seconds)) return new Date().toISOString();
  return new Date(seconds * 1000).toISOString();
};

// ──────────────────────────────────────────────────────────────────────
// GET — Meta verification handshake
// ──────────────────────────────────────────────────────────────────────

export const GET = (request: NextRequest): Response => {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!expected) {
    console.warn(
      "[whatsapp-webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN not set — rejecting verification"
    );
    return new Response("verify_token not configured", { status: 500 });
  }
  if (mode === "subscribe" && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("verification failed", { status: 403 });
};

// ──────────────────────────────────────────────────────────────────────
// HMAC signature validation
// ──────────────────────────────────────────────────────────────────────

/**
 * Meta signs webhook payloads with HMAC-SHA256 keyed by the App Secret
 * and ships the digest in `X-Hub-Signature-256: sha256=<hex>`. Verifying
 * this is the only thing standing between the Leads sheet and any
 * unauthenticated POST that knows the webhook URL.
 *
 * If WHATSAPP_APP_SECRET is unset (dev / local), validation is bypassed
 * and a warning is logged once per process — production must set it.
 */
const verifySignature = (rawBody: string, signatureHeader: string | null): boolean => {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    console.warn(
      "[whatsapp-webhook] WHATSAPP_APP_SECRET not set — accepting unsigned payloads (dev only)"
    );
    return true;
  }
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  if (expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
  } catch {
    return false;
  }
};

// ──────────────────────────────────────────────────────────────────────
// POST — message ingestion
// ──────────────────────────────────────────────────────────────────────

export const POST = async (request: NextRequest): Promise<Response> => {
  // Read raw body once — needed for HMAC verification AND parsing.
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 403 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(raw) as MetaWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  // Meta retries for non-2xx responses, so we eat individual processing
  // errors and always 200 unless the request shape itself is invalid.
  // Per-entry failures are logged for follow-up.
  if (payload.object !== "whatsapp_business_account") {
    return NextResponse.json({ ok: true, ignored: "non-whatsapp object" });
  }

  const results: Array<{
    waMessageId: string;
    leadId?: string;
    created?: boolean;
    error?: string;
  }> = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      const value = change.value;
      if (!value) continue;

      const phoneNumberId = value.metadata?.phone_number_id ?? "";
      const messages = value.messages ?? [];
      const contacts = value.contacts ?? [];
      const statuses = value.statuses ?? [];
      const nameByWaId = new Map<string, string>();
      for (const c of contacts) {
        if (c.wa_id && c.profile?.name) {
          nameByWaId.set(c.wa_id, c.profile.name);
        }
      }

      for (const m of messages) {
        const contactName = nameByWaId.get(m.from) ?? "";
        const summary = summarizeMessage(m);
        let leadId = "";
        let leadCreated = false;
        try {
          const result = await createLeadFromWhatsApp({
            waMessageId: m.id,
            from: m.from,
            name: contactName,
            body: summary,
            timestamp: isoFromMetaTimestamp(m.timestamp),
          });
          leadId = result.leadId;
          leadCreated = result.created;
          results.push({
            waMessageId: m.id,
            leadId: result.leadId,
            created: result.created,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(
            `[whatsapp-webhook] failed to process wa_msg=${m.id}:`,
            msg
          );
          results.push({ waMessageId: m.id, error: msg });
        }

        // Persistence is additive: log the message regardless of whether
        // lead creation succeeded so /dashboard/whatsapp always reflects
        // reality. Errors are swallowed inside the helper.
        await persistInboundMessage({
          m,
          contactName,
          body: summary,
          phoneNumberId,
          linkedLeadId: leadId,
        });

        // Route to Conversation_Log if this phone matches an active deal
        try {
          const dealId = await findActiveDealByPhone(m.from);
          if (dealId) {
            await appendMessage({
              deal_id: dealId,
              customer_email: "",
              direction: "inbound",
              channel: "whatsapp",
              locale: "es",
              body_snippet: summary,
              status: "delivered",
              external_id: m.id,
            });
          }
        } catch {
          // Non-blocking
        }

        // Roger gets a heads-up on the first message from a new lead.
        // Subsequent messages for the same lead just append to notes,
        // no extra alert — avoids spamming Roger's phone for a chat.
        if (leadCreated) {
          const phone = m.from.startsWith("+") ? m.from : `+${m.from}`;
          const name = contactName || phone;
          const heading = `New WhatsApp lead — ${name}`;
          const body = `${name} (${phone}) just messaged on WhatsApp:\n\n"${summary.slice(0, 400)}"\n\nLead ${leadId} · /dashboard/leads`;
          await Promise.all([
            notifyRoger(heading, body).catch((err) =>
              console.error("[whatsapp-webhook] notifyRoger failed:", err)
            ),
            notifyWhatsApp(`📩 ${heading}\n${summary.slice(0, 200)}`).catch((err) =>
              console.error("[whatsapp-webhook] notifyWhatsApp failed:", err)
            ),
          ]);
        }
      }

      // Outbound delivery + read receipts. Each status entry references
      // a wamid we already wrote on send; we look up by message_id and
      // bump status + updated_at. Per-status errors stay in the helper.
      for (const s of statuses) {
        await processStatusUpdate(s);
      }
    }
  }

  return NextResponse.json({ ok: true, processed: results });
};
