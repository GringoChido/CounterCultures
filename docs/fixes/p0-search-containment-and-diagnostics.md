# P0 — Storefront search: containment (remove from public surface) and diagnostic instrumentation

> **One fix, one session.** Invoke as: `Read AGENTS.md and docs/fixes/p0-search-containment-and-diagnostics.md, then execute.` Branch per fix, commit per logical change. Smallest possible diff.

> **This is mitigation, not a root-cause fix.** Roger has hit Netlify function crashes on the storefront after four search fixes shipped (`7341ec5`, `240d8d0`, `9f6c7be`, `8e3eb5c`). The crash message "An unknown error has occurred" with Netlify internal ID `01KSQW3CX2072Z5HKVPXYMXR0J` does **not** tell us the actual exception. Without the function log we cannot fix the underlying bug responsibly. This fix removes the search entry points from the public storefront so Roger and customers stop seeing the crash, and adds error boundaries and structured logging so the next failure (in any code path, not just search) produces a usable stack trace in Netlify's function log.

---

## 0. Mandatory pre-flight (do NOT skip)

1. Read `AGENTS.md` end to end. Staging vs production rules apply.
2. Read `docs/SURGICAL-RULES.md`. Apply the four conditions:
   - **C1** No regression on any protected system.
   - **C2** No overlap, do not rebuild what already exists.
   - **C3** Do not disrupt an in-motion process.
   - **C4** Only enhance.
3. **Sacred Surface awareness.** Search is in the Sacred 13. This fix removes the **public storefront** entry points to search and adds error boundaries. It does **not** delete any search code; the palette, the API route, the engine, the tests all remain intact. Internal use (admin/dashboard, ⌘K from authenticated surfaces) is unaffected.
4. Branch: `fix/search-containment-and-diagnostics`. Commit per logical change (4 commits expected).
5. If at any point the diagnosis points outside §4 "Files in scope," stop and ask Joshua before continuing.

---

## 1. Why this fix exists (the honest version)

Four prior fixes addressed real bugs in palette UX, catalog presentation, engine timeout, and runtime placement. Search at the customer level is *better* than before. But Roger has now hit a Node serverless function crash with the message "An unknown error has occurred." That generic string is what Netlify shows when a function throws an unhandled exception without a useful message. **We do not currently log enough context to know what threw.**

Continuing to ship speculative search fixes without the actual stack trace has destroyed credibility with Roger. The defensible move is:
- Remove Roger and customers from the failure mode immediately by hiding the search input on the public storefront.
- Make every future crash diagnosable by adding structured logging and a real error boundary on the catalog page.
- Pull the Netlify function log for `01KSQW3CX2072Z5HKVPXYMXR0J` separately (Joshua, in the Netlify UI) to learn the actual exception.

The search palette, API, and engine code all stay in place. The fix is reversible by uncommenting four locations.

---

## 2. Reproduce before fixing (mandatory)

Capture the current state so the "after" is comparable.

1. Load `https://countercultures.netlify.app/en`. Confirm the header search input is visible. Capture the rendered nav.
2. Load `https://countercultures.netlify.app/en/shop/catalog`. Confirm the hero search box (if present on this surface) and the in-page filter input are visible. Capture.
3. Capture the dashboard ⌘K palette behavior: open ⌘K from `/dashboard/overview` (authenticated), type `Litze`, confirm products show. **This must continue to work after the fix.**

---

## 3. Files in scope

You may edit:

- `app/components/layout/header.tsx` — comment out the search-button render and the `SearchPalette` mount path that's tied to the public header. Keep the dashboard's authenticated `⌘K` invocation working (the palette mount under the `(dashboard)` group must remain).
- `app/[locale]/shop/hero-search.tsx` — comment out the form render so the hero ships without a search input. Keep the file in the repo so the change is reversible by uncommenting.
- `app/components/sections/catalog-search-input.tsx` — comment out the rendered form. Keep the URL-param read so a direct visit to `/shop/catalog?q=...` still works (a customer could land via a saved link; the catalog page itself handles that case via the existing instant-shell + client fetch path).
- `app/[locale]/shop/catalog/page.tsx` — add a `try/catch` around the server-render of `searchProducts(...)` and `getCatalogBrands()` calls. On exception, log a structured error and return a safe fallback state (empty initialResult, brandCounts: []). Add a sibling `app/[locale]/shop/catalog/error.tsx` (Next.js error boundary) that renders a small bilingual "We're updating the catalog — please refresh in a moment" message instead of leaking the raw error.
- `app/api/products/search/route.ts` — extend the existing catch block to log the query, the elapsed time, the user agent, and the full stack via `console.error` in JSON form. Do not change response semantics; the existing 500-on-throw and 200-on-timeout behavior stays.

Read-only (consult, do not modify):

- `app/components/search/search-palette.tsx` — the palette itself is left intact. The dashboard still mounts it.
- `app/lib/products-full.ts`, `app/lib/search-utils.ts` — engine code is not touched.
- The existing tests under `app/lib/*.test.ts` — must all still pass.

Out of scope, do **not** modify:

- The search engine or its tests.
- The `/api/products/search` response shape (only logging is added).
- PDPs, JSON-LD, canonical/hreflang/sitemap, robots, ISR config.
- Cart, checkout, lifecycle, rule engine, money path.
- Visual search.
- Insights pages.
- Brand pages.
- `next.config.ts`, `netlify.toml`.

---

## 4. Investigation tasks (do all before patching)

1. Confirm where the public storefront mounts the SearchPalette today (`header.tsx:474` from the earlier audit). Confirm the authenticated dashboard mounts it separately (or via the same component but a different route group). The fix removes only the public mount.
2. Confirm the hero search and in-catalog input both submit to `/shop/catalog?q=...` (verified earlier; `hero-search.tsx:36`, `catalog-search-input.tsx:28`). The route still resolves; we're only hiding the input form, not breaking the URL contract.
3. Read `app/[locale]/shop/catalog/page.tsx` lines 110–160 to find the existing `searchProducts(...)` call and the `try { } catch { /* client-side fetch handles it */ }` block. Replace the bare `catch` with structured logging.
4. Read `app/api/products/search/route.ts` lines 110–120 to find the existing catch block. Extend the logging.

Document every finding with `file:line` citations.

---

## 5. The four changes (one commit each)

### Commit 1 — Hide the public storefront search entry points

- In `app/components/layout/header.tsx`: comment out the search button render and any related toggle handler tied to the public header. **Keep** the palette mount used by the authenticated dashboard surface.
- In `app/[locale]/shop/hero-search.tsx`: comment out the `<form>` render so the hero ships without a search input. Keep the rest of the file commented inline so reversion is one block.
- In `app/components/sections/catalog-search-input.tsx`: comment out the rendered `<form>`. Keep the file's exports stable so other imports do not break.
- **Acceptance:** load `/en` and `/en/shop/catalog` on a branch deploy; no search input visible in header, hero, or catalog filter. Direct visit to `/shop/catalog?q=Litze` still resolves (page renders, client fetch handles the rest). Authenticated `/dashboard/overview` still has working ⌘K palette.

### Commit 2 — Add Next.js error boundary on the catalog page

- Create `app/[locale]/shop/catalog/error.tsx` (Next.js convention) that renders a small bilingual message: "We're updating the catalog. Please refresh in a moment." with a single "Reload" button. No raw error text shown to customers.
- **Acceptance:** force an error in `app/[locale]/shop/catalog/page.tsx` (locally only, e.g., temporarily `throw new Error("test")`) and verify the error boundary renders instead of a Netlify crash page. Remove the test throw before committing.

### Commit 3 — Add structured logging to the catalog page server-render

- Replace the existing `try { ... } catch { /* client-side fetch handles it */ }` in `app/[locale]/shop/catalog/page.tsx` with:
  - `try { ... } catch (err) { console.error(JSON.stringify({ where: "shop/catalog/page", urlQuery, urlBrand, isFiltered, message: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })); /* fall through to client-side fetch via instant shell */ }`
- **Acceptance:** with the temporary thrown error in place from commit 2, verify the structured log appears in Netlify function logs. The catalog page still recovers to the instant-shell behavior afterward.

### Commit 4 — Add structured logging to the search API route

- In `app/api/products/search/route.ts`, extend the existing `catch (err)` block to log:
  - `console.error(JSON.stringify({ where: "api/products/search", q, brand, category, ua: req.headers.get("user-agent"), message: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined }))`
- Keep the existing return `NextResponse.json({ error: message }, { status: 500 })` semantics. Do not change the response shape.
- **Acceptance:** unit test that simulates a thrown exception in the route confirms the route still returns a 500 with the existing error shape. Existing tests for the success path remain green.

---

## 6. Verification protocol (mandatory)

1. **All existing tests pass.** `npx vitest run` — expected: same count as on `main`, all green.
2. **Typecheck clean.** `npx tsc --noEmit`.
3. **Build clean.** `npm run build`.
4. **Live branch-deploy verification on Netlify branch preview:**
   - `/en` homepage: no search input visible in the header.
   - `/en/shop/catalog`: no in-page search input visible.
   - `/en/shop/catalog?q=Litze` (direct URL): page renders the instant-shell, client-side fetch attempts to populate, behavior is the same as today for the catalog page itself.
   - Force an error path (temporarily during testing, then revert): the error boundary renders, NOT the Netlify crash page.
   - Netlify function log for the test error contains the structured JSON with `where`, `message`, and `stack`.
5. **Dashboard parity:**
   - `/dashboard/overview` (authenticated): ⌘K still opens the palette, typing `Litze` still surfaces products.
6. **Reversibility check:** uncommenting the four locations in commit 1 restores the public storefront search inputs. Confirm by toggling once locally.

If any Sacred Surface symptom appears (cart, PDP, checkout, sitemap, hreflang, brand pages, etc.), stop, revert, and ask Joshua.

---

## 7. Out-of-scope reminders

- **Do not** delete any search code. Comment out only the render in three files.
- **Do not** modify the search engine or its tests.
- **Do not** change response shapes of the search API.
- **Do not** modify the palette component itself.
- **Do not** redesign the catalog page or the homepage.
- **Do not** touch Brand pages or PDPs.
- **Do not** add new dependencies.

---

## 8. Final report (paste into PR description)

```
### PM-XX — Storefront search containment + diagnostic instrumentation
Branch: fix/search-containment-and-diagnostics
Commits: 4 (one per §5 step)

Why: Roger hit a Netlify function crash with the generic message
"An unknown error has occurred" (internal ID 01KSQW3CX2072Z5HKVPXYMXR0J).
The four prior search fixes (7341ec5, 240d8d0, 9f6c7be, 8e3eb5c) have not
eliminated his real-world experience of crashes. This fix is mitigation:
remove the search inputs from the public storefront so Roger and customers
stop hitting it, and add structured logging so the next failure in any
code path produces an actionable stack trace.

Files changed (diff stats):
- app/components/layout/header.tsx (commented public search trigger)
- app/[locale]/shop/hero-search.tsx (commented form render)
- app/components/sections/catalog-search-input.tsx (commented form render)
- app/[locale]/shop/catalog/page.tsx (structured error logging)
- app/[locale]/shop/catalog/error.tsx (new — Next.js error boundary)
- app/api/products/search/route.ts (structured error logging)

Sacred Surface parity proof:
- SearchPalette code: untouched, dashboard ⌘K verified still working
- Engine + API response shape: untouched
- PDPs, brand pages, sitemap, robots: not touched
- Existing tests: all passing
- Build + typecheck: clean

Live verification (branch deploy):
- /en — no search input visible: <screenshot>
- /en/shop/catalog — no input visible: <screenshot>
- /en/shop/catalog?q=Litze (direct URL) — page renders, instant shell: <screenshot>
- /dashboard/overview ⌘K — palette works: <screenshot>
- Forced error path — error boundary renders, Netlify log shows structured JSON: <screenshot>

Open questions for Joshua:
- The Netlify function log for ID 01KSQW3CX2072Z5HKVPXYMXR0J — pull and paste so we
  can plan the real fix. Until that log is in hand, search stays hidden on the
  public storefront.
```

---

## 9. Stop conditions

Stop and ask Joshua before continuing if any of these are true:

- The "Hide search" change accidentally breaks the dashboard ⌘K palette.
- The catalog page's instant-shell behavior changes (a `?q=` URL must still render the page, even with no input visible).
- The error boundary swallows legitimate errors that should be visible to logged-in admin users.
- Existing tests fail after any of the four commits.
- You cannot reproduce the public-search visibility on `main` (if it's already hidden somewhere, surface that and re-scope).
- Anything outside §3 needs to be edited.

End of fix. This intentionally does not "fix search." It contains the failure and instruments future failures so the next conversation about search is grounded in a real stack trace rather than another guess.
