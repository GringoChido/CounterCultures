# Counter Cultures — NEW PLAN (Lean on Odoo)

*Prepared for our meeting · Thursday, May 28, 2026*

## The frame (one line)

**Odoo is the single hub for the business** — sales, customers, invoices, payments, purchasing, inventory, WhatsApp, email. **The website is the storefront customers shop.** There is no second "dashboard" to keep in sync.

---

## What we keep · move · retire

| Keep (real value, not redundant) | Move into Odoo (it does this natively) | Retire (redundant) |
|---|---|---|
| Customer website: SEO, bilingual catalog, design | Quotes, orders, customers, vendors | Dashboard's duplicate order / customer screens |
| Customs / pedimento workflow (Odoo has no equivalent) | Invoices, payments, AR / AP, P&L | Dashboard AR / AP / P&L mirror screens |
| Antonina's finance rules (as the Odoo setup spec) | Facturas / CFDI (Odoo Mexican localization + PAC) | Half-finished custom factura logic |
| Website lead capture | Stripe payments (Odoo native) | Custom Stripe → Google Sheets money path |
| | WhatsApp + Email Marketing (Odoo native) | Custom WhatsApp plumbing; the Klaviyo question |
| | Google Drive (Odoo Documents / connector) | The broken portal Drive screen |

---

## Who does what

| You (Josh) | Odoo specialist (new hire) | Rodger (owner) |
|---|---|---|
| Finish the website | **Get admin access working** (the blocker) | Decide: launch model + storefront custom vs. Odoo Website |
| Connect website → Odoo (quotes/orders flow in) | Configure Sales / CRM / Accounting / Purchase / Inventory | Find, hire + pay the Odoo specialist |
| SEO, 301 redirects, cutover (DNS, domain, email) | Mexican localization + CFDI/PAC, Stripe payments | Transfer access + ownership (below) |
| Retire the redundant dashboard screens cleanly | Load products + prices; seats for Javier & Ian | **Name who owns the system after handoff** |
| | Google Drive app, WhatsApp, Email Marketing | |
| | Rebuild keep-logic as Odoo automation (Santander→factura, bank fees, shipping routing, pedimento) | |

---

## The one thing blocking everything: Odoo admin access

No one can configure Odoo today — the admin login is `roger@countercultures.com.mx`, and the password-reset email goes to Rodger's inbox. Nothing on the Odoo side (and no Odoo expert) can start until this is solved. Fastest path: log in via the **odoo.com subscription owner → My Databases → Connect**, or reset and create a dedicated admin user. **This is item #1 when we meet.**

---

## Access + ownership to transfer (so handoff is clean)

Odoo password (rotate it), Google Drive / CRM data, Stripe, Resend (email), Netlify (website), Meta / WhatsApp, domain registrar. Each needs a named owner. And one decision only Rodger can make: **who is the technical point person after handoff.**

---

## Honest timeline

Website and Odoo build run in parallel, plus onboarding the specialist. Realistic July target: a **polished soft launch** (browse + request a quote), with full card checkout following shortly after. Launch clean and small beats broad and broken.

---

## Decisions needed from Rodger

1. Find, hire + budget the Odoo specialist (your hire — I'll work alongside them, not manage them).
2. Solve Odoo admin access (item #1 above).
3. Keep the custom storefront, or move even that into Odoo Website? *(Trade-off: custom = stronger SEO/design, but someone must maintain it; Odoo Website = one less thing to own after handoff.)*
4. Name who owns the system after handoff.
