import type { Product, ProductFilter } from "@/app/lib/types";

export interface FilterState {
  brands: string[];
  categories: string[];
  subcategories: string[];
  productTypes: string[];
  priceRange: [number, number] | null;
  colors: string[];
  materials: string[];
  availability: string[];
  collections: string[];
  sortBy: "featured" | "price-asc" | "price-desc" | "newest" | "brand-asc";
}

export const DEFAULT_FILTER_STATE: FilterState = {
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

export function parseUrlParams(searchParams: Record<string, string | string[] | undefined>): FilterState {
  const state: FilterState = { ...DEFAULT_FILTER_STATE };

  if (searchParams.brands) {
    state.brands = Array.isArray(searchParams.brands)
      ? searchParams.brands
      : [searchParams.brands];
  }

  if (searchParams.categories) {
    state.categories = Array.isArray(searchParams.categories)
      ? searchParams.categories
      : [searchParams.categories];
  }

  if (searchParams.subcategories) {
    state.subcategories = Array.isArray(searchParams.subcategories)
      ? searchParams.subcategories
      : [searchParams.subcategories];
  }

  if (searchParams.productTypes) {
    state.productTypes = Array.isArray(searchParams.productTypes)
      ? searchParams.productTypes
      : [searchParams.productTypes];
  }

  if (searchParams.priceMin && searchParams.priceMax) {
    state.priceRange = [
      parseInt(searchParams.priceMin as string, 10),
      parseInt(searchParams.priceMax as string, 10),
    ];
  }

  if (searchParams.colors) {
    state.colors = Array.isArray(searchParams.colors)
      ? searchParams.colors
      : [searchParams.colors];
  }

  if (searchParams.materials) {
    state.materials = Array.isArray(searchParams.materials)
      ? searchParams.materials
      : [searchParams.materials];
  }

  if (searchParams.availability) {
    state.availability = Array.isArray(searchParams.availability)
      ? searchParams.availability
      : [searchParams.availability];
  }

  if (searchParams.collections) {
    state.collections = Array.isArray(searchParams.collections)
      ? searchParams.collections
      : [searchParams.collections];
  }

  if (searchParams.sortBy) {
    state.sortBy = searchParams.sortBy as FilterState["sortBy"];
  }

  return state;
}

export function filterStateToUrlParams(state: FilterState): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};

  if (state.brands.length > 0) params.brands = state.brands;
  if (state.categories.length > 0) params.categories = state.categories;
  if (state.subcategories.length > 0) params.subcategories = state.subcategories;
  if (state.productTypes.length > 0) params.productTypes = state.productTypes;
  if (state.priceRange) {
    params.priceMin = state.priceRange[0].toString();
    params.priceMax = state.priceRange[1].toString();
  }
  if (state.colors.length > 0) params.colors = state.colors;
  if (state.materials.length > 0) params.materials = state.materials;
  if (state.availability.length > 0) params.availability = state.availability;
  if (state.collections.length > 0) params.collections = state.collections;
  if (state.sortBy !== "featured") params.sortBy = state.sortBy;

  return params;
}

export function filterProducts(products: Product[], filters: FilterState): Product[] {
  let result = products;

  if (filters.brands.length > 0) {
    result = result.filter((p) =>
      filters.brands.some((b) => b.toLowerCase() === p.brand.toLowerCase())
    );
  }

  if (filters.categories.length > 0) {
    result = result.filter((p) =>
      filters.categories.includes(p.category)
    );
  }

  if (filters.subcategories.length > 0) {
    result = result.filter((p) =>
      filters.subcategories.includes(p.subcategory)
    );
  }

  if (filters.priceRange) {
    result = result.filter(
      (p) =>
        p.price >= filters.priceRange![0] &&
        p.price <= filters.priceRange![1]
    );
  }

  if (filters.colors.length > 0) {
    result = result.filter((p) =>
      filters.colors.some((c) =>
        p.finishes.some((f) => f.toLowerCase() === c.toLowerCase())
      )
    );
  }

  if (filters.availability.length > 0) {
    result = result.filter((p) =>
      filters.availability.includes(p.availability)
    );
  }

  return result;
}

export function sortProducts(products: Product[], sortBy: FilterState["sortBy"]): Product[] {
  const sorted = [...products];

  switch (sortBy) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "newest":
      return sorted.reverse();
    case "brand-asc":
      return sorted.sort((a, b) => a.brand.localeCompare(b.brand));
    case "featured":
    default:
      return sorted.sort((a, b) => {
        if (a.featured === b.featured) return 0;
        return a.featured ? -1 : 1;
      });
  }
}

export function buildFilterFacets(products: Product[]) {
  const brands = new Set<string>();
  const categories = new Set<string>();
  const subcategories = new Set<string>();
  const colors = new Set<string>();
  const availability = new Set<string>();
  const priceMin = Math.min(...products.map((p) => p.price));
  const priceMax = Math.max(...products.map((p) => p.price));

  products.forEach((p) => {
    brands.add(p.brand);
    categories.add(p.category);
    subcategories.add(p.subcategory);
    availability.add(p.availability);
    p.finishes.forEach((f) => colors.add(f));
  });

  return {
    brands: Array.from(brands).sort(),
    categories: Array.from(categories).sort(),
    subcategories: Array.from(subcategories).sort(),
    colors: Array.from(colors).sort(),
    availability: Array.from(availability).sort(),
    priceRange: [priceMin, priceMax] as [number, number],
  };
}

export function countFilterMatches(products: Product[], filterKey: string, filterValue: string, currentFilters: FilterState): number {
  const filtered = filterProducts(products, currentFilters);

  let additionalFilter: FilterState = { ...currentFilters };

  switch (filterKey) {
    case "brand":
      if (!additionalFilter.brands.includes(filterValue)) {
        additionalFilter.brands = [...additionalFilter.brands, filterValue];
      }
      break;
    case "category":
      if (!additionalFilter.categories.includes(filterValue)) {
        additionalFilter.categories = [...additionalFilter.categories, filterValue];
      }
      break;
    case "color":
      if (!additionalFilter.colors.includes(filterValue)) {
        additionalFilter.colors = [...additionalFilter.colors, filterValue];
      }
      break;
    case "availability":
      if (!additionalFilter.availability.includes(filterValue)) {
        additionalFilter.availability = [...additionalFilter.availability, filterValue];
      }
      break;
  }

  return filterProducts(products, additionalFilter).length;
}

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.subcategories.length > 0 ||
    filters.priceRange !== null ||
    filters.colors.length > 0 ||
    filters.availability.length > 0
  );
}
