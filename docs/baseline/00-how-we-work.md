# How we work — Counter Cultures operating manual for Claude Code sessions

> Read this before driving any session against the codebase. Last refreshed: 2026-05-12.

---

## The two-doc system

Counter-Cultures uses a **two-doc operating system** for getting work done:

1. **[`COUNTER-CULTURES-ROADMAP.md`](../../COUNTER-CULTURES-ROADMAP.md)** at the project root — the master list. Every issue, every priority, every status. Open this each morning.
2. **`docs/baseline/`** — read-mostly evidence layer. What's built, what data we have, how things perform, where things break. Future sessions load these to get oriented in 60 seconds.
3. **`docs/fixes/`** — execution layer. One file per fix. Each is a self-contained Claude Code prompt with context + scope + acceptance + verification.

Together with **`AGENTS.md`** (the entry-point) and the canonical rule docs (`docs/finance/`, `docs/commerce/`, `docs/staff/`), this gives any agent session everything it needs to act with full context.

---

## The session protocol (5 steps)

**Per fix, fresh session is best practice.** Long sessions accumulate context, slow down, and quality degrades. The fix-file system is built to make new sessions instant to start.

1. **Pick the work.** Open `COUNTER-CULTURES-ROADMAP.md`, take the highest-priority `🔴 PENDING` item, change its status to `🟡 IN PROGRESS`.
2. **Start a fresh Claude Code session.** Optional: create a worktree with the Superpowers skill if you want isolation.
3. **Brief the agent.** Tell Claude:
   ```
   Read AGENTS.md and docs/fixes/<filename>, then execute.
   ```
   The fix file has everything Claude needs — context, scope, files to touch, acceptance criteria, verification command. No re-discovery needed.
4. **Review and commit.** Each fix = one branch / one PR / one commit. If something breaks, revert one commit.
5. **Update the roadmap.** Change status to `🟢 DONE` with a brief one-line note. Close the session.

---

## When to combine fixes in one session

Best practice is one-per-session, but these are fine to combine:

- **P0 env-var cluster** (P0.1–P0.5) — all are "set the right env var or move a file, redeploy, verify." Knock them out together in one ~90 min session.
- **Tight dependencies** — if Fix B can't be verified without Fix A in place, do them together.
- **Bulk text/config sweeps** — stale code sweep, doc consolidation, worktree cleanup — single session, git as safety net.

Never combine: a security fix with a feature build. Anything large with anything else.

---

## What NOT to do

- **Don't re-audit before each fix.** The audit already happened. The fix files have what you need.
- **Don't write to the main branch directly.** Branch per fix.
- **Don't skip the verification step.** Every fix file has a verification command. Run it. Confirm. Then mark done.
- **Don't update fix files mid-execution to match what Claude did.** If the fix evolved, capture the new approach in a new fix file or a follow-up.
- **Don't let "scope creep" into a fix session.** If you find a new issue while fixing X, add it to the roadmap as a new fix and keep going.

---

## File map (where things live)

```
counter-cultures/
├── COUNTER-CULTURES-ROADMAP.md   ← MASTER FILE — open every morning
├── CLAUDE.md                     ← thin pointer; loads everything below
├── AGENTS.md                     ← People, roles, code-touch-point gates
├── docs/
│   ├── baseline/                 ← Read-mostly evidence (this directory)
│   │   ├── 00-how-we-work.md     ← This file
│   │   ├── 01-architecture.md    ← Routes, integrations, app shape
│   │   ├── 02-data-layer.md      ← Sheets/Drive/Gmail patterns + SoT map
│   │   ├── 03-performance.md     ← Real perf numbers + cold-start data
│   │   ├── 04-dashboard-state.md ← Per-module state + role gaps
│   │   ├── 05-stale-inventory.md ← What to delete + worktrees
│   │   └── 06-data-quality.md    ← Sheets sampling findings
│   ├── fixes/                    ← Execution layer (one file per fix)
│   │   ├── p0-*.md
│   │   ├── p1-*.md
│   │   ├── p2-*.md
│   │   └── p3-*.md
│   ├── finance/                  ← Existing canonical rules
│   ├── commerce/                 ← Existing canonical rules
│   └── staff/                    ← Existing canonical rules
```

---

## Status semantics

- **🔴 PENDING** — not started. Available for anyone (you or an agent) to pick up.
- **🟡 IN PROGRESS** — someone is on it. Don't double-up.
- **🟢 DONE** — shipped + verification passed.
- **⚪ BLOCKED** — there's an external dependency. Note what in the fix file.

Update status the moment things change. The roadmap is only useful if it reflects reality.
