# 01 — System Architecture

_last updated 2026-05-12_

Counter Cultures is a single Next.js 16 (App Router) application deployed to Netlify, running React 19 + TypeScript 5 + Tailwind 4. One repo, one deploy pipeline, three logical platforms layered behind shared middleware:

1. **Public Website** — bilingual (es/en) commerce surface for 354K SKUs
2. **Operator Dashboard** — internal admin tooling at `/dashboard/*`
3. **Drive integration** — Google Drive uploads + per-user OAuth file browser

Everything below is what the codebase *currently is* as of the 2026-05-12 audit. Forward-looking architecture work belongs elsewhere.

## Stack inventory

| Layer | Library / Service | Notes |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | React 19, server components default, RSC streaming on |
| Language | TypeScript 5 (strict) | `noUncheckedIndexedAccess` not enabled |
| Styling | Tailwind 4 | CSS-first config, no `tailwind.config.ts` |
| Hosting | Netlify | SSR via `@netlify/plugin-nextjs`, Edge Middleware for locale, Scheduled Functions for cron |
| Auth | NextAuth (Auth.js) | Google OAuth provider, JWT sessions, bootstrap mode active (see [04](./04-dashboard-state.md)) |
| Payments | Stripe | `payment-intent` flow live, legacy `checkout` deprecated, webhook secret unset in prod |
| Email | Resend | API key not configured in prod (see [04](./04-dashboard-state.md)) |
| Observability | Sentry | `instrumentation.ts` wired, low sample rate |
| Localization | `next-intl` | Path-prefix routing `/es` / `/en` |
| Video | Remotion | Used by a single marketing render job, not on hot path |
| State (client) | Zustand × 5 | See "Client state" below |
| Data | Google Sheets API v4 | Service account + per-user OAuth (see [02](./02-data-layer.md)) |

No GraphQL layer. No tRPC. No Prisma/Drizzle — there is no relational DB in the production deploy. Search is `MiniSearch` built per-request in the search palette (and currently throws duplicate-ID errors — see [03](./03-performance.md)).

## Route topology

The audit counted **92 page files** and **181 API route handlers**.

### Pages (92)

- **~38 website routes** under `app/[locale]/...`: home, `/shop`, `/catalog`, `/brands`, `/brands/[slug]`, `/about`, `/contact`, `/trade`, `/trade/apply`, `/cart`, `/checkout`, `/checkout/success`, `/wishlist`, plus content pages (bathroom, kitchen, etc.). **No `/products/[slug]` route exists** — see the "no product detail pages" finding in [03](./03-performance.md).
- **~52 dashboard routes** under `app/dashboard/...`: ~22 sidebar modules plus nested detail views (e.g. `/dashboard/deals/[id]`, `/dashboard/customers/[id]`, `/dashboard/purchases/[id]`). Inventory matrix lives in [04](./04-dashboard-state.md).
- **2 misc**: `app/auth/...` callback, `app/_dev/...` design preview.

### API route handlers (181)

Grouped roughly:

| Cluster | Approx count | Examples |
| --- | --- | --- |
| `/api/cart/*` | 8 | `add`, `remove`, `quote`, `trade-code`, `submit` |
| `/api/checkout/*` + `/api/stripe/*` | 11 | Two concurrent checkout impls — see [05](./05-stale-inventory.md) |
| `/api/dashboard/*` | ~70 | One handler per Dashboard widget/table |
| `/api/odoo/*` | 14 | 8 are explicitly `@deprecated` (see [05](./05-stale-inventory.md)) |
| `/api/gmail/*` | 7 | OAuth + thread CRUD |
| `/api/drive/*` | 6 | Service-account writes + per-user listing |
| `/api/cron/*` | 3 | `odoo-sync`, `fx-sync`, `stale-deal-sweep` |
| `/api/sheets/*`, `/api/products/*`, misc | rest | Schema A + Schema B product readers |

### Server actions: zero

A repo-wide grep for `"use server"` returns **0 matches**. Every mutation in the app — cart updates, dashboard edits, Drive uploads, deal stage changes — goes through a `route.ts` handler. The contrast with the App Router idiom is sharp: **0 server actions vs 181 route handlers**. This shapes everything downstream: forms post JSON, Zustand stores call `fetch`, and there is no progressive-enhancement story for no-JS clients.

## Middleware

A single `middleware.ts` at repo root handles:

1. **Locale routing** via `next-intl` middleware. Default `es`, matched against `Accept-Language`, rewrites bare `/foo` paths to `/es/foo`. Static assets and `/api/*` are excluded by matcher.
2. **Auth gating** for `/dashboard/*`: checks the NextAuth JWT cookie; unauthenticated requests redirect to `/auth/signin`. Allowlist enforcement is currently bypassed — see the "bootstrap mode" note in [04](./04-dashboard-state.md).

Middleware runs on the Netlify Edge runtime. Cold-start cost there is small relative to the Lambda TTFB problem documented in [03](./03-performance.md).

## Client state — 5 Zustand stores

All under `app/lib/stores/` or `app/components/.../stores/`:

| Store | Purpose | Persists? |
| --- | --- | --- |
| `cart-store` | Cart line items, trade-price toggle, trade-code state | `localStorage` |
| `active-order-store` | Dashboard "currently editing this deal" context | session-only |
| `activity-store` | Activity feed cache for Dashboard Today view | session-only |
| `page-context-store` | Breadcrumb / page-title / right-rail state shared between layout slots | session-only |
| `fab-store` | Floating action button (compose menu) open/close + target context | session-only |

No Redux, no Jotai, no Recoil. React Query / SWR is not used — fetches are bare `fetch` calls inside Zustand actions or RSC `loader` functions.

## Build & runtime config

- **Output**: Next.js standalone, wrapped by `@netlify/plugin-nextjs` to produce a Netlify Function per route group.
- **SSR**: Every page that touches Sheets data renders on the Lambda. There is no `output: 'export'` static path.
- **ISR**:
  - Homepage uses `export const revalidate = 300` (5 min).
  - Catalog landing uses `export const revalidate = 1800` (30 min).
  - Brand pages are dynamic with `force-dynamic`.
  - Dashboard pages all set `dynamic = 'force-dynamic'` + `revalidate = 0`.
- **Image optimization**: `next/image` is wired but used on the hero only. The product catalog serves raw `.jpg` files — see [03](./03-performance.md).
- **Edge vs Node**: Middleware is Edge; every other route runs on Node Lambda (required by `googleapis` and the Sheets client).

## Scheduled Netlify Functions (cron)

Defined in `netlify.toml` under `[functions.scheduled]`:

| Function | Schedule (UTC) | What it does |
| --- | --- | --- |
| `odoo-sync` | Hourly | Pulls Odoo entities via XML-RPC → writes the 16+ `Odoo_*` tabs in the CRM (see [02](./02-data-layer.md)) |
| `fx-sync` | Daily 17:00 | Fetches USD↔MXN, writes to `FX_Rates` tab |
| `stale-deal-sweep` | Daily 14:00 | Flags quotes idle > N days, drives the "741 stale quotes" KPI in [04](./04-dashboard-state.md) |

There is no third-party cron service (no QStash, no GitHub Actions schedule). All three are Netlify-managed.

## Worktrees in `.claude/worktrees/`

The repo holds **14 active git worktrees** under `.claude/worktrees/`, totalling **15.4 GB** on disk. Each is a feature branch checkout with its own `node_modules` and `.next/`. Several are mid-edit, several are skeletons. Full inventory lives in [05](./05-stale-inventory.md). For architecture purposes the takeaway is: any future "what's the current state of X feature" question must clarify which worktree, because branches diverge meaningfully.

## What's *not* in the architecture

For future reference, things explicitly absent from the codebase:

- No service mesh, no microservices — single deployable.
- No worker queue (BullMQ, Trigger.dev, Inngest). Long-running work happens inline on Lambda or in scheduled cron.
- No GraphQL, tRPC, OpenAPI spec.
- No feature-flag service (LaunchDarkly etc.). A handful of env-var gates exist (`NEXT_PUBLIC_ENABLE_*`).
- No CDN in front of product images. Raw origin fetches — measured in [03](./03-performance.md).
- No A/B test framework.
- No telemetry beyond Sentry + GA4. PostHog, Amplitude, Mixpanel: not installed.

Source: codebase audit 2026-05-12 (`rg`/`fd` over `app/`, `package.json` review, `netlify.toml`, `middleware.ts`).
