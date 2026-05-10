import { NextResponse, type NextRequest } from "next/server";
import { appendMessage } from "@/app/lib/conversation-log";
import { findActiveDealByEmail } from "@/app/lib/deal-lookup";
import { appendRow } from "@/app/lib/dashboard-sheets";

interface ResendInboundPayload {
  type: "email.received";
  data: {
    from: string;
    to: string[];
    subject: string;
    text?: string;
    html?: string;
    headers?: Array<{ name: string; value: string }>;
    attachments?: Array<{ filename: string; content_type: string }>;
    created_at: string;
  };
}

export async function POST(req: NextRequest): Promise<Response> {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const svixId = req.headers.get("svix-id");
    const svixSignature = req.headers.get("svix-signature");
    if (!svixId || !svixSignature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
  }

  let payload: ResendInboundPayload;
  try {
    payload = (await req.json()) as ResendInboundPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.type !== "email.received") {
    return NextResponse.json({ ok: true, ignored: "not email.received" });
  }

  const { from, subject, text } = payload.data;
  if (!from) {
    return NextResponse.json({ ok: true, ignored: "no sender" });
  }

  const senderEmail = extractEmail(from);
  const dealId = await findActiveDealByEmail(senderEmail);

  if (dealId) {
    await appendMessage({
      deal_id: dealId,
      customer_email: senderEmail,
      direction: "inbound",
      channel: "email",
      locale: "es",
      subject,
      body_snippet: (text ?? "").slice(0, 200),
      status: "delivered",
    });
  }

  const now = new Date().toISOString();
  await appendRow("Activity_Log", [
    `LOG-${Date.now()}`,
    "system",
    "Email Inbound",
    "email_received",
    `From: ${senderEmail} | Subject: ${subject} | Deal: ${dealId ?? "none"}`,
    now,
  ]);

  return NextResponse.json({ ok: true, dealId: dealId ?? null });
}

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).toLowerCase().trim();
}
