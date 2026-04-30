"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import { Search, Loader2, X } from "lucide-react";
import type { Product } from "@/app/lib/types";
import type { BrandCount } from "@/app/lib/products-full";

interface QuoteCatalogProps {
  locale: "en" | "es";
  brandCounts: BrandCount[];
  totalProducts: number;
}

interface SearchResponse {
  items: Product[];
  total: number;
  offset: number;
  limit: number;
  elapsedMs: number;
  source: "cache";
}

const PAGE_SIZE = 48;
const MIN_QUERY = 3;

const T = {
  en: {
    sectionCategory: "Category",
    sectionBrand: "Brand",
    brandFilter: "Filter brands…",
    allBrands: "All brands",
    allCategories: "All categories",
    bathroom: "Bathroom",
    kitchen: "Kitchen",
    hardware: "Hardware",
    searchPlaceholder: "Search by SKU, name, or brand…",
    typeToSearch: (min: number) =>
      `Type at least ${min} characters to search, or pick a brand.`,
    resultsFound: (n: number) =>
      `${n.toLocaleString()} result${n === 1 ? "" : "s"}`,
    page: (cur: number, tot: number) => `page ${cur} of ${tot.toLocaleString()}`,
    noResults: "No results. Try a different search term.",
    requestQuote: "Request Quote",
    viewDetails: "View details",
    previous: "← Previous",
    next: "Next →",
    showingRange: (a: number, b: number, n: number) =>
      `Showing ${a}–${b} of ${n.toLocaleString()}`,
    quoteOnlyTag: "Quote only",
  },
  es: {
    sectionCategory: "Categoría",
    sectionBrand: "Marca",
    brandFilter: "Filtrar marcas…",
    allBrands: "Todas las marcas",
    allCategories: "Todas las categorías",
    bathroom: "Baño",
    kitchen: "Cocina",
    hardware: "Herrajes",
    searchPlaceholder: "Busca por SKU, nombre o marca…",
    typeToSearch: (min: number) =>
      `Escribe al menos ${min} caracteres o elige una marca.`,
    resultsFound: (n: number) =>
      `${n.toLocaleString()} resultado${n === 1 ? "" : "s"}`,
    page: (cur: number, tot: number) =>
      `página ${cur} de ${tot.toLocaleString()}`,
    noResults: "Sin resultados. Prueba otro término.",
    requestQuote: "Solicitar Cotización",
    viewDetails: "Ver detalles",
    previous: "← Anterior",
    next: "Siguiente →",
    showingRange: (a: number, b: number, n: number) =>
      `Mostrando ${a}–${b} de ${n.toLocaleString()}`,
    quoteOnlyTag: "Solo cotización",
  },
};

const QuoteCatalog = ({
  locale,
  brandCounts,
  totalProducts,
}: QuoteCatalogProps) => {
  const t = T[locale];
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string>("");
  const [category, setCategory] =
    useState<"all" | "bathroom" | "kitchen" | "hardware">("all");
  const [brandFilter, setBrandFilter] = useState("");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [offset, setOffset] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOffset(0);
  }, [query, brand, category]);

  useEffect(() => {
    const needsSearch =
      query.trim().length >= MIN_QUERY || brand !== "" || category !== "all";
    if (!needsSearch) {
      setResult(null);
      return;
    }
    const id = setTimeout(() => {
      startTransition(async () => {
        const params = new URLSearchParams();
        if (query.trim().length >= MIN_QUERY) params.set("q", query.trim());
        if (brand) params.set("brand", brand);
        if (category !== "all") params.set("category", category);
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String(offset));
        const res = await fetch(`/api/quote-search?${params}`);
        if (!res.ok) return;
        const data: SearchResponse = await res.json();
        setResult(data);
      });
    }, 200);
    return () => clearTimeout(id);
  }, [query, brand, category, offset]);

  const filteredBrands = useMemo(() => {
    if (!brandFilter) return brandCounts;
    const n = brandFilter.toLowerCase();
    return brandCounts.filter((b) => b.brand.toLowerCase().includes(n));
  }, [brandCounts, brandFilter]);

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
          {/* Sidebar: category + brand facets */}
          <aside className="space-y-5">
            <div>
              <label className="block font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-dash-text-secondary mb-2">
                {t.sectionCategory}
              </label>
              <div className="space-y-1 text-sm">
                {(
                  [
                    ["all", t.allCategories],
                    ["bathroom", t.bathroom],
                    ["kitchen", t.kitchen],
                    ["hardware", t.hardware],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCategory(val)}
                    className={`block w-full text-left px-2 py-1.5 rounded transition-colors cursor-pointer ${
                      category === val
                        ? "bg-brand-copper/10 text-brand-copper font-medium"
                        : "text-brand-charcoal hover:bg-brand-linen"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-dash-text-secondary mb-2">
                {t.sectionBrand} ({brandCounts.length})
              </label>
              <input
                type="text"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                placeholder={t.brandFilter}
                className="w-full px-3 py-2 text-sm border border-brand-stone/20 bg-dash-surface font-body focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper"
              />
              <div className="mt-2 max-h-[520px] overflow-y-auto border border-brand-stone/15 bg-dash-surface">
                <button
                  type="button"
                  onClick={() => setBrand("")}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between border-b border-brand-stone/10 hover:bg-brand-linen transition-colors cursor-pointer ${
                    brand === ""
                      ? "bg-brand-linen font-medium text-brand-copper"
                      : "text-brand-charcoal"
                  }`}
                >
                  <span>{t.allBrands}</span>
                  <span className="font-mono text-[10px] text-dash-text-secondary">
                    {totalProducts.toLocaleString()}
                  </span>
                </button>
                {filteredBrands.map((b) => (
                  <button
                    key={b.brand}
                    type="button"
                    onClick={() => setBrand(b.brand)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between border-b border-brand-stone/10 last:border-b-0 hover:bg-brand-linen transition-colors cursor-pointer ${
                      brand === b.brand
                        ? "bg-brand-linen font-medium text-brand-copper"
                        : "text-brand-charcoal"
                    }`}
                  >
                    <span className="truncate pr-2">
                      {b.brand || "(blank)"}
                    </span>
                    <span className="font-mono text-[10px] text-dash-text-secondary shrink-0">
                      {b.count.toLocaleString()}
                    </span>
                  </button>
                ))}
                {filteredBrands.length === 0 && (
                  <p className="px-3 py-4 text-xs text-dash-text-secondary text-center">
                    —
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="space-y-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-10 py-3 border border-brand-stone/20 bg-dash-surface font-body text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-text-secondary hover:text-brand-charcoal cursor-pointer"
                  aria-label="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isPending && (
                <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
              )}
            </div>

            <div className="text-xs font-body text-dash-text-secondary flex items-center gap-2 flex-wrap">
              {!result && (
                <span>{t.typeToSearch(MIN_QUERY)}</span>
              )}
              {result && (
                <>
                  <span className="font-medium text-brand-charcoal">
                    {t.resultsFound(result.total)}
                  </span>
                  {totalPages > 1 && (
                    <>
                      <span>·</span>
                      <span>{t.page(currentPage, totalPages)}</span>
                    </>
                  )}
                </>
              )}
            </div>

            {result && result.items.length === 0 && !isPending ? (
              <p className="font-body text-dash-text-secondary py-12 text-center">
                {t.noResults}
              </p>
            ) : (
              result && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.items.map((p) => (
                    <Link
                      key={p.id}
                      href={`/${locale}/shop/quote/${p.slug}`}
                      className="border border-brand-stone/15 bg-dash-surface p-4 hover:border-brand-copper transition-colors flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <span className="font-mono text-xs text-dash-text-secondary truncate">
                          {p.sku}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-brand-copper shrink-0">
                          {p.category}
                        </span>
                      </div>
                      <h3 className="font-body font-semibold text-sm text-brand-charcoal mb-1 line-clamp-2">
                        {p.name}
                      </h3>
                      {p.brand && (
                        <p className="font-body text-xs text-dash-text-secondary mb-3">
                          {p.brand}
                        </p>
                      )}
                      <div className="mt-auto pt-3 border-t border-brand-stone/10 flex items-center justify-between">
                        <span className="font-body text-xs text-dash-text-secondary">
                          {t.viewDetails}
                        </span>
                        <span className="font-body text-xs font-semibold text-brand-copper">
                          {t.requestQuote} →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}

            {result && totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  disabled={offset === 0}
                  className="px-3 py-1.5 text-sm border border-brand-stone/20 bg-dash-surface hover:bg-brand-linen disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-body"
                >
                  {t.previous}
                </button>
                <span className="text-xs font-body text-dash-text-secondary">
                  {t.showingRange(
                    offset + 1,
                    Math.min(offset + PAGE_SIZE, result.total),
                    result.total
                  )}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setOffset(
                      Math.min(
                        Math.max(0, result.total - PAGE_SIZE),
                        offset + PAGE_SIZE
                      )
                    )
                  }
                  disabled={offset + PAGE_SIZE >= result.total}
                  className="px-3 py-1.5 text-sm border border-brand-stone/20 bg-dash-surface hover:bg-brand-linen disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-body"
                >
                  {t.next}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export { QuoteCatalog };
