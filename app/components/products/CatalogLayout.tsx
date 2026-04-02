"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/app/lib/types";
import type { FilterState } from "@/app/lib/filter-utils";
import {
  DEFAULT_FILTER_STATE,
  parseUrlParams,
  filterStateToUrlParams,
  hasActiveFilters,
} from "@/app/lib/filter-utils";
import { ProductFilter } from "./ProductFilter";
import { ProductGrid } from "./ProductGrid";
import { FilterPills } from "./FilterPills";
import { SortControl } from "./SortControl";

interface CatalogLayoutProps {
  products: Product[];
  initialCategory?: string;
}

const CatalogLayout = ({
  products,
  initialCategory,
}: CatalogLayoutProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => {
    // Parse URL params or use defaults
    const params = Object.fromEntries(searchParams.entries());
    return parseUrlParams(params);
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateUrl = useCallback(
    (newFilters: FilterState) => {
      const params = filterStateToUrlParams(newFilters);
      const queryString = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => queryString.append(key, v));
        } else {
          queryString.set(key, value);
        }
      });

      const url = `/shop${initialCategory ? `/${initialCategory}` : ""}${
        queryString.toString() ? `?${queryString.toString()}` : ""
      }`;

      router.push(url, { shallow: true } as any);
    },
    [router, initialCategory]
  );

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setIsLoading(true);
    updateUrl(newFilters);
    setTimeout(() => setIsLoading(false), 100);
  };

  const handleRemoveFilter = (filterKey: string, value: string) => {
    const newFilters = { ...filters };

    switch (filterKey) {
      case "brands":
        newFilters.brands = newFilters.brands.filter((b) => b !== value);
        break;
      case "categories":
        newFilters.categories = newFilters.categories.filter((c) => c !== value);
        break;
      case "colors":
        newFilters.colors = newFilters.colors.filter((c) => c !== value);
        break;
      case "availability":
        newFilters.availability = newFilters.availability.filter(
          (a) => a !== value
        );
        break;
      case "price":
        newFilters.priceRange = null;
        break;
    }

    handleFilterChange(newFilters);
  };

  const handleClearAll = () => {
    handleFilterChange(DEFAULT_FILTER_STATE);
  };

  const handleSortChange = (newSort: FilterState["sortBy"]) => {
    const newFilters = { ...filters, sortBy: newSort };
    handleFilterChange(newFilters);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += filters.brands.length;
    count += filters.categories.length;
    count += filters.colors.length;
    count += filters.availability.length;
    if (filters.priceRange) count += 1;
    return count;
  }, [filters]);

  return (
    <section className="py-8 lg:py-16 bg-brand-linen min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl lg:text-4xl text-brand-charcoal mb-2">
            Product Catalog
          </h1>
          {activeFilterCount > 0 && (
            <p className="font-body text-sm text-brand-stone">
              {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} applied
            </p>
          )}
        </div>

        {/* Active Filter Pills */}
        {hasActiveFilters(filters) && (
          <div className="mb-8">
            <FilterPills
              filters={filters}
              onRemove={handleRemoveFilter}
              onClearAll={handleClearAll}
            />
          </div>
        )}

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ProductFilter
              products={products}
              filters={filters}
              onFilterChange={handleFilterChange}
              onRemoveFilter={handleRemoveFilter}
            />
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {/* Sort Control */}
            <div className="mb-8 flex justify-end">
              <SortControl
                currentSort={filters.sortBy}
                onSortChange={handleSortChange}
              />
            </div>

            {/* Products */}
            <ProductGrid
              products={products}
              filters={filters}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export { CatalogLayout };
