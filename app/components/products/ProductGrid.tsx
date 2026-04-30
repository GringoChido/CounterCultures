"use client";

import { useMemo } from "react";
import type { Product } from "@/app/lib/types";
import type { FilterState } from "@/app/lib/filter-utils";
import { filterProducts, sortProducts } from "@/app/lib/filter-utils";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  filters: FilterState;
  isLoading?: boolean;
}

const ProductGrid = ({
  products,
  filters,
  isLoading = false,
}: ProductGridProps) => {
  const filteredAndSorted = useMemo(() => {
    let result = filterProducts(products, filters);
    result = sortProducts(result, filters.sortBy);
    return result;
  }, [products, filters]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="space-y-4 animate-pulse"
          >
            <div className="aspect-square bg-brand-sand/30 rounded-sm" />
            <div className="space-y-2">
              <div className="h-3 bg-brand-sand/30 rounded w-20" />
              <div className="h-4 bg-brand-sand/30 rounded w-32" />
              <div className="h-3 bg-brand-sand/30 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredAndSorted.length === 0) {
    return (
      <div className="col-span-full py-20 text-center">
        <p className="font-display text-2xl text-brand-stone mb-4">
          No products found
        </p>
        <p className="font-body text-sm text-brand-stone">
          Try adjusting your filters to find what you're looking for
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="font-mono text-xs text-brand-stone mb-8 tracking-wide uppercase">
        {filteredAndSorted.length} product
        {filteredAndSorted.length !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
        {filteredAndSorted.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </>
  );
};

export { ProductGrid };
