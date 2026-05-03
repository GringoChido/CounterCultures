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
  image?: { caption?: string };
  document?: { caption?: string; filename?: string };
  audio?: { id?: string };
  video?: { caption?: string };
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
        statuses?: unknown[];
      };
    }>;
  }>;
}

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

      const messages = value.messages ?? [];
      const contacts = value.contacts ?? [];
      const nameByWaId = new Map<string, string>();
      for (const c of contacts) {
        if (c.wa_id && c.profile?.name) {
          nameByWaId.set(c.wa_id, c.profile.name);
        }
      }

      for (const m of messages) {
        try {
          const summary = summarizeMessage(m);
          const result = await createLeadFromWhatsApp({
            waMessageId: m.id,
            from: m.from,
            name: nameByWaId.get(m.from) ?? "",
            body: summary,
            timestamp: isoFromMetaTimestamp(m.timestamp),
          });
          results.push({
            waMessageId: m.id,
            leadId: result.leadId,
            created: result.created,
          });

          // Roger gets a heads-up on the first message from a new lead.
          // Subsequent messages for the same lead just append to notes,
          // no extra alert — avoids spamming Roger's phone for a chat.
          if (result.created) {
            const phone = m.from.startsWith("+") ? m.from : `+${m.from}`;
            const name = nameByWaId.get(m.from) ?? phone;
            const heading = `New WhatsApp lead — ${name}`;
            const body = `${name} (${phone}) just messaged on WhatsApp:\n\n"${summary.slice(0, 400)}"\n\nLead ${result.leadId} · /dashboard/leads`;
            await Promise.all([
              notifyRoger(heading, body).catch((err) =>
                console.error("[whatsapp-webhook] notifyRoger failed:", err)
              ),
              notifyWhatsApp(`📩 ${heading}\n${summary.slice(0, 200)}`).catch((err) =>
                console.error("[whatsapp-webhook] notifyWhatsApp failed:", err)
              ),
            ]);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(
            `[whatsapp-webhook] failed to process wa_msg=${m.id}:`,
            msg
          );
          results.push({ waMessageId: m.id, error: msg });
        }
      }
    }
  }

  return NextResponse.json({ ok: true, processed: results });
};
