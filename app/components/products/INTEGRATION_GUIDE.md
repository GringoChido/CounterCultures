# Integration Guide: Adding Faceted Filters to Shop Pages

This guide shows how to integrate the new Ferguson Home-style faceted filter system into your existing shop pages.

## Step 1: Update Your Shop Page Component

Replace your existing shop page with the new CatalogLayout:

### Before (Old Implementation)

```tsx
// app/[locale]/shop/shop-catalog.tsx
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
  // ... old implementation
};
```

### After (New Implementation)

```tsx
// app/[locale]/shop/shop-catalog.tsx
"use client";

import { CatalogLayout } from "@/app/components/products/CatalogLayout";
import type { Product } from "@/app/lib/types";

interface ShopCatalogProps {
  initialProducts: Product[];
  initialCategory?: string;
}

const ShopCatalog = ({ initialProducts, initialCategory }: ShopCatalogProps) => {
  return <CatalogLayout products={initialProducts} initialCategory={initialCategory} />;
};

export { ShopCatalog };
```

## Step 2: Update Shop Category Pages

Update your category pages to use the new catalog:

### Example: Bathroom Category Page

```tsx
// app/[locale]/shop/[category]/page.tsx
import { CatalogLayout } from "@/app/components/products/CatalogLayout";
import { getProductsByCategory } from "@/app/lib/products";

export default async function CategoryPage({
  params,
}: {
  params: { locale: string; category: string };
}) {
  const products = await getProductsByCategory(params.category);

  return (
    <main>
      <CatalogLayout
        products={products}
        initialCategory={params.category}
      />
    </main>
  );
}

export async function generateStaticParams() {
  return [
    { locale: "en", category: "bathroom" },
    { locale: "en", category: "kitchen" },
    { locale: "en", category: "hardware" },
    { locale: "es", category: "bano" },
    { locale: "es", category: "cocina" },
    { locale: "es", category: "herrajes" },
  ];
}
```

## Step 3: Remove Old Filter Components

You can now remove these old components as they're replaced by the new system:

- `app/components/ui/filter-bar.tsx` (optional - keep if used elsewhere)
- Custom filter state management from shop pages

## Step 4: Update URL Patterns (Optional)

The new system uses query parameters for filters. Existing links should still work:

**Old format:**
```
/shop/bathroom
/shop/bathroom?priceMin=5000&priceMax=50000
```

**New format (same):**
```
/shop/bathroom?brands=TOTO&categories=bathroom&priceMin=5000&priceMax=50000
```

## Step 5: Customize Filter Labels (Optional)

To add bilingual support or custom labels, update FilterPills:

```tsx
// In CatalogLayout or where you use FilterPills
const facetLabels = {
  categories: {
    bathroom: "Baño",
    kitchen: "Cocina",
    hardware: "Herrajes",
  },
  availability: {
    "in-stock": "En Stock",
    "made-to-order": "Por Encargo",
  },
};

<FilterPills
  filters={filters}
  onRemove={handleRemoveFilter}
  onClearAll={handleClearAll}
  facetLabels={facetLabels}
/>
```

## Step 6: Customize Finish Color Mapping (Optional)

Update finish color mapping in ProductCard:

```tsx
// app/components/products/ProductCard.tsx
function getFinishColor(finish: string): string {
  const colorMap: Record<string, string> = {
    chrome: "#C0C0C0",
    "brushed nickel": "#8E8E8E",
    // Add your custom finishes here
    "my-finish": "#FF0000",
  };
  // ...
}
```

## Step 7: Adjust Layout Proportions (Optional)

Modify the sidebar width in CatalogLayout:

```tsx
// Change grid ratio
{/* Before: lg:grid-cols-4 with lg:col-span-1 sidebar, lg:col-span-3 content */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Sidebar */}
  <div className="lg:col-span-1">...</div>
  {/* Content */}
  <div className="lg:col-span-2">...</div>
</div>
```

Or use fixed widths:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
  {/* Sidebar: 280px */}
  <div>...</div>
  {/* Content: flex */}
  <div>...</div>
</div>
```

## Real-World Example: Multi-Page Implementation

Here's how to implement across multiple pages:

```tsx
// lib/products.ts
export async function getProducts() {
  // Fetch all products from your data source
  return db.products.findMany();
}

export async function getProductsByCategory(category: string) {
  return db.products.findMany({ where: { category } });
}

export async function getProductsByBrand(brand: string) {
  return db.products.findMany({ where: { brand } });
}

// app/[locale]/shop/page.tsx - All Products
import { CatalogLayout } from "@/app/components/products/CatalogLayout";
import { getProducts } from "@/app/lib/products";

export default async function ShopPage() {
  const products = await getProducts();
  return <CatalogLayout products={products} />;
}

// app/[locale]/shop/[category]/page.tsx - Category
import { CatalogLayout } from "@/app/components/products/CatalogLayout";
import { getProductsByCategory } from "@/app/lib/products";

export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const products = await getProductsByCategory(params.category);
  return <CatalogLayout products={products} initialCategory={params.category} />;
}

// app/[locale]/brands/[brand]/page.tsx - Brand
import { CatalogLayout } from "@/app/components/products/CatalogLayout";
import { getProductsByBrand } from "@/app/lib/products";

export default async function BrandPage({
  params,
}: {
  params: { brand: string };
}) {
  const products = await getProductsByBrand(params.brand);
  return <CatalogLayout products={products} />;
}
```

## API Data Expectations

Ensure your Product data includes:

```typescript
interface Product {
  id: string;
  sku: string;
  brand: string;              // "TOTO", "Kohler", etc.
  name: string;               // Spanish name
  nameEn: string;             // English name
  category: "bathroom" | "kitchen" | "hardware";
  subcategory: string;        // "lavabos", "grifos", etc.
  price: number;              // MXN
  tradePrice?: number;        // Optional
  currency: "MXN" | "USD";
  finishes: string[];         // ["Chrome", "Brushed Nickel"]
  images: string[];           // URL array
  artisanal: boolean;
  description: string;        // Spanish
  descriptionEn: string;      // English
  availability: "in-stock" | "made-to-order" | "special-order";
  featured?: boolean;
  slug: string;               // URL-friendly
}
```

## Testing the Integration

### Test Cases

1. **Filter Application**
   - Select a brand filter, verify products update
   - Select multiple brands, verify OR logic
   - Select brand + category, verify AND logic
   - Verify counts update correctly

2. **URL Persistence**
   - Apply filters, copy URL, paste in new tab
   - Verify same filters applied in new tab
   - Browser back/forward navigation

3. **Mobile Experience**
   - Open on mobile, tap Filters button
   - Sidebar appears, apply filters
   - Sidebar closes on filter selection
   - Swipe to close on overlay

4. **Price Range**
   - Drag slider handles, verify range updates
   - Type in min/max fields
   - Verify filter updates in real-time

5. **Responsive Layout**
   - Desktop: sidebar + 4-column grid
   - Tablet: sidebar + 3-column grid
   - Mobile: full-width, drawer sidebar

6. **Performance**
   - Toggle filters rapidly
   - Monitor for layout shift
   - Check image loading performance

### Manual Testing Checklist

```
[x] Filters apply correctly
[x] Multiple filters within same group (OR logic)
[x] Filters across groups (AND logic)
[x] URL updates when filters change
[x] URL params applied on page load
[x] Clear all filters button works
[x] Remove individual filter pills
[x] Product count updates
[x] Sort options work
[x] Mobile sidebar opens/closes
[x] Price slider functional
[x] Finish color display
[x] Product card hover states
[x] Loading skeleton appears
[x] Empty state messaging
```

## Performance Optimization Tips

1. **Lazy Load Images**
   - ProductCard already uses Image with sizes
   - Add priority={false} for off-screen cards

2. **Debounce URL Updates**
   - Currently has 100ms delay, can be increased
   - Prevents excessive router.push() calls

3. **Pagination (Future)**
   - Can implement offset/limit for large catalogs
   - Add pagination or infinite scroll to ProductGrid

4. **Search** (Future)
   - Add search input to ProductFilter
   - Filter by name/sku in real-time

5. **Analytics**
   - Track filter selections
   - Monitor common filter combinations
   - Identify product search patterns

## Troubleshooting

### Issue: Filters Not Persisting on Refresh
```tsx
// Make sure parseUrlParams is called in useState initializer
const [filters, setFilters] = useState<FilterState>(() => {
  const params = Object.fromEntries(searchParams.entries());
  return parseUrlParams(params);
});
```

### Issue: Counts Showing as 0
```tsx
// Verify product brand names match exactly
console.log("Brands in data:", products.map(p => p.brand));
console.log("Brands in facets:", facets.brands);
```

### Issue: Mobile Sidebar Not Appearing
```tsx
// Check z-index and positioning
// Sidebar needs z-40 for overlay, z-20 for button
// Make sure viewport meta tag is present in layout
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### Issue: Price Slider Not Working
```tsx
// Verify facets have valid price range
console.log("Price range:", facets.priceRange);
// If all products same price, range will be [price, price]
```

## Migration Checklist

- [ ] Create /app/components/products/ directory
- [ ] Copy all component files (ProductFilter, ProductGrid, etc.)
- [ ] Copy filter-utils.ts to /app/lib/
- [ ] Update shop pages to use CatalogLayout
- [ ] Test filters on each shop page
- [ ] Verify URL parameters work
- [ ] Test mobile responsive
- [ ] Update any links that hardcode filter state
- [ ] Remove old FilterBar component (if not used elsewhere)
- [ ] Deploy and monitor for errors

## Next Steps

After integration:

1. Collect analytics on filter usage
2. Identify most common filter combinations
3. Consider adding:
   - Search/narrowing
   - Saved filters
   - Comparison tool
   - Wishlist integration
   - Related products
4. Optimize based on user behavior
5. A/B test alternative layouts

For questions or issues, refer to the component README.md files.
