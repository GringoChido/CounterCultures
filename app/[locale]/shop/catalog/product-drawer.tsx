"use client";

import { useState, useEffect } from "react";
import { toSlug } from "@/app/lib/slug";
import {
  X,
  Package,
  Loader2,
  Palette,
  Layers,
  Info,
  TrendingUp,
} from "lucide-react";
import type { ProductFull } from "@/app/lib/products-full";
import { ProductVisual } from "@/app/components/product-visual";

interface Variant {
  id: string;
  sku: string;
  name: string;
  listPrice: number;
  currency: string;
  finishCode: string;
}

interface ProductDrawerProps {
  product: ProductFull;
  locale: "en" | "es";
  onClose: () => void;
  onPickProduct: (p: ProductFull) => void;
}

type TabKey = "overview" | "variants" | "related" | "also_specified";

const T = {
  en: {
    closeLabel: "Close",
    quoteOnly: "Quote on request",
    listPrice: "List price",
    uom: "UoM",
    sku: "SKU",
    brand: "Brand",
    category: "Category",
    overview: "Overview",
    variants: "Finishes & variants",
    related: "More from this brand",
    alsoSpecified: "Also specified with",
    noVariants: "No finish variants detectable from this SKU.",
    noRelated: (brand: string) => `No other ${brand} products in catalog.`,
    noAlsoSpecified: "Not enough project history yet to pair this with anything.",
    alsoSpecifiedHint:
      "Products that consistently ship alongside this one — real pairings, not algorithmic guesses.",
    requestQuote: "Request a quote",
    priceNote: "Prices shown are reference only. Final quoted price confirmed on request — IVA not included.",
    variantsHint: "Same model, different finish or size. Click a tile to view.",
  },
  es: {
    closeLabel: "Cerrar",
    quoteOnly: "Cotización bajo pedido",
    listPrice: "Precio de lista",
    uom: "Unidad",
    sku: "SKU",
    brand: "Marca",
    category: "Categoría",
    overview: "Resumen",
    variants: "Acabados y variantes",
    related: "Más de esta marca",
    alsoSpecified: "Especificados en conjunto",
    noVariants: "Sin variantes detectables desde este SKU.",
    noRelated: (brand: string) => `No hay más productos de ${brand} en catálogo.`,
    noAlsoSpecified: "Aún no hay suficiente historial para sugerir combinaciones.",
    alsoSpecifiedHint:
      "Productos que acompañan consistentemente a este — patrones reales de proyectos, no sugerencias algorítmicas.",
    requestQuote: "Solicitar cotización",
    priceNote: "Precios de referencia. Precio final confirmado al cotizar — IVA no incluido.",
    variantsHint: "Mismo modelo, distinto acabado o tamaño. Toca una ficha para verla.",
  },
};

const fmtPrice = (p: number, cur: string, locale: string) =>
  p > 0
    ? `${cur} ${p.toLocaleString(locale === "es" ? "es-MX" : "en-US", {
        maximumFractionDigits: 0,
      })}`
    : "—";

const ProductImage = ({
  id,
  brand,
  sku,
  name,
}: {
  id: string;
  brand: string;
  sku: string;
  name: string;
}) => (
  <div className="border border-brand-stone/15">
    <ProductVisual
      id={id}
      brand={brand}
      sku={sku}
      name={name}
      aspect="4/3"
      size="hero"
    />
  </div>
);

const ProductDrawer = ({
  product,
  locale,
  onClose,
  onPickProduct,
}: ProductDrawerProps) => {
  const t = T[locale];
  const [tab, setTab] = useState<TabKey>("overview");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [skuRoot, setSkuRoot] = useState<string | null>(null);
  const [sameBrand, setSameBrand] = useState<ProductFull[]>([]);
  const [alsoSpecified, setAlsoSpecified] = useState<ProductFull[]>([]);
  const [description, setDescription] = useState<string | null>(null);
  const [loadingRel, setLoadingRel] = useState(false);
  const [loadingAlso, setLoadingAlso] = useState(false);
  useEffect(() => {
    setTab("overview");
    setVariants([]);
    setSameBrand([]);
    setAlsoSpecified([]);
    setDescription(null);
    setSkuRoot(null);
  }, [product.id]);

  // Approved descriptions only — pending/rejected stay hidden from public.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/products/description?id=${encodeURIComponent(product.id)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.description) return;
        const text =
          locale === "es"
            ? d.description.descriptionEs
            : d.description.descriptionEn;
        setDescription(text || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [product.id, locale]);

  useEffect(() => {
    let cancelled = false;
    setLoadingRel(true);
    const params = new URLSearchParams();
    if (product.sku) params.set("sku", product.sku);
    if (product.brand) params.set("brand", product.brand);
    params.set("excludeId", product.id);
    params.set("limit", "12");
    fetch(`/api/dashboard/products/variants?${params}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setVariants((d.variants ?? []) as Variant[]);
        setSkuRoot(d.skuRoot ?? null);
        setSameBrand((d.sameBrand ?? []) as ProductFull[]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingRel(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product.id, product.sku, product.brand]);

  useEffect(() => {
    let cancelled = false;
    setLoadingAlso(true);
    fetch(`/api/dashboard/products/also-specified?id=${product.id}&limit=8`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setAlsoSpecified((d.items ?? []) as ProductFull[]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingAlso(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  return (
    <div className="fixed inset-0 z-[70] flex">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative ml-auto w-[560px] max-w-[95vw] h-full bg-dash-surface border-l border-brand-stone/15 shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-5 border-b border-brand-stone/10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.2em] uppercase text-brand-copper font-body font-semibold">
              {product.brand || "—"} &middot; {product.category}
            </div>
            <h3 className="mt-1 font-display text-2xl font-light tracking-wide text-brand-charcoal leading-tight">
              {product.name || product.sku}
            </h3>
            <p className="mt-1 font-mono text-[11px] text-dash-text-secondary">
              {product.sku || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-dash-text-secondary hover:text-brand-charcoal cursor-pointer shrink-0"
            aria-label={t.closeLabel}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Tabs */}
        <nav className="flex gap-1 px-6 pt-3 border-b border-brand-stone/10">
          {(
            [
              { key: "overview" as TabKey, label: t.overview, Icon: Info },
              {
                key: "variants" as TabKey,
                label: variants.length ? `${t.variants} (${variants.length})` : t.variants,
                Icon: Palette,
              },
              {
                key: "also_specified" as TabKey,
                label: alsoSpecified.length
                  ? `${t.alsoSpecified} (${alsoSpecified.length})`
                  : t.alsoSpecified,
                Icon: TrendingUp,
              },
              {
                key: "related" as TabKey,
                label: sameBrand.length ? `${t.related} (${sameBrand.length})` : t.related,
                Icon: Layers,
              },
            ]
          ).map((tt) => (
            <button
              key={tt.key}
              type="button"
              onClick={() => setTab(tt.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-body rounded-t border-b-2 transition-colors cursor-pointer ${
                tab === tt.key
                  ? "border-brand-copper text-brand-charcoal font-medium"
                  : "border-transparent text-dash-text-secondary hover:text-brand-charcoal"
              }`}
            >
              <tt.Icon className="w-3.5 h-3.5" />
              {tt.label}
            </button>
          ))}
        </nav>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "overview" && (
            <div className="space-y-5">
              <ProductImage
                id={product.id}
                brand={product.brand}
                sku={product.sku}
                name={product.name || product.sku}
              />
              {description && (
                <p className="font-body text-sm text-brand-charcoal leading-relaxed">
                  {description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm font-body">
                <div>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-dash-text-secondary mb-1">
                    {t.listPrice}
                  </div>
                  <div className="text-brand-charcoal">
                    {product.listPrice > 10 ? (
                      <span className="font-medium">
                        {fmtPrice(product.listPrice, product.currency, locale)}
                      </span>
                    ) : (
                      <span className="italic text-dash-text-secondary">{t.quoteOnly}</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-dash-text-secondary mb-1">
                    {t.uom}
                  </div>
                  <div className="text-brand-charcoal">{product.uom}</div>
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-dash-text-secondary mb-1">
                    {t.brand}
                  </div>
                  <div className="text-brand-charcoal">{product.brand || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-dash-text-secondary mb-1">
                    {t.category}
                  </div>
                  <div className="text-brand-charcoal capitalize">{product.category}</div>
                </div>
              </div>
              <p className="text-[11px] text-dash-text-secondary italic leading-relaxed">
                {t.priceNote}
              </p>
            </div>
          )}

          {tab === "variants" && (
            <div className="space-y-3">
              {loadingRel ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 text-dash-text-secondary animate-spin mx-auto" />
                </div>
              ) : variants.length === 0 ? (
                <p className="py-12 text-center text-sm font-body text-dash-text-secondary">
                  {t.noVariants}
                </p>
              ) : (
                <>
                  <p className="text-xs font-body text-dash-text-secondary">
                    {t.variantsHint}
                    {skuRoot && (
                      <>
                        {" "}
                        <code className="font-mono text-brand-charcoal">
                          {skuRoot}
                        </code>
                      </>
                    )}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() =>
                          onPickProduct({
                            id: v.id,
                            name: v.name,
                            sku: v.sku,
                            brand: product.brand,
                            category: product.category,
                            listPrice: v.listPrice,
                            currency: v.currency,
                            uom: product.uom,
                            active: true,
                            saleOk: true,
                            slug: toSlug(v.name, v.sku),
                          })
                        }
                        className="flex items-center gap-3 text-left p-3 border border-brand-stone/15 hover:border-brand-copper hover:bg-brand-linen transition-colors cursor-pointer"
                      >
                        <span className="inline-flex items-center justify-center px-2 py-1 bg-brand-copper/10 text-brand-copper rounded font-mono text-[11px] font-semibold shrink-0 min-w-[38px]">
                          {v.finishCode}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[10px] text-dash-text-secondary truncate">
                            {v.sku}
                          </div>
                          <div className="font-body text-sm text-brand-charcoal truncate">
                            {v.name}
                          </div>
                        </div>
                        <div className="font-body text-xs shrink-0 text-brand-charcoal">
                          {fmtPrice(v.listPrice, v.currency, locale)}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "also_specified" && (
            <div className="space-y-3">
              {loadingAlso ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 text-dash-text-secondary animate-spin mx-auto" />
                </div>
              ) : alsoSpecified.length === 0 ? (
                <p className="py-12 text-center text-sm font-body text-dash-text-secondary">
                  {t.noAlsoSpecified}
                </p>
              ) : (
                <>
                  <p className="text-xs font-body text-dash-text-secondary italic leading-relaxed">
                    {t.alsoSpecifiedHint}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {alsoSpecified.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onPickProduct(p)}
                        className="flex items-center gap-3 text-left p-3 border border-brand-stone/15 hover:border-brand-copper hover:bg-brand-linen transition-colors cursor-pointer w-full"
                      >
                        <div className="w-12 h-12 shrink-0">
                          <ProductVisual
                            id={p.id}
                            brand={p.brand}
                            sku={p.sku}
                            name={p.name || p.sku}
                            aspect="1/1"
                            size="tile"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-body text-[10px] text-brand-copper uppercase tracking-[0.15em] truncate">
                            {p.brand || "—"}
                          </div>
                          <div className="font-body text-sm text-brand-charcoal truncate">
                            {p.name || p.sku}
                          </div>
                          <div className="font-mono text-[10px] text-dash-text-secondary truncate">
                            {p.sku || "—"}
                          </div>
                        </div>
                        <div className="font-body text-xs shrink-0 text-brand-charcoal whitespace-nowrap">
                          {fmtPrice(p.listPrice, p.currency, locale)}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "related" && (
            <div className="space-y-2">
              {loadingRel ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 text-dash-text-secondary animate-spin mx-auto" />
                </div>
              ) : sameBrand.length === 0 ? (
                <p className="py-12 text-center text-sm font-body text-dash-text-secondary">
                  {t.noRelated(product.brand)}
                </p>
              ) : (
                sameBrand.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onPickProduct(p)}
                    className="flex items-center gap-3 text-left p-3 border border-brand-stone/15 hover:border-brand-copper hover:bg-brand-linen transition-colors cursor-pointer w-full"
                  >
                    <Package className="w-4 h-4 text-dash-text-secondary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10px] text-dash-text-secondary truncate">
                        {p.sku || "—"}
                      </div>
                      <div className="font-body text-sm text-brand-charcoal truncate">
                        {p.name}
                      </div>
                    </div>
                    <div className="font-body text-xs shrink-0 text-brand-charcoal">
                      {fmtPrice(p.listPrice, p.currency, locale)}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

      </aside>
    </div>
  );
};

export { ProductDrawer };
