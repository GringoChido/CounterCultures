# [P1] Drive Page — Fix "Failed to load Drive" Error

> **Status:** PENDING · **Priority:** P1 · **Effort:** 4 hrs · **Branch:** `claude/fix-drive-page`
> **Last updated:** 2026-05-12

## Why this matters
`/dashboard/drive` is the team's quick-access surface for recent Google Drive files — contracts, supplier datasheets, design boards. Right now it renders the error state "Failed to load Drive · Your recent files will appear here." even though the service account shows CONNECTED in settings. The disconnect between Settings (says: working) and Drive (says: broken) erodes trust in every other integration card. The likely cause is that the page is calling per-user OAuth Drive endpoints whose grants have expired or whose token refresh has silently failed, when it should be calling the service-account-backed Drive client.

## The problem (evidence)
- `/dashboard/drive` shows the error state for all logged-in users.
- `/dashboard/settings` shows Drive integration as CONNECTED.
- Two Drive clients exist in the codebase: `app/lib/google-drive.ts` (service account) and `app/lib/google-drive-user.ts` (per-user OAuth, readonly).
- The page route likely imports the user-OAuth version and the per-user grant is either missing or has refresh-token errors.

## Scope
**In scope:**
- Identify which Drive client the page is calling.
- Switch to the service-account client (`google-drive.ts`) for "Recent files" listings (no per-user permission boundary needed for the team).
- Surface a proper error state (with debug detail when staff) instead of a generic message.
- Add a "Reconnect" button if per-user OAuth IS the intent.

**Out of scope:**
- Full Drive folder browser UI.
- Per-user document permission preview.
- Drive picker integration.

## Files to touch
- `app/(dashboard)/dashboard/(portal)/drive/page.tsx` — likely swap import path.
- `app/api/dashboard/drive/route.ts` — verify which client it uses; switch to service account.
- `app/lib/google-drive.ts` — confirm `listRecentFiles()` exists and works.
- `app/lib/google-drive-user.ts` — keep but only used for per-user actions if any.
- `app/(dashboard)/dashboard/(portal)/drive/error-state.tsx` (new, optional) — better error UI with diagnostics.

## The fix (step by step)
1. **Open browser dev tools** on `/dashboard/drive` — look at the failing network request. It will be one of:
   - `GET /api/dashboard/drive` (most likely).
   - `GET /api/google-drive/recent`.
   - Direct call to Google Drive API from the client (unlikely).
2. **Read the route handler** for whichever endpoint is failing. Confirm:
   - Which Drive client it imports.
   - Whether it expects a per-user OAuth token from the session.
   - The exact error returned to the client.
3. **Switch to service-account client.** Replace the per-user client import with:
   ```ts
   import { driveServiceAccount } from '@/app/lib/google-drive';
   const drive = driveServiceAccount();
   const res = await drive.files.list({
     orderBy: 'modifiedTime desc',
     pageSize: 25,
     fields: 'files(id,name,mimeType,modifiedTime,webViewLink,iconLink,owners)',
     q: "trashed=false",
   });
   return Response.json({ files: res.data.files ?? [], asOf: new Date().toISOString() });
   ```
4. **Service-account shared drive scope:** ensure the service account is added as a viewer to the team's shared Drive (or shared root). If files are in personal Drives, they won't show up — confirm with Joshua which Drive is the team's source.
5. **Better error state:** wrap fetch in try/catch; on error:
   - For staff with `role=allowlist`, show the actual error message (helps debugging).
   - For everyone else, show a friendly message + "Try again" button.
6. **Settings parity:** the Settings integration card and the Drive page should share the same probe — e.g., a `GET /api/dashboard/drive/health` that does a trivial `files.list({ pageSize: 1 })`. If both surfaces use the same probe, the "CONNECTED in Settings, broken on Drive" inconsistency disappears.
7. **Cache:** memoize the recent-files list for 60s (it changes slowly, and Drive API quotas are real).

## Acceptance criteria
- [ ] `/dashboard/drive` shows the recent files list (≥1 file from the team's shared Drive).
- [ ] No error state on a healthy connection.
- [ ] If credentials are genuinely broken, error state shows clear diagnostic (for staff role only).
- [ ] Settings integration card and Drive page agree on health status.
- [ ] Empty state ("No recent files") shown when the API returns an empty list (not the error UI).
- [ ] Network request completes in <2 s warm.

## Verification
```bash
curl -s "$BASE_URL/api/dashboard/drive" -H "Cookie: <staff-session>" | jq '.files | length'
# Expected: > 0 (assuming the shared drive has files)

curl -s "$BASE_URL/api/dashboard/drive/health" -H "Cookie: <staff-session>" | jq '.ok'
# Expected: true
```

## Dependencies
**Requires:** None (the service account already works for Sheets — same credentials).
**Blocks:** Drive folder browser (P2), document-attach UX in CRM (P2).

## Notes
- Service account access requires the team's Drive folder to be shared with `<service-account-email>@<project>.iam.gserviceaccount.com` as Viewer or Editor. Confirm before declaring "fixed".
- Per-user OAuth Drive is useful for actions like "open as me / edit", but for "recent files" listing, service account is simpler and avoids token-refresh edge cases.
- Drive API `files.list` with `orderBy: 'modifiedTime desc'` and `q: "trashed=false"` is the canonical recent-files query.
- If the shared drive has thousands of files, `pageSize: 25` is enough for the UI; pagination is a P2 enhancement.
- Future: add a search field on the Drive page (similar pattern to the search palette).
