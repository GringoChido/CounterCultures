"use client";

/**
 * <NotesPanel /> — reusable notes timeline + add-note textarea for any entity.
 *
 * Drops into any detail surface with one line:
 *   <NotesPanel entityType="lead" entityId={lead.id} />
 *
 * Backed by /api/dashboard/notes (sheet-backed). One data model for
 * lead / deal / shipment / trade_app / blog_post / whatsapp_thread notes.
 */

import { useCallback, useEffect, useState } from "react";
import { Loader2, Send, StickyNote } from "lucide-react";
import type { EntityType } from "@/app/lib/notes";

interface NoteItem {
  noteId: string;
  entityType: EntityType;
  entityId: string;
  authorEmail: string;
  timestamp: string;
  content: string;
}

interface NotesPanelProps {
  entityType: EntityType;
  entityId: string;
  authorEmail?: string;
  title?: string;
}

const formatTime = (iso: string): string => {
  try {
    const d = new Date(iso);
    const today = new Date();
    const sameDay =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    if (sameDay) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
};

const initials = (email: string): string => {
  if (!email) return "·";
  const local = email.split("@")[0] ?? email;
  return local.slice(0, 2).toUpperCase();
};

export const NotesPanel = ({
  entityType,
  entityId,
  authorEmail = "admin@countercultures.com.mx",
  title = "Notes",
}: NotesPanelProps) => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard/notes?entityType=${encodeURIComponent(
          entityType
        )}&entityId=${encodeURIComponent(entityId)}`
      );
      const data = await res.json();
      setNotes((data.notes ?? []) as NoteItem[]);
      setError(null);
    } catch (err) {
      console.error("[NotesPanel] fetch failed", err);
      setError("Couldn't load notes.");
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const submitNote = async () => {
    const content = draft.trim();
    if (!content || saving) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, authorEmail, content }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = await res.json();
      setNotes((prev) => [data.note as NoteItem, ...prev]);
      setDraft("");
    } catch (err) {
      console.error("[NotesPanel] save failed", err);
      setError("Couldn't save note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary flex items-center gap-1.5">
          <StickyNote className="w-3.5 h-3.5" />
          {title}
          {notes.length > 0 && (
            <span className="text-dash-text-secondary/60 font-normal">
              ({notes.length})
            </span>
          )}
        </h4>
      </div>

      {/* Add note */}
      <div className="space-y-2 mb-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submitNote();
            }
          }}
          placeholder="Add a note — ⌘↵ to save…"
          rows={2}
          className="w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-sm text-dash-text placeholder:text-dash-text-secondary/50 resize-none focus:outline-none focus:ring-2 focus:ring-brand-copper/30"
        />
        <div className="flex items-center justify-between">
          {error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : (
            <span className="text-[10px] text-dash-text-secondary">
              as {authorEmail}
            </span>
          )}
          <button
            onClick={submitNote}
            disabled={!draft.trim() || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            {saving ? "Saving" : "Save note"}
          </button>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-dash-text-secondary">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading…
        </div>
      ) : notes.length === 0 ? (
        <p className="text-xs text-dash-text-secondary/70 py-3">
          No notes yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.noteId} className="flex gap-2.5">
              <div
                className="w-7 h-7 shrink-0 rounded-full bg-brand-copper/10 text-brand-copper border border-brand-copper/20 flex items-center justify-center text-[10px] font-semibold"
                title={n.authorEmail}
              >
                {initials(n.authorEmail)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-dash-text-secondary truncate">
                    {n.authorEmail.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-dash-text-secondary/60">
                    {formatTime(n.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-dash-text whitespace-pre-wrap leading-relaxed">
                  {n.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
