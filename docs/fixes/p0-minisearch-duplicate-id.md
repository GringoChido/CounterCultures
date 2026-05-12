# [P0] MiniSearch duplicate-ID error crashes search palette site-wide

> **Status:** PENDING · **Priority:** P0 · **Effort:** 30-45 min · **Branch:** `claude/fix-minisearch-duplicate-id`
> **Last updated:** 2026-05-12

## Why this matters

Every time a customer opens the search palette (⌘K), the browser console throws `Error: MiniSearch: duplicate ID article:aveo-new-generation` and the articles index fails to build. Products still load (separate `/api/products/search` path), so search is partially functional, but the error is visible to anyone with DevTools open and the articles half of the index is dead. This is the user-reported bug that kicked off the audit — worth a small, visible win.

## The problem (evidence)

- Console error reproduces on every search palette open: `Error: MiniSearch: duplicate ID article:aveo-new-generation`.
- `app/lib/search-index.ts` builds the articles index by mapping `getAllArticles()` to documents with `id = article:${a.slug}`.
- `MiniSearch.addAll()` throws on the second occurrence of any duplicate ID.
- Two articles with slug `aveo-new-generation` exist — either two rows in the Posts tab of the Counter Cultures CRM, OR a collision between a Sheet-backed row and a hardcoded article in `app/lib/articles.ts`.
- After the throw, the articles MiniSearch index is in a broken state; subsequent searches return zero article results.

## Scope

**In scope:**
- Identify the duplicate source (Sheet rows vs hardcoded)
- Remove or rename the duplicate so only one canonical `aveo-new-generation` remains
- Add a dedup guard in `app/lib/search-index.ts` so this class of failure cannot recur — collisions warn instead of throw

**Out of scope:**
- Migrating all hardcoded articles to the Sheet (separate fix)
- MiniSearch upgrade / replacement (separate fix)
- Reworking the search palette UI (separate fix)

## Files to touch

- `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/search-index.ts` — add dedup guard
- `/Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/articles.ts` — possibly remove duplicate hardcoded entry
- Counter Cultures CRM → `Posts` tab — possibly delete or rename duplicate row

## The fix (step by step)

### Investigation

1. Open `app/lib/articles.ts`. Search for `aveo-new-generation`. Note whether it's a hardcoded article.
2. Open the Counter Cultures CRM sheet → `Posts` tab. Filter `slug = aveo-new-generation`. Count rows.
3. Determine which is canonical:
   - If two Sheet rows: the older or more-complete one wins.
   - If Sheet vs hardcoded collision: **Sheet wins** — Sheets are the source of truth for editorial content.

### Cleanup

4. **If duplicate is in Sheet:** delete the redundant Posts row, or rename its slug to something distinct (e.g., `aveo-new-generation-v2`) and update any references.
5. **If duplicate is Sheet vs hardcoded:** delete the hardcoded entry in `app/lib/articles.ts`. (Preferred — single source of truth.)

### Guard

6. Open `app/lib/search-index.ts`. Locate where article documents are concatenated and passed to `MiniSearch.addAll()`.
7. Replace the raw concat / addAll with a dedup-by-Map pattern:
   ```ts
   const seen = new Map<string, ArticleDoc>();
   for (const doc of articleDocs) {
     if (seen.has(doc.id)) {
       console.warn(`[search-index] duplicate article id dropped: ${doc.id}`);
       continue;
     }
     seen.set(doc.id, doc);
   }
   miniSearch.addAll(Array.from(seen.values()));
   ```
8. Apply the same pattern to any product / other-doc-type code path in the same file if they share the pattern. (Belt-and-suspenders.)
9. Commit on `claude/fix-minisearch-duplicate-id`, push, deploy.

### Verification

10. Hard refresh `/es`, open palette (⌘K), open DevTools console → confirm no `duplicate ID` error.
11. Type `aveo` → confirm a single `aveo-new-generation` article appears.
12. Type `kohler` → confirm products + articles render in the palette without error banner.

## Acceptance criteria

- [ ] Only one `aveo-new-generation` article exists across Sheet + hardcoded sources
- [ ] No duplicate IDs reach `MiniSearch.addAll`
- [ ] `app/lib/search-index.ts` has a dedup-by-Map guard with `console.warn` on collision
- [ ] Search palette opens with no `duplicate ID` error in console on every page
- [ ] Articles index loads — typing in palette returns articles and products together

## Verification

```bash
# Local
pnpm dev
# Open browser: http://localhost:3000/es
# Hard refresh, open palette with ⌘K
# Open DevTools → Console → expect no "MiniSearch: duplicate ID" error
# Type "aveo" → expect exactly one aveo-new-generation result
# Type "kohler" → expect product results + article results, no errors
```

Expected: Clean console. Palette renders both products and articles. If a future duplicate is introduced, a `console.warn` fires instead of a thrown error.

## Dependencies

**Requires:** None.
**Blocks:** Nothing critical. But the visible-to-users console error is embarrassing and undermines confidence in the platform.

## Notes

- This is the user-reported bug from the original conversation that kicked off the audit. Quick, visible win.
- The dedup guard is the durable fix — even after we clean up the current duplicate, an editor could re-introduce one tomorrow by adding a new Posts row with a slug that collides with another. The guard makes that case warn-and-continue instead of crash-search.
- If the warning fires often in production logs, surface it in `/dashboard/settings` as a content-health indicator — out of scope here.
