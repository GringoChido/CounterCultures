/**
 * POST /api/gmail/threads/bulk
 *
 * Body: {
 *   threadIds: string[];
 *   action: 'archive' | 'add_label' | 'create_lead';
 *   labelId?: string; // required for add_label
 * }
 *
 * Iterates serially over threadIds (Gmail API has per-second quotas; we
 * keep things simple). Returns per-thread { ok, error?, leadId? } so the
 * client can show partial successes.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getGmailClient, modifyThreadLabels } from "@/app/lib/gmail";
import { createLeadFromMessage } from "@/app/lib/gmail-create-lead";

interface BulkResultRow {
  threadId: string;
  ok: boolean;
  error?: string;
  leadId?: string;
}

export const POST = async (request: NextRequest) => {
  try {
    const { threadIds, action, labelId } = (await request.json()) as {
      threadIds?: string[];
      action?: "archive" | "add_label" | "create_lead";
      labelId?: string;
    };

    if (!Array.isArray(threadIds) || threadIds.length === 0) {
      return NextResponse.json(
        { error: "threadIds[] required" },
        { status: 400 }
      );
    }
    if (!action || !["archive", "add_label", "create_lead"].includes(action)) {
      return NextResponse.json(
        { error: "action must be archive | add_label | create_lead" },
        { status: 400 }
      );
    }
    if (action === "add_label" && !labelId) {
      return NextResponse.json(
        { error: "labelId required for add_label" },
        { status: 400 }
      );
    }
    // Soft cap so a runaway client can't hammer Gmail
    if (threadIds.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 threads per bulk action" },
        { status: 400 }
      );
    }

    const results: BulkResultRow[] = [];

    for (const threadId of threadIds) {
      try {
        if (action === "archive") {
          await modifyThreadLabels(threadId, { remove: ["INBOX"] });
          results.push({ threadId, ok: true });
        } else if (action === "add_label") {
          await modifyThreadLabels(threadId, { add: [labelId!] });
          results.push({ threadId, ok: true });
        } else {
          // create_lead — need the latest message in the thread
          const client = await getGmailClient();
          if (!client) throw new Error("Gmail not connected");
          const t = await client.gmail.users.threads.get({
            userId: "me",
            id: threadId,
            format: "metadata",
            metadataHeaders: ["From", "Subject"],
          });
          const msgs = t.data.messages ?? [];
          const latest = msgs[msgs.length - 1];
          if (!latest?.id) throw new Error("Thread has no messages");
          const created = await createLeadFromMessage(latest.id, threadId);
          results.push({ threadId, ok: true, leadId: created.leadId });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown_error";
        console.error(`[bulk ${action}] ${threadId}:`, msg);
        results.push({ threadId, ok: false, error: msg });
      }
    }

    const successCount = results.filter((r) => r.ok).length;
    return NextResponse.json({
      action,
      total: results.length,
      success: successCount,
      failed: results.length - successCount,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bulk_failed";
    console.error("[Gmail threads bulk]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
