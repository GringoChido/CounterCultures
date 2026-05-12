#!/usr/bin/env bash
# One-shot: clear the stale git lock, stage ONLY the asset-migration files,
# commit, push. Leaves the prior cart/checkout work untouched.
set -euo pipefail
cd "$(dirname "$0")/../.."

echo "▸ removing stale .git/index.lock if present…"
rm -f .git/index.lock

echo "▸ staging asset-migration files only…"
git add .gitignore \
        scripts/scrape/ \
        app/lib/product-content.ts \
        app/lib/product-content.json \
        app/lib/product-families.json \
        app/lib/product-image-manifest.json \
        app/lib/products-full.ts \
        docs/audit/ \
        public/products/odoo-gallery/ \
        public/specs/odoo/

echo
echo "▸ what's staged:"
git diff --cached --stat | tail -3
echo

git commit -m "feat(catalog): asset migration pipeline + initial scrape

- New scripts/scrape/ pipeline (13 scripts + run-all.sh + run-finish.sh)
- New app/lib/product-content.ts + product-content.json sidecar (775 entries)
- New app/lib/product-families.json (97 variant families collapsed)
- Extend ProductFull schema: descriptionEs/En, features, gallery,
  variantLabels, specSheetUrl, specSheetLocal
- 1,183 gallery images under public/products/odoo-gallery/
- 468 spec sheet PDFs under public/specs/odoo/
- 70 LLM-generated bilingual descriptions
- docs/audit/CC-Asset-Gap-Audit.xlsx + CC-Needs-Photography.xlsx
- Add staging/ to .gitignore"

echo
echo "▸ pushing to origin/main…"
git push origin main

echo
echo "✓ done."
