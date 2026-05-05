"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Inbox as InboxIcon,
  Loader2,
  Mail,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  UserPlus,
  Briefcase,
  Link2,
  X,
  AlertCircle,
  Tag,
  Pencil,
  Reply,
  Archive,
  CheckSquare,
  Square,
  FileEdit,
  Star,
  Layers,
} from "lucide-react";
import { EmailTemplatePicker } from "@/app/(dashboard)/components/email-template-picker";
import { ThreadLabelChips } from "@/app/(dashboard)/components/thread-label-chips";
import { EmailBody } from "@/app/(dashboard)/components/email-body";
import { AttachmentGrid } from "@/app/(dashboard)/components/attachment-grid";

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
  attachments: {
    attachmentId: string;
    filename: string;
    mimeType: string;
    size: number;
    inline: boolean;
  }[];
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

interface DealLite {
  id: string;
  name: string;
  company: string;
  stage: string;
}

interface GmailLabel {
  id: string;
  name: string;
  type: "system" | "user";
  messagesUnread?: number;
  messagesTotal?: number;
}

// `selectedLabel` is one of the system folder pseudo-IDs ("INBOX", "SENT",
// "DRAFT", "STARRED", "ALL") or a Gmail label ID like "Label_123".
// "ALL" → no labelIds + q="in:anywhere"; everything else → labelIds=[id].
type FolderId = "INBOX" | "SENT" | "DRAFT" | "STARRED" | "ALL" | string;

const SYSTEM_FOLDERS: { id: FolderId; label: string; icon: typeof InboxIcon }[] = [
  { id: "INBOX", label: "Inbox", icon: InboxIcon },
  { id: "SENT", label: "Sent", icon: Send },
  { id: "DRAFT", label: "Drafts", icon: FileEdit },
  { id: "STARRED", label: "Starred", icon: Star },
  { id: "ALL", label: "All Mail", icon: Layers },
];

// Gmail returns user labels with system-prefixed IDs sometimes; the bits
// we don't want to surface as user-pickable labels.
const SYSTEM_LABEL_IDS_TO_HIDE = new Set([
  "INBOX",
  "SENT",
  "DRAFT",
  "STARRED",
  "TRASH",
  "SPAM",
  "UNREAD",
  "IMPORTANT",
  "CHAT",
  "CATEGORY_PERSONAL",
  "CATEGORY_SOCIAL",
  "CATEGORY_PROMOTIONS",
  "CATEGORY_UPDATES",
  "CATEGORY_FORUMS",
]);

const InboxPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const initialLabel = (searchParams.get("label") as FolderId) || "INBOX";
  const [selectedLabel, setSelectedLabel] = useState<FolderId>(initialLabel);
  const [scopeError, setScopeError] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creatingLead, setCreatingLead] = useState(false);
  const [creatingDeal, setCreatingDeal] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] = useState({ to: "", cc: "", subject: "", body: "" });
  const [sendingCompose, setSendingCompose] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [attachPickerOpen, setAttachPickerOpen] = useState(false);
  const [deals, setDeals] = useState<DealLite[] | null>(null);
  const [dealSearch, setDealSearch] = useState("");
  const [attaching, setAttaching] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState<null | "archive" | "create_lead">(null);

  const toggleSelect = useCallback((threadId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId);
      else next.add(threadId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

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
    async (
      q?: string,
      opts: { noCache?: boolean; label?: FolderId } = {}
    ) => {
      setLoadingThreads(true);
      setError(null);
      const label = opts.label ?? selectedLabel;
      try {
        const params = new URLSearchParams();
        // "ALL" pseudo-folder = no label filter + Gmail's `in:anywhere`
        // operator so archived/non-inbox mail surfaces. Everything else
        // is a single labelIds entry — Gmail accepts both system label
        // names ("SENT", "DRAFT") and user label IDs ("Label_123").
        if (label === "ALL") {
          const merged = q ? `${q} in:anywhere` : "in:anywhere";
          params.set("q", merged);
        } else {
          if (q) params.set("q", q);
          params.set("labels", label);
        }
        if (opts.noCache) params.set("noCache", "1");
        const r = await fetch(`/api/gmail/inbox?${params.toString()}`);
        const data = await r.json();
        if (!r.ok) {
          // Token doesn't have the wider scope — surface a clean reconnect
          // CTA. 401/403 from Gmail manifests as 500 here with a message
          // containing "insufficient" or the literal scope name.
          const msg = String(data.error || "");
          if (
            r.status === 403 ||
            /insufficient|invalid_scope|scope/i.test(msg)
          ) {
            setScopeError(true);
          }
          setError(msg || "Couldn't load inbox");
          setThreads([]);
          return;
        }
        setScopeError(false);
        setThreads(data.threads as ThreadSummary[]);
      } catch (err) {
        console.error("[Inbox] list failed", err);
        setError("Couldn't load inbox");
      } finally {
        setLoadingThreads(false);
      }
    },
    [selectedLabel]
  );

  const fetchLabels = useCallback(async () => {
    try {
      const r = await fetch("/api/gmail/labels");
      const data = await r.json();
      if (!r.ok) {
        // Same scope-detection as threads — 403 here usually means the
        // refresh token predates the gmail.modify scope widening.
        if (r.status === 403) setScopeError(true);
        return;
      }
      setLabels((data.labels ?? []) as GmailLabel[]);
    } catch (err) {
      console.error("[Inbox] labels failed", err);
    }
  }, []);

  // Folder/label selection — pushes to URL so deep links and back-button work
  // as expected, then triggers a thread refetch via the effect below.
  const selectFolder = useCallback(
    (id: FolderId) => {
      setSelectedThreadId(null);
      clearSelection();
      setSelectedLabel(id);
      const next = new URLSearchParams(searchParams.toString());
      if (id === "INBOX") next.delete("label");
      else next.set("label", id);
      router.replace(`/dashboard/inbox${next.size ? `?${next}` : ""}`);
    },
    [searchParams, router, clearSelection]
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
      if (s?.connected) {
        fetchThreads();
        fetchLabels();
      }
    });
    // Run once on mount; fetchThreads + fetchLabels are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when the selected folder/label changes — but skip the initial
  // mount to avoid a duplicate fetch (the on-mount effect above already
  // calls fetchThreads).
  const [didMount, setDidMount] = useState(false);
  useEffect(() => {
    if (!didMount) {
      setDidMount(true);
      return;
    }
    if (status?.connected) fetchThreads(query || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLabel]);

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

  const createDealFromThread = async () => {
    if (!threadDetail || threadDetail.messages.length === 0) return;
    const latest = threadDetail.messages[threadDetail.messages.length - 1];
    setCreatingDeal(true);
    try {
      const r = await fetch("/api/gmail/create-deal-from-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: latest.messageId,
          threadId: threadDetail.threadId,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error || "Couldn't create deal");
        return;
      }
      const brandCount = (data.matchedBrandSlugs ?? []).length;
      toast.success(
        `Deal ${data.dealId} created${brandCount > 0 ? ` · ${brandCount} brand${brandCount > 1 ? "s" : ""} tagged` : ""}`
      );
      router.push("/dashboard/pipeline");
    } catch (err) {
      console.error("[Inbox] create deal failed", err);
      toast.error("Couldn't create deal");
    } finally {
      setCreatingDeal(false);
    }
  };

  const openCompose = () => {
    setComposeDraft({ to: "", cc: "", subject: "", body: "" });
    setComposeOpen(true);
  };

  const openReply = () => {
    if (!threadDetail) return;
    const latest = threadDetail.messages[threadDetail.messages.length - 1];
    setReplyBody(`\n\nOn ${new Date(latest.date).toLocaleString()}, ${latest.from || latest.fromEmail} wrote:\n> ${(latest.body || latest.snippet || "").split("\n").join("\n> ")}`);
    setReplyOpen(true);
  };

  const sendCompose = async () => {
    if (!composeDraft.to.trim() || !composeDraft.subject.trim() || !composeDraft.body.trim()) {
      toast.error("To, subject, and body are required");
      return;
    }
    setSendingCompose(true);
    try {
      const r = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composeDraft),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error || "Couldn't send");
        return;
      }
      toast.success("Sent");
      setComposeOpen(false);
    } catch (err) {
      console.error("[Inbox] send failed", err);
      toast.error("Couldn't send");
    } finally {
      setSendingCompose(false);
    }
  };

  const sendReply = async () => {
    if (!threadDetail || !replyBody.trim()) return;
    setSendingReply(true);
    try {
      const r = await fetch("/api/gmail/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: threadDetail.threadId, body: replyBody }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error || "Couldn't send reply");
        return;
      }
      toast.success("Reply sent");
      setReplyOpen(false);
      setReplyBody("");
      // refresh the thread so the reply shows up
      if (threadDetail) fetchThread(threadDetail.threadId);
    } catch (err) {
      console.error("[Inbox] reply failed", err);
      toast.error("Couldn't send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const openAttachPicker = async () => {
    setAttachPickerOpen(true);
    if (deals === null) {
      try {
        const r = await fetch("/api/dashboard/pipeline");
        const data = await r.json();
        setDeals(
          ((data.deals || []) as Record<string, string>[]).map((d) => ({
            id: d.id,
            name: d.name,
            company: d.company,
            stage: d.stage,
          }))
        );
      } catch (err) {
        console.error("[Inbox] pipeline fetch failed", err);
        setDeals([]);
      }
    }
  };

  const attachToDeal = async (dealId: string) => {
    if (!threadDetail) return;
    const latest = threadDetail.messages[threadDetail.messages.length - 1];
    setAttaching(dealId);
    try {
      const r = await fetch("/api/gmail/attach-to-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: latest.messageId,
          threadId: threadDetail.threadId,
          dealId,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error || "Couldn't attach");
        return;
      }
      toast.success(`Attached to ${dealId}`);
      setAttachPickerOpen(false);
    } catch (err) {
      console.error("[Inbox] attach failed", err);
      toast.error("Couldn't attach");
    } finally {
      setAttaching(null);
    }
  };

  const runBulk = async (action: "archive" | "create_lead") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkRunning(action);
    try {
      const r = await fetch("/api/gmail/threads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadIds: ids, action }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error || "Bulk action failed");
        return;
      }
      const verb = action === "archive" ? "Archived" : "Created leads from";
      if (data.failed > 0) {
        toast.warning(`${verb} ${data.success}/${data.total} threads — ${data.failed} failed`);
      } else {
        toast.success(`${verb} ${data.success} thread${data.success === 1 ? "" : "s"}`);
      }
      // For archive: drop archived threads from the list locally so the UI is fast
      if (action === "archive") {
        const successIds = new Set(
          (data.results as { threadId: string; ok: boolean }[])
            .filter((r) => r.ok)
            .map((r) => r.threadId)
        );
        setThreads((prev) => prev.filter((t) => !successIds.has(t.threadId)));
        if (selectedThreadId && successIds.has(selectedThreadId)) {
          setSelectedThreadId(null);
        }
      }
      clearSelection();
    } catch (err) {
      console.error("[Inbox] bulk failed", err);
      toast.error("Bulk action failed");
    } finally {
      setBulkRunning(null);
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
            <div className="flex items-start gap-2 mt-3 p-3 bg-dash-warn/10 border border-dash-warn/30 rounded-lg text-left text-xs text-dash-warn">
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
            className="w-full pl-9 pr-3 py-2 bg-dash-surface border border-dash-border rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
          />
        </div>
        <button
          onClick={() => fetchThreads(query || undefined, { noCache: true })}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
          title="Force a fresh fetch (bypasses 5-min cache)"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
        <button
          onClick={openCompose}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          Compose
        </button>
        <div className="text-xs text-dash-text-secondary pr-1">
          {status.gmailAddress && (
            <span>
              as <span className="text-dash-text">{status.gmailAddress}</span>
            </span>
          )}
        </div>
      </div>

      {/* Reconnect-Gmail nudge — shows when an API call returns 403/scope */}
      {scopeError && (
        <div className="mb-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 flex items-center justify-between">
          <span>
            Your Gmail connection is missing the new permissions (Sent / Labels). Reconnect to grant the wider scope.
          </span>
          <a
            href="/api/gmail/connect"
            className="ml-3 px-3 py-1.5 text-sm font-medium bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
          >
            Reconnect Gmail
          </a>
        </div>
      )}

      {/* Three-column layout: folders/labels sidebar · thread list · detail */}
      <div className="flex-1 grid grid-cols-[200px_360px_1fr] gap-0 border border-dash-border rounded-xl overflow-hidden bg-dash-surface min-h-0">
        {/* Folders + Labels sidebar */}
        <aside className="border-r border-dash-border overflow-y-auto bg-dash-bg/30">
          <div className="px-3 py-2 border-b border-dash-border text-[11px] uppercase tracking-wider font-semibold text-dash-text-secondary">
            Folders
          </div>
          <ul className="py-1">
            {SYSTEM_FOLDERS.map((f) => {
              const Icon = f.icon;
              const active = selectedLabel === f.id;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => selectFolder(f.id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                      active
                        ? "bg-brand-copper/15 text-brand-copper font-medium"
                        : "text-dash-text hover:bg-dash-bg"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{f.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {labels.filter((l) => l.type === "user" || !SYSTEM_LABEL_IDS_TO_HIDE.has(l.id)).length > 0 && (
            <>
              <div className="px-3 py-2 mt-2 border-t border-b border-dash-border text-[11px] uppercase tracking-wider font-semibold text-dash-text-secondary">
                Labels
              </div>
              <ul className="py-1">
                {labels
                  .filter(
                    (l) => l.type === "user" || !SYSTEM_LABEL_IDS_TO_HIDE.has(l.id)
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((l) => {
                    const active = selectedLabel === l.id;
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => selectFolder(l.id)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                            active
                              ? "bg-brand-copper/15 text-brand-copper font-medium"
                              : "text-dash-text hover:bg-dash-bg"
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <Tag className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{l.name}</span>
                          </span>
                          {(l.messagesUnread ?? 0) > 0 && (
                            <span className="text-[10px] font-mono text-dash-text-secondary shrink-0">
                              {l.messagesUnread}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </>
          )}
        </aside>

        {/* Thread list */}
        <div className="border-r border-dash-border overflow-y-auto">
          {selectedIds.size > 0 ? (
            <div className="px-3 py-2 border-b border-dash-border flex items-center justify-between gap-2 bg-brand-copper/5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={clearSelection}
                  className="text-dash-text-secondary hover:text-dash-text cursor-pointer"
                  title="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-semibold text-dash-text">
                  {selectedIds.size} selected
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => runBulk("archive")}
                  disabled={bulkRunning !== null}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium border border-dash-border rounded hover:bg-dash-bg cursor-pointer disabled:opacity-50"
                  title="Archive selected"
                >
                  {bulkRunning === "archive" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Archive className="w-3 h-3" />
                  )}
                  Archive
                </button>
                <button
                  onClick={() => runBulk("create_lead")}
                  disabled={bulkRunning !== null}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-brand-copper text-white rounded hover:bg-brand-copper/90 cursor-pointer disabled:opacity-50"
                  title="Create a Lead from each selected thread"
                >
                  {bulkRunning === "create_lead" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <UserPlus className="w-3 h-3" />
                  )}
                  Create Leads
                </button>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 border-b border-dash-border flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold text-dash-text-secondary">
              <span>
                {SYSTEM_FOLDERS.find((f) => f.id === selectedLabel)?.label ??
                  labels.find((l) => l.id === selectedLabel)?.name ??
                  "Inbox"}
              </span>
              <span>
                {unreadCount} unread · {threads.length}
              </span>
            </div>
          )}
          {loadingThreads ? (
            <div className="flex items-center gap-2 px-3 py-6 text-xs text-dash-text-secondary">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading threads…
            </div>
          ) : error ? (
            <div className="px-3 py-6 text-xs text-dash-danger">{error}</div>
          ) : threads.length === 0 ? (
            <div className="px-3 py-6 text-xs text-dash-text-secondary">
              No threads match.
            </div>
          ) : (
            <ul>
              {threads.map((t) => {
                const active = t.threadId === selectedThreadId;
                const checked = selectedIds.has(t.threadId);
                return (
                  <li key={t.threadId}>
                    <div
                      className={`flex items-stretch border-b transition-colors group ${
                        active
                          ? "bg-brand-copper/10 border-dash-border"
                          : checked
                          ? "bg-brand-copper/5 border-dash-border/50"
                          : "hover:bg-dash-bg/40 border-dash-border/50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(t.threadId);
                        }}
                        className={`shrink-0 px-2 flex items-center cursor-pointer text-dash-text-secondary hover:text-brand-copper ${
                          checked ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
                        }`}
                        aria-label={checked ? "Deselect thread" : "Select thread"}
                        title={checked ? "Deselect thread" : "Select thread"}
                      >
                        {checked ? <CheckSquare className="w-3.5 h-3.5 text-brand-copper" /> : <Square className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setSelectedThreadId(t.threadId)}
                        className="flex-1 min-w-0 text-left pr-3 py-3 cursor-pointer"
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
                    </div>
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
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-dash-text truncate">
                    {threadDetail.subject}
                  </h3>
                  <p className="text-xs text-dash-text-secondary mt-0.5">
                    {threadDetail.messages.length} message
                    {threadDetail.messages.length === 1 ? "" : "s"}
                  </p>
                  <ThreadLabelChips
                    threadId={threadDetail.threadId}
                    labelIds={Array.from(
                      new Set(threadDetail.messages.flatMap((m) => m.labelIds))
                    )}
                    onChange={() => fetchThread(threadDetail.threadId)}
                    className="mt-2"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
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
                    onClick={createDealFromThread}
                    disabled={creatingDeal}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-brand-copper/40 text-brand-copper rounded-lg hover:bg-brand-copper/10 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {creatingDeal ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Briefcase className="w-3.5 h-3.5" />
                    )}
                    Create Deal
                  </button>
                  <div className="relative">
                    <button
                      onClick={openAttachPicker}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      Attach to Deal
                    </button>
                    {attachPickerOpen && (
                      <div className="absolute right-0 mt-1 w-80 bg-dash-surface border border-dash-border rounded-xl shadow-xl z-30 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-dash-border">
                          <p className="text-xs font-semibold text-dash-text">Pick a Deal</p>
                          <button
                            onClick={() => setAttachPickerOpen(false)}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-dash-bg text-dash-text-secondary cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="px-3 py-2 border-b border-dash-border">
                          <input
                            value={dealSearch}
                            onChange={(e) => setDealSearch(e.target.value)}
                            placeholder="Search deals…"
                            className="w-full px-2 py-1.5 text-xs bg-dash-bg border border-dash-border rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper"
                          />
                        </div>
                        {deals === null ? (
                          <div className="px-3 py-4 text-xs text-dash-text-secondary flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading deals…
                          </div>
                        ) : deals.length === 0 ? (
                          <p className="px-3 py-4 text-xs text-dash-text-secondary">
                            No deals yet. Create one from this thread.
                          </p>
                        ) : (
                          <ul className="max-h-72 overflow-y-auto">
                            {deals
                              .filter((d) => {
                                const q = dealSearch.toLowerCase();
                                return !q || d.name.toLowerCase().includes(q) || d.company.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
                              })
                              .slice(0, 50)
                              .map((d) => (
                                <li key={d.id}>
                                  <button
                                    onClick={() => attachToDeal(d.id)}
                                    disabled={!!attaching}
                                    className="w-full text-left px-3 py-2 hover:bg-dash-bg/50 transition-colors disabled:opacity-50 cursor-pointer"
                                  >
                                    <p className="text-xs text-dash-text truncate">{d.name || d.id}</p>
                                    <p className="text-[10px] text-dash-text-secondary truncate">
                                      {d.company} · {d.stage} · {d.id}
                                      {attaching === d.id ? " · attaching…" : ""}
                                    </p>
                                  </button>
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={openReply}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    Reply
                  </button>
                </div>
              </div>

              {/* Inline reply composer */}
              {replyOpen && (
                <div className="px-5 py-3 border-b border-dash-border bg-dash-bg/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                      Reply
                    </p>
                    <div className="flex items-center gap-2">
                      <EmailTemplatePicker
                        mode="reply"
                        userEmail={status.gmailAddress}
                        onApply={({ body }) => setReplyBody(body)}
                      />
                      <button
                        onClick={() => setReplyOpen(false)}
                        className="text-xs text-dash-text-secondary hover:text-dash-text cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 bg-dash-surface border border-dash-border rounded-lg text-sm text-dash-text resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
                  />
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button
                      onClick={sendReply}
                      disabled={!replyBody.trim() || sendingReply}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {sendingReply ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      {sendingReply ? "Sending…" : "Send reply"}
                    </button>
                  </div>
                </div>
              )}

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
                    <EmailBody
                      bodyHtml={m.bodyHtml}
                      bodyText={m.body}
                      fallbackSnippet={m.snippet}
                    />
                    <AttachmentGrid
                      messageId={m.messageId}
                      attachments={m.attachments}
                    />
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

      {/* Compose modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:pr-6 sm:pb-6 pointer-events-none">
          <div
            className="pointer-events-auto w-full sm:w-[560px] max-w-[calc(100vw-2rem)] bg-dash-surface border border-dash-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-dash-sidebar text-white">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4" />
                <p className="text-sm font-semibold">New message</p>
              </div>
              <button
                onClick={() => setComposeOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <input
                value={composeDraft.to}
                onChange={(e) => setComposeDraft((d) => ({ ...d, to: e.target.value }))}
                placeholder="To"
                className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
              />
              <input
                value={composeDraft.cc}
                onChange={(e) => setComposeDraft((d) => ({ ...d, cc: e.target.value }))}
                placeholder="Cc (optional)"
                className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
              />
              <input
                value={composeDraft.subject}
                onChange={(e) => setComposeDraft((d) => ({ ...d, subject: e.target.value }))}
                placeholder="Subject"
                className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
              />
              <textarea
                value={composeDraft.body}
                onChange={(e) => setComposeDraft((d) => ({ ...d, body: e.target.value }))}
                placeholder="Write your message…"
                rows={10}
                className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
              />
              <div className="flex items-center justify-between pt-2 border-t border-dash-border">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] text-dash-text-secondary truncate">
                    From {status.gmailAddress}
                  </span>
                  <EmailTemplatePicker
                    mode="compose"
                    userEmail={status.gmailAddress}
                    onApply={({ subject, body }) =>
                      setComposeDraft((d) => ({ ...d, subject, body }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setComposeOpen(false)}
                    className="px-3 py-1.5 text-xs border border-dash-border rounded-lg hover:bg-dash-bg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendCompose}
                    disabled={sendingCompose}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 cursor-pointer"
                  >
                    {sendingCompose ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    {sendingCompose ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxPage;
