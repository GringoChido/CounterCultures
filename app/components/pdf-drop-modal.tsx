"use client";

import { useCallback, useRef, useState } from "react";
import {
  X,
  Upload,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import type { ProductFull } from "@/app/lib/products-full";
import type { PdfMatch } from "@/app/lib/pdf-extraction";

export interface PdfDropResult {
  product: ProductFull;
  quantity: number;
  finish?: string;
}

interface PdfDropModalProps {
  open: boolean;
  onClose: () => void;
  /** Called once the user accepts. Each entry is a confirmed catalog match. */
  onCommit: (results: PdfDropResult[]) => void | Promise<void>;
  locale?: "en" | "es";
  /** Free-form label so the same modal works on /shop and /dashboard */
  ctaLabel?: string;
  /** Theme switch — public uses brand-linen, dashboard uses dash-bg */
  theme?: "public" | "dashboard";
}

const T = {
  en: {
    title: "Drop a spec PDF",
    subtitle:
      "We'll read every product reference, match it against the 354,000-piece catalog, and let you review before adding.",
    dragHere: "Drop a PDF here, or click to browse",
    pdfOnly: "PDF only · 20 MB max",
    extracting: "Reading the spec sheet…",
    extractError: "Couldn't read this PDF",
    foundN: (n: number) => `Found ${n} product reference${n === 1 ? "" : "s"}`,
    noMatches: "No products in this PDF matched our catalog.",
    skip: "Skip",
    selectMatch: "Select a match",
    altMatches: (n: number) => `${n} more option${n === 1 ? "" : "s"}`,
    addAll: (n: number) => `Add ${n} match${n === 1 ? "" : "es"}`,
    cancel: "Cancel",
    close: "Close",
    confidence: { high: "High match", medium: "Medium match", low: "Low match", none: "No match" },
    qty: "Qty",
    fromPdf: "from PDF",
    page: (p: number) => `p. ${p}`,
    fileName: "PDF",
  },
  es: {
    title: "Soltar PDF de especificación",
    subtitle:
      "Leemos cada referencia de producto, la comparamos con el catálogo de 354,000 piezas y te dejamos revisar antes de agregar.",
    dragHere: "Suelta un PDF aquí, o haz clic para buscar",
    pdfOnly: "Solo PDF · 20 MB máx",
    extracting: "Leyendo la ficha técnica…",
    extractError: "No se pudo leer este PDF",
    foundN: (n: number) => `Encontradas ${n} referencia${n === 1 ? "" : "s"}`,
    noMatches: "Ninguna referencia coincidió con el catálogo.",
    skip: "Omitir",
    selectMatch: "Selecciona una coincidencia",
    altMatches: (n: number) => `${n} opción${n === 1 ? "" : "es"} más`,
    addAll: (n: number) => `Agregar ${n} coincidencia${n === 1 ? "" : "s"}`,
    cancel: "Cancelar",
    close: "Cerrar",
    confidence: { high: "Coincidencia alta", medium: "Coincidencia media", low: "Coincidencia baja", none: "Sin coincidencia" },
    qty: "Cant",
    fromPdf: "del PDF",
    page: (p: number) => `p. ${p}`,
    fileName: "PDF",
  },
} as const;

interface ApiResponse {
  filename?: string;
  matches?: PdfMatch[];
  message?: string;
  error?: string;
  stats?: {
    total: number;
    high: number;
    medium: number;
    low: number;
    none: number;
  };
}

interface RowState {
  /** Which candidate index is selected, or null to skip this row */
  selectedIdx: number | null;
  quantity: number;
}

const confidenceColor = (c: PdfMatch["confidence"]) =>
  c === "high"
    ? "bg-green-500/10 text-green-700 border-green-500/30"
    : c === "medium"
      ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
      : c === "low"
        ? "bg-orange-500/10 text-orange-700 border-orange-500/30"
        : "bg-red-500/10 text-red-700 border-red-500/30";

const PdfDropModal = ({
  open,
  onClose,
  onCommit,
  locale = "en",
  ctaLabel,
  theme = "public",
}: PdfDropModalProps) => {
  const t = T[locale];
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [matches, setMatches] = useState<PdfMatch[]>([]);
  const [rowState, setRowState] = useState<RowState[]>([]);
  const [committing, setCommitting] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const reset = useCallback(() => {
    setUploading(false);
    setError(null);
    setFilename(null);
    setMatches([]);
    setRowState([]);
    setCommitting(false);
    setExpanded(new Set());
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleFile = useCallback(
    async (file: File) => {
      reset();
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("pdf", file);
        const res = await fetch("/api/products/extract-pdf", {
          method: "POST",
          body: fd,
        });
        const data = (await res.json()) as ApiResponse;
        if (!res.ok) {
          throw new Error(data.error || `Extraction failed (HTTP ${res.status})`);
        }
        setFilename(data.filename ?? file.name);
        const ms = data.matches ?? [];
        setMatches(ms);
        setRowState(
          ms.map((m) => ({
            // Auto-select the best candidate for high/medium confidence,
            // leave low/none unselected so the user has to opt in.
            selectedIdx:
              m.candidates.length > 0 &&
              (m.confidence === "high" || m.confidence === "medium")
                ? 0
                : null,
            quantity: m.extracted.quantity,
          }))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Extraction failed");
      } finally {
        setUploading(false);
      }
    },
    [reset]
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const togglePick = (idx: number, candIdx: number | null) => {
    setRowState((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, selectedIdx: candIdx } : r))
    );
  };

  const updateQty = (idx: number, q: number) => {
    setRowState((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, quantity: Math.max(1, Math.round(q || 1)) } : r
      )
    );
  };

  const toggleExpand = (idx: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  const commit = async () => {
    setCommitting(true);
    try {
      const results: PdfDropResult[] = [];
      rowState.forEach((r, i) => {
        if (r.selectedIdx === null) return;
        const cand = matches[i].candidates[r.selectedIdx];
        if (!cand) return;
        results.push({
          product: cand.product,
          quantity: r.quantity,
          ...(matches[i].extracted.finish && {
            finish: matches[i].extracted.finish,
          }),
        });
      });
      await onCommit(results);
      handleClose();
    } finally {
      setCommitting(false);
    }
  };

  const selectedCount = rowState.filter((r) => r.selectedIdx !== null).length;

  if (!open) return null;

  const surface = theme === "public" ? "bg-white" : "bg-dash-surface";
  const text = theme === "public" ? "text-brand-charcoal" : "text-dash-text";
  const muted =
    theme === "public" ? "text-brand-stone" : "text-dash-text-secondary";
  const border =
    theme === "public" ? "border-brand-stone/15" : "border-dash-border";
  const subBg = theme === "public" ? "bg-brand-linen" : "bg-dash-bg";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden
      />
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] ${surface} ${text} border ${border} rounded-lg shadow-xl flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <header className={`flex items-start justify-between gap-4 px-6 py-4 border-b ${border}`}>
          <div className="min-w-0">
            <h3 className="font-display text-xl font-light tracking-wide">
              {t.title}
            </h3>
            <p className={`mt-1 font-body text-xs ${muted} max-w-lg`}>
              {t.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className={`p-1.5 ${muted} hover:${text} cursor-pointer shrink-0`}
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!filename && !uploading && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              className={`w-full flex flex-col items-center justify-center gap-3 py-16 px-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                dragOver
                  ? "border-brand-copper bg-brand-copper/5"
                  : `${border} ${subBg} hover:border-brand-copper/60`
              }`}
            >
              <Upload className={`w-10 h-10 ${muted}`} />
              <p className={`font-body text-sm ${text}`}>{t.dragHere}</p>
              <p className={`font-body text-[11px] ${muted}`}>{t.pdfOnly}</p>
              <input
                ref={fileInput}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={onPick}
              />
            </button>
          )}

          {uploading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
              <p className={`font-body text-sm ${muted}`}>{t.extracting}</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-md border border-red-500/40 bg-red-500/5 text-red-600">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{t.extractError}</p>
                <p className="mt-1 opacity-80">{error}</p>
              </div>
            </div>
          )}

          {filename && matches.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className={`w-4 h-4 ${muted} shrink-0`} />
                  <p className={`font-body text-sm ${text} truncate`}>
                    {filename}
                  </p>
                </div>
                <p className={`font-body text-xs ${muted} shrink-0`}>
                  {t.foundN(matches.length)}
                </p>
              </div>

              <div className="space-y-2">
                {matches.map((m, idx) => {
                  const r = rowState[idx];
                  const top = m.candidates[0];
                  const isOpen = expanded.has(idx);
                  const selectedCand =
                    r.selectedIdx !== null ? m.candidates[r.selectedIdx] : null;
                  return (
                    <div
                      key={idx}
                      className={`border ${border} rounded-md overflow-hidden`}
                    >
                      {/* Row header */}
                      <div className={`flex items-center gap-3 p-3 ${subBg}`}>
                        <span
                          className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded border ${confidenceColor(m.confidence)}`}
                        >
                          {t.confidence[m.confidence]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-mono text-xs ${text} truncate`}>
                            {m.extracted.brand && (
                              <span className={`${muted} mr-1.5`}>{m.extracted.brand}</span>
                            )}
                            {m.extracted.sku}
                            {m.extracted.finish && (
                              <span className={`${muted} ml-1.5`}>· {m.extracted.finish}</span>
                            )}
                          </p>
                          {m.extracted.sourcePage && (
                            <p className={`font-body text-[10px] ${muted}`}>
                              {t.page(m.extracted.sourcePage)} · {t.qty}{" "}
                              <span className="font-mono">{m.extracted.quantity}</span>{" "}
                              {t.fromPdf}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className={`font-body text-[10px] uppercase tracking-wider ${muted}`}>
                            {t.qty}
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={r.quantity}
                            onChange={(e) => updateQty(idx, Number(e.target.value))}
                            className={`w-14 px-2 py-1 text-sm border ${border} ${surface} ${text} rounded`}
                          />
                        </div>
                      </div>

                      {/* Selected match preview */}
                      {top && (
                        <div className="p-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            {selectedCand ? (
                              <>
                                <p className={`font-body text-sm ${text} truncate`}>
                                  {selectedCand.product.name || selectedCand.product.sku}
                                </p>
                                <p className={`font-mono text-[11px] ${muted} truncate`}>
                                  {selectedCand.product.brand} · {selectedCand.product.sku}
                                </p>
                              </>
                            ) : (
                              <p className={`font-body text-xs italic ${muted}`}>
                                {t.skip}
                              </p>
                            )}
                          </div>
                          {selectedCand ? (
                            <button
                              type="button"
                              onClick={() => togglePick(idx, null)}
                              className={`text-[11px] ${muted} hover:${text} cursor-pointer`}
                            >
                              {t.skip}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => togglePick(idx, 0)}
                              disabled={m.candidates.length === 0}
                              className="text-[11px] text-brand-copper hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {t.selectMatch}
                            </button>
                          )}
                          {m.candidates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(idx)}
                              className={`flex items-center gap-1 text-[11px] ${muted} hover:${text} cursor-pointer`}
                            >
                              {t.altMatches(m.candidates.length - 1)}
                              <ChevronDown
                                className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                              />
                            </button>
                          )}
                        </div>
                      )}

                      {isOpen && m.candidates.length > 1 && (
                        <div className={`border-t ${border} p-3 space-y-1`}>
                          {m.candidates.map((c, ci) => (
                            <button
                              key={c.product.id}
                              type="button"
                              onClick={() => togglePick(idx, ci)}
                              className={`w-full flex items-center justify-between gap-3 p-2 rounded text-left transition-colors cursor-pointer ${
                                r.selectedIdx === ci
                                  ? "bg-brand-copper/10 border border-brand-copper/40"
                                  : `hover:${subBg}`
                              }`}
                            >
                              <div className="min-w-0">
                                <p className={`font-body text-xs ${text} truncate`}>
                                  {c.product.name || c.product.sku}
                                </p>
                                <p className={`font-mono text-[10px] ${muted} truncate`}>
                                  {c.product.brand} · {c.product.sku} · {c.reason}
                                </p>
                              </div>
                              {r.selectedIdx === ci && (
                                <Check className="w-4 h-4 text-brand-copper shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {filename && matches.length === 0 && !uploading && !error && (
            <p className={`text-center py-12 text-sm ${muted}`}>{t.noMatches}</p>
          )}
        </div>

        {/* Footer */}
        {filename && matches.length > 0 && (
          <footer className={`flex items-center justify-between gap-3 px-6 py-3 border-t ${border} ${subBg}`}>
            <button
              type="button"
              onClick={handleClose}
              className={`px-3 py-1.5 text-sm ${muted} hover:${text} cursor-pointer`}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={commit}
              disabled={selectedCount === 0 || committing}
              className="px-4 py-2 text-sm font-medium bg-brand-copper text-white rounded hover:bg-brand-copper/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {committing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                ctaLabel ?? t.addAll(selectedCount)
              )}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

export { PdfDropModal };
