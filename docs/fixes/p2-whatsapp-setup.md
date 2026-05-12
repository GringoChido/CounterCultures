# [P2] WhatsApp Business API Setup

> **Status:** PENDING · **Priority:** P2 · **Effort:** 1 day (mostly account setup) · **Branch:** `claude/fix-whatsapp-setup`
> **Last updated:** 2026-05-12

## Why this matters
WhatsApp Business is mentioned throughout the docs as the primary sales channel for Mexican B2B customers — yet `/dashboard/whatsapp` currently reads "No conversations yet. Outbound disabled until `WHATSAPP_API_TOKEN` is configured." We are leaving the most-used Mexican messaging channel completely on the table while paying for Stripe + email infra.

## The problem (evidence)
- `/dashboard/whatsapp` UI says outbound is disabled.
- No `WHATSAPP_API_TOKEN` env var set.
- No Meta Business Suite app linked to the project.
- `/api/webhooks/whatsapp` route may or may not exist — confirm during work.

## Scope
**In scope:**
- Create / claim Meta Business Suite WhatsApp Business app.
- Obtain `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`.
- Set env vars in Netlify (preview + production) and `.env.example`.
- Configure inbound webhook at `/api/webhooks/whatsapp` (verify handshake + message receipt).
- Toggle `WHATSAPP_ENABLED=true`.
- Round-trip test: send an outbound template message, receive inbound, confirm both render in `/dashboard/whatsapp`.

**Out of scope:**
- Building new WhatsApp flows / templates beyond a test.
- Customer opt-in management UI (separate ticket).

## Files to touch
- `.env.example`
- `app/api/webhooks/whatsapp/route.ts` (verify exists; create if not)
- `app/lib/whatsapp/client.ts` (verify exists)
- `app/(dashboard)/dashboard/whatsapp/page.tsx` (confirm UI lights up when enabled)
- `netlify.toml` / Netlify env config

## The fix (step by step)
1. Roger or Joshua creates a Meta Business Suite WhatsApp Business app and selects the phone number to use.
2. Submit the business for verification (this takes time — start day 1).
3. Generate a permanent system-user access token; record as `WHATSAPP_API_TOKEN`.
4. Note the `phone_number_id` from Meta dashboard; set `WHATSAPP_PHONE_NUMBER_ID`.
5. Generate a strong random `WHATSAPP_VERIFY_TOKEN` (for webhook verification handshake).
6. In Meta dashboard, set webhook callback URL: `https://<prod-host>/api/webhooks/whatsapp`. Subscribe to `messages` and `message_status` events.
7. Hit the verify URL; Meta sends `?hub.challenge=...` → our route echoes it back if `hub.verify_token` matches.
8. Submit at least one approved message template (e.g., `quote_followup_es`).
9. Set `WHATSAPP_ENABLED=true` in Netlify env.
10. End-to-end test: send to a known number, receive a reply, check `/dashboard/whatsapp` shows the thread.

## Acceptance criteria
- [ ] All four env vars present in Netlify prod + preview.
- [ ] Webhook verification handshake passes in Meta dashboard.
- [ ] Outbound test message delivered and visible in dashboard.
- [ ] Inbound test message lands in dashboard within seconds.
- [ ] `/dashboard/whatsapp` no longer shows "Outbound disabled" banner.

## Verification
```bash
curl "https://counter-cultures.netlify.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=$WHATSAPP_VERIFY_TOKEN&hub.challenge=42"
```
Expected: response body `42`.

## Dependencies
**Requires:** Meta business verification (external timeline, can take days).
**Blocks:** P2-1 (stale quotes WhatsApp followups, if added later).

## Notes
See `docs/commerce/COMMUNICATION-MATRIX.md` for which messages should default to WhatsApp vs email. Most B2B quote follow-ups should go to WhatsApp first, email as fallback. Keep the verify token in 1Password under "WhatsApp Business — Counter Cultures."
