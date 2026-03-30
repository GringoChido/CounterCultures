"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/app/components/ui/product-card";
import { FilterBar } from "@/app/components/ui/filter-bar";
import type { Product } from "@/app/lib/types";

interface ShopCatalogProps {
  initialProducts: Product[];
  initialCategory?: string;
}

const ShopCatalog = ({ initialProducts, initialCategory }: ShopCatalogProps) => {
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeFinish, setActiveFinish] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

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

  const clearFilters = () => {
    setActiveBrand(null);
    setActiveFinish(null);
    setPriceRange(null);
  };

  return (
    <>
      <FilterBar
        activeBrand={activeBrand}
        activeFinish={activeFinish}
        priceRange={priceRange}
        onBrandChange={setActiveBrand}
        onFinishChange={setActiveFinish}
        onPriceChange={setPriceRange}
        onClear={clearFilters}
        availableFinishes={availableFinishes}
      />

      <section className="py-10 lg:py-16 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs text-brand-stone mb-8">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </p>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
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
