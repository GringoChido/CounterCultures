"use client";

import { X } from "lucide-react";
import type { FilterState } from "@/app/lib/filter-utils";

interface FilterPillsProps {
  filters: FilterState;
  onRemove: (filterKey: string, value: string) => void;
  onClearAll: () => void;
  facetLabels?: Record<string, Record<string, string>>;
}

const defaultLabels: Record<string, Record<string, string>> = {
  brands: {},
  categories: {
    bathroom: "Baño",
    kitchen: "Cocina",
    hardware: "Herrajes",
  },
  colors: {},
  availability: {
    "in-stock": "En Stock",
    "made-to-order": "Por Encargo",
    "special-order": "Orden Especial",
  },
};

const FilterPills = ({
  filters,
  onRemove,
  onClearAll,
  facetLabels = defaultLabels,
}: FilterPillsProps) => {
  const getLabel = (filterKey: string, value: string): string => {
    return facetLabels[filterKey]?.[value] || value;
  };

  const activePills: Array<{ key: string; value: string; label: string }> = [];

  filters.brands.forEach((b) => {
    activePills.push({ key: "brands", value: b, label: getLabel("brands", b) });
  });

  filters.categories.forEach((c) => {
    activePills.push({ key: "categories", value: c, label: getLabel("categories", c) });
  });

  filters.colors.forEach((c) => {
    activePills.push({ key: "colors", value: c, label: getLabel("colors", c) });
  });

  filters.availability.forEach((a) => {
    activePills.push({ key: "availability", value: a, label: getLabel("availability", a) });
  });

  if (filters.priceRange) {
    activePills.push({
      key: "price",
      value: `${filters.priceRange[0]}-${filters.priceRange[1]}`,
      label: `$${filters.priceRange[0].toLocaleString()} - $${filters.priceRange[1].toLocaleString()}`,
    });
  }

  if (activePills.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-brand-stone/10">
      {activePills.map((pill) => (
        <div
          key={`${pill.key}-${pill.value}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-terracotta/10 border border-brand-terracotta/30 rounded-full"
        >
          <span className="font-body text-sm text-brand-terracotta">
            {pill.label}
          </span>
          <button
            onClick={() => onRemove(pill.key, pill.value)}
            className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-brand-terracotta/20 transition-colors"
            aria-label={`Remove ${pill.label} filter`}
          >
            <X className="w-3 h-3 text-brand-terracotta" />
          </button>
        </div>
      ))}

      {activePills.length > 0 && (
        <button
          onClick={onClearAll}
          className="ml-2 font-body text-sm text-brand-stone hover:text-brand-terracotta transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export { FilterPills };
