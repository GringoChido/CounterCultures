# [P3] NOM Compliance Tracking Per Brand

> **Status:** PENDING · **Priority:** P3 · **Effort:** 1 day tooling + ongoing population · **Branch:** `claude/fix-nom-tracking`
> **Last updated:** 2026-05-12

## Why this matters
NOM (Norma Oficial Mexicana) is Mexico's official standards body — for the regulated product categories Counter Cultures sells (plumbing fixtures, electrical, gas appliances, security hardware), NOM compliance is legally relevant and customer-facing trust signal. Today the Brand Kit's `nom_status_summary` column reads `unknown` for all 168 brands, meaning we cannot answer the simplest compliance question from a customer, sales rep, or auditor. Tracking compliance per brand lets us badge PDPs, alert on certificate expiry, and de-risk regulatory exposure.

## The problem (evidence)
- `docs/audit/brand-kit-audit.md`: `nom_status_summary` column is uniformly `unknown` across all 168 brand rows.
- `lib/sheets/brand-kit.ts`: schema includes `nom_status_summary` but no read/write tooling beyond raw passthrough.
- `app/[locale]/brands/[slug]/page.tsx`: renders nothing for NOM status.
- No `/dashboard/today` alert exists for expiring NOM certificates.

## Scope
**In scope:**
- Extend Brand Kit schema with structured NOM fields.
- Build edit UI inside `/dashboard/brands/[slug]`.
- Populate top 20 brands by GMV/volume (Kohler, Toto, Brizo, Emtek, Delta, Moen, Grohe, Hansgrohe, Kallista, Robern, Rohl, Watermark, Waterworks, California Faucets, Newport Brass, Phylrich, Perrin & Rowe, Lefroy Brooks, Dornbracht, Axor).
- Surface badge on PDP + alert in `/dashboard/today`.

**Out of scope:**
- Per-SKU NOM tracking (brand-level only for v1).
- Automated certificate verification with NOM registry (manual entry).
- Translating cert PDFs.

## Files to touch
- `lib/sheets/brand-kit.ts` — add `nom_status`, `nom_certificate_id`, `nom_valid_until`, `nom_notes` columns.
- `app/dashboard/brands/[slug]/page.tsx` — edit form fields for NOM block.
- `app/dashboard/brands/[slug]/actions.ts` — server action to persist.
- `app/[locale]/products/[slug]/PDP.tsx` — render "NOM Compliant" badge if brand status === `compliant`.
- `app/dashboard/today/components/NomExpiryAlerts.tsx` — new component listing certs within 60 days of expiry.
- `lib/dashboard/today-aggregator.ts` — include NOM expiry feed.

## The fix (step by step)
1. Add four columns to the Brand Kit sheet: `nom_status` (enum: compliant/non-compliant/exempt/in-progress/unknown), `nom_certificate_id` (string), `nom_valid_until` (ISO date), `nom_notes` (long text).
2. Extend `BrandKitRow` type and the parser in `lib/sheets/brand-kit.ts` to validate the enum.
3. Build an edit panel in `/dashboard/brands/[slug]` with form inputs + a server action that writes back to Sheets via the existing brand-kit writer.
4. Research and populate the top 20 brands by checking each brand's MX distributor agreements or the SE NOM lookup tool (`https://www.gob.mx/se`) — log sources in `nom_notes`.
5. Render PDP badge component that reads brand row by slug; show only when `nom_status === 'compliant'` and `nom_valid_until > today`.
6. Add `/dashboard/today` alert section listing brands where `nom_valid_until` is within 60 days, plus brands stuck `in-progress` for > 30 days.

## Acceptance criteria
- [ ] `nom_status_summary` is replaced by four typed columns.
- [ ] Top 20 brands have non-`unknown` `nom_status`.
- [ ] PDP shows green "NOM Compliant" badge on at least 10 brands.
- [ ] `/dashboard/today` alerts on any cert within 60 days of expiry.
- [ ] Edit UI in dashboard validates enum + date format.

## Verification
```bash
pnpm tsx scripts/audit/brand-kit-nom-coverage.ts
```
Expected: prints "Top 20 brands NOM status: 20/20 populated; PDP-eligible: N"

## Dependencies
**Requires:** none (Brand Kit sheet already exists)
**Blocks:** future regulatory-export reports for SAT / PROFECO audits

## Notes
- Reference: `docs/audit/brand-kit-audit.md` (baseline coverage report).
- See `CLAUDE-FINANCE-RULES.md` for adjacent SAT/CFDI compliance handling — NOM is parallel but distinct.
- Antonia owns regulatory file storage; Drive folder `CC/Compliance/NOM/` should hold scanned certs (link via `nom_certificate_id`).
