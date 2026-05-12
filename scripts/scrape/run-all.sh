#!/usr/bin/env bash
# Counter Cultures — end-to-end asset migration pipeline.
#
# Run unattended. Every step is resumable; re-running is safe.
# Total wall time on a typical Mac with good network: ~5 hours.
# Total API spend (Claude Haiku): ~$15 across matcher + description generator.

set -euo pipefail
cd "$(dirname "$0")/../.."

START=$(date +%s)
log() { echo; echo "[$(date +%H:%M:%S)] $*"; }

# ── STAGE 1: legacy site scrape ─────────────────────────────────────────────
log "STAGE 1.1 — Discover product URLs on countercultures.com.mx"
npx -y tsx scripts/scrape/01-cc-mx-sitemap.ts

log "STAGE 1.2 — Scrape every legacy product page (Spanish copy + image URLs)"
npx -y tsx scripts/scrape/02-cc-mx-products.ts --concurrency 4

log "STAGE 1.3 — Download gallery images (hi-res)"
npx -y tsx scripts/scrape/03-cc-mx-images.ts --concurrency 5

log "STAGE 1.4 — Extract spec-sheet URLs from Odoo descriptions + download PDFs"
npx -y tsx scripts/scrape/04-extract-spec-urls.ts

log "STAGE 1.5 — Brizo/Delta spec PDFs by URL pattern"
npx -y tsx scripts/scrape/partner-brizo-delta.ts

# ── STAGE 2: matching ───────────────────────────────────────────────────────
log "STAGE 2.1 — Fuzzy match scraped slugs ↔ Odoo SKUs"
npx -y tsx scripts/scrape/05-match-to-odoo.ts

log "STAGE 2.2 — LLM-assisted matching for low-confidence rows (Haiku, ~5 min)"
npx -y tsx scripts/scrape/05b-llm-match.ts --concurrency 6

# ── STAGE 3: variant families ───────────────────────────────────────────────
log "STAGE 3 — Collapse Odoo variants under canonical parents"
npx -y tsx scripts/scrape/09-collapse-variants.ts

# ── STAGE 4: partner scrapers (top 10 brands by SKU count) ──────────────────
log "STAGE 4.1 — California Faucets (~1,062 SKUs)"
npx -y tsx scripts/scrape/partner-california-faucets.ts || true

log "STAGE 4.2 — Emtek (~456 SKUs)"
npx -y tsx scripts/scrape/partner-emtek.ts || true

# Add additional partner scrapers as they're authored:
# npx -y tsx scripts/scrape/partner-kohler.ts || true
# npx -y tsx scripts/scrape/partner-toto.ts || true
# npx -y tsx scripts/scrape/partner-sun-valley-bronze.ts || true
# npx -y tsx scripts/scrape/partner-kingston-brass.ts || true
# npx -y tsx scripts/scrape/partner-baldwin.ts || true
# npx -y tsx scripts/scrape/partner-rohl.ts || true

log "STAGE 4b — Merge partner outputs into product-content.json"
npx -y tsx scripts/scrape/11-merge-partner-content.ts

# ── STAGE 5: compose legacy content + LLM fill gaps ─────────────────────────
log "STAGE 5.1 — Compose legacy content (Spanish from CC.mx scrape) + copy galleries"
npx -y tsx scripts/scrape/06-build-product-content.ts --copy-gallery --rebuild-manifest

log "STAGE 5.2 — LLM-fill bilingual descriptions for products still missing them (Haiku, ~30 min)"
npx -y tsx scripts/scrape/10-llm-fill-descriptions.ts --concurrency 5

# ── STAGE 7: final audit + needs-photography report ─────────────────────────
log "STAGE 7 — Refresh audit + emit photography shot list"
npx -y tsx scripts/scrape/12-final-audit.ts

END=$(date +%s)
echo
echo "════════════════════════════════════════════════════════════════"
echo "  ✓ done in $(( (END - START) / 60 )) min"
echo "  Deliverables:"
echo "    docs/audit/CC-Asset-Gap-Audit.xlsx      ← coverage by SKU"
echo "    docs/audit/CC-Needs-Photography.xlsx    ← shot list"
echo "    app/lib/product-content.json            ← consumed by the site"
echo "    public/products/odoo-gallery/<id>/      ← gallery images"
echo "    public/specs/odoo/<id>.pdf              ← spec sheet PDFs"
echo "════════════════════════════════════════════════════════════════"
