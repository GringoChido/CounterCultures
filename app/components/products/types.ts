/**
 * Type definitions for the faceted filter system.
 * These are re-exports and extensions of types from @/app/lib/types
 */

import type { Product } from "@/app/lib/types";

/**
 * Filter state object that represents all active filters
 * Used for URL state management and component state
 */
export interface FilterState {
  /** Array of selected brands */
  brands: string[];
  /** Array of selected categories (bathroom, kitchen, hardware) */
  categories: string[];
  /** Array of selected subcategories */
  subcategories: string[];
  /** Array of selected product types (for future use) */
  productTypes: string[];
  /** Price range tuple [min, max] or null if not filtering by price */
  priceRange: [number, number] | null;
  /** Array of selected colors/finishes */
  colors: string[];
  /** Array of selected materials (for future use) */
  materials: string[];
  /** Array of selected availability statuses */
  availability: string[];
  /** Array of selected collections (for future use) */
  collections: string[];
  /** Current sort order */
  sortBy: SortOption;
}

/**
 * Valid sort options for the product grid
 */
export type SortOption =
  | "featured"      /** Default: featured products first */
  | "price-asc"     /** Low to high price */
  | "price-desc"    /** High to low price */
  | "newest"        /** Recently added products */
  | "brand-asc";    /** Alphabetical by brand */

/**
 * Extracted facet options available for filtering
 */
export interface FilterFacets {
  /** Available brands from products */
  brands: string[];
  /** Available categories from products */
  categories: string[];
  /** Available subcategories from products */
  subcategories: string[];
  /** Available colors/finishes from products */
  colors: string[];
  /** Available availability statuses from products */
  availability: string[];
  /** Min and max price from products */
  priceRange: [number, number];
}

/**
 * Props for CatalogLayout component
 */
export interface CatalogLayoutProps {
  /** Array of products to display and filter */
  products: Product[];
  /** Optional initial category for the catalog */
  initialCategory?: string;
}

/**
 * Props for ProductFilter component
 */
export interface ProductFilterProps {
  /** Products to extract filter facets from */
  products: Product[];
  /** Current filter state */
  filters: FilterState;
  /** Callback when filters change */
  onFilterChange: (filters: FilterState) => void;
  /** Callback to remove individual filter */
  onRemoveFilter: (filterKey: string, value: string) => void;
}

/**
 * Props for ProductGrid component
 */
export interface ProductGridProps {
  /** Products to display */
  products: Product[];
  /** Current filters to apply */
  filters: FilterState;
  /** Whether grid is loading */
  isLoading?: boolean;
}

/**
 * Props for ProductCard component
 */
export interface ProductCardProps {
  /** Product data to display */
  product: Product;
}

/**
 * Props for FilterPills component
 */
export interface FilterPillsProps {
  /** Current filter state */
  filters: FilterState;
  /** Callback to remove filter */
  onRemove: (filterKey: string, value: string) => void;
  /** Callback to clear all filters */
  onClearAll: () => void;
  /** Custom label mappings for filter display */
  facetLabels?: Record<string, Record<string, string>>;
}

/**
 * Props for PriceRangeSlider component
 */
export interface PriceRangeSliderProps {
  /** Minimum price value */
  min: number;
  /** Maximum price value */
  max: number;
  /** Current selected range [min, max] */
  value: [number, number];
  /** Callback when range changes */
  onChange: (range: [number, number]) => void;
  /** Step increment for slider (default: 100) */
  step?: number;
  /** Currency to display (default: MXN) */
  currency?: string;
}

/**
 * Props for SortControl component
 */
export interface SortControlProps {
  /** Current selected sort option */
  currentSort: SortOption;
  /** Callback when sort changes */
  onSortChange: (sort: SortOption) => void;
}

/**
 * Configuration for filter sections in ProductFilter
 */
export interface FilterSectionConfig {
  key: string;
  label: string;
  defaultExpanded?: boolean;
  maxHeight?: string;
}

/**
 * Utility type for filter group names
 */
export type FilterGroupKey = keyof Omit<FilterState, "sortBy">;

/**
 * Utility type for filter value types
 */
export type FilterValue = string | [number, number] | null;

/**
 * Type for expanded sections state in ProductFilter
 */
export interface ExpandedSections {
  [key: string]: boolean;
}

/**
 * Type for sort option configuration
 */
export interface SortOptionConfig {
  value: SortOption;
  label: string;
}

/**
 * Type guard to check if a value is a valid FilterState
 */
export function isValidFilterState(value: unknown): value is FilterState {
  if (!value || typeof value !== "object") return false;

  const obj = value as Record<string, unknown>;

  return (
    Array.isArray(obj.brands) &&
    Array.isArray(obj.categories) &&
    Array.isArray(obj.colors) &&
    Array.isArray(obj.availability) &&
    (obj.priceRange === null || Array.isArray(obj.priceRange)) &&
    typeof obj.sortBy === "string"
  );
}

/**
 * Type guard to check if a value is a valid Product
 */
export function isValidProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === "string" &&
    typeof obj.sku === "string" &&
    typeof obj.brand === "string" &&
    typeof obj.name === "string" &&
    typeof obj.nameEn === "string" &&
    typeof obj.category === "string" &&
    typeof obj.price === "number" &&
    typeof obj.currency === "string" &&
    Array.isArray(obj.images) &&
    Array.isArray(obj.finishes) &&
    typeof obj.availability === "string"
  );
}

/**
 * Default empty filter state
 */
export const EMPTY_FILTER_STATE: FilterState = {
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
};
