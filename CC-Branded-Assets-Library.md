# Counter Cultures — Branded Assets & Document Library

**Purpose:** Every document that leaves Counter Cultures — to a customer, a vendor, a partner, or the public — should look like it came from the same company. This is the master list of every outgoing branded asset we need to create, where it lives, and where it shows up in the workflow.

---

## Google Drive Folder Structure

```
Counter Cultures (root)/
├── Brand Kit/
│   ├── Logos/                    (logo variations: full, icon, dark bg, light bg, EN, ES)
│   ├── Fonts/                    (Cormorant, DM Sans, JetBrains Mono files)
│   ├── Color Palette/            (hex codes, RGB, CMYK reference sheet)
│   ├── Brand Guidelines.pdf      (one-pager with logo usage, colors, typography rules)
│   └── Templates/                (master copies of every template below)
│
├── Sales/
│   ├── Quotes/                   (generated per customer: CC-Q-2026-001.pdf)
│   ├── Invoices/                 (from Stripe, branded: CC-INV-2026-001.pdf)
│   ├── Proposals/                (project proposals for large jobs)
│   └── Trade Agreements/         (signed trade program contracts)
│
├── Finance/
│   ├── Purchase Orders/          (outgoing POs to manufacturers)
│   ├── Payout Records/           (manufacturer payment confirmations)
│   └── Monthly Reports/          (auto-generated P&L summaries)
│
├── Marketing/
│   ├── Blog Posts/               (drafts + published versions)
│   ├── Social Media/             (post images, captions, scheduling docs)
│   ├── Email Campaigns/          (newsletter HTML + content docs)
│   ├── Press/                    (press releases, media kit)
│   └── Photography/              (product shots, showroom photos, project photos)
│
├── Customer Documents/
│   ├── Welcome Packets/          (new customer onboarding info)
│   ├── Delivery Confirmations/   (per-order delivery receipts)
│   ├── Warranty Cards/           (brand warranty info per product)
│   └── Care Guides/              (product maintenance instructions)
│
├── Trade Program/
│   ├── Trade Applications/       (received applications)
│   ├── Trade Welcome Kit/        (approved member packet)
│   └── Trade Price Sheets/       (dealer pricing by brand)
│
├── Products/
│   ├── Product Images/           (organized by brand/category)
│   ├── Spec Sheets/              (manufacturer spec PDFs)
│   └── Master Price List.xlsx    (the single source of truth)
│
└── Internal/
    ├── SOPs/                     (standard operating procedures)
    ├── Training/                 (dashboard training docs, videos)
    └── Vendor Contacts/          (manufacturer rep info)
```

---

## Branded Assets — Full Inventory

### Sales Process Assets

| Asset | When It's Used | Where It Lives | Created By | Branded Elements |
|---|---|---|---|---|
| **Quote / Estimate** | Customer requests pricing on specific products | Drive: Sales/Quotes + Dashboard: generates from pipeline | Dashboard auto-generates, Roger reviews | Logo, colors, showroom address, terms, product images from catalog |
| **Invoice** | Customer is ready to pay | Stripe generates → Drive: Sales/Invoices + Dashboard: Finance module | Stripe (branded template) | Logo, company info, payment terms, bank details, Stripe link |
| **Payment Receipt** | After payment clears | Stripe auto-sends → copy to Drive | Stripe (automated) | Logo, transaction details, "Thank you" messaging |
| **Proposal / Project Brief** | Large projects (full kitchen, full bath, multi-room) | Drive: Sales/Proposals + Dashboard: attached to pipeline deal | Untold Works creates template, Roger customizes | Logo, project scope, product selections with images, timeline, pricing, terms |
| **Trade Program Agreement** | Architect/designer joins trade program | Drive: Trade Program/ + Dashboard: Trade module | Template in Drive, signed digitally | Logo, terms, discount tiers, authorized brands, contact info |

### Customer Communication Assets

| Asset | When It's Used | Where It Lives | Created By | Branded Elements |
|---|---|---|---|---|
| **Welcome Email** | New lead or customer first contact | Resend template → triggered from Dashboard | Automated (Resend) | Logo, "Welcome to Counter Cultures," showroom info, what to expect next |
| **Quote Follow-Up Email** | 3 days after quote sent, no response | Resend template → triggered from Dashboard | Automated | Logo, quote summary, CTA to schedule showroom visit or WhatsApp |
| **Order Confirmation Email** | Customer pays, order is placed | Resend template → triggered by Stripe payment | Automated | Logo, order details, products ordered, estimated delivery, "what happens next" |
| **Shipping Update Email** | Order ships from manufacturer | Resend template → triggered from Dashboard order tracking | Automated | Logo, tracking info, estimated arrival, WhatsApp link for questions |
| **Delivery Confirmation Email** | Order delivered to customer | Resend template → triggered from Dashboard | Automated | Logo, delivery details, care instructions link, review request |
| **Post-Delivery Follow-Up** | 7 days after delivery | Resend template → automated | Automated | Logo, "How's everything?" check-in, support contact, review request |
| **WhatsApp Message Templates** | Various touchpoints (quote ready, order shipped, delivery scheduled) | Dashboard: WhatsApp module (pre-approved templates) | Templates in Dashboard | CC name, professional tone, bilingual options |

### Marketing & Content Assets

| Asset | When It's Used | Where It Lives | Created By | Branded Elements |
|---|---|---|---|---|
| **Blog Post Template** | Every blog post published | Dashboard: Content module → Website | Dashboard (write + publish) | Site header/footer, author byline, CC branding, social share buttons |
| **Newsletter Template** | Monthly or bi-weekly email blast | Resend template + Drive: Marketing/Email Campaigns | Dashboard triggers, Resend sends | Logo header, footer with showroom info + social links, unsubscribe, brand colors |
| **Social Media Post Templates** | Instagram, Facebook posts | Dashboard: Content module → Meta API | Dashboard (compose + post) | Logo watermark on images, consistent caption format, hashtag set |
| **Instagram Story Templates** | Product spotlights, behind-the-scenes, new arrivals | Drive: Marketing/Social Media | Created in Canva or similar, posted via Dashboard | Logo, brand colors, fonts, "Swipe up" CTAs |
| **Project Showcase Template** | Completed installation features | Dashboard: Content module → Website + Social | Dashboard | Before/after layout, architect credit, product tags, CC branding |
| **Press Release Template** | New brand partnerships, showroom events, milestones | Drive: Marketing/Press | Untold Works creates | Letterhead, logo, boilerplate "About Counter Cultures" paragraph |
| **Media Kit** | Press, partnerships, trade show materials | Drive: Marketing/Press | Untold Works creates (update annually) | Logo variations, brand story, key stats, showroom photos, founder bio |

### Finance & Operations Assets

| Asset | When It's Used | Where It Lives | Created By | Branded Elements |
|---|---|---|---|---|
| **Purchase Order to Manufacturer** | Roger orders products from dealer/manufacturer | Drive: Finance/Purchase Orders + Dashboard: Order module | Dashboard generates from deal | CC logo + address, PO number, product details with SKU, dealer pricing, delivery address |
| **Monthly Financial Report** | End of month review | Drive: Finance/Monthly Reports + Dashboard: Finance module | AI auto-generates from Dashboard | CC header, revenue summary, margins by brand, top products, payouts, charts |
| **Weekly Business Summary** | Monday morning email to Roger | Dashboard: AI generates → Email to Roger | Automated (AI) | CC header, leads/deals/revenue/deliveries snapshot, action items |
| **Packing Slip / Delivery Receipt** | Included with delivered products | Drive: Customer Documents/Delivery Confirmations | Dashboard generates when delivery marked complete | Logo, order number, items delivered, customer signature line, care guide QR code |

### Trade Program Assets

| Asset | When It's Used | Where It Lives | Created By | Branded Elements |
|---|---|---|---|---|
| **Trade Welcome Kit (PDF)** | New trade member approved | Drive: Trade Program/Trade Welcome Kit → emailed via Resend | Template in Drive | Logo, welcome letter, how to order, discount structure, dedicated contact, brand catalog overview |
| **Trade Price Sheet (per brand)** | Trade members request pricing | Drive: Trade Program/Trade Price Sheets | Generated from Master Price List | CC header, brand logo, dealer/trade pricing, MAP notes, effective date |
| **Trade Newsletter** | Quarterly update to trade members | Resend template + Drive: Marketing/Email Campaigns | Dashboard composes, Resend sends | Logo, new products, project spotlights, trade-exclusive offers |

### Brand Foundation Assets (Create First)

| Asset | Priority | Where It Lives | Notes |
|---|---|---|---|
| **Logo Package** | Critical — Week 1 | Drive: Brand Kit/Logos | Full logo, icon only, white version, dark version. SVG + PNG. EN + ES if tagline included. |
| **Brand Color Reference** | Critical — Week 1 | Drive: Brand Kit/Color Palette | Dark Botanical palette: hex, RGB, CMYK for print. Background, card, text, accent colors. |
| **Typography Reference** | Critical — Week 1 | Drive: Brand Kit/Fonts | Cormorant (display), DM Sans (body), JetBrains Mono (labels). License files. Usage rules. |
| **Brand Guidelines One-Pager** | High — Week 2 | Drive: Brand Kit/ | Logo usage, minimum sizes, clear space, colors, fonts, tone of voice summary. Enough for a vendor or partner to stay on-brand. |
| **Email Signature** | High — Week 1 | Drive: Brand Kit/Templates | HTML email signature for Roger + finance person. Logo, name, title, phone, showroom address, social links. |
| **Letterhead Template** | Medium — Week 2 | Drive: Brand Kit/Templates | Google Docs or Word template. Logo header, footer with address + contact. For proposals, letters, formal docs. |
| **Business Card Template** | Medium — Week 2 | Drive: Brand Kit/Templates | Print-ready. Name, title, phone, email, address, QR code to website. |

---

## Where Assets Get Triggered in the Dashboard

```
LEAD COMES IN
  → Welcome Email (automated, Resend)

QUOTE CREATED
  → Quote PDF (generated in Dashboard, saved to Drive, sent to customer)
  → Quote Follow-Up Email (automated 3 days later if no response)

PAYMENT RECEIVED
  → Stripe Invoice + Receipt (automated)
  → Order Confirmation Email (automated, Resend)
  → Purchase Order to Manufacturer (generated in Dashboard, saved to Drive)

ORDER SHIPS
  → Shipping Update Email (automated, Resend)
  → WhatsApp Status Update (automated from Dashboard)

ORDER DELIVERED
  → Delivery Confirmation Email (automated, Resend)
  → Packing Slip / Delivery Receipt (generated, saved to Drive)

7 DAYS POST-DELIVERY
  → Follow-Up Email (automated, Resend)

WEEKLY (MONDAY)
  → Weekly Business Summary (AI-generated, emailed to Roger)

MONTHLY
  → Monthly Financial Report (AI-generated, saved to Drive)
  → Newsletter (composed in Dashboard, sent via Resend)

TRADE MEMBER APPROVED
  → Trade Welcome Kit (emailed via Resend, saved to Drive)

CONTENT PUBLISHED
  → Blog Post (Dashboard → Website)
  → Social Post (Dashboard → Meta API)
```

---

## Priority Order for Creating Assets

**Phase 1 — Week 1-2 (Must have before go-live):**
1. Logo package (all variations)
2. Brand color + typography reference
3. Email signature (Roger + finance person)
4. Stripe invoice template (branded)
5. Quote template
6. Welcome email template
7. Order confirmation email template
8. WhatsApp message templates (approved by Meta)

**Phase 2 — Week 3-4 (Must have for operations):**
9. Purchase order template
10. Shipping update email template
11. Delivery confirmation email template
12. Post-delivery follow-up email template
13. Quote follow-up email template
14. Weekly business summary template
15. Letterhead template
16. Brand guidelines one-pager

**Phase 3 — Week 5-6 (Must have for marketing):**
17. Blog post template (in Dashboard)
18. Newsletter template (Resend)
19. Social media post templates
20. Press release template
21. Media kit
22. Project showcase template

**Phase 4 — Week 7-8 (Must have for trade program):**
23. Trade welcome kit
24. Trade price sheets (per brand)
25. Trade newsletter template
26. Proposal / project brief template
27. Monthly financial report template
28. Business card template

---

*Every asset above should use the Dark Botanical design system: Cormorant for headlines, DM Sans for body, JetBrains Mono for labels, and the established color palette. No asset leaves Counter Cultures without the logo, the showroom address, and a way to contact the business.*
