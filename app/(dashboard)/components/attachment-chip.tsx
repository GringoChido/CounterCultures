"use client";

/**
 * <AttachmentChip /> — one Gmail attachment with download + Save-to-Drive.
 *
 * Self-contained pending state per attachment so multiple uploads can run
 * in parallel without state collisions in the parent.
 */

import { useState } from "react";
import { toast } from "sonner";
import { Cloud, Download, Loader2 } from "lucide-react";

interface Props {
  messageId: string;
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
}

export const AttachmentChip = ({
  messageId,
  attachmentId,
  filename,
  mimeType,
  size,
}: Props) => {
  const [saving, setSaving] = useState(false);

  const saveToDrive = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/gmail/attachment/to-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, attachmentId }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error || "Couldn't save to Drive");
        return;
      }
      toast.success("Saved to Drive", {
        description: `${data.folder?.name || "folder"} / ${data.name}`,
        action: data.webViewLink
          ? {
              label: "Open",
              onClick: () => window.open(data.webViewLink, "_blank", "noopener,noreferrer"),
            }
          : undefined,
      });
    } catch (err) {
      console.error("[AttachmentChip] save failed", err);
      toast.error("Couldn't save to Drive");
    } finally {
      setSaving(false);
    }
  };

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] pl-2 pr-1 py-0.5 bg-dash-surface border border-dash-border rounded text-dash-text hover:border-brand-copper/40 transition-colors"
      title={`${filename} · ${mimeType} · ${Math.round(size / 1024)} KB`}
    >
      <a
        href={`/api/gmail/attachment/${encodeURIComponent(messageId)}/${encodeURIComponent(attachmentId)}`}
        download={filename}
        className="hover:text-brand-copper inline-flex items-center gap-1"
      >
        <Download className="w-2.5 h-2.5" />
        {filename}
      </a>
      <button
        type="button"
        onClick={saveToDrive}
        disabled={saving}
        className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded hover:bg-brand-copper/10 hover:text-brand-copper text-dash-text-secondary cursor-pointer disabled:opacity-50"
        title="Save to Drive"
        aria-label="Save to Drive"
      >
        {saving ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Cloud className="w-2.5 h-2.5" />}
      </button>
    </span>
  );
};
