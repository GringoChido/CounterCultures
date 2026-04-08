# Claude Code Prompt: Expand Dashboard with CRM Sales System, Stripe Payments, Odoo Fixes & Email Campaign Engine

## ⚠️ CRITICAL: THIS IS ADDITIVE ONLY

**DO NOT remove, replace, or break any existing functionality.** Every existing page, component, interface, API route, and data structure must remain intact and working. All changes in this prompt are **additions** — new fields added to existing interfaces (keeping old fields), new pages, new components, new tabs, new API routes, new features layered on top of what exists.

If an existing interface gains new fields, make them **optional** (`field?: type`) so existing code that doesn't pass them continues to work. If an existing page gains new sections, add them below or alongside existing content. If existing sample data gains new fields, add them — don't change existing field values.

**Run `next build` after every major part to verify nothing is broken.**

## CRITICAL: Read Next.js 16 Docs First

Before writing ANY code, read the relevant guides in `node_modules/next/dist/docs/01-app/`. This is Next.js 16.2.1 — APIs, conventions, and file structure may differ from your training data. Specifically read:

- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`
- `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`

Params are `Promise`-based: `const { locale } = await params`. Heed deprecation notices.

---

## Context & Background

Counter Cultures is a luxury bath/kitchen/hardware showroom in San Miguel de Allende, Mexico. The Next.js 16 site and dashboard portal are built and deployed. The public-facing site lives under `app/[locale]/` with pages for: Home, Shop (category/subcategory/product), Brands, Our Story, Insights, Resources, Trade, Contact, Showroom, Blog, Projects, Artisanal, and legal/policy pages. The dashboard lives at `app/(dashboard)/dashboard/(portal)/` with: Overview, Leads, Pipeline, WhatsApp, Content Calendar, Social Media, Email Campaigns, Blog Manager, Analytics (Website/Sales/Marketing), Reports, Odoo, Stripe, Products, Trade Program, Drive, Settings.

### Existing Tech Stack (Already Installed — DO NOT reinstall)

- Next.js 16.2.1, React 19, TypeScript, Tailwind CSS 4
- `@dnd-kit/core` + `@dnd-kit/sortable` — drag-and-drop (Pipeline kanban)
- `@tanstack/react-table` — data tables (Leads, Products)
- `recharts` — charts (Overview, Analytics)
- `framer-motion` — animations
- `lucide-react` — icons
- `date-fns` — date formatting
- `zustand` — state management
- `react-hook-form` + `@hookform/resolvers` + `zod` — forms & validation
- `sonner` — toast notifications
- `swr` — data fetching/caching
- `stripe` — Stripe SDK (payments, customers, payouts)
- `googleapis` — Google Sheets
- `resend` — email sending
- `next-auth` — authentication
- `next-intl` — internationalization

### Existing .env.local Keys (Already Configured)

```
STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY
```

### Client Documents (Source of Truth)

The client provided 5 strategy documents that define how Counter Cultures' CRM, sales pipeline, email campaigns, and growth system should work:

1. **Odoo CRM Pipeline Structure** — 10-stage contract pipeline, CRM field requirements, 5-email cold outreach sequence, warm nurture structure, weekly review metrics
2. **Counter Cultures Sales System** — Step-by-step sales workflow (Contact → Opportunity → Quote → Follow-Up), contact types, relationship sales strategy, metrics
3. **Counter Cultures Growth System** — Marketing → Pipeline → Quotes → Revenue funnel, email-to-CRM flow
4. **CRM + Marketing Project Tracker** — 8-phase implementation roadmap (all phases complete), success criteria
5. **Strategic Contract Growth Plan** — ICP definition, 90-day KPI targets, sales gaps analysis, 8-step sales process

---

## PART 1: Add Extended Pipeline Stages (Additive to Existing Pipeline)

### What Exists Now

`app/lib/sample-dashboard-data.ts` has a `PipelineDeal` interface with `stage: "discovery" | "proposal" | "negotiation" | "closed-won" | "closed-lost"`. The pipeline page (`pipeline/page.tsx`) renders a 5-column Kanban with drag-and-drop.

### What to ADD

**1A. Extend the `PipelineDeal` interface** — add new optional fields while keeping ALL existing fields:

```typescript
// ADD these new optional fields to the EXISTING PipelineDeal interface
// DO NOT remove any existing fields (id, name, contactName, value, currency, stage, probability, expectedClose, assignedRep, products, createdAt, notes)
export interface PipelineDeal {
  // ... ALL existing fields stay exactly as they are ...

  // NEW optional fields from client's Odoo CRM Pipeline Structure doc:
  contactCompany?: string;
  contactRole?: "Architect" | "Interior Designer" | "Developer" | "Builder" | "Private Client" | "Supplier" | "Partner" | "Hospitality Designer";
  projectType?: "Luxury Residential" | "Boutique Hotel" | "Multi-Unit Development" | "Custom Estate" | "Commercial" | "Restaurant";
  estimatedProjectValue?: number;
  timeline?: string;
  decisionMakerName?: string;
  decisionRole?: string;
  leadSource?: string;
  followUpDate?: string;
  competitor?: string;
  lostReason?: "price" | "timeline" | "competitor" | "no-budget" | "ghost" | "other";
}
```

**1B. Expand the stage type** — the existing 5 stages must continue to work AND 5 new stages are added:

```typescript
// EXPAND (don't replace) — old stages keep working, new stages are added
export type PipelineStage =
  // Existing stages (KEEP — existing deals use these):
  | "discovery" | "proposal" | "negotiation" | "closed-won" | "closed-lost"
  // NEW stages from client's 10-stage pipeline:
  | "target-identified" | "contacted" | "conversation-started" | "qualified-project"
  | "design-scope" | "proposal-sent" | "follow-up-negotiation" | "verbal-yes"
  | "won" | "lost";
```

**1C. Update the Pipeline Kanban (`pipeline/page.tsx`)** — ADD the new stages to the `stageConfig` and `stages` array. Keep all existing stage configs. The Kanban should now show all stages. Make it horizontally scrollable (`overflow-x-auto`) since 10+ columns won't fit on screen. Each column: `min-w-[220px]`.

**1D. Add a "Lost Reason" modal** — when a deal is dragged to "Lost" or "closed-lost", show a `<SlideOut>` (existing component) asking for the reason. Options: price, timeline, competitor, no budget, ghost/no response, other. This is from the client's Odoo pipeline doc.

**1E. Enhance deal cards** — ADD to each Kanban card (below existing info):
- Contact role badge (if set)
- Follow-up date with overdue indicator (red text if past today)
- Company name (if set)

**1F. Add MORE sample pipeline deals** to `SAMPLE_PIPELINE` (keep all existing ones, ADD new ones):

```typescript
// ADD these to the EXISTING SAMPLE_PIPELINE array (do NOT remove existing deals)
{
  id: "DEAL-006",
  name: "Boutique Hotel Ánima — Spa Suite",
  contactName: "Valentina Torres",
  contactCompany: "Grupo Ánima",
  contactRole: "Hospitality Designer",
  value: 1850000,
  currency: "MXN",
  stage: "design-scope",
  probability: 50,
  expectedClose: "2026-06-15",
  assignedRep: "Roger",
  products: "AquaSpa Velas, TOTO Neorest, California Faucets Steampunk Bay",
  createdAt: "2026-03-05T09:00:00Z",
  notes: "Reviewing spa specs and AquaSpa installation requirements.",
  projectType: "Boutique Hotel",
  estimatedProjectValue: 32000000,
  timeline: "2026-08-01",
  decisionMakerName: "Valentina Torres",
  decisionRole: "Owner / Developer",
  leadSource: "Showroom Walk-in",
  followUpDate: "2026-04-04",
  competitor: "",
},
{
  id: "DEAL-007",
  name: "Residencial Los Arcos — Phase 1 Hardware",
  contactName: "Miguel Ángel Reyes",
  contactCompany: "Desarrollos Los Arcos",
  contactRole: "Developer",
  value: 3200000,
  currency: "MXN",
  stage: "verbal-yes",
  probability: 90,
  expectedClose: "2026-04-10",
  assignedRep: "Roger",
  products: "Sun Valley Bronze entry sets (24 units), Emtek interior hardware",
  createdAt: "2026-02-15T10:00:00Z",
  notes: "PO expected this week. 24-home luxury development. Phase 1 of 3.",
  projectType: "Multi-Unit Development",
  estimatedProjectValue: 120000000,
  timeline: "2026-05-01",
  decisionMakerName: "Miguel Ángel Reyes",
  decisionRole: "CEO",
  leadSource: "Referral",
  followUpDate: "2026-04-01",
  competitor: "Baldwin",
},
{
  id: "DEAL-008",
  name: "Galería del Sol — Bathroom Refresh",
  contactName: "Carmen Ortiz",
  contactCompany: "Ortiz Interiors",
  contactRole: "Interior Designer",
  value: 180000,
  currency: "MXN",
  stage: "target-identified",
  probability: 10,
  expectedClose: "2026-08-01",
  assignedRep: "",
  products: "TBD",
  createdAt: "2026-03-29T12:00:00Z",
  notes: "Found via Instagram — follows CC. Has high-end residential projects in SMA.",
  projectType: "Luxury Residential",
  estimatedProjectValue: 4500000,
  timeline: "TBD",
  decisionMakerName: "Carmen Ortiz",
  decisionRole: "Principal Designer",
  leadSource: "Instagram",
  followUpDate: "2026-04-05",
  competitor: "",
},
```

---

## PART 2: Enhance Lead Management (Additive to Existing Leads)

### What Exists Now

`Lead` interface with: id, name, email, phone, source, status, assignedRep, score, createdAt, updatedAt, notes, projectType, budget. Leads page has DataTable with status/source filters.

### What to ADD

**2A. Extend the `Lead` interface** — add new optional fields:

```typescript
// ADD to existing Lead interface — all new fields optional
export interface Lead {
  // ... ALL existing fields stay ...

  // NEW:
  whatsapp?: string;
  companyName?: string;
  contactType?: "Architect" | "Interior Designer" | "Developer" | "Builder" | "Private Client" | "Supplier" | "Partner" | "Hospitality Designer";
  city?: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  linkedOpportunities?: string[];
  tags?: string[];
}
```

**2B. Update SAMPLE_LEADS** — ADD the new fields to existing leads (don't change existing values):

For example, add to LEAD-001: `contactType: "Interior Designer", companyName: "Design Studio MX", city: "San Miguel de Allende", lastContactDate: "2026-03-28", nextFollowUp: "2026-04-02"`. Do this for all 8 existing leads.

**2C. Enhance the Leads page** — ADD (don't replace existing columns):
- A "Contact Type" filter dropdown alongside existing status/source filters
- A "Last Contact" column with color-coded days-ago indicator
- A "Follow-Up" column with overdue highlighting
- Quick action buttons on each row: WhatsApp (wa.me link), Email (mailto:), Log Activity (opens SlideOut)
- A "Stale Leads" tab/filter showing leads where `lastContactDate` > 60 days ago

---

## PART 3: Build B2B Email Campaign System (New Features on Existing Page)

### What Exists Now

`email-campaigns/page.tsx` has a basic table of campaigns with columns: name, status, open rate, click rate, recipients, sent date. Sample data has 4 campaigns.

### What to ADD

**3A. Add a Campaign Builder** — create `app/(dashboard)/components/email/campaign-builder.tsx`

A multi-step wizard (rendered in a `<SlideOut>`) for creating email sequences. Two campaign types:

**Cold Outreach (5-Email Sequence)** — pre-populated from the client's Odoo CRM Pipeline doc:
1. Introduction — "Elevating Your Next Project in San Miguel de Allende"
2. Value Proposition — Premium brands, custom sourcing, design alignment
3. Social Proof — Featured brands, notable projects, artisan offerings
4. Direct Ask — "Are you currently sourcing for any upcoming residential or hospitality projects?"
5. Breakup — "Should I close the loop for now?"

**Warm Nurture (Monthly)** — themes from client docs:
- New product spotlight
- Featured project showcase
- Designer collaboration highlight
- Installation inspiration
- Limited inventory announcement

Each template should include: subject line, body template text, CTA, and send delay (days after previous).

**3B. Expand the Campaign interface and sample data:**

```typescript
// ADD new optional fields to campaign data
interface Campaign {
  // Existing fields stay:
  id: string;
  name: string;
  status: "draft" | "sent" | "scheduled" | "active";  // ADD "active"
  openRate: number;
  clickRate: number;
  recipients: number;
  sentDate: string;
  // NEW:
  type?: "cold-outreach" | "warm-nurture" | "one-off";
  audienceType?: string;
  totalEmails?: number;
  currentEmail?: number;
  replyRate?: number;
  leadsGenerated?: number;
}
```

**3C. Add more sample campaigns** to the existing array (keep existing 4, add 2 more):

```typescript
{
  id: "5",
  name: "Q2 Architect Cold Outreach — San Miguel",
  type: "cold-outreach",
  status: "active",
  audienceType: "Architects",
  openRate: 42.5,
  clickRate: 8.3,
  replyRate: 6.1,
  recipients: 145,
  totalEmails: 5,
  currentEmail: 3,
  leadsGenerated: 6,
  sentDate: "2026-03-15",
},
{
  id: "6",
  name: "Developer Outreach — Querétaro",
  type: "cold-outreach",
  status: "scheduled",
  audienceType: "Developers",
  openRate: 0,
  clickRate: 0,
  replyRate: 0,
  recipients: 62,
  totalEmails: 5,
  currentEmail: 0,
  leadsGenerated: 0,
  sentDate: "2026-04-07",
},
```

**3D. Add a "New Campaign" button** to the email campaigns page that opens the campaign builder wizard.

**3E. Add a "sequence progress" column** for campaigns with `totalEmails` — show "Email 3 of 5" with a progress bar.

**3F. Add a "Leads Generated" column** showing how many CRM leads came from each campaign.

---

## PART 4: Build Weekly Review Dashboard (New Page)

### What Exists Now

Nothing — this is a new page.

### What to CREATE

**4A. Create `app/(dashboard)/dashboard/(portal)/weekly-review/page.tsx`**

A weekly review dashboard matching the client's required rhythm from both the Odoo Pipeline doc and Sales System doc. Shows:

- **This Week's Numbers** — KPI row: Leads Added, Meetings Booked, Proposals Sent, Revenue Forecast (using `KPICard` component)
- **Pipeline Movement** — deals that advanced, entered, or were lost this week
- **Overdue Follow-Ups** — list of deals/leads with past-due follow-up dates, with contact info and overdue duration
- **Close Rate** — Won / (Won + Lost) this month
- **Email Campaign Performance** — summary cards for active campaigns (open rate, reply rate, leads generated)
- **Focus for Next Week** — editable textarea for Roger to write priorities (persisted to localStorage)

Use the existing dashboard design system: `bg-dash-surface`, `border-dash-border`, `text-dash-text`, etc.

**4B. Add to sidebar navigation** — in `app/(dashboard)/components/sidebar.tsx`, ADD a new nav item between Overview and Leads:

```typescript
{ label: "Weekly Review", href: "/dashboard/weekly-review", icon: CalendarCheck, section: "Sales" },
```

Import `CalendarCheck` from `lucide-react`. DO NOT move or remove any existing nav items.

---

## PART 5: Expand Stripe Integration — Dashboard Enhancements

### What Exists Now

Dashboard has a full Stripe page (`stripe/page.tsx`) with tabs: Overview, Payments, Customers, Payouts. API routes exist for `/api/stripe/summary`, `/api/stripe/payments`, `/api/stripe/customers`, `/api/stripe/payouts`. The Stripe SDK client is at `app/lib/stripe/client.ts`.

### What to ADD to the Dashboard

**5A. Add a "Products" tab to the Stripe page** — fetch Stripe Products and Prices. Add a new API route:

Create `app/api/stripe/products/route.ts`:
```typescript
// Fetch Stripe products with their prices
const products = await stripe.products.list({ limit: 50, active: true, expand: ["data.default_price"] });
```

Add the tab to the existing tabs array in `stripe/page.tsx`. Display product name, description, price, active status, and image thumbnail.

**5B. Add a "Payment Links" tab** — fetch and display Stripe Payment Links. New API route:

Create `app/api/stripe/payment-links/route.ts`:
```typescript
const links = await stripe.paymentLinks.list({ limit: 25, active: true });
```

Show: link URL, active status, created date, and a "Copy Link" button. This lets Roger quickly grab payment links to send via WhatsApp.

**5C. Add a "Create Payment Link" action** — a `<SlideOut>` form that creates a new Stripe Payment Link:
- Select a product/price (or enter a custom amount)
- Optional: Customer email for pre-fill
- Creates the link via a new API route `app/api/stripe/create-payment-link/route.ts`
- Shows the generated URL with copy button

**5D. Add Stripe revenue to the Overview page** — on `overview/page.tsx`, ADD a new card showing "Stripe Revenue (30 Days)" by fetching from `/api/stripe/summary`. Place it alongside existing KPI cards.

**5E. Add a "Recent Payments" widget to Overview** — a small table showing the last 5 Stripe payments, below the activity feed. Clickable to go to the Stripe page.

**5F. Add invoice creation capability** — create `app/api/stripe/invoices/route.ts`:
- GET: List recent invoices
- POST: Create a draft invoice for a customer with line items

Add an "Invoices" tab to the Stripe page showing invoice status, amounts, and links to Stripe-hosted invoice pages. Add a "Create Invoice" button with a `<SlideOut>` form.

---

## PART 6: Stripe on the Public Website

### What Exists Now

Product detail pages (`product-detail.tsx`) show product info, price in MXN, WhatsApp inquiry button, trade pricing link, and spec sheet link. The payment methods page lists accepted payment methods (bank transfer, Mercado Pago, PayPal, cash).

### What to ADD (Without Changing Existing CTAs)

**6A. Add "Pay Online" option to product detail pages** — ADD (below the existing "Inquire About This Piece" and "Request Trade Pricing" buttons) a new "Pay / Reserve Online" button that opens a Stripe Checkout session.

Create `app/api/stripe/checkout/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getStripe, isConfigured } from "@/app/lib/stripe";

export const POST = async (req: NextRequest) => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Online payments not available" }, { status: 503 });
  }

  const { productName, productSku, amount, currency = "mxn", locale = "en" } = await req.json();

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [{
      price_data: {
        currency,
        product_data: {
          name: productName,
          description: `SKU: ${productSku}`,
        },
        unit_amount: Math.round(amount * 100), // Stripe expects centavos
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://countercultures.mx"}/${locale}/shop?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://countercultures.mx"}/${locale}/shop?payment=cancelled`,
    metadata: { sku: productSku, source: "website" },
  });

  return NextResponse.json({ url: session.url });
};
```

In `product-detail.tsx`, ADD the button below existing CTAs:
```tsx
<button
  onClick={async () => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: product.nameEn,
        productSku: product.sku,
        amount: product.price,
        currency: "mxn",
        locale,
      }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }}
  className="w-full py-3 font-body text-sm font-medium border border-brand-stone/20 text-brand-charcoal hover:bg-brand-charcoal hover:text-white transition-colors"
>
  Pay / Reserve Online
</button>
```

**6B. Add a deposit/reservation payment option** — for high-value items (> $50,000 MXN), the checkout button should say "Reserve with 30% Deposit" and charge 30% of the price. This matches the client's Sales & Delivery policy: "70% de anticipo, 30% al notificar el envío."

Adjust the checkout route to accept a `depositPercent` parameter. On the product page, if `product.price > 50000`, show "Reserve with Deposit ($X MXN)" instead of "Pay Online."

**6C. Update the Payment Methods page** — ADD a new section for "Online Payments (Card)" explaining that customers can now pay via credit/debit card through Stripe. Keep ALL existing payment method sections (bank transfer, Mercado Pago, PayPal, OXXO, etc.) — just add the new one at the top.

**6D. Add Stripe payment confirmation page** — create `app/[locale]/payment-success/page.tsx` that shows a nice "Payment Received" confirmation with next steps (delivery timeline, contact info). Use the existing brand design tokens.

---

## PART 7: Fix & Enhance Odoo CRM Integration

### What Exists Now

The Odoo page (`odoo/page.tsx`) has tabs: Overview, Sales Orders, Invoices, Customers, Purchases. API routes exist for all. The client reports that "a lot of the information isn't showing up."

### Diagnosis of the Issue

Looking at the code, there are several likely causes for missing data:

1. **Silent error swallowing** — all fetch callbacks use `catch { /* ignore */ }`, hiding failures
2. **Netlify function timeouts** — `loadAll` makes 6 sequential API calls (connection test + 5 data loads). Each authenticates separately. On Netlify with cold starts, this can timeout
3. **`read_group` failure** — the summary route uses `read_group` for totals, but wraps it in a try/catch that silently zeros the values if the Odoo user doesn't have group permissions
4. **Missing `purchase` module** — if the client's Odoo instance doesn't have the purchase module installed, the purchases API call will error and return empty
5. **Data loaded but component shows `null`** — Overview tab shows `{tab === "overview" && summary && (...)}` — if summary fails to load, the ENTIRE overview tab is blank with no error message

### What to FIX (Additive — improve, don't break)

**7A. Add error visibility** — replace all `catch { /* ignore */ }` blocks with proper error tracking. Add a `warnings` state array. When any data load fails, push a warning. Show a yellow warning banner at the top listing which data sources failed to load.

**7B. Add fallback UI when summary is null** — if `summary` is null but `connected` is true, show "Summary data unavailable — try refreshing" instead of a blank screen. Also show whatever data DID load (sales, invoices, contacts, purchases tables should still render even if summary failed).

**7C. Reduce Odoo API calls** — instead of making 6 sequential requests:
- Cache the UID from `authenticate()` in a module-level variable so subsequent calls in the same request don't re-authenticate
- In the `odoo/client.ts`, add a `cachedAuth` wrapper:

```typescript
let cachedUid: number | null = null;
let cacheExpiry = 0;

const getCachedUid = async (): Promise<number> => {
  if (cachedUid && Date.now() < cacheExpiry) return cachedUid;
  cachedUid = await authenticate();
  cacheExpiry = Date.now() + 5 * 60 * 1000; // 5 min
  return cachedUid;
};
```

Update `searchRead` and `searchCount` to use `getCachedUid()` instead of calling `authenticate()` every time.

**7D. Add timeout handling** — add a timeout to the JSON-RPC fetch calls (15 seconds). If Odoo is slow, show a timeout warning instead of hanging forever.

**7E. Make the Odoo page load data in parallel, not sequential** — change `loadAll`:

```typescript
const loadAll = useCallback(async () => {
  setLoading(true);
  setError("");
  setWarnings([]);

  const ok = await testConnection();
  if (!ok) { setLoading(false); return; }

  // Load ALL data in parallel — don't wait for one to finish before starting another
  const results = await Promise.allSettled([
    loadSummary(),
    loadSales(),
    loadInvoices(),
    loadContacts(),
    loadPurchases(),
  ]);

  // Check for failures and add warnings
  const labels = ["Summary", "Sales Orders", "Invoices", "Contacts", "Purchases"];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      setWarnings(prev => [...prev, `${labels[i]}: ${r.reason?.message || "Failed to load"}`]);
    }
  });

  setLoading(false);
}, [testConnection, loadSummary, loadSales, loadInvoices, loadContacts, loadPurchases]);
```

**7F. Add data counts to tabs** — show the count of loaded records in each tab label: "Sales Orders (12)", "Invoices (8)", "Customers (45)". This gives immediate feedback about what loaded.

**7G. ADD a "CRM Pipeline" tab** — this is new. Add it to the Odoo page's tab bar. Create a new API route:

Create `app/api/odoo/crm/route.ts`:
```typescript
// Fetch CRM leads/opportunities from Odoo's crm.lead model
const domain: unknown[][] = [["type", "=", "opportunity"]];
const leads = await searchRead("crm.lead", domain, [
  "name", "contact_name", "partner_id", "email_from", "phone",
  "expected_revenue", "probability", "stage_id", "user_id",
  "date_deadline", "create_date", "write_date", "priority",
  "lost_reason", "tag_ids", "description",
], limit, offset, "write_date desc");
```

Display these as a table showing: Name, Contact, Stage, Expected Revenue, Probability, Deadline, Assigned To. If the `crm.lead` model isn't available (Odoo CRM module not installed), catch the error gracefully and show "CRM module not available in your Odoo instance" instead of crashing.

**7H. Add OdooCRMLead type** to `app/lib/odoo/types.ts` (ADD — don't modify existing types):

```typescript
interface OdooCRMLead {
  id: number;
  name: string;
  contact_name: string;
  partner_id: [number, string] | false;
  email_from: string;
  phone: string;
  expected_revenue: number;
  probability: number;
  stage_id: [number, string];
  user_id: [number, string] | false;
  date_deadline: string;
  create_date: string;
  write_date: string;
  type: "lead" | "opportunity";
  priority: "0" | "1" | "2" | "3";
  lost_reason: [number, string] | false;
  tag_ids: [number, string][];
  description: string;
}

export type { OdooCRMLead };
// ADD to the existing export list in index.ts
```

---

## PART 8: Enhance Overview Dashboard with Growth Metrics

### What Exists Now

Overview page has: KPI cards (leads, pipeline, deals won, conversion rate), revenue chart, lead source pie chart, pipeline by stage bar chart, recent leads table, activity feed.

### What to ADD (Keep everything, add alongside)

**8A. Add a Marketing → Revenue funnel** — below the existing charts, ADD a horizontal funnel visualization showing:
```
Email Campaigns (145 recipients) → New Leads (12) → Pipeline ($10.4M) → Quotes (6) → Won ($320K)
```
Use recharts `BarChart` with horizontal layout or a custom funnel component.

**8B. Add 90-Day KPI Target tracker** — ADD a new section below the funnel. From the Strategic Contract Growth Plan:

```typescript
const ninetyDayTargets = [
  { label: "New Contract Leads", target: 30, actual: 12 },
  { label: "Meetings Booked", target: 20, actual: 8 },
  { label: "Proposals Sent", target: 15, actual: 6 },
  { label: "Deals Closed", target: 5, actual: 1 },
  { label: "Revenue", target: 5000000, actual: 320000, format: "currency" },
];
```

Render as progress bars with percentage to goal. Color: green if ≥ 75%, yellow if ≥ 50%, red if < 50%.

**8C. Add Stripe mini-widget** — ADD a "Stripe Revenue" KPI card to the existing KPI grid. Fetch from `/api/stripe/summary` using SWR. Show 30-day volume. If Stripe isn't configured, hide the card gracefully (don't crash).

**8D. Add "Recent Stripe Payments" section** — below the activity feed, ADD a compact table showing last 5 Stripe payments. "View all →" links to `/dashboard/stripe`.

---

## PART 9: Activity Logging System (New Component)

### What Exists Now

`ActivityItem` interface with: id, type, description, contactName, rep, timestamp. Sample activities in `SAMPLE_ACTIVITIES`. Activities show in Overview feed. No way to CREATE new activities.

### What to ADD

**9A. Extend ActivityItem** — add optional fields:

```typescript
export interface ActivityItem {
  // ALL existing fields stay ...

  // NEW:
  contactId?: string;
  dealId?: string;
  followUpDate?: string;
  type: "call" | "email" | "meeting" | "note" | "deal" | "lead" | "whatsapp";  // ADD "whatsapp" to existing union
}
```

**9B. Create Activity Logger component** — `app/(dashboard)/components/activity-logger.tsx`

A `<SlideOut>` form with:
- Activity type selector (Call, Email, Meeting, Note, WhatsApp)
- Contact name (text input with autocomplete from existing leads)
- Deal link (optional dropdown from pipeline deals)
- Notes textarea
- Follow-up date picker
- "Log Activity" button

Use `zustand` to store new activities in client state that merges with SAMPLE_ACTIVITIES.

**9C. Make the Activity Logger accessible from:**
- Overview page (new "Log Activity" button in the activity feed header)
- Leads page (row action on each lead)
- Pipeline page (action on each deal card)

---

## PART 10: Enhance Trade Program Page

### What Exists Now

Trade program page has: KPI cards, tier-based member table with company, contact, tier, discount, status, orders, revenue.

### What to ADD

**10A. Add "Trade Applications" section** — above the existing members table, add a "Pending Applications" card showing applications from the website's `/trade` page. Show: name, company, role, applied date, status (Pending/Approved/Declined). Add approve/decline buttons (client-side state for now).

**10B. Add "Active Projects" column** to the trade members table — show how many pipeline deals are linked to each trade member.

**10C. Add a "Trade Revenue vs Direct" chart** — a simple pie or bar chart showing revenue from trade members vs direct retail.

---

## PART 11: Sales Health Checklist (Add to Reports Page)

### What Exists Now

Reports page has report cards (Monthly Sales, Pipeline Health, Marketing ROI, Trade Program Summary, Inventory Status).

### What to ADD

**11A. Add a "Sales Process Health" card** — from the Strategic Contract Growth Plan's sales gaps analysis:

```typescript
const salesHealthChecklist = [
  { label: "Structured follow-up cadence", ok: true },
  { label: "Consistent outreach running", ok: true },
  { label: "All proposals tracked in pipeline", ok: true },
  { label: "CRM contacts tagged by role", ok: true },
  { label: "Contract sales process defined", ok: true },
  { label: "Weekly pipeline review", ok: false, note: "Last review: 5 days ago" },
  { label: "Clear lead ownership", ok: true },
  { label: "Measurable KPI reporting", ok: true },
];
```

Render as a checklist with green checks / red warnings. Add it as a new card in the reports grid.

---

## PART 12: Creative Enhancements (Polish & Delight)

These are things the client didn't explicitly ask for but that will make the system sing.

**12A. Command Palette Search Enhancement** — if `app/(dashboard)/components/command-palette.tsx` exists, ADD pipeline deals and leads to the searchable items so Roger can Cmd+K to find any deal or contact instantly.

**12B. Notification Dot on Sidebar** — add a red notification dot next to "Weekly Review" when there are overdue follow-ups. Add a dot next to "Leads" when there are unassigned leads (no `assignedRep`).

**12C. Quick Stats Bar** — add a thin stats bar at the very top of the dashboard layout (above the header) showing: Pipeline Value | Deals This Month | Overdue Follow-ups. Always visible. Uses the existing `bg-dash-bg` background with `text-dash-text-secondary` small text.

**12D. WhatsApp Quick Send from Pipeline** — add a WhatsApp icon on each pipeline deal card that opens `wa.me/{contact-phone}` with a pre-filled follow-up message.

**12E. Dark mode status badge colors** — the existing `StatusBadge` uses light backgrounds (e.g., `bg-emerald-50 text-emerald-700`) which look washed out on the dark dashboard. ADD dark-mode-aware variants: `bg-emerald-500/10 text-emerald-400`. Apply these in the dashboard context while keeping the light versions for the public site.

---

## Design Tokens Reference (Use These — Already Configured)

### Dashboard (Dark Theme)
- `bg-dash-bg` (#0B0D0F) — page background
- `bg-dash-surface` / `bg-dash-card` (#12141A) — card backgrounds
- `border-dash-border` (#1E2028) — borders
- `text-dash-text` / `text-dash-text-primary` (#E8E9ED) — primary text
- `text-dash-text-secondary` (#7A7D85) — secondary text
- `bg-brand-copper` / `text-brand-copper` (#B87333) — accent
- `text-brand-terracotta` (#C4725A) — accent
- `text-status-new`, `text-status-contacted`, `text-status-qualified`, `text-status-won`, `text-status-lost` — status colors

### Public Website (Light Theme)
- `bg-brand-linen` (#F5F0EB) — backgrounds
- `bg-brand-charcoal` (#1A1A1A) — dark sections
- `text-brand-terracotta` (#C4725A) — CTAs, accents
- `text-brand-copper` (#B87333) — artisanal accents
- `text-brand-sage` (#7A8B6F) — secondary accents
- `font-display` — Cormorant Garamond (headings)
- `font-body` — DM Sans (body text)
- `font-mono` — JetBrains Mono (SKUs, technical)

---

## Implementation Order (Recommended)

Work in this order so each part builds on the last and you can verify as you go:

1. **Part 1** — Pipeline stage expansion + new sample deals + lost reason modal
2. **Part 2** — Lead interface expansion + enhanced leads page
3. **Part 7** — Odoo fixes (this unblocks real data flowing in)
4. **Part 5** — Stripe dashboard expansion (Products, Payment Links, Invoices tabs)
5. **Part 6** — Stripe on website (Checkout, deposit payments, payment success page)
6. **Part 8** — Overview enhancements (funnel, 90-day targets, Stripe widget)
7. **Part 4** — Weekly Review page + sidebar entry
8. **Part 3** — Email campaign builder
9. **Part 9** — Activity logger
10. **Part 10** — Trade program enhancements
11. **Part 11** — Reports: sales health checklist
12. **Part 12** — Creative polish (command palette, notification dots, quick stats)

**Run `next build` after completing Parts 1-2, after Parts 5-7, and at the end.**

---

## Quality Checklist

Before considering this task complete, verify:

### Additive Integrity
- [ ] ALL existing pages still render correctly (spot-check: overview, leads, pipeline, stripe, odoo, trade-program)
- [ ] ALL existing sample data is still present and unchanged
- [ ] ALL existing API routes still work
- [ ] `next build` completes without errors
- [ ] No TypeScript errors from optional field additions

### Pipeline (Part 1)
- [ ] Pipeline Kanban shows both old 5 stages AND new expanded stages
- [ ] Existing deals on old stages still appear and are draggable
- [ ] New sample deals appear in new stage columns
- [ ] Lost reason modal appears when dragging to Lost/closed-lost
- [ ] Deal cards show new fields (role badge, follow-up date) when present, gracefully skip when absent

### Leads (Part 2)
- [ ] Contact Type filter works alongside existing status/source filters
- [ ] Last Contact and Follow-Up columns show data when available, "—" when not
- [ ] WhatsApp/Email quick actions open correct URLs
- [ ] Existing lead data displays exactly as before

### Stripe Dashboard (Part 5)
- [ ] Existing tabs (Overview, Payments, Customers, Payouts) still work
- [ ] New tabs (Products, Payment Links, Invoices) load data from Stripe
- [ ] "Create Payment Link" generates a working Stripe URL
- [ ] "Create Invoice" creates a draft in Stripe

### Stripe Website (Part 6)
- [ ] Product detail pages show all existing CTAs (WhatsApp, Trade Pricing, Spec Sheet)
- [ ] New "Pay / Reserve Online" button appears below existing CTAs
- [ ] Checkout redirect works and returns to success page
- [ ] High-value items show deposit option
- [ ] Payment Methods page still shows all existing payment methods with Stripe card section added

### Odoo (Part 7)
- [ ] Odoo page no longer shows blank Overview when summary fails
- [ ] Failed data loads show warnings instead of silent emptiness
- [ ] Data loads in parallel (faster page load)
- [ ] CRM Pipeline tab shows Odoo opportunities (or graceful "not available" message)
- [ ] Tab labels show record counts

### Overview (Part 8)
- [ ] All existing Overview content is still present
- [ ] Funnel visualization renders below existing charts
- [ ] 90-day targets show progress bars
- [ ] Stripe widget shows 30-day revenue (or is hidden if Stripe unconfigured)

### New Pages & Components
- [ ] Weekly Review page accessible from sidebar
- [ ] Activity Logger opens from Overview, Leads, and Pipeline
- [ ] Email Campaign Builder wizard opens from campaigns page
- [ ] Sales Health checklist appears on Reports page
