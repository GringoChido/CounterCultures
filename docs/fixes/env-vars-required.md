# Launch-critical environment variables — Netlify production

These must be set in the Netlify UI for the soft launch to function.
Not setting them does not break the build; it silently breaks behavior.

Audited 2026-05-28 from the live Netlify project countercultures.

## Currently missing in production (set these in the Netlify UI)

| Variable | What breaks if missing | Where the value comes from |
|---|---|---|
| `STRIPE_WEBHOOK_SECRET` | Every Stripe webhook returns 503. Payments succeed at Stripe but no Odoo/Sheets record is created. STATE-OF-THE-UNION blocker B2. | Stripe dashboard → Developers → Webhooks → endpoint signing secret. Use the secret for the production webhook endpoint (https://countercultures.netlify.app/api/stripe/webhook). |
| `ODOO_STRIPE_JOURNAL_ID` | Stripe → Odoo payment register silently skipped. | Odoo Accounting → Configuration → Journals → Stripe journal. Use the journal id (integer). |
| `WHATSAPP_APP_SECRET` | All inbound WhatsApp webhook requests return 401 (fail-closed). | Meta Business → WhatsApp → App settings → App secret. |
| `NEXT_PUBLIC_ALLOW_INDEXING` | Controls whether the site is indexable. Leave UNSET on staging; set to `1` only when ready to be crawled by Google. | Manual flag. |

## Currently set (confirmed present)

- ANTHROPIC_API_KEY
- CRON_PROBE_KEY
- GOOGLE_* (multiple)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY

## Procedure

For each missing variable above:
1. Netlify dashboard → Project configuration → Environment variables → Add a variable.
2. Use scope: All scopes. Context: Production.
3. Save. Trigger a redeploy of `main` so the new env is picked up.

After STRIPE_WEBHOOK_SECRET is set, the `[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set` warning in the function log should stop appearing within one webhook cycle.
