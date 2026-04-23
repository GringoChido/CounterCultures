"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/app/components/ui/product-card";
import { FilterBar } from "@/app/components/ui/filter-bar";
import type { Product } from "@/app/lib/types";

interface ShopCatalogProps {
  initialProducts: Product[];
  initialCategory?: string;
}

const PAGE_SIZE = 24;

const ShopCatalog = ({ initialProducts, initialCategory }: ShopCatalogProps) => {
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeFinish, setActiveFinish] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    let result = initialProducts;

    if (activeBrand) {
      result = result.filter(
        (p) => p.brand.toLowerCase() === activeBrand.toLowerCase()
      );
    }
    if (priceRange) {
      result = result.filter(
        (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
      );
    }
    if (activeFinish) {
      result = result.filter((p) =>
        p.finishes.some(
          (f) => f.toLowerCase() === activeFinish.toLowerCase()
        )
      );
    }

    return result;
  }, [initialProducts, activeBrand, priceRange, activeFinish]);

  const availableFinishes = useMemo(() => {
    const all = initialProducts.flatMap((p) => p.finishes);
    return [...new Set(all)].sort();
  }, [initialProducts]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const clearFilters = () => {
    setActiveBrand(null);
    setActiveFinish(null);
    setPriceRange(null);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <>
      <FilterBar
        activeBrand={activeBrand}
        activeFinish={activeFinish}
        priceRange={priceRange}
        onBrandChange={(b) => { setActiveBrand(b); setVisibleCount(PAGE_SIZE); }}
        onFinishChange={(f) => { setActiveFinish(f); setVisibleCount(PAGE_SIZE); }}
        onPriceChange={(r) => { setPriceRange(r); setVisibleCount(PAGE_SIZE); }}
        onClear={clearFilters}
        availableFinishes={availableFinishes}
      />

      <section className="py-10 lg:py-16 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-body font-medium text-xs text-brand-stone mb-8">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </p>

          {filtered.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    sku={product.sku}
                    brand={product.brand}
                    name={product.name}
                    nameEn={product.nameEn}
                    price={product.price}
                    currency={product.currency}
                    finishes={product.finishes}
                    image={product.images[0] || ""}
                    category={product.category}
                    subcategory={product.subcategory}
                    slug={product.slug}
                    artisanal={product.artisanal}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="px-8 py-3 font-body font-medium text-sm tracking-wide border border-brand-stone/30 rounded-full text-brand-charcoal hover:border-brand-terracotta hover:text-brand-terracotta transition-colors"
                  >
                    Load More ({filtered.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-brand-stone">
                No products match your filters
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 font-body text-sm text-brand-terracotta hover:text-brand-copper transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export { ShopCatalog };
