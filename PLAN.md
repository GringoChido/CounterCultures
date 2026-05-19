> **This file is now SECONDARY. Source of truth: MASTER-PLAN.md.**

# Roger 2026-05-12 Feedback Batch — Execution Plan

## Steps

### Step 4 — Cart copy + marketing opt-out (Roger R1 + R3)
- **Branch**: `claude/step-4-cart-copy-optout`
- **Status**: DONE — PR #41 (2026-05-12)
- **Files**: `app/[locale]/checkout/checkout-stepper.tsx`
- **Notes**: Step 3 (customer accounts) IS merged (PR #40). marketingOptIn persisted to Cart_Sessions contact JSON. TODO: wire to Customer record.

### Step 5 — PDP-only thumbnails relocation (Roger R5)
- **Branch**: `claude/step-5-pdp-only-thumbnails`
- **Status**: DONE — PR #42 (sha 5813637)
- **Files**: `app/[locale]/shop/catalog/catalog-view.tsx`, `app/[locale]/shop/[category]/p/[slug]/product-detail.tsx`

### Step 6 — Brand Partners 404 cleanup (Roger R7)
- **Branch**: `claude/step-6-brand-partners-404`
- **Status**: DONE — PR #43 (sha c6b2e3f)
- **Files**: `app/[locale]/brands/brands-grid.tsx`, `app/components/sections/category-brand-wall.tsx`, `app/components/layout/footer.tsx`, `app/lib/category-brand-index.ts`

### Step 7 — Search quick-look fix (Roger R6)
- **Branch**: `claude/step-7-search-quick-look`
- **Status**: DONE — PR #44 (sha 3af8dc7)
- **Files**: `app/[locale]/shop/catalog/catalog-view.tsx`, `app/[locale]/shop/catalog/product-drawer.tsx`
- **Decision**: Went with Option B (kill quick-look, navigate to PDP)

