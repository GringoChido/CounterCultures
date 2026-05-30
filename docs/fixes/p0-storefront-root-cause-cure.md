# P0 — Storefront root-cause cure: middleware passthrough timeout + missing webhook secret

> **One fix, one session.** Invoke as: `Read AGENTS.md and docs/fixes/p0-storefront-root-cause-cure.md, then execute.` Branch per fix, commits per logical change. Smallest possible diff.

> **This is the actual fix.** The four prior search fixes (`7341ec5`, `240d8d0`, `9f6c7be`, `8e3eb5c`) addressed real bugs but did not touch the surface where Roger's crashes are originating. I pulled the live Netlify Edge Function log on 2026-05-28 11:06 PM and have the actual stack trace. This file is grounded in that evidence, not speculation.

---

## 0. Mandatory pre-flight (do NOT skip)

1. Read `AGENTS.md` end to end. Staging vs production rules apply.
2. Read `docs/SURGICAL-RULES.md`. The four conditions: (C1) no regression on a protected system, (C2) no overlap, (C3) don't disrupt in-motion work, (C4) only enhance.
3. **Sacred Surface awareness.** This fix touches `middleware.ts` (Sacred Surface adjacent — middleware runs on every public request), `netlify.toml` (cutover config), and instructs setting environment variables in the Netlify UI. It does **not** touch search engine, palette, catalog page, scorer, cache builder, cart, checkout, money path, or any other Sacred Surface item.
4. Branch: `fix/storefront-root-cause-cure`. Three commits expected.
5. Stop conditions are in §10. Honor them.

---

## 1. The actual root cause (from the live stack trace)

Pulled from Netlify dashboard → countercultures → Logs & metrics → Edge Functions on 2026-05-28 at 11:06:50 PM:

```
01KSS20D error [Next.js Middleware Handler]
Error: There was an internal error while processing your request
    at FunctionChain.fetchPassthrough (file:///platform/platform/bootstrap/function_chain.ts:129:13)
    at handleMiddleware (file:///platform/edge-runtime/middleware.ts:59:22)
Caused by AbortError: The signal has been aborted
    at AbortSignal.[[[signalAbort]]] (ext:deno_web/03_abort_signal.js:147:14)
    at AbortController.abort (ext:deno_web/03_abort_signal.js:304:30)
```

**Plain English:**

- Next.js middleware **always runs as a Netlify Edge Function** (Deno runtime). It cannot be moved to Node.js via `export const runtime = "nodejs"`. The runtime fix in `8e3eb5c` did not and could not address middleware.
- The middleware in `middleware.ts` calls `intlMiddleware(req)` for public pages, which returns `NextResponse.next()`. Netlify treats `NextResponse.next()` as a **passthrough** to the upstream Node.js Server Handler.
- The Next.js Server Handler is hydrating the **354,449-product catalog cache** on cold start. The function log shows durations of **11,000 to 19,534 ms** with **1024 MB memory** (the cap). Even "warm" hits sometimes re-hydrate.
- The edge function (middleware) holds the connection waiting for the slow upstream. When the wait exceeds Netlify's edge function budget, `AbortController.abort()` fires, the middleware crashes, and the user sees the generic "An unknown error has occurred" page.

**This is why no prior fix worked for Roger's crashes.** All four prior fixes touched the catalog page, the search API, the engine, the runtime export. None of them touched middleware. The crash is in middleware.

---

## 2. Secondary critical issue found in the same Netlify log

The Function log for `___netlify-server-handler` is repeating this warning on roughly every minute:

```
WARN [Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set —
     every webhook request will return 503 and Stripe events
     will not be processed
```

Confirmed by reading the Netlify project's Environment Variables page directly:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set.
- `STRIPE_SECRET_KEY` is set.
- **`STRIPE_WEBHOOK_SECRET` is missing.**

This is `STATE-OF-THE-UNION.md` blocker B2. Every Stripe payment today silently fails to record in our system: Stripe collects the money, the webhook 503s, no Odoo / Sheets record is created. Soft launch cannot ship like this even if the storefront stops crashing.

---

## 3. Reproduce before fixing (mandatory, but you have the evidence already)

The reproduction has been done; the evidence is in this file (§1 and §2). You do **not** need to re-trigger the crash on production. Move to fixing.

For the **after** state, you will verify on the branch deploy that:

1. Loading `/en/shop/catalog?q=toto` no longer produces a middleware abort.
2. The function log shows the new middleware log line if anything throws.
3. The Stripe webhook secret check no longer logs the "not set" warning.

---

## 4. Files in scope

You may edit:

- `middleware.ts` — narrow the middleware so it does not block on slow upstream for already-localed public pages, and add structured try/catch logging so any future middleware crash is diagnosable.
- `netlify.toml` — add a redirect that sends non-localed `/shop/*` and `/brands/*` paths to their default-locale equivalent, so removing them from the middleware matcher does not break URLs that lack a locale prefix.
- New file `docs/fixes/env-vars-required.md` (or update an existing handoff doc) — document the env vars that must be set in the Netlify UI for the soft launch to be functional. This is documentation only; setting the actual values is a manual step in Netlify, not a code change.

Read-only (consult, do not modify):

- `app/lib/products-full.ts` `getCache` — the catalog hydration. Slow on cold start; do not refactor in this fix.
- `app/components/search/search-palette.tsx`, `app/[locale]/shop/catalog/page.tsx`, `app/api/products/search/route.ts` — already touched by prior fixes; leave alone.
- `app/api/stripe/webhook/dispatcher.ts` — uses `STRIPE_WEBHOOK_SECRET`. Don't touch the code; fix the env.

Out of scope, do **not** modify:

- The search engine, the scorer, the cache builder.
- The page components or API routes.
- PDPs, JSON-LD, sitemap, robots, ISR config.
- Cart, checkout, money path, factura, lifecycle.
- Visual search, Insights pages, brand pages.
- Any test file under `app/lib/__tests__/`.

---

## 5. Investigation tasks (do all before patching)

1. Read `middleware.ts` end to end. Confirm the current matcher (`["/((?!_next|_vercel|.*\\..*).*)"]`), confirm that for already-localed public pages the final return is `intlMiddleware(req)`, and confirm the dashboard / account / API auth branches do not need modification.
2. Read `netlify.toml`. Confirm there are no existing redirects under `[[redirects]]` for `/shop` or `/brands` that would conflict with the new ones.
3. Read the Stripe webhook dispatcher (`app/api/stripe/webhook/dispatcher.ts`) just enough to confirm it reads `STRIPE_WEBHOOK_SECRET` and short-circuits to a 503 when unset. Do not modify.
4. Confirm the existing routes are under `app/[locale]/shop/...` and `app/[locale]/brands/...` so that direct rendering of `/en/shop/catalog` does not require middleware-level locale handling. The route segment `[locale]` already captures the locale.

Document every finding with `file:line` citations.

---

## 6. The three changes (one commit each)

### Commit 1 — Narrow middleware: short-circuit already-localed public pages and add structured logging

Edit `middleware.ts`:

- Before the final `return intlMiddleware(req)`, add a fast path:

  ```ts
  // Fast path: already-localed public pages skip intlMiddleware entirely.
  // intlMiddleware is only needed to redirect non-localed URLs to the default
  // locale; if the URL already has /en/ or /es/, we can pass through
  // immediately without the i18n work.
  if (/^\/(en|es)(\/|$)/.test(pathname)) {
    return NextResponse.next();
  }
  ```

- Wrap the entire `export default async function middleware` body in a `try { ... } catch (err) { ... }`. On catch, log a structured JSON line and return a safe `NextResponse.next()` so the request continues to the upstream:

  ```ts
  try {
    // ... existing middleware logic ...
  } catch (err) {
    console.error(JSON.stringify({
      where: "middleware",
      pathname: req.nextUrl.pathname,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }));
    return NextResponse.next();
  }
  ```

- Do not change the matcher in this commit.

**Acceptance:**
- Existing logic for dashboard, account, API auth, NextAuth, protected API, static files is unchanged.
- A request to `/en/shop/catalog` no longer enters `intlMiddleware`.
- A request to `/shop/catalog` (no locale) still enters `intlMiddleware` and gets the default-locale redirect.
- Any thrown error in middleware now logs structured JSON to the Netlify function log and the request still passes through.

### Commit 2 — Netlify redirects for non-localed `/shop` and `/brands`

Edit `netlify.toml`. Add at the end of the file (after existing `[[plugins]]` and `[[functions...]]` blocks):

```toml
# Non-localed public paths redirect to the default locale (en).
# This complements the middleware short-circuit in middleware.ts so requests
# that arrive without a locale prefix still resolve to a valid route.
[[redirects]]
  from = "/shop/*"
  to = "/en/shop/:splat"
  status = 302

[[redirects]]
  from = "/brands/*"
  to = "/en/brands/:splat"
  status = 302

[[redirects]]
  from = "/insights/*"
  to = "/en/insights/:splat"
  status = 302
```

Do not add a catch-all `/*` redirect; that would interfere with `/dashboard`, `/account`, and `/api`. Only add for the public storefront sections.

**Acceptance:**
- A request to `/shop/catalog` returns 302 to `/en/shop/catalog`.
- A request to `/en/shop/catalog` is unaffected.
- `/dashboard/*`, `/account/*`, `/api/*` are unaffected.

### Commit 3 — Document the launch-critical env vars

Create `docs/fixes/env-vars-required.md` with this exact content:

```markdown
# Launch-critical environment variables — Netlify production

These must be set in the Netlify UI for the soft launch to function.
Not setting them does not break the build; it silently breaks behavior.

Audited 2026-05-28 from the live Netlify project countercultures.

## Currently missing in production (set these in the Netlify UI)

| Variable | What breaks if missing | Where the value comes from |
|---|---|---|
| `STRIPE_WEBHOOK_SECRET` | Every Stripe webhook returns 503. Payments succeed at Stripe but no Odoo/Sheets record is created. STATE-OF-THE-UNION blocker B2. | Stripe dashboard → Developers → Webhooks → endpoint signing secret. Use the secret for the production webhook endpoint (https://countercultures.netlify.app/api/stripe/webhook). |
| `ODOO_STRIPE_JOURNAL_ID` | Stripe → Odoo payment register silently skipped. | Odoo Accounting → Configuration → Journals → Stripe journal. Use the journal id (integer). |
| `WHATSAPP_APP_SECRET` | All inbound WhatsApp webhook requests return 401 (fail-closed). | Meta Business → WhatsApp → App settings → App secret. |
| `NEXT_PUBLIC_ALLOW_INDEXING` | Controls whether the site is indexable. Leave UNSET on staging; set to `1` only when ready to be crawled by Google. | Manual flag. |

## Currently set (confirmed present)

- ANTHROPIC_API_KEY
- CRON_PROBE_KEY
- GOOGLE_* (multiple)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY

## Procedure

For each missing variable above:
1. Netlify dashboard → Project configuration → Environment variables → Add a variable.
2. Use scope: All scopes. Context: Production.
3. Save. Trigger a redeploy of `main` so the new env is picked up.

After STRIPE_WEBHOOK_SECRET is set, the `[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set` warning in the function log should stop appearing within one webhook cycle.
```

**Acceptance:**
- The file exists at the documented path.
- The procedure is followable by Joshua without further guidance.

---

## 7. Verification protocol (mandatory)

After all three commits, push the branch and wait for the Netlify branch deploy to go green. Then:

1. **Tests + typecheck + build**: `npx vitest run` (expect existing passing count), `npx tsc --noEmit` (silent), `npm run build` (no new warnings).
2. **Branch-deploy URL tests** (replace `<branch-deploy-url>` with the Netlify-generated URL):
   - `<branch-deploy-url>/en/shop/catalog?q=toto` → must NOT show "This function has crashed." May show search results, the bilingual "Your search is too broad" banner from `9f6c7be`, or a graceful empty/loading state.
   - `<branch-deploy-url>/shop/catalog` → must redirect (302) to `<branch-deploy-url>/en/shop/catalog`.
   - `<branch-deploy-url>/dashboard/login` → must load (middleware still runs for `/dashboard`).
   - `<branch-deploy-url>/en` → homepage loads.
3. **Netlify function log check**: with the branch deploy live, hit `/en/shop/catalog?q=toto` once. Then in the Edge Function log, confirm:
   - No new `[Next.js Middleware Handler] Error: ... AbortError` lines.
   - If anything does throw in middleware, the new structured JSON log with `where: "middleware"` appears so the next crash is diagnosable from this one log line.
4. **Sacred Surface parity:**
   - SearchPalette: open `<branch-deploy-url>/dashboard/login`, log in, open ⌘K, type `tina cobre`. Products show first, no Insights fall-through. Verifies `7341ec5` is intact.
   - PDP render: navigate to a known SKU. Loads cleanly.
   - Existing tests pass.

If any step in §7 fails, stop, revert the commit, and ask Joshua.

---

## 8. Out-of-scope reminders

- **Do not** refactor `products-full.ts` or the catalog cache. The slow hydration is real but addressing it is a separate fix (snapshot-on-disk, lazy hydration, or moving to a real search index). This fix prevents the middleware from waiting for that slowness; it does not eliminate the slowness itself.
- **Do not** delete any search code.
- **Do not** modify the catalog page, the search API, the search palette, the scorer.
- **Do not** add new dependencies.
- **Do not** alter the existing routes under `app/[locale]/`.
- **Do not** widen the `netlify.toml` redirects beyond `/shop`, `/brands`, `/insights`. A `/*` redirect would interfere with dashboard, account, and API paths.
- **Do not** touch the Stripe webhook dispatcher code. The fix is the env var, not the code.
- **Do not** set the env vars on Joshua's behalf. Document them; he sets them in the Netlify UI.

---

## 9. Final report (paste into PR description and `MASTER-PLAN.md` §10)

```
### PM-XX — Storefront root-cause cure (middleware + env)
Branch: fix/storefront-root-cause-cure
Commits: 3 (one per §6 step)

Root cause: Next.js middleware (always edge) was holding the connection
while passing through to the upstream Node.js server handler. The handler
hydrates the 354K-product catalog cache on cold start (11–19s with 1 GB
memory per the function log). When the handler took longer than the edge
function budget, AbortController aborted middleware, surfacing as
"This function has crashed — An unknown error has occurred" to the user.
Stack trace pulled from Netlify Edge Function log 2026-05-28 11:06:50 PM,
internal ID 01KSS20D.

Secondary: STRIPE_WEBHOOK_SECRET is not set in Netlify production env.
Every Stripe webhook is returning 503. Payments succeed at Stripe; no
Odoo/Sheets record is created. (STATE-OF-THE-UNION B2.)

Files changed:
- middleware.ts (fast-path for /en/ and /es/ prefixed URLs; structured catch)
- netlify.toml (redirects /shop, /brands, /insights to default locale)
- docs/fixes/env-vars-required.md (new; documents env vars Joshua must set)

Live verification (branch deploy):
- /en/shop/catalog?q=toto: no middleware crash, returns gracefully
- /shop/catalog: 302 → /en/shop/catalog
- /dashboard/login: loads (middleware intact for dashboard)
- /en: homepage loads
- Edge Function log: no new AbortError; new middleware log line on errors

Sacred Surface parity:
- SearchPalette ⌘K: tina cobre query → products first, no Insights fall-through
- PDP render: unchanged
- Engine + API route: unchanged
- Existing tests: <green summary>
- Build + typecheck: clean

Outstanding (NOT in this fix):
- STRIPE_WEBHOOK_SECRET, ODOO_STRIPE_JOURNAL_ID, WHATSAPP_APP_SECRET,
  NEXT_PUBLIC_ALLOW_INDEXING — Joshua sets in Netlify UI per
  docs/fixes/env-vars-required.md.
- Catalog cache cold-start hydration (11–19s) — the underlying slowness
  is contained by this fix (middleware no longer waits) but the cache
  itself still hydrates slowly. Separate optimization task.

Open questions for Joshua: none.
```

---

## 10. Stop conditions

Stop and ask Joshua before continuing if any of these are true:

- The `middleware.ts` matcher has been modified by someone else since the audit and excludes `/shop/*` already. (If so, the fix may not be needed; verify by reproducing the crash on `main` first.)
- `netlify.toml` already has `[[redirects]]` for `/shop`, `/brands`, or `/insights` that conflict with the proposed ones.
- The fast-path regex `^\/(en|es)(\/|$)/` does not match an actual locale path in your local dev (e.g., the project has added a third locale). Confirm by running a quick check.
- The dashboard ⌘K palette stops working after Commit 1. That means the fast-path is incorrectly catching `/dashboard/...`. Revert and re-scope.
- Existing tests fail after any commit.
- The Stripe webhook dispatcher needs code changes (it shouldn't — the env var fix is sufficient — but if the code itself rejects valid configurations, surface that and ask).

End of fix. This fix does NOT remove the underlying slow cache hydration. It prevents the middleware from being killed while waiting for it. The cache slowness becomes a separate, lower-urgency optimization task once Roger stops seeing the crash page.
