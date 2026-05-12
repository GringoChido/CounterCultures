# [P2] Stale Code Sweep (~3,150 LOC)

> **Status:** PENDING · **Priority:** P2 · **Effort:** 4 hrs · **Branch:** `claude/fix-stale-code-sweep`
> **Last updated:** 2026-05-12

## Why this matters
The audit identified ~3,150 lines of HIGH-confidence dead code plus 358 production `console.*` calls. Dead code makes the project look unmaintained, slows TypeScript / Next.js compilation, and inflates the surface area Claude has to reason about in every session. A single targeted sweep is the cheapest way to recover signal-to-noise.

## The problem (evidence)
Per audit:
- 8 DEPRECATED Odoo API routes — 378 lines (covered by P1.16, exclude here).
- 3 other `@deprecated` route files.
- Orphan source files: `blog-content.tsx` (223L), `sample-customs-data.ts` (709L), `reconciliation.ts` (366L), duplicate `featured-brands-band.tsx`.
- 9 unimported components — ~1,004 lines.
- Unused deps: `react-hook-form`, `@hookform/resolvers`.
- 358 `console.log/warn/error` calls in production code.

## Scope
**In scope:**
- Delete the 3 `@deprecated` route files (non-Odoo).
- Delete the 4 orphan source files.
- Delete the 9 unimported components.
- `npm uninstall react-hook-form @hookform/resolvers`.
- Replace production `console.*` with project logger or remove (358 sites).

**Out of scope:**
- The 8 Odoo DEPRECATED routes (owned by P1.16).
- Behavioral refactors — pure deletion.

## Files to touch
- `app/api/**/route.ts` (3 deprecated)
- `app/components/blog-content.tsx`
- `app/lib/sample-customs-data.ts`
- `app/lib/reconciliation.ts`
- Duplicate `featured-brands-band.tsx` (keep the imported one)
- `app/components/**` (9 unimported)
- `package.json`, `package-lock.json`
- ~358 sites across `app/**`, `lib/**` for `console.*` removal

## The fix (step by step)
1. Run `npx knip` (or `ts-prune`) to confirm the orphan list against current main; reconcile with audit.
2. **Batch 1:** delete the 3 `@deprecated` routes. `npm run build && npm test`. Commit.
3. **Batch 2:** delete the 4 orphan source files. Build + test. Commit.
4. **Batch 3:** delete the 9 unimported components. Build + test. Commit.
5. **Batch 4:** `npm uninstall react-hook-form @hookform/resolvers`. Build + test. Commit.
6. **Batch 5:** `console.*` sweep. Use a codemod (`jscodeshift`) to (a) keep `console.error` inside `catch` blocks, replaced with `logger.error`, (b) delete `console.log/warn` from production paths, (c) leave `console.*` in `scripts/` and tests untouched. Build + test. Commit.
7. PR with per-batch commits so each is independently revertable.

## Acceptance criteria
- [ ] `npm run build` and `npm test` pass after every batch.
- [ ] `git diff --stat main` shows ≥ ~3,000 lines deleted.
- [ ] `grep -r "console\." app/ lib/ | wc -l` < 25 (the survivors are logger replacements).
- [ ] `react-hook-form` no longer appears in `package.json`.
- [ ] No new TS errors.

## Verification
```bash
npm run build && npm test && npx knip
```
Expected: clean build, tests green, knip reports zero unused files in the targeted directories.

## Dependencies
**Requires:** P1.16 must finish (or run before/after — coordinate to avoid merge conflicts on Odoo routes).
**Blocks:** none.

## Notes
See `AGENTS.md` for the project logger import path. Keep commit hygiene tight so each batch can be reverted cleanly.
