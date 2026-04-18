"use client";

/**
 * <ThreadLabelChips /> — read + write Gmail labels on a thread.
 *
 * - Read direction: parent passes `labelIds` from the shaped thread; we
 *   filter system labels (INBOX, SENT, etc.) and resolve IDs → names
 *   from /api/gmail/labels.
 * - Write direction: chip × removes; "+" opens a dropdown of the user's
 *   remaining (non-applied) labels. Updates POST to
 *   /api/gmail/thread/[id]/labels and call onChange with the new IDs so
 *   the parent can refetch.
 *
 * Label *creation* stays in Gmail for v1 — link out to mail.google.com.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Tag, X } from "lucide-react";

interface Label {
  id: string;
  name: string;
  type: "system" | "user";
}

const HIDDEN_SYSTEM_LABELS = new Set([
  "INBOX",
  "SENT",
  "DRAFT",
  "UNREAD",
  "STARRED",
  "IMPORTANT",
  "TRASH",
  "SPAM",
  "CHAT",
  "CATEGORY_PERSONAL",
  "CATEGORY_SOCIAL",
  "CATEGORY_PROMOTIONS",
  "CATEGORY_UPDATES",
  "CATEGORY_FORUMS",
]);

interface Props {
  threadId: string;
  labelIds: string[];
  onChange?: (newLabelIds: string[]) => void;
  className?: string;
}

export const ThreadLabelChips = ({ threadId, labelIds, onChange, className = "" }: Props) => {
  const [allLabels, setAllLabels] = useState<Label[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null); // labelId being added/removed
  const ref = useRef<HTMLDivElement>(null);

  const fetchLabels = useCallback(async () => {
    try {
      const r = await fetch("/api/gmail/labels");
      if (!r.ok) return;
      const data = (await r.json()) as { labels: Label[] };
      setAllLabels(data.labels);
    } catch (err) {
      console.error("[ThreadLabelChips] labels fetch failed", err);
    }
  }, []);

  useEffect(() => {
    if (allLabels === null) fetchLabels();
  }, [allLabels, fetchLabels]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [pickerOpen]);

  const applied = (allLabels ?? [])
    .filter((l) => labelIds.includes(l.id) && !HIDDEN_SYSTEM_LABELS.has(l.id));
  const available = (allLabels ?? []).filter(
    (l) => l.type === "user" && !labelIds.includes(l.id)
  );

  const modify = async (changes: { add?: string[]; remove?: string[] }) => {
    const id = changes.add?.[0] || changes.remove?.[0] || "";
    setPending(id);
    try {
      const r = await fetch(`/api/gmail/thread/${encodeURIComponent(threadId)}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error || "Couldn't update label");
        return;
      }
      toast.success(changes.add ? "Label added" : "Label removed");
      onChange?.(data.labelIds || []);
    } catch (err) {
      console.error("[ThreadLabelChips] modify failed", err);
      toast.error("Couldn't update label");
    } finally {
      setPending(null);
      setPickerOpen(false);
    }
  };

  // Show chips for unresolved label IDs too (in case labels haven't loaded)
  // — but only non-system ones we wouldn't otherwise hide.
  const unresolvedIds = labelIds.filter(
    (id) => !HIDDEN_SYSTEM_LABELS.has(id) && !applied.find((a) => a.id === id)
  );

  return (
    <div ref={ref} className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      <Tag className="w-3 h-3 text-dash-text-secondary/60" />
      {applied.map((l) => (
        <span
          key={l.id}
          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-brand-copper/10 text-brand-copper border border-brand-copper/20 rounded"
        >
          {l.name}
          <button
            type="button"
            onClick={() => modify({ remove: [l.id] })}
            disabled={pending === l.id}
            className="hover:text-brand-copper/60 cursor-pointer disabled:opacity-50"
            title={`Remove ${l.name}`}
          >
            {pending === l.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <X className="w-2.5 h-2.5" />}
          </button>
        </span>
      ))}
      {allLabels !== null &&
        unresolvedIds.map((id) => (
          <span
            key={id}
            className="text-[10px] px-1.5 py-0.5 bg-dash-bg border border-dash-border rounded text-dash-text-secondary"
            title={id}
          >
            {id.replace(/^Label_\d+$/, "…")}
          </span>
        ))}
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 border border-dashed border-dash-border rounded text-dash-text-secondary hover:text-brand-copper hover:border-brand-copper/40 cursor-pointer"
          title="Add a label (create new ones in Gmail)"
        >
          <Plus className="w-2.5 h-2.5" />
          Label
        </button>
        {pickerOpen && (
          <div className="absolute z-40 left-0 mt-1 w-56 bg-dash-surface border border-dash-border rounded-lg shadow-2xl overflow-hidden">
            {allLabels === null ? (
              <div className="px-3 py-3 text-[11px] text-dash-text-secondary flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading…
              </div>
            ) : available.length === 0 ? (
              <div className="px-3 py-3 text-[11px] text-dash-text-secondary">
                No unused labels.{" "}
                <a
                  href="https://mail.google.com/mail/u/0/#settings/labels"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-copper hover:underline"
                >
                  Create one in Gmail →
                </a>
              </div>
            ) : (
              <ul className="py-1 max-h-64 overflow-y-auto">
                {available.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => modify({ add: [l.id] })}
                      disabled={pending === l.id}
                      className="w-full text-left px-3 py-1.5 text-xs text-dash-text hover:bg-dash-bg cursor-pointer disabled:opacity-50 flex items-center justify-between"
                    >
                      <span className="truncate">{l.name}</span>
                      {pending === l.id && <Loader2 className="w-3 h-3 animate-spin" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="px-3 py-1.5 text-[10px] text-dash-text-secondary border-t border-dash-border bg-dash-bg/40">
              Create new labels in{" "}
              <a
                href="https://mail.google.com/mail/u/0/#settings/labels"
                target="_blank"
                rel="noreferrer"
                className="text-brand-copper hover:underline"
              >
                Gmail
              </a>
              .
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
