# Email share-cart diagnostic — 2026-05-13

## Summary

The cart share route (`app/api/cart/share/route.ts`) calls `resend.emails.send()` and **never checks the return value**. The Resend SDK v6 returns `{ data, error }` instead of throwing — so any Resend-side failure is silently discarded and the route always returns HTTP 200 `{ ok: true }`. The client shows "Sent!" regardless of whether the email was actually accepted. The most likely root cause is this unchecked error combined with a Resend sandbox delivery restriction or API-level rejection.

## Code path

### 1. UI trigger

**File:** `app/components/cart/save-cart-button.tsx`
- Component: `SaveCartButton` (line 42)
- User enters email and clicks "Send" or presses Enter
- `handleSendEmail()` (line 94) fires a `POST /api/cart/share`
- Payload: `{ to, locale, items[], subtotal, currency, shareUrl }`
- On `res.ok` → shows "Sent!" for 3 seconds, clears input
- On non-ok or catch → shows "Failed to send. Try again."
- **No network error swallowing** — the client correctly branches on `res.ok`

### 2. API route

**File:** `app/api/cart/share/route.ts`
- `POST` handler (line 189)
- Reads `RESEND_API_KEY` from env (line 191) — returns 503 if missing
- Validates `to` and `items` (line 200) — returns 400 if missing
- Creates new `Resend(key)` instance (line 207) — NOT the shared singleton from `app/lib/email.ts`
- Builds HTML email via `buildHtml()` (line 46) — inline HTML template, no external template engine
- Builds plain-text fallback via `buildPlainText()` (line 161)
- **Critical line 213:** `await resend.emails.send({...})` — return value discarded
- Line 221: unconditionally returns `{ ok: true }`
- Outer catch (line 222): logs error and returns 500 — but only fires if `resend.emails.send()` **throws**, which the Resend SDK v6 does NOT do for API errors

### 3. Staging redirect

**File:** `app/api/cart/share/route.ts` (lines 7-13)
- `STAGING_EMAIL_REDIRECT` env var rewrites recipient before send
- If set, all emails go to `admin@countercultures.com.mx` regardless of the address the user entered
- The redirect function is a local duplicate of the one in `app/lib/email.ts` — same logic, separate copy

### 4. FROM address

**File:** `app/api/cart/share/route.ts` (lines 4-6)
- `FROM_ADDRESS` = `process.env.RESEND_FROM_TRANSACTIONAL || "onboarding@resend.dev"`
- `FROM` = `Counter Cultures <${FROM_ADDRESS}>`
- On Netlify: resolves to `Counter Cultures <onboarding@resend.dev>`

## Email service identified

- **Provider:** Resend (https://resend.com)
- **SDK:** `resend` npm package v6.9.4 (per `package.json`)
- **SDK behavior:** `emails.send()` returns `{ data: T | null, error: ErrorResponse | null }` — does **not** throw on API errors
- **Configuration:** shared across multiple modules (`app/lib/email.ts`, `app/lib/alert-dispatcher.ts`, `app/lib/customer-auth.ts`, `app/api/cart/share/route.ts`) — each with its own Resend instantiation

## Environment variables referenced

All values checked via `netlify env:list` and `netlify env:get`:

| Variable | `.env.local` (local) | Netlify (deployed) | Used by cart share route |
|---|---|---|---|
| `RESEND_API_KEY` | missing | **set** (`re_ZEz...` — live key, not test) | yes (line 191) |
| `RESEND_FROM_TRANSACTIONAL` | missing | **set** (`onboarding@resend.dev`) | yes (line 5) |
| `STAGING_EMAIL_REDIRECT` | missing | **set** (`admin@countercultures.com.mx`) | yes (line 7) |
| `RESEND_FROM_NOREPLY` | missing | **set** (`onboarding@resend.dev`) | no |
| `RESEND_FROM_EMAIL` | missing | not set | no (only in `.env.example`, not referenced in code) |
| `ALERT_FROM_ADDRESS` | missing | not set | no (used by `alert-dispatcher.ts` only) |

**Key discrepancy:** `.env.example` defines `RESEND_FROM_EMAIL` but no code reads it. Code reads `RESEND_FROM_TRANSACTIONAL`. The `.env.example` is stale/misleading.

**Local development:** All Resend env vars are missing from `.env.local`. The cart share route would return 503 locally (line 193: "Email not configured"). Local reproduction will require adding these vars.

## Reproduction

### Local attempt

Could not reproduce the deployed behavior locally because `.env.local` has zero Resend env vars. The route would immediately return 503 "Email not configured" — a different failure mode than the deployed site where the API key IS set.

### Deployed behavior (from symptom report)

- Joshua triggered send twice on `countercultures.netlify.app`
- UI showed "Sent!" (green checkmark) — meaning the API returned HTTP 200 `{ ok: true }`
- No email arrived after 5+ minutes
- No error visible in the UI

### Why the UI shows success

The Resend SDK v6 returns errors in the response object, not via exceptions:
```ts
type Response<T> = 
  | { data: T; error: null }
  | { data: null; error: ErrorResponse }
```

The cart share route (line 213) calls `await resend.emails.send({...})` without destructuring or checking the return value. Any Resend error (`validation_error`, `restricted_api_key`, `daily_quota_exceeded`, etc.) is silently discarded. The route always returns `{ ok: true }`.

### Comparison with working code

The alert-dispatcher (`app/lib/alert-dispatcher.ts`, lines 391-397) correctly handles the response:
```ts
const { error } = await resend.emails.send({...});
if (error) return { status: "failed", error: error.message };
return { status: "sent" };
```

The cart share route does NOT follow this pattern.

## Hypotheses (ranked)

### 1. [Most likely] Resend returns an error that is silently discarded

**Evidence:**
- The Resend SDK v6 `emails.send()` does not throw on API errors — it returns `{ data: null, error: { message, statusCode, name } }`
- `app/api/cart/share/route.ts` line 213 discards this return value entirely
- The route unconditionally returns `{ ok: true }` on line 221
- The only catch block (line 222) fires on thrown exceptions, which the SDK doesn't produce for API errors
- The alert-dispatcher (line 391-397) correctly destructures `{ error }` — proving the team knows the pattern but it wasn't applied here

**Possible Resend error reasons (sub-ranked):**
- a) `validation_error: "You can only send testing emails to your own email address"` — sandbox mode restricting recipients. This would occur if `admin@countercultures.com.mx` is NOT the Resend account-owner email, OR if the sandbox rules have changed since the last verified test
- b) `invalid_from_address` — the display name format `Counter Cultures <onboarding@resend.dev>` may not be accepted for the sandbox sender
- c) `daily_quota_exceeded` or `rate_limit_exceeded` — free tier limit reached
- d) `restricted_api_key` or `invalid_api_key` — key revoked or restricted since last test

### 2. [Less likely] Resend accepts the email but delivery fails silently

**Evidence:**
- SESSIONS.md confirms Resend was verified working previously via direct API call
- `admin@countercultures.com.mx` is documented as the Resend account-owner email
- `STAGING_EMAIL_REDIRECT` correctly rewrites recipients to that address
- If Resend accepted the send (returned `{ data: { id: "..." }, error: null }`), the email would be in Resend's delivery pipeline
- Delivery failure could be: spam filtering by Google Workspace, SPF/DKIM failure for `onboarding@resend.dev`, or the email landing in spam/promotions tab

### 3. [Least likely] Race condition or serverless timeout

**Evidence against:** The `await` on line 213 ensures the function waits for the Resend API response. Netlify Functions have a 10-second default timeout, and Resend API calls complete in <1 second. This is not a fire-and-forget pattern.

## What Joshua needs to check (outside the codebase)

1. **Resend dashboard → Logs/Activity**: Check whether the cart share emails appear at all. If they show as "sent" in Resend, the issue is delivery-side (spam filter, inbox routing). If they show as "failed" or don't appear, the issue is API-side (the error being silently swallowed).

2. **Resend dashboard → API Keys**: Confirm the key starting with `re_ZEz4in3` is still active and not restricted.

3. **Google Workspace spam/promotions folder** for `admin@countercultures.com.mx`: Check if emails from `onboarding@resend.dev` landed there instead of the inbox.

4. **Resend dashboard → Domains**: Confirm sandbox mode is still active and `onboarding@resend.dev` is the correct sandbox sender format for the current Resend version.

5. **Netlify Functions logs** (`netlify functions:log`): Look for `[cart/share]` error output — the catch block on line 223 logs errors with that prefix. If present, there's a thrown error (unexpected for SDK v6). If absent, confirms the error is being returned in `{ error }` and silently discarded.

## Proposed fix(es)

### For hypothesis 1 (silently discarded Resend error):

Destructure the return value of `resend.emails.send()` and check the `error` field, matching the pattern already used in `alert-dispatcher.ts`:
```
const { error } = await resend.emails.send({...});
if (error) {
  console.error("[cart/share] Resend error:", error.name, error.message);
  return NextResponse.json({ error: error.message }, { status: 502 });
}
return NextResponse.json({ ok: true });
```

This will:
- Surface the actual Resend error in the API response
- Cause the client to show "Failed to send" (since `res.ok` will be false on 502)
- Log the error for server-side debugging

### For hypothesis 2 (delivery failure):

If Resend shows the email as "delivered" in their dashboard, the issue is at the Google Workspace level. Options:
- Check spam/promotions folder
- Add `onboarding@resend.dev` to safe senders in Google Workspace admin
- Consider whether the `Counter Cultures` display name on a `@resend.dev` sender triggers spam filters

### General cleanup:

- The `redirectRecipient` function is duplicated across 3 files (`app/api/cart/share/route.ts`, `app/lib/email.ts`, `app/lib/customer-auth.ts`). Should be a shared utility.
- `.env.example` references `RESEND_FROM_EMAIL` which no code reads. Should be updated to list `RESEND_FROM_TRANSACTIONAL` and `STAGING_EMAIL_REDIRECT`.
- The cart share route creates its own `new Resend(key)` instance instead of using the shared singleton from `app/lib/email.ts`.

## What I did NOT do

- I did not modify any code.
- I did not commit changes to email logic.
- I did not open a PR with fixes.
- I did not print any secret values in this report — only noted "set" / "missing" and key prefixes.
