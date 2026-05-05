#!/bin/bash
# Batch 6 — confirmed via Playwright (2026-05-05).
# Usage: chmod +x scripts/download-brand-heroes-batch6.sh && ./scripts/download-brand-heroes-batch6.sh

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

echo "=== Brand Heroes — Batch 6 ==="

# Hickory Hardware — Sanity CDN 3200×2133 lifestyle kitchen/bath shot
download "hickory-hardware" \
  "https://cdn.sanity.io/images/85oj8lu2/production/a61550524ea21fdfde11fde7b772d007568b566e-3200x2133.jpg?fm=jpg" \
  "jpg"

# Acorn Manufacturing — 1920×446 artisan hardware collection banner
download "acorn-manufacturing" \
  "https://acornmfg.com/media/toweringmedia/banner/acorn_manufacturing_the_artisan_collection_hardware_handles.png" \
  "png"

# Symmons — BG hero 1920×979 Solarity environment lifestyle
download "symmons" \
  "https://www.symmons.com/wp-content/uploads/2025/02/solarity-env-hero-1920x979.jpg" \
  "jpg"

# Schaub and Company — 6696×2283 hero panel (very large, sharp will compress)
download "schaub-and-company" \
  "https://schaubandcompany.com/home/78.jpg" \
  "jpg"

# Vesta Fine Hardware — catalog/category lifestyle BG
download "vesta-fine-hardware" \
  "https://www.vestafinehardware.com/pub/media/catalog/category/WebShot_16.jpg" \
  "jpg"

# Hapny Home — Shopify CDN OG lifestyle shot
download "hapny-home" \
  "http://hapnyhome.com/cdn/shop/files/mod-lifestyle-striking.jpg?v=1746985962" \
  "jpg"

# Santec — WP homepage banner 1919×628
download "santec" \
  "https://santecfaucet.com/wp-content/uploads/2026/02/CIRC-WHEEL-BANNER-Homepage.png" \
  "png"

# Karran USA — social-share lifestyle hero
download "karran-usa" \
  "https://karran.pictures/website/social/social-share.jpg" \
  "jpg"

# Whitehaus — Shopify CDN kitchen lifestyle
download "whitehaus" \
  "http://whitehauscollection.com/cdn/shop/files/Kitchen1_3c.jpg?v=1768745839" \
  "jpg"

# Shaw — tile lifestyle (Widen CDN at larger size)
download "shaw" \
  "https://shawfloors.widen.net/content/ag2bgcvu3x/webp/Cattitude%25203340V-7202%2520Fika_Lifestyle.webp?w=1920&h=1280&keep=c&crop=true&color=ffffffff&quality=90" \
  "webp"

echo ""
echo "=== Done ==="
echo "Then run: npx tsx scripts/process-brand-heroes-batch2.ts"
