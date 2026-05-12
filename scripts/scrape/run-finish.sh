#!/usr/bin/env bash
# Finish the run — skips the broken partner scrapers and runs the remaining
# value-generating stages: compose + copy galleries, LLM description fill,
# final audit. Safe to run after Ctrl+C'ing the main run-all.sh.

set -euo pipefail
cd "$(dirname "$0")/../.."

START=$(date +%s)
log() { echo; echo "[$(date +%H:%M:%S)] $*"; }

log "STAGE 4b — Merge any partner outputs already on disk"
npx -y tsx scripts/scrape/11-merge-partner-content.ts || true

log "STAGE 5.1 — Compose content + COPY 6,443 GALLERY IMAGES into public/"
npx -y tsx scripts/scrape/06-build-product-content.ts --copy-gallery --rebuild-manifest

log 'STAGE 5.2 — LLM-fill bilingual descriptions for ~3,500 parents (~30 min, ~$13)'
npx -y tsx scripts/scrape/10-llm-fill-descriptions.ts --concurrency 5

log "STAGE 7 — Refresh audit + emit photography shot list"
npx -y tsx scripts/scrape/12-final-audit.ts

END=$(date +%s)
echo
echo "════════════════════════════════════════════════════════════════"
echo "  ✓ done in $(( (END - START) / 60 )) min"
echo "  Deliverables ready:"
echo "    docs/audit/CC-Asset-Gap-Audit.xlsx      ← refreshed coverage"
echo "    docs/audit/CC-Needs-Photography.xlsx    ← shot list"
echo "    app/lib/product-content.json            ← consumed by the site"
echo "    public/products/odoo-gallery/<id>/      ← gallery images"
echo "════════════════════════════════════════════════════════════════"
