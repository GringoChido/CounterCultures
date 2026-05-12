# [P2] Documentation & Loose-File Consolidation

> **Status:** PENDING · **Priority:** P2 · **Effort:** 1 hr · **Branch:** `claude/fix-doc-consolidation`
> **Last updated:** 2026-05-12

## Why this matters
The project root is a dumping ground of duplicate `.docx` plans, ambiguously-versioned proposals, and ~50 loose `CLAUDE-CODE-*.md` prompt files left over from prior sessions. New collaborators (and Claude itself in fresh sessions) cannot tell which document is canonical, which leads to people executing against superseded plans. Cleanup pays dividends every onboarding.

## The problem (evidence)
- Three `Full-Plan.docx` files (original + "copy" + "copy 2"), all exactly 24,395 bytes — likely identical.
- Two `Proposal.docx` files; the "copy" variant is 80 bytes smaller, meaning it was actually edited.
- ~50 root-level `.md` files like `CLAUDE-CODE-AP-TAB-AND-DOC-VIEWER-FIX.md`, `CLAUDE-CODE-CART-FEATURE.md`, etc., most superseded.

## Scope
**In scope:**
- Pick canonical version of each `.docx` pair/trio.
- Move non-canonical to `_old/` with a date-stamped filename.
- Move superseded `CLAUDE-CODE-*.md` files into `docs/_archive/`.
- Add a short reference block in `AGENTS.md` (or `README.md`) pointing at the canonical docs.

**Out of scope:**
- Rewriting any plan content.
- Deleting anything — only moving.

## Files to touch
- `Full-Plan.docx` + copies (root)
- `Proposal.docx` + copy (root)
- ~50 root `*.md` files
- `_old/` (new directory)
- `docs/_archive/` (new directory)
- `AGENTS.md` (add canonical-docs section)

## The fix (step by step)
1. `diff` the three `Full-Plan.docx` files (use `unzip -p` + `diff` on `word/document.xml`). If identical, keep the cleanest filename; archive the others.
2. `diff` the two `Proposal.docx` files. The smaller one is the edited one — open both, confirm with Joshua which is canonical.
3. `mkdir -p _old docs/_archive`.
4. Move non-canonical `.docx` to `_old/YYYY-MM-DD-<original-name>`.
5. For each root-level `CLAUDE-CODE-*.md`: open, check if its content is reflected in `docs/fixes/` or `AGENTS.md`. If yes (or it's clearly stale), move to `docs/_archive/`. If unique/still useful, move to `docs/`.
6. Add an `AGENTS.md` section: `## Canonical docs` listing `Full-Plan.docx`, `Proposal.docx`, and `docs/fixes/` as the source of truth.
7. Commit with a clear message listing every move.

## Acceptance criteria
- [ ] Exactly one `Full-Plan.docx` and one `Proposal.docx` remain at root.
- [ ] All non-canonical copies live under `_old/`.
- [ ] Root has zero `CLAUDE-CODE-*.md` files.
- [ ] `AGENTS.md` references the canonical set.
- [ ] `git status` after move shows clean rename history.

## Verification
```bash
ls -1 *.docx *.md | wc -l
```
Expected: drops from ~55 to under 10.

## Dependencies
**Requires:** none.
**Blocks:** none.

## Notes
See `AGENTS.md` for current doc index. Use `git mv` so history is preserved. Don't delete `CLAUDE.md` or `AGENTS.md` themselves — those are wired into the loader.
