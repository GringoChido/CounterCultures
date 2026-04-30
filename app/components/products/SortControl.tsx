"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FilterState } from "@/app/lib/filter-utils";

interface SortControlProps {
  currentSort: FilterState["sortBy"];
  onSortChange: (sort: FilterState["sortBy"]) => void;
}

const SORT_OPTIONS: Array<{
  value: FilterState["sortBy"];
  label: string;
}> = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "brand-asc", label: "Brand A–Z" },
];

const SortControl = ({ currentSort, onSortChange }: SortControlProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentLabel = SORT_OPTIONS.find((opt) => opt.value === currentSort)?.label || "Featured";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] border border-brand-stone/30 rounded-sm hover:border-brand-terracotta transition-colors"
      >
        <span className="font-body text-sm text-brand-charcoal">{currentLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-brand-stone transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white shadow-lg border border-brand-stone/10 rounded-sm py-2 min-w-[200px] z-40">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSortChange(option.value);
                setIsOpen(false);
              }}
              className={`block w-full text-left px-4 py-3 min-h-[44px] text-sm font-body transition-colors ${
                currentSort === option.value
                  ? "bg-brand-linen text-brand-terracotta"
                  : "text-brand-charcoal hover:bg-brand-linen hover:text-brand-terracotta"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { SortControl, SORT_OPTIONS };
