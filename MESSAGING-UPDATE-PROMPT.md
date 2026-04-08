# Claude Code Prompt: Counter Cultures Messaging Overhaul

Copy everything below this line and paste it into Claude Code as a single prompt.

---

## Task

You are updating the messaging across the Counter Cultures website — a premium kitchen, bath, and architectural hardware showroom in San Miguel de Allende, Mexico. The site is live at https://countercultures.netlify.app/en but fails the "10-second test": a visitor can't tell what the company does, where they are, or why they should care within 10 seconds of landing.

## The 10-Second Test Rule

Every page on this site must pass this test: **If someone lands on this page and has never heard of Counter Cultures, can they tell what this company does within 10 seconds?** The answer right now is no. Fix it.

## Who Counter Cultures Is

Before writing any copy, research Counter Cultures by:
1. Scraping https://countercultures.netlify.app/en (homepage, /brands, /shop, /our-story, /trade) to understand what's currently there
2. Search the web for competitors in the luxury kitchen & bath space in Mexico — particularly San Miguel de Allende and surrounding areas. Look at how competitors position themselves.
3. Search for "luxury kitchen bath showroom San Miguel de Allende" and similar queries to understand what the market looks like

**Core facts to weave into messaging:**
- Premium kitchen, bath, and architectural hardware showroom
- Located in Providencia, San Miguel de Allende, Guanajuato, Mexico
- Authorized dealer for 19+ international brands: Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, Emtek, Badeloft, Villeroy & Boch, and more
- Also carries Mexican artisan pieces (Mistoa, Banté, Santa Clara del Cobre copperwork)
- 491 products across bathroom fixtures, kitchen fixtures, and door/cabinet hardware
- Serves homeowners, architects, designers, and contractors
- Has a trade program with preferred pricing
- Quality over quantity — every piece is curated, not just stocked
- Bilingual service (English and Spanish)
- They source internationally and deliver locally — the customer doesn't have to figure out importing

## Messaging Principles

1. **Say what you are, repeatedly.** "Premium kitchen, bath & hardware" and "San Miguel de Allende" should appear on every page in some form.
2. **Say why you're different.** "Quality over quantity" / "Curated, not stocked" / "International brands + Mexican artisans" / "Authorized dealer"
3. **Say what happens next.** People want to know the process: browse → visit showroom → we order → we deliver. Include delivery language.
4. **Be specific.** "491 products from 19 brands" is better than "wide selection." "Authorized Kohler dealer" is better than "premium brands."
5. **Sound confident, not corporate.** Counter Cultures is a tastemaker, not a warehouse. The tone is premium but warm and approachable.

## Files to Update

### 1. Hero Carousel — `app/components/sections/hero.tsx`

This is the most critical fix. The current hero slides say things like "Smart Toilets" and "Shower Systems" — generic product category names that could be any website.

**What to change:** The `slides` array (lines 16-112) contains 5 `HeroSlide` objects, each with `eyebrow`, `title`, `subtitle`, and `cta` in `{ en: string; es: string }` format.

**Requirements:**
- Slide 1 MUST be a positioning slide, not a product slide. It should tell visitors what Counter Cultures is. Example direction:
  - Eyebrow: "San Miguel de Allende's Premier Showroom" / "El Showroom Premier de San Miguel de Allende"
  - Title: Something bold about premium kitchen & bath (NOT a product category name)
  - Subtitle: Should mention authorized dealer, international brands + Mexican artisans, the curated approach
  - CTA: "Explore the Collection" → /shop
- Slides 2-5 can remain product-focused BUT each subtitle should reinforce Counter Cultures' identity. Don't just describe the product — say WHY Counter Cultures carries it and that they're an authorized dealer. Example: "Authorized Brizo dealer in San Miguel de Allende. Premium faucets, sourced direct and delivered to your project."
- Every slide subtitle should include "San Miguel de Allende" or "Counter Cultures" at least once
- Spanish translations must be natural Mexican Spanish, not formal/Castilian

### 2. Brand Bar — `app/components/sections/brand-bar.tsx`

Currently says "Authorized Dealer" / "Distribuidor Autorizado". This is good but needs reinforcement.

**What to change:** Add a subline under the brand logos: "The only authorized dealer for these brands in San Miguel de Allende" / "El único distribuidor autorizado de estas marcas en San Miguel de Allende" (confirm if this is true — if not, say "Your authorized dealer in San Miguel de Allende")

### 3. Shop By Room/Category — `app/components/sections/shop-by-room.tsx`

**What to change:** The section title and description should reinforce what CC is. Not just "Shop by Category" but something like "Browse Our Collection — 491 premium pieces across kitchen, bath & hardware, available for order and delivery in Mexico."

### 4. Founder Story — `app/components/sections/founder-story.tsx`

**What to change:** The first line of the section should say what Counter Cultures IS before telling the founder story. "Counter Cultures is a premium kitchen, bath, and architectural hardware showroom in San Miguel de Allende." Then the story. The `content` object has `{ en: {...}, es: {...} }` format with bilingual strings.

### 5. Footer — `app/components/layout/footer.tsx`

**What to change:** Find the tagline line (currently "Curated in San Miguel de Allende, Mexico.") and make it more descriptive: "Premium kitchen, bath & architectural hardware — curated in San Miguel de Allende, Mexico." Also ensure the contact section shows the positioning clearly.

### 6. Constants — `app/lib/constants.ts`

**What to change:**
- `SITE_CONFIG.tagline` — currently "The Connected System" which is internal/technical language. Change to something customer-facing like "Premium Kitchen, Bath & Hardware" or "San Miguel's Premier Kitchen & Bath Showroom"
- `SITE_CONFIG.description` — currently decent ("San Miguel de Allende's premier bath and kitchen fixture destination...") but review and tighten
- `SITE_CONFIG.showroom.phone` — currently placeholder "+52 415 XXX XXXX". Leave as-is (Roger needs to provide the real number)

### 7. Trade Teaser — `app/components/sections/trade-teaser.tsx`

**What to change:** Add specificity. Mention that trade members get preferred pricing on 491+ products from 19 brands. Say "authorized dealer pricing" — this matters to architects and designers.

### 8. Contact CTA — `app/components/sections/contact-cta.tsx`

**What to change:** The CTA should tell people what happens when they reach out: "Tell us what you're looking for. We'll find it, quote it, and deliver it to your project." Add "San Miguel de Allende" and the showroom address prominently.

### 9. Newsletter Strip — `app/components/sections/newsletter-strip.tsx`

**What to change:** Add a value proposition for subscribing. Not just "Subscribe" but "New collections, design inspiration, and exclusive trade offers from San Miguel's premier kitchen & bath showroom."

### 10. Layout SEO — `app/[locale]/layout.tsx`

**What to change:** Review the metadata title and description. The title should include "Counter Cultures | Premium Kitchen, Bath & Hardware | San Miguel de Allende". The meta description should pass the 10-second test in text form.

## Important Rules

1. **All content must be bilingual.** Every English string needs a Spanish equivalent. Use natural Mexican Spanish.
2. **Match the existing code patterns.** Hero uses `{ en: string; es: string }` objects. Footer uses similar patterns. Don't change the architecture — just the words.
3. **ZERO layout changes.** Do NOT touch CSS, styling, spacing, grid structures, component hierarchy, or visual layout. Do NOT add new components or sections. Do NOT remove existing sections. Do NOT restructure anything. The only changes you make are **text replacements and text additions** inside existing elements. If a section currently has a title and description, you can change the words — you cannot add a new div, reorder elements, or change how they're displayed. This is purely a messaging/copy update.
4. **Additions and replacements only.** You may replace existing copy with better copy. You may add a subtitle or description line where one already exists but is empty or generic. You may NOT delete sections, rearrange the page order, or introduce new UI elements. If you think a section needs a new element (like a subline under the brand bar), only add it if there's already a pattern for it in the component — don't invent new markup.
5. **Don't invent features or make false claims.** Only say things that are true based on the site and the facts above.
6. **Read the CC-Messaging-Framework.md file in the project root** for the full messaging framework with phrase banks and page-by-page recommendations.
7. **Be specific over generic.** "491 products from 19 authorized brands" beats "wide selection of premium products" every time.
8. **After making all changes, run `npm run build`** to verify nothing is broken. Fix any TypeScript or build errors.
9. **Read the AGENTS.md file first** — it warns about Next.js 16 breaking changes. Check `node_modules/next/dist/docs/` if you encounter build issues.

## Success Criteria

After your changes, a stranger landing on ANY page of this site should be able to answer these questions within 10 seconds:
- What does this company sell? → Premium kitchen, bath & hardware
- Where are they? → San Miguel de Allende, Mexico
- Why should I care? → Authorized dealer, curated collection, international + artisan, they handle sourcing & delivery
- What do I do next? → Browse, visit showroom, or contact them

Go.
