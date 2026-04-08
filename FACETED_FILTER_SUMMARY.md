# Ferguson Home-Style Faceted Filter Component System

A complete, production-ready faceted filter system for the Counter Cultures product catalog. Inspired by Ferguson Home's professional product discovery experience.

## Components Overview

### Created Files

#### Components (`app/components/products/`)

1. **CatalogLayout.tsx** - Main orchestrator component
   - Manages filter state and URL synchronization
   - Coordinates all sub-components
   - Handles mobile responsive layout
   - Supports shareable filter URLs

2. **ProductFilter.tsx** - Sidebar filter component
   - Accordion-style filter sections
   - Mobile drawer implementation
   - Real-time filter count badges
   - Sections:
     - Brand (multi-select)
     - Category (multi-select)
     - Price Range (dual-slider)
     - Finish/Color (multi-select)
     - Availability (multi-select)

3. **ProductGrid.tsx** - Product display grid
   - Responsive layout (1-4 columns)
   - Applied filters and sorting
   - Loading skeleton states
   - Empty state messaging
   - Product count display

4. **ProductCard.tsx** - Individual product card
   - Image with hover zoom
   - Quick View button on hover
   - Artisanal/In Stock badges
   - Finish color indicators
   - Brand, name, price display
   - Auto finish color mapping

5. **FilterPills.tsx** - Active filter display
   - Visual filter tags
   - Individual remove buttons
   - Clear all functionality
   - Bilingual label support
   - Localization ready

6. **PriceRangeSlider.tsx** - Dual-handle price slider
   - Interactive range selection
   - Min/Max input fields
   - Visual progress bar
   - Currency formatting
   - Keyboard accessible

7. **SortControl.tsx** - Sort dropdown selector
   - Featured
   - Price: Low to High
   - Price: High to Low
   - Newest
   - Brand A–Z

#### Utilities (`app/lib/`)

8. **filter-utils.ts** - Filter logic and utilities
   - FilterState interface
   - URL parameter parsing/conversion
   - Product filtering (AND/OR logic)
   - Product sorting
   - Facet extraction
   - Active filter checking

#### Documentation

9. **README.md** - Comprehensive component documentation
   - Component API reference
   - Usage examples
   - Filter logic explanation
   - URL state management
   - Styling guide
   - Responsive design info
   - Troubleshooting

10. **INTEGRATION_GUIDE.md** - Step-by-step integration instructions
    - How to update existing pages
    - Real-world examples
    - API data expectations
    - Testing checklist
    - Performance optimization
    - Migration checklist

## Key Features

### Filter Functionality
- Multi-select filtering with checkbox UI
- Dual-handle price range slider
- Real-time product count for each filter option
- AND logic across filter groups
- OR logic within filter groups
- Clear individual filters or all at once

### URL State Management
- Shareable filtered URLs with query parameters
- Browser back/forward navigation support
- Bookmark-friendly filter URLs
- URL parameter parsing on load

### Responsive Design
- Mobile: Full-width with drawer sidebar
- Tablet: 2-3 column grid
- Desktop: 4-column grid with persistent sidebar
- Touch-friendly button sizing (44px minimum)

### User Experience
- Active filter pills showing current filters
- Visual feedback on hover
- Loading skeleton states
- Empty state messaging
- Smooth transitions and animations
- Accessible color contrasts

### Styling
- Tailwind CSS with brand color palette
- Consistent typography using display/body/mono fonts
- Responsive spacing and padding
- Accessibility considerations built in

## File Locations

```
app/
├── components/
│   └── products/
│       ├── CatalogLayout.tsx
│       ├── ProductFilter.tsx
│       ├── ProductGrid.tsx
│       ├── ProductCard.tsx
│       ├── FilterPills.tsx
│       ├── PriceRangeSlider.tsx
│       ├── SortControl.tsx
│       ├── README.md
│       └── INTEGRATION_GUIDE.md
└── lib/
    └── filter-utils.ts
```

## Component Hierarchy

```
CatalogLayout
├── ProductFilter
│   ├── PriceRangeSlider
│   └── [Accordion Sections]
├── FilterPills
├── SortControl
└── ProductGrid
    └── ProductCard[] (multiple)
```

## Type Definitions

### FilterState
```typescript
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

### Product (existing, fully supported)
```typescript
interface Product {
  id: string;
  sku: string;
  brand: string;
  name: string;
  nameEn: string;
  category: "bathroom" | "kitchen" | "hardware";
  subcategory: string;
  price: number;
  tradePrice?: number;
  currency: "MXN" | "USD";
  finishes: string[];
  images: string[];
  artisanal: boolean;
  description: string;
  descriptionEn: string;
  specifications?: Record<string, string>;
  availability: "in-stock" | "made-to-order" | "special-order";
  featured?: boolean;
  slug: string;
}
```

## Usage Example

### Basic Integration
```tsx
import { CatalogLayout } from "@/app/components/products/CatalogLayout";
import { getProducts } from "@/app/lib/products";

export default async function ShopPage() {
  const products = await getProducts();
  return <CatalogLayout products={products} />;
}
```

### With Category
```tsx
<CatalogLayout
  products={products}
  initialCategory="bathroom"
/>
```

## Filter Logic Examples

### Single Brand Filter
- URL: `?brands=TOTO`
- Result: Only TOTO products

### Multiple Brands (OR)
- URL: `?brands=TOTO&brands=Kohler`
- Result: TOTO OR Kohler

### Brand + Category (AND)
- URL: `?brands=TOTO&categories=bathroom`
- Result: TOTO AND Bathroom category

### Complex Filter
- URL: `?brands=TOTO&brands=Kohler&categories=bathroom&priceMin=5000&priceMax=50000&colors=Chrome`
- Result: (TOTO OR Kohler) AND Bathroom AND Price AND Chrome

## Color Palette

All components use Counter Cultures brand colors:

| Color | Hex | Usage |
|-------|-----|-------|
| Charcoal | #1A1A1A | Text, headings |
| Terracotta | #C4725A | Primary, hover states |
| Copper | #B87333 | Badges, accents |
| Sage | #7A8B6F | Availability, secondary |
| Stone | #A89F91| Muted text, borders |
| Linen | #F5F0EB | Background, subtle |
| Sand | #D4C5A9 | Hover backgrounds |

## Performance Characteristics

- Memoized filter calculations (useMemo)
- Debounced URL updates (100ms)
- Image lazy loading (next/image)
- Skeleton loading states
- Efficient facet count computation

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile: iOS 14+, Android Chrome 90+

## Next Steps

1. **Review** - Read README.md in products folder
2. **Integrate** - Follow INTEGRATION_GUIDE.md for your pages
3. **Customize** - Adjust colors, labels, and layout as needed
4. **Test** - Use the testing checklist in INTEGRATION_GUIDE.md
5. **Deploy** - Monitor filter usage and iterate

## Future Enhancements

The system is built with extensibility in mind:

- [ ] Subcategory filtering UI
- [ ] Material/specification filtering
- [ ] Collection filtering
- [ ] Search/narrowing
- [ ] Facet value search
- [ ] Saved filters/wishlists
- [ ] Product comparison
- [ ] Recently viewed products
- [ ] Smart filter recommendations
- [ ] Infinite scroll pagination
- [ ] Analytics integration

## Notes

- All components are "use client" (client-side interactivity)
- CatalogLayout uses Next.js router for URL management
- Price slider uses native HTML5 range inputs with custom styling
- Color indicators auto-map finish names to colors (customizable)
- Fully responsive without media queries in components (Tailwind)
- Ready for i18n integration

## Support

For questions or issues:
1. Check README.md for detailed component documentation
2. Review INTEGRATION_GUIDE.md for common issues
3. Check filter-utils.ts comments for function details
4. Refer to existing examples in shop-catalog.tsx

---

**Version**: 1.0.0
**Created**: 2026-04-02
**Status**: Production Ready
