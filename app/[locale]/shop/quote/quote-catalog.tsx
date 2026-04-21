"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import type { Product } from "@/app/lib/types";

interface QuoteCatalogProps {
  locale: "en" | "es";
  brands: string[];
}

const T = {
  en: {
    searchPlaceholder: "Search by SKU, name, or brand…",
    allBrands: "All brands",
    allCategories: "All categories",
    bathroom: "Bathroom",
    kitchen: "Kitchen",
    hardware: "Hardware",
    noResults: "No results. Try a different search term.",
    resultsFound: (n: number) => `${n.toLocaleString()} result${n === 1 ? "" : "s"}`,
    requestQuote: "Request Quote",
    tryLive: "No local match — searching supplier catalog…",
    typeToSearch: "Type to search the catalog. Include finish codes (e.g. \"US10B\") for precise matches.",
    viewDetails: "View details",
  },
  es: {
    searchPlaceholder: "Busca por SKU, nombre o marca…",
    allBrands: "Todas las marcas",
    allCategories: "Todas las categorías",
    bathroom: "Baño",
    kitchen: "Cocina",
    hardware: "Herrajes",
    noResults: "Sin resultados. Prueba otro término.",
    resultsFound: (n: number) => `${n.toLocaleString()} resultado${n === 1 ? "" : "s"}`,
    requestQuote: "Solicitar Cotización",
    tryLive: "Sin coincidencias locales — buscando en catálogo del proveedor…",
    typeToSearch: "Escribe para buscar. Incluye códigos de acabado (ej. \"US10B\") para resultados precisos.",
    viewDetails: "Ver detalles",
  },
};

const QuoteCatalog = ({ locale, brands }: QuoteCatalogProps) => {
  const t = T[locale];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState<"cache" | "hybrid" | null>(null);
  const [liveHits, setLiveHits] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const id = setTimeout(() => {
      startTransition(async () => {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (category) params.set("category", category);
        if (brand) params.set("brand", brand);
        params.set("limit", "48");
        const res = await fetch(`/api/quote-search?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setSource(data.source ?? null);
        setLiveHits(data.liveHits ?? 0);
      });
    }, 250);
    return () => clearTimeout(id);
  }, [query, category, brand]);

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Search + filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-stone" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-3 border border-brand-stone/20 bg-white font-body text-sm focus:outline-none focus:border-brand-copper"
            />
            {isPending && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-stone animate-spin" />
            )}
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-3 border border-brand-stone/20 bg-white font-body text-sm focus:outline-none focus:border-brand-copper"
          >
            <option value="">{t.allCategories}</option>
            <option value="bathroom">{t.bathroom}</option>
            <option value="kitchen">{t.kitchen}</option>
            <option value="hardware">{t.hardware}</option>
          </select>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="px-4 py-3 border border-brand-stone/20 bg-white font-body text-sm focus:outline-none focus:border-brand-copper min-w-[180px]"
          >
            <option value="">{t.allBrands}</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Status line */}
        <div className="mb-4 text-xs font-body text-brand-stone">
          {query.length === 0 && total === 0 ? (
            t.typeToSearch
          ) : (
            <>
              {t.resultsFound(total)}
              {source === "hybrid" && liveHits > 0 && (
                <span className="ml-2 text-brand-copper">· +{liveHits} live from supplier</span>
              )}
            </>
          )}
        </div>

        {/* Results */}
        {items.length === 0 && !isPending && query ? (
          <p className="font-body text-brand-stone py-12 text-center">{t.noResults}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p) => (
              <Link
                key={p.id}
                href={`/${locale}/shop/quote/${p.slug}`}
                className="border border-brand-stone/15 bg-white p-4 hover:border-brand-copper transition-colors flex flex-col"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs text-brand-stone">{p.sku}</span>
                  <span className="text-[10px] uppercase tracking-wider text-brand-copper">
                    {p.category}
                  </span>
                </div>
                <h3 className="font-body font-semibold text-sm text-brand-charcoal mb-1 line-clamp-2">
                  {p.name}
                </h3>
                {p.brand && (
                  <p className="font-body text-xs text-brand-stone mb-3">{p.brand}</p>
                )}
                <div className="mt-auto pt-3 border-t border-brand-stone/10 flex items-center justify-between">
                  <span className="font-body text-xs text-brand-stone">{t.viewDetails}</span>
                  <span className="font-body text-xs font-semibold text-brand-copper">
                    {t.requestQuote} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export { QuoteCatalog };
