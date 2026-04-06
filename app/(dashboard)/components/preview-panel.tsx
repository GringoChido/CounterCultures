"use client";

import { useState } from "react";
import {
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Film,
  FileIcon,
  File,
  Loader2,
  Download,
  Send,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { detectDocumentType, getDocumentTypeLabel } from "@/app/lib/document-numbers";
import type { DocumentType } from "@/app/lib/document-numbers";
import type { PipelineDeal } from "@/app/lib/sample-dashboard-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PreviewFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string | null;
  size?: string;
  modifiedTime?: string;
}

/** Optional document context passed when previewing a document from pipeline */
export interface DocumentContext {
  docId?: string;
  docType?: DocumentType;
  customerName?: string;
  customerEmail?: string;
  status?: string;
  deal?: PipelineDeal | null;
}

interface PreviewPanelProps {
  file: PreviewFile | null;
  onClose: () => void;
  /** Optional context for document-aware actions */
  documentContext?: DocumentContext;
  /** Callback when user clicks Edit on a document */
  onEdit?: (docType: DocumentType, docId: string) => void;
  /** Callback when user clicks Send on a document */
  onSend?: (docId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers — build the right embed URL for each Google file type
// ---------------------------------------------------------------------------

const GOOGLE_MIME = {
  doc: "application/vnd.google-apps.document",
  sheet: "application/vnd.google-apps.spreadsheet",
  slides: "application/vnd.google-apps.presentation",
  drawing: "application/vnd.google-apps.drawing",
  form: "application/vnd.google-apps.form",
  folder: "application/vnd.google-apps.folder",
} as const;

function getEmbedUrl(file: PreviewFile): string | null {
  const { mimeType, id } = file;

  // Google Docs → /preview
  if (mimeType === GOOGLE_MIME.doc) {
    return `https://docs.google.com/document/d/${id}/preview`;
  }

  // Google Sheets → /preview (shows first sheet)
  if (mimeType === GOOGLE_MIME.sheet) {
    return `https://docs.google.com/spreadsheets/d/${id}/preview`;
  }

  // Google Slides → /embed (presentation mode)
  if (mimeType === GOOGLE_MIME.slides) {
    return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`;
  }

  // Google Drawings
  if (mimeType === GOOGLE_MIME.drawing) {
    return `https://docs.google.com/drawings/d/${id}/preview`;
  }

  // Google Forms
  if (mimeType === GOOGLE_MIME.form) {
    return `https://docs.google.com/forms/d/${id}/viewform?embedded=true`;
  }

  // PDF files — use Google Docs viewer
  if (mimeType === "application/pdf") {
    return `https://drive.google.com/file/d/${id}/preview`;
  }

  // Images — direct Drive preview
  if (mimeType.startsWith("image/")) {
    return `https://drive.google.com/file/d/${id}/preview`;
  }

  // Video — Drive preview
  if (mimeType.startsWith("video/")) {
    return `https://drive.google.com/file/d/${id}/preview`;
  }

  // Audio
  if (mimeType.startsWith("audio/")) {
    return `https://drive.google.com/file/d/${id}/preview`;
  }

  // Generic — try Google Drive viewer for anything else
  if (id) {
    return `https://drive.google.com/file/d/${id}/preview`;
  }

  return null;
}

function getFileIcon(mimeType: string) {
  if (mimeType === GOOGLE_MIME.doc || mimeType.includes("word"))
    return FileText;
  if (mimeType === GOOGLE_MIME.sheet || mimeType.includes("spreadsheet"))
    return FileSpreadsheet;
  if (mimeType === GOOGLE_MIME.slides || mimeType.includes("presentation"))
    return Presentation;
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType === "application/pdf") return FileText;
  return FileIcon;
}

function getFileTypeLabel(mimeType: string): string {
  if (mimeType === GOOGLE_MIME.doc) return "Google Doc";
  if (mimeType === GOOGLE_MIME.sheet) return "Google Sheet";
  if (mimeType === GOOGLE_MIME.slides) return "Google Slides";
  if (mimeType === GOOGLE_MIME.drawing) return "Google Drawing";
  if (mimeType === GOOGLE_MIME.form) return "Google Form";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.includes("word")) return "Word Document";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "Spreadsheet";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "Presentation";
  return "File";
}

function getFileColor(mimeType: string): string {
  if (mimeType === GOOGLE_MIME.doc || mimeType.includes("word"))
    return "text-blue-500";
  if (mimeType === GOOGLE_MIME.sheet || mimeType.includes("spreadsheet"))
    return "text-green-500";
  if (mimeType === GOOGLE_MIME.slides || mimeType.includes("presentation"))
    return "text-amber-500";
  if (mimeType.startsWith("image/")) return "text-pink-500";
  if (mimeType.startsWith("video/")) return "text-purple-500";
  if (mimeType === "application/pdf") return "text-red-500";
  return "text-dash-text-secondary";
}

function formatFileSize(bytes: string | undefined): string {
  if (!bytes || bytes === "0") return "";
  const num = parseInt(bytes, 10);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-dash-text-secondary/10 text-dash-text-secondary",
  Sent: "bg-blue-500/10 text-blue-400",
  Paid: "bg-status-won/10 text-status-won",
  Signed: "bg-emerald-500/10 text-emerald-400",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PreviewPanel({
  file,
  onClose,
  documentContext,
  onEdit,
  onSend,
}: PreviewPanelProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!file) return null;

  const embedUrl = getEmbedUrl(file);
  const Icon = getFileIcon(file.mimeType);
  const iconColor = getFileColor(file.mimeType);
  const typeLabel = getFileTypeLabel(file.mimeType);
  const sizeLabel = formatFileSize(file.size);
  const isFolder = file.mimeType === GOOGLE_MIME.folder;

  // Detect if this is a CC document from the file name
  const detectedDocType =
    documentContext?.docType ?? detectDocumentType(file.name);
  const isDocument = !!detectedDocType;
  const docId = documentContext?.docId ?? file.name.replace(/\.\w+$/, "");
  const docStatus = documentContext?.status ?? "Draft";

  // Positioning classes
  const panelClasses = fullscreen
    ? "fixed inset-0 z-[60]"
    : "fixed inset-y-0 right-0 w-[55%] min-w-[480px] max-w-[900px] z-[60]";

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = `https://drive.google.com/uc?export=download&id=${file.id}`;
      window.open(url, "_blank");
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[59] ${fullscreen ? "bg-black/70" : "bg-black/30"} transition-opacity`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`${panelClasses} bg-dash-surface flex flex-col shadow-2xl transition-all duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dash-border bg-dash-bg/50">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-lg bg-dash-bg border border-dash-border flex items-center justify-center shrink-0 ${iconColor}`}
            >
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-dash-text truncate">
                {file.name}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-dash-text-secondary">
                <span>{typeLabel}</span>
                {sizeLabel && (
                  <>
                    <span className="text-dash-border">&bull;</span>
                    <span>{sizeLabel}</span>
                  </>
                )}
                {file.modifiedTime && (
                  <>
                    <span className="text-dash-border">&bull;</span>
                    <span>
                      {new Date(file.modifiedTime).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {file.webViewLink && (
              <a
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-dash-bg transition-colors"
                title="Open in Google"
              >
                <ExternalLink className="w-4 h-4 text-dash-text-secondary" />
              </a>
            )}
            <button
              onClick={() => {
                setFullscreen(!fullscreen);
                setIframeLoaded(false);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
              title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? (
                <Minimize2 className="w-4 h-4 text-dash-text-secondary" />
              ) : (
                <Maximize2 className="w-4 h-4 text-dash-text-secondary" />
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-dash-text-secondary" />
            </button>
          </div>
        </div>

        {/* Document metadata strip */}
        {isDocument && (
          <div className="flex items-center gap-3 px-5 py-2 border-b border-dash-border bg-dash-bg/30 text-xs">
            <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-brand-copper">
              {getDocumentTypeLabel(detectedDocType!)}
            </span>
            <span className="text-dash-border">&bull;</span>
            <span className="text-dash-text-secondary font-['JetBrains_Mono',monospace]">
              {docId}
            </span>
            {documentContext?.customerName && (
              <>
                <span className="text-dash-border">&bull;</span>
                <span className="text-dash-text-secondary">
                  {documentContext.customerName}
                </span>
              </>
            )}
            <span
              className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[docStatus] ?? STATUS_STYLES.Draft}`}
            >
              {docStatus}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 relative overflow-hidden bg-[#f0f0f0]">
          {isFolder ? (
            <div className="flex flex-col items-center justify-center h-full text-dash-text-secondary gap-3">
              <File className="w-12 h-12 text-dash-text-secondary/30" />
              <p className="text-sm">Folders can&apos;t be previewed</p>
              {file.webViewLink && (
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-copper hover:underline"
                >
                  Open in Google Drive &rarr;
                </a>
              )}
            </div>
          ) : embedUrl ? (
            <>
              {/* Loading state */}
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-dash-bg z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-copper/50" />
                    <p className="text-xs text-dash-text-secondary">
                      Loading preview...
                    </p>
                  </div>
                </div>
              )}
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                onLoad={() => setIframeLoaded(true)}
                allow="autoplay"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                title={`Preview: ${file.name}`}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-dash-text-secondary gap-3">
              <FileIcon className="w-12 h-12 text-dash-text-secondary/30" />
              <p className="text-sm">Preview not available for this file type</p>
              {file.webViewLink && (
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-copper hover:underline"
                >
                  Open in Google Drive &rarr;
                </a>
              )}
            </div>
          )}
        </div>

        {/* Action bar — shown for all files, enhanced for documents */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-dash-border bg-dash-bg/50">
          {isDocument && detectedDocType && onEdit && (
            <button
              onClick={() => onEdit(detectedDocType, docId)}
              className="flex items-center gap-2 px-3 py-2 text-xs border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
          {isDocument && onSend && (
            <button
              onClick={() => onSend(docId)}
              className="flex items-center gap-2 px-3 py-2 text-xs bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-3 py-2 text-xs border border-dash-border rounded-lg hover:bg-dash-bg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Download
          </button>
          {file.webViewLink && (
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-xs border border-dash-border rounded-lg hover:bg-dash-bg transition-colors ml-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Drive
            </a>
          )}
        </div>
      </div>
    </>
  );
}
