"use client";

import { useState, useEffect, useMemo, useTransition, useCallback, useRef } from "react";
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
  Camera,
} from "lucide-react";
import type { ProductFull, ProductFullWithSignals, BrandCount } from "@/app/lib/products-full";
import { pdpHref } from "@/app/lib/pdp-href";
import { ProductVisual } from "@/app/components/product-visual";
import { VisualSearchModal } from "@/app/components/visual-search-modal";
import { brandTheme } from "@/app/lib/product-visuals";
import { cachedFetch } from "@/app/lib/search-utils";

// Color-coded finish swatches — architects scan finish codes (MB/PC/BG/etc.)
// at a glance on SKU sheets. This turns code-scanning into color-scanning
// and adds chromatic life to an otherwise monochrome utility page.
// Click sets the search query to the finish code, leveraging the existing
// full-text search to filter products with that finish.
const FINISH_SWATCHES = [
  { code: "MB", label: { en: "Matte Black", es: "Negro Mate" }, bg: "#1A1A1A" },
  { code: "PC", label: { en: "Chrome", es: "Cromado" }, bg: "#CACED2" },
  { code: "BN", label: { en: "Nickel", es: "Níquel" }, bg: "#B6B7B0" },
  { code: "GL", label: { en: "Gold", es: "Oro" }, bg: "#B8904A" },
  { code: "PB", label: { en: "Brass", es: "Latón" }, bg: "#B09058" },
  { code: "ORB", label: { en: "Bronze", es: "Bronce" }, bg: "#3B2817" },
  { code: "CP", label: { en: "Copper", es: "Cobre" }, bg: "#B87333" },
  { code: "WH", label: { en: "White", es: "Blanco" }, bg: "#F4EFE7" },
] as const;

interface SearchResponse {
  items: ProductFullWithSignals[];
  total: number;
  offset: number;
  limit: number;
  elapsedMs: number;
}

interface CatalogViewProps {
  locale: "en" | "es";
  brandCounts: BrandCount[];
  totalProducts: number;
  brandImageMap?: Record<string, string>;
  initialResult?: SearchResponse | null;
}

type Category = "all" | "bathroom" | "kitchen" | "hardware";
type SortKey = "most_specified" | "relevance" | "alpha" | "price_asc" | "price_desc";
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
    sortMostSpecified: "Most specified",
    sortRelevance: "Best match",
    sortAlpha: "Name A–Z",
    sortPriceAsc: "Price low → high",
    sortPriceDesc: "Price high → low",
    inStockOnly: "In stock only",
    visualSearch: "Find by photo",
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
    sortMostSpecified: "Más especificados",
    sortRelevance: "Más relevante",
    sortAlpha: "Nombre A–Z",
    sortPriceAsc: "Precio menor → mayor",
    sortPriceDesc: "Precio mayor → menor",
    inStockOnly: "Solo en stock",
    visualSearch: "Buscar por foto",
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

const VALID_SORTS: SortKey[] = [
  "most_specified",
  "relevance",
  "alpha",
  "price_asc",
  "price_desc",
];

const CatalogView = ({ locale, brandCounts, totalProducts, brandImageMap = {}, initialResult }: CatalogViewProps) => {
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
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const raw = searchParams.get("sort");
    return raw && VALID_SORTS.includes(raw as SortKey)
      ? (raw as SortKey)
      : "most_specified";
  });
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get("view") as ViewMode) || "grid"
  );
  const [offset, setOffset] = useState(Number(searchParams.get("offset") ?? 0));

  const [brandFilter, setBrandFilter] = useState("");
  const [inStockOnly, setInStockOnly] = useState(
    searchParams.get("inStock") === "true"
  );
  const [result, setResult] = useState<SearchResponse | null>(initialResult ?? null);
  const [needsAccess, setNeedsAccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);
  const reqIdRef = useRef(0);

  const openProduct = useCallback(
    (p: ProductFull) => router.push(pdpHref(locale, p)),
    [router, locale],
  );

  // Sync filters → URL (shallow)
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim().length >= MIN_QUERY) params.set("q", query.trim());
    if (brand) params.set("brand", brand);
    if (category !== "all") params.set("category", category);
    if (sortKey !== "most_specified") params.set("sort", sortKey);
    if (viewMode !== "grid") params.set("view", viewMode);
    if (offset > 0) params.set("offset", String(offset));
    if (inStockOnly) params.set("inStock", "true");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [query, brand, category, sortKey, viewMode, offset, inStockOnly, router, pathname]);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
  }, [query, brand, category, sortKey, inStockOnly]);

  // Fetch — always loads, even with no filters (defaults to most-specified
  // products so the page never renders as a confusing empty state).
  const [fetchError, setFetchError] = useState<string | null>(null);
  useEffect(() => {
    const id = setTimeout(() => {
      const myReq = ++reqIdRef.current;
      startTransition(async () => {
        const p = new URLSearchParams();
        if (query.trim().length >= MIN_QUERY) p.set("q", query.trim());
        if (brand) p.set("brand", brand);
        if (category !== "all") p.set("category", category);
        if (inStockOnly) p.set("inStock", "true");
        p.set("sort", sortKey);
        p.set("limit", String(PAGE_SIZE));
        p.set("offset", String(offset));
        try {
          const data = await cachedFetch<SearchResponse>(`/api/products/search?${p}`);
          if (myReq !== reqIdRef.current) return;
          setNeedsAccess(false);
          setFetchError(null);
          setResult(data);
        } catch (e) {
          if (myReq !== reqIdRef.current) return;
          const msg = e instanceof Error ? e.message : "";
          if (msg.includes("→ 401")) {
            setNeedsAccess(true);
            setResult(null);
            setFetchError(null);
            return;
          }
          setFetchError(msg || "Catalog search failed. Retry below.");
        }
      });
    }, 180);
    return () => clearTimeout(id);
  }, [query, brand, category, sortKey, offset, inStockOnly]);

  const filteredBrands = useMemo(() => {
    if (!brandFilter) return brandCounts;
    const n = brandFilter.toLowerCase();
    return brandCounts.filter((b) => b.brand.toLowerCase().includes(n));
  }, [brandCounts, brandFilter]);

  const sortedItems = useMemo(() => result?.items ?? [], [result]);

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const hasFilters = query.trim().length >= MIN_QUERY || brand || category !== "all";

  const clearAll = useCallback(() => {
    setQuery("");
    setBrand("");
    setCategory("all");
    setSortKey("most_specified");
    setOffset(0);
  }, []);

  // Sidebar content — reused for desktop + mobile drawer
  const sidebar = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="font-body text-[11px] font-semibold tracking-[0.2em] uppercase text-dash-text-secondary">
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
        <label className="block font-body text-[10px] font-semibold tracking-[0.18em] uppercase text-dash-text-secondary mb-2">
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
        <label className="block font-body text-[10px] font-semibold tracking-[0.18em] uppercase text-dash-text-secondary mb-2">
          {t.brand} ({brandCounts.length})
        </label>
        <input
          type="text"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          placeholder={t.searchBrands}
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
          {filteredBrands.map((b) => {
            const maxCount = brandCounts[0]?.count || 1;
            const pct = Math.max(4, (b.count / maxCount) * 100);
            const theme = brandTheme(b.brand);
            const isActive = brand === b.brand;
            return (
              <button
                key={b.brand}
                type="button"
                onClick={() => setBrand(b.brand)}
                className={`group relative w-full text-left px-3 py-2.5 text-xs flex items-center justify-between border-b border-brand-stone/10 last:border-b-0 transition-all cursor-pointer overflow-hidden ${
                  isActive
                    ? "font-medium text-brand-charcoal"
                    : "text-brand-charcoal hover:text-brand-copper"
                }`}
              >
                {/* Proportional bar tinted by brand color — turns the list
                    into a chromatic ranking. Light brands (Emtek, Blanco)
                    show as faint warm tints; dark brands (Brizo, Kohler)
                    show as deep smokes. */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: theme.bg + (isActive ? "73" : "26"),
                  }}
                />
                <span className="relative truncate pr-2 inline-flex items-center gap-2 min-w-0">
                  <span
                    aria-hidden
                    className="w-1.5 h-1.5 rounded-full shrink-0 ring-1 ring-black/10"
                    style={{ background: theme.bg }}
                  />
                  <span className="truncate">{b.brand || "(blank)"}</span>
                </span>
                <span className="relative font-mono text-[10px] text-dash-text-secondary shrink-0 tabular-nums">
                  {b.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Editorial section header that adapts based on what filters are active.
  const sectionEyebrow =
    query.trim().length >= MIN_QUERY
      ? locale === "es" ? "Resultados" : "Results"
      : brand
        ? locale === "es" ? "Marca" : "Brand"
        : category !== "all"
          ? locale === "es" ? "Categoría" : "Category"
          : sortKey === "most_specified"
            ? locale === "es" ? "Más especificados" : "Most Specified"
            : locale === "es" ? "Catálogo" : "Catalog";

  const sectionHeadline =
    query.trim().length >= MIN_QUERY
      ? `"${query.trim()}"`
      : brand
        ? brand
        : category === "bathroom"
          ? locale === "es" ? "Baño" : "Bathroom"
          : category === "kitchen"
            ? locale === "es" ? "Cocina" : "Kitchen"
            : category === "hardware"
              ? locale === "es" ? "Chapas y Herrajes" : "Door Hardware"
              : locale === "es"
                ? "Lo que arquitectos están pidiendo"
                : "What architects are specifying";

  return (
    <section className="py-12 md:py-16 bg-brand-linen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Editorial section header */}
        <div className="mb-8 md:mb-10 pb-6 border-b border-brand-stone/15">
          <span className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
            {sectionEyebrow}
          </span>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-display text-3xl md:text-4xl font-light text-brand-charcoal tracking-wide">
              {sectionHeadline}
            </h2>
            {result && (
              <span className="font-body text-sm text-dash-text-secondary tabular-nums">
                {t.resultsFound(result.total)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-10">
          <aside className="hidden lg:block">{sidebar}</aside>

          <div className="space-y-5">
            {/* Search + toolbar */}
            <div className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-3 border border-brand-stone/20 bg-dash-surface text-sm font-body text-brand-charcoal cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {t.mobileFilters}
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-10 pr-20 py-3 border border-brand-stone/20 bg-dash-surface font-body text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper"
                />
                <button
                  type="button"
                  onClick={() => setVisualSearchOpen(true)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-brand-copper hover:text-brand-copper/70 cursor-pointer"
                  title={t.visualSearch}
                  aria-label={t.visualSearch}
                >
                  <Camera className="w-4 h-4" />
                </button>
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-dash-text-secondary hover:text-brand-charcoal cursor-pointer"
                    aria-label="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isPending && (
                  <Loader2 className="absolute right-[68px] top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
                )}
              </div>
              {/* Grid/Table view toggle — hidden on tiny screens */}
              <div className="hidden sm:flex border border-brand-stone/20 bg-dash-surface">
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
                  className="appearance-none h-full pl-4 pr-9 py-3 border border-brand-stone/20 bg-dash-surface text-sm font-body text-brand-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper cursor-pointer"
                >
                  <option value="most_specified">{t.sortMostSpecified}</option>
                  <option value="relevance">{t.sortRelevance}</option>
                  <option value="alpha">{t.sortAlpha}</option>
                  <option value="price_asc">{t.sortPriceAsc}</option>
                  <option value="price_desc">{t.sortPriceDesc}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
              </div>
            </div>

            {/* Finish swatch quick-filter — chromatic accent + utility.
                Sets the search query to the finish code; click again to clear. */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 -mt-1">
              <span className="font-body text-[10px] tracking-[0.2em] uppercase text-dash-text-secondary">
                {locale === "es" ? "Acabado" : "Finish"}
              </span>
              {FINISH_SWATCHES.map((f) => {
                const isActive = query.trim().toUpperCase() === f.code;
                return (
                  <button
                    key={f.code}
                    type="button"
                    onClick={() => setQuery(isActive ? "" : f.code)}
                    title={f.label[locale]}
                    aria-pressed={isActive}
                    className="group inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      aria-hidden
                      className={`w-5 h-5 rounded-full ring-1 transition-all ${
                        isActive
                          ? "ring-brand-copper ring-offset-2 ring-offset-brand-linen scale-110"
                          : "ring-black/15 group-hover:scale-110 group-hover:ring-black/30"
                      }`}
                      style={{ background: f.bg }}
                    />
                    <span
                      className={`font-body text-[10px] tracking-wider transition-colors ${
                        isActive
                          ? "text-brand-charcoal font-medium"
                          : "text-dash-text-secondary group-hover:text-brand-charcoal"
                      }`}
                    >
                      {f.label[locale]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active filters + status */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-body">
              {result && totalPages > 1 && (
                <span className="text-dash-text-secondary mr-2">
                  {t.page(currentPage, totalPages)}
                </span>
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
              <button
                type="button"
                onClick={() => setInStockOnly((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded text-[11px] font-medium cursor-pointer transition-colors ${
                  inStockOnly
                    ? "bg-brand-sage/15 text-brand-sage border-brand-sage/40 hover:bg-brand-sage/25"
                    : "bg-dash-surface text-dash-text-secondary border-brand-stone/20 hover:border-brand-sage/40"
                }`}
                aria-pressed={inStockOnly}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${inStockOnly ? "bg-brand-sage" : "bg-brand-stone/30"}`} />
                {t.inStockOnly}
              </button>
            </div>

            {fetchError && (
              <div
                role="alert"
                className="px-4 py-3 rounded border border-red-500/40 bg-red-500/10 text-red-700 text-sm flex items-center justify-between gap-3"
              >
                <span>{fetchError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setOffset((o) => o);
                    setFetchError(null);
                  }}
                  className="px-3 py-1 text-xs font-medium border border-red-500/40 rounded hover:bg-red-500/10 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}
            {/* Grid or table */}
            {result && sortedItems.length > 0 && viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedItems.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    locale={locale}
                    onOpen={() => openProduct(p)}
                    t={t}
                    eager={i < 8}
                  />
                ))}
              </div>
            ) : result && sortedItems.length > 0 && viewMode === "table" ? (
              <ProductTable
                items={sortedItems}
                locale={locale}
                onOpen={(p) => openProduct(p)}
                t={t}
              />
            ) : result && sortedItems.length === 0 && !isPending ? (
              <div className="py-24 text-center">
                <Package className="w-10 h-10 text-dash-text-secondary/40 mx-auto mb-3" />
                <p className="font-body text-dash-text-secondary">
                  {!hasFilters && totalProducts === 0
                    ? locale === "es"
                      ? "Cargando catálogo — los datos de producto están siendo configurados."
                      : "Catalog loading — product data is being configured."
                    : t.noResults}
                </p>
              </div>
            ) : needsAccess ? (
              <div className="space-y-6">
                {/* Brand showcase — clickable tiles. Ghosted hero product
                    images sit behind a brand-themed color overlay so the
                    tiles read as "this brand" rather than as flat color. */}
                <div>
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
                      {locale === "es"
                        ? `${brandCounts.length} marcas en el catálogo`
                        : `${brandCounts.length} brands in the catalog`}
                    </span>
                    <span className="font-body text-xs text-dash-text-secondary tabular-nums hidden sm:inline">
                      {totalProducts.toLocaleString()} {locale === "es" ? "piezas" : "pieces"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {brandCounts.slice(0, 12).map((b) => {
                      const theme = brandTheme(b.brand);
                      const heroImage = brandImageMap[b.brand];
                      return (
                        <button
                          key={b.brand}
                          type="button"
                          onClick={() => setBrand(b.brand)}
                          className="group relative aspect-[4/5] overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5"
                          style={{ background: theme.bg, color: theme.fg }}
                          title={b.brand}
                        >
                          {/* Ghosted hero product image — sits beneath the
                              color overlay to give each tile a hint of
                              what's actually inside that brand. */}
                          {heroImage && (
                            <div
                              aria-hidden="true"
                              className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                              style={{
                                backgroundImage: `url('${heroImage}')`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }}
                            />
                          )}
                          {/* Brand-color overlay — translucent when an image
                              is present, solid when it isn't. */}
                          <div
                            aria-hidden="true"
                            className="absolute inset-0"
                            style={{
                              backgroundColor: theme.bg,
                              opacity: heroImage ? 0.78 : 1,
                            }}
                          />
                          <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none" />

                          {/* Centered brand wordmark */}
                          <div className="absolute inset-0 flex items-center justify-center px-4">
                            <h4
                              className="font-display font-light tracking-wide text-xl md:text-2xl lg:text-3xl text-center truncate max-w-full opacity-95"
                              style={{ color: theme.fg }}
                            >
                              {b.brand}
                            </h4>
                          </div>

                          {/* Bottom info strip — count · view */}
                          <div
                            className="absolute inset-x-0 bottom-0 px-3 py-2.5 flex items-center justify-between text-[10px] tracking-wider uppercase"
                            style={{
                              background: "rgba(0,0,0,0.22)",
                              color: theme.fg,
                            }}
                          >
                            <span className="font-mono tabular-nums opacity-85">
                              {b.count.toLocaleString()}
                            </span>
                            <span className="font-body opacity-0 group-hover:opacity-95 transition-opacity">
                              {locale === "es" ? "Ver →" : "View →"}
                            </span>
                          </div>

                          {/* Top corner accent */}
                          <div
                            className="absolute top-0 left-0 w-8 h-[2px]"
                            style={{ background: theme.fg, opacity: 0.4 }}
                          />
                          <div
                            className="absolute top-0 left-0 w-[2px] h-8"
                            style={{ background: theme.fg, opacity: 0.4 }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Catalog Access band — sits below the brand grid. The gate
                    is explicit, not visual. Pricing/specs are gated; brand
                    exploration isn't. */}
                <div className="relative bg-brand-charcoal overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                      backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px)`,
                    }}
                  />
                  <div className="relative px-6 py-8 md:py-10">
                    <div className="max-w-2xl mx-auto text-center">
                      <span className="font-body font-semibold text-[10px] tracking-[0.3em] text-brand-copper uppercase">
                        {locale === "es" ? "Acceso al catálogo" : "Catalog Access"}
                      </span>
                      <h3 className="mt-3 font-display text-xl md:text-2xl font-light text-white tracking-wide">
                        {locale === "es"
                          ? "Pricing y especificaciones detrás del muro."
                          : "Pricing and specs sit behind the wall."}
                      </h3>
                      <p className="mt-3 font-body text-sm text-white/55">
                        {locale === "es"
                          ? "Solicita acceso para ver detalles, precios y cotizar."
                          : "Request access to see details, pricing, and quote."}
                      </p>
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <a
                          href={`/${locale}/contact`}
                          className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-body font-medium bg-brand-copper text-white hover:bg-brand-copper/90 transition-colors"
                        >
                          {locale === "es" ? "Contactar al equipo" : "Contact the team"}
                        </a>
                        <a
                          href="/dashboard/login"
                          className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-body font-medium border border-white/30 text-white hover:bg-white/10 transition-colors"
                        >
                          {locale === "es" ? "Iniciar sesión" : "Sign in"}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : !result && !isPending ? (
              <div className="py-24 text-center">
                <Loader2 className="w-6 h-6 text-brand-stone/60 mx-auto animate-spin" />
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
                  className="px-4 py-2 text-sm border border-brand-stone/20 bg-dash-surface hover:bg-brand-linen disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-body"
                >
                  {t.prev}
                </button>
                <span className="text-xs font-body text-dash-text-secondary hidden sm:inline">
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
                  className="px-4 py-2 text-sm border border-brand-stone/20 bg-dash-surface hover:bg-brand-linen disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-body"
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
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-dash-surface overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5">
              <span className="font-display text-lg text-brand-charcoal">
                {t.filters}
              </span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 text-dash-text-secondary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      <VisualSearchModal
        open={visualSearchOpen}
        onClose={() => setVisualSearchOpen(false)}
        locale={locale}
        onSelect={(p) => {
          setVisualSearchOpen(false);
          openProduct(p);
        }}
      />
    </section>
  );
};

// ───────────────────────────────────────────────────────────────────────
// Product card (editorial style, matches /shop aesthetic)
// ───────────────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: ProductFullWithSignals;
  locale: "en" | "es";
  onOpen: () => void;
  t: typeof T["en"];
  eager?: boolean;
}

const ProductCard = ({ product, locale, onOpen, t, eager }: ProductCardProps) => {
  const price = formatPrice(product.listPrice, product.currency, locale);
  return (
    <div className="group bg-dash-surface border border-brand-stone/15 hover:border-brand-copper/60 transition-colors flex flex-col">
      <button
        type="button"
        onClick={onOpen}
        className="block cursor-pointer overflow-hidden relative"
      >
        <ProductVisual
          id={product.id}
          brand={product.brand}
          sku={product.sku}
          name={product.name || product.sku}
          aspect="4/3"
          size="card"
          hasImage={product.hasImage}
          imageSrc={product.imageSrc}
          eager={eager}
          className="group-hover:[&>img]:scale-[1.02] [&>img]:transition-transform [&>img]:duration-500"
        />
      </button>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="font-body text-[10px] tracking-[0.15em] text-brand-copper uppercase">
            {product.brand || "—"}
          </span>
          <span className="font-body text-[10px] text-dash-text-secondary uppercase tracking-wider">
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
          <p className="mt-1 font-mono text-[10px] text-dash-text-secondary truncate">
            {product.sku || "—"}
          </p>
        </button>
        <div className="mt-3 pt-3 border-t border-brand-stone/10">
          <span className="font-body text-xs text-brand-charcoal">
            {product.listPrice > 10 ? (
              <>
                <span className="text-dash-text-secondary">{locale === "es" ? "desde" : "from"}</span>{" "}
                <span className="font-medium">{price}</span>
              </>
            ) : (
              <span className="text-dash-text-secondary">{locale === "es" ? "Cotización" : "Quote"}</span>
            )}
          </span>
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
  items: ProductFullWithSignals[];
  locale: "en" | "es";
  onOpen: (p: ProductFull) => void;
  t: typeof T["en"];
}

const ProductTable = ({ items, locale, onOpen, t }: ProductTableProps) => (
  <div className="border border-brand-stone/15 bg-dash-surface overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-brand-linen/60 border-b border-brand-stone/15">
        <tr className="font-body text-[10px] text-dash-text-secondary uppercase tracking-[0.15em]">
          <th className="text-left px-4 py-3 font-semibold w-16">{t.colSku}</th>
          <th className="text-left px-4 py-3 font-semibold">{t.colProduct}</th>
          <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">{t.colBrand}</th>
          <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">{t.colPrice}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((p) => {
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
                    hasImage={p.hasImage}
                    imageSrc={p.imageSrc}
                  />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 font-body text-[10px] text-brand-copper uppercase tracking-[0.15em]">
                  <span>{p.brand || "—"} · {p.category}</span>
                </div>
                <div className="font-body text-sm text-brand-charcoal mt-0.5 line-clamp-1">
                  {p.name || p.sku}
                </div>
                <div className="font-mono text-[10px] text-dash-text-secondary mt-0.5 truncate">
                  {p.sku || "—"}
                </div>
              </td>
              <td className="px-4 py-3 hidden md:table-cell font-body text-sm text-dash-text-secondary">
                {p.brand || "—"}
              </td>
              <td className="px-4 py-3 hidden sm:table-cell text-right font-body text-sm text-brand-charcoal whitespace-nowrap">
                {p.listPrice > 10 ? (
                  <span>
                    <span className="text-dash-text-secondary text-[10px] tracking-wider uppercase mr-1">
                      {locale === "es" ? "desde" : "from"}
                    </span>
                    {formatPrice(p.listPrice, p.currency, locale)}
                  </span>
                ) : (
                  <span className="text-dash-text-secondary text-xs italic">
                    {locale === "es" ? "Cotizar" : "Quote"}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export { CatalogView };
