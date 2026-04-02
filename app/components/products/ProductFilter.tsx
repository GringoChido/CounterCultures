"use client";

import { useState, useMemo } from "react";
import { ChevronDown, X, Menu } from "lucide-react";
import type { Product } from "@/app/lib/types";
import type { FilterState } from "@/app/lib/filter-utils";
import { PriceRangeSlider } from "./PriceRangeSlider";
import { BRANDS } from "@/app/lib/constants";

interface ProductFilterProps {
  products: Product[];
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onRemoveFilter: (filterKey: string, value: string) => void;
}

interface ExpandedSections {
  [key: string]: boolean;
}

const ProductFilter = ({
  products,
  filters,
  onFilterChange,
  onRemoveFilter,
}: ProductFilterProps) => {
  const [expanded, setExpanded] = useState<ExpandedSections>({
    brands: true,
    categories: true,
    colors: false,
    availability: false,
    price: false,
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const facets = useMemo(() => {
    const brands = new Set<string>();
    const categories = new Set<string>();
    const colors = new Set<string>();
    const availability = new Set<string>();
    const priceMin = Math.min(...products.map((p) => p.price), 0);
    const priceMax = Math.max(...products.map((p) => p.price), 100000);

    products.forEach((p) => {
      brands.add(p.brand);
      categories.add(p.category);
      availability.add(p.availability);
      p.finishes.forEach((f) => colors.add(f));
    });

    return {
      brands: Array.from(brands).sort(),
      categories: Array.from(categories).sort(),
      colors: Array.from(colors).sort(),
      availability: Array.from(availability).sort(),
      priceRange: [priceMin, priceMax] as [number, number],
    };
  }, [products]);

  const getCountForFilter = (filterType: string, value: string): number => {
    return products.filter((p) => {
      switch (filterType) {
        case "brand":
          return p.brand === value;
        case "category":
          return p.category === value;
        case "color":
          return p.finishes.includes(value);
        case "availability":
          return p.availability === value;
        default:
          return true;
      }
    }).length;
  };

  const toggleExpanded = (section: string) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    const newBrands = checked
      ? [...filters.brands, brand]
      : filters.brands.filter((b) => b !== brand);
    onFilterChange({ ...filters, brands: newBrands });
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter((c) => c !== category);
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handleColorChange = (color: string, checked: boolean) => {
    const newColors = checked
      ? [...filters.colors, color]
      : filters.colors.filter((c) => c !== color);
    onFilterChange({ ...filters, colors: newColors });
  };

  const handleAvailabilityChange = (availability: string, checked: boolean) => {
    const newAvailability = checked
      ? [...filters.availability, availability]
      : filters.availability.filter((a) => a !== availability);
    onFilterChange({ ...filters, availability: newAvailability });
  };

  const handlePriceChange = (range: [number, number]) => {
    onFilterChange({ ...filters, priceRange: range });
  };

  const handleClearAllFilters = () => {
    onFilterChange({
      brands: [],
      categories: [],
      subcategories: [],
      productTypes: [],
      priceRange: null,
      colors: [],
      materials: [],
      availability: [],
      collections: [],
      sortBy: "featured",
    });
  };

  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.colors.length > 0 ||
    filters.availability.length > 0 ||
    filters.priceRange !== null;

  const FilterContent = () => (
    <>
      {hasActiveFilters && (
        <div className="mb-6 pb-4 border-b border-brand-stone/10">
          <button
            onClick={handleClearAllFilters}
            className="w-full py-2 px-3 text-sm font-body text-brand-terracotta hover:bg-brand-terracotta/5 rounded-sm transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      <div className="space-y-1">
        {/* Brand Filter */}
        <div className="border-b border-brand-stone/10">
          <button
            onClick={() => toggleExpanded("brands")}
            className="w-full py-4 px-0 flex items-center justify-between hover:text-brand-terracotta transition-colors"
          >
            <span className="font-display text-sm text-brand-charcoal font-medium">
              Brand
            </span>
            <ChevronDown
              className={`w-4 h-4 text-brand-stone transition-transform ${
                expanded.brands ? "rotate-180" : ""
              }`}
            />
          </button>
          {expanded.brands && (
            <div className="pb-4 space-y-3">
              {facets.brands.map((brand) => {
                const count = getCountForFilter("brand", brand);
                const isChecked = filters.brands.includes(brand);
                return (
                  <label
                    key={brand}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        handleBrandChange(brand, e.target.checked)
                      }
                      className="w-4 h-4 accent-brand-terracotta cursor-pointer"
                    />
                    <span className="flex-1 font-body text-sm text-brand-charcoal group-hover:text-brand-terracotta transition-colors">
                      {brand}
                    </span>
                    <span className="font-mono text-xs text-brand-stone">
                      ({count})
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="border-b border-brand-stone/10">
          <button
            onClick={() => toggleExpanded("categories")}
            className="w-full py-4 px-0 flex items-center justify-between hover:text-brand-terracotta transition-colors"
          >
            <span className="font-display text-sm text-brand-charcoal font-medium">
              Category
            </span>
            <ChevronDown
              className={`w-4 h-4 text-brand-stone transition-transform ${
                expanded.categories ? "rotate-180" : ""
              }`}
            />
          </button>
          {expanded.categories && (
            <div className="pb-4 space-y-3">
              {facets.categories.map((category) => {
                const count = getCountForFilter("category", category);
                const isChecked = filters.categories.includes(category);
                const categoryLabel =
                  category === "bathroom"
                    ? "Baño"
                    : category === "kitchen"
                      ? "Cocina"
                      : category === "hardware"
                        ? "Herrajes"
                        : category;
                return (
                  <label
                    key={category}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        handleCategoryChange(category, e.target.checked)
                      }
                      className="w-4 h-4 accent-brand-terracotta cursor-pointer"
                    />
                    <span className="flex-1 font-body text-sm text-brand-charcoal group-hover:text-brand-terracotta transition-colors">
                      {categoryLabel}
                    </span>
                    <span className="font-mono text-xs text-brand-stone">
                      ({count})
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Price Range Filter */}
        <div className="border-b border-brand-stone/10">
          <button
            onClick={() => toggleExpanded("price")}
            className="w-full py-4 px-0 flex items-center justify-between hover:text-brand-terracotta transition-colors"
          >
            <span className="font-display text-sm text-brand-charcoal font-medium">
              Price Range
            </span>
            <ChevronDown
              className={`w-4 h-4 text-brand-stone transition-transform ${
                expanded.price ? "rotate-180" : ""
              }`}
            />
          </button>
          {expanded.price && (
            <div className="pb-4">
              <PriceRangeSlider
                min={facets.priceRange[0]}
                max={facets.priceRange[1]}
                value={
                  filters.priceRange || facets.priceRange
                }
                onChange={handlePriceChange}
                step={100}
                currency="MXN"
              />
            </div>
          )}
        </div>

        {/* Color/Finish Filter */}
        {facets.colors.length > 0 && (
          <div className="border-b border-brand-stone/10">
            <button
              onClick={() => toggleExpanded("colors")}
              className="w-full py-4 px-0 flex items-center justify-between hover:text-brand-terracotta transition-colors"
            >
              <span className="font-display text-sm text-brand-charcoal font-medium">
                Finish
              </span>
              <ChevronDown
                className={`w-4 h-4 text-brand-stone transition-transform ${
                  expanded.colors ? "rotate-180" : ""
                }`}
              />
            </button>
            {expanded.colors && (
              <div className="pb-4 space-y-3 max-h-48 overflow-y-auto">
                {facets.colors.map((color) => {
                  const count = getCountForFilter("color", color);
                  const isChecked = filters.colors.includes(color);
                  return (
                    <label
                      key={color}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          handleColorChange(color, e.target.checked)
                        }
                        className="w-4 h-4 accent-brand-terracotta cursor-pointer"
                      />
                      <span className="flex-1 font-body text-sm text-brand-charcoal group-hover:text-brand-terracotta transition-colors">
                        {color}
                      </span>
                      <span className="font-mono text-xs text-brand-stone">
                        ({count})
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Availability Filter */}
        {facets.availability.length > 0 && (
          <div className="border-b border-brand-stone/10">
            <button
              onClick={() => toggleExpanded("availability")}
              className="w-full py-4 px-0 flex items-center justify-between hover:text-brand-terracotta transition-colors"
            >
              <span className="font-display text-sm text-brand-charcoal font-medium">
                Availability
              </span>
              <ChevronDown
                className={`w-4 h-4 text-brand-stone transition-transform ${
                  expanded.availability ? "rotate-180" : ""
                }`}
              />
            </button>
            {expanded.availability && (
              <div className="pb-4 space-y-3">
                {facets.availability.map((availability) => {
                  const count = getCountForFilter("availability", availability);
                  const isChecked = filters.availability.includes(availability);
                  const label =
                    availability === "in-stock"
                      ? "In Stock"
                      : availability === "made-to-order"
                        ? "Made to Order"
                        : availability === "special-order"
                          ? "Special Order"
                          : availability;
                  return (
                    <label
                      key={availability}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          handleAvailabilityChange(
                            availability,
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 accent-brand-terracotta cursor-pointer"
                      />
                      <span className="flex-1 font-body text-sm text-brand-charcoal group-hover:text-brand-terracotta transition-colors">
                        {label}
                      </span>
                      <span className="font-mono text-xs text-brand-stone">
                        ({count})
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden sticky top-16 md:top-20 z-20 bg-brand-linen border-b border-brand-stone/10 px-4 py-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 font-body text-sm text-brand-charcoal hover:text-brand-terracotta transition-colors"
        >
          <Menu className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-lg overflow-y-auto">
            <div className="p-4 border-b border-brand-stone/10 flex items-center justify-between">
              <span className="font-display text-lg text-brand-charcoal">
                Filters
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 hover:bg-brand-linen rounded-sm transition-colors"
              >
                <X className="w-5 h-5 text-brand-charcoal" />
              </button>
            </div>
            <div className="p-4">
              <FilterContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block bg-white p-6 rounded-sm border border-brand-stone/10">
        <FilterContent />
      </div>
    </>
  );
};

export { ProductFilter };
