# [P0] Counter Cultures CRM lives in personal Gmail My Drive — move to Shared Drive

> **Status:** PENDING · **Priority:** P0 · **Effort:** 15 min · **Branch:** N/A (Drive UI action, no code)
> **Last updated:** 2026-05-12

## Why this matters

This is the single biggest business-continuity risk in the entire system. The main CRM spreadsheet — `Counter Cultures CRM` (fileId `1iXG4A6bzrRSodbendoi-IVy6gi1cqiKbDado_bH7Yt0`, 70+ tabs, ~6.9 MB, modified daily) — is owned by `jsemolik@gmail.com` (Joshua's personal Gmail) and lives in personal My Drive. Roger does not own it. The company does not own it. If Joshua's personal Google account is locked, suspended, deleted, or compromised, the entire CRM (orders, leads, pipeline, customers, finance mirrors, all operational data) is gone or held hostage. Every dashboard route, every cron job, every webhook reads from this file. A 15-minute move into the existing Counter Cultures Shared Drive transfers ownership to the business and eliminates the risk.

## The problem (evidence)

- Drive API metadata for fileId `1iXG4A6bzrRSodbendoi-IVy6gi1cqiKbDado_bH7Yt0`:
  - `owners[0].emailAddress = jsemolik@gmail.com` (personal Gmail)
  - `parents` is unset / points to personal My Drive (not a Shared Drive parent)
  - `driveId` is unset (not in any Shared Drive)
- The sister sheet `CC_Products_Full` (354K products) already lives in the Counter Cultures Shared Drive (parent `0ALSvVEdW2-pkUk9PVA`) — the CRM is the lone outlier.
- All app code reads `process.env.GOOGLE_SHEETS_ID = 1iXG4A6bzrRSodbendoi-IVy6gi1cqiKbDado_bH7Yt0`. Drive preserves the file ID on a Shared-Drive move, so env vars don't need updating.

## Scope

**In scope:**
- Move the CRM file from Joshua's My Drive into the existing Counter Cultures Shared Drive
- Confirm Roger + Antonia (and any other ops members) have Manager / Editor membership on that Shared Drive
- Smoke-test read + write from the app post-move

**Out of scope:**
- Renaming the file (keep the same name)
- Reorganizing tabs (separate cleanup)
- Migrating to a real database (long-term, out of scope here)
- Backup snapshots (separate fix — recommended P1)

## Files to touch

- Drive UI only (Drive web app). No code changes.
- No env-var changes (file ID is preserved on move).

## The fix (step by step)

1. Sign in to Drive web UI as `jsemolik@gmail.com` (current owner).
2. Locate `Counter Cultures CRM` in My Drive.
3. Confirm the existing Counter Cultures Shared Drive is accessible (left sidebar → Shared drives → look for the drive that already contains `CC_Products_Full`; parent ID `0ALSvVEdW2-pkUk9PVA`).
4. Right-click `Counter Cultures CRM` → **Move** (or **Organize → Move**).
5. Select the Counter Cultures Shared Drive as the destination. Confirm.
6. Drive will prompt about ownership transfer when moving from personal My Drive to a Shared Drive — accept. Ownership transfers to the Shared Drive itself (Shared Drives don't have individual owners; they belong to the org).
7. Verify the move:
   - File now appears inside the Shared Drive
   - It no longer appears in `jsemolik@gmail.com` My Drive
   - File ID is unchanged (open file → URL still contains `1iXG4A6bzrRSodbendoi-IVy6gi1cqiKbDado_bH7Yt0`)
8. Confirm Shared Drive membership:
   - Shared Drive → Members → ensure `roger@countercultures.com.mx` is Manager (or at minimum Content Manager / Editor)
   - Ensure `antonia@countercultures.com.mx` is at least Editor
   - Ensure any service account used by the app (e.g., `*@*.iam.gserviceaccount.com`) is still a member with Editor — Shared Drives require explicit membership; My-Drive shares do not carry over automatically
9. Smoke-test from the app:
   - Visit `/dashboard/orders` → confirm data renders (read path works)
   - Trigger a small write — e.g., add a test row to `Activity_Log` via a dashboard action — confirm the row appears in the sheet (write path works)
10. Spot-check that `viewedByMeTime` and `modifiedTime` continue updating after the move (open the file, edit a non-critical cell, save, then re-query Drive metadata).

## Acceptance criteria

- [ ] CRM file no longer in `jsemolik@gmail.com` My Drive
- [ ] CRM file in Counter Cultures Shared Drive (parent / driveId `0ALSvVEdW2-pkUk9PVA`)
- [ ] File ID unchanged (`1iXG4A6bzrRSodbendoi-IVy6gi1cqiKbDado_bH7Yt0`)
- [ ] Roger has Manager (or Content Manager) on the Shared Drive
- [ ] Antonia has at least Editor on the Shared Drive
- [ ] App service account retains Editor access on the Shared Drive
- [ ] App read test passes (`/dashboard/orders` renders)
- [ ] App write test passes (test row appears in `Activity_Log`)
- [ ] `viewedByMeTime` / `modifiedTime` still update after the move

## Verification

```bash
# After move, from app server (or local with prod credentials):
# Read test
curl -i https://countercultures.netlify.app/dashboard/orders
# Expect: 200, page renders with rows

# Write test: trigger any dashboard action that writes to Activity_Log
# Then inspect the sheet directly for the new row
```

Expected: file appears in Shared Drive; My Drive empty for this file; app reads and writes succeed with no permission errors; `roger@countercultures.com.mx` can open the file from his account.

## Dependencies

**Requires:** None.
**Blocks:** P0.1 (Portal Users bootstrap) — Antonia needs Shared Drive access to be able to add herself / be added to the Users sheet without going through Joshua personally every time. Without this move, every admin action on the Users tab still routes through one personal Gmail account.

## Notes

- 15-minute fix. Highest ROI on the P0 list — eliminates the single largest continuity risk.
- The `CC_Products_Full` sheet is already in the Shared Drive, which proves the access pattern works end-to-end for the app.
- After this move, the Shared Drive is the single business asset, owned by the business and survivable independent of any one Google account.
- **Important:** Shared Drives do not inherit My-Drive sharing. If the service account previously had access via direct share on the CRM file, double-check it has membership on the Shared Drive itself after the move — otherwise the app will start 403-ing on reads.
- Recommended P1 follow-up: nightly export to a second Google account + an off-Google backup (e.g., S3 dump of CSVs). Out of scope here.
