"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { BRANDS } from "@/app/lib/constants";

interface FilterBarProps {
  activeBrand: string | null;
  activeFinish: string | null;
  priceRange: [number, number] | null;
  onBrandChange: (brand: string | null) => void;
  onFinishChange: (finish: string | null) => void;
  onPriceChange: (range: [number, number] | null) => void;
  onClear: () => void;
  availableFinishes: string[];
}

const PRICE_RANGES: { label: string; range: [number, number] }[] = [
  { label: "Under $5,000", range: [0, 5000] },
  { label: "$5,000 – $15,000", range: [5000, 15000] },
  { label: "$15,000 – $40,000", range: [15000, 40000] },
  { label: "$40,000+", range: [40000, 999999] },
];

const FilterBar = ({
  activeBrand,
  activeFinish,
  priceRange,
  onBrandChange,
  onFinishChange,
  onPriceChange,
  onClear,
  availableFinishes,
}: FilterBarProps) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const hasFilters = activeBrand || activeFinish || priceRange;

  return (
    <div className="sticky top-16 md:top-20 z-30 bg-brand-linen/95 backdrop-blur-sm border-b border-brand-stone/10 py-3 md:py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {/* Brand filter */}
          <div className="relative shrink-0">
            <button
              onClick={() => setExpanded(expanded === "brand" ? null : "brand")}
              className={`px-4 py-2.5 min-h-[44px] text-sm font-body border rounded-full transition-colors whitespace-nowrap ${
                activeBrand
                  ? "border-brand-terracotta text-brand-terracotta bg-brand-terracotta/5"
                  : "border-brand-stone/30 text-brand-charcoal hover:border-brand-stone"
              }`}
            >
              {activeBrand || "Brand"}
            </button>
            {expanded === "brand" && (
              <div className="absolute top-full left-0 mt-2 bg-white shadow-lg border border-brand-stone/10 rounded-sm py-2 min-w-[180px] z-40 max-h-72 overflow-y-auto">
                {BRANDS.map((brand) => (
                  <button
                    key={brand.slug}
                    onClick={() => {
                      onBrandChange(brand.name);
                      setExpanded(null);
                    }}
                    className="block w-full text-left px-4 py-3 min-h-[44px] text-sm font-body text-brand-charcoal hover:bg-brand-linen hover:text-brand-terracotta transition-colors"
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price filter */}
          <div className="relative shrink-0">
            <button
              onClick={() => setExpanded(expanded === "price" ? null : "price")}
              className={`px-4 py-2.5 min-h-[44px] text-sm font-body border rounded-full transition-colors whitespace-nowrap ${
                priceRange
                  ? "border-brand-terracotta text-brand-terracotta bg-brand-terracotta/5"
                  : "border-brand-stone/30 text-brand-charcoal hover:border-brand-stone"
              }`}
            >
              {priceRange
                ? PRICE_RANGES.find(
                    (r) => r.range[0] === priceRange[0] && r.range[1] === priceRange[1]
                  )?.label || "Price"
                : "Price Range"}
            </button>
            {expanded === "price" && (
              <div className="absolute top-full left-0 mt-2 bg-white shadow-lg border border-brand-stone/10 rounded-sm py-2 min-w-[180px] z-40">
                {PRICE_RANGES.map((pr) => (
                  <button
                    key={pr.label}
                    onClick={() => {
                      onPriceChange(pr.range);
                      setExpanded(null);
                    }}
                    className="block w-full text-left px-4 py-3 min-h-[44px] text-sm font-body text-brand-charcoal hover:bg-brand-linen hover:text-brand-terracotta transition-colors"
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Finish filter */}
          {availableFinishes.length > 0 && (
            <div className="relative shrink-0">
              <button
                onClick={() =>
                  setExpanded(expanded === "finish" ? null : "finish")
                }
                className={`px-4 py-2.5 min-h-[44px] text-sm font-body border rounded-full transition-colors whitespace-nowrap ${
                  activeFinish
                    ? "border-brand-terracotta text-brand-terracotta bg-brand-terracotta/5"
                    : "border-brand-stone/30 text-brand-charcoal hover:border-brand-stone"
                }`}
              >
                {activeFinish || "Finish"}
              </button>
              {expanded === "finish" && (
                <div className="absolute top-full left-0 mt-2 bg-white shadow-lg border border-brand-stone/10 rounded-sm py-2 min-w-[180px] max-h-60 overflow-y-auto z-40">
                  {availableFinishes.map((finish) => (
                    <button
                      key={finish}
                      onClick={() => {
                        onFinishChange(finish);
                        setExpanded(null);
                      }}
                      className="block w-full text-left px-4 py-3 min-h-[44px] text-sm font-body text-brand-charcoal hover:bg-brand-linen hover:text-brand-terracotta transition-colors"
                    >
                      {finish}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={onClear}
              className="inline-flex items-center gap-1 px-3 py-2.5 min-h-[44px] text-sm font-body text-brand-stone hover:text-brand-terracotta transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export { FilterBar };
