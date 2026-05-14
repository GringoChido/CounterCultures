"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  ExternalLink,
  ShoppingCart,
  Pencil,
  ChevronDown,
  ChevronUp,
  Gem,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useProductInsert } from "./product-insert-context";
import { pdpHref } from "@/app/lib/pdp-href";
import { ProductVisual } from "@/app/components/product-visual";

// V3 S17b: Spec-sheet library per product. Searches Drive for PDFs that
// look like spec sheets matching the product's SKU / brand and renders
// download links. Silently empty when nothing matches — this is an
// optional convenience, not a blocker.
type SpecFile = {
  id: string;
  name: string;
  webViewLink: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
};

const useSpecSheets = (sku: string, brand: string) => {
  const [files, setFiles] = useState<SpecFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    let aborted = false;
    if (!sku && !brand) return;
    setLoading(true);
    setAttempted(false);
    // Query Drive for files whose full-text content includes the SKU. We
    // filter client-side to PDFs. Falls back to brand search if nothing
    // matches on SKU.
    const run = async () => {
      try {
        const primary = sku
          ? await fetch(
              `/api/dashboard/drive?action=search&q=${encodeURIComponent(sku)}&pageSize=10`,
              { cache: "no-store" }
            )
          : null;
        let hits: SpecFile[] = [];
        if (primary && primary.ok) {
          const data = (await primary.json()) as { files?: SpecFile[] };
          hits = (data.files ?? []).filter((f) =>
            /pdf/i.test(f.mimeType || "")
          );
        }
        if (hits.length === 0 && brand) {
          const fallback = await fetch(
            `/api/dashboard/drive?action=search&q=${encodeURIComponent(`${brand} spec`)}&pageSize=10`,
            { cache: "no-store" }
          );
          if (fallback.ok) {
            const data = (await fallback.json()) as { files?: SpecFile[] };
            hits = (data.files ?? []).filter((f) =>
              /pdf/i.test(f.mimeType || "")
            );
          }
        }
        if (!aborted) setFiles(hits.slice(0, 5));
      } catch {
        /* ignore — show empty state */
      } finally {
        if (!aborted) {
          setLoading(false);
          setAttempted(true);
        }
      }
    };
    run();
    return () => {
      aborted = true;
    };
  }, [sku, brand]);

  return { files, loading, attempted };
};

const SpecSheetsSection = ({ sku, brand }: { sku: string; brand: string }) => {
  const { files, loading, attempted } = useSpecSheets(sku, brand);

  const requestSpec = async () => {
    try {
      await fetch("/api/dashboard/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "spec_sheet_requested",
          description: `Spec sheet requested for ${brand} SKU ${sku}`,
        }),
      });
      toast.success("Request logged — we'll track it down");
    } catch {
      toast.error("Request failed — try again in a moment");
    }
  };

  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-dash-text-secondary mb-2 flex items-center gap-1.5">
        <FileText className="w-3 h-3" />
        Spec Sheets
      </p>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-dash-text-muted py-3">
          <Loader2 className="w-3 h-3 animate-spin" />
          Looking for spec sheets…
        </div>
      ) : files.length > 0 ? (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li key={f.id}>
              <a
                href={f.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-dash-bg border border-dash-border rounded hover:border-brand-copper hover:bg-dash-bg/70 transition-colors text-xs"
              >
                <FileText className="w-3.5 h-3.5 text-brand-copper shrink-0" />
                <span className="flex-1 truncate text-dash-text">{f.name}</span>
                <Download className="w-3 h-3 text-dash-text-secondary shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      ) : attempted ? (
        <div className="text-xs text-dash-text-muted bg-dash-bg/50 border border-dash-border rounded p-3">
          <p className="mb-1.5">No spec sheet on file for this product.</p>
          <button
            type="button"
            onClick={requestSpec}
            className="text-brand-copper hover:underline cursor-pointer"
          >
            Request spec sheet →
          </button>
        </div>
      ) : null}
    </div>
  );
};

const availabilityConfig: Record<string, { label: string; bg: string; text: string }> = {
  "in-stock": { label: "In Stock", bg: "bg-dash-success/10", text: "text-dash-success" },
  "made-to-order": { label: "Made to Order", bg: "bg-dash-warn/10", text: "text-dash-warn" },
  "special-order": { label: "Special Order", bg: "bg-dash-info/10", text: "text-dash-info" },
};

export const ProductPreview = () => {
  const { previewProduct, closePreview, requestInsert } = useProductInsert();
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [heroErrored, setHeroErrored] = useState(false);
  const [thumbErrors, setThumbErrors] = useState<Set<number>>(new Set());

  // Reset error state whenever the previewed product changes
  useEffect(() => {
    setHeroErrored(false);
    setThumbErrors(new Set());
    setActiveImage(0);
  }, [previewProduct?.id]);

  const handleInsert = useCallback(() => {
    if (!previewProduct) return;
    requestInsert(previewProduct);
    closePreview();
    toast.success(`Ready to insert: ${previewProduct.name}`);
  }, [previewProduct, requestInsert, closePreview]);

  const handleCopySku = useCallback(() => {
    if (!previewProduct) return;
    navigator.clipboard.writeText(previewProduct.sku);
    toast.success("SKU copied to clipboard");
  }, [previewProduct]);

  const open = !!previewProduct;
  const p = previewProduct;

  return (
    <AnimatePresence>
      {open && p && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreview}
            className="fixed inset-0 bg-black/30 z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-screen w-[600px] max-w-[calc(100vw-2rem)] bg-dash-surface border-l border-dash-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-14 border-b border-dash-border shrink-0">
              <h2 className="text-sm font-semibold text-dash-text">Product Preview</h2>
              <button
                onClick={closePreview}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5 text-dash-text-secondary" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Hero visual — uses ProductVisual so imageless products
                  get the branded typographic fallback consistent with
                  the public catalog. */}
              <div className="relative">
                <div className="relative aspect-[4/3] bg-dash-bg overflow-hidden">
                  {/* Always-on typographic base */}
                  <ProductVisual
                    id={p.id}
                    brand={p.brand}
                    sku={p.sku}
                    name={p.nameEn || p.name}
                    size="hero"
                    forceTypography
                    fill
                  />
                  {p.images.length > 0 && !heroErrored && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.images[activeImage] || p.images[0]}
                      alt={p.name}
                      className="absolute inset-0 z-10 w-full h-full object-cover"
                      onError={() => setHeroErrored(true)}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        if (img.naturalWidth > 0 && img.naturalWidth < 320) {
                          setHeroErrored(true);
                        }
                      }}
                    />
                  )}
                </div>
                {p.images.length > 1 && !heroErrored && (
                  <div className="flex gap-2 px-6 py-3 overflow-x-auto">
                    {p.images.map((img, i) =>
                      thumbErrors.has(i) ? null : (
                        <button
                          key={i}
                          onClick={() => setActiveImage(i)}
                          className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-colors cursor-pointer ${
                            i === activeImage ? "border-brand-copper" : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`${p.name} thumbnail ${i + 1}`}
                            className="w-full h-full object-cover"
                            onError={() =>
                              setThumbErrors((prev) => {
                                const next = new Set(prev);
                                next.add(i);
                                return next;
                              })
                            }
                            onLoad={(e) => {
                              if (e.currentTarget.naturalWidth > 0 && e.currentTarget.naturalWidth < 200) {
                                setThumbErrors((prev) => {
                                  const next = new Set(prev);
                                  next.add(i);
                                  return next;
                                });
                              }
                            }}
                          />
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Header section */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-copper mb-1">
                    {p.brand}
                  </p>
                  <h3 className="text-lg font-bold text-dash-text leading-tight">{p.name}</h3>
                  {p.nameEn && p.nameEn !== p.name && (
                    <p className="text-sm text-dash-text-secondary mt-0.5">{p.nameEn}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-dash-bg border border-dash-border rounded text-[11px] font-mono text-dash-text-secondary">
                      {p.sku}
                    </span>
                    {p.artisanal && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-dash-warn/10 rounded text-[11px] text-dash-warn font-medium">
                        <Gem className="w-3 h-3" /> Artisanal
                      </span>
                    )}
                  </div>
                </div>

                {/* Category breadcrumb */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary mb-1">
                    Category
                  </p>
                  <p className="text-sm text-dash-text capitalize">
                    {p.category} <span className="text-dash-text-secondary mx-1">&rarr;</span> {p.subcategory.replace(/-/g, " ")}
                  </p>
                </div>

                {/* Pricing */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary mb-1">
                    Pricing
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-bold text-dash-text">
                      ${p.price.toLocaleString()} {p.currency}
                    </span>
                    {p.tradePrice && (
                      <span className="text-sm text-dash-text-secondary">
                        Trade: ${p.tradePrice.toLocaleString()} {p.currency}
                      </span>
                    )}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary mb-1">
                    Availability
                  </p>
                  {(() => {
                    const config = availabilityConfig[p.availability] || availabilityConfig["in-stock"];
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                        {config.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Finishes */}
                {p.finishes.length > 0 && p.finishes[0] !== "" && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary mb-2">
                      Finishes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.finishes.map((f) => (
                        <span
                          key={f}
                          className="px-2.5 py-1 bg-dash-bg border border-dash-border rounded-lg text-xs text-dash-text"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {(p.description || p.descriptionEn) && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary mb-1">
                      Description
                    </p>
                    {p.description && (
                      <p className="text-sm text-dash-text leading-relaxed">{p.description}</p>
                    )}
                    {p.descriptionEn && p.descriptionEn !== p.description && (
                      <div className="mt-2">
                        <button
                          onClick={() => setDescExpanded(!descExpanded)}
                          className="flex items-center gap-1 text-xs text-brand-copper hover:text-brand-copper/80 transition-colors cursor-pointer"
                        >
                          {descExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          English description
                        </button>
                        {descExpanded && (
                          <p className="text-sm text-dash-text-secondary leading-relaxed mt-1">
                            {p.descriptionEn}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 pt-4">
                <SpecSheetsSection sku={p.sku || ""} brand={p.brand || ""} />
              </div>
            </div>

            {/* Sticky action bar */}
            <div className="flex items-center gap-2 px-6 py-3 border-t border-dash-border bg-dash-bg/50 shrink-0">
              <button
                onClick={handleInsert}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                Insert to Document
              </button>
              <a
                href={pdpHref("en", p)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors text-dash-text"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on Site
              </a>
              <button
                onClick={handleCopySku}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors text-dash-text cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy SKU
              </button>
              <Link
                href="/dashboard/products"
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors text-dash-text ml-auto"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
