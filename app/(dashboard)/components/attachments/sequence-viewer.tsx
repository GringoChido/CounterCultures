"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, X } from "lucide-react";
import { useFocusTrap } from "@/app/components/ui/use-focus-trap";

export interface SequenceViewerItem {
  id: string;
  name: string;
  mimetype: string;
  fileSize: number;
  driveFileId?: string;
  viewUrl?: string;
  downloadUrl?: string;
  inlineUrl?: string;
}

interface SequenceViewerProps {
  items: SequenceViewerItem[];
  startIndex: number;
  onClose: () => void;
}

const formatSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
};

const labelFor = (mime: string): string => {
  if (mime === "application/pdf") return "PDF";
  if (mime === "application/xml" || mime === "text/xml") return "XML";
  if (mime.startsWith("image/")) return mime.split("/")[1]?.toUpperCase() || "IMG";
  return mime.split("/")[1]?.toUpperCase() || "FILE";
};

const XML_CHAR_LIMIT = 5000;

const XmlPreview = ({ url }: { url: string }) => {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => {
        if (!cancelled) setText(t.slice(0, XML_CHAR_LIMIT));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => { cancelled = true; };
  }, [url]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-white/60">
        No se pudo cargar el XML. / Could not load XML.
      </div>
    );
  }
  if (text === null) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-white/40">
        Cargando… / Loading…
      </div>
    );
  }
  return (
    <pre className="max-h-[85vh] overflow-auto text-xs font-mono p-4 bg-black/60 text-green-300 rounded whitespace-pre-wrap break-all">
      {text}
      {text.length >= XML_CHAR_LIMIT && (
        <span className="block mt-2 text-white/40">… truncado a {XML_CHAR_LIMIT} caracteres / truncated …</span>
      )}
    </pre>
  );
};

const PdfPreview = ({ driveFileId, downloadUrl }: { driveFileId?: string; downloadUrl?: string }) => {
  const [iframeFailed, setIframeFailed] = useState(false);
  const [objectFailed, setObjectFailed] = useState(false);

  if (driveFileId && !iframeFailed) {
    return (
      <iframe
        src={`https://drive.google.com/file/d/${driveFileId}/preview`}
        referrerPolicy="no-referrer"
        className="w-full h-[85vh] bg-white rounded"
        onError={() => setIframeFailed(true)}
        title="PDF preview"
      />
    );
  }

  if (downloadUrl && !objectFailed) {
    return (
      <object
        data={downloadUrl}
        type="application/pdf"
        className="w-full h-[85vh] bg-white rounded"
      >
        <div className="flex items-center justify-center h-full text-sm text-white/60">
          <button
            type="button"
            onClick={() => setObjectFailed(true)}
            className="underline"
          >
            No se pudo previsualizar. / Could not preview.
          </button>
        </div>
      </object>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-white/60 gap-4">
      <p className="text-sm">Sin previsualización disponible. / No inline preview available.</p>
      {driveFileId && (
        <a
          href={`https://drive.google.com/file/d/${driveFileId}/view`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded hover:bg-white/20 text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir en Drive / Open in Drive
        </a>
      )}
    </div>
  );
};

const SequenceViewer = ({ items, startIndex, onClose }: SequenceViewerProps) => {
  const [current, setCurrent] = useState(Math.max(0, Math.min(startIndex, items.length - 1)));
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true);

  const item = items[current];

  const goPrev = useCallback(() => {
    setCurrent((i) => (i > 0 ? i - 1 : items.length - 1));
  }, [items.length]);

  const goNext = useCallback(() => {
    setCurrent((i) => (i < items.length - 1 ? i + 1 : 0));
  }, [items.length]);

  const handleDownload = useCallback(() => {
    if (!item) return;
    const url = item.downloadUrl || item.viewUrl;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }, [item]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          goNext();
          break;
        case "Home":
          e.preventDefault();
          setCurrent(0);
          break;
        case "End":
          e.preventDefault();
          setCurrent(items.length - 1);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "d":
          if (!e.ctrlKey && !e.metaKey) handleDownload();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, onClose, handleDownload, items.length]);

  if (!item) return null;

  const isImage = item.mimetype.startsWith("image/");
  const isPdf = item.mimetype === "application/pdf";
  const isXml = item.mimetype === "application/xml" || item.mimetype === "text/xml";

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Visor de documentos / Document viewer"
      className="fixed inset-0 z-[70] bg-black/90 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs text-white/50 tabular-nums shrink-0">
            {current + 1} / {items.length}
          </span>
          <span className="text-sm text-white truncate" title={item.name}>
            {item.name}
          </span>
          <span className="text-[10px] text-white/40 shrink-0">
            {labelFor(item.mimetype)} · {formatSize(item.fileSize)}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {item.downloadUrl && (
            <a
              href={item.downloadUrl}
              title="Descargar / Download"
              aria-label="Descargar / Download"
              className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
          {item.driveFileId && (
            <a
              href={`https://drive.google.com/file/d/${item.driveFileId}/view`}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir en Drive / Open in Drive"
              aria-label="Abrir en Drive / Open in Drive"
              className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Cerrar / Close"
            aria-label="Cerrar / Close"
            className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-12 py-4">
        {/* Previous button */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Anterior / Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Content area */}
        <div className="w-full max-w-5xl mx-auto flex items-center justify-center">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.inlineUrl ?? item.viewUrl ?? item.downloadUrl}
              alt={item.name}
              className="max-w-full max-h-[85vh] object-contain rounded"
            />
          ) : isPdf ? (
            <div className="w-full">
              <PdfPreview driveFileId={item.driveFileId} downloadUrl={item.downloadUrl} />
            </div>
          ) : isXml && item.downloadUrl ? (
            <div className="w-full max-h-[85vh]">
              <XmlPreview url={item.downloadUrl} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-white/60">
              <p className="text-sm">
                Sin previsualización disponible. / No inline preview available.
              </p>
              {item.downloadUrl && (
                <a
                  href={item.downloadUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded hover:bg-white/20 text-sm text-white"
                >
                  <Download className="w-4 h-4" />
                  Descargar / Download
                </a>
              )}
            </div>
          )}
        </div>

        {/* Next button */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Siguiente / Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Footer — keyboard hint */}
      <div className="px-4 py-2 bg-black/60 border-t border-white/10 text-center">
        <span className="text-[10px] text-white/30">
          ← → navegar · Esc cerrar · D descargar / ← → navigate · Esc close · D download
        </span>
      </div>
    </div>
  );
};

export default SequenceViewer;
