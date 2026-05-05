/**
 * Lists conversations grouped by wa_id from the WhatsApp_Messages sheet.
 *
 * Each row in the sheet is one message. A "conversation" is the bucket of
 * rows sharing the same wa_id. The list view needs a summary per bucket:
 * most recent message, unread count for the badge, total count for context.
 *
 * Caching is handled inside readSheet (60s TTL). Polling at 30s on the
 * client will see at most one cache miss per minute per process.
 */

import { NextResponse } from "next/server";
import { readSheet } from "@/app/lib/dashboard-sheets";
import { isWhatsAppEnabled } from "@/app/lib/whatsapp";

interface MessageRow extends Record<string, string> {
  message_id: string;
  wa_id: string;
  contact_name: string;
  direction: string;
  type: string;
  body: string;
  status: string;
  created_at: string;
  updated_at: string;
  linked_lead_id: string;
}

interface Conversation {
  waId: string;
  contactName: string;
  lastMessage: string;
  lastTimestamp: string;
  lastDirection: string;
  unreadCount: number;
  totalCount: number;
  linkedLeadId: string;
}

export const GET = async (): Promise<Response> => {
  const rows = await readSheet<MessageRow>("WhatsApp_Messages");

  const buckets = new Map<string, MessageRow[]>();
  for (const r of rows) {
    if (!r.wa_id) continue;
    const bucket = buckets.get(r.wa_id);
    if (bucket) bucket.push(r);
    else buckets.set(r.wa_id, [r]);
  }

  const conversations: Conversation[] = [];
  for (const [waId, msgs] of buckets) {
    const sorted = [...msgs].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const latest = sorted[sorted.length - 1];
    const contactName =
      [...sorted].reverse().find((m) => m.contact_name)?.contact_name ?? "";
    const linkedLeadId =
      [...sorted].reverse().find((m) => m.linked_lead_id)?.linked_lead_id ?? "";
    const unreadCount = sorted.filter(
      (m) => m.direction === "inbound" && m.status !== "read"
    ).length;
    conversations.push({
      waId,
      contactName,
      lastMessage: latest.body,
      lastTimestamp: latest.created_at,
      lastDirection: latest.direction,
      unreadCount,
      totalCount: sorted.length,
      linkedLeadId,
    });
  }

  conversations.sort((a, b) => b.lastTimestamp.localeCompare(a.lastTimestamp));

  return NextResponse.json({
    conversations,
    outboundEnabled: isWhatsAppEnabled(),
  });
};
