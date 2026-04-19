# Phase 2 — Atomic TDD Task Plan (⌘K + Notifications)

> Companion to: `2026-04-19-dashboard-redesign-phase2.md` (the spec)
> Authored: 2026-04-19, after Joshua answered Q1–Q7

---

## 0. Locked decisions (from open questions)

| Q | Decision | Implication |
|---|---|---|
| 1 | 7 entity types in ⌘K (defer Contact) | Search lib supports: Lead / Deal / Trafico / Shipment / Brand / Product / Blog post |
| 2 | Defer modifiers to Phase 3 | Pure fuzzy match in v2 |
| 3 | **Option B — `Notifications` sheet** (9 cols + `acked_at` = 10) | Schema explicitly approved. Writers + reader live in `app/lib/notifications.ts` |
| 4 | 3 severity tiers | `critical` / `high` / `normal` |
| 5 | Ack only | `status` enum = `unread` \| `acked`. Snooze/dismiss → Phase 3 |
| 6 | Same 3 active sources as `<NeedsYou>` | customs holds (Trafico_Events) / overdue follow-ups (Leads.next_followup) / shipment delays ≥3d (Traficos). Deal_Payments deferred. |
| 7 | localStorage for ⌘K recent items | `cc_palette_recent`, last 5, wiped on Sign Out |

---

## 1. Architecture (the spine)

### 1.1 ⌘K search

```
app/lib/search.ts                    ← NEW — single search API
  searchAllEntities(q): Promise<SearchResult[]>
    fetches in parallel:
      /api/dashboard/leads
      /api/dashboard/pipeline
      /api/dashboard/traficos
      /api/dashboard/shipments
      /api/dashboard/brands
      /api/dashboard/products?q=
      /api/dashboard/blog-posts (or articles lib)
    normalizes, scores by relevance, returns top 50
    in-memory cache (60s) keyed by entity-list snapshot

app/(dashboard)/components/command-palette.tsx  ← REFACTOR
  - drop SAMPLE_LEADS + SAMPLE_PIPELINE imports
  - swap doc + product effects for single searchAllEntities call
  - add Recent section (top 5 from localStorage cc_palette_recent)
  - keyboard nav stays (already wired)
```

**Why client-side fetch + filter**: total entity row count < ~350 (Leads ~31, Deals ~15, Traficos ~50, Shipments ~50, Brands ~73, Products has its own server filter, Blog ~20). Cheaper than building a `/api/search` route now; revisit if perf bites.

### 1.2 Notifications

```
app/lib/notifications.ts             ← NEW
  Notification type (10 cols including acked_at)
  syncNotificationsFromSources(): runs the 3 source aggregators,
    upserts into Notifications sheet using deterministic notification_id
    (e.g. "trafico-EVT-12345", "lead-LEAD-204", "shipment-TRF-118")
    60s in-memory throttle
  listNotifications({ status?, audience?, severity?, source?, limit? })
  ackNotification(notification_id): flips status → 'acked', sets acked_at

app/api/dashboard/notifications/route.ts  ← NEW
  GET ?status=...&severity=...  → triggers sync, returns Notification[]
  POST { action: 'ack', id }   → flips status

app/api/dashboard/needs-you/route.ts  ← REFACTOR
  triggers sync, then listNotifications({ status:'unread', limit:8 })
  maps Notification → existing NeedsYouItem shape (preserves widget)
  → both bell and <NeedsYou> share the same data, no drift

app/(dashboard)/components/notification-bell.tsx  ← NEW
  badge count + severity dot color + flyout (last 10)
  60s auto-refresh
  click row → ack + navigate to source entity

app/(dashboard)/dashboard/(portal)/notifications/page.tsx  ← NEW
  full timeline with filter chips, ack button per row
```

### 1.3 Deterministic notification IDs

| Source | `notification_id` format | Dedupe behavior |
|---|---|---|
| Customs hold | `trafico-${event_id}` | Same event = same ID = no duplicate, ever |
| Overdue follow-up | `lead-${lead_id}` | One notification per lead; resolves when lead status → won/lost/closed |
| Shipment delay | `shipment-${trafico_id}` | One per trafico; resolves when Completed_Date or Domestic_Actual_Arrival is set |

This replaces the spec's "1h dedupe by (type, id, severity)" with a stronger guarantee — same source item can never produce two notifications, regardless of how often sync runs.

---

## 2. Deviation from spec (flagged upfront)

**Spec §3.1** says "Each result is an `<EntityCard variant="search">` mini." After reading `app/(dashboard)/components/entity-card.tsx`, the existing card is a multi-row primitive (id+value, title, contact, chips, status, SLA bar) — wrong shape for a single-line search row. Adding a `search` variant would either (a) bloat EntityCard with conditional rendering or (b) render an entirely different shape under the same name (confusing).

**Resolution**: keep the search-row rendering inline in `command-palette.tsx`, using the same `dash-*` tokens for visual consistency. EntityCard stays single-purpose. I'll note this in the execution log.

If you want me to add the variant anyway (so all entity rendering routes through one component), say so before T2 — happy to.

---

## 3. Tasks — atomic, TDD-first

Convention: each task = one commit. Steps are 2-5 min each. Every step has exact paths + verification commands. Typecheck runs after each task with `npx tsc --noEmit 2>&1 | grep -v "routes\.d \[" | head -50`.

---

### Task 1 — `app/lib/search.ts` (live cross-entity search)

**Goal**: one library call returns scored, deduped results across 7 entity types from live APIs. Round-trip test passes.

**Files touched**:
- `app/lib/search.ts` (new)
- `scripts/_test-search.ts` (new)

**Steps**:

1. **Write the failing round-trip test first** — `scripts/_test-search.ts`:

   ```ts
   /**
    * Round-trip test: searchAllEntities pulls live data across 7 entity
    * types, scores by relevance, returns SearchResult[].
    *
    * Run: npx tsx scripts/_test-search.ts
    *
    * NOTE: this hits the dev server (must be running at port 3000) for
    * the same /api/dashboard/* endpoints the palette uses in production.
    */
   import { config } from "dotenv";
   import { resolve } from "path";
   config({ path: resolve(process.cwd(), ".env.local") });

   const main = async () => {
     const { searchAllEntities } = await import("../app/lib/search");

     console.log("→ searchAllEntities('') — empty query returns []");
     const empty = await searchAllEntities("");
     if (empty.length !== 0) throw new Error(`empty query should return [], got ${empty.length}`);

     console.log("→ searchAllEntities('a') — short query (< 2 chars) returns []");
     const short = await searchAllEntities("a");
     if (short.length !== 0) throw new Error(`single-char query should return [], got ${short.length}`);

     console.log("→ searchAllEntities('kohler') — should hit Brand or Product");
     const kohler = await searchAllEntities("kohler");
     console.log(`  got ${kohler.length} results`);
     if (kohler.length === 0) throw new Error("kohler search returned 0 — expected ≥1 brand or product");
     const types = new Set(kohler.map((r) => r.type));
     console.log(`  result types: ${[...types].join(", ")}`);

     console.log("→ result shape sanity");
     const first = kohler[0];
     for (const k of ["id", "type", "title", "href"] as const) {
       if (typeof first[k] !== "string") throw new Error(`result.${k} not a string: ${JSON.stringify(first[k])}`);
     }

     console.log("\n✅ search.ts round-trip OK");
   };

   main().catch((e) => {
     console.error("\n❌ FAILED:", e?.message || e);
     process.exit(1);
   });
   ```

2. **Verify red**: `npx tsx scripts/_test-search.ts` should fail with module-not-found (search.ts doesn't exist yet).

3. **Implement `app/lib/search.ts`** (minimal, single file):

   ```ts
   /**
    * Live cross-entity search. Powers the ⌘K command palette.
    *
    * Fetches from existing /api/dashboard/* endpoints in parallel,
    * normalizes to SearchResult[], scores by relevance (title > id > description),
    * caches each entity-list for 60s in-memory.
    */

   export type SearchResultType =
     | "lead"
     | "deal"
     | "trafico"
     | "shipment"
     | "brand"
     | "product"
     | "blog";

   export interface SearchResult {
     id: string;
     type: SearchResultType;
     title: string;
     subtitle: string;
     href: string;
     score: number;
   }

   const CACHE_TTL_MS = 60_000;
   type CacheEntry<T> = { at: number; data: T };
   const cache: Record<string, CacheEntry<unknown>> = {};

   const cachedFetch = async <T>(key: string, url: string): Promise<T> => {
     const hit = cache[key];
     if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data as T;
     const res = await fetch(url, { credentials: "same-origin" });
     if (!res.ok) throw new Error(`${url} → ${res.status}`);
     const data = (await res.json()) as T;
     cache[key] = { at: Date.now(), data };
     return data;
   };

   const score = (q: string, ...fields: (string | undefined)[]): number => {
     const ql = q.toLowerCase();
     let s = 0;
     fields.forEach((f, i) => {
       if (!f) return;
       const fl = f.toLowerCase();
       if (fl === ql) s += 10;
       else if (fl.startsWith(ql)) s += 5 - i;
       else if (fl.includes(ql)) s += 3 - i;
     });
     return s;
   };

   const searchLeads = async (q: string): Promise<SearchResult[]> => {
     try {
       const data = await cachedFetch<{ leads?: Array<Record<string, string>> }>(
         "leads",
         "/api/dashboard/leads"
       );
       return (data.leads ?? [])
         .map((l) => {
           const s = score(q, l.name, l.email, l.phone, l.company, l.brand_slugs);
           if (s === 0) return null;
           return {
             id: `lead-${l.id}`,
             type: "lead" as const,
             title: l.name || l.email || l.id,
             subtitle: [l.status, l.source, l.email].filter(Boolean).join(" · "),
             href: `/dashboard/leads`,
             score: s,
           };
         })
         .filter((x): x is SearchResult => x !== null);
     } catch {
       return [];
     }
   };

   // analogous: searchDeals, searchTraficos, searchShipments, searchBrands,
   // searchProducts (uses ?q= server-side), searchBlogPosts

   export const searchAllEntities = async (
     query: string
   ): Promise<SearchResult[]> => {
     if (query.trim().length < 2) return [];
     const q = query.trim();

     const groups = await Promise.all([
       searchLeads(q),
       searchDeals(q),
       searchTraficos(q),
       searchShipments(q),
       searchBrands(q),
       searchProducts(q),
       searchBlogPosts(q),
     ]);

     return groups
       .flat()
       .sort((a, b) => b.score - a.score)
       .slice(0, 50);
   };
   ```

   *(I'll write the analogous `searchDeals` / `searchTraficos` / `searchShipments` / `searchBrands` / `searchProducts` / `searchBlogPosts` using the same pattern — full code goes in the file, no placeholders.)*

4. **Identify each entity API's response shape** before writing each searcher:
   - `curl -s http://localhost:3000/api/dashboard/leads | head -c 500` (reads cookie? — likely auth-gated, so first verify via browser request copy or skip, fetch via the lib's same-origin in dev)
   - Each searcher reads the shape; pick canonical title + subtitle fields.

5. **Verify green**: `npx tsx scripts/_test-search.ts` — must print `✅ search.ts round-trip OK`.

6. **Typecheck**: `cd /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures && npx tsc --noEmit 2>&1 | grep -v "routes\.d \[" | head -50` — zero errors.

7. **Commit**:
   ```
   feat(search): live cross-entity search lib (replaces SAMPLE_* in palette)

   New app/lib/search.ts with searchAllEntities(q) — parallel fetch
   across Leads / Pipeline / Traficos / Shipments / Brands / Products /
   Blog, scored by title > id > description, 60s in-memory cache per
   entity list. Returns top 50 results.

   Round-trip test scripts/_test-search.ts asserts non-empty result
   for "kohler" and shape sanity (id, type, title, href).

   Task 1 of 6 in the Phase 2 plan
   (docs/superpowers/specs/2026-04-19-dashboard-redesign-phase2-plan.md).

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   ```

**Verification commands (re-run before commit):**
- `npx tsx scripts/_test-search.ts` → exit 0, prints ✅
- `npx tsc --noEmit 2>&1 | grep -v "routes\.d \[" | head -20` → empty
- `git status` → only `app/lib/search.ts` and `scripts/_test-search.ts` (and the plan doc) staged

---

### Task 2 — CommandPalette refactor (drop SAMPLE_*, use live data, add recent items)

**Goal**: ⌘K now searches 7 live entity types via `searchAllEntities`. Recent-items section (top 5 from localStorage). Zero SAMPLE_* imports.

**Files touched**:
- `app/(dashboard)/components/command-palette.tsx` (refactor)

**Steps**:

1. **Read the current file in full** (already done in planning — 519 lines, drop lines 26 + 108-138 entirely; `useState/useEffect/useRef/useMemo` keep).

2. **Plan the surgical edits**:
   - Remove import: `import { SAMPLE_LEADS, SAMPLE_PIPELINE } from "@/app/lib/sample-dashboard-data";`
   - Replace `SearchItem` with new shape that wraps `SearchResult` from the lib + `pageItems` (pages stay local).
   - Drop `buildSearchItems()` — no more sample data.
   - Add new effect: when `query.length >= 2`, call `searchAllEntities(query)` → set `searchResults` state.
   - Add Recent section: read `localStorage.getItem("cc_palette_recent")` on mount, show top 5 when query is empty.
   - On navigate, write the visited result to localStorage (cap 5, dedupe).
   - Render: pages section + recent section (when empty) + results sections grouped by type (when query present).

3. **Make the edit** — single Edit tool call replacing the imports + `buildSearchItems` + the two existing useEffects with one new useEffect that calls `searchAllEntities`. Preserve product `productData` flow (CommandPalette has a special "insert product into doc" mode used by the document generator — see `onProductInsert` prop, lines 357-365).

   *Critical: don't break the product-insert mode.* Products from `searchAllEntities` need `productData` attached so Tab key still inserts. Strategy: `searchProducts` in the lib returns `SearchResult` with an optional `productData` field; CommandPalette unwraps it for the insert path.

4. **Add localStorage helpers (inside CommandPalette)**:
   ```ts
   const RECENT_KEY = "cc_palette_recent";
   const RECENT_CAP = 5;

   const getRecent = (): SearchResult[] => {
     if (typeof window === "undefined") return [];
     try {
       const raw = window.localStorage.getItem(RECENT_KEY);
       return raw ? (JSON.parse(raw) as SearchResult[]) : [];
     } catch {
       return [];
     }
   };

   const pushRecent = (item: SearchResult) => {
     if (typeof window === "undefined") return;
     const current = getRecent().filter((r) => r.id !== item.id);
     const next = [item, ...current].slice(0, RECENT_CAP);
     window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
   };
   ```

5. **Typecheck**: `npx tsc --noEmit 2>&1 | grep -v "routes\.d \[" | head -20` — zero errors.

6. **Browser preview verification** (Claude Preview MCP):
   - `mcp__Claude_Preview__preview_start` (if not running)
   - Navigate to `/dashboard/overview`, log in if needed
   - `mcp__Claude_Preview__preview_eval` → `document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))` (or use ⌘K shortcut)
   - `mcp__Claude_Preview__preview_fill` the search input with `"kohler"`
   - `mcp__Claude_Preview__preview_snapshot` → confirm at least 1 result row visible, grouped under "Brands" or "Products"
   - `mcp__Claude_Preview__preview_click` on the first result
   - Reopen palette → confirm Recent section now contains the clicked item
   - `mcp__Claude_Preview__preview_console_logs` → no errors

7. **Verify Sign-Out wipes localStorage**: read existing sign-out handler (likely in `sidebar.tsx`), add `localStorage.removeItem("cc_palette_recent")` next to whatever clears chat history. (If chat history isn't cleared on sign-out either, leave a TODO and document — the spec assumed they were paired.)

8. **Commit**:
   ```
   feat(search): CommandPalette v2 — live data, recent items, 7 entity types

   Drops SAMPLE_LEADS + SAMPLE_PIPELINE imports (last sample-data
   refs in dashboard). Swaps the doc + product fetches for one
   searchAllEntities() call from the new lib.

   Adds Recent section (top 5 from localStorage cc_palette_recent,
   wiped on Sign Out). Preserves the product-insert mode (Tab key
   still inserts a product into open document).

   Task 2 of 6.

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   ```

**Verification commands (re-run before commit):**
- `grep -r "SAMPLE_LEADS\|SAMPLE_PIPELINE" app/(dashboard)/components/command-palette.tsx` → empty (zero matches)
- `npx tsc --noEmit 2>&1 | grep -v "routes\.d \[" | head -20` → empty
- Browser preview: ⌘K opens, "kohler" returns results, click → Recent populates

---

### Task 3 — Notifications sheet + lib + writers + reader (Option B)

**Goal**: `Notifications` sheet exists with the approved 10-column schema. `app/lib/notifications.ts` provides `appendNotification`, `listNotifications`, `ackNotification`, `syncNotificationsFromSources`. Round-trip test passes. `/api/dashboard/needs-you` refactored to read from the sheet (so bell + Today's `<NeedsYou>` share data).

**Files touched**:
- `scripts/_create-notifications-sheet.ts` (new — one-shot scaffolding)
- `app/lib/notifications.ts` (new)
- `app/api/dashboard/notifications/route.ts` (new)
- `app/api/dashboard/needs-you/route.ts` (refactor)
- `app/lib/dashboard-sheets.ts` (add `"Notifications"` to the `SheetTab` union)
- `scripts/_test-notifications.ts` (new round-trip test)

**Steps**:

1. **Add `"Notifications"` to `SheetTab` union** in `app/lib/dashboard-sheets.ts:21-52` — single Edit appending it after `"Trafico_Events"`.

2. **Write the sheet scaffolding script** — `scripts/_create-notifications-sheet.ts`:

   ```ts
   /**
    * One-shot script: creates the Notifications tab in the CRM Sheet
    * with the approved 10-column header.
    *
    * Run once: npx tsx scripts/_create-notifications-sheet.ts
    *
    * Idempotent: if the tab already exists, exits 0 with a message.
    */
   import { config } from "dotenv";
   import { resolve } from "path";
   config({ path: resolve(process.cwd(), ".env.local") });

   import { google } from "googleapis";

   const HEADERS = [
     "notification_id",
     "severity",
     "audience",
     "title",
     "body",
     "source_entity_type",
     "source_entity_id",
     "status",
     "created_at",
     "acked_at",
   ];

   const main = async () => {
     const auth = new google.auth.GoogleAuth({
       credentials: {
         client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
         private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
       },
       scopes: ["https://www.googleapis.com/auth/spreadsheets"],
     });
     const sheets = google.sheets({ version: "v4", auth });
     const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

     const meta = await sheets.spreadsheets.get({ spreadsheetId });
     const exists = meta.data.sheets?.some((s) => s.properties?.title === "Notifications");
     if (exists) {
       console.log("✓ Notifications tab already exists — nothing to do");
       return;
     }

     await sheets.spreadsheets.batchUpdate({
       spreadsheetId,
       requestBody: { requests: [{ addSheet: { properties: { title: "Notifications" } } }] },
     });

     await sheets.spreadsheets.values.update({
       spreadsheetId,
       range: "Notifications!A1",
       valueInputOption: "USER_ENTERED",
       requestBody: { values: [HEADERS] },
     });

     console.log(`✓ Created Notifications tab with ${HEADERS.length} columns`);
   };

   main().catch((e) => {
     console.error("❌ FAILED:", e?.message || e);
     process.exit(1);
   });
   ```

3. **Run the scaffolding**: `npx tsx scripts/_create-notifications-sheet.ts` → expect either `✓ Created…` or `✓ already exists`.

4. **Write the failing round-trip test first** — `scripts/_test-notifications.ts`:

   ```ts
   /**
    * Round-trip test: appendNotification → listNotifications → ackNotification.
    * Leaves a __TEST__-prefixed row in the sheet.
    *
    * Run: npx tsx scripts/_test-notifications.ts
    */
   import { config } from "dotenv";
   import { resolve } from "path";
   config({ path: resolve(process.cwd(), ".env.local") });

   const main = async () => {
     const { appendNotification, listNotifications, ackNotification } = await import(
       "../app/lib/notifications"
     );

     const testId = `__TEST__-${Date.now()}`;
     console.log(`→ appendNotification (${testId})`);
     const written = await appendNotification({
       notification_id: testId,
       severity: "high",
       audience: "roger",
       title: "Test notification from round-trip script",
       body: `created at ${new Date().toISOString()}`,
       source_entity_type: "trafico",
       source_entity_id: "__TEST__",
     });
     if (written.notification_id !== testId) throw new Error("notification_id mismatch");
     if (written.status !== "unread") throw new Error("default status should be 'unread'");

     console.log("→ listNotifications({ status: 'unread' })");
     const unread = await listNotifications({ status: "unread" });
     const found = unread.find((n) => n.notification_id === testId);
     if (!found) throw new Error(`round-trip read missed ${testId}`);
     console.log(`  ✓ found in ${unread.length} unread`);

     console.log(`→ ackNotification(${testId})`);
     await ackNotification(testId);

     console.log("→ listNotifications({ status: 'unread' }) — should not include testId");
     const after = await listNotifications({ status: "unread" });
     if (after.find((n) => n.notification_id === testId))
       throw new Error("ack did not flip status");
     console.log(`  ✓ ack flipped status correctly`);

     console.log("→ listNotifications({ status: 'acked' }) — should include testId");
     const acked = await listNotifications({ status: "acked" });
     const ackedRow = acked.find((n) => n.notification_id === testId);
     if (!ackedRow) throw new Error("acked row missing from acked list");
     if (!ackedRow.acked_at) throw new Error("acked_at should be set after ack");

     console.log("\n✅ Notifications round-trip OK");
   };

   main().catch((e) => {
     console.error("\n❌ FAILED:", e?.message || e);
     process.exit(1);
   });
   ```

5. **Verify red**: `npx tsx scripts/_test-notifications.ts` → fails (lib doesn't exist).

6. **Implement `app/lib/notifications.ts`** following the `trafico-events.ts` pattern:

   ```ts
   /**
    * Notifications — Roger-facing alerts surfaced in the bell + Today widget.
    * Schema and rationale: docs/superpowers/specs/2026-04-19-dashboard-redesign-phase2.md §3
    *
    * Public surface:
    *   - appendNotification(input): upserts by deterministic notification_id
    *   - listNotifications(opts): filtered read
    *   - ackNotification(id): flips status → acked, sets acked_at
    *   - syncNotificationsFromSources(): aggregates 3 sources, upserts all
    */

   import { google } from "googleapis";
   import { appendRow, readSheet } from "./dashboard-sheets";
   import { getTraficoEvents } from "./trafico-events";

   export type NotificationSeverity = "critical" | "high" | "normal";
   export type NotificationAudience = "roger" | "finance" | "customer";
   export type NotificationStatus = "unread" | "acked";
   export type NotificationSource =
     | "trafico"
     | "lead"
     | "shipment"
     | "deal_payment";

   export type Notification = Record<string, string> & {
     notification_id: string;
     severity: NotificationSeverity;
     audience: NotificationAudience;
     title: string;
     body: string;
     source_entity_type: NotificationSource;
     source_entity_id: string;
     status: NotificationStatus;
     created_at: string;
     acked_at: string;
   };

   export interface AppendNotificationInput {
     notification_id: string;
     severity: NotificationSeverity;
     audience: NotificationAudience;
     title: string;
     body?: string;
     source_entity_type: NotificationSource;
     source_entity_id: string;
   }

   const COLUMNS: (keyof Notification)[] = [
     "notification_id",
     "severity",
     "audience",
     "title",
     "body",
     "source_entity_type",
     "source_entity_id",
     "status",
     "created_at",
     "acked_at",
   ];

   export const appendNotification = async (
     input: AppendNotificationInput
   ): Promise<Notification> => {
     // Upsert by deterministic ID — if it already exists, return it untouched
     const existing = await readSheet<Notification>("Notifications");
     const hit = existing.find((n) => n.notification_id === input.notification_id);
     if (hit) return hit;

     const row: Notification = {
       notification_id: input.notification_id,
       severity: input.severity,
       audience: input.audience,
       title: input.title,
       body: input.body ?? "",
       source_entity_type: input.source_entity_type,
       source_entity_id: input.source_entity_id,
       status: "unread",
       created_at: new Date().toISOString(),
       acked_at: "",
     };
     await appendRow("Notifications", COLUMNS.map((c) => row[c]));
     return row;
   };

   export interface ListNotificationsOpts {
     status?: NotificationStatus | "all";
     audience?: NotificationAudience;
     severity?: NotificationSeverity;
     source?: NotificationSource;
     limit?: number;
   }

   export const listNotifications = async (
     opts: ListNotificationsOpts = {}
   ): Promise<Notification[]> => {
     const all = await readSheet<Notification>("Notifications");
     const filtered = all.filter((n) => {
       if (opts.status && opts.status !== "all" && n.status !== opts.status) return false;
       if (opts.audience && n.audience !== opts.audience) return false;
       if (opts.severity && n.severity !== opts.severity) return false;
       if (opts.source && n.source_entity_type !== opts.source) return false;
       return true;
     });
     filtered.sort((a, b) => {
       const sevRank: Record<NotificationSeverity, number> = { critical: 0, high: 1, normal: 2 };
       const sa = sevRank[a.severity as NotificationSeverity] ?? 3;
       const sb = sevRank[b.severity as NotificationSeverity] ?? 3;
       if (sa !== sb) return sa - sb;
       return b.created_at.localeCompare(a.created_at);
     });
     return opts.limit ? filtered.slice(0, opts.limit) : filtered;
   };

   export const ackNotification = async (notification_id: string): Promise<void> => {
     // Find row index in sheet, update status + acked_at via direct API call.
     // (dashboard-sheets exports updateRow but it overwrites the whole row;
     //  for a 2-cell change we use sheets.values.update on a specific range.)
     const auth = new google.auth.GoogleAuth({
       credentials: {
         client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
         private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
       },
       scopes: ["https://www.googleapis.com/auth/spreadsheets"],
     });
     const sheets = google.sheets({ version: "v4", auth });
     const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

     const all = await readSheet<Notification>("Notifications");
     const idx = all.findIndex((n) => n.notification_id === notification_id);
     if (idx === -1) throw new Error(`notification not found: ${notification_id}`);

     const sheetRow = idx + 2; // +1 for header, +1 for 1-indexed
     // status is column H (8th), acked_at is column J (10th)
     await sheets.spreadsheets.values.update({
       spreadsheetId,
       range: `Notifications!H${sheetRow}:J${sheetRow}`,
       valueInputOption: "USER_ENTERED",
       requestBody: { values: [["acked", all[idx].created_at, new Date().toISOString()]] },
     });
   };

   // ---------------------------------------------------------------------------
   // Sync — aggregate from the 3 active sources, upsert into sheet.
   // 60s in-memory throttle so a busy header doesn't hammer Google Sheets.
   // ---------------------------------------------------------------------------

   const SYNC_THROTTLE_MS = 60_000;
   let lastSyncAt = 0;
   let inflight: Promise<void> | null = null;

   const HOURS = 1000 * 60 * 60;
   const DAYS = HOURS * 24;

   const aggregate = async (): Promise<AppendNotificationInput[]> => {
     const out: AppendNotificationInput[] = [];

     // Source 1: customs holds (Trafico_Events with event_type=issue_logged, > 24h old)
     try {
       const events = await getTraficoEvents();
       for (const e of events) {
         if (e.event_type !== "issue_logged") continue;
         const t = new Date(e.timestamp).getTime();
         if (Number.isNaN(t)) continue;
         const ageHours = (Date.now() - t) / HOURS;
         if (ageHours < 24) continue;
         out.push({
           notification_id: `trafico-${e.event_id}`,
           severity: ageHours >= 48 ? "critical" : "high",
           audience: "roger",
           title: `${e.trafico_id} customs issue ${Math.round(ageHours)}h old`,
           body: e.message || "",
           source_entity_type: "trafico",
           source_entity_id: e.trafico_id,
         });
       }
     } catch { /* skip */ }

     // Source 2: overdue follow-ups (Leads.next_followup < now, status not in [won, lost, closed])
     try {
       const leads = await readSheet<Record<string, string>>("Leads");
       const closed = new Set(["won", "lost", "closed"]);
       for (const l of leads) {
         if (!l.next_followup) continue;
         if (closed.has((l.status || "").toLowerCase())) continue;
         const t = new Date(l.next_followup).getTime();
         if (Number.isNaN(t) || t >= Date.now()) continue;
         const ageHours = (Date.now() - t) / HOURS;
         out.push({
           notification_id: `lead-${l.id}`,
           severity: ageHours >= 72 ? "critical" : "high",
           audience: "roger",
           title: `${l.name || l.id} follow-up overdue`,
           body: `next_followup: ${l.next_followup}`,
           source_entity_type: "lead",
           source_entity_id: l.id,
         });
       }
     } catch { /* skip */ }

     // Source 3: shipment delays (Traficos with Domestic_Est_Arrival > 3d ago, no actual/completed)
     try {
       const traficos = await readSheet<Record<string, string>>("Traficos");
       for (const t of traficos) {
         if (t.Completed_Date) continue;
         if (t.Domestic_Actual_Arrival) continue;
         if (!t.Domestic_Est_Arrival) continue;
         const eta = new Date(t.Domestic_Est_Arrival).getTime();
         if (Number.isNaN(eta)) continue;
         const delayDays = (Date.now() - eta) / DAYS;
         if (delayDays < 3) continue;
         out.push({
           notification_id: `shipment-${t.TRF_ID}`,
           severity: delayDays >= 7 ? "critical" : "high",
           audience: "roger",
           title: `${t.Trafico_Number || t.TRF_ID} delayed ${Math.floor(delayDays)}d`,
           body: `ETA missed: ${t.Domestic_Est_Arrival}`,
           source_entity_type: "shipment",
           source_entity_id: t.TRF_ID,
         });
       }
     } catch { /* skip */ }

     return out;
   };

   export const syncNotificationsFromSources = async (
     opts: { force?: boolean } = {}
   ): Promise<{ added: number; total_unread: number }> => {
     if (!opts.force && inflight) return inflight.then(() => ({ added: 0, total_unread: 0 }));
     if (!opts.force && Date.now() - lastSyncAt < SYNC_THROTTLE_MS) {
       return { added: 0, total_unread: 0 };
     }
     const work = (async () => {
       const derived = await aggregate();
       let added = 0;
       for (const input of derived) {
         const before = await readSheet<Notification>("Notifications");
         if (before.find((n) => n.notification_id === input.notification_id)) continue;
         await appendNotification(input);
         added++;
       }
       lastSyncAt = Date.now();
       return added;
     })();
     inflight = work.then(() => undefined);
     const added = await work;
     inflight = null;
     const all = await readSheet<Notification>("Notifications");
     const total_unread = all.filter((n) => n.status === "unread").length;
     return { added, total_unread };
   };

   // Helper for /api/dashboard/needs-you compatibility (preserves existing widget shape)
   export type NeedsYouItem = {
     id: string;
     source: "customs" | "followup" | "shipment-delay";
     message: string;
     href: string;
     severity: "warning" | "danger";
     ageHours: number;
   };

   export const notificationToNeedsYouItem = (n: Notification): NeedsYouItem => {
     const sourceMap: Record<NotificationSource, NeedsYouItem["source"]> = {
       trafico: "customs",
       lead: "followup",
       shipment: "shipment-delay",
       deal_payment: "shipment-delay",
     };
     const hrefMap: Record<NotificationSource, string> = {
       trafico: `/dashboard/shipments?trafico=${n.source_entity_id}`,
       lead: `/dashboard/leads`,
       shipment: `/dashboard/shipments?trafico=${n.source_entity_id}`,
       deal_payment: `/dashboard/pipeline`,
     };
     const ageHours = (Date.now() - new Date(n.created_at).getTime()) / HOURS;
     return {
       id: n.notification_id,
       source: sourceMap[n.source_entity_type as NotificationSource] ?? "customs",
       message: n.title,
       href: hrefMap[n.source_entity_type as NotificationSource] ?? "/dashboard",
       severity: n.severity === "critical" ? "danger" : "warning",
       ageHours,
     };
   };
   ```

7. **Verify green**: `npx tsx scripts/_test-notifications.ts` → must print `✅ Notifications round-trip OK`.

8. **Refactor `/api/dashboard/needs-you/route.ts`** to use the new lib:

   Replace the 138-line file with a slim version:

   ```ts
   import { NextResponse } from "next/server";
   import {
     listNotifications,
     notificationToNeedsYouItem,
     syncNotificationsFromSources,
   } from "@/app/lib/notifications";

   export const GET = async () => {
     await syncNotificationsFromSources();
     const items = await listNotifications({ status: "unread", limit: 8 });
     return NextResponse.json({ items: items.map(notificationToNeedsYouItem) });
   };
   ```

9. **Add the new `/api/dashboard/notifications/route.ts`**:

   ```ts
   import { NextRequest, NextResponse } from "next/server";
   import {
     ackNotification,
     listNotifications,
     syncNotificationsFromSources,
     type NotificationAudience,
     type NotificationSeverity,
     type NotificationSource,
     type NotificationStatus,
   } from "@/app/lib/notifications";

   export const GET = async (req: NextRequest) => {
     await syncNotificationsFromSources();
     const sp = req.nextUrl.searchParams;
     const items = await listNotifications({
       status: (sp.get("status") as NotificationStatus | "all" | null) ?? undefined,
       audience: (sp.get("audience") as NotificationAudience | null) ?? undefined,
       severity: (sp.get("severity") as NotificationSeverity | null) ?? undefined,
       source: (sp.get("source") as NotificationSource | null) ?? undefined,
       limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
     });
     return NextResponse.json({ items });
   };

   export const POST = async (req: NextRequest) => {
     const body = await req.json();
     if (body?.action === "ack" && typeof body.notification_id === "string") {
       await ackNotification(body.notification_id);
       return NextResponse.json({ ok: true });
     }
     if (body?.action === "sync") {
       const result = await syncNotificationsFromSources({ force: true });
       return NextResponse.json(result);
     }
     return NextResponse.json({ error: "unknown action" }, { status: 400 });
   };
   ```

10. **Verify `<NeedsYou>` still renders** (no widget changes needed — payload shape preserved):
    - Browser preview: `/dashboard/overview` → NeedsYou widget should populate (same items as before, possibly fewer if the sheet is empty on first run).
    - Trigger sync once: `curl -X POST http://localhost:3000/api/dashboard/notifications -H "Content-Type: application/json" -d '{"action":"sync"}'` (or visit Today page once).
    - Reload `/dashboard/overview` → Needs You shows live items.

11. **Typecheck**: `npx tsc --noEmit 2>&1 | grep -v "routes\.d \[" | head -20` → empty.

12. **Commit**:
    ```
    feat(notifications): Notifications sheet + lib + writers + reader

    Adds the approved 10-column Notifications sheet via
    scripts/_create-notifications-sheet.ts (idempotent, run once).

    New app/lib/notifications.ts:
      - appendNotification (upsert by deterministic notification_id)
      - listNotifications with status/audience/severity/source filters
      - ackNotification (flips status, sets acked_at)
      - syncNotificationsFromSources — aggregates customs holds,
        overdue follow-ups, shipment delays into the sheet with 60s
        in-memory throttle. Self-healing on read; no cron required.

    New /api/dashboard/notifications GET/POST. Refactors
    /api/dashboard/needs-you to read from the sheet via
    notificationToNeedsYouItem — guarantees bell + Today widget
    share one source.

    Round-trip: scripts/_test-notifications.ts.

    Task 3 of 6.

    Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
    ```

**Verification commands (re-run before commit):**
- `npx tsx scripts/_test-notifications.ts` → exit 0, ✅
- `curl -s http://localhost:3000/api/dashboard/needs-you` → JSON `{"items":[...]}` with same shape as before
- `curl -s "http://localhost:3000/api/dashboard/notifications?status=unread"` → JSON with `{items: Notification[]}`
- `npx tsc --noEmit 2>&1 | grep -v "routes\.d \[" | head -20` → empty

---

### Task 4 — `<NotificationBell>` component + header swap

**Goal**: bell in header reads notifications via the new API, shows badge with severity-tinted dot, click opens flyout with last 10 grouped by audience. 60s auto-refresh.

**Files touched**:
- `app/(dashboard)/components/notification-bell.tsx` (new)
- `app/(dashboard)/components/dashboard-header.tsx` (replace inline `<Bell>` with `<NotificationBell />`)

**Steps**:

1. **Implement `<NotificationBell>`**:

   ```tsx
   "use client";

   import { useEffect, useRef, useState } from "react";
   import Link from "next/link";
   import { Bell } from "lucide-react";
   import type { Notification } from "@/app/lib/notifications";

   const REFRESH_MS = 60_000;

   const NotificationBell = () => {
     const [items, setItems] = useState<Notification[]>([]);
     const [open, setOpen] = useState(false);
     const popRef = useRef<HTMLDivElement>(null);

     const refresh = async () => {
       try {
         const res = await fetch("/api/dashboard/notifications?status=unread&limit=10", {
           credentials: "same-origin",
         });
         if (!res.ok) return;
         const data = (await res.json()) as { items: Notification[] };
         setItems(data.items ?? []);
       } catch {
         /* swallow */
       }
     };

     useEffect(() => {
       refresh();
       const t = setInterval(refresh, REFRESH_MS);
       return () => clearInterval(t);
     }, []);

     useEffect(() => {
       if (!open) return;
       const onClick = (e: MouseEvent) => {
         if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
       };
       window.addEventListener("mousedown", onClick);
       return () => window.removeEventListener("mousedown", onClick);
     }, [open]);

     const dotTone =
       items.some((i) => i.severity === "critical")
         ? "bg-brand-terracotta-dark"
         : items.some((i) => i.severity === "high")
         ? "bg-brand-terracotta"
         : items.length > 0
         ? "bg-brand-sage"
         : "";

     const ackAndOpen = async (n: Notification) => {
       await fetch("/api/dashboard/notifications", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         credentials: "same-origin",
         body: JSON.stringify({ action: "ack", notification_id: n.notification_id }),
       });
       setOpen(false);
       refresh();
     };

     const hrefFor = (n: Notification): string => {
       if (n.source_entity_type === "trafico" || n.source_entity_type === "shipment")
         return `/dashboard/shipments?trafico=${n.source_entity_id}`;
       if (n.source_entity_type === "lead") return "/dashboard/leads";
       return "/dashboard";
     };

     return (
       <div ref={popRef} className="relative">
         <button
           onClick={() => setOpen((v) => !v)}
           className="relative w-9 h-9 flex items-center justify-center rounded-md hover:bg-dash-bg transition-colors cursor-pointer"
           aria-label="Notifications"
         >
           <Bell className="w-5 h-5 text-dash-text-secondary" />
           {items.length > 0 && (
             <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-brand-terracotta text-white text-[10px] font-bold px-1">
               {items.length > 9 ? "9+" : items.length}
             </span>
           )}
           {items.length > 0 && dotTone && (
             <span className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${dotTone}`} />
           )}
         </button>

         {open && (
           <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-dash-surface border border-dash-border rounded-md shadow-xl z-50">
             <div className="px-4 py-3 border-b border-dash-border">
               <h3 className="text-xs font-semibold uppercase tracking-wider text-dash-text-muted">
                 Notifications
               </h3>
             </div>
             <div className="max-h-80 overflow-y-auto py-1">
               {items.length === 0 ? (
                 <p className="text-sm text-dash-text-muted px-4 py-6 text-center">
                   No new alerts. ☕
                 </p>
               ) : (
                 items.map((n) => (
                   <Link
                     key={n.notification_id}
                     href={hrefFor(n)}
                     onClick={() => ackAndOpen(n)}
                     className="flex items-start gap-2 px-4 py-2.5 hover:bg-dash-bg transition-colors text-sm"
                   >
                     <span
                       className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                         n.severity === "critical"
                           ? "bg-brand-terracotta-dark"
                           : n.severity === "high"
                           ? "bg-brand-terracotta"
                           : "bg-brand-sage"
                       }`}
                     />
                     <span className="flex-1 text-dash-text leading-snug">{n.title}</span>
                   </Link>
                 ))
               )}
             </div>
             <Link
               href="/dashboard/notifications"
               onClick={() => setOpen(false)}
               className="block px-4 py-2.5 text-xs text-brand-copper hover:bg-dash-bg border-t border-dash-border text-center"
             >
               See all →
             </Link>
           </div>
         )}
       </div>
     );
   };

   export { NotificationBell };
   ```

2. **Edit `dashboard-header.tsx`**:
   - Remove the inline `<Bell>` button (lines 50-60) + the `notificationCount` prop.
   - Import and render `<NotificationBell />` in its place.

3. **Typecheck**: zero errors.

4. **Browser preview**:
   - Navigate to `/dashboard/overview`
   - `mcp__Claude_Preview__preview_snapshot` → bell visible in header, badge if there are unread items
   - `mcp__Claude_Preview__preview_click` on bell → flyout opens
   - `mcp__Claude_Preview__preview_screenshot` → save as evidence
   - Click a notification row → confirm it routes correctly + bell badge decrements after refresh

5. **Commit**:
   ```
   feat(notifications): NotificationBell — badge, severity dot, flyout

   Replaces inline <Bell> in dashboard-header with <NotificationBell />.
   Reads /api/dashboard/notifications?status=unread, refreshes every 60s.
   Badge shows count, dot color tinted by highest severity present.
   Click row → POST ack + navigate to source entity.

   Task 4 of 6.

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   ```

**Verification commands (re-run before commit):**
- `grep "notificationCount" app/(dashboard)/components/dashboard-header.tsx` → empty
- `npx tsc --noEmit 2>&1 | grep -v "routes\.d \[" | head -20` → empty
- Browser screenshot of bell + open flyout

---

### Task 5 — `/dashboard/notifications` history page

**Goal**: full timeline of all notifications with filter chips (audience / severity / source / status) and per-row ack button. Empty state via `<EmptyState>`.

**Files touched**:
- `app/(dashboard)/dashboard/(portal)/notifications/page.tsx` (new)

**Steps**:

1. **Read EmptyState's API** to know what props it takes:

   ```bash
   # During execution: open empty-state.tsx and confirm props
   ```

2. **Implement the page**:

   ```tsx
   "use client";

   import { useEffect, useState } from "react";
   import Link from "next/link";
   import { Bell } from "lucide-react";
   import type { Notification, NotificationSeverity, NotificationSource } from "@/app/lib/notifications";
   import { EmptyState } from "@/app/(dashboard)/components/empty-state";

   type StatusFilter = "all" | "unread" | "acked";

   const NotificationsPage = () => {
     const [items, setItems] = useState<Notification[] | null>(null);
     const [status, setStatus] = useState<StatusFilter>("all");
     const [severity, setSeverity] = useState<NotificationSeverity | "all">("all");
     const [source, setSource] = useState<NotificationSource | "all">("all");

     const refresh = async () => {
       const sp = new URLSearchParams();
       sp.set("status", status);
       if (severity !== "all") sp.set("severity", severity);
       if (source !== "all") sp.set("source", source);
       const res = await fetch(`/api/dashboard/notifications?${sp.toString()}`, {
         credentials: "same-origin",
       });
       if (!res.ok) {
         setItems([]);
         return;
       }
       const data = (await res.json()) as { items: Notification[] };
       setItems(data.items ?? []);
     };

     useEffect(() => {
       refresh();
     }, [status, severity, source]);

     const ack = async (id: string) => {
       await fetch("/api/dashboard/notifications", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         credentials: "same-origin",
         body: JSON.stringify({ action: "ack", notification_id: id }),
       });
       refresh();
     };

     return (
       <div className="p-6 max-w-5xl">
         <header className="mb-6">
           <h1 className="font-display text-display-xl text-dash-text">Notifications</h1>
           <p className="text-sm text-dash-text-muted mt-1">
             Timeline of alerts surfaced by the customs, leads, and shipments engines.
           </p>
         </header>

         <div className="flex flex-wrap gap-2 mb-4">
           {(["all", "unread", "acked"] as StatusFilter[]).map((s) => (
             <button
               key={s}
               onClick={() => setStatus(s)}
               className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                 status === s
                   ? "bg-brand-copper/10 text-brand-copper border-brand-copper"
                   : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-border-strong"
               }`}
             >
               {s}
             </button>
           ))}
           <span className="w-px bg-dash-border mx-1" />
           {(["all", "critical", "high", "normal"] as const).map((s) => (
             <button
               key={s}
               onClick={() => setSeverity(s as NotificationSeverity | "all")}
               className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                 severity === s
                   ? "bg-brand-copper/10 text-brand-copper border-brand-copper"
                   : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-border-strong"
               }`}
             >
               {s}
             </button>
           ))}
           <span className="w-px bg-dash-border mx-1" />
           {(["all", "trafico", "lead", "shipment"] as const).map((s) => (
             <button
               key={s}
               onClick={() => setSource(s as NotificationSource | "all")}
               className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                 source === s
                   ? "bg-brand-copper/10 text-brand-copper border-brand-copper"
                   : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-border-strong"
               }`}
             >
               {s}
             </button>
           ))}
         </div>

         {items === null ? (
           <div className="space-y-2">
             {[0, 1, 2, 3].map((i) => (
               <div key={i} className="h-12 bg-dash-bg rounded animate-pulse" />
             ))}
           </div>
         ) : items.length === 0 ? (
           <EmptyState
             icon={Bell}
             title="No notifications match these filters"
             description="Try clearing a filter, or come back later."
           />
         ) : (
           <ul className="divide-y divide-dash-border border border-dash-border rounded-md bg-dash-surface">
             {items.map((n) => (
               <li key={n.notification_id} className="flex items-start gap-3 px-4 py-3">
                 <span
                   className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                     n.severity === "critical"
                       ? "bg-brand-terracotta-dark"
                       : n.severity === "high"
                       ? "bg-brand-terracotta"
                       : "bg-brand-sage"
                   }`}
                 />
                 <div className="flex-1 min-w-0">
                   <p className="text-sm text-dash-text">{n.title}</p>
                   {n.body && <p className="text-xs text-dash-text-muted mt-0.5">{n.body}</p>}
                   <p className="text-[11px] text-dash-text-muted mt-1 font-mono">
                     {n.notification_id} · {new Date(n.created_at).toLocaleString()}
                   </p>
                 </div>
                 {n.status === "unread" ? (
                   <button
                     onClick={() => ack(n.notification_id)}
                     className="text-xs text-brand-copper hover:underline shrink-0"
                   >
                     Ack
                   </button>
                 ) : (
                   <span className="text-[11px] text-dash-text-muted shrink-0">
                     acked
                   </span>
                 )}
               </li>
             ))}
           </ul>
         )}
       </div>
     );
   };

   export default NotificationsPage;
   ```

3. **Sidebar entry decision** (per spec recommendation): no sidebar entry — bell flyout's "See all" is the only entry point. (Skip touching `sidebar.tsx`.)

4. **Typecheck**: zero errors.

5. **Browser preview**:
   - Navigate to `/dashboard/notifications`
   - `mcp__Claude_Preview__preview_snapshot` → page renders with filter chips + list
   - `mcp__Claude_Preview__preview_click` filter chip "unread" → list filters
   - `mcp__Claude_Preview__preview_click` Ack button on first row → row updates to "acked"
   - `mcp__Claude_Preview__preview_screenshot` → save evidence

6. **Commit**:
   ```
   feat(notifications): /dashboard/notifications history page

   Full timeline with filter chips (status / severity / source) and
   per-row ack. Empty state via <EmptyState>. No sidebar entry —
   reachable only via bell flyout's "See all".

   Task 5 of 6.

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   ```

**Verification commands (re-run before commit):**
- `npx tsc --noEmit 2>&1 | grep -v "routes\.d \[" | head -20` → empty
- Browser screenshot of /dashboard/notifications with filters applied

---

### Task 6 — Final smoke + execution log

**Goal**: end-to-end verification across all Phase 2 surfaces. Append §6 execution log to the spec.

**Files touched**:
- `docs/superpowers/specs/2026-04-19-dashboard-redesign-phase2.md` (append §6 execution log with commit SHAs + decisions resolved + deviations)

**Steps**:

1. **Smoke matrix**:

   | Surface | Action | Expected |
   |---|---|---|
   | `/dashboard/overview` | Open page | NeedsYou widget renders items pulled from Notifications sheet |
   | Header | Click bell | Flyout opens, shows last 10 unread, badge count = list length |
   | Header | Click a notification | Routes to entity; bell refresh shows badge decreased |
   | Header | ⌘K | Palette opens; search "kohler" returns ≥1 brand or product |
   | Header | ⌘K | Open a result; reopen palette; "Recent" section shows it |
   | `/dashboard/notifications` | Land on page | List renders; filters work; Ack flips row |

2. **Run all checks**:
   - `npx tsc --noEmit 2>&1 | grep -v "routes\.d \[" | head -50` → zero errors
   - `npm run build` (background) — Netlify-ready
   - `grep -r "SAMPLE_LEADS\|SAMPLE_PIPELINE" app/ | grep -v "sample-dashboard-data.ts"` → empty (the source file remains; no consumers)
   - Manually verify Sign Out wipes `cc_palette_recent` (or document gap)

3. **Append execution log to the spec doc** (`2026-04-19-dashboard-redesign-phase2.md`) using the same shape as Phase 1's §8:

   ```md
   ## §8 Execution log (2026-04-19)

   Phase 2 plan: 2026-04-19-dashboard-redesign-phase2-plan.md

   ### Commits
   | # | SHA | Task | Notes |
   |---|---|---|---|
   | 1 | <sha> | T1 | search.ts + round-trip test |
   | 2 | <sha> | T2 | CommandPalette refactor — SAMPLE_* dropped, recent items |
   | 3 | <sha> | T3 | Notifications sheet + lib + needs-you refactor |
   | 4 | <sha> | T4 | NotificationBell + header swap |
   | 5 | <sha> | T5 | /dashboard/notifications history page |
   | 6 | <sha> | T6 | Smoke + execution log |

   ### Decisions resolved
   <Q1–Q7 table>

   ### Deviations
   - Spec said "<EntityCard variant='search'>" — kept inline rendering in palette instead. Rationale in plan §2.
   - <any others>

   ### Verification snapshot
   <typecheck output, screenshots noted>
   ```

4. **Commit**:
   ```
   docs(design): Phase 2 execution log + final smoke results

   Records commit SHAs for T1–T5, captures Q1–Q7 decisions, lists
   deviations from spec (notably: inline palette row rendering
   instead of EntityCard variant=search), and the smoke matrix
   results.

   Task 6 of 6 — Phase 2 complete.

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   ```

**Verification commands (re-run before commit):**
- All above smoke matrix items pass
- `git log --oneline -8` → expect 6 new commits on top of `7e6d819`

---

## 4. Risks / open hazards

| Risk | Mitigation |
|---|---|
| `/api/dashboard/leads` etc. require session auth → `searchAllEntities` (called from client) needs a logged-in browser. | All ⌘K usage IS from logged-in dashboard pages. The lib uses `credentials: 'same-origin'`, which forwards cookies. |
| `syncNotificationsFromSources` called on every needs-you read could hammer Sheets API at high traffic. | 60s in-memory throttle in the lib. If still hot, raise to 5min or move to a real cron. |
| Existing widget `<NeedsYou>` payload shape change breaks rendering. | The refactored route maps Notification → NeedsYouItem with the original shape. Widget needs zero changes. Verified manually in T3 step 10. |
| `ackNotification` writes a single range — if the row index shifts (concurrent inserts), the wrong row gets acked. | Low risk in practice (Roger is the only writer, no concurrency). Phase 3 can add a transactional read-modify-write if needed. |
| Sign-Out doesn't currently wipe localStorage chat history either. | Audit during T2; if true, document the gap and add a single `localStorage.clear()` for both keys. |
| Inflight Promise pattern in `syncNotificationsFromSources` — if first call's promise rejects, `inflight` may never reset to `null`. | Wrap in `try/finally` (catch errors in the actual implementation, not just at this plan-write time). |

---

## 5. What "done" looks like

- ⌘K opens, searches 7 live entity types, shows recent items
- Zero `SAMPLE_LEADS` / `SAMPLE_PIPELINE` consumers in `app/(dashboard)/`
- `Notifications` sheet exists with the approved schema and is being written to by the 3 active sources
- Bell shows real badge + dot, opens flyout, ack works
- `/dashboard/notifications` renders the timeline with filters + ack
- `<NeedsYou>` widget unchanged in appearance, but reads through the new lib
- 6 new commits on `main`, none pushed

Total estimated time: 2.5–3 hours.
