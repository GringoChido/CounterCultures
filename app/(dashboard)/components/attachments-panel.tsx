"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Paperclip, Download, ExternalLink, FileText, FileImage, FileArchive, File, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SequenceViewer from "@/app/(dashboard)/components/attachments/sequence-viewer";
import {
  classifyAttachment,
  applyOverrides,
  isHidden,
  type AttachmentVisibility,
} from "@/app/lib/attachment-visibility";

interface AttachmentRow {
  id: string;
  name: string;
  mimetype: string;
  fileSize: number;
  createdAt: string;
  driveFileId: string;
  viewUrl: string;
  downloadUrl: string;
}

interface AttachmentsPanelProps {
  resModel: string;
  resId: string;
}

const iconFor = (mime: string): React.ElementType => {
  if (mime.startsWith("image/")) return FileImage;
  if (mime === "application/pdf") return FileText;
  if (mime === "application/xml" || mime === "text/xml") return FileText;
  if (mime.includes("zip") || mime.includes("rar")) return FileArchive;
  return File;
};

const formatSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
};

const labelFor = (mime: string): string => {
  if (mime === "application/pdf") return "PDF";
  if (mime === "application/xml" || mime === "text/xml") return "XML";
  if (mime.startsWith("image/")) return mime.split("/")[1].toUpperCase();
  if (mime.includes("zip")) return "ZIP";
  if (mime.includes("rar")) return "RAR";
  return mime.split("/")[1]?.toUpperCase() || "FILE";
};

const hashFn = (name: string): string => {
  let h = 0;
  const s = name.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
};

const AttachmentsPanel = ({ resModel, resId }: AttachmentsPanelProps) => {
  const [items, setItems] = useState<AttachmentRow[] | null>(null);
  const [error, setError] = useState(false);
  const [viewerOpenAt, setViewerOpenAt] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<Record<string, "user-show" | "user-hide">>({});
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (a: AttachmentRow) => {
    const url = a.driveFileId
      ? `/api/dashboard/attachments/download?fileId=${encodeURIComponent(a.driveFileId)}`
      : a.downloadUrl;
    setDownloading(a.id);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = a.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast.error(`Download failed: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setDownloading(null);
    }
  };

  useEffect(() => {
    if (!resId) return;
    const params = new URLSearchParams({ resModel, resId });
    fetch(`/api/dashboard/attachments?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setError(true));
  }, [resModel, resId]);

  useEffect(() => {
    if (!resId) return;
    const params = new URLSearchParams({ resModel, resId });
    fetch(`/api/dashboard/attachments/visibility?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { overrides: {} }))
      .then((d) => setOverrides(d.overrides ?? {}))
      .catch(() => {});
  }, [resModel, resId]);

  const visMap = useMemo(() => {
    if (!items) return new Map<string, AttachmentVisibility>();
    const map = new Map<string, AttachmentVisibility>();
    for (const a of items) {
      const auto = classifyAttachment({ name: a.name, mimetype: a.mimetype, fileSize: a.fileSize });
      const fnHash = hashFn(a.name);
      const override = overrides[fnHash] as AttachmentVisibility | undefined;
      map.set(a.id, applyOverrides(auto, override));
    }
    return map;
  }, [items, overrides]);

  const hiddenCount = useMemo(() => {
    let n = 0;
    for (const v of visMap.values()) if (isHidden(v)) n++;
    return n;
  }, [visMap]);

  const visibleItems = useMemo(() => {
    if (!items) return [];
    return items.filter((a) => !isHidden(visMap.get(a.id) ?? "auto-show"));
  }, [items, visMap]);

  const toggleVisibility = useCallback(
    async (a: AttachmentRow) => {
      const current = visMap.get(a.id) ?? "auto-show";
      const next: "user-show" | "user-hide" = isHidden(current) ? "user-show" : "user-hide";
      const fnHash = hashFn(a.name);
      setOverrides((prev) => ({ ...prev, [fnHash]: next }));
      try {
        await fetch("/api/dashboard/attachments/visibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resModel, resId, filename: a.name, visibility: next }),
        });
      } catch {
        setOverrides((prev) => {
          const copy = { ...prev };
          delete copy[fnHash];
          return copy;
        });
      }
    },
    [visMap, resModel, resId]
  );

  if (error) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-md p-5">
        <p className="text-xs text-dash-text-secondary">Attachments unavailable.</p>
      </div>
    );
  }

  if (items === null) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-md p-5">
        <div className="h-3 w-24 bg-dash-bg rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-10 bg-dash-bg rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dash-surface border border-dash-border rounded-md">
      <div className="px-5 pt-4 pb-3 flex items-baseline justify-between border-b border-dash-border/60">
        <div className="flex items-center gap-2">
          <Paperclip className="w-3.5 h-3.5 text-dash-text-secondary" />
          <h2 className="text-sm font-medium text-dash-text">Attachments</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dash-text-secondary">
            {items.length === 0
              ? "none"
              : `${items.length} file${items.length === 1 ? "" : "s"}`}
            {hiddenCount > 0 && (
              <span className="ml-1 text-dash-text-secondary/60">
                ({hiddenCount} oculto{hiddenCount === 1 ? "" : "s"} / hidden)
              </span>
            )}
          </span>
          {visibleItems.length > 0 && (
            <button
              type="button"
              onClick={() => setViewerOpenAt(0)}
              className="inline-flex items-center gap-1 text-[10px] text-dash-accent hover:text-dash-accent/80 transition-colors"
              aria-label="Ver secuencia / Preview all"
            >
              <Eye className="w-3 h-3" />
              Ver secuencia / Preview all
            </button>
          )}
        </div>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-4">
          <p className="text-xs text-dash-text-secondary">
            No files mirrored for this record.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-dash-border/60">
          {items.map((a, idx) => {
            const Icon = iconFor(a.mimetype);
            const vis = visMap.get(a.id) ?? "auto-show";
            const hidden = isHidden(vis);
            return (
              <li
                key={a.id}
                className={`px-5 py-3 flex items-center gap-3 ${hidden ? "opacity-60" : ""}`}
              >
                <Icon className="w-4 h-4 text-dash-text-secondary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-dash-text truncate" title={a.name}>
                      {a.name}
                    </p>
                    {hidden && (
                      <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-dash-bg text-dash-text-secondary">
                        Probable logotipo / Likely logo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-dash-text-secondary mt-0.5">
                    {labelFor(a.mimetype)} · {formatSize(a.fileSize)}
                    {a.createdAt && ` · ${a.createdAt}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleVisibility(a)}
                    title={hidden ? "Mostrar / Show" : "Ocultar / Hide"}
                    aria-label={hidden ? "Mostrar / Show" : "Ocultar / Hide"}
                    className="p-1.5 rounded hover:bg-dash-bg text-dash-text-secondary hover:text-dash-accent transition-colors"
                  >
                    {hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const visIdx = visibleItems.findIndex((v) => v.id === a.id);
                      setViewerOpenAt(visIdx >= 0 ? visIdx : idx);
                    }}
                    title="Previsualizar / Preview"
                    aria-label="Previsualizar / Preview"
                    className="p-1.5 rounded hover:bg-dash-bg text-dash-text-secondary hover:text-dash-accent transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={a.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in Drive"
                    className="p-1.5 rounded hover:bg-dash-bg text-dash-text-secondary hover:text-dash-text transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDownload(a)}
                    disabled={downloading === a.id}
                    title="Download"
                    className="p-1.5 rounded hover:bg-dash-bg text-dash-text-secondary hover:text-dash-text transition-colors disabled:opacity-50"
                  >
                    {downloading === a.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {hiddenCount > 0 && visibleItems.length < items.length && (
        <div className="px-5 py-2 border-t border-dash-border/60">
          <button
            type="button"
            onClick={() => {
              setViewerOpenAt(0);
            }}
            className="text-[10px] text-dash-text-secondary hover:text-dash-accent transition-colors"
          >
            Mostrar {hiddenCount} oculto{hiddenCount === 1 ? "" : "s"} en secuencia /
            Show {hiddenCount} hidden in sequence
          </button>
        </div>
      )}
      {viewerOpenAt !== null && visibleItems.length > 0 && (
        <SequenceViewer
          items={visibleItems.map((it) => ({
            id: it.id,
            name: it.name,
            mimetype: it.mimetype,
            fileSize: it.fileSize,
            driveFileId: it.driveFileId,
            viewUrl: it.viewUrl,
            downloadUrl: it.driveFileId
              ? `/api/dashboard/attachments/download?fileId=${encodeURIComponent(it.driveFileId)}`
              : it.downloadUrl,
          }))}
          startIndex={Math.min(viewerOpenAt, visibleItems.length - 1)}
          onClose={() => setViewerOpenAt(null)}
        />
      )}
    </div>
  );
};

export { AttachmentsPanel };
