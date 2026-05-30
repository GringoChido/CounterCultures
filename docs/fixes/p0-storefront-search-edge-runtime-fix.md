# P0 — Storefront search: move heavy handlers off the edge runtime, kill the "edge function timed out" error

> **One fix, one session.** Invoke as: `Read AGENTS.md and docs/fixes/p0-storefront-search-edge-runtime-fix.md, then execute.` Branch per fix, commit per fix. Smallest possible diff.

> **This closes out the storefront-search series.** Prior fixes already shipped or in flight:
> - `7341ec5` — palette UX
> - `240d8d0` — catalog presentation
> - (pending) `fix/storefront-search-502-and-timeout` — engine scan budget + route raceTimeout + bilingual timeout UI
>
> This fix exists because the three above assumed Node serverless runtime budgets. The deployment is actually on **Netlify Edge Functions** (via `@netlify/plugin-nextjs ^5.15.9`), where CPU and wall-clock are tighter. The runtime mismatch is why the live site still shows "This edge function has crashed — the edge function timed out" and why search is slow even when it does return.

---

## 0. Mandatory pre-flight (do NOT skip)

1. Read `AGENTS.md` end to end. Staging vs production rules apply.
2. Read `docs/SURGICAL-RULES.md`. Apply the four conditions:
   - **C1** No regression on any protected system.
   - **C2** No overlap, do not rebuild what already exists.
   - **C3** Do not disrupt an in-motion process.
   - **C4** Only enhance.
3. **Sacred Surface awareness.** Search is in the Sacred 13. This fix is authorized to modify route/page runtime declarations only (the `export const runtime = "nodejs"` line). It is **not** authorized to modify search engine code, search UI, the scorer, the cache builder, or any other Sacred Surface item.
4. Branch: `fix/storefront-search-edge-runtime`. Commit per logical change. Likely one or two commits total.
5. If at any point the diagnosis points outside §4 "Files in scope," stop and ask Joshua before continuing.

---

## 1. The bug (Roger and Joshua reproduced this on `2026-05-28`)

Live site `https://countercultures.netlify.app/en` shows two symptoms on the catalog and search paths:

1. **"This edge function has crashed — the edge function timed out"** full-page error from Netlify on some search requests (screenshot in chat). Netlify internal ID format `01KSPPCNK...`. This is the **Netlify Edge Function runtime** killing the request, not the Node serverless gateway 502 we already addressed.
2. **Search is very slow to load** even when it eventually returns. End-to-end perceived latency feels well over what local dev shows (e.g. `toto` returns in ~130 ms locally on a warm cache).

The two symptoms share one root cause.

---

## 2. Root cause (confirmed from code)

`package.json` includes `"@netlify/plugin-nextjs": "^5.15.9"`. From v5 of that plugin, **every Next.js handler is served via a Netlify Edge Function by default** unless the file explicitly declares `runtime = "nodejs"`. Confirm by grepping for runtime exports — currently zero of them in this repo.

Netlify Edge Functions run on a Deno-based edge worker with **much tighter CPU and wall-clock budgets** than Node serverless functions. The prior fix's 4-second in-engine scan budget and 6-second route `raceTimeout` are sized for the ~10-second Node-serverless ceiling. On edge, throttling kicks in well before those budgets, the catalog-cache hydration (~2.5 s) plus any non-trivial scoring loop exceeds the edge envelope, and the runtime kills the function. Hence "edge function timed out."

The handler also runs more slowly under edge throttling even when it does return, which is the "search takes very long to load" symptom.

The remedy is to **pin the heavy handlers to the Node.js runtime**, where the budgets we already built actually have room to work.

---

## 3. Reproduce before fixing (mandatory)

You must observe the live bug before you change anything. Do this against the deployed staging URL.

1. Open `https://countercultures.netlify.app/en/shop/catalog?q=toto`. Capture: response time (browser DevTools Network panel), HTTP status, response body shape, and whether the Netlify "edge function crashed" page appears. Save the screenshot/log into your final report.
2. Open `https://countercultures.netlify.app/en/shop/catalog?q=Litze`. Capture the response time. This is a known-good query that should be fast.
3. Open `https://countercultures.netlify.app/en/shop/catalog?q=K-13448-CP`. Same.
4. Open the API directly: `https://countercultures.netlify.app/api/products/search?q=toto&limit=6`. Confirm: HTTP status, response body, response time.
5. Open `https://countercultures.netlify.app/en` and confirm the homepage renders normally. Capture time-to-first-paint roughly.

If a request that should be fast still feels slow, that confirms the throttling diagnosis. If `toto` outright crashes the edge function, that confirms the budget-exceeded diagnosis.

---

## 4. Files in scope

You may add **one line and only one line** (`export const runtime = "nodejs";`) to each of:

- `app/api/products/search/route.ts` — the products search API. Heaviest hot path. Required.
- `app/[locale]/shop/catalog/page.tsx` — the catalog page server-render. Required.
- Other route handlers that, in your investigation (§5), demonstrably trip the same edge-runtime ceiling. Strong candidates if they touch the catalog cache or do server-rendered loops:
  - `app/api/products/visual-search/route.ts`
  - `app/[locale]/brands/[slug]/page.tsx`
  - `app/[locale]/brands/[slug]/[category]/page.tsx`
  - `app/[locale]/shop/[category]/page.tsx`

**Do not add the runtime export to anything that isn't demonstrably slow on edge.** Adding it to every route is a Sacred Surface change with surface-area risk. Add it to the products-search route and the catalog page (required), then audit the rest in §5 and add only what you can justify.

Out of scope (do **not** touch):

- `middleware.ts` — middleware must remain edge.
- `app/lib/search-utils.ts`, `app/lib/products-full.ts` — the scorer and the engine. They already work; the budget added in the prior fix stays.
- `app/components/search/search-palette.tsx`, `app/[locale]/shop/catalog/catalog-view.tsx` — client components; they don't run on the server runtime at all.
- PDPs, JSON-LD, canonical/hreflang/sitemap, robots, ISR config.
- Cart, checkout, lifecycle, rule engine, money path.
- Visual search modal logic.
- Insights pages.
- `next.config.ts` — do not add a global runtime override; opt files in individually.
- `netlify.toml` — no edge function config changes.

---

## 5. Investigation tasks (do all before patching)

1. Confirm via `grep` that no file currently exports `runtime`. The fix is to add the export to specific files; if any file already declares it, do not change it.
2. Reproduce the §3 matrix on `main` and on the deployed staging URL. Capture the live behavior so the "before" column of your report is real evidence, not guesses.
3. Identify every route/page that calls into `searchProducts`, `getCache`, or anything that hydrates the 354K-row catalog cache. Use `grep` for the function names. Each is a candidate for the runtime opt-out.
4. For each candidate beyond the two required, decide: does it actually run slowly on edge, or is it light enough to stay there? Document your decision with `file:line` references and an estimated work profile.
5. Confirm that `middleware.ts` is **not** in your candidate list. It runs on every request and must stay edge; moving it to nodejs would break Next.js.

Document every finding with `file:line` citations.

---

## 6. Fix requirements (every one must hold after your change)

1. **The catalog page and the products-search API are pinned to Node.js**. Both files contain `export const runtime = "nodejs";` near the top of the module, after imports.
2. **No edge-function crash** on `/shop/catalog?q=toto` or any other common-token query. The "edge function timed out" page must be gone.
3. **Search returns within 8 seconds** for the worst case on a cold function (`toto` against full catalog). It should return in under 2 seconds on a warm cache.
4. **Known-good queries (`Litze`, `K-13448-CP`, `BRI-63054LF-GL`, `tina cobre`, `California Faucets`, `kohler`, `brizo`) return correct results** in well under 2 seconds.
5. **The bilingual "Your search is too broad" banner from the prior fix still fires** when an over-broad query actually does exceed the 6-second route timeout. That path must remain reachable.
6. **Brand pages and PDPs are unaffected** unless you intentionally added the runtime export to them based on §5 evidence.
7. **The palette continues to work** end to end. Open ⌘K, type `tina cobre`, confirm products show first and no Insights fall-through.
8. **No tests added solely to test the runtime export.** Runtime opts are config; they don't need unit tests.
9. **All existing tests still pass.** No regressions in vitest or tsc.

---

## 7. Acceptance tests (must add only if behavior changes, otherwise none required)

Runtime exports are deployment config, not testable units. **Do not add unit tests for these.** Instead, the verification protocol below is your acceptance — measurable response times on staging.

If, during investigation, you find a real code issue beyond the runtime mismatch, **stop and ask Joshua**. Do not silently widen the fix.

---

## 8. Verification protocol (mandatory)

This fix is unusual in that the verification is mostly **live-site measurement**, not unit tests. Do all of it:

1. **Before**: walk §3 against the current deployed staging URL. Paste response times + screenshots (or curl `-w "%{time_total}\n" -o /dev/null -s` outputs).
2. **After deploy on a branch preview**: walk §3 against the branch deploy URL. Paste the same metrics side by side. Improvement must be visible.
3. **Existing tests**: `npx vitest run` — expected pass count from `main` plus whatever the prior search fixes added, all green.
4. **Typecheck**: `npx tsc --noEmit` returns silently.
5. **Build**: `npm run build` succeeds with no new warnings.
6. **Palette parity**: open ⌘K on the branch deploy, type `tina cobre`, confirm products first, no Insights fall-through. This proves fix `7341ec5` is still intact.
7. **Catalog presentation parity**: visit `/shop/catalog?q=zzzzzzz` and confirm the bilingual no-results state from fix `240d8d0` still renders.
8. **Timeout-banner parity**: if the prior fix's `search_timeout` banner can be triggered (a genuinely too-broad query that still exceeds 6 s on Node), confirm it renders correctly. If you cannot trigger it after the runtime change, that itself is fine — note in the report that the timeout no longer fires under Node-serverless limits.

If any Sacred Surface symptom appears (cart, PDP, checkout, sitemap, hreflang, brand pages, etc.), stop, revert, and ask Joshua.

---

## 9. Out-of-scope reminders

- **Do not** change the search engine, the scorer, the cache, the route timeouts, or the UI banners. The previous three fixes already cover those.
- **Do not** declare a global runtime in `next.config.ts`. Opt files in individually so you can revert one without affecting the rest.
- **Do not** modify `middleware.ts`.
- **Do not** add `runtime = "edge"` anywhere — that is the opposite of this fix.
- **Do not** introduce new dependencies.
- **Do not** redesign the Insights pages.
- **Do not** touch `netlify.toml`.

---

## 10. Final report (paste into PR description and `MASTER-PLAN.md` §10)

```
### PM-XX — Storefront search: move heavy handlers off the edge runtime
Commit: <sha>
Branch: fix/storefront-search-edge-runtime

Series:
- 7341ec5 — palette UX (already shipped)
- 240d8d0 — catalog presentation (already shipped)
- <sha for prior route+engine fix> — engine scan budget + route raceTimeout (if shipped)
- this fix — runtime pinning

Bug: Netlify Edge Function timed out on /shop/catalog and the products-search API,
even after the prior engine/route timeout work. Root cause: @netlify/plugin-nextjs v5
serves all handlers via edge by default; budgets assumed Node serverless.

Files changed (diff stats):
- app/api/products/search/route.ts (+1 -0)
- app/[locale]/shop/catalog/page.tsx (+1 -0)
- <any other justified files> (+1 -0 each, with rationale)

Live-site verification (§3 matrix, before vs after):
| URL | Before | After |
| /shop/catalog?q=toto | <crash or X seconds> | <Y seconds, returned correctly> |
| /shop/catalog?q=Litze | <X seconds> | <Y seconds> |
| /shop/catalog?q=K-13448-CP | <X seconds> | <Y seconds> |
| /api/products/search?q=toto&limit=6 | <result> | <result> |
| /en homepage | <X seconds> | <Y seconds> |

Sacred Surface parity proof:
- scoreProduct, searchProducts, search-utils.ts: untouched
- Palette: unchanged, tina cobre still surfaces products first
- Catalog presentation: unchanged, no-results state from 240d8d0 still renders
- PDP render: not touched
- Existing tests: <total> passing
- Typecheck: clean
- Build: clean

Runtime exports added to (with rationale for each beyond the two required):
- app/api/products/search/route.ts — required (heavy products search)
- app/[locale]/shop/catalog/page.tsx — required (catalog page server-render)
- <others with file:line + observed slowness evidence>

Files I evaluated and left on edge (with reason):
- middleware.ts — must remain edge per Next.js
- <others>

Open questions for Joshua: <list, or "none">
```

---

## 11. Stop conditions

Stop and ask Joshua before continuing if any of these are true:

- The "edge function timed out" cannot be reproduced on `main`. If you cannot reproduce it, do not guess at a fix; report what you found and ask.
- The deployed staging URL does not match the expected behavior after the runtime change — e.g. the build fails, the page 500s, or the palette breaks.
- You believe a route beyond the two required (catalog page + products-search API) genuinely needs the runtime opt-out. List your candidates and ask before adding the export — Sacred Surface caution.
- You see any behavioral change on a Sacred Surface item that is not search.
- The prior fix `fix/storefront-search-502-and-timeout` has not landed yet and the agent is confused about which baseline to verify against. In that case, branch this fix off whichever commit you find as `HEAD` on the search line; do not try to reorder commits.

End of fix. If this lands and the §3 matrix is green on staging, search is done. The trilogy plus this runtime fix is the entire storefront-search story.
