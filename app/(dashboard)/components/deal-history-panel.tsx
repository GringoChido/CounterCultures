"use client";

/**
 * Deal History panel — timeline of Deal_Events for a single deal, filterable
 * by audience. Rolls up the W7 rollback UI that was deferred in W7 Task 12.
 *
 * Server route: GET /api/dashboard/deals/[id]/events?filter=<all|internal|customer>
 * Rollback route (W7): POST /api/dashboard/pipeline/rollback { dealId, eventId }
 */

import { useState, useEffect } from "react";
import {
  History,
  CheckCircle2,
  AlertTriangle,
  Undo2,
  ArrowRight,
  Clock,
  Bell,
  Mail,
  MessageCircle,
  Layout,
  CircleAlert,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type FilterMode = "all" | "internal" | "customer";

interface DealEventRow {
  event_id: string;
  deal_id: string;
  timestamp: string;
  actor: string;
  event_type: string;
  from_stage: string;
  to_stage: string;
  trigger_rule_id: string;
  payload_json: string;
  reverted_event_id: string;
}

interface Props {
  dealId: string;
}

const EVENT_ICONS: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  stage_change: { icon: ArrowRight, className: "text-brand-copper" },
  pending_move: { icon: Clock, className: "text-dash-warn" },
  pending_move_cancelled: { icon: CircleAlert, className: "text-dash-warn" },
  rollback: { icon: Undo2, className: "text-dash-cat-violet" },
  sla_breach: { icon: AlertTriangle, className: "text-dash-danger" },
  field_update: { icon: Layout, className: "text-dash-text-secondary" },
  alert_fired: { icon: Bell, className: "text-dash-success" },
};

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  dashboard: Layout,
};

const parsePayload = (raw: string): Record<string, unknown> => {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const canRollback = (event: DealEventRow, now: Date = new Date()): boolean => {
  if (event.event_type !== "stage_change") return false;
  const ts = Date.parse(event.timestamp);
  if (!Number.isFinite(ts)) return false;
  return now.getTime() - ts < 24 * 60 * 60 * 1000;
};

const DealHistoryPanel = ({ dealId }: Props) => {
  const [events, setEvents] = useState<DealEventRow[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [loading, setLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/deals/${encodeURIComponent(dealId)}/events?filter=${filter}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as { events: DealEventRow[] };
      setEvents(data.events);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId, filter]);

  const handleRollback = async (eventId: string) => {
    if (!window.confirm("Rollback this stage change? The deal will revert to the prior stage and a rollback event will be logged.")) return;
    setRollingBack(eventId);
    try {
      const res = await fetch("/api/dashboard/pipeline/rollback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dealId, eventId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Rollback failed");
        return;
      }
      toast.success("Rolled back");
      await refetch();
    } finally {
      setRollingBack(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter segmented control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-dash-text">
          <History className="w-4 h-4" />
          Stage History
        </div>
        <div className="flex bg-dash-bg border border-dash-border rounded-lg p-0.5 text-xs">
          {(["all", "internal", "customer"] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === mode
                  ? "bg-dash-surface text-dash-text"
                  : "text-dash-text-secondary hover:text-dash-text"
              }`}
            >
              {mode === "all" ? "All" : mode === "internal" ? "Internal" : "Customer-facing"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-brand-copper animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-sm text-dash-text-secondary">
          No events yet.
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const cfg = EVENT_ICONS[event.event_type] ?? { icon: History, className: "text-dash-text-secondary" };
            const Icon = cfg.icon;
            const payload = parsePayload(event.payload_json);
            const channel = typeof payload.channel === "string" ? payload.channel : undefined;
            const audience = typeof payload.audience === "string" ? payload.audience : undefined;
            const status = typeof payload.status === "string" ? payload.status : undefined;
            const ChannelIcon = channel ? CHANNEL_ICONS[channel] : undefined;
            const timeAgo = formatDistanceToNow(new Date(event.timestamp), { addSuffix: true });

            return (
              <div
                key={event.event_id}
                className="flex gap-3 p-3 bg-dash-bg/50 border border-dash-border rounded-lg"
              >
                <div className={`shrink-0 mt-0.5 ${cfg.className}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-sm">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium text-dash-text">
                      {event.event_type === "stage_change" ? (
                        <>
                          {event.from_stage || "?"} <ArrowRight className="w-3 h-3 inline" /> {event.to_stage}
                        </>
                      ) : event.event_type === "alert_fired" ? (
                        <span className="flex items-center gap-1.5">
                          Alert fired
                          {ChannelIcon && <ChannelIcon className="w-3 h-3" />}
                          {channel && <span className="text-xs text-dash-text-secondary">{channel}</span>}
                          {audience && <span className="text-xs text-dash-text-secondary">· {audience}</span>}
                        </span>
                      ) : (
                        event.event_type.replace(/_/g, " ")
                      )}
                    </span>
                    <span className="text-xs text-dash-text-secondary">{timeAgo}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-dash-text-secondary">
                    <span>by {event.actor || "system"}</span>
                    {event.trigger_rule_id && (
                      <span className="font-mono text-[10px]">· {event.trigger_rule_id}</span>
                    )}
                    {status && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          status === "sent"
                            ? "bg-dash-success/10 text-dash-success"
                            : status === "dry_run"
                              ? "bg-dash-warn/10 text-dash-warn"
                              : status === "queued"
                                ? "bg-dash-info/10 text-dash-info"
                                : status === "failed"
                                  ? "bg-dash-danger/10 text-dash-danger"
                                  : "bg-dash-border text-dash-text-secondary"
                        }`}
                      >
                        {status}
                      </span>
                    )}
                  </div>
                  {canRollback(event) && (
                    <button
                      onClick={() => handleRollback(event.event_id)}
                      disabled={rollingBack === event.event_id}
                      className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-dash-surface border border-dash-border rounded hover:border-dash-cat-violet/40 hover:text-dash-cat-violet transition-colors disabled:opacity-50"
                    >
                      {rollingBack === event.event_id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Undo2 className="w-3 h-3" />
                      )}
                      Rollback
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DealHistoryPanel;
