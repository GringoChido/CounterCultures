# P0 — Storefront search: kill the 502, never time out the gateway, guide over-broad queries

> **One fix, one session.** Invoke as: `Read AGENTS.md and docs/fixes/p0-storefront-search-502-and-timeout.md, then execute.` Branch per fix, commit per fix. Smallest possible diff.

> **This is the third and intended FINAL fix in the storefront-search series.** Read these first (don't re-do their work):
> - `docs/fixes/p0-storefront-search-product-model-fix.md` (shipped as `7341ec5`) — bulletproofed the palette.
> - `docs/fixes/p1-storefront-search-results-presentation.md` (in flight) — bulletproofed catalog-page presentation.
> - This file — closes out the engine/route side: no more 502s, structured timeout responses, helpful "narrow your search" guidance.

---

## 0. Mandatory pre-flight (do NOT skip)

1. Read `AGENTS.md` end to end. Staging vs production rules apply.
2. Read `docs/SURGICAL-RULES.md`. Apply the four conditions:
   - **C1** No regression on any protected system.
   - **C2** No overlap, do not rebuild what already exists.
   - **C3** Do not disrupt an in-motion process.
   - **C4** Only enhance.
3. **Sacred Surface awareness.** Search is in the Sacred 13. This fix is explicitly authorized to modify:
   - `app/api/products/search/route.ts`
   - `app/lib/products-full.ts` (search-relevant code paths only)
   - `app/components/search/search-palette.tsx` (only the new error-code branch)
   - `app/[locale]/shop/catalog/catalog-view.tsx` (only the new error-code branch)
   - Test files
   Every other Sacred Surface item is off-limits unless you stop and ask Joshua first. Specifically off-limits without explicit YES: cart/checkout, PDPs, customer accounts, email infra, catalog cache, slug pipeline, WhatsApp inbound, admin break-glass, factura, sheet writes, tax/IVA, trade-pricing.
4. **Before any engine change you must produce a parity proof.** Capture top-5 results, in order, for these known-good queries on `main` *and* on your branch: `Litze`, `K-13448-CP`, `BRI-63054LF-GL`, `tina cobre`, `California Faucets`, `kohler`, `brizo`. If a single ordering changes, stop and ask Joshua. The 45 tests in `search-utils.test.ts` and the 27 in `catalog-presentation.test.ts` must also still pass.
5. Branch: `fix/storefront-search-502-and-timeout`. Commit per logical change.
6. If at any point the diagnosis points outside §4 "Files in scope," stop and ask Joshua before touching it.

---

## 1. The bug (Roger reproduced this on `2026-05-28`)

Searching the very simple query `toto` from the catalog page returned **502 Bad Gateway** from Netlify, with a red error banner ("→ 502") and a Retry button on the storefront. Screenshot saved to the project archive.

The query was a 4-letter common brand token. Every other shape of query he typed worked. The route did not log a thrown error — Netlify killed the function before it could respond.

**Root cause:** `app/api/products/search/route.ts` wraps auxiliary signals in `raceTimeout` but the **main `searchProducts({ q })` call has no server-side cap**. For an over-broad token like `toto`, the engine has to score a large fraction of the 354K-product catalog before sorting and slicing. Combined with any cold-start hydration of the catalog cache (~2.5s per `STATE-OF-THE-UNION.md`), the function blows past Netlify's 10-second sync function timeout. The gateway returns 502 and the UI sees a generic error with no useful guidance for the user.

This is the engine/route slice. The palette and catalog-page UI already handle errors with a banner+retry (from the two prior fixes), but neither can mask the fact that the gateway killed the function.

---

## 2. Architecture you must respect (already verified)

- `app/api/products/search/route.ts`: wraps `getMostSpecifiedScores` and `getInShowroomIds` in `raceTimeout(..., 2000, fallback)`. The main `searchProducts` call is **uncapped**.
- `app/lib/products-full.ts` `searchProducts`: scores the catalog using `scoreProduct` from `app/lib/search-utils.ts`. That scorer is AND-semantic, SKU-part-aware, NFD-normalized, hyphen-tolerant. **Do not modify the scorer.** 45 tests prove its correctness.
- The catalog cache is in-memory (hydrated from `CC_Products_Full` via SWR, 30-min TTL).
- The palette already has `productError` state. The catalog page already has `fetchError` state (bilingual amber banner) from the prior fix.

The palette and catalog-view BOTH need a small new branch to recognize a **timeout** specifically and show different copy than the generic "temporarily unavailable" message. That is the only UI change in this fix.

---

## 3. Reproduce before fixing (mandatory)

You must observe the 502 once before you change anything, and you must confirm it is gone after. Save the matrix into your final report.

| # | Query | URL | Expected after fix |
|---|---|---|---|
| 1 | `toto` | `/shop/catalog?q=toto` | **No 502.** Either real results in ≤2s OR a structured timeout response that renders a "narrow your search" banner in ≤6s. |
| 2 | `delta` | `/shop/catalog?q=delta` | Same. (Another common-brand token.) |
| 3 | `kohler` | `/shop/catalog?q=kohler` | Same. |
| 4 | `brizo` | `/shop/catalog?q=brizo` | Same. |
| 5 | `Litze` | `/shop/catalog?q=Litze` | Real Brizo Litze products. |
| 6 | `K-13448-CP` | `/shop/catalog?q=K-13448-CP` | The exact product. |
| 7 | `tina cobre` | `/shop/catalog?q=tina%20cobre` | Real products (the matching ones from the description scan). Never an Insights article. |
| 8 | `zzzzzzz` | `/shop/catalog?q=zzzzzzz` | Honest empty state from the prior fix. |
| 9 | `<script>alert(1)</script>` | `/shop/catalog?q=<script>...` | Renders escaped. No XSS, no crash. |
| 10 | The palette: same `toto` query | open ⌘K, type `toto` | No 502. Same graceful behavior. |
| 11 | The palette: `tina cobre` | open ⌘K, type `tina cobre` | Products first. Never an Insights article. (Parity proof for the palette fix.) |

Capture network panel response times for #1–#4. Confirm the function returned in under 8 seconds.

---

## 4. Files in scope

You may edit:

- `app/api/products/search/route.ts` — wrap `searchProducts(...)` in `raceTimeout(..., 6000, TIMEOUT_FALLBACK)`. On timeout, return a **200 OK** response with a structured payload (see §6). Do not return 500 on timeout — that risks Netlify still re-throwing as 502 depending on how it's serialized, and we want the client to receive a clean signal. Keep the existing 500 path for actual thrown exceptions.
- `app/lib/products-full.ts` — `searchProducts` only. Add a soft candidate cap so the scoring loop has a defined upper bound, and an early-exit if the loop has been running too long. See §6 for the contract. Do not touch the cache builder, `extractSkuRoot`, `getVariants`, `getSameBrand`, `getBrandSummary`, or any other exported function.
- `app/components/search/search-palette.tsx` — add a single branch to detect the new timeout signal in the response and show a specific bilingual message ("Your search is too broad. Try adding a brand or model.") instead of the generic "temporarily unavailable" banner. Do not change anything else.
- `app/[locale]/shop/catalog/catalog-view.tsx` — same: a single new branch in the existing `fetchError` rendering that detects the timeout signal and shows the bilingual "too broad" copy with a "Clear search" affordance. Do not change anything else.
- New tests (see §7).

Read-only (consult, do not modify):

- `app/lib/search-utils.ts` `scoreProduct` — the scorer itself stays untouched. It is correct.
- The existing `search-utils.test.ts` (45) and `catalog-presentation.test.ts` (27) must keep passing.

Out of scope, do **not** modify:

- `scoreProduct` or its tests.
- PDPs, JSON-LD, canonical/hreflang/sitemap, robots, ISR.
- Cart, checkout, lifecycle, rule engine, money path.
- Visual search (separate code path, separate fix if needed).
- Insights/article pages (separate issue Roger flagged).
- The catalog cache builder, the Sheet integration, the FX layer.

---

## 5. Investigation tasks (do all before patching)

1. Reproduce the 502 on `main` with `toto` (or `delta`/`kohler` if `toto` does not 502 in your environment). Capture the function response time and the response body.
2. Read `app/api/products/search/route.ts` in full. Identify exactly where `searchProducts` is called and how its result is returned.
3. Read `searchProducts` in `app/lib/products-full.ts` in full. Identify:
   - Where the scoring loop is (which lines iterate over products).
   - Whether there is any pre-filtering on the candidate set before scoring (probably not).
   - How the existing AND-semantics short-circuit works in `scoreProduct` (it returns 0 the moment a token matches nothing — this is already efficient for unmatched products).
4. Estimate why the loop is slow for `toto`: is it that nearly every product needs full scoring before being rejected, or that many products actually match (Toto-branded items)? Capture a rough count by running the loop locally if you can.
5. Read the palette and the catalog-view to see exactly where their error banners render today. The new timeout branch slots in next to those, not replacing them.

Document every finding with `file:line` citations.

---

## 6. Fix requirements (every one must hold after your change)

### 6.1 Route-level timeout (mandatory)

In `app/api/products/search/route.ts`:

- Wrap the existing `searchProducts({...})` call in `raceTimeout(..., 6000, TIMEOUT_SENTINEL)` where `TIMEOUT_SENTINEL` is a distinguishable object (e.g., `{ __timeout: true }`).
- If the sentinel is returned, the route responds with **HTTP 200** and the body:
  ```json
  {
    "items": [],
    "totalCount": 0,
    "brandCounts": [],
    "categoryCounts": { "bathroom": 0, "kitchen": 0, "hardware": 0 },
    "timedOut": true,
    "error": "search_timeout",
    "message": {
      "en": "Your search is too broad. Try adding a brand or model number.",
      "es": "Tu búsqueda es demasiado amplia. Prueba con una marca o número de modelo."
    }
  }
  ```
- The existing 500 path stays for actual thrown exceptions.
- The existing successful response shape is unchanged.

### 6.2 Engine-level candidate cap (mandatory, Sacred Surface — handle carefully)

In `app/lib/products-full.ts` `searchProducts`:

- Add a hard **scan budget**: 4 seconds wall-clock. Inside the scoring loop, every 5000 iterations check `Date.now()` against the start time. If exceeded, exit the loop early and mark the result as partial.
- The function's return shape gains a single optional field: `partial: true` set only when the scan ran out of budget. All existing fields are unchanged.
- When `partial: true`, the route surfaces it via the same `timedOut: true` envelope above.
- **Critical parity constraint:** for every query in the §0.4 parity-proof list (`Litze`, `K-13448-CP`, `BRI-63054LF-GL`, `tina cobre`, `California Faucets`, `kohler`, `brizo`), the scan budget must **never** trigger. The top-5 results must be byte-identical to current `main`. The cap only exists to bound pathological queries (`toto`, `the`, `1`, etc.).
- If parity breaks for any of those queries, the cap is too tight. Stop and ask Joshua before adjusting.

### 6.3 UI handling of the timeout (mandatory)

In `app/components/search/search-palette.tsx` and `app/[locale]/shop/catalog/catalog-view.tsx`:

- Detect the new shape: when the response carries `error: "search_timeout"` or `timedOut: true`, render the bilingual `message.en` / `message.es` from the response (or fall back to a local bilingual string if `message` is absent).
- Keep the existing amber `AlertTriangle` banner styling. Add a small "Clear search" affordance next to the Retry, since "Retry" is useless on a too-broad query.
- Do not change any other branch of the rendering.

### 6.4 Logging

In the route, when the timeout branch fires, `console.warn` with the query string and the elapsed time. We need to be able to spot which queries are slow in production.

### 6.5 Safety net

The whole `try/catch` in the route stays. Any unexpected throw still returns 500. Adding the timeout must not make a real error invisible.

---

## 7. Acceptance tests (must add, must pass)

Add tests covering:

- `searchProducts` returns `partial: true` when the scan budget is exceeded (simulate by mocking `Date.now` or by passing a very small budget in a test-only param if needed).
- `searchProducts` does **not** return `partial: true` for queries in the parity list with their default budget. Use the existing test fixtures.
- The route returns 200 with `timedOut: true` and a `message` object when `searchProducts` returns the sentinel. Mock at the route level.
- The route still returns 500 for actual thrown exceptions.
- Snapshot the top-5 result IDs for `Litze`, `K-13448-CP`, `BRI-63054LF-GL`, `tina cobre`, `California Faucets`, `kohler`, `brizo` against the existing fixture set. These snapshots must be identical to `main` (paste the `main` snapshot into the test as a fixed expected value).
- URL-encoding for `toto` and other common tokens does not break the route.

All existing 122 tests must still pass.

---

## 8. Verification protocol (parity proof, mandatory)

1. **Reproduce the 502 on `main`** (`/shop/catalog?q=toto`) and capture: status code, response time, response body. Paste into the final report.
2. **After**: rerun the same URL on your branch. Confirm: HTTP 200, response time under 7 seconds, response body has `timedOut: true`, UI shows the bilingual "too broad" banner.
3. **Parity proof**: for every query in §0.4, run it on `main` and on your branch, capture the top-5 product IDs in order, paste both side by side. Identical = pass. Any deviation = stop and ask.
4. **Palette parity**: open ⌘K, type `tina cobre`, confirm products show first and no Insights fall-through (same as `7341ec5`).
5. **Catalog page parity**: walk every row of the matrix in §3 of `p1-storefront-search-results-presentation.md` and confirm behavior matches what that fix established. No regressions on empty state, zero-result, error banner.
6. **Tests**: run `npx vitest run` and paste the green summary. Expected: 122 + your new tests, all passing.
7. **Typecheck**: `npx tsc --noEmit` returns silently.
8. **Build**: `npm run build` succeeds with no new warnings about search files.

If any Sacred Surface symptom appears (cart, PDP, checkout, sitemap, hreflang, etc.), stop, revert, and ask Joshua.

---

## 9. Out-of-scope reminders

- **Do not** modify `scoreProduct` in `app/lib/search-utils.ts`. The 45 tests guard it; keep it green.
- **Do not** rebuild the search engine. No new dependencies (no MeiliSearch, Algolia, Postgres FTS, etc.). Architectural changes are P2.
- **Do not** add a "Did you mean…?" suggestion engine. Out of scope.
- **Do not** introduce a separate query parser. The existing tokenization is fine.
- **Do not** change the catalog cache TTL or hydration.
- **Do not** touch SEO files.
- **Do not** auto-redirect to a single result.
- **Do not** modify the visual search modal or its API.
- **Do not** redesign the Insights pages.
- **Do not** modify the catalog cache builder in `products-mapping.ts`. The cache stays as-is.

---

## 10. Final report (paste into PR description and `MASTER-PLAN.md` §10)

```
### PM-XX — Storefront search: kill the 502, engine timeout, narrow-search guidance
Commit: <sha>
Branch: fix/storefront-search-502-and-timeout

Series:
- p0-storefront-search-product-model-fix (7341ec5) — palette
- p1-storefront-search-results-presentation (<sha>) — catalog presentation
- this fix — engine timeout + 502 elimination

Bug (Roger 2026-05-28): /shop/catalog?q=toto returned 502 Bad Gateway.

Root cause (with file:line): <citations>

Files changed (diff stats):
- app/api/products/search/route.ts (+X -Y)
- app/lib/products-full.ts (+X -Y)
- app/components/search/search-palette.tsx (+X -Y)
- app/[locale]/shop/catalog/catalog-view.tsx (+X -Y)
- <new test files>

Reproduce table (§3, all 11 rows): before vs after, with response times.

Parity proof (§0.4): top-5 IDs for Litze / K-13448-CP / BRI-63054LF-GL / tina cobre / California Faucets / kohler / brizo. main vs branch, side by side. Must be identical.

Sacred Surface parity proof:
- scoreProduct: untouched
- Palette: only the timeout branch added, all other behavior unchanged (re-verify tina cobre case)
- Catalog presentation: only the timeout branch added
- PDP render: not touched
- Tests: 122 existing + N new = all green
- Typecheck: clean
- Build: clean

Mobile (375px) check: <pass/fail>

Logging: confirm the console.warn fires on a real timeout and includes the query.

Out-of-scope items observed (logged, not changed): <list>

Open questions for Joshua: <list, or "none">
```

---

## 11. Stop conditions

Stop and ask Joshua before continuing if any of these are true:

- The parity proof in §0.4 shows any top-5 ordering change for the listed queries.
- The 4-second engine budget is hit for ANY of those queries in normal operation.
- The fix requires touching anything outside §4 "Files in scope."
- The 502 cannot be reproduced on `main`. If you cannot reproduce it, do not guess at a fix; report what you found and ask for the exact reproduction Roger used.
- You discover that the 502 has a different root cause (cold start, cache miss, network, etc.). The route-level timeout still protects against gateway 502, but the engine budget may be misdirected. Report and ask.
- Any Sacred Surface item shows behavioral change in your before/after.

End of fix. This should be the last storefront-search fix file. If a fourth is needed, something has gone wrong upstream of the storefront and the conversation is not "fix search" anymore.
