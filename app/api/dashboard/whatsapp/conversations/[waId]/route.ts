/**
 * Thread view + mark-read for a single WhatsApp conversation.
 *
 * GET   — returns the message log for the given wa_id, oldest first
 *         (chat-render order). Each row is the full sheet row so the UI
 *         can render delivery ticks, error notes, etc.
 * PATCH — body { action: "mark_read" } flips every unread inbound row
 *         to status=read. There's no Meta-side "thread read" op; this is
 *         a local-only signal that drives the unread badge.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  readSheet,
  updateRowByHeader,
} from "@/app/lib/dashboard-sheets";

interface MessageRow extends Record<string, string> {
  message_id: string;
  wa_id: string;
  contact_name: string;
  direction: string;
  type: string;
  body: string;
  media_id: string;
  status: string;
  template_name: string;
  phone_number_id: string;
  created_at: string;
  updated_at: string;
  linked_lead_id: string;
  error: string;
}

interface RouteContext {
  params: Promise<{ waId: string }>;
}

export const GET = async (
  _req: NextRequest,
  ctx: RouteContext
): Promise<Response> => {
  const { waId } = await ctx.params;
  const rows = await readSheet<MessageRow>("WhatsApp_Messages");
  const messages = rows
    .filter((r) => r.wa_id === waId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  return NextResponse.json({ messages });
};

export const PATCH = async (
  req: NextRequest,
  ctx: RouteContext
): Promise<Response> => {
  const { waId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };

  if (body.action !== "mark_read") {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  const rows = await readSheet<MessageRow>("WhatsApp_Messages");
  const nowIso = new Date().toISOString();
  let updated = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.wa_id !== waId) continue;
    if (r.direction !== "inbound") continue;
    if (r.status === "read") continue;
    await updateRowByHeader("WhatsApp_Messages", i, {
      status: "read",
      updated_at: nowIso,
    });
    updated++;
  }

  return NextResponse.json({ ok: true, updated });
};
