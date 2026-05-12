# DEPRECATED — do not use

> **Status:** DEPRECATED 2026-05-12 by Joshua scope directive — never use a non-Counter-Cultures domain for Counter Cultures email infrastructure.
> **Replacement:** None in Phase 1. Use `STAGING_EMAIL_REDIRECT=admin@countercultures.com.mx` (already set on Netlify, wired in `app/lib/email.ts`) for all Phase 1 staging email. Any-recipient sending unlocks at Phase 2 cutover when a Counter Cultures sender domain gets verified at Resend.

This fix file was written by mistake. It proposed verifying a subdomain of `untold.works` (Joshua's consultancy domain) at Resend to unlock multi-recipient staging email. That conflates Untold Works (the consultancy) with Counter Cultures (the client) — wrong on every axis (brand mixing, ownership, off-boarding risk, optics). Scope rule going forward: **never use a non-Counter-Cultures domain for Counter Cultures email infrastructure.**

If you find yourself reading this file, you're in the wrong place. The actual Phase 1 email setup is documented in `p1-resend-setup.md` (and its sandbox-recipient limit). The any-recipient unlock is a Phase 2 cutover concern — when that work gets scoped, it'll live at `phase2-resend-production-domain.md` (does not exist yet).
