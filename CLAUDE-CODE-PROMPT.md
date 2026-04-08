# Claude Code Prompt: Wire Dashboard to Google Sheets CRM

> Copy everything below this line and paste it into Claude Code.

---

## Context

This is a Next.js App Router project for Counter Cultures, a luxury bath & kitchen fixtures company in San Miguel de Allende. The website and dashboard are fully built. The Google Sheets CRM backend is now live with 16 tabs, all with headers, and the service account connection is verified working.

**What's already done:**
- `app/lib/sheets.ts` — website-facing Sheets API (products, leads, newsletter, bookings, trade apps). WORKING in production.
- `app/lib/google-drive.ts` — Drive API wrapper (list, upload, search, create folder, trash, export). WORKING.
- `app/lib/dashboard-sheets.ts` — generic `readSheet()`, `appendRow()`, `updateRow()`, `deleteRow()` for dashboard CRUD. WORKING.
- `app/api/dashboard/drive/route.ts` — Drive API route. WORKING.
- All env vars are set in `.env.local` (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEETS_ID, GOOGLE_DRIVE_FOLDER_ID).
- CRM spreadsheet has these tabs with headers: Products, Leads, Pipeline, Contacts, Activity_Log, Reps, Trade_Applications, Content_Calendar, Email_Campaigns, Social_Posts, Newsletter, Bookings, Website_Analytics, Sales_Metrics, Marketing_Metrics, Settings.

**What needs to happen:**
The dashboard pages at `app/(dashboard)/dashboard/(portal)/` currently use HARDCODED SAMPLE DATA (e.g., `SAMPLE_LEADS`, inline `products[]` arrays). They need to be wired to read/write from the live Google Sheets CRM via `app/lib/dashboard-sheets.ts`.

## Task

Wire these dashboard pages to the live CRM. For each page, replace sample/hardcoded data with API calls to Google Sheets. Create API routes where needed.

### Priority 1 — Core CRM Pages

**1. Leads page** (`app/(dashboard)/dashboard/(portal)/leads/page.tsx`)
- Currently imports `SAMPLE_LEADS` from `app/lib/sample-dashboard-data`
- Create `app/api/dashboard/leads/route.ts` with GET (read from Leads tab) and POST (add new lead) and PATCH (update lead status/details)
- Wire the page to fetch from this API on mount
- Keep the existing UI, filters, KPI cards, and SlideOut detail panel — just swap the data source
- Leads tab headers: `id, name, email, phone, source, status, contact_type, interest, value, created_at, next_followup`

**2. Pipeline page** (`app/(dashboard)/dashboard/(portal)/pipeline/page.tsx`)
- Currently has a Kanban board with drag-and-drop (uses @dnd-kit)
- Create `app/api/dashboard/pipeline/route.ts` with GET and PATCH (move deals between stages)
- Pipeline tab headers: `id, name, company, stage, value, probability, expected_close, owner, source, created_at, last_activity`
- Stages: New Lead → Qualified → Proposal → Negotiation → Won / Lost

**3. Products page** (`app/(dashboard)/dashboard/(portal)/products/page.tsx`)
- Currently has inline hardcoded product array
- Create `app/api/dashboard/products/route.ts` with GET, POST, PATCH, DELETE
- Read from Products tab. Headers: `slug, name, brand, category, subcategory, price_mxn, price_usd, description, features, dimensions, materials, finish, availability, image_url, gallery_urls, featured, lead_time, sku`
- This is the product catalog manager — edits here should reflect on the public website

**4. Contacts page** — if it exists, wire it to the Contacts tab
- Contacts headers: `id, name, email, phone, company, type, tags, created_at, notes`

### Priority 2 — Activity & Analytics

**5. Trade Program page** (`app/(dashboard)/dashboard/(portal)/trade-program/page.tsx`)
- Wire to Trade_Applications tab
- Headers: `id, company, contact_name, email, phone, license_number, status, created_at`

**6. Content Calendar** (`app/(dashboard)/dashboard/(portal)/content-calendar/page.tsx`)
- Wire to Content_Calendar tab
- Headers: `id, title, type, platform, scheduled_date, status, author, notes`

**7. Sales Analytics** (`app/(dashboard)/dashboard/(portal)/sales-analytics/page.tsx`)
- Wire to Sales_Metrics tab for KPI data
- Headers: `date, total_revenue, deals_closed, avg_deal_size, conversion_rate, pipeline_value, new_leads`

**8. Marketing Analytics** (`app/(dashboard)/dashboard/(portal)/marketing-analytics/page.tsx`)
- Wire to Marketing_Metrics tab
- Headers: `date, website_visits, unique_visitors, bounce_rate, avg_session, top_pages, conversion_rate`

### Priority 3 — Supporting Pages

**9. Settings page** (`app/(dashboard)/dashboard/(portal)/settings/page.tsx`)
- Wire to Settings tab for site configuration
- Headers: `key, value, description, updated_at`

**10. Overview page** (`app/(dashboard)/dashboard/(portal)/overview/page.tsx`)
- Should pull summary KPIs from multiple tabs (Leads count, Pipeline value, recent activity)
- Create `app/api/dashboard/overview/route.ts` that aggregates from Leads, Pipeline, Sales_Metrics

## Implementation Rules

1. **Read AGENTS.md first** — this project uses a newer version of Next.js with potential breaking changes. Check `node_modules/next/dist/docs/` before writing any code.

2. **Use the existing `dashboard-sheets.ts` pattern** — it already has `readSheet<T>(tab)`, `appendRow(tab, values)`, `updateRow(tab, rowIndex, values)`, `deleteRow(tab, rowIndex)`. Use these in your API routes.

3. **API routes go in `app/api/dashboard/[feature]/route.ts`** — follow the existing pattern in `app/api/dashboard/drive/route.ts`.

4. **Dashboard pages are client components** (`"use client"`) — they should fetch data via `fetch('/api/dashboard/...')` in a `useEffect` or similar pattern. Do NOT import server-side Google APIs directly in client components.

5. **Preserve all existing UI** — the dashboard components (DataTable, StatusBadge, SlideOut, KPICard, Kanban board) are already built and styled. Only swap the data source, don't redesign the UI.

6. **Add loading states** — show a spinner/skeleton while data loads from the API. The pages currently render instantly because of hardcoded data.

7. **Error handling** — if the Sheets API fails, show an error state in the UI rather than crashing. The existing `sheets.ts` has a fallback pattern you can reference.

8. **ID generation** — when creating new rows (leads, pipeline deals, etc.), generate IDs with a prefix + timestamp, e.g., `LEAD-1712534400000`.

9. **Don't touch these files** — `.env.local`, `app/lib/sheets.ts`, `app/lib/google-drive.ts`, `app/api/dashboard/drive/route.ts`. They're working.

10. **Test after each page** — run `npm run build` to verify no type errors or build failures after wiring each page.

## Start here

Begin with the Leads page — it's the most impactful and sets the pattern for everything else. Once Leads is working end-to-end (list, create, update status), move to Pipeline, then Products, then the rest.
