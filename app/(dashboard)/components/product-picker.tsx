"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { Search, Loader2, Package, X } from "lucide-react";
import type {
  ProductFull,
  BrandCount,
  ProductCategory,
} from "@/app/lib/products-full";

interface ProductPickerProps {
  onSelect: (product: ProductFull) => void;
  onClose: () => void;
  /** Compact mode hides category filter for embedded contexts */
  compact?: boolean;
}

interface SearchResponse {
  items: ProductFull[];
  total: number;
  offset: number;
  limit: number;
  elapsedMs: number;
  brandCounts?: BrandCount[];
}

const PAGE_SIZE = 40;
const MIN_QUERY = 3;

/**
 * Reusable product picker — wraps /api/dashboard/products/search and
 * emits the selected ProductFull to the caller. Used from the deal
 * slideout's Line Items tab. Safe to reuse from leads/quotes later.
 */
const ProductPicker = ({ onSelect, onClose, compact }: ProductPickerProps) => {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [brandFilter, setBrandFilter] = useState("");
  const [brandCounts, setBrandCounts] = useState<BrandCount[]>([]);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  // One-shot: pull brand facets on mount.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/products/search?facets=true&limit=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.brandCounts) setBrandCounts(d.brandCounts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced search whenever inputs change.
  useEffect(() => {
    const needs = query.trim().length >= MIN_QUERY || brand !== "" || category !== "all";
    if (!needs) {
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
        const r = await fetch(`/api/dashboard/products/search?${p}`);
        if (!r.ok) return;
        setResult(await r.json());
      });
    }, 180);
    return () => clearTimeout(id);
  }, [query, brand, category]);

  const filteredBrands = useMemo(() => {
    if (!brandFilter) return brandCounts;
    const n = brandFilter.toLowerCase();
    return brandCounts.filter((b) => b.brand.toLowerCase().includes(n));
  }, [brandCounts, brandFilter]);

  const formatPrice = (p: number, cur: string) =>
    p > 0 ? `${cur} ${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—";

  return (
    <div className="fixed inset-0 z-[70] md:flex md:items-center md:justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 inset-0 md:inset-auto md:w-[960px] md:max-w-[95vw] md:h-[640px] md:max-h-[90vh] h-full w-full bg-dash-surface border border-dash-border md:rounded-xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-dash-border">
          <div>
            <h3 className="text-base font-semibold text-dash-text">
              Add product to deal
            </h3>
            <p className="text-xs text-dash-text-secondary mt-0.5">
              Search the full Odoo catalog (354k SKUs) — click a row to add.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-dash-bg text-dash-text-secondary cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className={`flex-1 grid ${compact ? "grid-cols-1" : "grid-cols-[220px_1fr]"} overflow-hidden`}>
          {!compact && (
            <aside className="border-r border-dash-border p-3 space-y-3 overflow-y-auto">
              <div>
                <label className="block text-[11px] font-medium text-dash-text-secondary mb-1.5 uppercase tracking-wider">
                  Category
                </label>
                <div className="space-y-0.5 text-xs">
                  {(["all", "bathroom", "kitchen", "hardware"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`w-full text-left px-2 py-1 rounded cursor-pointer ${
                        category === c
                          ? "bg-brand-copper/10 text-brand-copper font-medium"
                          : "text-dash-text hover:bg-dash-bg"
                      }`}
                    >
                      {c === "all" ? "All categories" : c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-dash-text-secondary mb-1.5 uppercase tracking-wider">
                  Brand ({brandCounts.length})
                </label>
                <input
                  type="text"
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  placeholder="Filter brands…"
                  className="w-full px-2 py-1.5 text-xs bg-dash-bg border border-dash-border rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper"
                />
                <div className="mt-1.5 max-h-[380px] overflow-y-auto border border-dash-border rounded">
                  <button
                    onClick={() => setBrand("")}
                    className={`w-full text-left px-2 py-1 text-[11px] flex items-center justify-between border-b border-dash-border hover:bg-dash-bg cursor-pointer ${
                      brand === "" ? "bg-dash-bg font-medium text-brand-copper" : "text-dash-text"
                    }`}
                  >
                    <span>All brands</span>
                  </button>
                  {filteredBrands.map((b) => (
                    <button
                      key={b.brand}
                      onClick={() => setBrand(b.brand)}
                      className={`w-full text-left px-2 py-1 text-[11px] flex items-center justify-between border-b border-dash-border/50 last:border-b-0 hover:bg-dash-bg cursor-pointer ${
                        brand === b.brand
                          ? "bg-dash-bg font-medium text-brand-copper"
                          : "text-dash-text"
                      }`}
                    >
                      <span className="truncate pr-1">{b.brand || "(blank)"}</span>
                      <span className="font-mono text-[10px] text-dash-text-secondary shrink-0">
                        {b.count.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}

          <section className="flex flex-col overflow-hidden">
            <div className="p-3 border-b border-dash-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by SKU, name, or brand…"
                  className="w-full pl-9 pr-10 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper"
                />
                {isPending && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
                )}
              </div>
              <div className="mt-2 text-[11px] text-dash-text-secondary flex items-center gap-2 flex-wrap">
                {!result && (query.trim().length < MIN_QUERY && !brand && category === "all") && (
                  <span>Type at least {MIN_QUERY} characters, pick a brand, or pick a category.</span>
                )}
                {result && (
                  <>
                    <span className="text-dash-text font-medium">
                      {result.total.toLocaleString()} match{result.total === 1 ? "" : "es"}
                    </span>
                    <span>·</span>
                    <span>{result.elapsedMs}ms</span>
                    {result.total > PAGE_SIZE && (
                      <>
                        <span>·</span>
                        <span>showing first {PAGE_SIZE}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {result && result.items.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-dash-bg text-[10px] uppercase tracking-wider text-dash-text-secondary sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">SKU</th>
                      <th className="text-left px-3 py-2 font-medium">Name</th>
                      <th className="text-left px-3 py-2 font-medium">Brand</th>
                      <th className="text-right px-3 py-2 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => onSelect(p)}
                        className="border-t border-dash-border hover:bg-dash-bg cursor-pointer transition-colors"
                      >
                        <td className="px-3 py-2 font-mono text-[11px]">{p.sku || "—"}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <Package className="w-3 h-3 text-dash-text-secondary shrink-0" />
                            <span className="truncate max-w-[360px]">{p.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-dash-text-secondary text-xs">{p.brand || "—"}</td>
                        <td className="px-3 py-2 text-right text-xs font-medium">
                          {formatPrice(p.listPrice, p.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-10 text-center text-dash-text-secondary text-sm">
                  {result && result.items.length === 0 && !isPending
                    ? "No products match these filters."
                    : ""}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export { ProductPicker };
