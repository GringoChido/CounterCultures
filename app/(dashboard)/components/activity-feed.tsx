"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRightCircle,
  Mail,
  MessageCircle,
  DollarSign,
  UserPlus,
  Package,
  AlertTriangle,
  FileText,
  Activity as ActivityIcon,
  RefreshCw,
  Loader2,
} from "lucide-react";

type ActivityItem = {
  id: string;
  type: string;
  description: string;
  contactName?: string;
  rep?: string;
  timestamp: string;
  contactId?: string;
  dealId?: string;
  followUpDate?: string;
};

type IconTone = {
  Icon: typeof ArrowRightCircle;
  color: string;
};

// Map Activity_Log `type` values to icons + tones. Fallback to a generic
// activity icon so unknown types still render cleanly.
const pickIconTone = (type: string): IconTone => {
  const t = type.toLowerCase();
  if (t.includes("stage") || t.includes("pending_move"))
    return { Icon: ArrowRightCircle, color: "text-brand-copper" };
  if (t.includes("email") || t.includes("sent") || t.includes("received"))
    return { Icon: Mail, color: "text-dash-info" };
  if (t.includes("whatsapp") || t.includes("chat"))
    return { Icon: MessageCircle, color: "text-dash-success" };
  if (t.includes("payment") || t.includes("stripe") || t.includes("invoice"))
    return { Icon: DollarSign, color: "text-dash-success" };
  if (t.includes("lead") || t.includes("contact_created"))
    return { Icon: UserPlus, color: "text-dash-warn" };
  if (t.includes("shipment") || t.includes("trafico") || t.includes("customs"))
    return { Icon: Package, color: "text-dash-info" };
  if (t.includes("alert") || t.includes("breach") || t.includes("issue"))
    return { Icon: AlertTriangle, color: "text-dash-danger" };
  if (t.includes("note") || t.includes("document"))
    return { Icon: FileText, color: "text-dash-text-secondary" };
  return { Icon: ActivityIcon, color: "text-dash-text-secondary" };
};

const ActivityFeed = ({ limit = 15 }: { limit?: number }) => {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dashboard/activities?limit=${limit}&since=2d`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { activities?: ActivityItem[] };
      setItems(data.activities ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return (
    <section className="bg-dash-surface rounded-xl border border-dash-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-dash-text">Activity</h3>
          <p className="text-[11px] text-dash-text-secondary">Last 48 hours</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs text-dash-text-secondary hover:text-brand-copper transition cursor-pointer disabled:opacity-50"
          aria-label="Refresh activity feed"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
        </button>
      </div>

      {error ? (
        <p className="text-xs text-dash-danger">{error}</p>
      ) : null}

      {items === null && !error ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-dash-bg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 bg-dash-bg rounded" />
                <div className="h-3 w-1/2 bg-dash-bg/70 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {items && items.length === 0 ? (
        <p className="text-xs text-dash-text-muted py-6 text-center">
          No activity in the last 48 hours.
        </p>
      ) : null}

      {items && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((it) => {
            const { Icon, color } = pickIconTone(it.type);
            const time = (() => {
              try {
                return formatDistanceToNow(new Date(it.timestamp), {
                  addSuffix: true,
                });
              } catch {
                return it.timestamp;
              }
            })();
            const href = it.dealId
              ? `/dashboard/pipeline?deal=${encodeURIComponent(it.dealId)}`
              : it.contactId
                ? `/dashboard/leads?lead=${encodeURIComponent(it.contactId)}`
                : null;
            const Wrapper = ({ children }: { children: React.ReactNode }) =>
              href ? (
                <Link
                  href={href}
                  className="flex items-start gap-3 hover:bg-dash-bg/50 -mx-2 px-2 py-1 rounded transition-colors"
                >
                  {children}
                </Link>
              ) : (
                <div className="flex items-start gap-3">{children}</div>
              );
            return (
              <li key={it.id}>
                <Wrapper>
                  <div
                    className={`w-7 h-7 rounded-full bg-dash-bg flex items-center justify-center shrink-0 ${color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-dash-text leading-tight line-clamp-2">
                      {it.description || it.type}
                    </p>
                    <p className="text-[11px] text-dash-text-secondary mt-0.5">
                      {it.rep ?? "system"} · {time}
                    </p>
                  </div>
                </Wrapper>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="mt-4 pt-3 border-t border-dash-border">
        <Link
          href="/dashboard/notifications"
          className="text-xs text-brand-copper hover:underline"
        >
          View full notification history →
        </Link>
      </div>
    </section>
  );
};

export { ActivityFeed };
