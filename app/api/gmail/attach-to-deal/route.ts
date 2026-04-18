/**
 * POST /api/gmail/attach-to-deal
 *
 * Body: { messageId, threadId, dealId }
 *
 * Links a Gmail thread to an existing Pipeline deal by writing an
 * Email_Activity row with action=attached_to_deal and the related_deal_id.
 * The Thread-on-Deal panel reads these rows to surface the thread on the
 * deal's detail view. No Pipeline row update is required because we key
 * the lookup on Email_Activity.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getGmailClient } from "@/app/lib/gmail";
import { logEmailActivity } from "@/app/lib/email-activity";

const parseFrom = (raw: string): string => {
  if (!raw) return "";
  const m = raw.match(/<([^>]+)>/);
  return m ? m[1].trim() : raw.trim();
};

export const POST = async (request: NextRequest) => {
  try {
    const { messageId, threadId, dealId } = await request.json();
    if (!messageId || !threadId || !dealId) {
      return NextResponse.json(
        { error: "messageId, threadId, and dealId are required" },
        { status: 400 }
      );
    }

    const client = await getGmailClient();
    if (!client) {
      return NextResponse.json({ error: "Gmail not connected" }, { status: 409 });
    }

    const msg = await client.gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "metadata",
      metadataHeaders: ["From", "Subject"],
    });

    const headers: Record<string, string> = {};
    for (const h of msg.data.payload?.headers ?? []) {
      if (h.name) headers[h.name.toLowerCase()] = h.value ?? "";
    }
    const senderEmail = parseFrom(headers.from || "");
    const subject = headers.subject || "(no subject)";
    const snippet = (msg.data.snippet ?? "").slice(0, 200);

    await logEmailActivity({
      userEmail: client.gmailAddress,
      gmailMessageId: messageId,
      gmailThreadId: threadId,
      direction: "inbound",
      action: "attached_to_deal",
      relatedDealId: dealId,
      senderEmail,
      subject,
      snippet,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "attach_failed";
    console.error("[attach-to-deal]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
