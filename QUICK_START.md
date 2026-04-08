# Quick Start: Faceted Filter Implementation

Get the new Ferguson Home-style filters running in 5 minutes.

## What You're Getting

A complete product catalog filtering system with:
- Sidebar filters (Brand, Category, Price, Color, Availability)
- Responsive grid (mobile drawer to desktop sidebar)
- URL-based state (shareable filter URLs)
- Sorting options (Featured, Price, Brand, Newest)
- Real-time product counts

## Files Created

### Components
```
app/components/products/
├── CatalogLayout.tsx      (Main orchestrator - use this!)
├── ProductFilter.tsx      (Sidebar filters)
├── ProductGrid.tsx        (Product display)
├── ProductCard.tsx        (Individual product)
├── FilterPills.tsx        (Active filter tags)
├── PriceRangeSlider.tsx   (Price slider)
├── SortControl.tsx        (Sort dropdown)
├── README.md              (Full documentation)
└── INTEGRATION_GUIDE.md   (Integration instructions)
```

### Utilities
```
app/lib/
└── filter-utils.ts        (Filter logic)
```

### Documentation
```
FACETED_FILTER_SUMMARY.md  (Overview)
QUICK_START.md            (This file)
```

## 30-Second Setup

### Replace your shop page:

**Before:**
```tsx
// app/[locale]/shop/shop-catalog.tsx
const ShopCatalog = ({ initialProducts, initialCategory }) => {
  // ... complex filter logic
};
```

**After:**
```tsx
// app/[locale]/shop/shop-catalog.tsx
import { CatalogLayout } from "@/app/components/products/CatalogLayout";

const ShopCatalog = ({ initialProducts, initialCategory }) => {
  return <CatalogLayout products={initialProducts} initialCategory={initialCategory} />;
};
```

That's it! Everything else is handled by CatalogLayout.

## What It Does

```
User sees:
┌─ Mobile:                    ┌─ Desktop:
│ [ Products ]               │ [ Filters | Products ]
│ [≡ Filters]               │ ├─ Brand                ├─ Product Grid
│                            │ ├─ Category            │  (4 columns)
└─────────────────────────   │ ├─ Price Range         │
                            │ ├─ Finish              │
                            │ ├─ Availability        └─────────────
                            │ Clear All
                            └─────────────────────────
```

## How Filters Work

**In the same group** (Brand, Color, etc.): **OR logic**
- Kohler OR TOTO = both brands' products

**Across groups**: **AND logic**
- (Kohler OR TOTO) AND Bathroom AND $5k–$50k = products matching all criteria

**URL example:**
```
/shop?brands=TOTO&brands=Kohler&categories=bathroom&priceMin=5000&priceMax=50000
```

## Testing

1. **Apply a filter** - Product count updates
2. **Click product** - Opens detail page
3. **Add more filters** - Products narrow down
4. **Copy URL** - Share with team, opens same filters
5. **Mobile** - Tap "Filters", drawer opens
6. **Sort** - Top right dropdown changes order

## Components at a Glance

| Component | Purpose | Location |
|-----------|---------|----------|
| CatalogLayout | Everything together | Use directly |
| ProductFilter | Sidebar filters | Inside CatalogLayout |
| ProductGrid | Product list | Inside CatalogLayout |
| ProductCard | Individual product | Inside ProductGrid |
| FilterPills | Active filters | Inside CatalogLayout |
| PriceRangeSlider | Price filter | Inside ProductFilter |
| SortControl | Sort dropdown | Inside ProductGrid |

## Customization Points

### Change Colors
Edit global CSS in `app/globals.css`:
```css
--color-brand-terracotta: #C4725A;  /* primary color */
--color-brand-stone: #A89F91;       /* muted text */
```

### Change Filter Labels
In CatalogLayout or ProductFilter, update label mappings:
```tsx
const categoryLabel = category === "bathroom" ? "Baño" : category;
```

### Adjust Grid Columns
In CatalogLayout, change Tailwind grid:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
  {/* Change lg:grid-cols-4 to lg:grid-cols-3 or lg:grid-cols-5 */}
</div>
```

### Change Sidebar Width
In CatalogLayout, adjust grid split:
```tsx
{/* Before: lg:cols-span-1 sidebar, lg:col-span-3 content */}
{/* After: lg:col-span-2 sidebar, lg:col-span-2 content */}
```

## Common Questions

**Q: How do I add more filters?**
A: In ProductFilter.tsx, add a new accordion section following the same pattern as Brand or Category.

**Q: How do I change filter counts?**
A: They're automatic based on products array. Make sure your product data is correct.

**Q: How do I customize the mobile experience?**
A: ProductFilter has mobile drawer built-in. Adjust z-index in Tailwind classes if needed.

**Q: Do I need to change my API?**
A: No. Just pass products array, everything else is handled client-side.

**Q: Can I hide certain filter sections?**
A: Yes, add conditional rendering in ProductFilter.tsx:
```tsx
{facets.colors.length > 0 && (
  <div>Color Filter</div>
)}
```

**Q: How do I track filter usage?**
A: Add analytics in handleFilterChange callback:
```tsx
const handleFilterChange = (newFilters) => {
  analytics.track('filter_applied', { filters: newFilters });
  // ... rest of code
};
```

## Next Steps

1. **Copy all files** from app/components/products/ and app/lib/filter-utils.ts
2. **Update your shop page** - Replace old logic with CatalogLayout
3. **Test filters** - Try each filter type, verify counts
4. **Test URL** - Apply filters, copy URL, share it
5. **Test mobile** - Open on phone, tap Filters drawer
6. **Read full docs** - Check README.md for detailed info

## Files Reference

- **README.md** - Component API, detailed docs
- **INTEGRATION_GUIDE.md** - Step-by-step integration
- **FACETED_FILTER_SUMMARY.md** - Full overview

## Support Checklist

```
[ ] All 9 component files copied
[ ] filter-utils.ts copied to app/lib/
[ ] CatalogLayout imported in shop page
[ ] Products data structure correct
[ ] TypeScript compiles without errors
[ ] Filters update on click
[ ] URL updates when filtering
[ ] Mobile drawer opens/closes
[ ] Images load correctly
[ ] No console errors
```

## Architecture Overview

```
┌─ CatalogLayout (manages state)
│  ├─ parseUrlParams() - load filters from URL
│  ├─ filterStateToUrlParams() - save to URL
│  └─ updateUrl() - push to router
│
├─ ProductFilter (display filters)
│  ├─ buildFilterFacets() - get available options
│  ├─ getCountForFilter() - show counts
│  └─ PriceRangeSlider - special slider component
│
├─ FilterPills (active filters)
│  └─ Shows selected filters with remove buttons
│
├─ SortControl (sort dropdown)
│  └─ Featured, Price, Brand, Newest
│
└─ ProductGrid (display products)
   ├─ filterProducts() - apply all filters
   ├─ sortProducts() - apply sort
   └─ ProductCard[] - individual cards
      └─ Product image, name, price, colors
```

## Performance Notes

- Filters apply instantly (no network calls)
- URL updates are debounced (100ms)
- Images are lazy loaded
- Product counts are memoized
- No unnecessary re-renders

## Browser Support

- ✅ Desktop: Chrome, Firefox, Safari, Edge (latest)
- ✅ Mobile: iOS Safari 14+, Chrome Mobile 90+
- ❌ IE11 (not supported, but can add polyfills)

## Known Limitations

- No infinite scroll (use pagination instead)
- No product search (can be added)
- No facet search (can be added)
- No saved filters yet (can be added)

All can be added later without changing existing code.

---

**Ready to go?** Start with step 1 in "30-Second Setup" above!

Questions? Check README.md in app/components/products/ for detailed docs.
