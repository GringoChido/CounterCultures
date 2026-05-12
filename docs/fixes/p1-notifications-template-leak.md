# [P1] Notifications — Template Variable Leak + Test Deal Filter

> **Status:** PENDING · **Priority:** P1 · **Effort:** 4 hrs · **Branch:** `claude/fix-notifications-template-leak`
> **Last updated:** 2026-05-12

## Why this matters
The notifications surface is the team's first stop every morning — and right now it's broken in two visible ways. First, raw template tokens like `{issue_type}`, `{issue_summary}`, `{recommended_action}` are rendering as literal strings instead of interpolated values, so every notification reads like a Mad Libs sheet. Second, the test/seed deals (`DEAL-__TEST_DEAL_W7_*`) from QA and migration runs are bleeding into the production feed, creating noise that trains the team to ignore the page. Both make the entire notification system feel half-built and erode trust in every other dashboard surface.

## The problem (evidence)
- Visit `/dashboard/notifications` — visible items contain the literal text "`{issue_type}`" and "`{recommended_action}`".
- Multiple notification rows referencing `DEAL-__TEST_DEAL_W7_001`, `_002`, etc. from automated test fixtures.
- The template renderer either uses `String.raw` style substitution with the wrong placeholder syntax, or the variable lookup is silently returning `undefined` and printing the raw token as fallback.

## Scope
**In scope:**
- Locate notification template renderer.
- Fix variable interpolation (use the canonical helper that accepts a variables map).
- Add fallback behavior: missing variable → empty string or "—", never the literal placeholder.
- Filter test entities (`entity_id` contains `__TEST`) from the production feed query.
- Add a unit test for the renderer.

**Out of scope:**
- Rewriting the notifications data model.
- Adding new notification types.
- Real-time push (SSE) — out of scope here.

## Files to touch
- `app/(dashboard)/dashboard/(portal)/notifications/page.tsx` — apply test-deal filter.
- `app/lib/notifications.ts` (or wherever `getNotifications()` lives) — same filter at the source.
- `app/lib/notification-templates.ts` (or named similarly) — fix `renderTemplate(template, vars)`.
- New `app/lib/__tests__/notification-templates.test.ts` — unit test the renderer.

## The fix (step by step)
1. **Find the renderer.** `grep -rn "{issue_type}" app/` and `grep -rn "renderTemplate\|interpolate\|fillTemplate" app/lib`. Read the function that takes a template string + variables and returns a string.
2. **Identify the bug.** Most likely cause: the template uses `{varName}` syntax but the renderer uses `${varName}` (or vice versa), OR the variables object is not being passed all the way through from the data fetcher to the renderer.
3. **Pick one canonical syntax** — `{varName}` (no `$`) — and update `renderTemplate`:
   ```ts
   export function renderTemplate(template: string, vars: Record<string, unknown>): string {
     return template.replace(/\{(\w+)\}/g, (_, key) => {
       const v = vars[key];
       return v === undefined || v === null ? '' : String(v);
     });
   }
   ```
4. **Audit all callers.** `grep -rn "renderTemplate" app/` — confirm every caller passes the full variables map. Common bug: caller passes `{ issue_type }` but template expects `{ issueType }` (or kebab/snake mismatch). Standardize on snake_case keys (matches sheet column names).
5. **Audit all templates** in the sheet (or `notification-templates.ts` constants) to ensure every variable they reference exists in the producer's emitted vars map. Log a warning during development for any unresolved placeholders.
6. **Filter test deals.** In `getNotifications()`:
   ```ts
   const rows = await fetchNotifications();
   return rows.filter(r => !r.entity_id?.includes('__TEST'));
   ```
   Apply at the data layer so the page, the bell-icon counter, and any digest emails all share the filter.
7. **Add a test:**
   ```ts
   test('renderTemplate interpolates and handles missing vars', () => {
     expect(renderTemplate('{a} and {b}', { a: 'X' })).toBe('X and ');
     expect(renderTemplate('hello', {})).toBe('hello');
   });
   ```
8. Manual smoke: open `/dashboard/notifications`, confirm no literal `{...}` tokens visible and no `__TEST` deals listed.

## Acceptance criteria
- [ ] No notification row renders any literal `{variable_name}` substring.
- [ ] Missing variables degrade to empty string (no "undefined", no token leak).
- [ ] No notification row references a `DEAL-__TEST*` entity_id.
- [ ] Unit test passes.
- [ ] Notification bell-icon counter excludes test entities too.

## Verification
```bash
# Production smoke
curl -s "$BASE_URL/dashboard/notifications" | grep -E "\{[a-z_]+\}" | head
# Expected: empty (no literal placeholders)

curl -s "$BASE_URL/api/notifications" | jq '.items[].entity_id' | grep TEST
# Expected: empty
```

## Dependencies
**Requires:** None.
**Blocks:** P1.9 (Dashboard reorg) — notifications counter must be reliable before it gets prime real estate in the new sidebar.

## Notes
- The placeholder-leak smell is a strong tell that there's no missing-variable warning in dev. After fixing, add a `console.warn` in dev-only when a placeholder doesn't resolve — turns silent bugs into loud ones.
- Test-deal filter: prefer a NOT-LIKE on entity_id at the data layer rather than UI-side filter. UI-side filters bite later (digest emails, counts).
- If templates live in a sheet (likely), spot-check the column for accidental ${...} bash-syntax usage too.
- Consider standardizing on a single template engine helper across emails AND in-app notifications to avoid divergence.
