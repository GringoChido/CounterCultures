Continue the Counter Cultures build (Lean-on-Odoo). Read these first, in order:

1. `LEAN-ON-ODOO-PLAN.md` — the active plan. Start here, especially §2 "Where we are + immediate next / open threads."
2. `AGENTS.md` — rules, the people (Roger, Antonina, sales = Javier + Ian), and staging-vs-production.
3. `MASTER-PLAN.md` §10 (recent PM entries) — full history/archive. `docs/Roger-update-note.md` — the note to send Roger. `docs/COWORK-HANDOFF-2026-05-26.md` — this file: what happened last session + the decision.

One-line context: Counter Cultures staging site, launch July 6 / handoff July 7. We pivoted to "lean on Odoo": Odoo owns all transactions (quotes, POs, customers, invoices); the portal is a dashboard/read layer with "Open in Odoo" deep-links. Roger's quote fixes (line items, the pivot, customer-page 500) are shipped and deployed green (commit `4913184`). Guiding principle: SIMPLIFY, lean on Odoo, less custom code.

🔴 IMMEDIATE PRIORITY (updated 2026-05-26) — the Odoo-login cleanup is now DEFERRED, not the blocker. Here is why and what is next:

What we learned last session: branding the login and enabling Google sign-in both require logging into Odoo as admin. The admin account is `roger@countercultures.com.mx`. Joshua does NOT have a working password for it, and the "Reset Password" email goes to Roger's inbox, which Joshua cannot access. Nothing is broken — the portal authenticates to Odoo with an API key (`ODOO_API_KEY`), not Roger's password, so the dashboard and the hourly sync are fine. The login styling is cosmetic.

Decision (Joshua, 2026-05-26): do not block on the cosmetic login. Send Roger the note now — it is finalized in Joshua's wording at `docs/Roger-update-note.md`, with one honest line that the login looks generic and is being cleaned up this week. Joshua sends it himself.

So the immediate next item is ODOO ADMIN ACCESS — the real unblocker for the login branding, Google sign-in, the `/odoo/sales/new` slug check, and the in-Odoo T&C template. Options, best first:
* Log into odoo.com with the subscription-owner account, then My Databases → Connect (logs straight in as admin, no database password). First confirm who owns the subscription.
* Roger resets his own Odoo password and either shares a working admin login or sits with Joshua for the config.
* Create a dedicated Odoo admin user for Joshua so future work never depends on Roger's personal account (recommended; also good for the H2 handoff).

Once admin access is solved, do the original login cleanup. These are Odoo-admin + Google-Cloud config, not portal code. Guide Joshua through them step by step. Do not enter passwords or reconfigure his production ERP blind — Joshua does the admin login and clicks:
* Brand the Odoo login page. Note: it is wrapped in Odoo's default Website theme (placeholder "YourLogo", demo nav, demo footer); fix via the company / website logo in Settings.
* Turn on "Sign in with Google" in Odoo for `@countercultures.com.mx` accounts (Odoo + Google Cloud OAuth), so login is one click or instant if already in Google. Joshua is the Workspace / Cloud admin for countercultures.com.mx.
* Confirm that once signed in, "New Quote" lands directly on the Odoo new-sale-order form (this also confirms the deep-link slug `/odoo/sales/new`).

Then: the Roger note is already sent (see above) — no need to hold it for the login anymore.

Hold these open strategic threads — do not build past them without a decision:
* Does the sales team (Javier, Ian) have Odoo seats? If not, "New Quote → Odoo" is a locked door for them. Options: give them seats, or a lean portal quote screen that writes to Odoo via the shared service account (no Odoo login needed).
* Deeper: do we even need most of the staff dashboard? Most screens duplicate Odoo for people who already have Odoo. The portal's irreplaceable value is the storefront + leads/WhatsApp + access for non-Odoo people. This could shrink the dashboard a lot. (Details in `LEAN-ON-ODOO-PLAN.md` §2.)

How we work: pick the next item → write a surgical `docs/fixes/*.md` prompt → Joshua runs it in Claude Code (one fix per session, branch + commit) → verify against code + git, log the milestone in `MASTER-PLAN.md` §10 → repeat. Rules + Sacred Surface are in `LEAN-ON-ODOO-PLAN.md` §0.

Working note: Joshua's edits are final — keep his changes exactly as written, only flag outright typos, never re-add content he removed.
