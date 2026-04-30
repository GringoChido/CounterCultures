"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import MiniSearch from "minisearch";
import NextLink from "next/link";
import { Search, ArrowUpRight, FileText, Tag, X } from "lucide-react";
import type { SearchDoc, SearchIndexPayload } from "@/app/lib/search-index";

interface SearchPaletteProps {
  locale: "en" | "es";
  /** Whether the palette is visible. Controlled by Header via cmd-K / button. */
  open: boolean;
  onClose: () => void;
}

interface DisplayResult {
  id: string;
  type: SearchDoc["type"];
  slug: string;
  name: string;
  subtitle: string;
  hrefSuffix: string;
  external?: boolean;
  score: number;
}

const COPY = {
  en: {
    placeholder: "Search brands, articles…",
    noResults: "No matches",
    seeAll: "See all results in catalog →",
    sectionBrand: "Brands",
    sectionArticle: "Insights",
    keyboardHint: "↑↓ to navigate · ↵ to open · Esc to close",
    catalogLink: "Catalog",
    loading: "Loading search index…",
  },
  es: {
    placeholder: "Buscar marcas, artículos…",
    noResults: "Sin coincidencias",
    seeAll: "Ver todo en el catálogo →",
    sectionBrand: "Marcas",
    sectionArticle: "Editorial",
    keyboardHint: "↑↓ navegar · ↵ abrir · Esc cerrar",
    catalogLink: "Catálogo",
    loading: "Cargando índice de búsqueda…",
  },
};

const buildMiniSearch = (docs: SearchDoc[]): MiniSearch<SearchDoc> => {
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
      boost: { nameEn: 4, nameEs: 4, subtitleEn: 2, subtitleEs: 2 },
      fuzzy: 0.2,
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Lazy-load the index on first open. Client never pays the JSON cost
  // unless the user actually searches.
  useEffect(() => {
    if (!open || hasFetched) return;
    setLoading(true);
    fetch("/api/search-index")
      .then((r) => r.json())
      .then((payload: SearchIndexPayload) => {
        setIndex(buildMiniSearch(payload.documents));
        setHasFetched(true);
      })
      .catch((err) => {
        console.error("[SearchPalette] failed to load index", err);
      })
      .finally(() => setLoading(false));
  }, [open, hasFetched]);

  // Focus the input + reset state on open.
  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      // setTimeout to wait for the input to mount + animation finish.
      const id = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  // Run search. Group by type (brands first, then articles).
  const results = useMemo<DisplayResult[]>(() => {
    if (!index || !query.trim()) return [];
    const raw = index.search(query.trim(), { combineWith: "AND" });
    return raw
      .slice(0, 12)
      .map((r) => {
        const doc = r as unknown as SearchDoc & { score: number };
        return {
          id: doc.id,
          type: doc.type,
          slug: doc.slug,
          name: isEs ? doc.nameEs || doc.nameEn : doc.nameEn,
          subtitle: isEs ? doc.subtitleEs || doc.subtitleEn : doc.subtitleEn,
          hrefSuffix: doc.hrefSuffix,
          external: doc.external,
          score: r.score,
        };
      })
      .sort((a, b) => {
        // Brands first, then articles, then by score.
        if (a.type !== b.type) return a.type === "brand" ? -1 : 1;
        return b.score - a.score;
      });
  }, [index, query, isEs]);

  // Close on Esc + arrow navigation + enter to open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        const r = results[activeIndex];
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
  }, [open, onClose, results, activeIndex, locale]);

  // Reset active row when results change.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keep active row in view as user arrows down.
  useEffect(() => {
    const container = resultsRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-row-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Backdrop click closes.
  const onBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  // Group results for section labels.
  const grouped: Record<SearchDoc["type"], DisplayResult[]> = { brand: [], article: [] };
  for (const r of results) grouped[r.type].push(r);

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
          {loading && !hasFetched ? (
            <p className="px-5 py-8 text-center text-sm text-dash-text-secondary/70 font-body">
              {t.loading}
            </p>
          ) : query.trim() === "" ? (
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
          ) : results.length === 0 ? (
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
          ) : (
            <>
              {(["brand", "article"] as const).map((type) => {
                const rows = grouped[type];
                if (rows.length === 0) return null;
                const sectionLabel =
                  type === "brand" ? t.sectionBrand : t.sectionArticle;
                return (
                  <div key={type}>
                    <p className="px-5 pt-4 pb-2 font-body text-[10px] tracking-[0.2em] uppercase text-dash-text-secondary/60">
                      {sectionLabel}
                    </p>
                    <ul>
                      {rows.map((r) => {
                        // Compute the absolute global index across all
                        // sections so keyboard navigation works.
                        const globalIndex = results.findIndex((x) => x.id === r.id);
                        const isActive = globalIndex === activeIndex;
                        const Icon = type === "brand" ? Tag : FileText;
                        const href = r.external
                          ? r.hrefSuffix
                          : `/${locale}${r.hrefSuffix}`;
                        const inner = (
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
                        );
                        return (
                          <li key={r.id}>
                            {r.external ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={onClose}
                              >
                                {inner}
                              </a>
                            ) : (
                              <NextLink href={href} onClick={onClose}>
                                {inner}
                              </NextLink>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
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
