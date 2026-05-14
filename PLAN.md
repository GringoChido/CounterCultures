# Roger 2026-05-12 Feedback Batch — Execution Plan

## Steps

### Step 4 — Cart copy + marketing opt-out (Roger R1 + R3)
- **Branch**: `claude/step-4-cart-copy-optout`
- **Status**: DONE — PR #41 (2026-05-12)
- **Files**: `app/[locale]/checkout/checkout-stepper.tsx`
- **Notes**: Step 3 (customer accounts) IS merged (PR #40). marketingOptIn persisted to Cart_Sessions contact JSON. TODO: wire to Customer record.

### Step 5 — PDP-only thumbnails relocation (Roger R5)
- **Branch**: `claude/step-5-pdp-only-thumbnails`
- **Status**: TODO
- **Files**: `app/[locale]/shop/catalog/catalog-view.tsx`, `app/[locale]/shop/[category]/p/[slug]/product-detail.tsx`

### Step 6 — Brand Partners 404 cleanup (Roger R7)
- **Branch**: `claude/step-6-brand-partners-404`
- **Status**: TODO
- **Files**: `app/[locale]/brands/brands-grid.tsx`, `app/components/sections/category-brand-wall.tsx`, `app/components/layout/footer.tsx`, `app/lib/category-brand-index.ts`

### Step 7 — Search quick-look fix (Roger R6)
- **Branch**: `claude/step-7-search-quicklook`
- **Status**: TODO
- **Files**: `app/[locale]/shop/catalog/catalog-view.tsx`, `app/[locale]/shop/catalog/product-drawer.tsx`
- **Decision**: Leaning Option B (kill quick-look, navigate to PDP)

### Step 10 — Project pricing alt-checkout (Roger R4)
- **Branch**: `claude/step-10-project-pricing`
- **Status**: BLOCKED
- **Block reason**: Steps 8 and 9 are not merged. No branches or commits found for either. Step 10 requires Steps 3, 8, and 9 all merged.

### Step 12 — Brand pages redesign (Roger R8)
- **Branch**: `claude/step-12-brand-pages-redesign`
- **Status**: BLOCKED
- **Block reason**: Step 11 (PDPs) not confirmed merged. No "Step 11" branch or tagged commit found. The existing PDP work (commit a083cc8) may or may not constitute Step 11.
