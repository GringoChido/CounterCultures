"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { Notification } from "@/app/lib/notifications";

const REFRESH_MS = 60_000;

const hrefForNotification = (n: Notification): string => {
  if (n.source_entity_type === "trafico" || n.source_entity_type === "shipment")
    return `/dashboard/shipments?trafico=${n.source_entity_id}`;
  if (n.source_entity_type === "lead") return "/dashboard/leads";
  if (n.source_entity_type === "deal_payment") return "/dashboard/pipeline";
  return "/dashboard";
};

const dotClassFor = (severity: string): string => {
  if (severity === "critical") return "bg-brand-terracotta-dark";
  if (severity === "high") return "bg-brand-terracotta";
  return "bg-brand-sage";
};

const NotificationBell = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/dashboard/notifications?status=unread&limit=10",
        { credentials: "same-origin" }
      );
      if (!res.ok) return;
      const data = (await res.json()) as { items?: Notification[] };
      setItems(data.items ?? []);
    } catch {
      /* swallow — bell never blocks the header */
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const dotTone = items.some((i) => i.severity === "critical")
    ? "bg-brand-terracotta-dark"
    : items.some((i) => i.severity === "high")
      ? "bg-brand-terracotta"
      : items.length > 0
        ? "bg-brand-sage"
        : "";

  const ackAndOpen = async (n: Notification) => {
    setOpen(false);
    try {
      await fetch("/api/dashboard/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "ack", notification_id: n.notification_id }),
      });
    } catch {
      /* even if ack fails, navigation already happens via Link */
    }
    refresh();
  };

  return (
    <div ref={popRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-md hover:bg-dash-bg transition-colors cursor-pointer"
        aria-label={`Notifications${items.length > 0 ? ` (${items.length} unread)` : ""}`}
      >
        <Bell className="w-5 h-5 text-dash-text-secondary" />
        {items.length > 0 && (
          <>
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-brand-terracotta text-white text-[10px] font-bold px-1">
              {items.length > 9 ? "9+" : items.length}
            </span>
            {dotTone && (
              <span className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${dotTone}`} />
            )}
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-dash-surface border border-dash-border rounded-md shadow-xl z-50">
          <div className="px-4 py-3 border-b border-dash-border flex items-center justify-between">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-muted">
              Notifications
            </h3>
            {items.length > 0 && (
              <span className="text-[10px] text-dash-text-muted">
                {items.length} unread
              </span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {items.length === 0 ? (
              <p className="text-sm text-dash-text-muted px-4 py-8 text-center">
                No new alerts. ☕
              </p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.notification_id}
                  href={hrefForNotification(n)}
                  onClick={() => ackAndOpen(n)}
                  className="flex items-start gap-2 px-4 py-2.5 hover:bg-dash-bg transition-colors text-sm"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dotClassFor(n.severity)}`}
                  />
                  <span className="flex-1 text-dash-text leading-snug">{n.title}</span>
                </Link>
              ))
            )}
          </div>
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-xs text-brand-copper hover:bg-dash-bg border-t border-dash-border text-center"
          >
            See all →
          </Link>
        </div>
      )}
    </div>
  );
};

export { NotificationBell };
