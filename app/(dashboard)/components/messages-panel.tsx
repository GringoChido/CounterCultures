"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Mail, Paperclip, Users, ChevronDown, ChevronRight } from "lucide-react";

interface MessageRow {
  id: string;
  messageType: string;
  date: string;
  subject: string;
  author: string;
  authorId: string;
  emailFrom: string;
  bodyText: string;
  bodyHtml: string;
  attachmentCount: number;
  recipientCount: number;
}

type PanelMode =
  | { resModel: string; resId: string }
  | { partnerId: string };

interface MessagesPanelProps {
  mode: PanelMode;
  title?: string;
  limit?: number;
}

const formatDate = (iso: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const MessageItem = ({ m }: { m: MessageRow }) => {
  const [open, setOpen] = useState(false);
  const Icon = m.messageType === "email" ? Mail : MessageCircle;
  const preview = m.bodyText.slice(0, 240);
  const hasMore = m.bodyText.length > 240 || m.bodyHtml !== m.bodyText;

  return (
    <li className="px-5 py-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 text-left"
        disabled={!hasMore}
      >
        <Icon className="w-4 h-4 text-dash-text-secondary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm text-dash-text font-medium">
              {m.author || "Unknown"}
            </span>
            <span className="text-[11px] text-dash-text-secondary">
              {formatDate(m.date)}
            </span>
            {m.messageType === "email" && (
              <span className="text-[10px] uppercase tracking-wider text-brand-copper/80">
                email
              </span>
            )}
          </div>
          {m.subject && (
            <p className="text-xs text-dash-text-secondary mt-0.5 truncate">
              {m.subject}
            </p>
          )}
          <p
            className={`text-sm text-dash-text mt-1 whitespace-pre-wrap ${
              open ? "" : "line-clamp-3"
            }`}
          >
            {open ? m.bodyText : preview}
          </p>
          {(m.attachmentCount > 0 || m.recipientCount > 0) && (
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-dash-text-secondary">
              {m.attachmentCount > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  {m.attachmentCount}
                </span>
              )}
              {m.recipientCount > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {m.recipientCount}
                </span>
              )}
            </div>
          )}
        </div>
        {hasMore && (
          <span className="text-dash-text-muted mt-0.5">
            {open ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
      </button>
    </li>
  );
};

const MessagesPanel = ({ mode, title = "Messages", limit = 20 }: MessagesPanelProps) => {
  const [items, setItems] = useState<MessageRow[] | null>(null);
  const [error, setError] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if ("partnerId" in mode) params.set("partnerId", mode.partnerId);
    else {
      params.set("resModel", mode.resModel);
      params.set("resId", mode.resId);
    }
    fetch(`/api/dashboard/messages?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setError(true));
  }, [mode]);

  if (error) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-md p-5">
        <p className="text-xs text-dash-text-secondary">Messages unavailable.</p>
      </div>
    );
  }

  if (items === null) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-md p-5">
        <div className="h-3 w-24 bg-dash-bg rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 bg-dash-bg rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const visible = showAll ? items : items.slice(0, limit);

  return (
    <div className="bg-dash-surface border border-dash-border rounded-md">
      <div className="px-5 pt-4 pb-3 flex items-baseline justify-between border-b border-dash-border/60">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5 text-dash-text-secondary" />
          <h2 className="text-sm font-medium text-dash-text">{title}</h2>
        </div>
        <span className="text-xs text-dash-text-secondary">
          {items.length === 0
            ? "none"
            : `${items.length} message${items.length === 1 ? "" : "s"}`}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-4">
          <p className="text-xs text-dash-text-secondary">
            No messages on this record yet.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-dash-border/60">
            {visible.map((m) => (
              <MessageItem key={m.id} m={m} />
            ))}
          </ul>
          {items.length > limit && (
            <div className="px-5 py-3 border-t border-dash-border/60">
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-xs text-dash-text-secondary hover:text-dash-text"
              >
                {showAll
                  ? "Show fewer"
                  : `Show all ${items.length} messages`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export { MessagesPanel };
