# P1 — Storefront search: site-wide results-presentation hardening

> **One fix, one session.** Invoke as: `Read AGENTS.md and docs/fixes/p1-storefront-search-results-presentation.md, then execute.` Branch per fix, commit per fix. Smallest possible diff.

> **This is the follow-up to `p0-storefront-search-product-model-fix.md`.** That fix bulletproofed the ⌘K SearchPalette (header search, ⌘K shortcut, mobile search). This fix bulletproofs the *other* text-search surfaces on the storefront, so the experience is consistent across the whole site.

---

## 0. Mandatory pre-flight (do NOT skip)

1. Read `AGENTS.md` end to end. Staging vs production rules apply.
2. Read `docs/SURGICAL-RULES.md`. Apply the four conditions:
   - **C1** No regression on any protected system.
   - **C2** No overlap, do not rebuild what already exists.
   - **C3** Do not disrupt an in-motion process.
   - **C4** Only enhance.
3. **Sacred Surface awareness.** Search is in the Sacred 13. You are authorized to modify search-results presentation under this fix. Every other Sacred Surface item is off-limits unless you stop and ask Joshua first. Specifically off-limits without explicit YES: cart/checkout, PDPs, customer accounts, email infra, catalog cache, slug pipeline, WhatsApp inbound, admin break-glass, factura, sheet writes, tax/IVA, trade-pricing.
4. **Do not modify the SearchPalette.** That was fixed in `p0-storefront-search-product-model-fix.md` and is the reference for tone/UX patterns. Read it for the bilingual error banner pattern; do not edit it.
5. **Do not modify the search engine itself** (`app/lib/products-full.ts` `searchProducts`, `app/lib/search-utils.ts` `scoreProduct`). They already handle hyphen-tolerance, diacritics, regex metachars and empty inputs correctly, and there are tests proving it (`app/lib/search-utils.test.ts`, 45 tests, all passing as of `7341ec5`). Touching the engine here is out of scope.
6. Branch: `fix/storefront-search-presentation-sitewide`. Commit per logical change.
7. If at any point the diagnosis points outside §4 "Files in scope," stop and ask Joshua before continuing.

---

## 1. The bug (the gap, not a regression)

The previous fix bulletproofed the SearchPalette. The remaining text-search surfaces on the storefront were left as-is and have not been audited for the same care:

- `/shop/catalog?q=…` (the catalog results page) — entered from the hero search box, the in-catalog search input, the palette's catalog-fallback link, or a shared URL.
- `/brands/[slug]?q=…` and `/brands/[slug]/[category]?q=…` (brand-filtered results).

Each of those surfaces calls the same `searchProducts` engine, which is correct. What is **not** confirmed to be consistent is the *presentation* of:

- Empty input (`?q=`, no query at all)
- Zero-result queries (`?q=zzzzzzz`)
- API or server-render errors
- Single-result queries (one product matches — UX clarity)
- Hostile inputs (regex metachars, very long strings, unicode, raw HTML / script tags)
- Honest loading states during navigation

Roger said "for now lets agree that the search does not work." The palette fix removed the article-fall-through and the silent-empty-on-error he hit. This fix makes sure the same care is applied everywhere else a query can land.

---

## 2. Architecture you must respect (already verified)

There are exactly four storefront text-search surfaces:

| Surface | File | What it does |
|---|---|---|
| ⌘K SearchPalette | `app/components/search/search-palette.tsx` | **Already fixed in `7341ec5`. Do not modify.** |
| Hero search | `app/[locale]/shop/hero-search.tsx` | `onSubmit` → `router.push("/shop/catalog?q=…")` |
| Catalog search input | `app/components/sections/catalog-search-input.tsx` | `onSubmit` → `router.push("/shop/catalog?q=…")` |
| Catalog page | `app/[locale]/shop/catalog/page.tsx` + `catalog-view.tsx` | Server-renders with `searchProducts({ q })`; client filters via URL params |
| Brand pages | `app/[locale]/brands/[slug]/page.tsx`, `…/[category]/page.tsx` | Server-renders with `searchProducts({ brand })`; same engine |

Visual search (`app/components/visual-search-modal.tsx`, `/api/products/visual-search`) is an entirely separate image-based code path. **Out of scope for this fix.**

The engine underneath all four text surfaces is `searchProducts` → `scoreProduct` (AND-semantics, SKU-part-aware, NFD-normalized, hyphen-tolerant). The 45 tests in `app/lib/search-utils.test.ts` cover its correctness. Trust it; do not retest it.

---

## 3. Reproduce before fixing (mandatory)

Run the staging app locally (or against `https://countercultures.netlify.app`) and visit every URL in the matrix below. For each, capture: what renders, what (if anything) is in the network panel, any console errors, and whether the UX makes the user's next move obvious. Save the matrix into your final report.

Use real SKUs from `CC_Products_Full` (read 5 sample SKUs across brands, including California Faucets and Brizo). If you cannot read the sheet, the existing palette fix's report cites `63221LF-BL`, `K-13448-CP`, `BRI-63054LF-GL` as known-good — use those.

| # | URL | Expected behavior |
|---|---|---|
| 1 | `/shop/catalog` | Full unfiltered catalog renders cleanly. No phantom "search" badge. |
| 2 | `/shop/catalog?q=` | Same as #1. Empty `q` is treated as no query, not a failed search. |
| 3 | `/shop/catalog?q=K-13448-CP` | Returns the exact product. Filtered grid shows 1 result with clear indicator. |
| 4 | `/shop/catalog?q=K13448CP` | Same as #3. Hyphen-tolerance verified end-to-end via URL. |
| 5 | `/shop/catalog?q=Litze` | Returns Brizo Litze products. Filtered grid shows the matches with a clear count. |
| 6 | `/shop/catalog?q=tina%20cobre` | Returns products whose description contains both terms. Never an article. |
| 7 | `/shop/catalog?q=zzzzzzz` | Renders an honest no-results state with a "Browse full catalog" or "Clear search" affordance. No blank grid. No dead end. |
| 8 | `/shop/catalog?q=a*b` | Does not crash. Returns 0 results or treats `*` as literal. Page renders cleanly. |
| 9 | `/shop/catalog?q=<script>alert(1)</script>` | Does not execute. Renders as literal text everywhere it appears (search title, breadcrumb, empty-state copy). No XSS. |
| 10 | `/shop/catalog?q=` + 500-character string | Does not crash. May truncate display, but page renders. |
| 11 | `/shop/catalog?q=K-13448-CP` while the products API is degraded (simulate by throwing in `searchProducts` once, or by killing the cron-fed cache) | Renders an honest "search temporarily unavailable" banner. Not a blank page, not a Next.js error boundary. |
| 12 | Hero search submitting `K13448CP` | Lands on `/shop/catalog?q=K13448CP` with the product visible. URL is encoded correctly. |
| 13 | In-catalog search input submitting `Litze` | Updates the URL to `?q=Litze` and the grid filters. |
| 14 | `/brands/brizo?q=Litze` | If brand pages support `q`, returns the filtered subset cleanly. If they ignore `q`, document that and confirm it does not crash. |
| 15 | Mobile viewport (`375px`) on all of the above | The empty state, error banner, and result count are readable and not clipped. |

If any of these is already correct, say so in your report and **do not change it**. Smallest possible diff.

---

## 4. Files in scope

You may edit:

- `app/[locale]/shop/catalog/page.tsx` — server entry point for `/shop/catalog`. Tighten how `q` is normalized, how errors from `searchProducts` are caught, and what is passed to the client view as an "error" or "empty" state.
- `app/[locale]/shop/catalog/catalog-view.tsx` — client-side filter + result presentation. Add an honest no-results UI when `q` is set and `total === 0`. Add an honest error banner when an in-page API request fails. Keep the bilingual EN/ES pattern.
- `app/[locale]/shop/hero-search.tsx` — verify the submit handler encodes `q` correctly and trims. Add only what is needed.
- `app/components/sections/catalog-search-input.tsx` — same: encoding, trim, and a "clear" affordance if missing.
- `app/[locale]/brands/[slug]/page.tsx` and `app/[locale]/brands/[slug]/[category]/page.tsx` — only if they have a results-presentation gap matching the matrix above. If they do not surface `q` at all, leave them alone and note it.

Read-only (consult for tone/patterns, do not modify):

- `app/components/search/search-palette.tsx` — the reference implementation. Match its bilingual error banner copy (`productSearchUnavailable` / `productSearchRetry`) and its `AlertTriangle` icon usage so the UX is consistent.
- `app/lib/products-full.ts` and `app/lib/search-utils.ts` — the engine. Confirmed correct. Do not touch.
- `app/api/products/search/route.ts` — confirmed to return `{ items, error?: string }` and to surface a 500 on failure. Do not touch.

Out of scope, do **not** modify:

- The SearchPalette itself.
- The search engine (`searchProducts`, `scoreProduct`).
- The `/api/products/search` route.
- PDPs, JSON-LD, canonical/hreflang/sitemap, robots, ISR config.
- Cart, checkout, lifecycle, rule engine, money path.
- Visual search (`/api/products/visual-search`, `visual-search-modal.tsx`). Separate fix if needed.
- Insights/article pages. Roger noted those are unfinished; they are a separate fix file, not this one.

---

## 5. Investigation tasks (do all before patching)

1. Walk the matrix in §3. For each URL, document the current behavior with file:line citations to whichever component/branch handled it.
2. Confirm that `searchProducts` is called via a `try/catch` on the server path; if it throws, the page must not 500. The user must see a graceful banner.
3. Confirm that **every** place where `q` (or the user's query string) is rendered uses React's normal text-binding (no `dangerouslySetInnerHTML`). If any path interpolates `q` into an `href` or `dangerouslySet*`, that's an XSS risk and must be cleaned up. Test #9 in the matrix must pass.
4. Confirm that the hero submit and the in-catalog input both `encodeURIComponent` the query and `.trim()` it before pushing.
5. Confirm the catalog page renders a meaningful loading state during navigation (Next.js `loading.tsx` or a Suspense fallback) — if a long query takes 2+ seconds to render server-side, the user should not stare at a blank screen.
6. Confirm bilingual parity (EN + ES) on every new copy string. Read `i18n` keys; do not hardcode English.

Document every finding with `file:line` citations.

---

## 6. Fix requirements (every one must hold after your change)

1. **Empty `q` is no-op.** `?q=` and missing `q` render the same unfiltered catalog. No phantom "search active" UI.
2. **Zero-result state is honest and helpful.** When `q` is set and there are no matches, the page shows: a clear "No results for `<query>`" message (bilingual), a "Clear search" or "Browse full catalog" CTA, and *no* phantom empty grid.
3. **Single-result clarity.** When exactly one product matches, the grid shows that product and a clear count ("1 result"). No auto-redirect (the user did not ask for that). The single product is obviously the match.
4. **Crash-proof on hostile input.** Regex metachars, raw HTML, scripts, very long strings, and unicode never crash the page. All renderable strings are React-escaped. No `dangerouslySetInnerHTML` near user input.
5. **No XSS.** `q=<script>…` renders as visible literal text. Use jsdom-style verification: the rendered HTML must contain `&lt;script&gt;`, not an executable tag.
6. **Honest error state.** If `searchProducts` throws or the in-page API errors, the page shows a small bilingual "Search is temporarily unavailable" banner (match the palette's `AlertTriangle` + amber styling for visual consistency), with a "Retry" or "Browse full catalog" affordance. Not a Next.js error boundary. Not a silent empty grid.
7. **Hero + in-catalog submit correctness.** Both trim and `encodeURIComponent` the query before navigating. Submitting `K 13448 CP` lands on `?q=K%2013448%20CP` and the page filters correctly.
8. **Brand-page parity.** If brand pages already accept `q`, they get the same empty/error treatment. If they intentionally ignore `q`, that is documented in your report and left alone.
9. **Mobile parity.** All new states render correctly at 375px. No clipped buttons, no overflowing copy.
10. **No engine regression.** `searchProducts` and `scoreProduct` behavior is unchanged. The 45 existing tests still pass.

---

## 7. Acceptance tests (must add, must pass)

Add tests alongside existing patterns. Where the project has component tests (RTL/jsdom), use them. Where it does not (current `vitest.config.ts: environment: "node"`), test the server logic and the URL handling separately.

Required:

- A `catalog-view` rendering test (or logic test) asserting that `total === 0 && q.length > 0` produces the no-results UI, and `total === 0 && q.length === 0` produces the full catalog UI.
- A `catalog-page` server-render test that asserts a thrown `searchProducts` does not bubble to a 500 and instead returns an "error" prop to the view.
- A URL-encoding test for `hero-search` and `catalog-search-input` covering: trim, special characters, unicode, and a SKU with hyphens.
- A XSS-rendering test asserting `q=<script>alert(1)</script>` is rendered as `&lt;script&gt;...&lt;/script&gt;` text (or equivalent escaped form).
- A regex-metachar URL test asserting `q=a*b` and `q=[x]` render the page without throwing.

All existing tests must still pass.

---

## 8. Verification protocol (parity proof, mandatory)

1. **Before**: walk the §3 matrix on `main` and capture screenshots + network/console for each row.
2. **After**: walk the same matrix on your branch.
3. Show explicitly: the SearchPalette is unchanged (open ⌘K, type `tina cobre`, confirm products show first and no Insights fall-through — same as `7341ec5`).
4. Show explicitly: brand pages are unchanged unless intentionally edited.
5. Show explicitly: PDP rendering is unchanged. Open one PDP from a search result and confirm it loads.
6. Run the full test suite (`npx vitest run`). Paste the green summary. Expected: 95 + however many new tests you added, all passing.
7. Run `npx tsc --noEmit`. Paste the clean output.
8. Hit `npm run build` once. Confirm no new warnings about search-related files.

If any Sacred Surface symptom appears (cart, PDP, checkout, sitemap, hreflang, etc.), stop, revert, and ask Joshua.

---

## 9. Out-of-scope reminders

- **Do not** modify the SearchPalette.
- **Do not** modify the search engine or the products API route.
- **Do not** redesign the Insights article pages. Roger's "partial blog post" observation is a separate fix file.
- **Do not** introduce a new dependency without flagging it.
- **Do not** change SEO files (sitemap, canonicals, robots, JSON-LD).
- **Do not** auto-redirect on single-result. Users did not ask for that.
- **Do not** add a "Did you mean…?" feature. Out of scope.
- **Do not** rebuild any of the search input components. Enhance them; do not replace them.

---

## 10. Final report (paste into PR description and `MASTER-PLAN.md` §10)

Use this template exactly:

```
### PM-XX — Storefront search: site-wide results-presentation hardening
Commit: <sha>
Branch: fix/storefront-search-presentation-sitewide

Follow-up to: 7341ec5 (p0-storefront-search-product-model-fix)

Surfaces audited:
- /shop/catalog (page + view): <status>
- Hero search: <status>
- In-catalog search input: <status>
- /brands/[slug]: <status>
- /brands/[slug]/[category]: <status>

Matrix (§3) — before vs after, all 15 rows:
| # | URL | Before | After |
| 1 | /shop/catalog | ... | ... |
| 2 | /shop/catalog?q= | ... | ... |
| ... continue for all 15 ...

Files changed (diff stats):
- <path> (+X -Y)

Sacred Surface parity proof:
- SearchPalette unchanged: <evidence>
- Brand pages: <unchanged / changed and why>
- PDP render: <evidence>
- Engine + API route untouched: <evidence>
- Existing 95 tests: <green summary>
- New tests added: <list, with file:line>

Mobile (375px) parity: <pass/fail with notes>

XSS verification: <evidence that q=<script>... renders escaped>

Out-of-scope items observed (logged, not changed):
- <list>

Open questions for Joshua: <list, or "none">
```

---

## 11. Stop conditions

Stop and ask Joshua before continuing if any of these are true:

- The fix requires touching anything outside §4 "Files in scope."
- A Sacred Surface item shows any behavioral change in your before/after.
- Brand pages turn out to NOT accept `q` and you are tempted to wire `q` into them. That is a feature expansion, not a fix. Ask first.
- You discover that `searchProducts` has its own bug. Do not patch the engine here; open a separate fix file.
- The catalog page already handles every row in §3 cleanly. In that case, the only fix is to add tests proving it stays that way; do not invent UI to fix nothing.

End of fix.
