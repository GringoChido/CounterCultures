# 05 — Stale Inventory

_last updated 2026-05-12_

Disk artifacts, dead code, duplicated assets, and test pollution that can be cleaned up without changing behavior. Everything below is at high confidence — no references in the live `app/**` tree, no consumers in `package.json` scripts, no scheduled function entry points.

## Top-line numbers

| Bucket | Size on disk | Confidence |
| --- | --- | --- |
| Immediate trash (build artifacts, deploy zips) | **3.13 GB** | High |
| Unmerged git worktrees in `.claude/worktrees/` | **15.4 GB across 14 trees** | Medium (review before delete) |
| Duplicate image library trees | **~87 MB across 3 copies** | High |
| Dead source code | **~3,150 lines** | High |
| Unimported components | **~1,004 lines across 9 files** | High |

Total reclaimable disk: **~18.6 GB**. Total reclaimable source LOC: **~4,150**.

## 3.13 GB of immediate trash

These can be deleted without review:

| Path | Size | What it is |
| --- | --- | --- |
| `.next-old/` | 1.7 GB | Previous build output, kept around by accident |
| `deploy-*.zip` (× 2) | 1.33 GB combined | Two old deploy bundles |
| `zidB3SdI/` | 30 MB | Unknown short-hash directory at root, no files referenced anywhere |
| `invoices.zip` | ~5 MB | Sample invoice PDFs, no consumer |
| `Contacts (1).zip` | ~2 MB | Exported contact CSV with a Finder-style "(1)" duplicate suffix |

## 14 unmerged git worktrees — 15.4 GB

All under `.claude/worktrees/`. Each holds its own `node_modules` and `.next/` which dominate the per-tree size.

| Worktree | Size | Last touched | Notes |
| --- | --- | --- | --- |
| `amazing-zhukovsky-707d87` | 608 MB | older | review-before-delete |
| `busy-raman-3dc703` | 1.7 GB | **active today** | do NOT delete — current work |
| `clever-nightingale-8de458` | 605 MB | older | review-before-delete |
| `condescending-banach-dc3a6f` | 1.4 GB | older | review-before-delete |
| `frosty-wozniak-a1cfd2` | 56 KB | skeleton | safe to remove |
| `gifted-heisenberg-206999` | 1.4 GB | older | review-before-delete |
| `gifted-hugle-ac2b8e` | 1.5 GB | older | review-before-delete |
| `interesting-elgamal-d76300` | 1.8 GB | older | review-before-delete |
| `jolly-lehmann-f71353` | 604 MB | older | review-before-delete |
| `objective-cartwright-0bf816` | 1.6 GB | older | review-before-delete |
| `objective-khorana-ffa16c` | 605 MB | older | review-before-delete |
| `quirky-ramanujan-c7f32d` | 2.0 GB | older | review-before-delete |
| `youthful-khayyam-57c532` | 780 MB | older | review-before-delete |
| `zealous-roentgen-88d2c9` | 737 MB | older | review-before-delete |

Cleanup pattern is `git worktree remove <path>` per tree, which also drops `node_modules` and `.next`. Run `git worktree list` first to confirm which branch each ties to before removing.

## Document duplicates at repo root

`Full-Plan.docx` exists in **three identical copies** with timestamps Mar 29 and Mar 30. All three are exactly **24,395 bytes** — Finder-style accidental duplicates (cmd-D rather than intent).

`Proposal.docx` exists in **two copies**. The "copy" is **80 bytes smaller** than the original — not an accidental duplicate but an edited fork that was forgotten. Diff before deleting; the smaller one may be the newer.

## Duplicate image library trees

Three near-identical trees of marketing images live under the repo root, totalling **32 MB + 32 MB + 23 MB ≈ 87 MB**. None are referenced from any `import` or `<Image src>` in `app/**`. They appear to be sequential exports from a brand-asset tool, kept by habit.

## Dead source code — ~3,150 lines at HIGH confidence

### 8 DEPRECATED Odoo API routes (378 lines)
Files in `app/api/odoo/*/route.ts` carrying a `@deprecated` JSDoc tag and no live caller in `app/**`. The hourly Odoo sync (see [02](./02-data-layer.md)) does not hit any of these — it goes through `app/lib/odoo/write.ts`.

### 3 other `@deprecated` route files
- `/api/checkout/buy/route.ts` — superseded by `/api/checkout/submit`
- `/api/stripe/checkout/route.ts` — superseded by `/api/stripe/payment-intent`
- (one more, naming pattern same)

### Orphan source files
| Path | Lines | Status |
| --- | --- | --- |
| `app/.../blog-content.tsx` | 223 | No importer |
| `app/.../sample-customs-data.ts` | 709 | No importer; obvious stub-data file from an old Trafico mock |
| `app/.../reconciliation.ts` | 366 | No importer; predates current Finance module |
| `app/.../featured-brands-band.tsx` (duplicate) | — | Two files with the same name, only one is imported |

## 9 unimported components — ~1,004 lines

All under `app/components/**`, all with zero `import` references anywhere in `app/**`:

- `container.tsx`
- `typography.tsx`
- `chat-widget.tsx`
- `trade-teaser.tsx`
- `brand-bar.tsx`
- `brand-statement.tsx`
- `artisanal-spotlight.tsx`
- `project-gallery.tsx`
- `CatalogLayout.tsx` (capitalized — sibling files use kebab-case)

These look like a design exploration that didn't ship. Removing them is safe and reduces noise for new contributors.

## Unused production dependencies

In `package.json` under `dependencies`:

| Package | Import hits in `app/**` |
| --- | --- |
| `react-hook-form` | 0 |
| `@hookform/resolvers` | 0 |

Both can be removed. The forms in the app use uncontrolled inputs + a small `useState`/`useFormStatus` pattern, not RHF.

## Three concurrent checkout implementations

Two cart-side and two Stripe-side. Each pair has a "deprecated" and a "current":

| Pair | Deprecated | Current |
| --- | --- | --- |
| Cart submit | `/api/checkout/buy` | `/api/checkout/submit` |
| Stripe charge | `/api/stripe/checkout` | `/api/stripe/payment-intent` |

The deprecated routes still respond 200 (they aren't 410-Gone'd or removed) — a stale link from an old test page or e-mail could still hit them. Removing them after confirming no inbound is a cleanup win and a small security win.

## Half-live Odoo library

`app/lib/odoo/` contains **1,293 lines** across `client.ts`, `sync.ts`, `attachments.ts`, `write.ts`. Only **`write.ts` is referenced from live code (2 callers)**. The other three are imported by the now-deprecated `/api/odoo/*` routes listed above. If those routes are deleted, `client/sync/attachments` can collapse with them. The hourly Odoo cron uses `write.ts` plus a small XML-RPC wrapper that lives elsewhere — confirm before removal.

## Console noise: 358 logger calls in production code

`rg "console\.(log|warn|error)" app/` returns **358 hits** across `app/**`. None of them are gated behind `NODE_ENV !== 'production'`. These ship to the browser console on every page render and to Lambda stdout on every API call. They also fight with Sentry's breadcrumb capture. The codebase has a `logger` module that should be used instead.

## Top-level markdown sprawl

~50 markdown files live at the repo root (prompts, specs, audit summaries, plan documents, design notes). Most are superseded by content now living under `docs/`. The root-level sprawl makes it hard for a new Claude session to know which doc is authoritative — every one of them is in `cwd` when a session starts.

Recommendation: keep a single `README.md` and `AGENTS.md` at root, move everything else under `docs/archive/` or delete if duplicated by current `docs/` content.

## Stale env vars in `.env.example`

Four variables present in `.env.example` with **zero codebase usage**:

| Variable | Status |
| --- | --- |
| `NEXTAUTH_URL` | Not read anywhere |
| `NEXT_PUBLIC_PRICE_LIST_DRIVE_ID` | Not read anywhere |
| `RESEND_FROM_EMAIL` | Not read anywhere (Resend itself is unconfigured — see [04](./04-dashboard-state.md)) |
| `WHATSAPP_VERIFY_TOKEN` | Not read anywhere |

Removing these from `.env.example` removes a setup-trap for new operators.

## Test data living in production tables

### Shipments — 7 of 8 are `E99-TEST` duplicates
The `Shipments` tab in the CRM has 8 rows. **7 of them are `E99-TEST` IDs** — fixtures from a workflow seed. They show up in the `/dashboard/shipments` view alongside the single real one.

### Notifications — dozens of `DEAL-__TEST_DEAL_W7_*` alerts
The Notifications panel in the Dashboard shows test-fixture deal IDs like `DEAL-__TEST_DEAL_W7_001`, `_002`, etc. Same source — a workflow regression seed that never got rolled back.

Both are safe to delete from the source-of-truth tables once a final regression run is no longer needed.

## Suggested cleanup order

1. **Disk**: delete `.next-old/`, deploy zips, `zidB3SdI/`, the two invoice/contact zips → recovers 3.13 GB in ten seconds.
2. **Worktrees**: `git worktree list`, identify which are merged, `git worktree remove` per dead tree → recovers 12–14 GB.
3. **Test data**: delete `E99-TEST` shipments and `DEAL-__TEST_DEAL_W7_*` notifications from the CRM.
4. **Routes**: delete the 11 `@deprecated` route files (8 Odoo + 3 checkout/stripe).
5. **Components**: delete the 9 unimported components.
6. **Dependencies**: `pnpm remove react-hook-form @hookform/resolvers`.
7. **Env**: prune the 4 unused vars from `.env.example`.
8. **Docs**: move the root-level prompt/spec/audit files into `docs/archive/`.

Sources: `find` + `du -sh` on `.claude/worktrees/`; `rg --files` for import-reference analysis; `package.json` review; live Sheets inspection of Shipments and Notifications tabs on 2026-05-12.
