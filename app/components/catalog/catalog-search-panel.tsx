"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Camera, Loader2, Search, X } from "lucide-react";
import { useRouter } from "@/app/i18n/navigation";
import { pdpPath } from "@/app/lib/pdp-href";
import type { BrandCount, ProductFullWithSignals } from "@/app/lib/products-full";
import { VisualSearchModal } from "@/app/components/visual-search-modal";

// Catalog search panel — the 6th search surface.
//
// Lives in BrowseByDiscipline's header (top-right column on lg+). Inline
// typeahead: products from /api/products/search + brand matches derived
// locally from the brandCounts prop. 180ms debounce, AbortController for
// stale-fetch cancellation. Sort=relevance, limit=8 for compact dropdown.

interface CatalogSearchPanelProps {
  locale: "en" | "es";
  brandCounts: BrandCount[];
}

interface SearchResponse {
  items: ProductFullWithSignals[];
  total: number;
  offset: number;
  limit: number;
  elapsedMs: number;
  cacheAgeMs: number;
  partial?: boolean;
  timedOut?: boolean;
  error?: string;
}

interface FinishSwatch {
  code: string;
  label: { en: string; es: string };
  bg: string;
  border?: string;
}

const FINISH_SWATCHES: FinishSwatch[] = [
  { code: "MB", label: { en: "Matte Black", es: "Negro Mate" }, bg: "#1A1A1A" },
  { code: "PC", label: { en: "Chrome", es: "Cromado" }, bg: "#CACED2" },
  { code: "BN", label: { en: "Nickel", es: "Níquel" }, bg: "#B6B7B0" },
  { code: "GL", label: { en: "Gold", es: "Oro" }, bg: "#B8904A" },
  { code: "PB", label: { en: "Brass", es: "Latón" }, bg: "#B09058" },
  { code: "ORB", label: { en: "Bronze", es: "Bronce" }, bg: "#3B2817" },
  { code: "CP", label: { en: "Copper", es: "Cobre" }, bg: "#B87333" },
  { code: "WH", label: { en: "White", es: "Blanco" }, bg: "#F4EFE7", border: "#E0DACE" },
];

const COPY = {
  en: {
    placeholder: "Search by brand, model, or name…",
    visualSearch: "Find by photo",
    finish: "Finish",
    products: "Products",
    brands: "Brands",
    fromPrice: (p: string) => `from ${p}`,
    piecesShort: (n: number) => `${n.toLocaleString("en-US")} pieces`,
    keyboardHint: "Press ↵ to open · Esc to close",
    close: "Close",
    loading: "Loading…",
    empty: "No matches. Try a brand name or model number.",
  },
  es: {
    placeholder: "Buscar por marca, modelo o nombre…",
    visualSearch: "Buscar por foto",
    finish: "Acabado",
    products: "Productos",
    brands: "Marcas",
    fromPrice: (p: string) => `desde ${p}`,
    piecesShort: (n: number) => `${n.toLocaleString("es-MX")} piezas`,
    keyboardHint: "↵ abrir · Esc cerrar",
    close: "Cerrar",
    loading: "Cargando…",
    empty: "Sin coincidencias. Prueba con una marca o número de modelo.",
  },
} as const;

const MIN_QUERY = 2;
const DEBOUNCE_MS = 180;
const PRODUCT_LIMIT = 8;
const BRAND_LIMIT = 3;

const brandSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\+/g, " and ")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const formatPrice = (price: number | undefined, currency: string | undefined, locale: "en" | "es"): string => {
  if (typeof price !== "number" || !Number.isFinite(price)) return "—";
  const cur = currency || "MXN";
  try {
    return new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${cur} ${price.toLocaleString()}`;
  }
};

const FinishSwatchButton = ({
  finish,
  active,
  onClick,
  locale,
}: {
  finish: FinishSwatch;
  active: boolean;
  onClick: () => void;
  locale: "en" | "es";
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    aria-label={finish.label[locale]}
    title={finish.label[locale]}
    className={`w-5 h-5 rounded-full transition-transform ${
      active ? "ring-2 ring-brand-copper ring-offset-1 scale-110" : "hover:scale-110"
    }`}
    style={{
      background: finish.bg,
      border: finish.border ? `1px solid ${finish.border}` : "1px solid rgba(0,0,0,0.08)",
    }}
  />
);

interface ProductRow {
  kind: "product";
  product: ProductFullWithSignals;
}

interface BrandRow {
  kind: "brand";
  brand: BrandCount;
}

type Row = ProductRow | BrandRow;

const CatalogSearchPanel = ({ locale, brandCounts }: CatalogSearchPanelProps) => {
  const t = COPY[locale];
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [finish, setFinish] = useState<string>("");
  const [results, setResults] = useState<ProductFullWithSignals[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visualOpen, setVisualOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listboxId = useId();
  const optionId = (idx: number) => `${listboxId}-row-${idx}`;

  const shouldFetch = query.trim().length >= MIN_QUERY || finish !== "";

  // Debounced fetch with AbortController cancellation. All setState calls
  // happen inside the setTimeout callback so they fire asynchronously
  // (after the effect has settled) — that's required by React 19's
  // react-hooks/set-state-in-effect rule.
  useEffect(() => {
    const delay = shouldFetch ? DEBOUNCE_MS : 0;
    const timer = setTimeout(() => {
      if (!shouldFetch) {
        abortRef.current?.abort();
        abortRef.current = null;
        setResults([]);
        setIsOpen(false);
        setIsPending(false);
        setActiveIndex(0);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsPending(true);
      setIsOpen(true);
      setActiveIndex(0);

      const params = new URLSearchParams();
      const q = query.trim();
      if (q) params.set("q", q);
      if (finish) params.set("finish", finish);
      params.set("limit", String(PRODUCT_LIMIT));
      params.set("sort", "relevance");

      fetch(`/api/products/search?${params.toString()}`, { signal: controller.signal })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data: SearchResponse) => {
          if (controller.signal.aborted) return;
          setResults(Array.isArray(data.items) ? data.items.slice(0, PRODUCT_LIMIT) : []);
        })
        .catch((err) => {
          if ((err as { name?: string } | undefined)?.name === "AbortError") return;
          if (!controller.signal.aborted) setResults([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsPending(false);
        });
    }, delay);

    return () => clearTimeout(timer);
  }, [query, finish, shouldFetch]);

  // Brand matches — locally derived from brandCounts, substring match on
  // the query. Skipped when there's no query (a finish-only filter shouldn't
  // surface "all brands match").
  const brandMatches = useMemo<BrandCount[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return brandCounts
      .filter((b) => b.brand.toLowerCase().includes(q))
      .slice(0, BRAND_LIMIT);
  }, [query, brandCounts]);

  const rows: Row[] = useMemo(() => {
    const productRows: ProductRow[] = results.map((p) => ({ kind: "product", product: p }));
    const brandRows: BrandRow[] = brandMatches.map((b) => ({ kind: "brand", brand: b }));
    return [...productRows, ...brandRows];
  }, [results, brandMatches]);

  // close() hides the dropdown but does NOT abort an in-flight fetch — that
  // way if the user clicks outside and then refocuses, results land and the
  // dropdown can reopen on focus. The fetch effect cleanup handles unmount.
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Click outside closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        close();
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [isOpen, close]);

  // Scroll the active row into view when keyboard nav moves it offscreen.
  // Guard against jsdom (no scrollIntoView) so tests don't crash.
  useEffect(() => {
    if (!isOpen) return;
    const container = listboxRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-row-index="${activeIndex}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, isOpen]);

  // Abort any in-flight fetch on unmount to avoid setState on a dead component.
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const navigate = useCallback(
    (row: Row) => {
      if (row.kind === "product") {
        const p = row.product;
        try {
          const path = pdpPath({
            slug: p.slug,
            name: p.name,
            sku: p.sku,
            category: p.category,
          });
          router.push(path);
        } catch {
          router.push(`/shop/catalog?q=${encodeURIComponent(p.sku)}`);
        }
      } else {
        const slug = brandSlug(row.brand.brand);
        router.push(`/brands/${slug}`);
      }
      close();
    },
    [locale, router, close],
  );

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (!isOpen || rows.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      const r = rows[activeIndex];
      if (r) {
        e.preventDefault();
        navigate(r);
      }
    }
  };

  const toggleFinish = (code: string) => {
    setFinish((cur) => (cur === code ? "" : code));
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search input */}
      <div className="relative flex items-center bg-dash-surface border border-brand-stone/25">
        <Search className="absolute left-3 w-4 h-4 text-dash-text-secondary/60 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            // Reopen the dropdown if a prior fetch still has results we can
            // show, or if a fetch is in flight (close() no longer aborts).
            if (shouldFetch && (rows.length > 0 || isPending)) setIsOpen(true);
          }}
          onKeyDown={onInputKeyDown}
          placeholder={t.placeholder}
          aria-label={t.placeholder}
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && rows.length > 0 ? optionId(activeIndex) : undefined
          }
          aria-autocomplete="list"
          role="combobox"
          className="w-full pl-10 pr-12 py-3 bg-transparent font-body text-sm text-brand-charcoal placeholder:text-dash-text-secondary/50 outline-none"
        />
        {isPending && (
          <Loader2
            data-testid="typeahead-loading"
            className="absolute right-10 w-4 h-4 text-dash-text-secondary/60 animate-spin"
          />
        )}
        <button
          type="button"
          onClick={() => setVisualOpen(true)}
          aria-label={t.visualSearch}
          title={t.visualSearch}
          className="absolute right-3 text-brand-copper hover:text-brand-terracotta transition-colors cursor-pointer"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Finish swatch row */}
      <div
        role="group"
        aria-label={t.finish}
        className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2"
      >
        <span className="font-body text-[10px] tracking-[0.2em] uppercase text-dash-text-secondary/80">
          {t.finish}
        </span>
        {FINISH_SWATCHES.map((f) => (
          <FinishSwatchButton
            key={f.code}
            finish={f}
            active={finish === f.code}
            onClick={() => toggleFinish(f.code)}
            locale={locale}
          />
        ))}
      </div>

      {/* Typeahead dropdown */}
      {isOpen && (
        <div
          id={listboxId}
          ref={listboxRef}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-30 bg-dash-surface border border-brand-stone/25 shadow-xl max-h-[70vh] overflow-y-auto"
        >
          {rows.length === 0 && !isPending && (
            <div role="presentation" className="px-4 py-6 font-body text-xs text-dash-text-secondary text-center">
              {t.empty}
            </div>
          )}
          {results.length > 0 && (
            <div role="presentation">
              <div role="presentation" className="px-4 pt-3 pb-1 font-body text-[10px] tracking-[0.25em] uppercase text-brand-copper">
                {t.products}
              </div>
              {results.map((p, i) => {
                const isActive = i === activeIndex;
                return (
                  <button
                    key={p.id}
                    id={optionId(i)}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-row-index={i}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => navigate({ kind: "product", product: p })}
                    className={`w-full text-left flex items-start gap-3 px-4 py-2.5 transition-colors ${
                      isActive ? "bg-brand-linen" : "hover:bg-brand-linen/60"
                    }`}
                  >
                    <div className="w-10 h-10 flex-shrink-0 bg-brand-stone/15 border border-brand-stone/15 flex items-center justify-center">
                      {p.imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageSrc} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-mono text-[9px] text-brand-charcoal/60">
                          {(p.brand || "—").slice(0, 3).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-sm text-brand-charcoal truncate">
                        {p.name || p.sku}
                      </div>
                      <div className="font-body text-[11px] tracking-[0.05em] uppercase text-dash-text-secondary truncate">
                        {[p.brand, p.category].filter(Boolean).join(" · ")}
                      </div>
                      <div className="font-mono text-[10px] text-brand-copper/80 mt-0.5">
                        {t.fromPrice(formatPrice(p.listPrice, p.currency, locale))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {brandMatches.length > 0 && (
            <div role="presentation" className="border-t border-brand-stone/15">
              <div role="presentation" className="px-4 pt-3 pb-1 font-body text-[10px] tracking-[0.25em] uppercase text-brand-copper">
                {t.brands}
              </div>
              {brandMatches.map((b, i) => {
                const idx = results.length + i;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={b.brand}
                    id={optionId(idx)}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-row-index={idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => navigate({ kind: "brand", brand: b })}
                    className={`w-full text-left flex items-center justify-between px-4 py-2.5 transition-colors ${
                      isActive ? "bg-brand-linen" : "hover:bg-brand-linen/60"
                    }`}
                  >
                    <span className="font-display text-sm tracking-wide text-brand-charcoal">
                      → {b.brand}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-dash-text-secondary">
                      {t.piecesShort(b.count)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <div role="presentation" className="border-t border-brand-stone/15 px-4 py-2 flex items-center justify-between bg-brand-linen/40">
            <span className="font-body text-[10px] text-dash-text-secondary/70">
              {t.keyboardHint}
            </span>
            <button
              type="button"
              onClick={() => {
                close();
                inputRef.current?.focus();
              }}
              className="font-body text-[10px] tracking-[0.15em] uppercase text-brand-copper hover:text-brand-terracotta cursor-pointer flex items-center gap-1"
              aria-label={t.close}
            >
              <X className="w-3 h-3" /> {t.close}
            </button>
          </div>
        </div>
      )}

      <VisualSearchModal
        open={visualOpen}
        onClose={() => setVisualOpen(false)}
        locale={locale}
      />
    </div>
  );
};

export { CatalogSearchPanel };
