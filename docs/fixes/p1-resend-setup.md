# [P1] Resend setup — STAGING-ONLY (sandbox mode)

> **Status:** PARTIAL — env vars set in Netlify, debug route written, needs sandbox-mode rewrite · **Priority:** P1 · **Effort:** ~30 min · **Branch:** `claude/fix-p1-resend-staging-sandbox`
> **Last updated:** 2026-05-12

## Why this matters

Staging features that need email — magic-link customer accounts, trade approval flows, stale-quote follow-ups, inventory alerts — need a working Resend client. **But staging email MUST NOT use `countercultures.com.mx`** as the sender domain. That's the live production domain, served by Squarespace, and verifying Resend on it requires DNS changes at the production registrar. Production domain work is Phase 2 (see `COUNTER-CULTURES-ROADMAP.md`).

For Phase 1 (staging) we use **Resend's sandbox sending mode**: Resend allows sending FROM `onboarding@resend.dev` (their pre-verified test domain) TO any email address you've authorized as a Test Recipient in the Resend dashboard. No DNS verification on `countercultures.com.mx` is needed. Customer-account flows can be tested end-to-end with you (`admin@countercultures.com.mx`) and Roger as authorized recipients.

When Phase 2 production cutover happens, the sender domain switches to a verified `countercultures.com.mx` address after proper DNS migration. That's a separate fix file, not this one.

## The problem (evidence)

- May 2026 audit found `RESEND_API_KEY` not configured in Netlify env (`Resend = NOT CONFIGURED` per `/dashboard/settings` integration health).
- Customer accounts (P1.2) and trade approvals (P1.6) depend on Resend.
- An earlier attempt at this fix scoped it as full domain verification on `countercultures.com.mx` — that drifted into production DNS work and was correctly halted. This corrected fix avoids the production domain entirely.

## Scope

**In scope:**

- Verify the Resend API key exists in the `countercultures` Resend project (already created)
- Confirm `RESEND_API_KEY`, `RESEND_FROM_TRANSACTIONAL`, `RESEND_FROM_NOREPLY` are set in Netlify env (already set during the earlier work — values need to be updated to sandbox sender)
- **Update sender addresses to use Resend's sandbox domain** (`onboarding@resend.dev`)
- Authorize Joshua's and Roger's inboxes as Resend test recipients
- Verify the debug route `/api/_debug/email-test` lands a real email in Joshua's inbox after the next deploy
- Update fix-file references in `p1-customer-accounts.md` and `p1-trade-program-real-data.md` so they call out sandbox-only sending in Phase 1

**Out of scope (defer to Phase 2):**

- Verifying `countercultures.com.mx` (or any subdomain of it) at Resend
- Adding DKIM / SPF / MX / DMARC records anywhere
- Domain reputation / warmup
- Templates / broadcasts that target real customer lists
- Cloudflare DNS migration (was attempted in error and is dormant; delete the zone as cleanup)

## Files to touch

- Netlify env vars (via Netlify MCP) — update `RESEND_FROM_TRANSACTIONAL` + `RESEND_FROM_NOREPLY` to sandbox sender
- `app/lib/email.ts` (or wherever Resend client is wrapped) — confirm it reads env correctly
- `app/api/_debug/email-test/route.ts` — exists; verify works after env change
- `docs/fixes/p1-customer-accounts.md` — add "Phase 1: sandbox sender only" note
- `docs/fixes/p1-trade-program-real-data.md` — same note

## The fix (step by step)

1. **Authorize test recipients in Resend.** Resend Dashboard → Audience (or wherever "Test Recipients" / verified addresses are managed) → add `admin@countercultures.com.mx` and Roger's inbox. Sandbox mode rejects sends to unauthorized addresses.
2. **Confirm API key exists.** Resend → API Keys. If missing, create one named "Counter Cultures Prod (staging-sandbox)" with Full Access. Copy the value (paste to Joshua so it can be set in Netlify via MCP — already done in previous session).
3. **Update Netlify env to sandbox sender** (via Netlify MCP, no UI clicks):
   - `RESEND_FROM_TRANSACTIONAL = onboarding@resend.dev`
   - `RESEND_FROM_NOREPLY = onboarding@resend.dev`
4. **Trigger Netlify redeploy** so new env values load.
5. **Run the debug-route test**:
   ```bash
   curl -X POST "https://countercultures.netlify.app/api/_debug/email-test" \
     -H "Content-Type: application/json" \
     -H "x-cron-probe-key: <CRON_PROBE_KEY>" \
     -d '{"to":"admin@countercultures.com.mx"}'
   ```
6. **Confirm** an email arrives in `admin@countercultures.com.mx` inbox within ~60 sec. From address should be `onboarding@resend.dev`.
7. **Update dependent fix files** (P1.2, P1.6) — add a "Phase 1 uses sandbox sender; production sender swap is Phase 2" callout so future sessions don't drift back into production DNS territory.
8. **Delete the debug route** at `app/api/_debug/email-test/route.ts` (and the `_debug` folder) once verified.
9. **Delete the dormant Cloudflare zone** for `countercultures.com.mx` (artifact of the earlier misframed attempt).

## Acceptance criteria

- [ ] Resend dashboard shows Joshua and Roger as authorized test recipients
- [ ] Netlify env shows `RESEND_FROM_TRANSACTIONAL` and `RESEND_FROM_NOREPLY` = `onboarding@resend.dev`
- [ ] `RESEND_API_KEY` set as a secret in Netlify (already done — verify still there)
- [ ] `curl POST /api/_debug/email-test` returns `{"ok": true, "id": "..."}` and the email arrives in Joshua's inbox within 60 sec
- [ ] **No DNS record added/modified on `countercultures.com.mx` or any subdomain.** Verify with `dig countercultures.com.mx` — output identical to before this fix
- [ ] Customer-accounts (P1.2) end-to-end magic-link test works to Joshua's inbox
- [ ] Debug route deleted after verification
- [ ] Cloudflare zone `countercultures.com.mx` deleted (cleanup of earlier exploration)
- [ ] `docs/fixes/p1-customer-accounts.md` and `p1-trade-program-real-data.md` updated with sandbox-mode note

## Verification

```bash
# 1. Live email test
curl -X POST "https://countercultures.netlify.app/api/_debug/email-test" \
  -H "Content-Type: application/json" \
  -H "x-cron-probe-key: $CRON_PROBE_KEY" \
  -d '{"to":"admin@countercultures.com.mx"}'

# Expected response:
# {"ok":true,"id":"<resend-message-id>","from":"onboarding@resend.dev","to":"admin@countercultures.com.mx",...}

# 2. Confirm zero production DNS change
dig +short countercultures.com.mx
# Expected: 198.49.23.144 (unchanged)
dig +short countercultures.com.mx MX
# Expected: 5 Google Workspace MX records — unchanged

# 3. Confirm sandbox-mode rejection of unauthorized recipient
curl -X POST "https://countercultures.netlify.app/api/_debug/email-test" \
  -H "Content-Type: application/json" \
  -H "x-cron-probe-key: $CRON_PROBE_KEY" \
  -d '{"to":"someone-not-in-resend@example.com"}'
# Expected: 502 with Resend error about unauthorized recipient — good, sandbox is enforced
```

## Dependencies

**Requires:** Joshua's access to the Resend `countercultures` project (already true).

**Blocks:** P1.2 (customer accounts magic-link), P1.6 (trade program approval emails), P2.1 (stale-quotes follow-up engine), P2.9 (inventory low-stock notifications).

## Notes

- **Sandbox sender format**: As of 2026, Resend's sandbox sender is `onboarding@resend.dev`. Confirm at https://resend.com/docs/dashboard/emails/send-test-emails — pattern may evolve.
- **Authorized recipients only**: Sending to non-authorized addresses while in sandbox mode returns an error from Resend. This is the safety net that prevents staging emails from accidentally hitting real customers.
- **Why the original fix went off-track**: it assumed Netlify staging would BE production, scoping Resend domain verification on the production apex. Corrected mental model: staging = build env, production = Squarespace (still live), cutover = future Phase 2 project. See `AGENTS.md` "Staging vs Production" section.
- **Cloudflare zone artifact**: An earlier exploration created a Cloudflare zone for `countercultures.com.mx` with 4 Resend records preloaded. The zone is dormant (nameservers were never swapped — production DNS untouched) but should be deleted as cleanup. Delete via Cloudflare dashboard (`https://dash.cloudflare.com/d989fb1bf8c3d900c04b2e0d1dc491f3/countercultures.com.mx/advanced` → Remove site from Cloudflare) or via API.
- **Phase 2 production fix**: When production cutover is scoped, the full domain-verification fix should live at `docs/fixes/phase2-resend-production-domain.md` (does not exist yet — create when Phase 2 begins). That fix will involve adding 4 DNS records on whatever DNS provider production uses at that time.
