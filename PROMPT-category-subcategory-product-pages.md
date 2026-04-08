# Claude Code Prompt: Build All Category, Subcategory & Product Pages + Mega Nav

## CRITICAL: Read Next.js 16 Docs First

Before writing ANY code, read the relevant guides in `node_modules/next/dist/docs/01-app/`. This is Next.js 16.2.1 — APIs, conventions, and file structure may differ from your training data. Specifically read:

- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`
- `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`

Heed deprecation notices. Check how `params` works in this version (they are `Promise`-based: `const { category } = await params`).

---

## Overview

Build out the complete Category → Subcategory → Product page hierarchy for Counter Cultures, a luxury bath/kitchen/hardware fixture showroom in San Miguel de Allende, Mexico. The site is bilingual (EN/ES) using `next-intl`.

This task has 4 parts:

1. **Expand `PRODUCT_CATEGORIES` in constants** to match the full catalog from countercultures.com.mx
2. **Build subcategory pages** at `/[locale]/shop/[category]/[subcategory]/page.tsx`
3. **Build product detail pages** at `/[locale]/shop/[category]/[slug]/page.tsx`
4. **Upgrade the navigation** to a mega-menu showing all subcategories per category

---

## Part 1: Update Constants & Data Layer

### 1A. Update `PRODUCT_CATEGORIES` in `app/lib/constants.ts`

Replace the current `PRODUCT_CATEGORIES` with this expanded version that matches countercultures.com.mx exactly:

```typescript
export const PRODUCT_CATEGORIES = {
  bathroom: {
    label: { en: "Bathroom", es: "Baño" },
    slug: "bathroom",
    subcategories: [
      { slug: "sinks", label: { en: "Sinks & Basins", es: "Lavabos" }, originalPath: "bano/lavabos" },
      { slug: "faucets", label: { en: "Faucets", es: "Grifos" }, originalPath: "bano/grifos" },
      { slug: "bathtubs", label: { en: "Bathtubs", es: "Bañeras" }, originalPath: "bano/baneras" },
      { slug: "tub-fillers", label: { en: "Tub Fillers", es: "Llenadores de Bañera" }, originalPath: "bano/llenador-de-banera" },
      { slug: "spa", label: { en: "Spa & Hydrotherapy", es: "Spa" }, originalPath: "bano/spa" },
      { slug: "toilets", label: { en: "Toilets & WASHLET", es: "Sanitarios" }, originalPath: "bano/sanitarios" },
      { slug: "showers", label: { en: "Showers & Shower Systems", es: "Regaderas y Duchas" }, originalPath: "bano/regaderasyduchas" },
      { slug: "accessories", label: { en: "Accessories", es: "Accesorios" }, originalPath: "bano/accesorios" },
      { slug: "drains", label: { en: "Drains", es: "Drenajes" }, originalPath: "bano/drenajes" },
      { slug: "valves", label: { en: "Valves", es: "Válvulas" }, originalPath: "bano/valvulas" },
    ],
  },
  kitchen: {
    label: { en: "Kitchen", es: "Cocina" },
    slug: "kitchen",
    subcategories: [
      { slug: "sinks", label: { en: "Sinks & Basins", es: "Tarjas y Fregaderos" }, originalPath: "cocina/tarjas-y-fregaderos" },
      { slug: "faucets", label: { en: "Faucets & Mixers", es: "Mezcladoras" }, originalPath: "cocina/mezcladoras" },
      { slug: "range-hoods", label: { en: "Range Hoods", es: "Campanas" }, originalPath: "cocina/campanas" },
      { slug: "appliances", label: { en: "Appliances", es: "Electrodomésticos" }, originalPath: "cocina/electrodomesticos" },
      { slug: "soap-dispensers", label: { en: "Soap Dispensers", es: "Dispensadores de Jabón" }, originalPath: "cocina/dispensador-de-jabon" },
      { slug: "water-dispensers", label: { en: "Water Dispensers", es: "Dispensadores de Agua" }, originalPath: "cocina/dispensador-de-agua" },
      { slug: "double-sinks", label: { en: "Double Sinks", es: "Tarja Doble" }, originalPath: "cocina/tarja-doble" },
      { slug: "pot-fillers", label: { en: "Pot Fillers", es: "Llenadores de Ollas" }, originalPath: "cocina/llenador-de-ollas" },
    ],
  },
  hardware: {
    label: { en: "Door Hardware", es: "Chapas y Herrajes" },
    slug: "hardware",
    subcategories: [
      { slug: "door-locks", label: { en: "Door Locks & Lock Sets", es: "Chapas" }, originalPath: "chapas-y-herrajes/chapas" },
      { slug: "deadbolts", label: { en: "Deadbolts", es: "Cerrojos" }, originalPath: "chapas-y-herrajes/cerrojos" },
      { slug: "pulls-hooks", label: { en: "Pulls, Handles & Hooks", es: "Jaladeras y Ganchos" }, originalPath: "chapas-y-herrajes/jaladeras-y-ganchos" },
    ],
  },
} as const;
```

### 1B. Update `BRANDS` array to include all brands from the existing site

```typescript
export const BRANDS = [
  { name: "Kohler", slug: "kohler" },
  { name: "TOTO", slug: "toto" },
  { name: "Brizo", slug: "brizo" },
  { name: "BLANCO", slug: "blanco" },
  { name: "California Faucets", slug: "california-faucets" },
  { name: "Sun Valley Bronze", slug: "sun-valley-bronze" },
  { name: "Emtek", slug: "emtek" },
  { name: "Badeloft", slug: "badeloft" },
  { name: "Banté", slug: "bante" },
  { name: "Mistoa", slug: "mistoa" },
  { name: "Villeroy & Boch", slug: "villeroy-boch" },
  { name: "AquaSpa", slug: "aquaspa" },
  { name: "Ebbe", slug: "ebbe" },
  { name: "Delta", slug: "delta" },
  { name: "ROHL", slug: "rohl" },
  { name: "Teka", slug: "teka" },
  { name: "SMEG", slug: "smeg" },
  { name: "Bluestar", slug: "bluestar" },
  { name: "Baldwin", slug: "baldwin" },
] as const;
```

### 1C. Expand `SAMPLE_PRODUCTS` with real product data

Add these products scraped from countercultures.com.mx to the existing `SAMPLE_PRODUCTS` array. Every product needs both `name` (Spanish) and `nameEn` (English), plus a `slug` field. Use the existing Product interface from `app/lib/types.ts`.

**BATHROOM — Sinks (25 products on existing site):**
Key products to add:
- Mistoa Surco ($7,500 MXN) — artisanal concrete, 10 colorways
- Mistoa Poas ($8,900 MXN) — artisanal organic form
- TOTO Aimes Undermount ($12,316 MXN) — CEFIONTECT glaze
- Badeloft copper vessel sinks ($3,278–$8,923 MXN)
- Counter Cultures Michelle polished copper vessel ($5,156 MXN) — artisanal

**BATHROOM — Faucets (28 products):**
- California Faucets: Christopher, Marimar, San Elijo, Steampunk Bay, Tiburón, Descanso, D-Street, Salinas (14 styles, $2,204–$58,985 MXN)
- Brizo: Rook, Siderna, Virage
- Artisan bronze waterfall faucets ($14,765 MXN)

**BATHROOM — Toilets (60+ products):**
- TOTO dominates: Connelly, Drake, Carlyle II
- Two-piece, one-piece, wall-hung models
- WASHLET bidet seats: S2, S5, S7, S7A, C2, C5 series ($13,177–$103,588 MXN)

**BATHROOM — Spa (12 products):**
- AquaSpa exclusively: Velas, Cabo, Neptuno, Fiji, Miami, Dubai, Falls, Octagon, Ocean, Heaven, Paradise, Jumbo ($133,565–$289,362 MXN)

**BATHROOM — Accessories (36 products):**
- California Faucets: toilet paper holders, towel bars 24" ($3,670–$12,345), coat hooks ($2,396–$10,359)
- Artisanal bronze hardware ($400–$12,345 MXN)

**BATHROOM — Drains (22 products):**
- Ebbe: Lattice, Quadra, Splash, Twister, Weave, Parallel, Bubbles, Tsunami, Frames ($428–$6,413 MXN)
- California Faucets StyleDrain: Neo, DecoSwirl, Wave, Fleur, Strathmore

**KITCHEN — Sinks (9 products):**
- Kohler Strive 24" ($17,726 MXN)
- BLANCO Ikon Silgranit 30" with apron ($39,341–$43,897 MXN)
- Kohler Brockway 36" wall-mounted ($44,919 MXN)
- Banté Tarja Duo ceramic ($22,870 MXN)
- Artisanal hammered brass island sink ($9,943 MXN)

**KITCHEN — Faucets (16 products):**
- California Faucets: Davoli, Poetto, Corsano, Descanso
- ROHL bridge faucets
- Brizo Litze ($28,500 MXN)
- Delta Trinsic, Edalyn ($4,225–$64,500 MXN)

**KITCHEN — Range Hoods (5 products):**
- Teka: GFH 73 ($8,199), DG 980 ($13,799), DEP 90/70 ($8,698)
- Decorative island hood with touch controls ($31,599 MXN)

**KITCHEN — Appliances (7 products):**
- Teka, Bluestar, SMEG gas ranges/cooktops/ovens ($13,698–$224,746 MXN)
- Teka plate warmers, coffee makers

**HARDWARE — Door Locks (50+ products):**
- Sun Valley Bronze dominates: Contemporary, Arch, Oval, Bevel Edge, Hampton, Mesa, Textures, Deco, Corduroy collections ($38,700–$76,100 MXN)
- Emtek knobs

**HARDWARE — Pulls & Hooks (60+ products):**
- Door knockers: Traditional, León, Diablo, Mano ($1,350–$2,300 MXN)
- Bronze hooks: Aro, Hex, Oval ($450–$680 MXN)
- Emtek: Laurent, Hammered Egg ($5,068 MXN)
- Finishes: Natural Bronze, Fine Black, Faded Black

> **IMPORTANT:** For products where we don't have real images yet, use themed Unsplash placeholders. Structure each product to match the existing `Product` interface in `app/lib/types.ts`. Every product MUST have both `name` (Spanish) and `nameEn` (English), a unique `slug`, and correct `category`/`subcategory` assignments.

---

## Part 2: Subcategory Pages

### Create `app/[locale]/shop/[category]/[subcategory]/page.tsx`

This is a **new route** for subcategory-level browsing (e.g., `/en/shop/bathroom/sinks`, `/en/shop/kitchen/faucets`).

**Requirements:**

1. **Server Component** — async, fetches products filtered by category + subcategory
2. **Validate both `category` and `subcategory`** against `PRODUCT_CATEGORIES`. Return `notFound()` if either is invalid
3. **Breadcrumb navigation**: Home → Shop → [Category] → [Subcategory]
4. **Hero section**: Use the existing `<CategoryHero>` component with subcategory-specific content
5. **Product grid**: Reuse `<ShopCatalog>` with products pre-filtered to the subcategory
6. **Sibling navigation**: Show pills/links to other subcategories in the same parent category (exactly like the current category page does, but with the current subcategory highlighted)
7. **SEO metadata**: Generate bilingual metadata with canonical URLs, alternates, OpenGraph
8. **Params are Promise-based** in Next.js 16: `const { category, subcategory, locale } = await params;`

**Subcategory meta data structure** — create a `subcategoryMeta` lookup (or generate dynamically from `PRODUCT_CATEGORIES`):

```typescript
// Example for bathroom/sinks
{
  heroEyebrow: "Bathroom Collection",
  heroTitle: { en: "Sinks & Basins", es: "Lavabos" },
  heroDescription: {
    en: "From hand-hammered copper vessels by Mexican artisans to TOTO's precision-engineered undermounts — every basin tells a story.",
    es: "Desde lavabos de cobre martillado a mano por artesanos mexicanos hasta los lavabos de precisión de TOTO — cada pieza cuenta una historia."
  },
  heroImage: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80"
}
```

**Write hero descriptions for ALL subcategories. Here are the descriptions to use:**

**Bathroom subcategories:**
- **Sinks**: "From hand-hammered copper vessels by Mexican artisans to TOTO's precision-engineered undermounts — every basin tells a story."
- **Faucets**: "California Faucets' 30+ artisan finishes, Brizo's industrial precision, and bronze cascades from local coppersmiths — find the perfect pour."
- **Bathtubs**: "Freestanding soakers by Badeloft, Japanese-depth TOTO designs, and custom stone vessels — the bathtub as sculpture."
- **Tub Fillers**: "Floor-mounted and wall-mounted tub fillers from California Faucets and Brizo — the finishing touch for your freestanding tub."
- **Spa**: "AquaSpa hydrotherapy systems — from intimate two-person tubs to grand outdoor installations with hydrojet massage technology."
- **Toilets**: "TOTO's WASHLET bidet technology, wall-hung designs, and water-saving engineering — the throne reimagined."
- **Showers**: "Complete shower systems, rain heads, hand showers, and body sprays from TOTO, California Faucets, and Brizo."
- **Accessories**: "Towel bars, robe hooks, toilet paper holders, and hardware accents in 30+ finishes — the details that complete the room."
- **Drains**: "Ebbe square drains and California Faucets decorative StyleDrain covers — because every detail matters."
- **Valves**: "Thermostatic valves, pressure-balancing cartridges, and diverter systems — the precision behind the performance."

**Kitchen subcategories:**
- **Sinks**: "BLANCO Silgranit apron sinks, Kohler stainless steel undermounts, and hand-forged copper basins — built to work as hard as you cook."
- **Faucets**: "Bridge faucets by California Faucets, pull-down designs from Brizo, and professional-grade mixers by ROHL and Delta."
- **Range Hoods**: "Teka German-engineered extraction and decorative island hoods — power and beauty above the cooktop."
- **Appliances**: "Professional ranges by Bluestar, SMEG retro ovens, and Teka built-in cooktops — equip your kitchen with the best."
- **Soap Dispensers**: "Built-in and deck-mounted soap dispensers to match your faucet finish — a clean, seamless countertop."
- **Water Dispensers**: "Hot and filtered water dispensers — instant boiling water at the point of use."
- **Double Sinks**: "Double-basin configurations for the working kitchen — prep and wash without compromise."
- **Pot Fillers**: "Wall-mounted pot fillers by California Faucets and Brizo — fill your stockpot right at the stove."

**Hardware subcategories:**
- **Door Locks**: "Hand-cast silicon bronze entry sets by Sun Valley Bronze and precision-machined Emtek designs — every entrance deserves its own character."
- **Deadbolts**: "Bronze and brass deadbolts to match your entry set — security that doesn't sacrifice style."
- **Pulls & Hooks**: "Door knockers, cabinet pulls, coat hooks, and robe hooks in hand-cast bronze and solid brass — the hardware that makes a home."

---

## Part 3: Product Detail Pages

### Create `app/[locale]/shop/[category]/[slug]/page.tsx`

Individual product pages at routes like `/en/shop/bathroom/mistoa-surco-basin`.

**Requirements:**

1. **Server Component** — fetches product by slug via `getProductBySlug(slug)`
2. **Return `notFound()`** if product doesn't exist
3. **Breadcrumb**: Home → Shop → [Category] → [Subcategory] → [Product Name]
4. **Product layout** — two-column on desktop:
   - **Left column (sticky)**: Product image gallery. Main image + thumbnail strip. If `images` array has multiple entries, allow clicking between them. Use `next/image` if possible, or `<img>` with lazy loading.
   - **Right column**: Product details:
     - Brand name (small, uppercase, terracotta color)
     - Product name (large, font-display)
     - Price in MXN with `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`
     - Trade price note: "Trade pricing available — apply for access"
     - Description (use `descriptionEn` or `description` based on locale)
     - **Finishes selector**: Show available finishes as color/text chips
     - **Specifications table**: If `specifications` exists, render as a clean key-value table
     - **Availability badge**: "In Stock", "Made to Order" (4-8 weeks), or "Special Order"
     - **Artisanal badge**: If `artisanal === true`, show "Handcrafted by Mexican Artisans" badge
     - **CTA buttons**:
       - "Inquire About This Piece" → opens WhatsApp with pre-filled message including product name and SKU
       - "Request Trade Pricing" → links to `/trade`
       - "Download Spec Sheet" → placeholder link
5. **Related products section** below: Show 4 products from the same subcategory (exclude current product)
6. **SEO**: Full metadata, JSON-LD Product schema, OpenGraph with product image

**Styling notes:**
- Use the existing brand design tokens: `font-display` for headings, `font-body` for text, brand colors (charcoal, terracotta, linen, stone, copper, sage, sand)
- Maintain the same elevated, gallery-like aesthetic as the rest of the site
- The product page should feel like a luxury showroom — generous whitespace, large images, restrained typography

---

## Part 4: Mega Navigation

### Update `app/components/layout/header.tsx`

Transform the current simple dropdown into a **mega-menu** that shows all subcategories when hovering/clicking a category.

**Current behavior:** Shop dropdown shows 3 links (Bathroom, Kitchen, Hardware).

**New behavior:** When "Shop" is hovered (desktop) or tapped (mobile):

**Desktop mega-menu layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  BATHROOM              KITCHEN              DOOR HARDWARE   │
│  ─────────             ───────              ─────────────   │
│  Sinks & Basins        Sinks & Basins       Door Locks      │
│  Faucets               Faucets & Mixers     Deadbolts       │
│  Bathtubs              Range Hoods          Pulls & Hooks   │
│  Tub Fillers           Appliances                           │
│  Spa & Hydrotherapy    Soap Dispensers      View All →      │
│  Toilets & WASHLET     Water Dispensers                     │
│  Showers               Double Sinks                         │
│  Accessories           Pot Fillers                          │
│  Drains                                                     │
│  Valves                View All →                           │
│                                                             │
│  View All →                                                 │
├─────────────────────────────────────────────────────────────┤
│  ✦ Featured: Artisanal Collection  →  Browse handcrafted... │
└─────────────────────────────────────────────────────────────┘
```

**Implementation details:**
- Full-width dropdown panel anchored below the header
- 3-column grid: one column per category
- Category name as column header (bold, font-display, small)
- Subcategory links below each header (font-body, text-sm)
- "View All →" link at bottom of each column links to `/shop/[category]`
- Bottom bar: Featured link to Artisanal Collection
- Animate with Framer Motion (existing dependency): fade in/slide down
- Background: white with `shadow-lg` and `border border-brand-stone/10`
- Hover state on subcategory links: `text-brand-terracotta` transition

**Mobile mega-menu:**
- When "Shop" is tapped, expand an accordion
- Show category headers (Bathroom, Kitchen, Hardware) as tappable rows
- Tapping a category expands its subcategory list below
- Each subcategory is a link
- "View All [Category]" at the bottom of each expanded section

**Generate links dynamically** from `PRODUCT_CATEGORIES` constant — do NOT hardcode subcategory links in the header. Loop over `Object.entries(PRODUCT_CATEGORIES)` so the nav updates automatically when categories change.

---

## Part 5: Update Translation Files

### Add to `app/messages/en.json`:

```json
{
  "shop": {
    "breadcrumbHome": "Home",
    "breadcrumbShop": "Shop",
    "allSubcategories": "All",
    "viewAll": "View All",
    "filters": "Filters",
    "noProducts": "No products found in this category.",
    "productCount": "{count} products",
    "megaNavFeatured": "Artisanal Collection",
    "megaNavFeaturedDesc": "Browse handcrafted pieces by Mexico's master artisans"
  },
  "product": {
    "inquire": "Inquire About This Piece",
    "tradePricing": "Request Trade Pricing",
    "specSheet": "Download Spec Sheet",
    "finishes": "Available Finishes",
    "specifications": "Specifications",
    "availability": "Availability",
    "inStock": "In Stock",
    "madeToOrder": "Made to Order (4-8 weeks)",
    "specialOrder": "Special Order",
    "artisanBadge": "Handcrafted by Mexican Artisans",
    "tradePriceNote": "Trade pricing available — apply for access",
    "relatedProducts": "You May Also Like",
    "whatsappMessage": "Hi, I'm interested in {product} (SKU: {sku}). Could you provide more information?"
  }
}
```

### Add equivalent keys to `app/messages/es.json`:

```json
{
  "shop": {
    "breadcrumbHome": "Inicio",
    "breadcrumbShop": "Tienda",
    "allSubcategories": "Todos",
    "viewAll": "Ver Todo",
    "filters": "Filtros",
    "noProducts": "No se encontraron productos en esta categoría.",
    "productCount": "{count} productos",
    "megaNavFeatured": "Colección Artesanal",
    "megaNavFeaturedDesc": "Explora piezas hechas a mano por los maestros artesanos de México"
  },
  "product": {
    "inquire": "Preguntar Sobre Esta Pieza",
    "tradePricing": "Solicitar Precio Profesional",
    "specSheet": "Descargar Ficha Técnica",
    "finishes": "Acabados Disponibles",
    "specifications": "Especificaciones",
    "availability": "Disponibilidad",
    "inStock": "En Stock",
    "madeToOrder": "Hecho a Pedido (4-8 semanas)",
    "specialOrder": "Pedido Especial",
    "artisanBadge": "Hecho a Mano por Artesanos Mexicanos",
    "tradePriceNote": "Precios profesionales disponibles — solicita acceso",
    "relatedProducts": "También Te Puede Interesar",
    "whatsappMessage": "Hola, me interesa {product} (SKU: {sku}). ¿Me pueden dar más información?"
  }
}
```

---

## File Structure After Implementation

```
app/
├── [locale]/
│   └── shop/
│       ├── page.tsx                          (existing — all products)
│       ├── shop-catalog.tsx                  (existing — filter/grid client component)
│       ├── [category]/
│       │   ├── page.tsx                      (existing — category landing, UPDATE subcategory pills to link to subcategory pages)
│       │   ├── [subcategory]/
│       │   │   └── page.tsx                  (NEW — subcategory page)
│       │   └── [slug]/
│       │       └── page.tsx                  (NEW — product detail page)
├── components/
│   ├── layout/
│   │   └── header.tsx                        (UPDATE — mega navigation)
│   ├── sections/
│   │   └── category-hero.tsx                 (existing — reuse for subcategory pages)
│   └── ui/
│       ├── product-card.tsx                  (existing — update link to use category/slug pattern)
│       ├── breadcrumb.tsx                    (NEW — reusable breadcrumb component)
│       ├── product-gallery.tsx               (NEW — image gallery for product detail)
│       ├── finish-selector.tsx               (NEW — finish/color chip selector)
│       └── availability-badge.tsx            (NEW — stock status badge)
├── lib/
│   ├── constants.ts                          (UPDATE — expanded categories, brands, products)
│   ├── types.ts                              (existing — Product interface already correct)
│   └── sheets.ts                             (UPDATE — add getProductsBySubcategory function)
```

---

## Important Implementation Notes

### Routing Disambiguation

Since `[subcategory]` and `[slug]` are sibling dynamic routes under `[category]`, you need to differentiate them. Options:

**Option A (Recommended):** Use a single `[...slug]` catch-all route:
```
app/[locale]/shop/[category]/[...slug]/page.tsx
```
Then inside the page, check if `slug[0]` matches a known subcategory or a product slug.

**Option B:** Use distinct path prefixes:
```
app/[locale]/shop/[category]/[subcategory]/page.tsx     → subcategory
app/[locale]/shop/[category]/p/[slug]/page.tsx           → product (prefixed with /p/)
```

**Option C:** Check against `PRODUCT_CATEGORIES` at render time to determine if the segment is a subcategory slug, and fall through to product lookup if not.

> Choose Option A or B. Option B is cleanest for SEO and avoids ambiguity.

### Product Card Links

Update `app/components/ui/product-card.tsx` to link to the correct product detail route. Currently it links to `/shop/[category]/[slug]` — update to match whichever routing option you chose above (e.g., `/shop/[category]/p/[slug]`).

### Data Fetching

Add a new function to `app/lib/sheets.ts`:

```typescript
export async function getProductsBySubcategory(
  category: string,
  subcategory: string
): Promise<Product[]> {
  return getProducts({ category, subcategory });
}
```

### Design Tokens (Already Configured)

Use these existing CSS custom properties / Tailwind classes:
- `font-display` → Cormorant Garamond (headings)
- `font-body` → DM Sans (body text)
- `font-mono` → JetBrains Mono (SKUs, technical)
- `bg-brand-linen` → #F5F0EB (page backgrounds)
- `bg-brand-charcoal` → #1A1A1A (dark sections)
- `text-brand-terracotta` → #C4725A (accents, hovers, CTAs)
- `text-brand-copper` → #B87333 (artisanal accents)
- `text-brand-sage` → #7A8B6F (secondary accents)
- `border-brand-stone/10` → #A89F91 at 10% (subtle borders)
- `text-brand-sand` → #D4C5A9 (muted text on dark)

### Existing Dependencies (Already Installed)
- `framer-motion` v12.38.0 — use for mega-menu animations and page transitions
- `lucide-react` — use for icons (ChevronRight for breadcrumbs, ExternalLink, Phone, etc.)
- `next-intl` v4.8.3 — all user-facing strings must use translation keys

---

## Quality Checklist

Before considering this task complete, verify:

- [ ] Every subcategory from countercultures.com.mx has a corresponding page in the rebuild
- [ ] Navigation mega-menu dynamically renders ALL subcategories per category
- [ ] Mobile nav accordion expands/collapses categories with subcategory links
- [ ] Subcategory pages show filtered products with correct breadcrumbs
- [ ] Product detail pages render with image, price, finishes, description, and CTAs
- [ ] All pages are bilingual (EN/ES) with proper locale switching
- [ ] SEO metadata (title, description, OpenGraph, canonical, alternates) on every page
- [ ] `next build` completes without errors
- [ ] Links from product cards navigate to correct product detail pages
- [ ] Breadcrumbs work and link correctly at every level
- [ ] The "View All" links in mega-nav go to the right category pages
- [ ] WhatsApp inquiry button generates correct pre-filled message with product name + SKU
