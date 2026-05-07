"use client";

import { useState, useEffect, useMemo, useTransition, useRef } from "react";
import Image from "next/image";
import {
  Search,
  Loader2,
  Package,
  X,
  Check,
  Sparkles,
  Building2,
} from "lucide-react";
import type { ProductFull, BrandCount } from "@/app/lib/products-full";
import { ProductDetailPanel } from "./product-detail-panel";

interface ProductWithSignals extends ProductFull {
  inShowroom?: boolean;
  projectCount?: number;
}

interface SearchResponse {
  items: ProductWithSignals[];
  total: number;
  offset: number;
  limit: number;
  elapsedMs: number;
  cacheAgeMs: number;
}

interface CatalogSearchProps {
  brandCounts: BrandCount[];
  totalProducts: number;
}

type CategoryFilter = "all" | "bathroom" | "kitchen" | "hardware";
type SortOption = "alpha" | "price_asc" | "price_desc" | "most_specified";
type GroupBy = "none" | "brand" | "category" | "stock";

const PAGE_SIZE = 60;

const formatPrice = (p: number, cur: string) =>
  p > 0
    ? `${cur} ${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : "—";

const SORT_LABELS: Record<SortOption, string> = {
  alpha: "Name (A → Z)",
  price_asc: "Price (low → high)",
  price_desc: "Price (high → low)",
  most_specified: "Most specified",
};

const GROUP_LABELS: Record<GroupBy, string> = {
  none: "No grouping",
  brand: "Brand",
  category: "Category",
  stock: "Stock status",
};

const CATEGORY_LABEL: Record<CategoryFilter, string> = {
  all: "All",
  bathroom: "Bathroom",
  kitchen: "Kitchen",
  hardware: "Hardware",
};

// Deterministic brand color so the same brand always paints the same tile.
// Uses a tiny string hash → HSL with a constrained palette (warm earth tones
// to match the Counter Cultures brand) so cards never clash with one another.
const brandColor = (brand: string): string => {
  if (!brand) return "hsl(28, 18%, 80%)";
  let h = 0;
  for (let i = 0; i < brand.length; i++) {
    h = (h * 31 + brand.charCodeAt(i)) >>> 0;
  }
  const hues = [22, 32, 42, 12, 200, 180, 95];
  const hue = hues[h % hues.length];
  return `hsl(${hue}, 35%, 78%)`;
};

const groupKeyFor = (
  p: ProductWithSignals,
  by: GroupBy
): { key: string; label: string } => {
  if (by === "brand") {
    const k = p.brand || "(no brand)";
    return { key: k, label: k };
  }
  if (by === "category") {
    return { key: p.category, label: CATEGORY_LABEL[p.category as CategoryFilter] };
  }
  if (by === "stock") {
    const isIn = (p.stockQty ?? 0) > 0;
    return { key: isIn ? "in" : "out", label: isIn ? "In stock" : "Out of stock" };
  }
  return { key: "_all", label: "" };
};

const ProductCard = ({
  product,
  onClick,
}: {
  product: ProductWithSignals;
  onClick: () => void;
}) => {
  const inStock = (product.stockQty ?? 0) > 0;
  const initials = (product.brand || product.name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!product.imageSrc && !imgFailed;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col text-left bg-dash-surface border border-dash-border rounded-xl overflow-hidden hover:border-brand-copper/40 hover:shadow-md transition-all cursor-pointer"
    >
      <div
        className="relative aspect-[4/3] flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: brandColor(product.brand) }}
      >
        <span className="font-display text-3xl font-light text-white/95 tracking-wide drop-shadow-sm">
          {initials || "·"}
        </span>
        {showImage && (
          <Image
            src={product.imageSrc!}
            alt={product.name || product.sku || "Product"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="absolute inset-0 object-contain z-10 bg-white"
            onError={() => setImgFailed(true)}
          />
        )}
        {product.brand && (
          <span className="absolute bottom-2 left-2 right-2 z-20 truncate font-mono text-[10px] uppercase tracking-[0.15em] text-white drop-shadow-md">
            {product.brand}
          </span>
        )}
        <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
          {inStock && (
            <span className="inline-flex items-center gap-1 bg-white/95 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">
              <Check className="w-2.5 h-2.5" />
              In stock
            </span>
          )}
          {product.inShowroom && (
            <span className="inline-flex items-center gap-1 bg-brand-copper text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
              <Building2 className="w-2.5 h-2.5" />
              Showroom
            </span>
          )}
          {(product.projectCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 bg-black/70 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
              <Sparkles className="w-2.5 h-2.5" />
              {product.projectCount}× spec
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 p-3 flex flex-col gap-1.5">
        <p className="text-sm font-medium text-dash-text leading-snug line-clamp-2 min-h-[2.6em]">
          {product.name || "(unnamed)"}
        </p>
        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <span className="font-mono text-[10px] text-dash-text-secondary truncate">
            {product.sku || "—"}
          </span>
          <span className="font-medium text-sm text-dash-text shrink-0">
            {formatPrice(product.listPrice, product.currency)}
          </span>
        </div>
      </div>
    </button>
  );
};

const CatalogSearch = ({
  brandCounts,
  totalProducts,
}: CatalogSearchProps) => {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string>("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("alpha");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [brandFilter, setBrandFilter] = useState("");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [offset, setOffset] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<ProductFull | null>(null);
  const reqIdRef = useRef(0);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
  }, [query, brand, category, inStockOnly, sort]);

  // Browse by default: always fetch on mount and on any filter change. The
  // 180ms debounce handles fast typing without firing intermediate requests.
  useEffect(() => {
    const id = setTimeout(() => {
      const myReq = ++reqIdRef.current;
      startTransition(async () => {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (brand) params.set("brand", brand);
        if (category !== "all") params.set("category", category);
        if (inStockOnly) params.set("inStock", "true");
        params.set("sort", sort);
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String(offset));
        const res = await fetch(`/api/dashboard/products/search?${params}`);
        if (!res.ok) return;
        const data: SearchResponse = await res.json();
        // Drop stale responses if a newer request superseded this one
        if (myReq !== reqIdRef.current) return;
        setResult(data);
      });
    }, 180);
    return () => clearTimeout(id);
  }, [query, brand, category, inStockOnly, sort, offset]);

  const filteredBrands = useMemo(() => {
    if (!brandFilter) return brandCounts;
    const n = brandFilter.toLowerCase();
    return brandCounts.filter((b) => b.brand.toLowerCase().includes(n));
  }, [brandCounts, brandFilter]);

  // Group items in the current page (we only group what's on screen so big
  // brand-spanning grids don't render thousands of section headers).
  const grouped = useMemo(() => {
    if (!result || groupBy === "none") return null;
    const map = new Map<string, { label: string; items: ProductWithSignals[] }>();
    for (const item of result.items) {
      const { key, label } = groupKeyFor(item, groupBy);
      const bucket = map.get(key);
      if (bucket) bucket.items.push(item);
      else map.set(key, { label, items: [item] });
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
  }, [result, groupBy]);

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const hasFilters = !!brand || category !== "all" || inStockOnly || !!query.trim();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      {/* Brand sidebar */}
      <aside className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
            Brand ({brandCounts.length})
          </label>
          <input
            type="text"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            placeholder="Filter brands…"
            className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper"
          />
          <div className="mt-2 max-h-[640px] overflow-y-auto border border-dash-border rounded-lg">
            <button
              type="button"
              onClick={() => setBrand("")}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between border-b border-dash-border hover:bg-dash-bg transition-colors cursor-pointer ${
                brand === ""
                  ? "bg-dash-bg font-medium text-brand-copper"
                  : "text-dash-text"
              }`}
            >
              <span>All brands</span>
              <span className="font-mono text-[10px] text-dash-text-secondary">
                {totalProducts.toLocaleString()}
              </span>
            </button>
            {filteredBrands.map((b) => (
              <button
                key={b.brand}
                type="button"
                onClick={() => setBrand(b.brand)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between border-b border-dash-border/60 last:border-b-0 hover:bg-dash-bg transition-colors cursor-pointer ${
                  brand === b.brand
                    ? "bg-dash-bg font-medium text-brand-copper"
                    : "text-dash-text"
                }`}
              >
                <span className="truncate pr-2">{b.brand || "(blank)"}</span>
                <span className="font-mono text-[10px] text-dash-text-secondary shrink-0">
                  {b.count.toLocaleString()}
                </span>
              </button>
            ))}
            {filteredBrands.length === 0 && (
              <p className="px-3 py-4 text-xs text-dash-text-secondary text-center">
                No brands match.
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main panel */}
      <section className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by brand, SKU, or name…"
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-text-secondary hover:text-dash-text cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isPending && (
            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
          )}
        </div>

        {/* Filter row: category chips + in-stock toggle + sort + group-by */}
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(CATEGORY_LABEL) as CategoryFilter[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
                category === c
                  ? "bg-brand-copper text-white border-brand-copper"
                  : "bg-dash-bg text-dash-text border-dash-border hover:border-brand-copper/40"
              }`}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}

          <div className="w-px h-5 bg-dash-border mx-1" />

          <button
            type="button"
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
              inStockOnly
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-dash-bg text-dash-text border-dash-border hover:border-emerald-200"
            }`}
          >
            <Check className="w-3 h-3" />
            In stock
          </button>

          <div className="ml-auto flex items-center gap-2">
            <label className="text-[11px] text-dash-text-secondary">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-2 py-1 text-xs bg-dash-bg border border-dash-border rounded text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 cursor-pointer"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>
            <label className="text-[11px] text-dash-text-secondary ml-2">
              Group by
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="px-2 py-1 text-xs bg-dash-bg border border-dash-border rounded text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 cursor-pointer"
            >
              {(Object.keys(GROUP_LABELS) as GroupBy[]).map((g) => (
                <option key={g} value={g}>
                  {GROUP_LABELS[g]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {brand && (
              <button
                type="button"
                onClick={() => setBrand("")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-copper/10 text-brand-copper border border-brand-copper/20 rounded text-xs font-medium cursor-pointer hover:bg-brand-copper/20 transition-colors"
              >
                Brand: {brand}
                <X className="w-3 h-3" />
              </button>
            )}
            {category !== "all" && (
              <button
                type="button"
                onClick={() => setCategory("all")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-copper/10 text-brand-copper border border-brand-copper/20 rounded text-xs font-medium cursor-pointer hover:bg-brand-copper/20 transition-colors"
              >
                Category: {CATEGORY_LABEL[category]}
                <X className="w-3 h-3" />
              </button>
            )}
            {inStockOnly && (
              <button
                type="button"
                onClick={() => setInStockOnly(false)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-medium cursor-pointer hover:bg-emerald-100 transition-colors"
              >
                In stock only
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Stats line */}
        <div className="text-xs text-dash-text-secondary flex items-center gap-3 flex-wrap">
          {result && (
            <>
              <span className="font-medium text-dash-text">
                {result.total.toLocaleString()} product
                {result.total === 1 ? "" : "s"}
              </span>
              <span>·</span>
              <span>
                page {currentPage} of {totalPages.toLocaleString()}
              </span>
              <span>·</span>
              <span>{result.elapsedMs}ms</span>
              {result.cacheAgeMs > 60_000 && (
                <>
                  <span>·</span>
                  <span>cache {Math.round(result.cacheAgeMs / 60_000)}m old</span>
                </>
              )}
            </>
          )}
        </div>

        {/* Results — flat grid or grouped sections */}
        {result && result.items.length > 0 && (
          <>
            {grouped ? (
              <div className="space-y-6">
                {grouped.map((g) => (
                  <div key={g.key}>
                    <div className="flex items-baseline justify-between mb-3 border-b border-dash-border pb-1.5">
                      <h3 className="font-display text-base text-dash-text">
                        {g.label}
                      </h3>
                      <span className="text-[11px] text-dash-text-secondary font-mono">
                        {g.items.length} on this page
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {g.items.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          onClick={() => setSelected(p)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {result.items.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onClick={() => setSelected(p)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty / loading states */}
        {!result && isPending && (
          <div className="border border-dash-border border-dashed rounded-lg py-12 text-center">
            <Loader2 className="w-6 h-6 text-dash-text-secondary mx-auto mb-2 animate-spin" />
            <p className="text-sm text-dash-text-secondary">Loading catalog…</p>
          </div>
        )}
        {result && result.items.length === 0 && !isPending && (
          <div className="border border-dash-border border-dashed rounded-lg py-12 text-center">
            <Package className="w-8 h-8 text-dash-text-secondary mx-auto mb-2" />
            <p className="text-sm text-dash-text-secondary">
              No products match these filters.
            </p>
          </div>
        )}

        {/* Pagination */}
        {result && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              className="px-3 py-1.5 text-sm border border-dash-border rounded-lg text-dash-text hover:bg-dash-bg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Previous
            </button>
            <span className="text-xs text-dash-text-secondary">
              Showing {offset + 1}–
              {Math.min(offset + PAGE_SIZE, result.total)} of{" "}
              {result.total.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={() =>
                setOffset(Math.min(result.total - PAGE_SIZE, offset + PAGE_SIZE))
              }
              disabled={offset + PAGE_SIZE >= result.total}
              className="px-3 py-1.5 text-sm border border-dash-border rounded-lg text-dash-text hover:bg-dash-bg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next →
            </button>
          </div>
        )}
      </section>

      {selected && (
        <ProductDetailPanel
          product={selected}
          onClose={() => setSelected(null)}
          onPickProduct={(p) => setSelected(p)}
        />
      )}
    </div>
  );
};

export { CatalogSearch };
