"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Inbox as InboxIcon,
  Loader2,
  Mail,
  Paperclip,
  RefreshCw,
  Search,
  Sparkles,
  UserPlus,
  AlertCircle,
  Tag,
} from "lucide-react";

interface ThreadSummary {
  threadId: string;
  subject: string;
  snippet: string;
  from: string;
  fromEmail: string;
  to: string;
  date: string;
  unread: boolean;
  messageCount: number;
  labelIds: string[];
  hasAttachments: boolean;
}

interface ThreadMessage {
  messageId: string;
  threadId: string;
  from: string;
  fromEmail: string;
  to: string;
  cc: string;
  subject: string;
  date: string;
  unread: boolean;
  body: string;
  bodyHtml: string | null;
  snippet: string;
  labelIds: string[];
  attachments: { attachmentId: string; filename: string; mimeType: string; size: number }[];
}

interface ThreadDetail {
  threadId: string;
  subject: string;
  messages: ThreadMessage[];
}

interface StatusResponse {
  connected: boolean;
  gmailAddress?: string;
  lastError?: string;
  oauthConfigured: boolean;
}

const formatDate = (iso: string): string => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const sameYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: sameYear ? undefined : "2-digit",
    });
  } catch {
    return iso;
  }
};

const InboxPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creatingLead, setCreatingLead] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/gmail/status");
      const data = (await r.json()) as StatusResponse;
      setStatus(data);
      return data;
    } catch (err) {
      console.error("[Inbox] status failed", err);
      return null;
    }
  }, []);

  const fetchThreads = useCallback(
    async (q?: string) => {
      setLoadingThreads(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        const r = await fetch(`/api/gmail/inbox?${params.toString()}`);
        const data = await r.json();
        if (!r.ok) {
          setError(data.error || "Couldn't load inbox");
          setThreads([]);
          return;
        }
        setThreads(data.threads as ThreadSummary[]);
      } catch (err) {
        console.error("[Inbox] list failed", err);
        setError("Couldn't load inbox");
      } finally {
        setLoadingThreads(false);
      }
    },
    []
  );

  const fetchThread = useCallback(async (threadId: string) => {
    setLoadingDetail(true);
    try {
      const r = await fetch(`/api/gmail/thread/${threadId}`);
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error || "Couldn't load thread");
        return;
      }
      setThreadDetail(data as ThreadDetail);
      // Fire-and-forget mark-read
      fetch(`/api/gmail/thread/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read" }),
      }).catch(() => {
        /* ignore */
      });
    } catch (err) {
      console.error("[Inbox] thread failed", err);
      toast.error("Couldn't load thread");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus().then((s) => {
      if (s?.connected) fetchThreads();
    });
  }, [fetchStatus, fetchThreads]);

  useEffect(() => {
    if (selectedThreadId) fetchThread(selectedThreadId);
    else setThreadDetail(null);
  }, [selectedThreadId, fetchThread]);

  const unreadCount = useMemo(
    () => threads.filter((t) => t.unread).length,
    [threads]
  );

  const createLeadFromThread = async () => {
    if (!threadDetail || threadDetail.messages.length === 0) return;
    const latest = threadDetail.messages[threadDetail.messages.length - 1];
    setCreatingLead(true);
    try {
      const r = await fetch("/api/gmail/create-lead-from-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: latest.messageId,
          threadId: threadDetail.threadId,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error || "Couldn't create lead");
        return;
      }
      const brandCount = (data.matchedBrandSlugs ?? []).length;
      toast.success(
        `Lead ${data.leadId} created${brandCount > 0 ? ` · ${brandCount} brand${brandCount > 1 ? "s" : ""} tagged` : ""}`
      );
      router.push("/dashboard/leads");
    } catch (err) {
      console.error("[Inbox] create lead failed", err);
      toast.error("Couldn't create lead");
    } finally {
      setCreatingLead(false);
    }
  };

  // ── Not connected state ───────────────────────────────────────────
  if (status && !status.connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-copper/10 flex items-center justify-center">
          <InboxIcon className="w-7 h-7 text-brand-copper" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-semibold text-dash-text">
            Connect Gmail to open the portal inbox
          </h2>
          <p className="text-sm text-dash-text-secondary">
            Thread list, compose, and one-click <em>Create Lead from email</em>{" "}
            all flow through your own Gmail account. Tokens are encrypted at
            rest and never leave the Counter Cultures workspace.
          </p>
          {!status.oauthConfigured && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-left text-xs text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                OAuth isn&apos;t configured yet — set{" "}
                <code className="text-[11px] bg-dash-bg px-1 py-0.5 rounded">
                  GOOGLE_OAUTH_CLIENT_ID
                </code>{" "}
                and{" "}
                <code className="text-[11px] bg-dash-bg px-1 py-0.5 rounded">
                  GOOGLE_OAUTH_CLIENT_SECRET
                </code>{" "}
                in <code>.env.local</code> and restart the server.
              </span>
            </div>
          )}
        </div>
        <a
          href="/api/gmail/connect"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
        >
          <Mail className="w-4 h-4" />
          Connect Gmail
        </a>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 pb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchThreads(query || undefined);
            }}
            placeholder="Gmail search — from:gabor  subject:quote  has:attachment …"
            className="w-full pl-9 pr-3 py-2 bg-dash-surface border border-dash-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-copper/30"
          />
        </div>
        <button
          onClick={() => fetchThreads(query || undefined)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
        <div className="text-xs text-dash-text-secondary pr-1">
          {status.gmailAddress && (
            <span>
              as <span className="text-dash-text">{status.gmailAddress}</span>
            </span>
          )}
        </div>
      </div>

      {/* Three-column layout */}
      <div className="flex-1 grid grid-cols-[360px_1fr] gap-0 border border-dash-border rounded-xl overflow-hidden bg-dash-surface min-h-0">
        {/* Thread list */}
        <div className="border-r border-dash-border overflow-y-auto">
          <div className="px-3 py-2 border-b border-dash-border flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold text-dash-text-secondary">
            <span>Inbox</span>
            <span>
              {unreadCount} unread · {threads.length}
            </span>
          </div>
          {loadingThreads ? (
            <div className="flex items-center gap-2 px-3 py-6 text-xs text-dash-text-secondary">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading threads…
            </div>
          ) : error ? (
            <div className="px-3 py-6 text-xs text-red-400">{error}</div>
          ) : threads.length === 0 ? (
            <div className="px-3 py-6 text-xs text-dash-text-secondary">
              No threads match.
            </div>
          ) : (
            <ul>
              {threads.map((t) => {
                const active = t.threadId === selectedThreadId;
                return (
                  <li key={t.threadId}>
                    <button
                      onClick={() => setSelectedThreadId(t.threadId)}
                      className={`w-full text-left px-3 py-3 border-b border-dash-border/50 transition-colors cursor-pointer ${
                        active
                          ? "bg-brand-copper/5 border-l-2 border-l-brand-copper"
                          : "hover:bg-dash-bg/40 border-l-2 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span
                          className={`text-sm truncate ${
                            t.unread ? "font-semibold text-dash-text" : "text-dash-text"
                          }`}
                          title={t.fromEmail}
                        >
                          {t.from || t.fromEmail || "(unknown sender)"}
                        </span>
                        <span className="text-[10px] text-dash-text-secondary shrink-0">
                          {formatDate(t.date)}
                        </span>
                      </div>
                      <div
                        className={`text-xs truncate ${
                          t.unread ? "font-medium text-dash-text" : "text-dash-text-secondary"
                        }`}
                      >
                        {t.subject}
                      </div>
                      <div className="text-[11px] text-dash-text-secondary/80 truncate mt-0.5">
                        {t.snippet}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {t.messageCount > 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-dash-bg text-dash-text-secondary rounded">
                            {t.messageCount}
                          </span>
                        )}
                        {t.hasAttachments && (
                          <Paperclip className="w-3 h-3 text-dash-text-secondary/70" />
                        )}
                        {t.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-copper" />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Thread detail */}
        <div className="overflow-y-auto">
          {!selectedThreadId ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-sm text-dash-text-secondary px-8 py-16">
              <InboxIcon className="w-10 h-10 mb-3 opacity-30" />
              <p>Pick a thread to read it.</p>
            </div>
          ) : loadingDetail || !threadDetail ? (
            <div className="flex items-center gap-2 px-6 py-8 text-xs text-dash-text-secondary">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading thread…
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Thread header */}
              <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-dash-text truncate">
                    {threadDetail.subject}
                  </h3>
                  <p className="text-xs text-dash-text-secondary mt-0.5">
                    {threadDetail.messages.length} message
                    {threadDetail.messages.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={createLeadFromThread}
                    disabled={creatingLead}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {creatingLead ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    Create Lead
                  </button>
                  <button
                    disabled
                    title="Compose / Reply land Week 3 Day 3"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dash-border rounded-lg opacity-40 cursor-not-allowed"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Reply (soon)
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 px-5 py-4 space-y-5">
                {threadDetail.messages.map((m) => (
                  <article
                    key={m.messageId}
                    className="bg-dash-bg border border-dash-border rounded-xl p-4"
                  >
                    <header className="flex items-start justify-between gap-3 pb-2 border-b border-dash-border/60 mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-dash-text truncate">
                          {m.from || m.fromEmail}
                        </p>
                        <p className="text-[11px] text-dash-text-secondary truncate">
                          {m.fromEmail} → {m.to}
                        </p>
                      </div>
                      <span className="text-[11px] text-dash-text-secondary whitespace-nowrap">
                        {formatDate(m.date)}
                      </span>
                    </header>
                    <div className="text-sm text-dash-text leading-relaxed whitespace-pre-wrap">
                      {m.body || m.snippet || "(no body)"}
                    </div>
                    {m.attachments.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-dash-border/60">
                        <Paperclip className="w-3.5 h-3.5 text-dash-text-secondary" />
                        {m.attachments.map((a) => (
                          <span
                            key={a.attachmentId}
                            className="text-[11px] px-2 py-0.5 bg-dash-surface border border-dash-border rounded text-dash-text-secondary"
                            title={`${a.mimeType} · ${Math.round(a.size / 1024)} KB`}
                          >
                            {a.filename}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.labelIds.some((l) => !["UNREAD", "INBOX", "IMPORTANT", "CATEGORY_PERSONAL", "CATEGORY_UPDATES", "CATEGORY_PROMOTIONS", "SENT"].includes(l)) && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-3">
                        <Tag className="w-3 h-3 text-dash-text-secondary/60" />
                        {m.labelIds
                          .filter(
                            (l) =>
                              ![
                                "UNREAD",
                                "INBOX",
                                "IMPORTANT",
                                "CATEGORY_PERSONAL",
                                "CATEGORY_UPDATES",
                                "CATEGORY_PROMOTIONS",
                                "SENT",
                              ].includes(l)
                          )
                          .map((l) => (
                            <span
                              key={l}
                              className="text-[10px] px-1.5 py-0.5 bg-brand-copper/10 text-brand-copper border border-brand-copper/20 rounded"
                            >
                              {l.replace(/^Label_\d+$/, "…")}
                            </span>
                          ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
