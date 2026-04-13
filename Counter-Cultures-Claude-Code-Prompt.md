# Counter Cultures — The Connected System
## Master Claude Code Project Prompt

> Copy this entire document into Claude Code as your project kickoff prompt. It contains everything Claude needs to build the website and dashboard from zero.

---

## CLAUDE.md — Project Identity & Philosophy

```
You are building Counter Cultures — The Connected System.

This is not a template job. This is a luxury brand digital transformation for the premier bath and kitchen fixture destination in Mexico, located in San Miguel de Allende. Every pixel, every interaction, every line of code must feel like walking into a world-class showroom: warm, curated, confident, never loud.

PHILOSOPHY:
- Restraint over excess. Negative space IS the design.
- Every color traces back to something real in San Miguel — terracotta rooftops, copper basins, cantera stone, courtyard gardens.
- Products are shown in context, not floating on white. Atmosphere is everything.
- The site speaks to architects with precision and to homeowners with warmth. Never condescending. Think gallery owner, not department store clerk.
- Bilingual English/Spanish from day one. English primary, Spanish essential.
- Roger owns everything. Zero vendor lock-in. Zero monthly platform fees. The code, the data, the automations — all his.

DESIGN DNA (extracted from inspiration sites):
- Watermark Designs: Heritage storytelling, Brooklyn-craft narrative, dark overlays on hero imagery, teal/navy accents, Foundation grid, Designer Projects as editorial credibility
- Gessi: Cream/off-white (#efece8) backgrounds, DM Sans typography, 12-column grid, image-dominant (60-80% viewport), contextual storytelling through location/project prestige, hover scale 1.05x with ease-in-out, restraint = exclusivity
- deVOL Kitchens: "Simple Furniture, Beautifully Made" ethos, editorial case-study approach ("step inside"), lifestyle photography over product shots, price ranges anchor collections, progressive disclosure navigation
- Axor Design: Premium brand page architecture, designer collaboration storytelling, specification-grade product detail

Counter Cultures takes the BEST of all four: Gessi's atmospheric restraint, Watermark's craft narrative, deVOL's editorial storytelling, and Axor's product precision — filtered through the warmth and soul of San Miguel de Allende.
```

---

## PROJECT OVERVIEW

Build a complete custom digital system for Counter Cultures, a luxury bath and kitchen fixture showroom in San Miguel de Allende, Mexico. The system has TWO major deliverables:

**1. Public Website** — A Next.js (App Router) site with server-side rendering, deployed to Netlify. This replaces their current Squarespace site and must feel like a luxury editorial experience — atmospheric, warm, curated.

**2. Admin Dashboard / CRM** — A custom-built dashboard interface (Next.js) that reads/writes to Google Sheets via the Sheets API. This is where Roger (the owner) manages leads, pipeline, sales reps, products, WhatsApp conversations, and reporting. Think of it as a bespoke command center, not a generic SaaS tool.

**Data Layer:** Google Sheets API v4 (structured spreadsheets for leads, pipeline, products, contacts, sales metrics, content calendar). Google Drive for asset storage.

**Automation Layer:** n8n (self-hosted, open-source) for WhatsApp routing, email sequences, lead assignment, follow-up timers, content repurposing, review requests, appointment reminders, trade application processing, and weekly reporting.

---

## TECH STACK

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14+ (App Router, RSC) | Website + Dashboard, SSR for SEO |
| Styling | Tailwind CSS 3.4+ | Utility-first, custom design tokens |
| Animation | Framer Motion | Scroll-triggered reveals, page transitions, hover states |
| Data | Google Sheets API v4 | CRM data, product catalog, leads, metrics |
| Assets | Google Drive API | Images, documents, brand assets |
| Auth | NextAuth.js + Google OAuth | Dashboard login, role-based access |
| Email | Resend or SendGrid | Transactional + marketing email |
| WhatsApp | WhatsApp Business API | Primary sales channel |
| Automation | n8n (self-hosted) | Workflow automation |
| Hosting | Netlify | Edge deployment, automatic SSL, preview deploys |
| Analytics | GA4 + Custom Events | Traffic + lead action tracking |
| SEO | Built-in (JSON-LD, sitemap, hreflang) | Structured data on every page |
| Fonts | Cormorant Garamond + DM Sans + JetBrains Mono | Display / Body / Specs |

---

## BRAND DESIGN SYSTEM

### Color Palette — Every Color Has a Story

```javascript
// tailwind.config.js — extend colors
const colors = {
  brand: {
    charcoal:    '#1A1A1A', // Wrought iron gates, matte black hardware — headers, footers, structural weight
    terracotta:  '#C4725A', // SMA rooftops, clay workshops — PRIMARY accent, CTAs, warm moments
    copper:      '#B87333', // The copper basins they sell — supporting accent, hover states, artisanal details
    sage:        '#7A8B6F', // Courtyard gardens, prickly pear — secondary CTAs, success states
    stone:       '#A89F91', // Travertine, cantera, marble — secondary text, borders, quiet texture
    linen:       '#F5F0EB', // Raw cotton, plaster walls — backgrounds, cards. NEVER sterile white
    sand:        '#D4C5A9', // Desert, raw materials — optional soft tone for cards/sections
  }
}
```

### Typography System

```javascript
// Three-font hierarchy that signals "curated" not "generic"
const fonts = {
  display: ['Cormorant Garamond', 'serif'],     // Headlines — heritage, craft, permanence
  body:    ['DM Sans', 'sans-serif'],            // Body text — clean, modern, handles EN/ES well
  mono:    ['JetBrains Mono', 'monospace'],      // Specs, pricing, SKUs — "design specification" feel
}
```

**Type Scale (desktop):**
- Hero headlines: `text-6xl` to `text-8xl` (Cormorant Garamond, light weight)
- Section headlines: `text-4xl` to `text-5xl` (Cormorant Garamond)
- Subheadings: `text-xl` to `text-2xl` (DM Sans, medium)
- Body: `text-base` (DM Sans, regular, 1.6 line-height)
- Captions/specs: `text-sm` (JetBrains Mono)
- Generous letter-spacing on headlines: `tracking-wide` or custom `0.05em`

### Photography Direction

Three sources — no photoshoots required:
1. **Artlist** ($300 budget): Atmospheric San Miguel interiors, lifestyle imagery, warm natural light
2. **Brand Dealer Portals**: High-res product photography from Kohler, TOTO, Brizo, BLANCO, California Faucets
3. **Roger's Camera Roll**: Showroom photos and artisan process images, color-graded

**Style rule:** Natural light, warm tones, architectural context. Products in real interiors, not floating on white. Show what Counter Cultures products look like in the spaces people actually live in.

### Design Principles for Every Component

1. **Generous whitespace** — padding-y of `py-20` to `py-32` on sections. Let elements breathe.
2. **Warm backgrounds** — Use `brand-linen` (#F5F0EB) as the default, never pure white (#FFFFFF). Alternate with `brand-sand` for section rhythm.
3. **Subtle animations** — Fade-up on scroll (Framer Motion `y: 30, opacity: 0` → `y: 0, opacity: 1`). Image hover scale `1.05` with `ease-in-out` transition. Never bouncy or playful.
4. **Full-bleed imagery** — Heroes and key sections use edge-to-edge images with warm dark overlays for text readability.
5. **Asymmetric grids** — Not everything is centered. Use 40/60, 33/67 splits for editorial feel. deVOL and Watermark do this beautifully.
6. **Cursor and hover states** — Terracotta underline reveals on nav links. Copper glow on interactive elements. Image zoom on product cards.

---

## WEBSITE — SITE ARCHITECTURE

### Folder Structure

```
/app
  /(public)                    # Public website routes
    /page.tsx                  # Homepage
    /shop/page.tsx             # Product catalog with filters
    /shop/[category]/page.tsx  # Category pages (bathroom, kitchen, hardware)
    /shop/[category]/[slug]/page.tsx  # Product detail pages
    /brands/page.tsx           # All brands overview
    /brands/[slug]/page.tsx    # Individual brand pages (Kohler, TOTO, Brizo, etc.)
    /artisanal/page.tsx        # Handcrafted Mexican pieces — the competitive moat
    /trade/page.tsx            # Trade portal — biggest new revenue opportunity
    /our-story/page.tsx        # Founder narrative, artisan profiles
    /showroom/page.tsx         # Photos, map, hours, booking
    /projects/page.tsx         # Project gallery — completed installations
    /projects/[slug]/page.tsx  # Individual project case studies
    /blog/page.tsx             # Blog index — 3 tracks: Inspiration, Guides, Trade
    /blog/[slug]/page.tsx      # Individual blog posts
    /contact/page.tsx          # Phone, email, WhatsApp, inquiry form
  /(dashboard)                 # Protected dashboard routes
    /dashboard/page.tsx        # Overview / Home screen
    /dashboard/leads/page.tsx  # Lead management
    /dashboard/pipeline/page.tsx   # Pipeline / Deals (Kanban)
    /dashboard/reps/page.tsx       # Rep performance
    /dashboard/whatsapp/page.tsx   # Shared WhatsApp inbox
    /dashboard/products/page.tsx   # Product management
    /dashboard/reports/page.tsx    # Pre-built reports
    /dashboard/settings/page.tsx   # System settings, roles
  /api                         # API routes
    /api/sheets/route.ts       # Google Sheets read/write proxy
    /api/leads/route.ts        # Lead capture endpoint
    /api/whatsapp/route.ts     # WhatsApp webhook
    /api/auth/[...nextauth]/route.ts  # NextAuth Google OAuth
  /components
    /ui                        # Design system primitives
    /layout                    # Header, Footer, Navigation
    /sections                  # Page section components
    /dashboard                 # Dashboard-specific components
    /forms                     # Form components
  /lib
    /sheets.ts                 # Google Sheets API wrapper
    /drive.ts                  # Google Drive API wrapper
    /auth.ts                   # Auth configuration
    /seo.ts                    # SEO utilities (JSON-LD, meta)
    /constants.ts              # Brand tokens, site config
  /styles
    /globals.css               # Tailwind base + custom properties
```

---

### PAGE-BY-PAGE SPECIFICATIONS

#### HOMEPAGE — The First Impression

The homepage is the showroom entrance. It should feel like walking through a hand-carved wooden door into a beautifully lit courtyard.

**Sections (in order):**

1. **Hero** — Full-viewport atmospheric image (San Miguel interior or showroom) with warm dark overlay (`bg-black/30`). Cormorant Garamond headline in white, large and quiet: *"Where World-Class Design Meets the Soul of Mexican Craft"*. Subtle CTA: "Explore the Collection" with a scroll-down indicator animation. NO carousel — one powerful image that loads instantly.

2. **Brand Bar** — Horizontal scroll or grid of brand logos: Kohler, TOTO, Brizo, BLANCO, California Faucets. Grayscale by default, color on hover. Minimal, trust-building. Light background (`brand-linen`).

3. **Shop by Room** — Two large cards side-by-side (asymmetric: 55/45 split). "Bathroom" and "Kitchen". Atmospheric lifestyle images, not product grids. Hover reveals a warm overlay with "Explore →". This is the primary entry point into the product catalog.

4. **Founder Story Teaser** — Asymmetric layout: large atmospheric image (Roger in the showroom or an artisan at work) on one side, text block on the other. Short, warm copy introducing 20 years of expertise. CTA: "Read Our Story →"

5. **Artisanal Collection Spotlight** — Full-bleed image of a handcrafted copper basin or stone sink. Overlaid text: *"Handcrafted in Mexico. One Piece at a Time."* This is the competitive moat — no one else does this. CTA: "Discover Artisanal →"

6. **Project Gallery Preview** — Masonry or staggered grid of 4-6 completed installation photos. Credited to the architect/designer. Links to full project pages. Bridges B2C (inspiration) and B2B (recognition).

7. **Trade Program Teaser** — Clean card with sage green accent. "Are You a Design Professional?" Brief value prop (trade pricing, dedicated support, specification assistance). CTA: "Apply for Trade Access →"

8. **Instagram Feed** — Last 6-8 posts from @countercultures, pulled via API. Grid layout. Warm, lifestyle-focused content.

9. **Footer** — Deep charcoal background. Logo, navigation links, showroom address + map link, WhatsApp contact, newsletter signup. Social links. "© Counter Cultures. Curated in San Miguel de Allende." Bilingual language switcher.

#### SHOP / PRODUCT CATALOG

The single biggest UX upgrade over the current Squarespace site. This must feel like browsing a curated collection, not scrolling through a database.

- **Filter bar** (sticky on scroll): Brand, Finish, Price Range, Style, Room. Pill-style toggles, not dropdowns.
- **Product grid**: 3-column on desktop, 2 on tablet, 1 on mobile. Product cards show: hero image (hover to see alternate angle), brand name (small, stone gray), product name (DM Sans medium), price (JetBrains Mono), finish swatches (small circles).
- **Infinite scroll** or "Load More" — never pagination.
- **Quick View** — modal on card click with image gallery, key specs, and dual CTAs.
- Data sourced from Google Sheets Products tab via API.

#### PRODUCT DETAIL PAGE

- **Image Gallery**: 5+ images, main image with thumbnails below. Click to open lightbox. Show product in context (styled interior) AND isolated (studio shot).
- **Product Info**: Brand, name, model number, price (retail shown, trade price hidden behind login). Finish selector with visual swatches that update the main image.
- **Specifications Panel**: Collapsible, uses JetBrains Mono for spec data. Dimensions, material, installation type, warranty.
- **Dual CTAs**: Primary — "Add to Cart" (terracotta). Secondary — "Request a Quote" (outlined). WhatsApp quick link: "Have questions? Message us."
- **Cross-sells**: "Complete the Look" section with complementary products.
- **Reviews**: Customer reviews with star ratings.
- **JSON-LD**: Product schema on every PDP for rich search results.

#### TRADE PORTAL

The largest new revenue opportunity. This page converts architects, designers, and contractors into registered trade partners.

- **Value proposition** above the fold: Trade pricing, dedicated account manager, specification support, priority access to new collections.
- **Application form**: Company name, license/credentials, project portfolio, areas of focus. Submissions route to Google Sheets Trade Applications tab and trigger n8n automation.
- **Once approved**: Authenticated access to trade pricing, bulk ordering, project specification tools, downloadable product data.

#### ARTISANAL COLLECTION

The competitive moat. No other showroom in Mexico does this. This page must feel like a gallery exhibition.

- **Hero**: Full-bleed image of an artisan at work. *"Handcrafted by Mexico's Master Artisans"*
- **Artisan Profiles**: Photo, name, location, specialty, their story. Editorial format.
- **Product Gallery**: Each piece shown with its artisan, process photos, materials.
- **Commission Form**: "Commission a Custom Piece" — material, dimensions, inspiration images upload, timeline.

#### BRAND PAGES (Kohler, TOTO, Brizo, California Faucets, BLANCO)

Each brand gets its own SEO-optimized landing page. These target searches like "[brand] Mexico" and "[brand] San Miguel de Allende."

- Brand hero with logo and atmospheric imagery
- Brand story/philosophy
- Curated product grid (filtered to that brand)
- Why buy [Brand] from Counter Cultures (authorized dealer, local support, installation guidance)

#### OUR STORY

Magazine-profile format, not corporate bio. This is Roger's story.

- 20 years of expertise
- The intersection of international luxury and Mexican craft
- Artisan partnerships
- The showroom experience
- Visual storytelling with atmospheric photography

#### PROJECT GALLERY

Completed installations credited to the architect/designer. This bridges B2C (inspiration) and B2B (recognition).

- Filterable by room, style, brand
- Project case study pages: the space, the challenge, the products used, the architect/designer credited
- Links to every product featured

#### BLOG

Three content tracks, each with a contextual CTA:
1. **Design Inspiration** — Trend reports, room design ideas, color/material guides → CTA: Visit showroom
2. **Product Guides** — Comparison articles, buying guides, installation tips → CTA: Shop products
3. **Trade Insights** — Industry news, specification best practices, project showcases → CTA: Join trade program

Every post optimized for SEO and AEO (Answer Engine Optimization — structured for AI citation by ChatGPT, Perplexity, etc.).

---

### SEO & AEO ARCHITECTURE

Built into every page from day one:

```typescript
// Every page gets:
// 1. JSON-LD structured data (Organization, Product, LocalBusiness, FAQPage, BreadcrumbList)
// 2. Dynamic meta tags + Open Graph from product/content data
// 3. Bilingual routing with proper hreflang tags (en/es)
// 4. Automatic XML sitemap generation
// 5. Semantic HTML with proper heading hierarchy
// 6. FAQ sections structured for AI citation
// 7. Entity-rich product descriptions

// Five keyword clusters (EN + ES):
// 1. Branded: "Counter Cultures San Miguel", "Counter Cultures Mexico"
// 2. Product: "luxury bathroom fixtures Mexico", "griferías de lujo México"
// 3. Location: "bath showroom San Miguel de Allende", "tienda de baño San Miguel"
// 4. Trade: "wholesale bath fixtures Mexico", "fixtures for architects Mexico"
// 5. Artisan: "handcrafted copper sinks Mexico", "lavabos artesanales México"
```

---

## DASHBOARD / CRM — SPECIFICATIONS

The dashboard is protected behind Google OAuth. Role-based access: Owner (Roger), Manager, Sales Rep, Read-Only.

### Google Sheets Data Model

```
Spreadsheet: "Counter Cultures CRM"

Tab: Leads
Columns: lead_id | name | email | phone | source | status | assigned_rep | deal_value | created_date | last_contact | next_followup | notes

Tab: Pipeline
Columns: deal_id | lead_id | stage | products | quoted_value | quote_date | expected_close | win_loss_reason

Tab: Contacts
Columns: contact_id | name | email | phone | type | company | projects | trade_status | notes

Tab: Products
Columns: sku | brand | name | category | retail_price | trade_price | finishes | availability | image_url | page_url

Tab: Activity_Log
Columns: activity_id | lead_id | rep_id | type | timestamp | notes

Tab: Reps
Columns: rep_id | name | email | phone | whatsapp_number | active_leads | performance_score

Tab: Trade_Applications
Columns: app_id | contact_id | company | license_number | status | submitted_date | approved_date

Tab: Sales_Metrics
Columns: week | total_leads | total_contacted | total_closed | revenue | avg_deal_value | top_rep | top_product
```

### Dashboard Views

#### 1. Overview / Home Screen (Roger's Morning Coffee View)

The first thing Roger sees. Everything important at a glance:

- **KPI Cards** (top row): New leads this week (with trend arrow vs. last week), Leads contacted vs. needing follow-up, Pipeline value (total open quotes in MXN), Deals closed this week/month (count + value)
- **Overdue Follow-ups** (flagged in red): Rep name + lead name + days overdue. This is the accountability engine.
- **Trade Applications Pending** (if any)
- **Quick-action buttons**: View all leads, View pipeline, Send weekly report
- **Design**: Clean, card-based layout. Brand colors. Terracotta for alerts/urgency, sage for success, stone for neutral metrics. Cormorant Garamond for the dashboard title, DM Sans for everything else.

#### 2. Lead Management

Every lead in one filterable table:

- **Source tracking**: Website form, WhatsApp, walk-in, trade application, referral, phone call
- **Status pipeline**: New → Contacted → Quoted → Follow-Up → Closed Won / Closed Lost
- **Assigned rep** with reassignment capability
- **Contact history**: Timestamped log of every touchpoint
- **Lead score**: Automated based on engagement
- **Filters**: Date range, rep, source, status, deal value
- **Inline editing**: Click to edit any field, auto-saves to Google Sheets

#### 3. Pipeline / Deals (Kanban Board)

Visual drag-and-drop Kanban:

- **Columns**: New → Quoted → Negotiating → Closed Won / Closed Lost
- **Deal cards**: Customer name, products, value, last activity, assigned rep
- **Pipeline value by stage** (header of each column)
- **Aging alerts**: Visual indicator when deals stall too long
- **Win/loss tracking** with reason codes

#### 4. Rep Performance

- Leads assigned vs. contacted (response rate)
- Average response time
- Deals closed (count + value)
- Close rate (quoted → closed)
- Overdue follow-ups per rep
- Leaderboard view

#### 5. WhatsApp Inbox (Shared)

- All incoming messages visible to the team
- Messages auto-linked to lead records
- Quick-reply templates
- Round-robin assignment for new conversations
- Escalation: 30-minute unanswered → escalate to next rep

#### 6. Products & Inventory

- Product catalog with search and filters
- Edit products in the dashboard → changes sync to website
- Most-quoted products report

#### 7. Reporting

Pre-built, auto-updating reports:
- Weekly summary (leads, deals, revenue, top products, rep performance)
- Monthly overview (trends, MoM growth, pipeline health)
- Lead source attribution
- Product performance (most viewed, most quoted, best conversion)
- Trade program metrics

---

## n8n AUTOMATION WORKFLOWS

These are the automated workflows to configure in n8n:

1. **Lead Capture → CRM**: Website form / WhatsApp / trade app → auto-add to Leads sheet → assign rep → send confirmation
2. **WhatsApp Routing**: Incoming message → AI chatbot qualifies (budget, timeline, product interest) → route to right rep
3. **Quote Follow-Up**: Quote sent + 48hrs no response → automated follow-up via WhatsApp/email → notify rep in dashboard
4. **Content Repurposing**: 1 blog post → social posts (LinkedIn, Instagram, Facebook) + email newsletter snippet + WhatsApp broadcast
5. **Review Requests**: Sale completed + 7 days → WhatsApp review request with Google Review link
6. **Appointment Reminders**: Showroom visit booked → confirmation + 24hr reminder + 1hr reminder via WhatsApp
7. **Trade Application Processing**: New app → notify account manager → create contact record → send welcome message
8. **Weekly Report**: Every Monday AM → aggregate metrics → send summary to Roger via WhatsApp/email

---

## IMPLEMENTATION ORDER

Follow this sequence. Do not skip ahead.

### Phase 1: Foundation (Start Here)

1. **Initialize Next.js project** with App Router, TypeScript, Tailwind CSS, ESLint
2. **Configure Tailwind** with the full brand design system (colors, typography, spacing tokens)
3. **Build the component library**: Button, Card, Container, Section, Typography components with brand styling
4. **Set up layout**: Header with navigation (mega-menu style with collections/brands/rooms), Footer with full brand treatment
5. **Homepage**: Build all 9 sections as described above. This is the design proof — every subsequent page inherits this standard.

### Phase 2: Product Experience

6. **Google Sheets API integration**: Create the `/lib/sheets.ts` wrapper. Set up service account auth. Test read/write with the Products tab.
7. **Shop pages**: Category pages with filterable product grid, data from Sheets
8. **Product detail pages**: Full PDP with gallery, specs, dual CTAs, cross-sells
9. **Brand pages**: Template-driven, one per brand
10. **Artisanal collection**: Gallery + artisan profiles + commission form

### Phase 3: Content & Lead Capture

11. **Our Story, Showroom, Contact pages**
12. **Project Gallery**: Case study template with credited architect/designer
13. **Blog**: MDX or CMS-driven, 3-track content structure
14. **Trade Portal**: Application form → Sheets, authenticated trade pricing
15. **Lead capture forms**: All forms route to Google Sheets Leads tab

### Phase 4: Dashboard

16. **NextAuth.js setup**: Google OAuth, role-based access (Owner, Manager, Rep, Read-Only)
17. **Dashboard layout**: Sidebar nav, responsive, brand-styled
18. **Overview screen**: KPI cards, overdue alerts, quick actions
19. **Lead Management**: Table with filters, inline editing, contact history
20. **Pipeline Kanban**: Drag-and-drop board with deal cards
21. **Rep Performance**: Metrics dashboard with leaderboard
22. **WhatsApp Inbox**: Shared view with templates and assignment
23. **Products management**: CRUD interface synced to Sheets
24. **Reporting views**: Charts and pre-built report templates

### Phase 5: SEO, i18n & Polish

25. **SEO layer**: JSON-LD schemas on all pages, dynamic meta, sitemap, robots.txt
26. **Bilingual**: English/Spanish routing with hreflang tags
27. **Performance**: Image optimization (next/image, WebP, lazy loading), Core Web Vitals audit
28. **Animations**: Framer Motion scroll reveals, page transitions, hover states
29. **Accessibility**: WCAG 2.1 AA compliance, semantic HTML, keyboard navigation

### Phase 6: Automation & Deploy

30. **n8n instance setup**: Self-hosted, configure all 8 workflow automations
31. **WhatsApp Business API**: Connect, configure templates, webhook to dashboard
32. **Email integration**: Resend/SendGrid for transactional + marketing
33. **Deploy to Netlify**: Production environment, custom domain, SSL
34. **GA4 + custom event tracking**: Lead actions, product views, form submissions

---

## QUALITY STANDARDS

Every page must pass these checks:

- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 95
- [ ] Lighthouse SEO > 95
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] All images optimized (WebP, proper sizing, lazy loaded below fold)
- [ ] JSON-LD structured data validates (Google Rich Results Test)
- [ ] Responsive: tested at 375px, 768px, 1024px, 1440px, 1920px
- [ ] Bilingual: EN/ES content parity on all key pages
- [ ] Forms: all submissions verified in Google Sheets
- [ ] Dashboard: all CRUD operations work against Sheets API
- [ ] Animations: smooth 60fps, respects prefers-reduced-motion
- [ ] Typography: Cormorant Garamond loads for headlines, DM Sans for body, JetBrains Mono for specs

---

## VOICE & COPY GUIDELINES

**Tone**: Warm, expert, curated. The friend who happens to have impeccable taste.

**Headlines** (Cormorant Garamond, light): Evocative, not salesy. "Where World-Class Design Meets the Soul of Mexican Craft" not "Shop Our Products Now!"

**Body copy** (DM Sans): Clear, confident, conversational. Technical when addressing architects (specifications, finishes, lead times). Approachable when addressing homeowners (inspiration, lifestyle, design guidance).

**CTAs**: Invitational, not pushy. "Explore the Collection" / "Discover Artisanal" / "Begin Your Project" / "Visit the Showroom" — not "Buy Now" / "Shop Now" / "Get Started"

**Product descriptions**: Lead with the experience, not the specs. "The Brizo Litze collection brings industrial precision to the kitchen — exposed springs, articulating joints, and a bridge design that turns your sink into a statement" THEN follow with specifications.

**Never say**: "Click here", "Don't miss out", "Limited time", "Act now", "Best price guaranteed"

---

## CRITICAL REMINDERS

1. **Google Sheets is the database.** Every data operation reads from or writes to Sheets. The API wrapper in `/lib/sheets.ts` is the single source of truth.
2. **No sterile white.** The default background is `#F5F0EB` (Warm Linen). Pure white (#FFFFFF) should appear sparingly, if at all.
3. **Bilingual from day one.** Use next-intl or similar. Don't bolt on i18n later.
4. **Mobile-first.** San Miguel has a tourist population that shops on phones. WhatsApp is the primary sales channel. The mobile experience must be flawless.
5. **The Artisanal Collection is the moat.** No other showroom does this. Give it premium real estate on the homepage and its own dedicated section.
6. **The Trade Portal is the biggest revenue opportunity.** Make the application process frictionless and the authenticated experience valuable enough that architects specify Counter Cultures by default.
7. **Roger's Morning Coffee Test.** When Roger opens the dashboard at 8am with his coffee, he should see everything he needs in 10 seconds: new leads, overdue follow-ups, pipeline value, deals closed. If he has to click more than once to find a problem, the design has failed.
8. **Atmospheric imagery.** Use warm overlays, natural light, and real interiors. The site should feel like you can smell the coffee and hear the fountain in the courtyard.
9. **Deploy early, iterate often.** Working prototype by week 3. Don't wait for perfection — ship and refine.
10. **All files live in Google.** Code in GitHub, data in Google Sheets, assets in Google Drive. Roger's Google Workspace account is the center of gravity.

---

*Built by Untold Works · Network Systems — March 2026*
*"No more lost leads. No more guessing. No more invisible. One connected system — custom-built for Counter Cultures."*
