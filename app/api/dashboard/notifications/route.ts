import { NextRequest, NextResponse } from "next/server";
import {
  ackNotification,
  listNotifications,
  syncNotificationsFromSources,
  type NotificationAudience,
  type NotificationSeverity,
  type NotificationSource,
  type NotificationStatus,
} from "@/app/lib/notifications";

export const GET = async (req: NextRequest) => {
  await syncNotificationsFromSources();
  const sp = req.nextUrl.searchParams;
  const items = await listNotifications({
    status: (sp.get("status") as NotificationStatus | "all" | null) ?? undefined,
    audience: (sp.get("audience") as NotificationAudience | null) ?? undefined,
    severity: (sp.get("severity") as NotificationSeverity | null) ?? undefined,
    source: (sp.get("source") as NotificationSource | null) ?? undefined,
    limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
  });
  return NextResponse.json({ items });
};

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  if (body?.action === "ack" && typeof body.notification_id === "string") {
    await ackNotification(body.notification_id);
    return NextResponse.json({ ok: true });
  }
  if (body?.action === "sync") {
    const result = await syncNotificationsFromSources({ force: true });
    return NextResponse.json(result);
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
};
