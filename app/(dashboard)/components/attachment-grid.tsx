"use client";

/**
 * <AttachmentGrid /> — Gmail-Desktop-style row of attachment cards under
 * a message. Image attachments show as thumbnails (lazy-loaded), other
 * file types as icons + filename + size + download button. Clicking an
 * image card opens a lightbox at full size.
 *
 * Inline images (those referenced by cid: in the body HTML) are filtered
 * out — they're already shown in the body via gmail.ts cid resolution.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Cloud,
  Download,
  File as FileIcon,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Loader2,
  X,
} from "lucide-react";

interface AttachmentLike {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
  inline: boolean;
}

interface Props {
  messageId: string;
  attachments: AttachmentLike[];
}

const formatBytes = (n: number): string => {
  if (!n) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const isImage = (mime: string): boolean => mime.toLowerCase().startsWith("image/");

const iconFor = (mime: string) => {
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return FileImage;
  if (m.startsWith("video/")) return FileVideo;
  if (m.startsWith("audio/")) return FileAudio;
  if (m.includes("pdf")) return FileText;
  if (m.includes("spreadsheet") || m.includes("excel") || m.includes("csv")) {
    return FileSpreadsheet;
  }
  if (m.includes("word") || m.includes("document") || m.includes("text/")) {
    return FileText;
  }
  if (m.includes("zip") || m.includes("compressed") || m.includes("tar") || m.includes("rar")) {
    return FileArchive;
  }
  return FileIcon;
};

const inlineUrl = (messageId: string, attachmentId: string): string =>
  `/api/gmail/attachment/${encodeURIComponent(messageId)}/${encodeURIComponent(attachmentId)}?inline=1`;

const downloadUrl = (messageId: string, attachmentId: string): string =>
  `/api/gmail/attachment/${encodeURIComponent(messageId)}/${encodeURIComponent(attachmentId)}`;

export const AttachmentGrid = ({ messageId, attachments }: Props) => {
  const visible = attachments.filter((a) => !a.inline);
  const [lightbox, setLightbox] = useState<AttachmentLike | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // ESC to close lightbox
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const saveToDrive = async (att: AttachmentLike) => {
    setSavingId(att.attachmentId);
    try {
      const r = await fetch("/api/gmail/attachment/to-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, attachmentId: att.attachmentId }),
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
              onClick: () =>
                window.open(data.webViewLink, "_blank", "noopener,noreferrer"),
            }
          : undefined,
      });
    } catch (err) {
      console.error("[AttachmentGrid] save failed", err);
      toast.error("Couldn't save to Drive");
    } finally {
      setSavingId(null);
    }
  };

  if (visible.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3 pt-3 border-t border-dash-border/60">
        {visible.map((a) => {
          const Icon = iconFor(a.mimeType);
          const image = isImage(a.mimeType);
          return (
            <div
              key={a.attachmentId}
              className="group relative bg-dash-surface border border-dash-border rounded-lg overflow-hidden hover:border-brand-copper/50 transition-colors"
            >
              {image ? (
                <button
                  type="button"
                  onClick={() => setLightbox(a)}
                  className="block w-full aspect-[4/3] bg-dash-bg cursor-pointer"
                  title={`View ${a.filename}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={inlineUrl(messageId, a.attachmentId)}
                    alt={a.filename}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ) : (
                <a
                  href={downloadUrl(messageId, a.attachmentId)}
                  download={a.filename}
                  className="flex items-center justify-center w-full aspect-[4/3] bg-dash-bg text-dash-text-secondary hover:text-brand-copper cursor-pointer"
                  title={`Download ${a.filename}`}
                >
                  <Icon className="w-10 h-10" />
                </a>
              )}
              <div className="px-2 py-1.5 flex items-center gap-1 border-t border-dash-border/60">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[11px] font-medium text-dash-text truncate"
                    title={a.filename}
                  >
                    {a.filename}
                  </p>
                  <p className="text-[10px] text-dash-text-secondary">
                    {formatBytes(a.size)}
                  </p>
                </div>
                <a
                  href={downloadUrl(messageId, a.attachmentId)}
                  download={a.filename}
                  className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded hover:bg-brand-copper/10 hover:text-brand-copper text-dash-text-secondary cursor-pointer"
                  title="Download"
                  aria-label={`Download ${a.filename}`}
                >
                  <Download className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => saveToDrive(a)}
                  disabled={savingId === a.attachmentId}
                  className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded hover:bg-brand-copper/10 hover:text-brand-copper text-dash-text-secondary cursor-pointer disabled:opacity-50"
                  title="Save to Drive"
                  aria-label={`Save ${a.filename} to Drive`}
                >
                  {savingId === a.attachmentId ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Cloud className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <a
            href={downloadUrl(messageId, lightbox.attachmentId)}
            download={lightbox.filename}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
          <div className="absolute bottom-4 left-4 text-white/80 text-xs">
            {lightbox.filename}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={inlineUrl(messageId, lightbox.attachmentId)}
            alt={lightbox.filename}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>
      )}
    </>
  );
};
