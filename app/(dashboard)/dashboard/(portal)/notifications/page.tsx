"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import type {
  Notification,
  NotificationSeverity,
  NotificationSource,
} from "@/app/lib/notifications";
import { EmptyState } from "@/app/(dashboard)/components/empty-state";

type StatusFilter = "all" | "unread" | "acked";
type SeverityFilter = "all" | NotificationSeverity;
type SourceFilter = "all" | NotificationSource;

const STATUS_OPTIONS: StatusFilter[] = ["all", "unread", "acked"];
const SEVERITY_OPTIONS: SeverityFilter[] = ["all", "critical", "high", "normal"];
const SOURCE_OPTIONS: SourceFilter[] = ["all", "trafico", "lead", "shipment"];

const dotClassFor = (severity: string): string => {
  if (severity === "critical") return "bg-brand-terracotta-dark";
  if (severity === "high") return "bg-brand-terracotta";
  return "bg-brand-sage";
};

const formatTime = (iso: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

const NotificationsPage = () => {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [status, setStatus] = useState<StatusFilter>("unread");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");

  const refresh = useCallback(async () => {
    const sp = new URLSearchParams();
    sp.set("status", status);
    if (severity !== "all") sp.set("severity", severity);
    if (source !== "all") sp.set("source", source);
    try {
      const res = await fetch(`/api/dashboard/notifications?${sp.toString()}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = (await res.json()) as { items?: Notification[] };
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    }
  }, [status, severity, source]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ack = async (id: string) => {
    await fetch("/api/dashboard/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "ack", notification_id: id }),
    });
    refresh();
  };

  return (
    <div className="p-6 max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-display-xl text-dash-text">Notifications</h1>
        <p className="text-sm text-dash-text-muted mt-1">
          Timeline of alerts surfaced by the customs, leads, and shipments engines.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[10px] uppercase tracking-wider text-dash-text-muted font-semibold mr-1">
          Status
        </span>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors capitalize cursor-pointer ${
              status === s
                ? "bg-brand-copper/10 text-brand-copper border-brand-copper"
                : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-border-strong"
            }`}
          >
            {s}
          </button>
        ))}
        <span className="w-px h-5 bg-dash-border mx-2" />
        <span className="text-[10px] uppercase tracking-wider text-dash-text-muted font-semibold mr-1">
          Severity
        </span>
        {SEVERITY_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSeverity(s)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors capitalize cursor-pointer ${
              severity === s
                ? "bg-brand-copper/10 text-brand-copper border-brand-copper"
                : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-border-strong"
            }`}
          >
            {s}
          </button>
        ))}
        <span className="w-px h-5 bg-dash-border mx-2" />
        <span className="text-[10px] uppercase tracking-wider text-dash-text-muted font-semibold mr-1">
          Source
        </span>
        {SOURCE_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors capitalize cursor-pointer ${
              source === s
                ? "bg-brand-copper/10 text-brand-copper border-brand-copper"
                : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-border-strong"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-dash-bg rounded animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications match these filters"
          description="Try widening status to all, or come back when the next alert fires."
          tone="muted"
        />
      ) : (
        <ul className="divide-y divide-dash-border border border-dash-border rounded-md bg-dash-surface">
          {items.map((n) => (
            <li
              key={n.notification_id}
              className="flex items-start gap-3 px-4 py-3"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${dotClassFor(n.severity)}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-dash-text">{n.title}</p>
                {n.body && (
                  <p className="text-xs text-dash-text-muted mt-0.5">{n.body}</p>
                )}
                <p className="text-[11px] text-dash-text-muted mt-1 font-mono">
                  {n.notification_id} · {n.severity} · {n.source_entity_type} · {formatTime(n.created_at)}
                </p>
              </div>
              {n.status === "unread" ? (
                <button
                  onClick={() => ack(n.notification_id)}
                  className="text-xs text-brand-copper hover:underline shrink-0 cursor-pointer"
                >
                  Ack
                </button>
              ) : (
                <span className="text-[11px] text-dash-text-muted shrink-0">acked</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
