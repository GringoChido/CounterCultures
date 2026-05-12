"use client";

import { useEffect, useState } from "react";
import { Paperclip, Download, ExternalLink, FileText, FileImage, FileArchive, File, Eye } from "lucide-react";
import SequenceViewer from "@/app/(dashboard)/components/attachments/sequence-viewer";

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

const AttachmentsPanel = ({ resModel, resId }: AttachmentsPanelProps) => {
  const [items, setItems] = useState<AttachmentRow[] | null>(null);
  const [error, setError] = useState(false);
  const [viewerOpenAt, setViewerOpenAt] = useState<number | null>(null);

  useEffect(() => {
    if (!resId) return;
    const params = new URLSearchParams({ resModel, resId });
    fetch(`/api/dashboard/attachments?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setError(true));
  }, [resModel, resId]);

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
            {items.length === 0 ? "none" : `${items.length} file${items.length === 1 ? "" : "s"}`}
          </span>
          {items.length > 0 && (
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
            return (
              <li key={a.id} className="px-5 py-3 flex items-center gap-3">
                <Icon className="w-4 h-4 text-dash-text-secondary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dash-text truncate" title={a.name}>
                    {a.name}
                  </p>
                  <p className="text-[11px] text-dash-text-secondary mt-0.5">
                    {labelFor(a.mimetype)} · {formatSize(a.fileSize)}
                    {a.createdAt && ` · ${a.createdAt}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewerOpenAt(idx)}
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
                  <a
                    href={
                      a.driveFileId
                        ? `/api/dashboard/attachments/download?fileId=${encodeURIComponent(a.driveFileId)}`
                        : a.downloadUrl
                    }
                    title="Download"
                    className="p-1.5 rounded hover:bg-dash-bg text-dash-text-secondary hover:text-dash-text transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {viewerOpenAt !== null && items && items.length > 0 && (
        <SequenceViewer
          items={items.map((it) => ({
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
          startIndex={viewerOpenAt}
          onClose={() => setViewerOpenAt(null)}
        />
      )}
    </div>
  );
};

export { AttachmentsPanel };
