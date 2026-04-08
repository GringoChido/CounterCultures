# Counter Cultures — Project Brief & Operating Guide

**Client:** Counter Cultures (Roger) — San Miguel de Allende, Mexico
**Agency:** Untold Works (Joshua)
**Created:** April 3, 2026
**Status:** Active

---

## What We're Building

A fully connected digital platform for Counter Cultures — a premium kitchen, bath, and hardware showroom in San Miguel de Allende. The platform replaces disconnected tools (Squarespace, Odoo, WhatsApp threads, spreadsheets) with one integrated system: a custom website, an operations dashboard, and a Google Drive-powered CRM — all connected by AI.

**The core promise:** Roger opens one dashboard Monday morning and sees his leads, his money, his orders, and his content — without checking five different tools.

---

## Messaging Principle: The 10-Second Test

**If a visitor can't tell what Counter Cultures does within 10 seconds of landing on any page, the page isn't working.** Every page should reinforce: premium kitchen, bath & hardware — San Miguel de Allende — quality over quantity — we order and deliver.

This applies to the website, the dashboard, email templates, social posts, and any customer-facing copy. See the full Messaging Framework (CC-Messaging-Framework.md) for specific copy, page-by-page recommendations, and the delivery promise Roger needs to confirm.

**Key action:** Roger needs to provide delivery timelines by brand/category so we can add "Most orders delivered in X weeks" across the site. This is one of the biggest conversion gaps — people want to know how fast things happen.

---

## The Three Systems

### 1. The Website
Custom-built Next.js 16 + React 19 application, bilingual (EN/ES), hosted on Netlify Pro ($19/mo).

**What it does:** 20+ pages, 491 products with 1,019 images, filterable by brand/category/price/finish. Product configurator for variants. Brand showcase pages for all 19 brands. Blog for SEO content. AI chatbot (Claude Haiku) answers questions 24/7 in both languages and captures leads automatically.

**Lead capture paths:** WhatsApp button, contact forms, showroom booking, trade program application, AI chatbot auto-capture. Every path feeds the CRM.

**Live at:** countercultures.netlify.app (staging) → countercultures.com.mx (production)

### 2. The Dashboard
Roger's command center. One login, one screen.

**Six modules:** Sales & Leads (pipeline management), Finance & Payments (Stripe integration, margins, payouts), Content & Marketing (blog, social posting), Order Tracking (manufacturer → customer status), AI Assistant ("How did we do last month?"), Files & Documents (Google Drive browser).

### 3. Google Drive — The Data Layer
Google Sheets as CRM. Google Drive for file storage. The source of truth.

**Sheets tabs:** Products (491 items), Leads (all channels), Pipeline (active deals), Contacts (customer database, migrated from Odoo), Trade Applications, Newsletter, Bookings.

**Drive folders:** Product images by brand/category, invoices/quotes from Stripe, Master Price List (dealer costs, margins, MAP across 11 brands), contracts and manufacturer docs.

**Why Sheets:** Free, Roger already knows it, easy to view/edit manually, connects to everything via Google APIs.

---

## Technical Stack

| Component | Technology | Cost |
|---|---|---|
| Frontend | Next.js 16, React 19, App Router | — |
| Hosting | Netlify Pro | $19/mo |
| CRM/Database | Google Sheets + Drive API | Free |
| Payments | Stripe Mexico | 3.6% + $3 MXN/txn |
| AI (chatbot + assistant) | Anthropic Claude Haiku | ~$10-20/mo |
| Email | Resend | Free (up to 3k/mo) |
| Messaging | WhatsApp Business API | Free (business-initiated) |
| Social | Meta Graph API (IG + FB) | Free |
| Domain | countercultures.com.mx | ~$3/mo |
| **Total** | | **~$35-45/mo + Stripe fees** |

**Service account:** counter-cultures-website@counter-cultures-crm.iam.gserviceaccount.com

---

## Product Catalog

**491 products** scraped and structured across **11 brands** in the Master Price List.

**Master Price List fields:** Brand, SKU, Product Name, Category, Sub-Category, Collection, Finish, MSRP, MAP Price, Dealer Cost, Margin %, UPC, Status, Unit, Price Effective, Shipping Cost, Source File, Last Synced.

**Brands:** Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, Emtek, Badeloft, Bante, Mistoa, Villeroy & Boch + others (19 total on site).

**Categories:** Bathroom Fixtures, Kitchen Fixtures, Door & Cabinet Hardware.

**Inventory update flow:** Manufacturer sends update → AI parses changes (new SKUs, price changes, discontinuations) → flags in Sync_Log → Roger reviews + approves → Sheets updates → Website auto-refreshes. Manual: Roger approves. Automated: everything else.

---

## Key Processes (Automated vs. Manual)

### Sales: From Inquiry to Payment
- **AUTOMATED:** Lead capture from all channels → CRM, source tagging, notification to Roger
- **AUTOMATED:** AI chatbot qualifies leads 24/7, captures contact info
- **MANUAL:** Roger reviews leads, builds quotes, has conversations
- **AUTOMATED:** Stripe invoice generation, payment links, payment tracking
- **MANUAL:** Roger sends quote to customer, negotiates

### Finance: Following the Money
- **AUTOMATED:** Stripe payments recorded, payout tracking, margin calculation (MSRP - dealer cost)
- **AUTOMATED:** Dashboard shows real-time revenue, margins by brand/deal, overdue alerts
- **MANUAL:** Finance person pays manufacturers (dealer cost), reconciles bank statements
- **MANUAL:** Finance person reviews monthly P&L, flags discrepancies

### Fulfillment: From Order to Doorstep
- **AUTOMATED:** Order logged in pipeline, status tracking, customer notification templates
- **MANUAL:** Roger confirms order with manufacturer/dealer
- **MANUAL:** Roger updates tracking info when shipment ships
- **AUTOMATED:** WhatsApp status update sent to customer
- **MANUAL:** Coordinate delivery/handoff with customer
- **AUTOMATED:** 7-day post-delivery follow-up

### Inventory: Keeping 491 Products Current
- **AUTOMATED:** AI monitors manufacturer price lists for changes
- **AUTOMATED:** Flags new SKUs, price changes, discontinuations in Sync_Log
- **MANUAL:** Roger reviews flagged changes and approves
- **AUTOMATED:** Approved changes update Sheets → Website refreshes

---

## Discovery & Marketing Engine

**SEO:** Blog content targeting "luxury faucets San Miguel de Allende" and similar long-tail queries. Product pages optimized with structured data (Schema.org already implemented).

**AEO (AI Engine Optimization):** Content structured so AI assistants (ChatGPT, Claude, Perplexity) recommend Counter Cultures when asked about premium showrooms in Mexico.

**Social:** Instagram + Facebook posting from dashboard via Meta Graph API. Product spotlights, project showcases, brand stories.

**Newsletter:** Resend integration, free up to 3,000/mo. Sign-up form on site.

**Trade Program:** Application form for architects, designers, contractors. Dedicated /trade page.

---

## What the Site Needs Right Now (From Our Scan)

Based on a live audit of countercultures.netlify.app/en:

**Critical:**
1. Stock photography throughout — brand pages and many product cards use generic Unsplash images instead of real product shots
2. Product image duplication — some products share identical images (e.g., Badeloft bathtub images reused for copper vessels)
3. Phone number is placeholder (+52-415-XXX-XXXX)
4. Email domain inconsistency (info@countercultures.mx vs info@countercultures.com.mx)

**High Priority:**
5. Hero section messaging ("Smart Bathrooms / Smart Toilets") feels generic vs. brand voice elsewhere
6. Product specifications incomplete — many show $undefined
7. "Curated" appears 6+ times — effective once, formulaic after that
8. Contact form may be missing fields (name/email not visible in structure)

**Medium:**
9. Trade program section lacks specifics (no timeline/pricing examples)
10. Newsletter sign-up needs a value proposition (why subscribe?)
11. Project gallery uses stock photography — need real completed projects

---

## Phased Roadmap

### Phase 1: Data + Deploy (Weeks 1-2)
Extract Odoo data into Google Sheets CRM. Import Master Price List with confirmed dealer costs. Wire 491 products with pricing. Connect Google Workspace. Verify Stripe. Register WhatsApp Business. Roger walks the site and reviews copy/pricing. Deploy to countercultures.com.mx.

### Phase 2: Operations Live (Weeks 3-4)
Sales pipeline operational. Finance dashboard showing real margins. Order fulfillment pipeline active. AI chatbot trained on live catalog. WhatsApp Business API connected for customer messaging.

### Phase 3: Discovery + Growth (Weeks 5-6)
First 10 blog posts (bilingual, SEO + AEO). Instagram + Facebook connected. Trade program accepting applications. Newsletter via Resend. Replace stock images with real product photography.

### Phase 4: Automate + Compound (Weeks 7-8+)
AI handles first-response 24/7. Automated shipping notifications. Post-delivery follow-ups. Price change detection. Margin alerts. Weekly AI-generated business reports. SEO compounds over time.

---

## Roger's Responsibilities (Ongoing)

Once the platform is live, Roger's regular tasks:

**Daily (5-10 min):** Check dashboard for new leads, respond to inquiries, review any flagged orders.

**Weekly (30 min):** Review pipeline status, approve any inventory changes flagged by AI, check finance dashboard for overdue payments.

**Monthly (1-2 hours):** Review AI-generated business report, approve content calendar, check margin trends by brand.

**As needed:** Approve manufacturer quotes, update order tracking when shipments move, review and approve blog/social content.

---

## Monthly Cost Summary

~$35-45/month fixed + Stripe transaction fees (3.6% + $3 MXN per transaction).

**What this replaces:** Squarespace subscription, potential CRM subscription, potential email marketing tool, potential social scheduling tool. Net cost is likely lower than what Roger would pay for even one of those tools individually.

---

*This document is the operating guide for the Counter Cultures platform project. The companion spreadsheet (CC-Project-Roadmap.xlsx) contains the task-level tracker with owners, priorities, dependencies, and timelines.*
