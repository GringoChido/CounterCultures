"use client";

/**
 * Per-item Spanish manuales status + Drive file editor (R4 Note 6 — 6a).
 *
 * Roger uploads the Spanish manual PDFs to Drive (separate workflow),
 * then pastes the file ID(s) here so the broker / Tonina can find them
 * during pedimento prep. The inline editor avoids a separate page —
 * Roger sees status, edits status, attaches IDs, all without leaving
 * the shipment detail.
 */

import { useState } from "react";
import { Loader2, FileText, Plus, X } from "lucide-react";
import { toast } from "sonner";

type ManualesStatus = "not-needed" | "on-file" | "in-translation" | "sent-to-broker";

const STATUS_OPTIONS: { value: ManualesStatus; label: string }[] = [
  { value: "not-needed", label: "Not needed" },
  { value: "in-translation", label: "In translation" },
  { value: "on-file", label: "On file" },
  { value: "sent-to-broker", label: "Sent to broker" },
];

const STATUS_TONE: Record<ManualesStatus, string> = {
  "not-needed": "bg-dash-bg text-dash-text-secondary border-dash-border",
  "in-translation": "bg-dash-warn-soft text-dash-warn border-dash-warn/40",
  "on-file": "bg-brand-sage/10 text-brand-sage border-brand-sage/30",
  "sent-to-broker": "bg-brand-copper/10 text-brand-copper border-brand-copper/30",
};

interface ManualesEditorProps {
  traficoId: string;
  itemId: string;
  initialRequired: boolean;
  initialStatus: ManualesStatus;
  initialDriveFileIds: string[];
  /** Called after a successful save so the parent can refresh. */
  onSaved?: () => void;
}

export const ManualesEditor = ({
  traficoId,
  itemId,
  initialRequired,
  initialStatus,
  initialDriveFileIds,
  onSaved,
}: ManualesEditorProps) => {
  const [required, setRequired] = useState(initialRequired);
  const [status, setStatus] = useState<ManualesStatus>(initialStatus);
  const [fileIds, setFileIds] = useState<string[]>(initialDriveFileIds);
  const [draftId, setDraftId] = useState("");
  const [saving, setSaving] = useState(false);

  const dirty =
    required !== initialRequired ||
    status !== initialStatus ||
    fileIds.length !== initialDriveFileIds.length ||
    fileIds.some((id, i) => id !== initialDriveFileIds[i]);

  const addFileId = () => {
    const trimmed = draftId.trim();
    if (!trimmed) return;
    if (fileIds.includes(trimmed)) {
      setDraftId("");
      return;
    }
    setFileIds([...fileIds, trimmed]);
    setDraftId("");
  };

  const removeFileId = (id: string) => {
    setFileIds(fileIds.filter((f) => f !== id));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/dashboard/traficos/${encodeURIComponent(traficoId)}/items/manuales`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId,
            required,
            status,
            driveFileIds: fileIds,
          }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      toast.success("Manuales updated");
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-dash-border rounded p-3 space-y-3 bg-dash-bg/30">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-dash-text-secondary" />
          <span className="text-xs font-medium text-dash-text">Spanish manuals</span>
        </div>
        <label className="flex items-center gap-1.5 text-[11px] text-dash-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="cursor-pointer"
          />
          Required
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ManualesStatus)}
          className={`text-xs px-2 py-1 rounded border ${STATUS_TONE[status]} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper`}
          disabled={!required}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {required && (
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
            Drive file IDs
          </label>
          {fileIds.length > 0 && (
            <div className="space-y-1">
              {fileIds.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-2 text-[11px] bg-dash-surface px-2 py-1 rounded border border-dash-border"
                >
                  <a
                    href={`https://drive.google.com/file/d/${id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-brand-copper hover:underline truncate flex-1 min-w-0"
                  >
                    {id}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeFileId(id)}
                    className="text-dash-text-secondary hover:text-dash-danger"
                    aria-label="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addFileId();
                }
              }}
              placeholder="Paste Drive file ID"
              className="flex-1 text-[11px] font-mono px-2 py-1 rounded border border-dash-border bg-dash-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
            />
            <button
              type="button"
              onClick={addFileId}
              disabled={!draftId.trim()}
              className="text-xs px-2 py-1 rounded border border-dash-border text-dash-text-secondary hover:text-dash-text disabled:opacity-50"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {dirty && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded bg-brand-copper text-white hover:bg-brand-copper/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Save
          </button>
        </div>
      )}
    </div>
  );
};
