"use client";

/**
 * <ThreadOnDealPanel /> — surfaces Gmail threads linked to a Pipeline deal.
 *
 * Reads from /api/deals/[id]/thread which dedupes by thread ID across the
 * Email_Activity audit log. Each thread is fetched from Gmail for its
 * subject + latest snippet. Clicking a thread opens the Inbox UI focused
 * on that thread.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Mail, MessageSquare } from "lucide-react";

interface DealThread {
  threadId: string;
  subject: string;
  snippet?: string;
  from?: string;
  fromEmail?: string;
  date?: string;
  messageCount?: number;
  lastLinkedAt?: string;
  action?: string;
  degraded?: boolean;
}

interface Props {
  dealId: string;
}

const fmtDate = (iso: string | undefined): string => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
};

export const ThreadOnDealPanel = ({ dealId }: Props) => {
  const [threads, setThreads] = useState<DealThread[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!dealId) return;
    try {
      const r = await fetch(`/api/deals/${encodeURIComponent(dealId)}/thread`);
      const data = await r.json();
      setThreads((data.threads ?? []) as DealThread[]);
      setError(null);
    } catch (err) {
      console.error("[ThreadOnDealPanel] fetch failed", err);
      setError("Couldn't load thread history");
    }
  }, [dealId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" />
          Email threads
          {threads && threads.length > 0 && (
            <span className="text-dash-text-secondary/60 font-normal">
              ({threads.length})
            </span>
          )}
        </h4>
      </div>

      {threads === null ? (
        <div className="flex items-center gap-2 text-xs text-dash-text-secondary py-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading…
        </div>
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : threads.length === 0 ? (
        <p className="text-xs text-dash-text-secondary/70 py-2">
          No emails linked to this deal yet. Use <em>Attach to Deal</em> from
          the Inbox to start a thread history.
        </p>
      ) : (
        <ul className="space-y-2">
          {threads.map((t) => (
            <li key={t.threadId}>
              <Link
                href={`/dashboard/inbox?thread=${encodeURIComponent(t.threadId)}`}
                className="block px-3 py-2 bg-dash-bg border border-dash-border rounded-lg hover:border-brand-copper/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-xs font-medium text-dash-text truncate">
                    {t.from || t.fromEmail || "(unknown sender)"}
                  </p>
                  <span className="text-[10px] text-dash-text-secondary shrink-0">
                    {fmtDate(t.date || t.lastLinkedAt)}
                  </span>
                </div>
                <p className="text-xs text-dash-text truncate">{t.subject}</p>
                {t.snippet && (
                  <p className="text-[11px] text-dash-text-secondary/80 truncate mt-0.5">
                    {t.snippet}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  {t.messageCount && t.messageCount > 1 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-dash-surface text-dash-text-secondary rounded flex items-center gap-1">
                      <MessageSquare className="w-2.5 h-2.5" />
                      {t.messageCount}
                    </span>
                  )}
                  {t.degraded && (
                    <span className="text-[10px] text-amber-400">
                      Gmail not reachable — showing cached metadata
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
