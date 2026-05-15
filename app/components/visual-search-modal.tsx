"use client";

import { useCallback, useId, useRef, useState } from "react";
import {
  X,
  Camera,
  Loader2,
  AlertCircle,
  Plus,
  Check,
} from "lucide-react";
import type { ProductFull } from "@/app/lib/products-full";
import type { VisualAttributes } from "@/app/lib/visual-search";
import { ProductVisual } from "@/app/components/product-visual";
import { useCartStore } from "@/app/lib/stores/cart-store";
import { DialogRoot } from "@/app/components/ui/modal";
import { IconButton } from "@/app/components/ui/icon-button";
import { focusRing } from "@/app/components/ui/focus-ring";

interface VisualSearchModalProps {
  open: boolean;
  onClose: () => void;
  locale?: "en" | "es";
  /** Hook to navigate or open another drawer when a result is clicked */
  onSelect?: (product: ProductFull) => void;
}

const T = {
  en: {
    title: "Find by photo",
    subtitle:
      "Snap a fixture or upload a reference image — we'll identify it and pull matches from the 354,000-piece catalog.",
    chooseImage: "Drop or take a photo",
    formats: "JPEG, PNG, WebP · 8 MB max",
    analyzing: "Looking at the image…",
    error: "Couldn't read this image",
    weSee: "What we see",
    confidence: "Confidence",
    brand: "Brand",
    productType: "Type",
    category: "Category",
    finish: "Finish",
    matches: (n: number) => `${n} catalog match${n === 1 ? "" : "es"}`,
    addToProject: "Add",
    inProject: "Added",
    viewMore: "View more in catalog →",
    again: "Try another image",
    close: "Close",
  },
  es: {
    title: "Buscar por foto",
    subtitle:
      "Toma una foto de la pieza o carga una imagen de referencia — la identificamos y traemos coincidencias del catálogo de 354,000 piezas.",
    chooseImage: "Suelta o toma una foto",
    formats: "JPEG, PNG, WebP · 8 MB máx",
    analyzing: "Analizando la imagen…",
    error: "No se pudo leer esta imagen",
    weSee: "Lo que vemos",
    confidence: "Confianza",
    brand: "Marca",
    productType: "Tipo",
    category: "Categoría",
    finish: "Acabado",
    matches: (n: number) => `${n} coincidencia${n === 1 ? "" : "s"} del catálogo`,
    addToProject: "Agregar",
    inProject: "Agregado",
    viewMore: "Ver más en el catálogo →",
    again: "Probar otra imagen",
    close: "Cerrar",
  },
} as const;

interface ApiResponse {
  filename?: string;
  attributes?: VisualAttributes;
  matches?: ProductFull[];
  totalMatched?: number;
  error?: string;
}

const VisualSearchModal = ({
  open,
  onClose,
  locale = "en",
  onSelect,
}: VisualSearchModalProps) => {
  const t = T[locale];
  const titleId = useId();
  const subtitleId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<VisualAttributes | null>(null);
  const [matches, setMatches] = useState<ProductFull[]>([]);
  const [totalMatched, setTotalMatched] = useState(0);
  const cartAdd = useCartStore((s) => s.add);
  const cartItems = useCartStore((s) => s.items);
  const cartHas = (id: string) => cartItems.some((i) => i.id === id);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setAttributes(null);
    setMatches([]);
    setTotalMatched(0);
    setError(null);
    setAnalyzing(false);
  }, [previewUrl]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleFile = useCallback(
    async (file: File) => {
      reset();
      setPreviewUrl(URL.createObjectURL(file));
      setAnalyzing(true);
      try {
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch("/api/products/visual-search", {
          method: "POST",
          body: fd,
        });
        const data = (await res.json()) as ApiResponse;
        if (!res.ok || !data.attributes) {
          throw new Error(
            data.error || `Visual search failed (HTTP ${res.status})`
          );
        }
        setAttributes(data.attributes);
        setMatches(data.matches ?? []);
        setTotalMatched(data.totalMatched ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Visual search failed");
      } finally {
        setAnalyzing(false);
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

  const handleAdd = (p: ProductFull) => {
    cartAdd({
      id: p.id,
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      category: p.category,
      currency: (p.currency === "USD" ? "USD" : "MXN") as "MXN" | "USD",
      listPrice: p.listPrice,
      quantity: 1,
      productHref: `/${locale}/shop/${p.category}/p/${p.slug || p.sku}`,
      availability: "made-to-order",
      buyable: p.listPrice > 10,
    });
  };

  const catalogHref = attributes
    ? `/${locale}/shop/catalog?q=${encodeURIComponent(attributes.searchQuery)}${
        attributes.brand
          ? `&brand=${encodeURIComponent(attributes.brand)}`
          : ""
      }${
        attributes.category ? `&category=${attributes.category}` : ""
      }`
    : `/${locale}/shop/catalog`;

  return (
    <DialogRoot
      open={open}
      onClose={handleClose}
      labelledBy={titleId}
      describedBy={subtitleId}
      zIndex={80}
      containerClassName="w-full max-w-4xl max-h-[92vh] bg-dash-surface text-brand-charcoal border border-brand-stone/15 rounded-lg shadow-xl flex flex-col overflow-hidden"
    >
        <header className="flex items-start justify-between gap-4 px-6 py-4 border-b border-brand-stone/10">
          <div className="min-w-0">
            <h3 id={titleId} className="font-display text-xl font-light tracking-wide">
              {t.title}
            </h3>
            <p id={subtitleId} className="mt-1 font-body text-xs text-dash-text-secondary max-w-xl">
              {t.subtitle}
            </p>
          </div>
          <IconButton
            aria-label={t.close}
            onClick={handleClose}
            variant="ghost"
            size="sm"
            icon={<X className="w-5 h-5" />}
            className="shrink-0"
          />
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!previewUrl && !analyzing && (
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
                  : "border-brand-stone/15 bg-brand-linen hover:border-brand-copper/60"
              }`}
            >
              <Camera className="w-10 h-10 text-dash-text-secondary" />
              <p className="font-body text-sm text-brand-charcoal">
                {t.chooseImage}
              </p>
              <p className="font-body text-[11px] text-dash-text-secondary">
                {t.formats}
              </p>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                capture="environment"
                className="hidden"
                onChange={onPick}
              />
            </button>
          )}

          {previewUrl && (
            <div className="grid lg:grid-cols-[260px_1fr] gap-5">
              {/* Uploaded image + identified attributes */}
              <div className="space-y-3">
                <div className="aspect-square overflow-hidden border border-brand-stone/15 bg-brand-linen rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                  />
                </div>
                {analyzing ? (
                  <div className="flex items-center gap-2 text-xs text-dash-text-secondary">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t.analyzing}
                  </div>
                ) : attributes ? (
                  <div className="space-y-2 text-xs font-body">
                    <p className="font-body font-semibold text-[10px] tracking-[0.2em] uppercase text-brand-copper">
                      {t.weSee}
                    </p>
                    {attributes.brand && (
                      <Attr label={t.brand} value={attributes.brand} />
                    )}
                    {attributes.productType && (
                      <Attr label={t.productType} value={attributes.productType} />
                    )}
                    {attributes.category && (
                      <Attr
                        label={t.category}
                        value={
                          locale === "es"
                            ? attributes.category === "bathroom"
                              ? "Baño"
                              : attributes.category === "kitchen"
                                ? "Cocina"
                                : "Herrajes"
                            : attributes.category
                        }
                      />
                    )}
                    {attributes.finish && (
                      <Attr label={t.finish} value={attributes.finish} />
                    )}
                    <Attr
                      label={t.confidence}
                      value={`${Math.round(attributes.confidence * 100)}%`}
                    />
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="text-xs text-brand-copper hover:underline cursor-pointer"
                >
                  {t.again}
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  capture="environment"
                  className="hidden"
                  onChange={onPick}
                />
              </div>

              {/* Matches grid */}
              <div className="min-w-0">
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-md border border-dash-danger/40 bg-dash-danger/5 text-dash-danger mb-4">
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">{t.error}</p>
                      <p className="mt-1 opacity-80">{error}</p>
                    </div>
                  </div>
                )}
                {matches.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-body text-dash-text-secondary">
                        {t.matches(totalMatched)}
                      </p>
                      <a
                        href={catalogHref}
                        className="text-xs text-brand-copper hover:underline"
                      >
                        {t.viewMore}
                      </a>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {matches.slice(0, 12).map((p) => {
                        const inProject = cartHas(p.id);
                        return (
                          <div
                            key={p.id}
                            className="border border-brand-stone/15 rounded overflow-hidden flex flex-col bg-dash-surface hover:border-brand-copper/60 transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => onSelect?.(p)}
                              className="block cursor-pointer"
                            >
                              <ProductVisual
                                id={p.id}
                                brand={p.brand}
                                sku={p.sku}
                                name={p.name || p.sku}
                                aspect="1/1"
                                size="card"
                                hasImage={p.hasImage}
                                imageSrc={p.imageSrc}
                              />
                            </button>
                            <div className="p-2 flex flex-col gap-1.5 flex-1">
                              <p className="font-body text-[10px] tracking-[0.15em] text-brand-copper uppercase">
                                {p.brand}
                              </p>
                              <p className="font-body text-xs text-brand-charcoal line-clamp-2 leading-snug">
                                {p.name || p.sku}
                              </p>
                              <p className="font-mono text-[9px] text-dash-text-secondary truncate">
                                {p.sku}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleAdd(p)}
                                disabled={inProject}
                                className={`mt-auto inline-flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors cursor-pointer disabled:cursor-default ${
                                  inProject
                                    ? "bg-brand-copper/10 text-brand-copper border border-brand-copper/30"
                                    : "bg-brand-copper text-white hover:bg-brand-copper/90"
                                }`}
                              >
                                {inProject ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    {t.inProject}
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3 h-3" />
                                    {t.addToProject}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {!analyzing && !error && matches.length === 0 && attributes && (
                  <p className="text-center py-12 text-sm text-dash-text-secondary">
                    No catalog matches — try the catalog search with{" "}
                    <a href={catalogHref} className="text-brand-copper underline">
                      {attributes.searchQuery}
                    </a>
                    .
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
    </DialogRoot>
  );
};

const Attr = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline gap-2">
    <span className="font-body text-[10px] tracking-[0.15em] uppercase text-dash-text-secondary shrink-0 w-16">
      {label}
    </span>
    <span className="font-body text-xs text-brand-charcoal capitalize">
      {value}
    </span>
  </div>
);

export { VisualSearchModal };
