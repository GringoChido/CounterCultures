"use client";

import { useState, useEffect, useMemo, useTransition, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  Loader2,
  X,
  SlidersHorizontal,
  Package,
  ChevronDown,
  LayoutGrid,
  List,
  Plus,
  Check,
} from "lucide-react";
import type { ProductFull, BrandCount } from "@/app/lib/products-full";
import { useProjectListStore } from "@/app/lib/stores/project-list-store";
import { ProductVisual } from "@/app/components/product-visual";
import { ProductDrawer } from "./product-drawer";

interface SearchResponse {
  items: ProductFull[];
  total: number;
  offset: number;
  limit: number;
  elapsedMs: number;
}

interface CatalogViewProps {
  locale: "en" | "es";
  brandCounts: BrandCount[];
  totalProducts: number;
}

type Category = "all" | "bathroom" | "kitchen" | "hardware";
type SortKey = "recent" | "alpha" | "price-asc" | "price-desc";
type ViewMode = "grid" | "table";

const PAGE_SIZE = 60;
const MIN_QUERY = 2;

const T = {
  en: {
    filters: "Filters",
    clearFilters: "Clear all",
    category: "Category",
    allCategories: "All categories",
    bathroom: "Bathroom",
    kitchen: "Kitchen",
    hardware: "Hardware",
    brand: "Brand",
    searchBrands: "Search brands…",
    allBrands: "All brands",
    sortBy: "Sort by",
    sortRecent: "Newly added",
    sortAlpha: "Name A–Z",
    sortPriceAsc: "Price low → high",
    sortPriceDesc: "Price high → low",
    searchPlaceholder: "Search by brand, model, or name…",
    typeHint: (min: number) =>
      `Type at least ${min} characters, or pick a brand from the list.`,
    resultsFound: (n: number) =>
      `${n.toLocaleString()} result${n === 1 ? "" : "s"}`,
    noResults: "No products match these filters.",
    brandFilterChip: "Brand",
    categoryFilterChip: "Category",
    page: (cur: number, tot: number) =>
      `Page ${cur} of ${tot.toLocaleString()}`,
    prev: "← Previous",
    next: "Next →",
    showing: (a: number, b: number, n: number) =>
      `Showing ${a}–${b} of ${n.toLocaleString()}`,
    addToProject: "Add to project",
    inProject: "In project list",
    openDetails: "View",
    mobileFilters: "Filters",
    viewGrid: "Grid",
    viewTable: "Table",
    colProduct: "Product",
    colSku: "SKU",
    colBrand: "Brand",
    colFinish: "Finish",
    colPrice: "Price",
    colAction: "",
  },
  es: {
    filters: "Filtros",
    clearFilters: "Limpiar",
    category: "Categoría",
    allCategories: "Todas las categorías",
    bathroom: "Baño",
    kitchen: "Cocina",
    hardware: "Herrajes",
    brand: "Marca",
    searchBrands: "Buscar marcas…",
    allBrands: "Todas las marcas",
    sortBy: "Ordenar",
    sortRecent: "Agregados recientemente",
    sortAlpha: "Nombre A–Z",
    sortPriceAsc: "Precio menor → mayor",
    sortPriceDesc: "Precio mayor → menor",
    searchPlaceholder: "Busca por marca, modelo o nombre…",
    typeHint: (min: number) =>
      `Escribe al menos ${min} caracteres o elige una marca.`,
    resultsFound: (n: number) =>
      `${n.toLocaleString()} resultado${n === 1 ? "" : "s"}`,
    noResults: "Sin resultados. Prueba otros filtros.",
    brandFilterChip: "Marca",
    categoryFilterChip: "Categoría",
    page: (cur: number, tot: number) =>
      `Página ${cur} de ${tot.toLocaleString()}`,
    prev: "← Anterior",
    next: "Siguiente →",
    showing: (a: number, b: number, n: number) =>
      `Mostrando ${a}–${b} de ${n.toLocaleString()}`,
    addToProject: "Agregar al proyecto",
    inProject: "En el proyecto",
    openDetails: "Ver",
    mobileFilters: "Filtros",
    viewGrid: "Cuadrícula",
    viewTable: "Tabla",
    colProduct: "Producto",
    colSku: "SKU",
    colBrand: "Marca",
    colFinish: "Acabado",
    colPrice: "Precio",
    colAction: "",
  },
};

const formatPrice = (p: number, cur: string, locale: string) =>
  p > 0
    ? `${cur} ${p.toLocaleString(locale === "es" ? "es-MX" : "en-US", {
        maximumFractionDigits: 0,
      })}`
    : "—";

// Sort client-side within a page of results. Server returns by relevance
// when a query is present; sort applies after for stable display ordering.
const sortPage = (items: ProductFull[], key: SortKey): ProductFull[] => {
  if (key === "recent") return items;
  const sorted = [...items];
  if (key === "alpha") {
    sorted.sort((a, b) => (a.name || a.sku).localeCompare(b.name || b.sku));
  } else if (key === "price-asc") {
    sorted.sort((a, b) => a.listPrice - b.listPrice);
  } else if (key === "price-desc") {
    sorted.sort((a, b) => b.listPrice - a.listPrice);
  }
  return sorted;
};

const CatalogView = ({ locale, brandCounts, totalProducts }: CatalogViewProps) => {
  const t = T[locale];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-synced filter state (shareable/deep-linkable)
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [brand, setBrand] = useState(searchParams.get("brand") ?? "");
  const [category, setCategory] = useState<Category>(
    (searchParams.get("category") as Category) || "all"
  );
  const [sortKey, setSortKey] = useState<SortKey>(
    (searchParams.get("sort") as SortKey) || "recent"
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get("view") as ViewMode) || "grid"
  );
  const [offset, setOffset] = useState(Number(searchParams.get("offset") ?? 0));

  const [brandFilter, setBrandFilter] = useState("");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<ProductFull | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const projectHas = useProjectListStore((s) => s.has);
  const projectAdd = useProjectListStore((s) => s.add);

  // Sync filters → URL (shallow)
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim().length >= MIN_QUERY) params.set("q", query.trim());
    if (brand) params.set("brand", brand);
    if (category !== "all") params.set("category", category);
    if (sortKey !== "recent") params.set("sort", sortKey);
    if (viewMode !== "grid") params.set("view", viewMode);
    if (offset > 0) params.set("offset", String(offset));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [query, brand, category, sortKey, viewMode, offset, router, pathname]);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
  }, [query, brand, category, sortKey]);

  // Fetch
  useEffect(() => {
    const needsSearch =
      query.trim().length >= MIN_QUERY || brand || category !== "all";
    if (!needsSearch) {
      setResult(null);
      return;
    }
    const id = setTimeout(() => {
      startTransition(async () => {
        const p = new URLSearchParams();
        if (query.trim().length >= MIN_QUERY) p.set("q", query.trim());
        if (brand) p.set("brand", brand);
        if (category !== "all") p.set("category", category);
        p.set("limit", String(PAGE_SIZE));
        p.set("offset", String(offset));
        const res = await fetch(`/api/dashboard/products/search?${p}`);
        if (!res.ok) return;
        setResult(await res.json());
      });
    }, 180);
    return () => clearTimeout(id);
  }, [query, brand, category, offset]);

  const filteredBrands = useMemo(() => {
    if (!brandFilter) return brandCounts;
    const n = brandFilter.toLowerCase();
    return brandCounts.filter((b) => b.brand.toLowerCase().includes(n));
  }, [brandCounts, brandFilter]);

  const sortedItems = useMemo(
    () => (result ? sortPage(result.items, sortKey) : []),
    [result, sortKey]
  );

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const hasFilters = query.trim().length >= MIN_QUERY || brand || category !== "all";

  const clearAll = useCallback(() => {
    setQuery("");
    setBrand("");
    setCategory("all");
    setSortKey("recent");
    setOffset(0);
  }, []);

  // Sidebar content — reused for desktop + mobile drawer
  const sidebar = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="font-body text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-stone">
          {t.filters}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] text-brand-copper hover:underline cursor-pointer"
          >
            {t.clearFilters}
          </button>
        )}
      </div>

      <div>
        <label className="block font-body text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-stone mb-2">
          {t.category}
        </label>
        <div className="space-y-0.5 text-sm">
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
        <label className="block font-body text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-stone mb-2">
          {t.brand} ({brandCounts.length})
        </label>
        <input
          type="text"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          placeholder={t.searchBrands}
          className="w-full px-3 py-2 text-sm border border-brand-stone/20 bg-white font-body focus:outline-none focus:border-brand-copper"
        />
        <div className="mt-2 max-h-[520px] overflow-y-auto border border-brand-stone/15 bg-white">
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
            <span className="font-mono text-[10px] text-brand-stone">
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
              <span className="truncate pr-2">{b.brand || "(blank)"}</span>
              <span className="font-mono text-[10px] text-brand-stone shrink-0">
                {b.count.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          <aside className="hidden lg:block">{sidebar}</aside>

          <div className="space-y-5">
            {/* Search + toolbar */}
            <div className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-3 border border-brand-stone/20 bg-white text-sm font-body text-brand-charcoal cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {t.mobileFilters}
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-stone" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-10 pr-10 py-3 border border-brand-stone/20 bg-white font-body text-sm focus:outline-none focus:border-brand-copper"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-stone hover:text-brand-charcoal cursor-pointer"
                    aria-label="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isPending && (
                  <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-stone animate-spin" />
                )}
              </div>
              {/* Grid/Table view toggle — hidden on tiny screens */}
              <div className="hidden sm:flex border border-brand-stone/20 bg-white">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title={t.viewGrid}
                  className={`flex items-center gap-1.5 px-3 text-sm font-body transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-brand-charcoal text-white"
                      : "text-brand-charcoal hover:bg-brand-linen"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  title={t.viewTable}
                  className={`flex items-center gap-1.5 px-3 text-sm font-body transition-colors cursor-pointer ${
                    viewMode === "table"
                      ? "bg-brand-charcoal text-white"
                      : "text-brand-charcoal hover:bg-brand-linen"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="appearance-none h-full pl-4 pr-9 py-3 border border-brand-stone/20 bg-white text-sm font-body text-brand-charcoal focus:outline-none focus:border-brand-copper cursor-pointer"
                >
                  <option value="recent">{t.sortRecent}</option>
                  <option value="alpha">{t.sortAlpha}</option>
                  <option value="price-asc">{t.sortPriceAsc}</option>
                  <option value="price-desc">{t.sortPriceDesc}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-stone" />
              </div>
            </div>

            {/* Active filters + status */}
            <div className="flex items-center gap-3 flex-wrap text-xs font-body">
              {result ? (
                <>
                  <span className="font-medium text-brand-charcoal">
                    {t.resultsFound(result.total)}
                  </span>
                  {totalPages > 1 && (
                    <>
                      <span className="text-brand-stone">·</span>
                      <span className="text-brand-stone">
                        {t.page(currentPage, totalPages)}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <span className="text-brand-stone">{t.typeHint(MIN_QUERY)}</span>
              )}
              {brand && (
                <button
                  type="button"
                  onClick={() => setBrand("")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-copper/10 text-brand-copper border border-brand-copper/20 rounded text-[11px] font-medium cursor-pointer hover:bg-brand-copper/20 transition-colors"
                >
                  {t.brandFilterChip}: {brand}
                  <X className="w-3 h-3" />
                </button>
              )}
              {category !== "all" && (
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-copper/10 text-brand-copper border border-brand-copper/20 rounded text-[11px] font-medium cursor-pointer hover:bg-brand-copper/20 transition-colors"
                >
                  {t.categoryFilterChip}: {category}
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Grid or table */}
            {result && sortedItems.length > 0 && viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedItems.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    locale={locale}
                    inProject={projectHas(p.id)}
                    onOpen={() => setSelected(p)}
                    onAdd={() =>
                      projectAdd({
                        id: p.id,
                        sku: p.sku,
                        name: p.name,
                        brand: p.brand,
                        category: p.category,
                        currency: p.currency,
                        listPrice: p.listPrice,
                      })
                    }
                    t={t}
                  />
                ))}
              </div>
            ) : result && sortedItems.length > 0 && viewMode === "table" ? (
              <ProductTable
                items={sortedItems}
                locale={locale}
                onOpen={(p) => setSelected(p)}
                onAdd={(p) =>
                  projectAdd({
                    id: p.id,
                    sku: p.sku,
                    name: p.name,
                    brand: p.brand,
                    category: p.category,
                    currency: p.currency,
                    listPrice: p.listPrice,
                  })
                }
                isInProject={(id) => projectHas(id)}
                t={t}
              />
            ) : result && sortedItems.length === 0 && !isPending ? (
              <div className="py-24 text-center">
                <Package className="w-10 h-10 text-brand-stone/40 mx-auto mb-3" />
                <p className="font-body text-brand-stone">{t.noResults}</p>
              </div>
            ) : null}

            {/* Pagination */}
            {result && totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setOffset(Math.max(0, offset - PAGE_SIZE));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={offset === 0}
                  className="px-4 py-2 text-sm border border-brand-stone/20 bg-white hover:bg-brand-linen disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-body"
                >
                  {t.prev}
                </button>
                <span className="text-xs font-body text-brand-stone hidden sm:inline">
                  {t.showing(
                    offset + 1,
                    Math.min(offset + PAGE_SIZE, result.total),
                    result.total
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOffset(
                      Math.min(
                        Math.max(0, result.total - PAGE_SIZE),
                        offset + PAGE_SIZE
                      )
                    );
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={offset + PAGE_SIZE >= result.total}
                  className="px-4 py-2 text-sm border border-brand-stone/20 bg-white hover:bg-brand-linen disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-body"
                >
                  {t.next}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-white overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5">
              <span className="font-display text-lg text-brand-charcoal">
                {t.filters}
              </span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 text-brand-stone cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <ProductDrawer
          product={selected}
          locale={locale}
          onClose={() => setSelected(null)}
          onPickProduct={(p) => setSelected(p)}
        />
      )}
    </section>
  );
};

// ───────────────────────────────────────────────────────────────────────
// Product card (editorial style, matches /shop aesthetic)
// ───────────────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: ProductFull;
  locale: "en" | "es";
  inProject: boolean;
  onOpen: () => void;
  onAdd: () => void;
  t: typeof T["en"];
}

const ProductCard = ({ product, locale, inProject, onOpen, onAdd, t }: ProductCardProps) => {
  const price = formatPrice(product.listPrice, product.currency, locale);
  return (
    <div className="group bg-white border border-brand-stone/15 hover:border-brand-copper/60 transition-colors flex flex-col">
      <button
        type="button"
        onClick={onOpen}
        className="block cursor-pointer overflow-hidden"
      >
        <ProductVisual
          id={product.id}
          brand={product.brand}
          sku={product.sku}
          name={product.name || product.sku}
          aspect="4/3"
          size="card"
          className="group-hover:[&>img]:scale-[1.02] [&>img]:transition-transform [&>img]:duration-500"
        />
      </button>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="font-body text-[10px] tracking-[0.15em] text-brand-copper uppercase">
            {product.brand || "—"}
          </span>
          <span className="font-body text-[10px] text-brand-stone uppercase tracking-wider">
            {product.category}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="text-left cursor-pointer"
        >
          <h3 className="font-body font-medium text-sm text-brand-charcoal line-clamp-2 leading-snug hover:text-brand-copper transition-colors">
            {product.name || product.sku}
          </h3>
          <p className="mt-1 font-mono text-[10px] text-brand-stone truncate">
            {product.sku || "—"}
          </p>
        </button>
        <div className="mt-3 pt-3 border-t border-brand-stone/10 flex items-center justify-between gap-2">
          <span className="font-body text-xs text-brand-charcoal">
            {product.listPrice > 0 ? (
              <>
                <span className="text-brand-stone">{locale === "es" ? "desde" : "from"}</span>{" "}
                <span className="font-medium">{price}</span>
              </>
            ) : (
              <span className="text-brand-stone">{locale === "es" ? "Cotización" : "Quote"}</span>
            )}
          </span>
          <button
            type="button"
            onClick={onAdd}
            disabled={inProject}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer disabled:cursor-default ${
              inProject
                ? "bg-brand-copper/10 text-brand-copper border border-brand-copper/30"
                : "bg-brand-copper text-white hover:bg-brand-copper/90"
            }`}
          >
            {inProject ? `✓ ${t.inProject}` : `+ ${t.addToProject}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────
// Table view — compact data-dense row format, architect-preferred for
// scanning 60+ SKUs at a time.
// ───────────────────────────────────────────────────────────────────────

interface ProductTableProps {
  items: ProductFull[];
  locale: "en" | "es";
  onOpen: (p: ProductFull) => void;
  onAdd: (p: ProductFull) => void;
  isInProject: (id: string) => boolean;
  t: typeof T["en"];
}

const ProductTable = ({ items, locale, onOpen, onAdd, isInProject, t }: ProductTableProps) => (
  <div className="border border-brand-stone/15 bg-white overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-brand-linen/60 border-b border-brand-stone/15">
        <tr className="font-body text-[10px] text-brand-stone uppercase tracking-[0.15em]">
          <th className="text-left px-4 py-3 font-semibold w-16">{t.colSku}</th>
          <th className="text-left px-4 py-3 font-semibold">{t.colProduct}</th>
          <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">{t.colBrand}</th>
          <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">{t.colPrice}</th>
          <th className="px-4 py-3 w-28" />
        </tr>
      </thead>
      <tbody>
        {items.map((p) => {
          const inList = isInProject(p.id);
          return (
            <tr
              key={p.id}
              className="border-t border-brand-stone/10 hover:bg-brand-linen/40 transition-colors cursor-pointer"
              onClick={() => onOpen(p)}
            >
              <td className="px-4 py-3">
                <div className="w-12 h-12">
                  <ProductVisual
                    id={p.id}
                    brand={p.brand}
                    sku={p.sku}
                    name={p.name || p.sku}
                    aspect="1/1"
                    size="tile"
                  />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="font-body text-[10px] text-brand-copper uppercase tracking-[0.15em]">
                  {p.brand || "—"} · {p.category}
                </div>
                <div className="font-body text-sm text-brand-charcoal mt-0.5 line-clamp-1">
                  {p.name || p.sku}
                </div>
                <div className="font-mono text-[10px] text-brand-stone mt-0.5 truncate">
                  {p.sku || "—"}
                </div>
              </td>
              <td className="px-4 py-3 hidden md:table-cell font-body text-sm text-brand-stone">
                {p.brand || "—"}
              </td>
              <td className="px-4 py-3 hidden sm:table-cell text-right font-body text-sm text-brand-charcoal whitespace-nowrap">
                {p.listPrice > 0 ? (
                  <span>
                    <span className="text-brand-stone text-[10px] tracking-wider uppercase mr-1">
                      {locale === "es" ? "desde" : "from"}
                    </span>
                    {formatPrice(p.listPrice, p.currency, locale)}
                  </span>
                ) : (
                  <span className="text-brand-stone text-xs italic">
                    {locale === "es" ? "Cotizar" : "Quote"}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(p);
                  }}
                  disabled={inList}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-body font-medium rounded transition-colors cursor-pointer disabled:cursor-default ${
                    inList
                      ? "bg-brand-copper/10 text-brand-copper border border-brand-copper/30"
                      : "bg-brand-copper text-white hover:bg-brand-copper/90"
                  }`}
                >
                  {inList ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span className="hidden sm:inline">{t.inProject}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span className="hidden sm:inline">{t.addToProject}</span>
                    </>
                  )}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export { CatalogView };
