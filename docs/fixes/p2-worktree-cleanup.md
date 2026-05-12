# [P2] Git Worktree Cleanup (15.4 GB)

> **Status:** PENDING · **Priority:** P2 · **Effort:** 1 hr · **Branch:** `claude/fix-worktree-cleanup`
> **Last updated:** 2026-05-12

## Why this matters
14 git worktrees in `.claude/worktrees/` consume 15.4 GB. Most appear abandoned. Beyond disk pressure on Joshua's machine, abandoned worktrees clutter `git worktree list`, make `git branch` output unreadable, and risk us cherry-picking from a stale ref later. Cleaning them up is cheap and reversible (commits remain in reflog).

## The problem (evidence)
- `.claude/worktrees/` contains 14 sibling directories.
- Disk-usage audit: 15.4 GB cumulative.
- Several have not had a commit in >30 days.

## Scope
**In scope:**
- Inventory each worktree, capture its branch, list unmerged commits vs `main`.
- Cherry-pick any commits worth keeping into a new feature branch on `main`.
- Remove each worktree, delete its branch.
- Document the operation in the commit message.

**Out of scope:**
- Touching `main` or `claude/` branches that are actively in flight (check with Joshua before deleting any branch he names).
- Pruning `.git/objects/` (let normal gc handle it).

## Files to touch
- `.claude/worktrees/*` (removed)
- `scripts/worktree-cleanup.sh` (new, idempotent helper)
- Commit message documents which branches were removed and which commits (if any) were cherry-picked.

## The fix (step by step)
1. `git worktree list --porcelain > worktree-inventory.txt`.
2. For each worktree path, capture branch with `git -C <path> branch --show-current`.
3. For each branch, run `git log <branch> --not main --oneline` to see unmerged commits.
4. Build a table: `worktree_path | branch | unmerged_commits | last_commit_date | decision`.
5. Walk the table with Joshua. For each `decision = keep`, cherry-pick relevant commits to a new branch off `main`.
6. For each `decision = drop`: `git worktree remove --force <path>` then `git branch -D <branch>`.
7. `git worktree prune`.
8. Verify `du -sh .claude/worktrees/` is under 1 GB (only active worktrees remain).
9. Commit `scripts/worktree-cleanup.sh` and a short note in `AGENTS.md` about not letting worktrees pile up.

## Acceptance criteria
- [ ] `git worktree list` shows only active, intentional worktrees.
- [ ] Disk under `.claude/worktrees/` < 1 GB.
- [ ] Any valuable unmerged commits are preserved on named branches off `main`.
- [ ] Commit message lists every branch removed.

## Verification
```bash
git worktree list && du -sh .claude/worktrees/
```
Expected: short list, total size < 1 GB.

## Dependencies
**Requires:** none.
**Blocks:** none.

## Notes
Reflog keeps deleted branch tips around for ~90 days by default, so removals are recoverable if we delete something we shouldn't have. See `AGENTS.md` § branching for naming conventions (`claude/<slug>`).
