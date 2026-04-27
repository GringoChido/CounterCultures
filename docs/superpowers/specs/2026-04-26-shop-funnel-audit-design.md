# Phase 1 — Shop Funnel Audit & Fix Design

**Date:** 2026-04-26
**Scope:** `/shop` → `/shop/[category]` → `/shop/[category]/[subcategory]` → `/shop/[category]/p/[slug]` → `/shop/catalog` → `/shop/quote`
**Direction approved:** **C — Hybrid.** Category/subcategory pages should show both the showroom selection and full-catalog scale. The site must explicitly distinguish "Showroom Selection" from "Full Catalog" everywhere.
**Stance:** Brand framework rule → "Specific, never vague. Premium but approachable." Every page must pass the 10-second test (what / where / how / why-different).

---

## The architectural reality

CC has **two parallel inventory systems**:

| System | Source | Size | Detail level | User action |
|---|---|---|---|---|
| **Showroom Selection** | Sheets (`getProducts`) | ~200 hand-picked items | Full PDPs, finish options, photography | Visit showroom / order direct |
| **Full Catalog** | Sheets `Odoo_*` (`products-full`) | 354,449 items | Quote drawer only — no PDP | Request a quote, ships by special order |

Today's site **never names this distinction**. That's the root of most user confusion (and yours about the bathroom collection numbers). The fix is partly code, partly copy.

A second architectural fact: `ProductFull` (the 354k catalog) has `category` (bathroom/kitchen/hardware) but **no subcategory**. So we can show full-catalog *category* counts (32k bathroom, 28k kitchen, 4k hardware) but not subcategory counts (e.g. "4,200 sinks") without a data backfill.

---

## Audit findings — by page

Severity legend: 🔴 critical / 🟡 medium / 🟢 polish

### `/shop` (cleaned in last round)
- 🟢 No new issues. Hero subhead, Recently Specified, On the Floor — all on-brand from previous pass.

### `/shop/[category]` — e.g. `/shop/bathroom` 🔴

| ID | Issue | File | Severity |
|---|---|---|---|
| A | Subcategory cards count from showroom only (~5–20) instead of full catalog (thousands) | [page.tsx:133-149](app/[locale]/shop/[category]/page.tsx:133) | 🔴 |
| B | Hero label "{N} Curated Pieces · {M} Premium Brands" — vague, hides the catalog scale | [category-hero-client.tsx:62](app/[locale]/shop/[category]/category-hero-client.tsx:62) | 🔴 |
| C | Hero copy is florid purple prose, off-brand | [page.tsx:25-38](app/[locale]/shop/[category]/page.tsx:25) | 🟡 |
| D | "The Baño Collection" eyebrow in EN context — pick one language convention | [page.tsx:46-50](app/[locale]/shop/[category]/page.tsx:46) | 🟢 |
| E | Brand ribbon links to `/brands/[slug]` instead of `/brands/[slug]/[category]` (broken category context) | [brand-ribbon-client.tsx:37](app/[locale]/shop/[category]/brand-ribbon-client.tsx:37) | 🟡 |
| F | NO link/CTA into the full catalog — the page hides CC's primary differentiator | [page.tsx:190-230](app/[locale]/shop/[category]/page.tsx:190) | 🔴 |
| P | `CATEGORY_BRANDS` is hardcoded (10 slugs) — not derived from data; will rot | [page.tsx:52-56](app/[locale]/shop/[category]/page.tsx:52) | 🟡 |
| Q | No "How it works / 24h quote / 50% deposit" trust band — only on `/shop/catalog` | global | 🟡 |

### `/shop/[category]/[subcategory]` — e.g. `/shop/bathroom/sinks` 🟡

| ID | Issue | File | Severity |
|---|---|---|---|
| G | `<CategoryHero productCount={products.length}>` shows showroom count only | [page.tsx:168](app/[locale]/shop/[category]/[subcategory]/page.tsx:168) | 🔴 |
| H | Eyebrow `${catLabel} ${"Colección"}` produces broken Spanish "Baño Colección" | [page.tsx:165](app/[locale]/shop/[category]/[subcategory]/page.tsx:165) | 🟡 |
| I | No link to filtered full catalog (e.g. `/shop/catalog?category=bathroom&q=sink`) | [page.tsx](app/[locale]/shop/[category]/[subcategory]/page.tsx) | 🔴 |
| J | Catalog grid below hero shows only showroom items — feels thin after cinematic hero | [page.tsx:220](app/[locale]/shop/[category]/[subcategory]/page.tsx:220) | 🟡 |

### `/shop/[category]/p/[slug]` (PDP) 🟢

| ID | Issue | File | Severity |
|---|---|---|---|
| K | Cross-sells from showroom only — could include full-catalog same-brand variants | [page.tsx:73-83](app/[locale]/shop/[category]/p/[slug]/page.tsx:73) | 🟢 |
| L | PDPs only exist for showroom (~200), not 354k catalog. Not a bug but never explained in copy. | architecture | 🟡 |

### `/shop/catalog` 🟢

| ID | Issue | File | Severity |
|---|---|---|---|
| M | Subhead duplicates `/shop` subhead almost verbatim ("complete authorized catalog from every brand we carry") | [catalog/page.tsx:84-88](app/[locale]/shop/catalog/page.tsx:84) | 🟢 |
| N | Stat cards (24h response, 50% deposit) only here — should be a global trust band | [catalog/page.tsx:90-117](app/[locale]/shop/catalog/page.tsx:90) | 🟡 |

### `/shop/quote` ✓
- Pure redirect to `/shop/catalog`. No work needed.

### Cross-cutting

| ID | Issue | Severity |
|---|---|---|
| O | "Showroom Selection" vs "Full Catalog" never named consistently — root of confusion | 🔴 |

---

## Connection check (what links where)

✅ Working:
- Header → `/shop`
- `/shop` → category pages (subcategory grid)
- `/shop` → `/shop/catalog` (Open catalog CTA)
- Category page → subcategory page
- Subcategory page → PDP (showroom items)
- Brand ribbon → `/brands/[slug]` (works, but loses category context — Issue E)
- `/shop/quote` → `/shop/catalog` (redirect with query string)

❌ Missing:
- Category page → `/shop/catalog?category=X` (Issue F)
- Subcategory page → `/shop/catalog?category=X&q=keyword` (Issue I)

---

## Proposed fix plan — prioritized

### Tier 1 — Connection & data accuracy (the bug you flagged)

**Fix 1 — Surface full-catalog category count on category pages (A, B, F)**

[app/[locale]/shop/[category]/page.tsx](app/[locale]/shop/[category]/page.tsx):
- Import `getCategoryCounts()` from `products-full`
- Pass full-catalog count into `<CategoryCinematicHero>` as `catalogCount`

[app/[locale]/shop/[category]/category-hero-client.tsx](app/[locale]/shop/[category]/category-hero-client.tsx):
- Replace stat chip from "{N} Curated Pieces · {M} Premium Brands" → "{N} on the floor · {M} brands · {catalogCount.toLocaleString()} in the full catalog"
- Add a secondary CTA below "Explore the Collection": **"Search the full catalog →"** linking to `/shop/catalog?category=bathroom`

[app/[locale]/shop/[category]/page.tsx](app/[locale]/shop/[category]/page.tsx):
- Subcategory cards: keep showroom counts, but relabel chip from "{N} pieces" → "{N} on the floor" (specific, honest)
- Add an explanatory line above the grid: *"Hand-picked for the showroom. For deeper inventory in any category, search the full catalog."* with a link.

**Fix 2 — Subcategory page connection to full catalog (G, I)**

[app/[locale]/shop/[category]/[subcategory]/page.tsx](app/[locale]/shop/[category]/[subcategory]/page.tsx):
- After the `<CategoryHero>`, add a one-line "Search [subcategory] in the full catalog →" link to `/shop/catalog?category=X&q=<subcategory-keyword>`
- Subcategory keyword map (in constants): `sinks → sink`, `faucets → faucet`, `toilets → toilet`, etc. Empty pool falls back to `/shop/catalog?category=X`.
- Hero `productCount` chip relabel: "{N} on the floor"

**Fix 3 — Fix Spanish grammar in subcategory eyebrow (H)**

[app/[locale]/shop/[category]/[subcategory]/page.tsx:165](app/[locale]/shop/[category]/[subcategory]/page.tsx:165):
- Replace: `${catLabel} ${lang === "en" ? "Collection" : "Colección"}`
- With: `lang === "en" ? \`${catLabel} Collection\` : \`Colección de ${catLabel}\``

**Fix 4 — Brand ribbon links keep category context (E)**

[app/[locale]/shop/[category]/brand-ribbon-client.tsx](app/[locale]/shop/[category]/brand-ribbon-client.tsx):
- Update href to `/${locale}/brands/${slug}/${category}` (route already exists)
- Section title: "Trusted Brands" → "Brands in this category" (or keep "Trusted Brands" if you prefer)

### Tier 2 — Copy on-brand (the off-brand bits)

**Fix 5 — Tighten category hero copy (C, D)**

[app/[locale]/shop/[category]/page.tsx:25-50](app/[locale]/shop/[category]/page.tsx:25):

Bathroom (EN) — replace florid version with:
> *"From hand-hammered copper basins by San Miguel artisans to TOTO's WASHLET technology — every bathroom piece we carry, in one showroom."*

Kitchen (EN):
> *"BLANCO sinks, Brizo faucets, Bluestar ranges. Built for the way you actually cook."*

Hardware (EN):
> *"Sun Valley Bronze hand-cast hardware, Emtek precision, jaladeras forged in San Miguel. The first thing your guests touch."*

Each ~15–20 words. Specific brands, specific places, no purple prose.

Eyebrow convention: pick **English in EN, Spanish in ES**:
- EN: "Bathroom Collection" / "Kitchen Collection" / "Architectural Hardware"
- ES: "Colección de Baño" / "Colección de Cocina" / "Herrajes Arquitectónicos"

(Drops the cute "Baño Collection" mixed wording.)

**Fix 6 — Tighten /shop/catalog hero subhead (M)**

[app/[locale]/shop/catalog/page.tsx:84-88](app/[locale]/shop/catalog/page.tsx:84):
- Current: "The complete authorized catalog from every brand we carry, in one place: X brands, factory-direct pricing, and quotes returned within 24 hours — everything you need to specify your project with confidence."
- Tighten to: "Every authorized brand we carry, in one place. {brandCount} brands, factory-direct pricing, 24-hour quotes."

### Tier 3 — Trust signals & consistency

**Fix 7 — Lift "How it works / 24h / 50% deposit" into a reusable trust band (N, Q)**

Create `app/components/sections/how-it-works-band.tsx` with the three stat tiles currently embedded in `/shop/catalog`. Render on:
- `/shop/[category]` (between subcategory grid and brand ribbon)
- `/shop/[category]/[subcategory]` (above the grid)
- Keep on `/shop/catalog`

Brings the operational promise to every shop page.

**Fix 8 — Add an "About this catalog" tooltip / footnote on `/shop/catalog` (L, O)**

Below the catalog hero stat tiles, one line:
> *"Showroom items have full detail pages. All other catalog pieces ship by special order — request a quote, we order direct."*

Names the two-system architecture explicitly so users aren't confused.

### Tier 4 — Defer

- **Issue P** (hardcoded `CATEGORY_BRANDS` list) — works today; refactor later when adding new brands. Out of scope for this audit.
- **Issue J** (subcategory grid feels thin) — fixed by Fix 7's trust band + Fix 2's catalog link. No structural change needed.
- **Issue K** (PDP cross-sells from showroom only) — works fine for now; revisit if cross-sells start feeling repetitive.

---

## Out of scope for Phase 1

These belong to later phases:
- `/`, `/our-story`, `/showroom`, `/artisanal` — Phase 2 (Marketing)
- `/brands` and `/brands/[slug]` deep audit — Phase 2
- `/trade`, `/contact`, `/sales-delivery` — Phase 3
- `/blog`, `/insights`, `/resources`, `/projects` — Phase 4
- Header / footer review — Phase 4

I'm tempted to move `/brands/[slug]` into this phase since it's connected to the shop funnel via the brand ribbon. **Recommendation: leave brand pages in Phase 2** — they already do the catalog/showroom split correctly (per [brands/[slug]/page.tsx:124-128](app/[locale]/brands/[slug]/page.tsx:124)), so they're not bleeding the same bug.

---

## Self-review checklist

- ✅ No "TBD" / placeholder requirements
- ✅ Each fix names exact file paths and exact code locations
- ✅ Severity assigned to every finding
- ✅ Architectural reality (showroom vs full catalog, missing subcategory field) called out before fixes proposed
- ✅ Approved direction (C — Hybrid) referenced in every Tier 1 fix
- ✅ Out-of-scope items explicitly listed
- ✅ Internal consistency: no fix contradicts another. Tier 7 (trust band) doesn't conflict with Tier 1 (hero stat chip) — they show different info at different scales.
- ✅ Spanish grammar fix (Issue H) doesn't conflict with eyebrow convention fix (Fix 5).

---

## Approval gate

If this looks right, I'll:
1. Write a step-by-step **implementation plan** (one file at a time, exact code, test/verify between each).
2. Execute fixes in tier order: Tier 1 → Tier 2 → Tier 3.
3. Verify each tier in browser preview (EN + ES) before moving on.
4. **No commits until you say so** (per your no-auto-commit rule).

Push back on anything you disagree with — the copy proposals especially are easier to revise now than after I ship them.
