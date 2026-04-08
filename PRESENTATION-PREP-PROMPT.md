# Counter Cultures — Pre-Presentation Code Review & Polish

> **Context:** This project is being presented to the client TOMORROW. Everything must be tight, clean, and impressive. This is a Next.js 16 app with a public-facing e-commerce/showroom website AND an internal dashboard/CRM, deployed on Netlify. It uses `next-intl` for English/Spanish i18n, Tailwind v4, Framer Motion, and integrates with Google Sheets, Stripe, Odoo, and Resend.

---

## CRITICAL: Read Before Writing Any Code

Before touching ANY file, read `AGENTS.md` in the project root. This is NOT standard Next.js — it's Next.js 16 with breaking changes. Also read the relevant guide in `node_modules/next/dist/docs/` before modifying routing, layouts, or API routes. Heed all deprecation notices.

---

## 1. FULL CODE REVIEW & CLEANUP

Do a thorough pass across the entire codebase. The goal: nothing sloppy, nothing dead, nothing half-built when the client sees this.

### Dead Files & Duplicates
- **`app/layout 2.tsx`** exists alongside `app/layout.tsx` — this is a macOS duplicate. Delete it.
- **`app/brands/page.tsx`** and **`app/brands/[slug]/page.tsx`** exist OUTSIDE `[locale]/` — these appear to be pre-i18n leftovers. The real routes live at `app/[locale]/brands/`. Confirm they're unused and remove them.
- **`app/artisanal/`** (root-level) also duplicates `app/[locale]/artisanal/`. Same treatment — confirm and remove.
- **`app/shop/`** (root-level) duplicates `app/[locale]/shop/`. Confirm and remove.
- **`app/(public)/`** directory appears to be empty. Remove if unused.
- **`package-lock 2.json`** and **`package-lock 3.json`** — macOS duplicates of `package-lock.json`. Delete both.
- **`.~lock.CC-Project-Roadmap.xlsx#`** — LibreOffice lock file. Delete.
- **`.DS_Store`** — add to `.gitignore` if not already there, and remove from repo.
- Scan for any other `* 2.*` or `* 3.*` duplicate files anywhere in the project (common macOS copy artifacts).
- Look for any unused imports, commented-out code blocks, or `console.log` statements across all `.tsx` and `.ts` files. Remove them.
- Check `app/api/` routes — are there any that return placeholder/mock data or aren't wired up? Flag or clean them.

### Code Quality
- Run `npm run build` and fix ALL TypeScript errors and warnings. Zero tolerance — this must build clean.
- Run `npm run lint` and fix any ESLint issues.
- Check for any hardcoded English strings that should be in the i18n message files (see section 3).
- Look for inconsistent patterns: some components import from `@/app/lib/constants`, others may have inline data. Consolidate where practical.
- Verify all API route handlers have proper error handling (try/catch, appropriate status codes).

---

## 2. HEADER / NAV FIXES (HIGH PRIORITY)

### Logo Area — Top-Left
The current logo in `app/components/layout/header.tsx` renders:

```
Counter Cultures
THE CONNECTED SYSTEM
```

**"The Connected System" makes NO sense for this brand.** It's a fixtures showroom, not a tech company.

**Change the subtitle to:** `San Miguel de Allende, MX`

Keep the same two-line layout. The top line "Counter Cultures" stays as-is. The bottom line should read `San Miguel de Allende, MX` — but **fix the font and styling** of this subtitle:
- It currently uses `font-mono text-[9px] md:text-[10px] tracking-[0.2em] text-brand-stone uppercase`
- The monospace font (`JetBrains Mono`) feels wrong for a location line. Switch to `font-body` (DM Sans) or `font-display` (Cormorant Garamond) — whichever reads more elegantly at small sizes.
- Slightly increase size — `text-[10px] md:text-[11px]` — so it's legible but still delicate.
- Keep the `tracking-[0.2em] uppercase` treatment — that works.
- Color can stay `text-brand-stone` or shift to `text-brand-copper` — use your judgment on which pairs better.

### Mobile Nav
- Verify the mobile hamburger menu works smoothly on all breakpoints (320px, 375px, 414px, 768px).
- The mega-menu for Shop categories needs to be fully usable on mobile — no overflow, no cut-off text, no tiny tap targets.
- Language switcher (EN/ES) must be accessible in mobile nav, not just desktop.

---

## 3. EYEBROW TEXT STYLING (SITE-WIDE FIX)

Every section on the website uses "eyebrow" labels (small uppercase text above headings like "Our Story", "Featured", "Explore", "The Artisanal Collection", etc.). These ALL currently use:

```
font-mono text-xs uppercase tracking-[0.2em] text-brand-copper
```

**I do not like the font or color.** The monospace `JetBrains Mono` feels too techy/dev for this brand. Fix everywhere:

- **Font:** Change from `font-mono` to `font-body` (DM Sans). This is a design/lifestyle brand — the eyebrows should feel refined, not code-like.
- **Weight:** Add `font-semibold` or `font-medium` so the small text has enough presence without monospace.
- **Color:** Keep `text-brand-copper` OR try `text-brand-terracotta` — pick whichever gives better contrast against the linen background. Be consistent across ALL sections.
- **Tracking:** Keep `tracking-[0.2em] uppercase` — that part is good.

### Files to update (at minimum):
- `app/components/sections/hero.tsx` (line ~183)
- `app/components/sections/founder-story.tsx` (line ~47-48)
- `app/components/sections/shop-by-room.tsx` (line ~69-70)
- `app/components/sections/featured-products.tsx` (line ~120)
- `app/components/sections/testimonial.tsx` (line ~35)
- `app/components/sections/instagram-feed.tsx` (line ~20)
- `app/components/sections/category-hero.tsx` (lines ~43, ~76)
- `app/components/sections/brand-bar.tsx` (line ~17)
- Any other component using `font-mono` for eyebrow/label text

**Ideally, create a shared Eyebrow component** (or a Tailwind utility class) so this style is defined once and reused everywhere. Something like:

```tsx
const Eyebrow = ({ children, className = "" }) => (
  <span className={`font-body font-semibold text-xs uppercase tracking-[0.2em] text-brand-terracotta ${className}`}>
    {children}
  </span>
);
```

Add it to `app/components/ui/typography.tsx` alongside the existing `Heading`, `Subheading`, `Body`, and `Spec` exports. Then refactor all sections to use it.

---

## 4. i18n — ENGLISH & SPANISH COMPLETENESS

This site uses `next-intl` with message files at `app/messages/en.json` and `app/messages/es.json`.

### Website (Public Pages)
- Audit EVERY public page under `app/[locale]/` — confirm all user-facing strings go through `useTranslations()` or `getTranslations()`.
- Check for hardcoded English in components under `app/components/sections/` — several have inline English/Spanish objects instead of using the message files. These should be migrated to `en.json` / `es.json` for maintainability, OR at minimum verify every inline object has complete Spanish translations.
- Verify the footer (`app/components/layout/footer.tsx`) is fully translated.
- Verify all legal/policy pages (`privacy`, `returns-warranty`, `sales-delivery`, `payment-methods`) have Spanish versions.
- Check `app/[locale]/contact/`, `app/[locale]/trade/`, `app/[locale]/showroom/` for completeness.
- The location line "San Miguel de Allende, MX" in the header does NOT need translation — it's a proper noun.

### Dashboard
- The dashboard at `app/(dashboard)/` is internal-facing but the CLIENT will see it tomorrow.
- Check sidebar labels, page headers, form labels, button text, table headers, status badges — are they all presentable?
- If the dashboard has any half-finished UI or placeholder text like "Coming Soon" or "TODO", either finish it or hide the nav item.
- Dashboard does NOT need Spanish translation (it's an internal tool), but it should be consistent in English.

---

## 5. MOBILE RESPONSIVENESS (VERY HIGH PRIORITY)

The client WILL look at this on their phone. Every page must be flawless on mobile.

### Test at these breakpoints: 320px, 375px, 414px, 768px, 1024px

### Public Website — Check Each:
- **Homepage** (`app/[locale]/page.tsx`): Hero section, brand bar, shop-by-room grid, featured products, founder story, artisanal spotlight, testimonials, instagram feed, newsletter strip, contact CTA, footer
- **Shop pages**: Catalog grid should be 1-col on mobile, 2-col on tablet. Filter bar must be usable (slide-out or collapsible, not overlapping content). Product cards must not overflow.
- **Product detail pages**: Image gallery, specs, pricing — all must stack cleanly on mobile.
- **Blog/Insights pages**: Content width, image sizing, readability.
- **Contact, Trade, Showroom pages**: Forms must be touch-friendly (min 44px tap targets), inputs full-width on mobile.
- **Legal pages** (privacy, returns, etc.): Text must be readable, not edge-to-edge with no padding.

### Dashboard — Check Each:
- **Sidebar**: Must collapse properly on mobile. Hamburger toggle must work. No content hidden behind sidebar.
- **Data tables**: Must be horizontally scrollable on mobile, not breaking layout.
- **KPI cards**: Should stack vertically on mobile (1 per row), not overflow horizontally.
- **Charts** (Recharts): Must be responsive — use `ResponsiveContainer` everywhere.
- **Modals/Slide-outs**: Must be full-screen or near-full on mobile, not tiny centered popups.
- **Forms in dashboard**: All inputs, selects, textareas must be full-width on mobile.

### General Mobile Fixes:
- No horizontal scroll on any page (check for elements with fixed widths or `overflow-x` issues).
- All images should use `object-fit: cover` and proper aspect ratios — no stretched images.
- Touch targets minimum 44x44px for all interactive elements.
- Text should never be smaller than 14px on mobile for body copy, 12px for secondary text.
- Padding: minimum `px-4` on mobile for all content containers.

---

## 6. VISUAL POLISH & CONSISTENCY

- Verify all Google Fonts are loading: `Cormorant Garamond` (display), `DM Sans` (body), `JetBrains Mono` (mono/specs only).
- Check that the brand color palette is used consistently — no rogue hex values outside the theme defined in `globals.css`.
- Animations (Framer Motion): Verify they don't cause layout shift or janky scroll on mobile. If any animation is glitchy, reduce or remove it.
- Images: Check that placeholder/sample images look professional. If any are broken `src` paths or ugly placeholders, fix or replace with appropriate stock.
- Loading states: Pages that fetch data (shop, dashboard) should show skeleton loaders or spinners, not blank screens.

---

## 7. BUILD & DEPLOY VERIFICATION

After ALL changes:

1. Run `npm run build` — must complete with ZERO errors.
2. Run `npm run lint` — must pass clean.
3. Test the dev server (`npm run dev`) and manually verify:
   - Homepage loads in both `/en` and `/es`
   - Navigate through Shop > Category > Product detail
   - Dashboard loads at `/dashboard`
   - Mobile responsive at 375px width
4. Check `netlify.toml` for any deployment issues.

---

## PRIORITY ORDER

If time is limited, work in this order:
1. **Build must pass** — fix any breaking errors first
2. **Header logo fix** — "San Miguel de Allende, MX" (most visible)
3. **Eyebrow styling** — site-wide font/color fix
4. **Mobile responsiveness** — critical for client demo
5. **Dead file cleanup** — remove duplicates and cruft
6. **i18n audit** — ensure Spanish is complete
7. **Visual polish** — final details

---

*This is a client presentation tomorrow. Quality over speed, but get it done. Make it beautiful.*
