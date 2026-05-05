#!/bin/bash
# Batch 4 — 11 brands verified via Playwright (2026-05-05).
# Usage: chmod +x scripts/download-brand-heroes-batch4.sh && ./scripts/download-brand-heroes-batch4.sh

set -e
DIR="public/Assets/BRANDS/staging"
mkdir -p "$DIR"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

download() {
  local slug="$1" url="$2" ext="$3"
  local dest="$DIR/${slug}-hero.${ext}"
  [ -f "$dest" ] && [ -s "$dest" ] && echo "SKIP  $dest" && return
  echo "PULL  $slug"
  if curl -sL -A "$UA" --max-time 30 "$url" -o "$dest"; then
    local size=$(wc -c < "$dest")
    if [ "$size" -lt 5000 ]; then
      echo "FAIL  ($slug): ${size}B — removing"; rm -f "$dest"
    else
      echo "OK    $dest (${size}B)"
    fi
  else
    echo "FAIL  ($slug): curl error"; rm -f "$dest"
  fi
}

echo "=== Brand Heroes — Batch 4 ==="

# Tier A — lifestyle ≥1600w (or near)
download "anzzi" \
  "https://anzzi.com/cdn/shop/files/ANZZI_BANNER_01.jpg?v=1774743767" \
  "jpg"

download "swiss-madison" \
  "https://swissmadison.com/cdn/shop/files/Home_Page_Smart_Toilet_5.jpg?v=1767731401" \
  "jpg"

download "ruvati" \
  "https://www.ruvati.com/wp-content/uploads/HomePage-VideoStill-DualTier2025.jpg" \
  "jpg"

# Dreamline — Cloudinary auto-format, request as jpg explicitly
download "dreamline" \
  "https://res.cloudinary.com/american-bath-group/image/upload/c_limit,w_2400/f_jpg/q_auto/v1760551414/websites-product-info-and-content/dreamline/content/homepage/dreamline-website-hero-image-rs842-deco-w-sky" \
  "jpg"

# Tier B — brand-official but slightly under 1600w
download "linkasink" \
  "https://images.squarespace-cdn.com/content/v1/61cdff4ebc8657245c05c381/be57d2d0-9ad1-4487-ae15-24dccf8f1ccc/Squarespace_Banners_Wood_Vanities_Jan2026.jpg" \
  "jpg"

download "infinity-drain" \
  "https://infinitydrain.com/wp-content/uploads/2026/02/mobile-4-infinity-drain-slot-drain-Original-CN-edit-scaled-1.jpg" \
  "jpg"

download "speakman" \
  "https://e9gf3khppmt.exactdn.com/wp-content/uploads/2025/04/showerheads-and-swatches.jpg?strip=all" \
  "jpg"

download "ove-decors" \
  "https://www.ovedecors.com/media/bluebadger/slider/images/o/v/ove_website_new_vanity_solo_banner_dain.jpg" \
  "jpg"

# DXV — lifestyle section bg (American Standard luxury line)
download "dxv" \
  "https://www.dxv.com/cdn/shop/files/section_1.png?v=1743097840" \
  "png"

# NOTE: alape.com redirects to laufen.com (Laufen acquired Alape).
# Skipped — using Laufen imagery for Alape card would be misleading.
# Roger should verify Counter Cultures stocks Alape vs Laufen and update the brand card.

echo ""
echo "=== Done ==="
echo "Then run: npx tsx scripts/process-brand-heroes-batch2.ts"
