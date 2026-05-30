# P0 — Storefront search: product-model search returns nothing, crashes, or lands users on an unrelated Insights post

> **One fix, one session.** Invoke as: `Read AGENTS.md and docs/fixes/p0-storefront-search-product-model-fix.md, then execute.` Branch per fix, commit per fix. Smallest possible diff.

---

## 0. Mandatory pre-flight (do NOT skip)

1. Read `AGENTS.md` end to end. This project is staging vs production sensitive and has a Sacred Surface rule.
2. Read `docs/SURGICAL-RULES.md`. Apply the four conditions on every edit:
   - **C1** No regression on any protected system.
   - **C2** No overlap, do not rebuild what already exists.
   - **C3** Do not disrupt an in-motion process.
   - **C4** Only enhance.
3. **Sacred Surface awareness.** "Search" is in the Sacred 13. You are authorized to modify search behavior under this fix, but every other Sacred Surface item is off-limits unless you stop and ask Joshua first. Specifically off-limits without explicit YES: cart/checkout, PDPs, customer accounts, email infra, catalog cache, slug pipeline, WhatsApp inbound, admin break-glass, factura, sheet writes, tax/IVA, trade-pricing.
4. Branch: `fix/storefront-search-product-model`. Commit per logical change.
5. If at any point the diagnosis points outside `app/components/search/*`, `app/lib/search*.ts`, `app/lib/products-full.ts` (search-only paths), `app/api/products/search/route.ts`, `app/api/search-index/route.ts`, `app/lib/search-index.ts`, `app/[locale]/shop/hero-search.tsx`, or `app/components/sections/catalog-search-input.tsx`, **stop and ask Joshua before touching it.**

---

## 1. The bug (from Roger, verbatim)

> "The public storefront renders the catalog bilingually... with working product pages, search, category and brand pages... — I can not search product models — It crashes or sends me to a what looks like a partial blog post. For now lets agree that the search does not work."

Screenshot evidence: searching from the storefront surfaces or routes to the Insights article `Tina de Cobre Martillado a Mano` (`/insights/tina-de-cobre-martillado-a-mano` or similar slug). Roger's failure modes, in his words:

1. **Cannot search product models.** A model number / SKU query does not reliably return product results.
2. **Crashes.** Some queries error out.
3. **Sends me to a partial blog post.** When products do not match, the user lands on an Insights article, which is itself unfinished, rather than seeing an honest empty state or product matches.

Treat all three as one fix.

---

## 2. Architecture you must respect

Two search systems run side by side, intentionally split (`app/lib/search.ts` header comment: *"The storefront palette uses MiniSearch for brands+articles — intentional split"*):

- **MiniSearch palette index** (`app/lib/search-index.ts`): builds a flat doc set of `type: "brand" | "article"` only. Article docs get `hrefSuffix: /insights/${a.slug}` (around line 127).
- **Product search API** (`app/api/products/search/route.ts` → `searchProducts` in `app/lib/products-full.ts`): live server-side search over the 354K-row catalog. Wrapped in a `raceTimeout` in the route.

The palette (`app/components/search/search-palette.tsx`) already wires both: it queries `/api/products/search` for products (around line 156) and uses MiniSearch for brand/article. Result sections render in `SECTION_ORDER = ["product", "brand", "article"]` (around line 296).

Do **not** rebuild this split. Fix the failure modes inside it.

---

## 3. Reproduce before fixing (mandatory)

Run the staging app locally (or against `https://countercultures.netlify.app`) and capture each failure mode with the exact query, network traces, and console errors. Save a short repro log into your final report.

Use, at minimum, these queries:

- A real SKU prefix from `CC_Products_Full` (pull 5 sample SKUs across brands, including California Faucets, Brizo, Emtek). Examples to try: `CAL-0185`, `BRI-63054`, `EMT-8520`. Confirm the exact SKU formats by reading 5–10 rows of `CC_Products_Full` (`GOOGLE_SHEETS_ID_PRODUCTS_FULL`) or `product-image-manifest.json` to grab real ones.
- A model word inside a product name (e.g. `Litze`, `Artifacts`).
- A brand name (e.g. `California Faucets`, `Brizo`).
- A misspelled model (one-character typo).
- Empty string.
- A unicode/diacritic query (e.g. `tina cobre`) — this is the one likely to hit the Insights article today.
- A query that should match nothing (e.g. `zzzzzzz`).

For each: did products come back? Was there an error? Where did Enter take the user? Did the palette auto-navigate? Did anything land on `/insights/...`?

---

## 4. Files in scope

You may edit:

- `app/components/search/search-palette.tsx`
- `app/components/sections/catalog-search-input.tsx`
- `app/[locale]/shop/hero-search.tsx`
- `app/lib/search.ts`
- `app/lib/search-index.ts`
- `app/lib/search-utils.ts`
- `app/api/products/search/route.ts`
- `app/api/search-index/route.ts`
- `app/lib/products-full.ts` — **only** the search-relevant code paths (`searchProducts` and what it calls). Do **not** touch the cache builder, the `toQuoteProduct` adapter, or anything outside the search code path.

Read-only (consult for context):

- `app/lib/articles.ts`
- `app/lib/product-image-manifest.json`
- `docs/data-sources-of-truth.md` (Product List Price, Product Name, Product SKU sections)
- `docs/SEARCH-AUDIT-2026-05-11.md` and `docs/SEARCH-FIXES-IMPLEMENTATION.md` for the AND-semantics work already shipped.

Out of scope, do **not** modify:

- `/insights/[slug]` pages or the Posts/articles data shape.
- PDP rendering, catalog ISR, canonical/hreflang/sitemap, JSON-LD.
- The cart, checkout, lifecycle, rule-engine, money path.
- Trade pricing, tax/IVA, FX, factura.
- Brand-kit sheet or product master.

---

## 5. Investigation tasks (do all before patching)

1. Identify every storefront entry point that performs a search and trace each path end to end:
   - The ⌘K palette (`search-palette.tsx`).
   - The hero search box (`hero-search.tsx`).
   - The catalog input (`catalog-search-input.tsx`).
   - Anywhere else `/api/products/search` is called, or anywhere that links to `/insights/...` from a search result, or anywhere that on Enter routes the user to a non-search page.
2. Confirm whether the palette auto-navigates on Enter or on a top-result click, and where it sends the user when product results are empty.
3. Confirm `searchProducts` matches SKU **and** model fragments. Inspect the scoring/relevance and the tokenization. If SKU substring or model-fragment matching is missing, that is part of the bug.
4. Confirm the `/api/products/search` route does not silently swallow errors. The `raceTimeout` fallback must surface a distinguishable empty-vs-timeout state to the client so the UI does not pretend it ran when it did not.
5. Confirm the palette never falls through to an article when the user clearly typed a product query (e.g. SKU pattern, brand+model phrase). If it currently does, that is the fix.
6. Confirm there is no console error or unhandled rejection when querying with a SKU-like string, an empty string, or a unicode string.

Document every finding in your final report with `file:line` citations.

---

## 6. Fix requirements (the outcomes that must hold)

Every one of these must be true after your change. The PR is not done until they are.

1. **Product-model and SKU queries return products.** Searching a real SKU (or its prefix, or a model word) returns the matching product(s) in the palette and on any submit/Enter destination. Case-insensitive, diacritic-insensitive, hyphen-tolerant (so `CAL-0185`, `cal0185`, and `CAL 0185` all match).
2. **No crash, ever, for any input.** Empty string, very long string, unicode, regex metachars, leading/trailing whitespace, a single character — none of these throw. The route returns a structured response and the UI handles it cleanly.
3. **No silent fall-through to an Insights article when products should match.** If the query has a strong product signal (SKU pattern, exact brand-token, multi-token product phrase) and `/api/products/search` returns at least one product, products render first and Enter goes to a product or to a product-results page, never to `/insights/...`.
4. **Honest empty state, not articles, when nothing matches.** If no products match and the only hits are articles, the palette shows products as "no matches" with the article hits clearly labeled in their own section. Enter does not navigate to an article by default.
5. **Timeout/error is visible.** If the product API errors or times out, the palette shows a small honest "search is temporarily unavailable" state for the product section. Brand/article results may still render. Do not pretend an empty timeout is a real "no matches."
6. **Brand search still works.** Searching a brand still returns brand results. Article search still works. No regression on these.
7. **Performance does not regress.** The palette should remain perceptibly instant. Add memoization or debounce only if needed to hit that.

---

## 7. Acceptance tests (must add, must pass)

Add unit tests under `app/lib/__tests__/` or alongside existing `*.test.ts` files. Add at least:

- A SKU exact-match test, a SKU prefix test, a SKU with-hyphen and without-hyphen test.
- A brand-plus-model phrase test.
- A diacritic-insensitive test.
- An empty-string test (no crash, returns empty result).
- A regex-metachar test (`a*b`, `[x]`, etc., no crash).
- A timeout-handling test that asserts the route surfaces a timeout state without returning `[]` silently.
- A relevance-ordering snapshot test: given a fixed seed of products and a fixed query, the top 5 results are stable.

UI behavior tests (Playwright, RTL, or equivalent — match what the repo already uses): on the palette, typing a SKU shows a product first; Enter goes to the product; typing `tina cobre` does **not** auto-navigate to `/insights/tina-de-cobre-martillado-a-mano`.

All existing tests must still pass.

---

## 8. Verification protocol (parity proof, mandatory)

Sacred Surface rule means you must produce before/after evidence:

1. **Before**: capture the search palette's network response and rendered output for each repro query in §3. Paste raw responses + screenshots/console snippets into the final report.
2. **After**: capture the same queries against the patched build. Diff.
3. Show explicitly: **brand search unchanged, article search unchanged, PDP rendering unchanged**.
4. Run the existing test suite. Paste the green test summary.
5. Build the app (`pnpm build` or whatever the repo uses) and confirm no new warnings/errors related to search.

If any Sacred Surface symptom appears (cart, PDP, checkout, sitemap, hreflang, etc.), stop, revert, and ask Joshua.

---

## 9. Out-of-scope reminders

- **Do not** redesign or rewrite the Insights article pages. Their visual incompleteness is a separate issue. This fix only ensures search does not route users there inappropriately.
- **Do not** unify product results into the MiniSearch palette index. The split is intentional.
- **Do not** change the `CC_Products_Full` sheet schema.
- **Do not** touch the catalog cache TTL or invalidation.
- **Do not** change SEO files (sitemap, canonicals, robots, JSON-LD).
- **Do not** add a new dependency without flagging it.

---

## 10. Final report (paste into PR description and `MASTER-PLAN.md` §10)

Use this template exactly:

```
### PM-XX — Storefront search: product-model fix
Commit: <sha>
Branch: fix/storefront-search-product-model

Bug (from Roger): "I can not search product models — It crashes or sends me to a partial blog post."

Root cause(s) found (with file:line):
- <cause 1>
- <cause 2>

Files changed (diff stats):
- <path> (+X -Y)
- <path> (+X -Y)

Repro queries — before vs after:
- "CAL-0185"   before: <result>  after: <result>
- "Litze"      before: <result>  after: <result>
- "tina cobre" before: <result>  after: <result>
- ""           before: <result>  after: <result>
- "zzzzzzz"    before: <result>  after: <result>

Sacred Surface parity proof:
- Brand search: <evidence>
- Article search: <evidence>
- PDP render: <evidence>
- Existing tests: <green summary>

New tests added: <list>

Out-of-scope items observed (logged, not changed): <list, with file:line>

Open questions for Joshua: <list, or "none">
```

---

## 11. Stop conditions

Stop and ask Joshua before continuing if any of these are true:

- The fix requires touching anything outside §4 "Files in scope."
- A Sacred Surface item shows any behavioral change in your before/after diff.
- The product search API performance gets meaningfully worse and you cannot get it back.
- Roger's exact reported case (the `tina cobre` style query routing to `/insights/...`) cannot be reproduced. If you cannot reproduce it, do not guess at a fix; report what you found and ask for the exact query Roger ran.

End of fix.
