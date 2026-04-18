/**
 * POST /api/gmail/create-lead-from-email
 *
 * Body: { messageId: string, threadId?: string }
 *
 * Thin wrapper over `createLeadFromMessage` (in app/lib/gmail-create-lead.ts).
 * The bulk endpoint also calls that helper directly.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createLeadFromMessage } from "@/app/lib/gmail-create-lead";

export const POST = async (request: NextRequest) => {
  try {
    const { messageId, threadId } = (await request.json()) as {
      messageId?: string;
      threadId?: string;
    };
    if (!messageId) {
      return NextResponse.json({ error: "messageId required" }, { status: 400 });
    }
    const result = await createLeadFromMessage(messageId, threadId);
    return NextResponse.json({
      leadId: result.leadId,
      matchedBrandSlugs: result.matchedBrandSlugs,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "create_failed";
    console.error("[create-lead-from-email]", msg);
    const status = msg === "Gmail not connected" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
