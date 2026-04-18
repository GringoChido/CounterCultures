/**
 * GET /api/deals/[id]/thread
 *
 * Returns the Gmail thread(s) linked to a Pipeline deal. Looks up
 * Email_Activity rows with related_deal_id == [id] and deduplicates by
 * thread ID, then fetches a lightweight metadata view of each thread.
 * Drives the Thread-on-Deal panel.
 */

import { NextResponse, type NextRequest } from "next/server";
import { readSheet } from "@/app/lib/dashboard-sheets";
import { getGmailClient } from "@/app/lib/gmail";

interface EmailActivityRow extends Record<string, string> {
  activity_id: string;
  user_email: string;
  gmail_message_id: string;
  gmail_thread_id: string;
  direction: string;
  action: string;
  related_lead_id: string;
  related_deal_id: string;
  sender_email: string;
  recipient_emails: string;
  subject: string;
  snippet: string;
  timestamp: string;
}

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const rows = await readSheet<EmailActivityRow>("Email_Activity");
    const linked = rows.filter((r) => r.related_deal_id === id);

    if (linked.length === 0) {
      return NextResponse.json({ threads: [] });
    }

    // Dedupe by thread id
    const threadIds = Array.from(new Set(linked.map((r) => r.gmail_thread_id).filter(Boolean)));

    const client = await getGmailClient();
    if (!client) {
      // Fall back to metadata from Email_Activity only
      return NextResponse.json({
        threads: threadIds.map((tid) => {
          const first = linked.find((r) => r.gmail_thread_id === tid)!;
          return {
            threadId: tid,
            subject: first.subject,
            snippet: first.snippet,
            senderEmail: first.sender_email,
            lastLinkedAt: linked
              .filter((r) => r.gmail_thread_id === tid)
              .map((r) => r.timestamp)
              .sort()
              .pop(),
            action: first.action,
            degraded: true,
          };
        }),
      });
    }

    const threads = [];
    for (const tid of threadIds) {
      try {
        const t = await client.gmail.users.threads.get({
          userId: "me",
          id: tid,
          format: "metadata",
          metadataHeaders: ["From", "Subject", "Date"],
        });
        const msgs = t.data.messages ?? [];
        const latest = msgs[msgs.length - 1];
        const h: Record<string, string> = {};
        for (const hd of latest?.payload?.headers ?? []) {
          if (hd.name) h[hd.name.toLowerCase()] = hd.value ?? "";
        }
        const fromMatch = (h.from || "").match(/^(.*?)\s*<([^>]+)>\s*$/);
        const fromName = fromMatch ? fromMatch[1].replace(/"/g, "").trim() : h.from;
        const fromEmail = fromMatch ? fromMatch[2].trim() : h.from;
        threads.push({
          threadId: tid,
          subject: h.subject || "(no subject)",
          snippet: latest?.snippet ?? "",
          from: fromName || fromEmail,
          fromEmail,
          date: latest?.internalDate
            ? new Date(Number(latest.internalDate)).toISOString()
            : "",
          messageCount: msgs.length,
        });
      } catch (err) {
        console.error(`[deals/thread] failed thread ${tid}:`, err);
      }
    }

    return NextResponse.json({ threads });
  } catch (err) {
    console.error("[deals/thread]", err);
    return NextResponse.json({ threads: [] });
  }
};
