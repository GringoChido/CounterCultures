<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🛡️ MANDATORY: Read `docs/SURGICAL-RULES.md` BEFORE writing any code

Joshua's standing rule (2026-05-15): things that are built right now CAN NOT be broken or disrupted. The goal is to ENHANCE, not disrupt. That file lists the Sacred Surface (13 working systems), the operating rules, the risk register, and the mandatory final-report template. It applies to every Claude Code session in this repo, no exceptions. If a change would alter the behavior of a Sacred Surface item, STOP and ask Joshua before coding.

# Staging vs Production (read this FIRST — critical scope context)

**This Next.js app deployed at `countercultures.netlify.app` is STAGING.** It is the build environment for a new system. It is NOT live to customers.

**The LIVE PRODUCTION SITE is the existing Squarespace site at `https://countercultures.com.mx`**. Roger and customers use it every day. It is not in this repository — it lives on Squarespace's hosted platform.

**Until the Netlify staging app is "100% smooth and efficient," it does NOT replace Squarespace.** Production cutover is a deliberate, separate, future project (Phase 2 in `COUNTER-CULTURES-ROADMAP.md`).

**Implications for every Claude Code session:**

1. **Aggressive changes in staging are safe** — Roger isn't using this app yet. Iterate fast.
2. **Do NOT touch `countercultures.com.mx` DNS** at the registrar (currently Squarespace / Google Domains). The live site depends on those nameservers and DNS records. No DNS migration, no nameserver swap, no Resend domain verification on the production apex until production cutover is explicitly scoped and approved.
3. **Email sending from staging** uses Resend in **test / sandbox mode** — emails only deliver to authorized test recipients (Joshua, Roger). No production-domain DNS verification needed. See `docs/fixes/p1-resend-setup.md`.
4. **Customer accounts, trade pricing, promo codes, dashboard, etc. — all built/tested in staging.** Real customer migration happens later, during cutover.
5. **The `Counter Cultures CRM` Google Sheet IS shared between staging and the operations team** (now in the Shared Drive after P0.5). Both staging and live read/write the same operational data. Be careful with destructive Sheet ops.
6. **Stripe**: live and staging may eventually use separate Stripe environments. For now, treat Stripe access carefully — Roger owns it.

If a future fix involves the production domain, registrar, Squarespace, or anything customer-facing on the live site, **STOP and confirm with Joshua before proceeding.**

# People & Roles (read this second)

Five users operate the system. Role names match the `role` enum in `app/lib/auth-options.ts` and `ROLE_DEFAULTS` in `app/lib/features.ts`.

- **Joshua** — project lead / builder. Signs into the Counter Portal as **`admin@countercultures.com.mx`** (his Workspace alias). Drives most agent sessions. **DO NOT add `joshua@untold.works` to `PORTAL_EMAIL_ALLOWLIST` or the `Users` sheet** — the auth surface is locked to `@countercultures.com.mx` only, and that env var has been removed from Netlify on purpose. The `joshua@untold.works` row in `Users` is kept as `active=false` for audit history; do not re-activate or re-seed it.
- **Roger** (sometimes spelled **Rodger**) — CEO. `role=owner`. Approval point for trade applications, brand-kit edits, weekly reports, owner deposits.
- **Antonina Trischitta** — Finance / AP lead. `role=finance`. Login: `control@countercultures.com.mx`. **IMPORTANT IDENTITY NOTE: "Antonina" = "Antonia" = "Tonina" — they are all the same person.** Her formal name is Antonina Trischitta; "Antonia" and "Tonina" are both common short forms of "Antonina" used interchangeably in docs and conversation. Older docs (including `docs/finance/CLAUDE-FINANCE-RULES.md`) primarily use "Tonina"; team conversation uses "Antonia." Wherever any doc says Tonina or Antonia, read Antonina Trischitta. Do not assume there are multiple finance operators.
- **Sales** — `role=sales`. Pipeline / CRM / quote ownership. Two reps total: **Javier Medina** and **Ian** (last name TBD — appears on orders alongside Javier; full name not surfaced in dashboard).

# Code touch-points (read the canonical rule doc BEFORE editing)

Before touching any AR / AP / Facturas / Payments / Pedimento code, read docs/finance/CLAUDE-FINANCE-RULES.md.

Before touching any cart / checkout / sale-order / lifecycle / customer-communication code,
read docs/commerce/CART-RULES.md, docs/commerce/LIFECYCLE-STATE-MACHINE.md,
and docs/commerce/COMMUNICATION-MATRIX.md.

Before touching staff auth, login, or portal access code, read docs/staff/STAFF-LOGIN.md.

# Operating system (Roadmap + baseline + fixes)

This project uses a **two-doc operating system** for execution:

- **[`COUNTER-CULTURES-ROADMAP.md`](COUNTER-CULTURES-ROADMAP.md)** at the project root — the master list of every open issue, priority, and status. Open this each morning.
- **`docs/baseline/`** — read-mostly evidence layer (architecture, data, performance, dashboard state, stale code, data quality). Future sessions load these to get oriented in 60 seconds. Start with [`docs/baseline/00-how-we-work.md`](docs/baseline/00-how-we-work.md).
- **`docs/fixes/`** — one file per fix. Each is a self-contained Claude Code prompt. Use the session protocol described in `00-how-we-work.md`.

**Session protocol (TL;DR):** one fix per session, fresh context per session. Tell Claude `Read AGENTS.md and docs/fixes/<filename>, then execute.` The fix file has everything — scope, files to touch, acceptance, verification. Branch per fix, commit per fix, update roadmap status, close session.
