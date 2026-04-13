# Product Filter & Catalog Components

Ferguson Home-style faceted filter system for the Counter Cultures product catalog. This component system provides a professional, responsive product browsing experience with advanced filtering, sorting, and URL-based state management.

## Components

### CatalogLayout
The main orchestrator component that manages filter state, URL synchronization, and layout. Use this as the root component for catalog pages.

**Props:**
- `products: Product[]` - Array of products to display
- `initialCategory?: string` - Optional category slug for URL

**Features:**
- URL-based filter state (shareable filtered views)
- Real-time product count updates
- Active filter pills/tags display
- Mobile-responsive layout

**Usage:**
```tsx
<CatalogLayout products={allProducts} initialCategory="bathroom" />
```

### ProductFilter
Sidebar filter component with accordion-style sections and mobile drawer.

**Props:**
- `products: Product[]` - Products to calculate facets from
- `filters: FilterState` - Current filter state
- `onFilterChange: (newFilters: FilterState) => void` - Callback on filter change
- `onRemoveFilter: (filterKey: string, value: string) => void` - Remove individual filter

**Features:**
- Accordion-style expandable sections
- Filter counts for each option
- Mobile sidebar drawer
- Clear all filters button
- Multiple filter types:
  - **Brand** - Multi-select checkbox
  - **Category** - Multi-select checkbox
  - **Price Range** - Dual-handle slider
  - **Finish/Color** - Multi-select with visual indicators
  - **Availability** - Multi-select checkbox

**Usage:**
```tsx
<ProductFilter
  products={products}
  filters={filters}
  onFilterChange={handleFilterChange}
  onRemoveFilter={handleRemoveFilter}
/>
```

### ProductGrid
Responsive product grid with sorting support.

**Props:**
- `products: Product[]` - Products to display
- `filters: FilterState` - Current filters (applied internally)
- `isLoading?: boolean` - Show loading skeleton

**Features:**
- Responsive grid (1-4 columns)
- Product count display
- Loading skeleton animation
- Empty state messaging
- Sort options:
  - Featured (default)
  - Price: Low to High
  - Price: High to Low
  - Newest
  - Brand A–Z

**Usage:**
```tsx
<ProductGrid
  products={products}
  filters={filters}
  isLoading={isLoading}
/>
```

### ProductCard
Individual product card with hover effects and quick view.

**Props:**
- `product: Product` - Product data

**Features:**
- Hover zoom effect on image
- Quick View button on hover
- Artisanal/In Stock badges
- Finish color indicators
- Brand, name, price, and finish display
- Automatic color mapping for finishes

**Usage:**
```tsx
<ProductCard product={product} />
```

### FilterPills
Active filter tags displayed above the product grid.

**Props:**
- `filters: FilterState` - Current filter state
- `onRemove: (filterKey: string, value: string) => void` - Remove filter
- `onClearAll: () => void` - Clear all filters
- `facetLabels?: Record<string, Record<string, string>>` - Custom label mappings

**Features:**
- Visual filter tags
- Individual remove buttons
- Clear all button
- Custom label support
- Localization ready

**Usage:**
```tsx
<FilterPills
  filters={filters}
  onRemove={handleRemoveFilter}
  onClearAll={handleClearAll}
/>
```

### PriceRangeSlider
Dual-handle price range slider with input fields.

**Props:**
- `min: number` - Minimum price
- `max: number` - Maximum price
- `value: [number, number]` - Current range
- `onChange: (range: [number, number]) => void` - Change callback
- `step?: number` - Step increment (default: 100)
- `currency?: string` - Currency display (default: MXN)

**Features:**
- Dual-handle range slider
- Visual progress bar
- Min/Max input fields
- Currency formatting
- Keyboard accessible

**Usage:**
```tsx
<PriceRangeSlider
  min={0}
  max={100000}
  value={[5000, 50000]}
  onChange={handlePriceChange}
/>
```

### SortControl
Dropdown sort selector.

**Props:**
- `currentSort: FilterState["sortBy"]` - Current sort option
- `onSortChange: (sort: FilterState["sortBy"]) => void` - Sort change callback

**Sort Options:**
- Featured (default)
- Price: Low to High
- Price: High to Low
- Newest
- Brand A–Z

**Usage:**
```tsx
<SortControl
  currentSort={filters.sortBy}
  onSortChange={handleSortChange}
/>
```

## Utilities (filter-utils.ts)

### Types

**FilterState**
```tsx
interface FilterState {
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
```

### Functions

#### parseUrlParams(searchParams)
Parse URL search parameters into FilterState.

```tsx
const filters = parseUrlParams(Object.fromEntries(searchParams.entries()));
```

#### filterStateToUrlParams(state)
Convert FilterState to URL search parameters.

```tsx
const params = filterStateToUrlParams(filters);
const queryString = new URLSearchParams(params);
```

#### filterProducts(products, filters)
Apply filters to products. Uses OR logic within filter groups, AND logic across groups.

```tsx
const filtered = filterProducts(products, filters);
```

#### sortProducts(products, sortBy)
Sort products by the specified criteria.

```tsx
const sorted = sortProducts(filtered, filters.sortBy);
```

#### buildFilterFacets(products)
Extract available filter options from products.

```tsx
const facets = buildFilterFacets(products);
// Returns { brands, categories, colors, availability, priceRange, ... }
```

#### hasActiveFilters(filters)
Check if any filters are currently applied.

```tsx
if (hasActiveFilters(filters)) {
  // Show clear all button
}
```

## Filter Logic

### AND/OR Semantics
- **Within a group** (Brand, Color, etc.): OR logic
  - Selected: Chrome OR Brushed Nickel = products with either finish
- **Across groups**: AND logic
  - Brand: Kohler AND Category: Bathroom = Kohler bathroom products only

### Example Scenarios

**Filter 1: Single Brand**
- Filters: brands = ["TOTO"]
- Result: Only TOTO products

**Filter 2: Multiple Brands**
- Filters: brands = ["TOTO", "Kohler"]
- Result: TOTO products OR Kohler products

**Filter 3: Brand + Category**
- Filters: brands = ["TOTO"], categories = ["bathroom"]
- Result: TOTO products AND in bathroom category

**Filter 4: Multiple Categories + Price Range**
- Filters: categories = ["bathroom", "kitchen"], priceRange = [5000, 50000]
- Result: (Bathroom OR Kitchen) AND (Price between 5000-50000)

## URL State Management

The catalog supports shareable filter URLs:

```
/shop/bathroom?brands=TOTO&brands=Kohler&categories=bathroom&priceMin=5000&priceMax=50000&colors=Chrome&sortBy=price-asc
```

This allows users to:
- Share filtered views with others
- Bookmark searches
- Browser back/forward navigation
- Social sharing of curated results

## Styling

All components use Tailwind CSS with the Counter Cultures brand color palette:

- **Primary**: brand-terracotta (#C4725A)
- **Accent**: brand-copper (#B87333)
- **Text**: brand-charcoal (#1A1A1A)
- **Muted**: brand-stone (#A89F91)
- **Background**: brand-linen (#F5F0EB)

Typography:
- **Display**: Cormorant Garamond (serif)
- **Body**: DM Sans (sans-serif)
- **Mono**: JetBrains Mono (monospace)

## Responsive Design

- **Mobile**: Single column, drawer filter sidebar
- **Tablet**: 2 columns, 600px+ sidebar
- **Desktop**: 4-column grid with full sidebar

## Localization

Components support bilingual content (ES/EN) through:
- Product data (name, nameEn)
- Filter labels (customizable via facetLabels)
- Category labels (bathroom = "Baño", etc.)

Extend labels in FilterPills:
```tsx
<FilterPills
  filters={filters}
  facetLabels={{
    brands: { "My Brand": "Mi Marca" },
    categories: { "bathroom": "Baño" }
  }}
/>
```

## Performance

- Memoized filter calculations
- URL param shallow routing
- Image lazy loading
- Skeleton loading states
- Efficient facet count computation

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Mobile browsers:
- iOS Safari 14+
- Chrome Mobile 90+
- Samsung Internet 14+

## Integration Example

```tsx
// app/[locale]/shop/page.tsx
import { CatalogLayout } from "@/app/components/products/CatalogLayout";
import { getProducts } from "@/app/lib/products";

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <main>
      <CatalogLayout products={products} />
    </main>
  );
}
```

## Known Limitations & Future Enhancements

- Subcategories and ProductTypes not yet implemented in UI (structure in place)
- Materials filter not yet implemented (structure in place)
- Collections filter not yet implemented (structure in place)
- No infinite scroll (can be added)
- No facet search/narrowing (can be added)
- No recent searches (can be added)
- No saved filters/wishlists (can be added)

## Troubleshooting

**Filters not updating URL?**
- Check that router.push() is working in your layout
- Verify searchParams is passed correctly to parseUrlParams

**Filter counts showing 0?**
- Ensure product data matches expected structure
- Check that brand names match exactly (case-sensitive)

**Price slider not working?**
- Verify products have valid price numbers
- Check min/max price range isn't inverted

**Mobile filters not visible?**
- Ensure ProductFilter is visible on mobile
- Check z-index conflicts with other elements
