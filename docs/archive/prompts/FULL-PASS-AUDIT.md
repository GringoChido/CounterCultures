# Counter Cultures — Full-Pass Audit & Cleanup

Run this prompt in Claude Code from the project root. Work through each section sequentially, fixing issues as you go. Commit after each major section.

**IMPORTANT**: Read `AGENTS.md` first. Before writing ANY Next.js code, check `node_modules/next/dist/docs/` for the correct API. This version has breaking changes from what you know.

---

## 1. BUILD & LINT HEALTH

**Goal**: Clean build, zero warnings, zero lint errors.

```
npm run build
npm run lint
```

- Fix every TypeScript error and lint warning
- Remove unused imports across all files
- Remove any `console.log` statements except in error handlers
- Fix the ESLint config if `npm run lint` throws a system error (may need to reinstall node_modules)
- Ensure `npm run build` completes with zero errors
- Check for and remove any dead code, unused components, or orphaned files

---

## 2. IMAGE OPTIMIZATION & CONNECTION

**Goal**: Every product image loads fast, uses next/image properly, and connects to the right product.

**Context**: 197 products are in the Google Sheet `Products!A2:R`. Column L (index 11) contains comma-separated Squarespace CDN image URLs. The site reads products via `app/lib/sheets.ts` → `getProducts()`.

Tasks:
- Verify `next.config.ts` has `images.squarespace-cdn.com` in `remotePatterns` (not just `domains` — Next.js 16 prefers remotePatterns)
- Audit every `<Image>` component usage across the app:
  - Must have explicit `width`/`height` OR use `fill` with a sized parent
  - Must have descriptive `alt` text (use product name, not empty string)
  - Must have appropriate `sizes` prop for responsive serving
  - Must use `priority` on above-the-fold hero images only
  - Must NOT use `loading="lazy"` on hero/LCP images
- Check that product detail pages (`app/[locale]/shop/[category]/p/[slug]/`) render ALL images from the `product.images` array (not just the first one)
- Check that product cards show the first image from the array
- Verify placeholder/fallback image behavior when a product has no images
- Remove any hardcoded Unsplash placeholder images in production components (keep only in sample/fallback data)
- Add `placeholder="blur"` with `blurDataURL` where possible for perceived performance

---

## 3. MOBILE RESPONSIVENESS

**Goal**: Every page works flawlessly on mobile (375px width minimum).

Tasks:
- Check every page at 375px, 640px, 768px, and 1024px breakpoints
- Verify the mobile hamburger menu opens/closes correctly and all links work
- Ensure no horizontal overflow or scroll on any page
- Check touch targets are minimum 44x44px (especially nav links, buttons, form inputs)
- Verify the product grid collapses properly: 1 col mobile → 2 col tablet → 3-4 col desktop
- Check that the hero section text doesn't overflow on small screens
- Verify the language toggle (EN/ES) is accessible and tappable on mobile
- Check that the footer stacks properly on mobile
- Test the contact form, trade application form, and newsletter signup on mobile
- Ensure the megamenu/dropdown navigation degrades gracefully on mobile
- Check that any horizontal scroll sections (brand bar, product carousels) work with touch/swipe

---

## 4. LANGUAGE TOGGLE & i18n

**Goal**: Seamless bilingual experience. Every string translated, no flicker on switch.

Tasks:
- Verify `app/messages/en.json` and `app/messages/es.json` have identical key structures (no missing keys in either language)
- Check that switching EN ↔ ES preserves the current page (e.g., `/en/shop/bathroom` → `/es/shop/bathroom`)
- Verify the language toggle button is visible and functional on both desktop and mobile
- Check that metadata (page titles, descriptions) update correctly per locale
- Ensure no English text leaks into the Spanish version or vice versa
- Verify that product names display in the correct language (Spanish names from Sheet column D, English from column E)
- Check `middleware.ts` handles locale detection properly and redirects correctly
- Verify `hreflang` alternate links in page metadata are correct
- Test that forms submit with the correct locale context

---

## 5. SEO AUDIT

**Goal**: Every page is optimized for search engines and AI answer engines.

Tasks:
- Verify every page has unique `<title>` and `<meta description>` (no duplicates)
- Check that all pages have proper `<h1>` → `<h2>` → `<h3>` heading hierarchy (only one H1 per page)
- Verify JSON-LD structured data on:
  - Homepage: Organization, LocalBusiness, FAQPage, WebSite with SearchAction
  - Product category pages: BreadcrumbList, ItemList
  - Product detail pages: Product schema with name, image, description, brand, offers
  - Contact page: ContactPage, LocalBusiness with ContactPoint
- Check `robots.ts` allows indexing on all public pages and blocks `/api/` and `/dashboard/`
- Verify `sitemap.ts` generates URLs for ALL public pages including:
  - Both locales (en/es)
  - All product category and subcategory pages
  - All brand pages
  - Static pages (about, contact, trade, etc.)
- Check that all images have descriptive `alt` attributes
- Verify canonical URLs are set correctly (no duplicate content between /en/ and /es/)
- Check for any orphan pages (pages not linked from navigation or sitemap)
- Ensure internal links use proper `<Link>` components (not raw `<a>` tags) for client-side navigation
- Verify Open Graph and Twitter Card metadata render correctly

---

## 6. AEO (AI Answer Engine Optimization)

**Goal**: Content is structured for AI engines (ChatGPT, Perplexity, Google AI Overviews).

Tasks:
- Verify `robots.ts` explicitly allows GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Anthropic-AI, cohere-ai
- Check that FAQ schema on the homepage has real, useful Q&A pairs (not filler)
- Add Speakable schema to key content pages if missing
- Ensure product pages have concise, factual descriptions that AI can extract (not just marketing fluff)
- Verify BreadcrumbList schema on all pages so AI understands site hierarchy
- Check that the `WebSite` schema SearchAction URL template is correct
- Add `about` and `mentions` properties to Organization schema where relevant
- Ensure key factual information (address, phone, hours, brands carried) is in structured data, not just body text

---

## 7. COPY EDITING — Seven Sweeps

**Goal**: Tighten all marketing copy across the site.

Read the copy-editing framework from the skill loaded above. Apply these specific fixes across `app/messages/en.json`, `app/messages/es.json`, and any hardcoded copy in components:

### Sweep 1 — Clarity
- Remove corporate jargon: replace "curated" (overused — appears 10+ times), "leverage," "utilize"
- Simplify long sentences in hero slides and testimonials
- Ensure every section has one clear message

### Sweep 2 — Voice & Tone
- Standardize formality level (premium but approachable, not stiff)
- Fix inconsistent title case ("Our Story" vs "our story")
- Standardize Oxford comma usage (pick one approach and stick to it)

### Sweep 3 — So What
- Every feature must connect to a benefit
- "Authorized dealer for 19 brands" → so what? → "Access to full catalogs, warranty support, and trade pricing you can't get elsewhere"
- "491 curated pieces" → either add context or remove the arbitrary number

### Sweep 4 — Prove It
- Replace vague claims with specifics
- "Thousands of satisfied customers" → use real numbers or remove
- Ensure testimonial has attribution (name, project type, location)

### Sweep 5 — Specificity
- Replace "hand-hammered copper basin" in at least 3 of its 5+ appearances with varied descriptions
- Replace vague form labels: "What can we help with?" → "How can Counter Cultures support your project?"
- Add specific numbers where possible (delivery timeframes, brand count, years in business)

### Sweep 6 — Emotion
- Hero copy should evoke aspiration, not just inform
- Trade program should evoke exclusivity and insider access
- Artisanal section should evoke craftsmanship and human connection

### Sweep 7 — Zero Risk
- Add trust signals near every CTA (authorized dealer badge, years in business)
- Ensure forms explain what happens after submission
- Add "No obligation" or similar near contact/quote request CTAs

### Additional Copy Fixes
- Standardize CTA button text across pages (pick consistent verbs: "Explore" vs "Browse" vs "Shop")
- Fix placeholder phone numbers in `app/lib/constants.ts` — replace "+52 415 XXX XXXX" with real numbers
- Create consistency in trade program benefit descriptions (currently 3 different versions across pages)
- Review Spanish copy for terminology consistency: standardize "sanitarios" vs "inodoros," "precio profesional" vs "precio trade"

---

## 8. PERFORMANCE QUICK WINS

Tasks:
- Add `fetchPriority="high"` to the hero/LCP image
- Ensure fonts use `display: "swap"` (already set — verify it's working)
- Check for any render-blocking resources
- Verify no unnecessary client-side JavaScript on static pages (check for "use client" directives that could be removed)
- Check bundle size — look for large dependencies that could be lazy-loaded

---

## 9. CLEANUP

Tasks:
- Remove `Contacts (1).zip` and `invoices.zip` from the project root (raw Odoo exports, not needed in repo)
- Remove any `.DS_Store` files
- Check `.gitignore` includes: `.env.local`, `.env*.local`, `*.zip`, `.DS_Store`
- Remove dead Odoo API routes IF the team confirms Odoo is fully deprecated (check with team first — for now, leave them but add a deprecation comment at the top of each file)
- Clean up any unused markdown files in the project root that aren't documentation (check if PROMPT-*.md files should be in `.claude/` instead of root)
- Verify `CLAUDE.md` and `AGENTS.md` are up to date

---

## 10. FINAL VERIFICATION

After all fixes:

```bash
npm run build    # Must complete with zero errors
npm run lint     # Must complete with zero warnings
```

- Run a Lighthouse audit (Performance, Accessibility, Best Practices, SEO) on:
  - Homepage (both /en and /es)
  - A product category page
  - A product detail page
  - Contact page
- Target scores: Performance 90+, Accessibility 95+, SEO 95+
- Fix any issues that come up

---

## COMMIT STRATEGY

Make separate commits for each section:
1. `fix: build and lint cleanup`
2. `fix: image optimization and product image connections`
3. `fix: mobile responsiveness improvements`
4. `fix: i18n language toggle and translation consistency`
5. `feat: SEO and AEO schema improvements`
6. `fix: copy editing — tighten marketing copy across all pages`
7. `chore: cleanup dead files and project hygiene`
