#!/bin/bash
# Batch 7 — confirmed via Playwright (2026-05-05).
# Usage: chmod +x scripts/download-brand-heroes-batch7.sh && ./scripts/download-brand-heroes-batch7.sh

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

echo "=== Brand Heroes — Batch 7 ==="

# Keeler — Sanity CDN BG 6010×3558 lifestyle photo
download "keeler" \
  "https://cdn.sanity.io/images/jpxcw1ah/production/6770ff07625e910eda24d14a3f6815dee60c1df0-6010x3558.jpg" \
  "jpg"

# Thermasol — Shopify CDN steam shower lifestyle (original, no width constraint)
download "thermasol" \
  "https://www.thermasol.com/cdn/shop/files/Fortis-PSDG-glass-Tyrol-Facade.jpg?v=1751186537" \
  "jpg"

# Hardware Resources — homepage hero banner 1920×600
download "hardware-resources" \
  "https://www.hardwareresources.com/media/HardwareResources/Pages/Home/homeHero.png" \
  "png"

# Deltana — lifestyle home photography 1920×720
download "deltana" \
  "https://deltana.net/media/home/65.jpg" \
  "jpg"

# ICO Bath — towel warmer/bath accessories lifestyle
download "ico-bath" \
  "https://icobath.com/wp-content/uploads/2023/04/Vasto-Towel-Warmer-ICO.jpg" \
  "jpg"

# R. Christensen (rchristensen.com → berensonhardware.com) — home hero April 2026
download "r-christensen" \
  "https://www.berensonhardware.com/customer/images/HomePage/Hero%20Images/Bereson_HomeHero_04222026-2.jpg" \
  "jpg"

echo ""
echo "=== Done ==="
echo "Then run: npx tsx scripts/process-brand-heroes-batch2.ts"
