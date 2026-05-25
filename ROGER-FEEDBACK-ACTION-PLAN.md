# Roger Feedback, Action Plan (detailed)

_Compiled from Roger's review of the site and Counter Portal (May 2026). 26 items, each with: what he reported, what's actually happening in the code, the proposed fix, where it lives, rough effort, and any open question._

---

## How to read this

The 26 items span three different systems, which matters because each changes differently:

- **Website**: the public storefront (`app/[locale]/...`). Code we control; ships on a Netlify deploy.
- **Portal**: the Counter Portal dashboard (`app/(dashboard)/dashboard/(portal)/...`). Code we control.
- **Odoo**: the underlying ERP. Some items are Odoo configuration or training (not code), and some are data fixes at the Odoo source.

Effort buckets are rough: **S** = a few hours. **M** = about a day. **L** = multi-day or blocked on a decision.

---

## ⚙️ Reconciliation status — last updated 2026-05-24

This plan is the living source of truth. It was compiled in early May and is partly stale; this block records what has changed since, so the per-item detail below is read in context.

**Correction A — Odoo is NOT being retired.** The earlier "portal becomes the system of record, Odoo phases out" direction is no longer the plan. Roger is keeping Odoo and will not close it until the portal earns his trust. The portal works **alongside** Odoo, not as a replacement. There is no accounting/fiscal migration phase, and we are not building toward retiring Odoo. All current Odoo seats stay active. Write-back from the portal (`app/lib/odoo/write.ts`) still applies — the portal can create quotes, customers, leads, and POs that write back into Odoo — but Odoo remains the system of record.

**Correction B — the 10 open questions are mostly answered.** See the answered list at the bottom; do not re-ask Roger these. Maker names are Mistoa, Familia Meza, Castro, and Manriquez (the old "Santiago" placeholder is Manriquez); the invented artisan personas were fake and have been removed.

**Already shipped and live (do not redo):**
- Website: #1 (catalog count rounded site-wide), #3 (A–Z brand index reaches flagship brands like California Faucets), #2 (real maker names applied), #8 (Artesanal tag restricted to the four maker lines), #9 (PDP floating ovals + green in-stock badge removed), #10 (PDP image gallery), #12 (WhatsApp button green), #13 (Become a Brand Partner section removed), #7 (portal sign-in link visible, opens in a new tab).
- Portal: #16 / #6 (full New Quote builder with inline New Customer, both writing back to Odoo, plus New Quote entry points across the dashboard), #5 / #17 (Leads and Quotes surfaced in the main nav), #14 / #15 (stat cards reworked to Quotes / Sales / Invoices, made clickable filters), #26 (States → Status), #25 (Paid and Delivered statuses added), #23 (Notes → Terms and Conditions with a client preview), #24 (quote send auto-attaches the PDF), #22 (PO detail cleanup), #18 (Contacts / Customers / Vendors split into separate lists), #19–#21 (CC and R&F company tags, company filter, Draft → RFQ relabel, corrected company attribution), cross-cutting DD/MM/YYYY date format.
- Infrastructure (not in the original plan): the Odoo → portal sync was restored after it had dropped to zero; a production sign-in outage was fixed. Sign-in is hard-locked to `@countercultures.com.mx` (any account on that domain gets in, no Users-sheet row required). The old `PORTAL_EMAIL_ALLOWLIST` and any `untold.works` access are deliberately gone — leave these auth guardrails in place.

**Shipped 2026-05-24 (this session), live and verified on Netlify:**
- **Search (Workstream F)** — unified product relevance on one tuned, AND-semantics core with SKU-part tokenization, richer index fields (category/finishes/description), and a pinned relevance test suite. Commit `c41410a`.
- **New Lead + New PO create flows (#16, #19)** — New Lead is a UI form over the existing sheet-backed `/api/dashboard/leads` (leads live in the Google "Leads" sheet, NOT Odoo); New PO writes a real Odoo `purchase.order` via a new `createPurchaseOrder` helper in `write.ts`, gated by a new `create_po` feature. Both have list-page and global "+ New" entry points. Commit `bbfaae5`.
- **Company selectors relabeled CC / R&F** in the quote and PO builders (the `CompanyBadge` already renders "R&F"). Commit `bbfaae5`.
- **Product descriptions (#4) — infrastructure + review gate.** Step 10 now stages drafts instead of writing live; new copy-review scripts (`13-emit-copy-review-xlsx` / `14-merge-copy-review`) make human approval the only publish path; the build-time blank-description guard is wired into `build`. Commits `70483d0` / `6c7a5c1`. Brand-alias + placeholder-name fix for artisan drafting: commit `b0cfe0f`.

**Still open:**
- **Product descriptions — the copy itself (the only remaining big-rock work).** Artisan lines are being regenerated with corrected prompting (placeholder-name fix shipped; length handled via Sonnet for statement pieces, concise Haiku for small hardware). Regeneration is gated on Anthropic API credits. After regen: a placeholder/length scan, then human review of `CC-Copy-Review.xlsx`, then step 14 publishes. The ~570 already-live AI entries (Emtek/Delta/Brizo) still need a retroactive review pass.
- **#8 cross-cutting polish** — the internal `"llc"` → `"rf"` key rename in `odoo-sheets.ts` and its ~10 consumers (deferred on purpose: the user-facing label already reads R&F, so this is invisible cleanup, low value), plus any leftover Workstream D detail items.

The two entities are **CC and R&F** (not "LLC").

### Roger feedback — 2026-05-25 (Monday)

From Roger's Monday review of the shipped work.

- ✅ **California Faucets search confirmed working** — "all of it appears, including parts and finishes." Validates Workstream F.
- ✅ **Maker cards on /brands don't reach products — FIXED.** Root cause: the catalog server component called `searchProducts()` without passing `brand`/`q` URL params, so the initial SSR render showed unfiltered products. The client-side fetch corrected after 180ms, but the flash of wrong content made it feel broken. Fix: `catalog/page.tsx` now reads `searchParams` and passes `brand` + `q` to the server-side `searchProducts()` call.
- ✅ **Bilingual quotes (EN/ES per client) — SHIPPED.** Added `lang` field (`"en_US" | "es_MX"`) to `CreateCustomerInput` → `createCustomer()` → Odoo `res.partner.lang`. API route `/api/dashboard/customers/create` accepts `lang` in the Zod schema. The New Customer inline form on the New Quote page has an explicit Espanol/English toggle (defaults to `es_MX`). Odoo renders the quote PDF in the customer's language.
- ✅ **PO list stale vs Odoo — FIXED.** Root cause confirmed: `MODELS` map had no `purchaseOrder` entry; `ALL_MODELS` in the cron route only listed invoices/payments/sale_orders. Fix: defined `PURCHASE_ORDER_FIELDS` (11 fields matching the `OdooPurchaseOrder` sheet columns + `write_date`), added `purchaseOrder` to `MODELS`, exported `syncPurchaseOrdersIncremental`, and added `"purchase_orders"` to the cron route. POs now sync incrementally on the hourly cron alongside the other models. Sale-order lag (~25) is just the cursor catching up and will self-heal on next cron run.

---

## Direction (current): the portal is a daily workspace alongside Odoo

The portal is where quotes, orders, POs, customers, and leads can be created and edited, with write-back into Odoo (`app/lib/odoo/write.ts`). Odoo stays as the system of record and the compliance/fiscal engine (CFDI, tax, customs/pedimento, inventory valuation, AR/AP, P&L all stay in Odoo). The goal is to make the portal good enough that Roger reaches for it first for daily sales work, while Odoo keeps running underneath. Nothing here builds toward closing Odoo.

**The Odoo connection must stay healthy.** The portal reads live data from Odoo, so the integration login has to stay active. The sync break below has been resolved; the note remains as a guardrail.

---

## ✅ RESOLVED: the Odoo → Portal data sync (was P0)

**Items it had been corrupting: #14, #18, #23.**

**What had happened:** the Customers screen had dropped from 808 partners and $16.5M lifetime invoiced to 0/$0; Orders went stale; detail screens showed only old Odoo data. The data was always intact in Odoo — the portal's pipe into Odoo had been severed, traced to the single integration login losing its Odoo seat.

**Resolution:** the Odoo → portal sync was restored and the counts came back. Going forward, keep a dedicated, always-active integration login so a seat change never breaks reads again (all current Odoo seats stay active per Q9). Leave this in place.

---

## Remaining work (what is still open)

Almost the entire 26-item plan plus both big rocks have shipped (see the reconciliation status block above). What is genuinely left:

- **#4 Product descriptions — the copy itself.** Big rock #1's infrastructure and review gate shipped; what remains is regenerating the artisan copy (gated on Anthropic credits), human-reviewing `CC-Copy-Review.xlsx`, running step 14 to publish, and a retroactive review of the ~570 already-live AI entries. This is the highest-value remaining work.
- **#8 cross-cutting polish.** The internal `"llc"` → `"rf"` key rename in `odoo-sheets.ts` and ~10 consumers (deferred — invisible to users, low value), plus any leftover Workstream D detail items found in a sweep. Lowest priority.

Shipped this session and no longer open: Search (Workstream F, `c41410a`), New Lead + New PO create flows (#16/#19, `bbfaae5`), CC/R&F selector relabel (`bbfaae5`), descriptions infrastructure + review gate (`70483d0`/`6c7a5c1`/`b0cfe0f`).

Nothing here is blocked on Roger. The only thing still worth a non-blocking confirmation from him is whether the homepage artisan-origin details are accurate (copper from Santa Clara del Cobre, stone from Querétaro, Mistoa ceramics from Guanajuato, designed by Roger Williams).

---

## Discoverability note (resolved)

The portal originally hid Leads, Pipeline, and Quotes under a collapsed "More" disclosure in `app/(dashboard)/components/sidebar.tsx`, which is why Roger kept asking "where is X." Leads and Quotes are now surfaced in the main nav (#5, #6, #17). Keep new high-value pages out of "More."

---

## Already done or closed

- **#11** Add admin email to Stripe: done by the team (account config, no code).
- **#2 / #8** Artisan naming, clickable maker cards, and the Artesanal tag: shipped and live. Maker lines are credited at the line level via the four real names (Mistoa, Familia Meza, Castro, Manriquez); the brand-alias map in `app/lib/products-mapping.ts` canonicalizes the raw Odoo brand strings ("Counter / Santiago" → Manriquez, "Counter / Gaby- Cobre" → Castro, "Counter/Meza" → Familia Meza) and `ARTISAN_BRANDS` restricts the tag to exactly those four lines. The fabricated personas were removed.
- See the reconciliation status block at the top for the full shipped list (#1, #3, #7, #9, #10, #12, #13 website; #14–#26 portal; sync + auth infra).

---

# Workstream A: Website / storefront

### #1. "354,449-piece" catalog count is hardcoded
**Reported:** "Why every time we talk about the products catalog you write out '354,449 piece'? It's not static, we add product constantly."
**What's happening:** The exact figure is written into copy in several places; it goes stale the moment a SKU is added, and reads oddly precise for marketing copy. The catalog page already uses a rounded `350,000` fallback, so the standard exists, it just is not applied everywhere.
**Fix:** Replace every hardcoded exact count with a rounded or growing phrase ("350,000+ pieces") or the live count. Standardize on one approach site-wide.
**Effort:** S.

### #3. A to Z brand index cannot reach California Faucets
**Reported:** Clicked "C" on the brands page; saw Cheviot, Chicago Faucets, Classic Brass, Colonial Bronze, but not California Faucets.
**What's happening (confirmed):** California Faucets is a flagship brand. Flagship brands render in a separate band above the filterable A to Z grid (`brands/page.tsx`), and the A to Z letter index is built only from the non-flagship set (`brands/brands-grid.tsx`). So the "C" jump literally has no California Faucets anchor.
**Fix:** Include flagship brands in the A to Z anchor map, or add a flagship anchor near the top. Decide whether the alphabetical list should show all brands including flagship.
**Effort:** S-M.

### #4. Product descriptions — coverage and quality (BIG ROCK #1)
**Reported:** "Cleaned up and standardized all the product pages. I do not see the descriptions on all of the products."
**Answered (Q8):** every product gets a description, AI-drafted then human-reviewed before going live.

**Reality now (the never-blank guarantee is already built).** A description always renders. `app/lib/pdp-description.ts` (`resolvePdpDescription`) is the single source of truth — a 5-step fallback chain (sidecar locale → sidecar other locale → CRM locale → CRM other locale → `"{brand} {name}"`), pinned by `app/lib/pdp-description.test.ts` and documented in `docs/commerce/PDP-DESCRIPTION-RULES.md`. So no PDP is ever blank. **The real gap is quality and coverage, not empty pages.** Do not inline description logic into the PDP page and do not narrow that chain.

**Fresh coverage audit (2026-05-24, `scripts/scrape/12-final-audit.ts` over the real 4,236-SKU catalog):**

| Asset | Coverage |
| --- | ---: |
| Thumbnail | 100% (4,236) |
| Spanish description (curated, incl. parent inheritance) | 17.4% (736) |
| English description | 15.2% (642) |
| Feature bullets | 0.3% (14) |
| Gallery (3+ images) | 2.3% (96) |
| Spec sheet PDF (local) | 11.0% (468) |

So ~83% of the real catalog has no curated Spanish copy and falls back to CRM fields, then to brand+name. Well-covered brands (Emtek 75%, Delta 75%, Brizo 77%, JCR 38%) line up with the partner scrapers that ran; the long tail is thin. The 2026-05-11 pipeline run errored partway (a TransformError; step 06 kept only 207 of 705 at min-confidence 0.45), so it never finished — that is why a brand like California Faucets (1,062 SKUs) has a partner scraper yet sits at ~1% coverage.

**Prioritization for the fill (sell-through + artisan first, distributor long tail last):**
1. **Artisan / Counter maker lines first** (~458 SKUs, near-zero coverage, highest editorial value): Counter / Santiago→Manriquez (224), Counter / Gaby- Cobre→Castro (169), Counter/Meza→Familia Meza (27), Counter (29), Mistoa (9). Hand-quality copy matching site voice.
2. **Products that actually sell**, using the existing `catalog-signals.ts` most-specified / in-showroom signals as a sell-through proxy.
3. **High-volume flagship brands** with near-zero coverage: California Faucets (1,062), Kohler (255), Toto (169), Sun Valley Bronze (163), Kingston Brass (140).

**Approach (do NOT publish AI drafts blind).** Use the existing pipeline loop: draft with `10-llm-fill-descriptions.ts`, emit the review spreadsheet with `07-emit-review-xlsx.ts`, a human approves, merge approved copy with `08-merge-reviewed.ts`, re-audit with `12-final-audit.ts`. Then wire `scripts/checks/assert-pdp-renders-description.ts` into `build` so a blank-description regression can never ship (it is scaffolded but not wired in — see PDP-DESCRIPTION-RULES.md).
**Effort:** L (batched fill + review loop), plus S to wire the build check.

### #8. Regular vendor products mislabeled "ARTESANAL / ARTISANAL"
**Reported:** Branded vendor items (the Brizo SmartTouch faucet) show an "Artesanal" tag as if handmade, throughout the catalog. Also inconsistent wording ("Artesanal" versus "Artisanal").
**What's happening:** Likely a fallback. When a product's brand is blank or unrecognized (the brand audit blanked junk brands like Amazon, Build, All), the product appears to get bucketed as "artisanal." So real vendor products with a missing brand fall through to the artisan tag.
**Fix:** Locate the tag logic and restrict the "artisanal" label to actual CC maker lines (Mistoa, copper, stone, bronze) rather than "any product without a recognized brand." Standardize EN and ES wording. Depends on Roger telling us which products legitimately count as artisanal (Q5).
**Effort:** M.

### #9. PDP: kill the sticky floating ovals and remove the in-stock badge
**Reported:** The sticky orange oval ("1 artículo, Ver lista") and black oval ("Soltar PDF de especificación") are annoying, put them in a menu bar, no sticky links. Also remove the green "EN EXISTENCIA" box overlaid on the product image.
**What's happening:** These are floating sticky elements (the project-list bar and the spec-sheet drop affordance) plus an in-stock badge composited onto the product image.
**Fix:** Move "Ver lista" and "Soltar PDF" into a normal, non-sticky action bar on the PDP. Remove the green in-stock badge from the image (the in-stock state can live as plain text near the price if still wanted).
**Effort:** M.
**Note:** the WhatsApp button (#12) is an intentional exception to "no sticky."

### #10. Multiple images / gallery on PDPs
**Reported:** "Are we making room for multiple images?"
**What's happening:** The product data model already carries a `gallery` field (`gallery?: string[]` in `products-mapping.ts`), so the data side partially exists. The question is whether the PDP UI renders a true gallery versus a single image.
**Fix:** Extend the PDP image component to a proper multi-image gallery (thumbnails plus main image). Backfill gallery images where available.
**Effort:** M.

### #12. WhatsApp button to WhatsApp-green
**Reported:** Make the WhatsApp sticky button green like WhatsApp so it is more recognizable.
**What's happening:** The button is `app/components/ui/whatsapp-float.tsx`.
**Fix:** Recolor to WhatsApp green (#25D366). Keep it sticky (the one allowed exception to #9).
**Effort:** S.

### #13. Remove the "Become a Brand Partner" section
**Reported:** "DO NOT ADD A PLACE FOR VENDORS TO SOLICIT ME. I get too many."
**What's happening:** A real, wired-up feature: section component `app/components/sections/brand-partner-section.tsx`, rendered on the homepage (`app/[locale]/page.tsx`), with a working form endpoint (`app/api/brand-partner/route.ts`).
**Fix:** Remove the section from the homepage and retire the API route (and any nav or link to it).
**Effort:** S.

### #7. Portal sign-in link: visibility and open in a new window
**Reported:** Make the sign-in or portal link show up better; navigating between site and portal closes the other; both directions should open in a new window.
**What's happening:** The portal to website link in the sidebar footer already uses `target="_blank"` (new tab). The website to portal link is the "key" icon in the site header, which is low-visibility and likely same-tab.
**Fix:** Make the header key or portal link more visible and legible (label it, or style it clearly) and set it to open in a new tab. Confirm both directions open new tabs.
**Effort:** S.

---

# Workstream B: Portal navigation and discoverability

### #5 and #17. "Where do captured leads show for the team?" and "Can't find Jake Johnson 3rd"
**Reported:** The site captures every lead and alerts the team, but where does the team see them? And after filling the Quick-Capture form (test lead "Jake Johnson 3rd"), Roger cannot find it.
**What's happening:** A Leads page already exists (`(portal)/leads/page.tsx`), and the Quick-Capture form appends to a Google "Leads" sheet (`appendRowByHeader("Leads", ...)`), independent of the Odoo sync, so "Jake Johnson 3rd" almost certainly saved fine. The problem is the Leads page is buried under the collapsed "More" menu, so Roger never sees it.
**Fix:** Surface Leads in the main sidebar nav (out of "More"), confirm the captured lead appears there, and make the "we alert the team automatically" path obvious. Tie the homepage-button source tracking into the Leads view so each lead shows where it came from.
**Effort:** S-M.

### #6. No "Quotes" in the portal nav
**Reported:** "You have Orders, Invoices but I don't see Quotes, how do I get to Quotes?"
**What's happening:** A quote concept exists (Pipeline deals plus a quote print view at `quotes/[dealId]/print`), and quotes currently live inside the Orders screen (the "Orders and Quotes" page). But there is no dedicated Quotes nav item.
**Fix:** Add a clear Quotes entry to the main nav, either a dedicated quotes list or a featured "Orders and Quotes" with a quotes-only filter (see #14). With the portal-first direction, Quotes also gets a create flow.
**Effort:** M (more with full create).

### #16. No "+ New / Create" action (quote, customer)
**Reported:** "Where can I make a quote? Add a customer? I thought we had a + button or NEW tab."
**What's happening:** No visible create entry points, even though Odoo write-back exists.
**Fix:** Add obvious "+ New" actions (New Quote, New Customer, New Lead, New PO) on the relevant list pages and a global "+" in the header. With the portal-first direction this is a priority, not a later phase.
**Effort:** M-L.

---

# Workstream C: Portal Quotes / Orders list and "Today" cards

### #14. Orders and Quotes: no quotes-only view, "757" card not clickable, status dropdown does not filter, list stale
**Reported:** Where can I see quotes only? The "757 Open Quotes" card is not clickable, the dropdown does not filter, and the list is stale. Plus the Amber/API-key question.
**What's happening:** The stale list and API question are the P0 sync issue. The filtering issues are real UI bugs.
**Fix:** Make each stat card a clickable filter; fix the broken invoice-status dropdown; add a quotes-only view (ties to #6). Restore data via the sync fix.
**Effort:** M plus the P0 fix.

### #15. Rework the four stat cards and default sort
**Reported:** "This should be QUOTES, SALES, INVOICES. Not sure what 'Confirmed' means, 'stale quotes' is not a thing. The first thing I want to see is the last quote or sales order made."
**What's happening:** The cards read OPEN QUOTES / CONFIRMED / TO INVOICE / STALE QUOTES, and the list default sort is not newest-first.
**Fix:** Restructure to three cards, QUOTES / SALES / INVOICES, dropping "Confirmed" and "Stale Quotes." Default the list to newest-first.
**Effort:** S-M.

### #26. "States" to "Status" (correct terminology)
**Reported:** "Stick to correct industry lingo. Don't use 'states,' it is STATUS."
**What's happening:** The filter is labeled "All states."
**Fix:** Rename to "All statuses" (and "Status" column headers), sweep for other mislabeled terms. Also remove the "Stale only" toggle per #15.
**Effort:** S.

---

# Workstream D: Portal detail pages (Order / Quote / PO / SO)

### #22. PO detail page (PO1305): several fixes
**Reported:** What is the truck icon for? PO number needs to be larger. PDF download does not work. No product images on POs. Date layout is wrong, start with DAY/MONTH/YEAR.
**Fix:** Clarify or remove the truck icon (or add a tooltip); enlarge the PO number; fix the PDF download or generation; add product images to line items; format dates as DD/MM/YYYY (see cross-cutting).
**Effort:** M.

### #23. Sales Order detail (SO1781): Notes to Terms, client preview, create from dashboard
**Reported:** "NOTES is truncated, and it's not a Note, it's our Terms and Conditions and is important. I don't know what the client sees. Is there any way to make a sales order from the new dashboard? This is only old info from Odoo."
**Fix:** Relabel "Notes" to Terms and Conditions and show the full text (expandable, not truncated); add a "preview what the client sees" view; build create-from-dashboard (portal-first direction); restore data via the sync fix.
**Effort:** M (Terms and preview); create is part of the portal build.

### #24. Quote resend / email flow is clunky
**Reported:** Why "Send via Gmail" AND a secondary "email" option? What does the email or mailto button do? And why the Tip telling me to download the PDF then attach it manually?
**What's happening:** The send dialog (`app/(dashboard)/components/send-dialog.tsx`) offers Send via Gmail, mailto, Copy, and WhatsApp, and instructs the user to download and attach the PDF by hand.
**Fix:** Auto-attach the quote PDF to the send so the Tip disappears. Clarify or consolidate the send options (one primary "Send," secondary options clearly labeled, or remove mailto).
**Effort:** M.

### #25. Add PAID and DELIVERED statuses
**Reported:** "Confirmed, Invoiced, how about 2 more: PAID, DELIVERED."
**Fix:** Extend the order lifecycle and badges to include PAID and DELIVERED (sourced from Odoo payment and delivery state during the transition).
**Effort:** S-M.

---

# Workstream E: Portal Contacts / Vendors / Customers and multi-company

### #18. Three real lists: full Contacts, separate Vendors, separate Customers
**Reported:** "Under Customers and under Contacts there's an option to search vendors?? Contacts has no information. We need a full Contacts list, a separate Vendor list, and a separate Customers list, Contacts should include shippers, landlord, you, etc."
**What's happening:** Customers, Contacts, and Vendors pages exist but overlap confusingly (a Vendors filter sits inside Customers and Contacts), and Contacts looks empty (partly the P0 sync).
**Fix:** Establish three distinct lists: Contacts as a complete people directory (customers, vendors, shippers, landlord, internal team), Vendors standalone, Customers standalone. Remove the cross-pollinating Vendors filter from Customers and Contacts.
**Effort:** M-L.
**Open question:** source Contacts from Odoo, the Google Sheet, or both merged?

### #19. Odoo Purchase screen (native): sort, company switch, create PO
**Reported:** PO list should show the last PO or draft first; where do we switch companies; no "+ Create PO" button.
**What's happening:** This screenshot is native Odoo, not the portal. With the portal-first direction, the goal is to bring PO creation, sorting, and company selection into the portal so Roger does not open raw Odoo.
**Fix:** In the portal Purchases page: default newest-first, add a Create PO action, and surface company selection.
**Effort:** M.

### #20. "Draft = RFQ" terminology, Odoo parity, LLC versus CC column
**Reported:** A draft is generally an RFQ. Can you make it look and work more like Odoo? Is it flushing the LLC and CC together? It needs a column to show whether it is ordered from the LLC or CC.
**Fix:** Relabel draft to RFQ; add a company column (LLC / CC) to purchase and order lists; align the purchase view more closely with Odoo's layout.
**Effort:** M.

### #21. CC orders mis-tagged as "LLC"
**Reported:** Things ordered from CC show an "LLC" tag at the top (company attribution is wrong).
**Fix:** Correct the company-attribution logic so CC purchases and orders show CC, not LLC. Validate against a known CC order.
**Effort:** S-M.
**Open question:** exact entity labels (Q7).

---

# Workstream F: Search (BIG ROCK #2 — investigate and rebuild)

**Reported (owner):** search "needs to be spot on and exact, right now it feels broken." This spans every touch point: storefront hero search, catalog search, the global command palette, the dashboard product search, the product search inside the New Quote builder, and visual search.

### Touch-point map (dissected 2026-05-24)

| # | Touch point | File | Relevance engine | Backend | Dataset |
| --- | --- | --- | --- | --- | --- |
| 1 | Storefront hero search | `app/[locale]/shop/hero-search.tsx` | none — form only | navigates to `/shop/catalog?q=` | — |
| 2 | Catalog search input | `app/components/sections/catalog-search-input.tsx` | none — form only | navigates to `/shop/catalog?q=` | — |
| 3 | Catalog results | `app/[locale]/shop/catalog/catalog-view.tsx` | `scoreNormalized` (server) | `/api/products/search` → `searchProducts` | full product snapshot |
| 4 | Storefront command palette | `app/components/search/search-palette.tsx` | **MiniSearch** (brands+articles, `combineWith: "AND"`) **+** `scoreNormalized` for products | `/api/search-index` + `/api/products/search` | ~163 brand/article docs + full catalog |
| 5 | Dashboard ⌘K palette | `app/(dashboard)/components/command-palette.tsx` → `app/lib/search.ts` `searchAllEntities` | **`scoreTokens`** for leads/deals/traficos/shipments/brands/blog; **position-only** for products | `/api/dashboard/*` + `/api/dashboard/products/search` | CRM lists + full catalog |
| 6 | Dashboard product list | `app/(dashboard)/dashboard/(portal)/products/catalog-search.tsx` | `scoreNormalized` (server) | `/api/dashboard/products/search` → `searchProducts` | full catalog |
| 7 | New Quote builder product search | `app/(dashboard)/dashboard/(portal)/orders/new/page.tsx` | `scoreNormalized` (server) | `/api/dashboard/products/search?sale=true` | full catalog |
| 8 | Reusable product picker | `app/(dashboard)/components/product-picker.tsx` | `scoreNormalized` (server) | `/api/dashboard/products/search` | full catalog |
| 9 | Visual search | `app/components/visual-search-modal.tsx` | image/attribute match | `/api/products/visual-search` | (separate) |

### What's actually true (corrects the original hypotheses)

- **Product relevance is already on one core.** Both product routes (`app/api/products/search/route.ts` and `app/api/dashboard/products/search/route.ts`) are thin wrappers over the **same** `searchProducts` in `app/lib/products-full.ts`, hitting the **same** snapshot. They differ only in param defaults (limit, `active`/`sale` filters, facets/signals). So the "two product backends with different logic" is really one shared core — good, less fragmentation than feared.
- **MiniSearch never touches products.** It only indexes ~163 brand + article docs for the storefront palette (`search-index.ts` deliberately excludes the catalog). The catalog uses `searchProducts`, not MiniSearch.
- **Diacritics are handled.** `normalize()` does NFD-strip + lowercase, so "banté"→"bante", "grifo" works. Not a bug.

### The real causes results feel wrong

1. **Two palettes, two engines, two scales.** Storefront palette = MiniSearch (AND). Dashboard ⌘K = `scoreTokens` (OR). Brands are searched by *both* engines depending on palette. The two scoring scales aren't comparable, so cross-type ranking in ⌘K is effectively arbitrary.
2. **Products in ⌘K are scored by position, not relevance** (`search.ts` `searchProducts`: `score = 50 − idx*4`). A perfectly-matching product can't outrank a weakly-matching lead.
3. **The index covers only `sku` / `name` / `brand`.** Descriptions, features, category, and finishes are NOT indexed. Searching a descriptive or feature term (e.g. a Spanish category word, a finish, a feature) returns nothing even when products clearly match — a major "feels broken" cause.
4. **Multi-word is OR, not AND.** `scoreTokens` / `scoreNormalized` sum per-token bests; a token that matches nothing just adds 0, so junk tokens never narrow results. MiniSearch (storefront palette) uses AND. Inconsistent semantics.
5. **SKU tokenization ignores hyphens/dots.** `normalize` keeps "K-13448-CP" as one token; a mid-SKU fragment ("13448") matches only via substring (lowest score) and can't be a prefix/exact hit. No SKU-part awareness for `1L1A55CDLHTWB`-style codes.
6. **Stale scoring comment** in `products-full.ts` (a 100/80/60 scheme) no longer matches the actual `scoreNormalized` weights — maintainer confusion.

### Mandate / solution direction

Unify on **one well-tuned relevance core** used by every touch point (website + dashboard + quote builder): extend the product matcher to index a richer field set (sku + SKU-parts, name, brand, category, finishes, and a description/feature token field), apply AND-biased multi-word matching with exact-match boost and consistent field weighting, and replace the ⌘K position-only product score with the real relevance score on one shared scale. Keep it efficient (snapshot built once and reused, debounced inputs, fast lookups). Then **prove it**: expand `app/lib/search-utils.test.ts` into a real relevance suite that pins the exact expected top results for representative queries (exact SKU, partial SKU with hyphens, brand prefix, accented Spanish, multi-word AND, finish/feature term) so "spot on" is verifiable and cannot regress. Validate the quote-builder product search specifically, since slow or wrong results there cost sales.
**Status:** ✅ Shipped and live (commit `c41410a`, 2026-05-24). Product relevance is unified on one tuned core (`scoreProduct` in `search-utils.ts`, used by `searchProducts` and both API routes), with `_skuParts`/`_cat`/`_finishes`/`_desc` index fields, AND-semantics multi-word, SKU-part tokenization, and whole-query exact-match boost. The dashboard ⌘K now scores products by real relevance on the same scale as other entities (no more position-only). Behavior is pinned by a relevance suite in `search-utils.test.ts`. Verified independently against the live `scoreProduct` (exact/partial/joined SKU, brand precision, AND exclusion, diacritics, finish/category fields). Remaining: a live quote-builder spot-check (needs dashboard login).

---

## Cross-cutting fixes (do once, resolves several items)

- **Date format to DD/MM/YYYY** across the portal (one shared formatter). Touches #22 and every order, SO, and PO screen. S
- **Default sort newest-first** on list views (#15, #19). S
- **Terminology pass** in one go: Status not States (#26), RFQ not Draft (#20), add Paid and Delivered (#25). S-M
- **Multi-company:** consistent LLC and CC tag, column, and correct attribution (#19, #20, #21). M
- **Sidebar reorg:** surface Leads, Quotes, Pipeline out of "More" (#5, #6, #17). S

---

## Quick wins (can ship in about a day, low risk)

#1 (catalog number), #12 (WhatsApp green), #13 (remove Brand Partner), #26 (Status wording), #25 label, #9 (remove green badge), #3 (A to Z flagship), #7 (sign-in link), global date format, sidebar reorg to surface Leads and Quotes.

---

## Suggested sequencing (current)

Phases 0–4 have shipped, including both big rocks' builds. ✅ Done: sync fix, quick wins, the New Quote/Customer/Lead/PO create flows, search rebuild (Workstream F), the descriptions infrastructure + blank-description build guard, and the CC/R&F relabel. What remains, in order:

1. **Product descriptions — copy (#4):** regenerate the artisan lines (gated on Anthropic credits), scan, human-review `CC-Copy-Review.xlsx`, run step 14 to publish; then the retroactive review of the ~570 already-live AI entries. Highest-value remaining work.
2. **#8 cross-cutting polish:** the internal `"llc"`→`"rf"` rename (low value, deferred) and any leftover Workstream D detail items.

There is no accounting/fiscal migration phase — Odoo stays as the system of record (Correction A).

---

## Open questions for Roger — ANSWERED (do not re-ask)

1. **Maker names:** Mistoa, Familia Meza, Castro, Manriquez. ✅ Applied.
2. **The old bronze "Santiago" line:** that placeholder is **Manriquez**. ✅ The invented personas were fake and removed.
3. **Individual makers / mismatched artisan sections:** credited at the maker-line level via the four names above; fabricated profiles are gone. ✅
4. **Mismatched artisan sections:** resolved via #2/#3. ✅
5. **Artesanal tag:** only those four maker lines carry it. ✅ (`ARTISAN_BRANDS` in `products-mapping.ts`.)
6. **Clickthrough:** artisan cards link to the maker's filtered products. ✅ Built.
7. **Company entities:** the two are **CC and R&F** (not "LLC"). ✅
8. **Product descriptions:** every product gets a description, AI-drafted then human-reviewed before going live. ✅ Direction set (see #4).
9. **Odoo seats:** keep all current seats active. ✅
10. **Odoo phase-out:** not happening — Odoo is kept as the system of record (Correction A). ✅

**Only remaining (non-blocking) confirmation:** are the homepage artisan-origin details accurate — copper from Santa Clara del Cobre, stone from Querétaro, Mistoa ceramics from Guanajuato, designed by Roger Williams?
