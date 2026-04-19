import { NextResponse } from "next/server";
import {
  listNotifications,
  notificationToNeedsYouItem,
  syncNotificationsFromSources,
} from "@/app/lib/notifications";

export const GET = async () => {
  await syncNotificationsFromSources();
  const items = await listNotifications({ status: "unread", limit: 8 });
  return NextResponse.json({ items: items.map(notificationToNeedsYouItem) });
};
