"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import MiniSearch from "minisearch";
import NextLink from "next/link";
import { Search, ArrowUpRight, FileText, Tag, Package, X, Loader2 } from "lucide-react";
import type { SearchDoc, SearchIndexPayload } from "@/app/lib/search-index";

interface SearchPaletteProps {
  locale: "en" | "es";
  open: boolean;
  onClose: () => void;
}

interface DisplayResult {
  id: string;
  type: "brand" | "article" | "product";
  slug: string;
  name: string;
  subtitle: string;
  hrefSuffix: string;
  external?: boolean;
  score: number;
}

interface ProductHit {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  listPrice: number;
  currency: string;
  imageSrc?: string;
  slug?: string;
}

const COPY = {
  en: {
    placeholder: "Search products, brands, or articles…",
    noResults: "No matches",
    seeAll: "See all results in catalog →",
    sectionBrand: "Brands",
    sectionArticle: "Insights",
    sectionProduct: "Products",
    keyboardHint: "↑↓ to navigate · ↵ to open · Esc to close",
    catalogLink: "Browse full catalog",
    loading: "Loading…",
  },
  es: {
    placeholder: "Buscar productos, marcas o artículos…",
    noResults: "Sin coincidencias",
    seeAll: "Ver todo en el catálogo →",
    sectionBrand: "Marcas",
    sectionArticle: "Editorial",
    sectionProduct: "Productos",
    keyboardHint: "↑↓ navegar · ↵ abrir · Esc cerrar",
    catalogLink: "Explorar catálogo completo",
    loading: "Cargando…",
  },
};

const MIN_QUERY = 2;

const buildMiniSearch = (
  docs: SearchDoc[],
  locale: "en" | "es"
): MiniSearch<SearchDoc> => {
  const isEs = locale === "es";
  const ms = new MiniSearch<SearchDoc>({
    fields: [
      "nameEn",
      "nameEs",
      "subtitleEn",
      "subtitleEs",
      "bodyEn",
      "bodyEs",
      "keywords",
    ],
    storeFields: [
      "type",
      "slug",
      "nameEn",
      "nameEs",
      "subtitleEn",
      "subtitleEs",
      "hrefSuffix",
      "external",
    ],
    searchOptions: {
      boost: isEs
        ? { nameEs: 5, nameEn: 2, subtitleEs: 2, subtitleEn: 1 }
        : { nameEn: 5, nameEs: 2, subtitleEn: 2, subtitleEs: 1 },
      fuzzy: 0.15,
      prefix: true,
    },
  });
  ms.addAll(docs);
  return ms;
};

const SearchPalette = ({ locale, open, onClose }: SearchPaletteProps) => {
  const isEs = locale === "es";
  const t = COPY[locale];
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [index, setIndex] = useState<MiniSearch<SearchDoc> | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [productResults, setProductResults] = useState<ProductHit[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const productReqRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const [indexError, setIndexError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  useEffect(() => {
    if (!open || hasFetched) return;
    setLoading(true);
    setIndexError(null);
    fetch("/api/search-index")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((payload: SearchIndexPayload) => {
        setIndex(buildMiniSearch(payload.documents, locale));
        setHasFetched(true);
      })
      .catch((err) => {
        console.error("[SearchPalette] failed to load index", err);
        setIndexError(err instanceof Error ? err.message : "Failed to load search");
      })
      .finally(() => setLoading(false));
  }, [open, hasFetched, retryToken, locale]);

  // Live product search — debounced fetch to the catalog API
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) {
      setProductResults([]);
      return;
    }
    setProductLoading(true);
    const myReq = ++productReqRef.current;
    const timer = setTimeout(async () => {
      try {
        const p = new URLSearchParams({ q: trimmed, limit: "6" });
        const res = await fetch(`/api/products/search?${p}`);
        if (myReq !== productReqRef.current) return;
        if (!res.ok) {
          setProductResults([]);
          return;
        }
        const data = await res.json();
        setProductResults(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.items ?? []).slice(0, 6).map((item: any) => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
            brand: item.brand,
            category: item.category,
            listPrice: item.listPrice,
            currency: item.currency,
            imageSrc: item.imageSrc,
            slug: item.slug,
          }))
        );
      } catch {
        if (myReq === productReqRef.current) setProductResults([]);
      } finally {
        if (myReq === productReqRef.current) setProductLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      const id = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const brandArticleResults = useMemo<DisplayResult[]>(() => {
    if (!index || !query.trim()) return [];
    const raw = index.search(query.trim(), { combineWith: "AND" });
    return raw
      .slice(0, 8)
      .map((r) => {
        const doc = r as unknown as SearchDoc & { score: number };
        return {
          id: doc.id,
          type: doc.type as "brand" | "article",
          slug: doc.slug,
          name: isEs ? doc.nameEs || doc.nameEn : doc.nameEn,
          subtitle: isEs ? doc.subtitleEs || doc.subtitleEn : doc.subtitleEn,
          hrefSuffix: doc.hrefSuffix,
          external: doc.external,
          score: r.score,
        };
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "brand" ? -1 : 1;
        return b.score - a.score;
      });
  }, [index, query, isEs]);

  const allResults = useMemo<DisplayResult[]>(() => {
    const productDisplayResults: DisplayResult[] = productResults.map((p, idx) => ({
      id: `product:${p.id}`,
      type: "product" as const,
      slug: p.id,
      name: p.name || p.sku,
      subtitle: `${p.brand} · ${p.sku}`,
      hrefSuffix: `/shop/${p.category}/p/${p.slug || p.sku}`,
      score: Math.max(0.5, 5 - idx * 0.6),
    }));
    return [...productDisplayResults, ...brandArticleResults].sort(
      (a, b) => b.score - a.score
    );
  }, [productResults, brandArticleResults]);

  const totalCount = allResults.length;
  const hasQuery = query.trim().length >= MIN_QUERY;
  const isSearching = productLoading || (loading && !hasFetched);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, totalCount - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        if (hasQuery && totalCount === 0) {
          window.location.href = `/${locale}/shop/catalog?q=${encodeURIComponent(query.trim())}`;
          onClose();
          return;
        }
        const r = allResults[activeIndex];
        if (!r) return;
        e.preventDefault();
        const href = r.external ? r.hrefSuffix : `/${locale}${r.hrefSuffix}`;
        if (r.external) {
          window.open(href, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = href;
        }
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, allResults, activeIndex, locale, totalCount, hasQuery, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const container = resultsRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-row-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  // Group results by type for section headers
  const grouped: Record<"product" | "brand" | "article", DisplayResult[]> = {
    product: [],
    brand: [],
    article: [],
  };
  for (const r of allResults) grouped[r.type].push(r);

  const SECTION_ORDER = ["product", "brand", "article"] as const;
  const SECTION_LABELS: Record<string, string> = {
    product: t.sectionProduct,
    brand: t.sectionBrand,
    article: t.sectionArticle,
  };
  const SECTION_ICONS: Record<string, typeof Package> = {
    product: Package,
    brand: Tag,
    article: FileText,
  };

  return (
    <div
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={t.placeholder}
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
    >
      <div className="w-full max-w-2xl bg-dash-surface rounded-xl shadow-2xl overflow-hidden border border-brand-stone/15">
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-brand-stone/10">
          <Search className="w-5 h-5 text-dash-text-secondary/60 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 bg-transparent border-0 outline-none font-body text-base text-brand-charcoal placeholder:text-dash-text-secondary/45"
          />
          {isSearching && (
            <Loader2 className="w-4 h-4 text-dash-text-secondary/50 animate-spin shrink-0" />
          )}
          <button
            onClick={onClose}
            aria-label="Close search"
            className="p-1 text-dash-text-secondary/50 hover:text-brand-charcoal transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
          {indexError && (
            <div
              role="alert"
              className="m-3 px-3 py-2 text-[11px] rounded border border-red-500/40 bg-red-500/10 text-red-700 flex items-center justify-between gap-3"
            >
              <span>Search index failed to load: {indexError}</span>
              <button
                type="button"
                onClick={() => {
                  setHasFetched(false);
                  setRetryToken((t) => t + 1);
                }}
                className="px-2 py-0.5 text-[10px] font-medium border border-red-500/40 rounded hover:bg-red-500/10 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
          {!hasQuery ? (
            <div className="px-5 py-8 text-center">
              <p className="font-body text-sm text-dash-text-secondary/70">
                {t.placeholder}
              </p>
              <NextLink
                href={`/${locale}/shop/catalog`}
                onClick={onClose}
                className="mt-4 inline-flex items-center gap-2 font-body text-xs tracking-[0.18em] uppercase text-brand-copper hover:text-brand-charcoal transition-colors"
              >
                {t.catalogLink} →
              </NextLink>
            </div>
          ) : totalCount === 0 && !isSearching ? (
            <div className="px-5 py-8 text-center">
              <p className="font-body text-sm text-dash-text-secondary/70">{t.noResults}</p>
              <NextLink
                href={`/${locale}/shop/catalog?q=${encodeURIComponent(query.trim())}`}
                onClick={onClose}
                className="mt-3 inline-flex items-center gap-2 font-body text-xs tracking-[0.18em] uppercase text-brand-copper hover:text-brand-charcoal transition-colors"
              >
                {t.seeAll}
              </NextLink>
            </div>
          ) : totalCount === 0 && isSearching ? (
            <div className="px-5 py-8 text-center">
              <Loader2 className="w-5 h-5 text-brand-stone/60 mx-auto animate-spin" />
            </div>
          ) : (
            <>
              {SECTION_ORDER.map((type) => {
                const rows = grouped[type];
                if (rows.length === 0) return null;
                const Icon = SECTION_ICONS[type];
                return (
                  <div key={type}>
                    <p className="px-5 pt-4 pb-2 font-body text-[10px] tracking-[0.2em] uppercase text-dash-text-secondary/60">
                      {SECTION_LABELS[type]}
                    </p>
                    <ul>
                      {rows.map((r) => {
                        const globalIndex = allResults.findIndex((x) => x.id === r.id);
                        const isActive = globalIndex === activeIndex;
                        const href = r.external
                          ? r.hrefSuffix
                          : `/${locale}${r.hrefSuffix}`;
                        return (
                          <li key={r.id}>
                            <NextLink
                              href={href}
                              onClick={onClose}
                              {...(r.external
                                ? { target: "_blank", rel: "noopener noreferrer" }
                                : {})}
                            >
                              <div
                                data-row-index={globalIndex}
                                className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                                  isActive
                                    ? "bg-brand-copper/10 text-brand-charcoal"
                                    : "hover:bg-brand-linen/60"
                                }`}
                                onMouseEnter={() => setActiveIndex(globalIndex)}
                              >
                                <Icon className="w-4 h-4 text-dash-text-secondary/55 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-body text-sm text-brand-charcoal truncate">
                                    {r.name}
                                  </p>
                                  {r.subtitle && (
                                    <p className="font-body text-xs text-dash-text-secondary/70 truncate">
                                      {r.subtitle}
                                    </p>
                                  )}
                                </div>
                                {r.external && (
                                  <ArrowUpRight className="w-3.5 h-3.5 text-dash-text-secondary/45 shrink-0" />
                                )}
                              </div>
                            </NextLink>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
              {/* Always offer full catalog search at the bottom */}
              <div className="px-5 py-3 border-t border-brand-stone/10">
                <NextLink
                  href={`/${locale}/shop/catalog?q=${encodeURIComponent(query.trim())}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-2 font-body text-xs tracking-[0.18em] uppercase text-brand-copper hover:text-brand-charcoal transition-colors"
                >
                  {t.seeAll}
                </NextLink>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-brand-stone/10 bg-brand-linen/40">
          <span className="font-body text-[10px] tracking-wider uppercase text-dash-text-secondary/50">
            {t.keyboardHint}
          </span>
          <span className="font-mono text-[10px] text-dash-text-secondary/40">⌘K</span>
        </div>
      </div>
    </div>
  );
};

export { SearchPalette };
