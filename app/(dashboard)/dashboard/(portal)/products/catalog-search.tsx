"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { Search, Loader2, Package, X } from "lucide-react";
import type { ProductFull, BrandCount } from "@/app/lib/products-full";
import { ProductDetailPanel } from "./product-detail-panel";

interface SearchResponse {
  items: ProductFull[];
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

const PAGE_SIZE = 100;
const MIN_QUERY = 3;

const formatPrice = (p: number, cur: string) =>
  p > 0 ? `${cur} ${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—";

const CatalogSearch = ({ brandCounts, totalProducts }: CatalogSearchProps) => {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string>("");
  const [category, setCategory] = useState<"all" | "bathroom" | "kitchen" | "hardware">("all");
  const [brandFilter, setBrandFilter] = useState("");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [offset, setOffset] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<ProductFull | null>(null);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
  }, [query, brand, category]);

  // Fetch whenever the inputs or offset change
  useEffect(() => {
    const needsSearch = query.trim().length >= MIN_QUERY || brand || category !== "all";
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
        const res = await fetch(`/api/dashboard/products/search?${params}`);
        if (!res.ok) return;
        const data: SearchResponse = await res.json();
        setResult(data);
      });
    }, 180);
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
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      {/* Brand sidebar */}
      <aside className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:ring-1 focus:ring-brand-copper"
          >
            <option value="all">All categories</option>
            <option value="bathroom">Bathroom</option>
            <option value="kitchen">Kitchen</option>
            <option value="hardware">Hardware</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
            Brand ({brandCounts.length})
          </label>
          <input
            type="text"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            placeholder="Filter brands…"
            className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:ring-1 focus:ring-brand-copper"
          />
          <div className="mt-2 max-h-[520px] overflow-y-auto border border-dash-border rounded-lg">
            <button
              type="button"
              onClick={() => setBrand("")}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between border-b border-dash-border hover:bg-dash-bg transition-colors cursor-pointer ${
                brand === "" ? "bg-dash-bg font-medium text-brand-copper" : "text-dash-text"
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
                  brand === b.brand ? "bg-dash-bg font-medium text-brand-copper" : "text-dash-text"
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 354k products by SKU, name, or brand…"
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:ring-1 focus:ring-brand-copper"
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

        <div className="text-xs text-dash-text-secondary flex items-center gap-3 flex-wrap">
          {!result && query.trim().length < MIN_QUERY && !brand && category === "all" && (
            <span>Type at least {MIN_QUERY} characters, pick a brand, or pick a category.</span>
          )}
          {result && (
            <>
              <span className="font-medium text-dash-text">
                {result.total.toLocaleString()} match{result.total === 1 ? "" : "es"}
              </span>
              <span>·</span>
              <span>page {currentPage} of {totalPages.toLocaleString()}</span>
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

        {(brand || category !== "all") && (
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
                Category: {category}
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {result && result.items.length > 0 && (
          <div className="border border-dash-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-dash-bg text-xs text-dash-text-secondary uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">SKU</th>
                  <th className="text-left px-4 py-2.5 font-medium">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium">Brand</th>
                  <th className="text-left px-4 py-2.5 font-medium">Category</th>
                  <th className="text-right px-4 py-2.5 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="border-t border-dash-border hover:bg-dash-bg cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs">{p.sku || "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-dash-text-secondary shrink-0" />
                        <span className="truncate max-w-[480px]">{p.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-dash-text-secondary">{p.brand || "—"}</td>
                    <td className="px-4 py-2.5 text-dash-text-secondary capitalize">{p.category}</td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {formatPrice(p.listPrice, p.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result && result.items.length === 0 && !isPending && (
          <div className="border border-dash-border border-dashed rounded-lg py-12 text-center">
            <Package className="w-8 h-8 text-dash-text-secondary mx-auto mb-2" />
            <p className="text-sm text-dash-text-secondary">No products match these filters.</p>
          </div>
        )}

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
              Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, result.total)} of {result.total.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={() => setOffset(Math.min(result.total - PAGE_SIZE, offset + PAGE_SIZE))}
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
