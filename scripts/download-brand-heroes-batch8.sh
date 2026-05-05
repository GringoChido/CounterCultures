#!/bin/bash
# Batch 8 — confirmed via Playwright (2026-05-05).
# Usage: chmod +x scripts/download-brand-heroes-batch8.sh && ./scripts/download-brand-heroes-batch8.sh

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

echo "=== Brand Heroes — Batch 8 ==="

# Sietto — artisan glass/mosaic carousel hero 1800×1062
download "sietto" \
  "https://sietto.com/assets/fold-main-homepage-hq-new-BjNBBepc.jpg" \
  "jpg"

# Zurn — homepage carousel: Sundara drain bathroom lifestyle
download "zurn" \
  "https://www.zurn.com/content/zurnv49/us/en/jcr:content/root/container_533156717/lkcarousel/item_1730740954906.imagetransformer.82.2000.fileReference.jpeg/zurnv49-sundara-z5001-reef-seashell.jpeg" \
  "jpg"

# Cruz Bay Studio — tile flat-lay lifestyle 1920×1506 (Shopify CDN)
download "cruz-bay-studio" \
  "https://cruzbaystudio.com/cdn/shop/files/Coverings_Flatlays_2024_Nomad_SEAFOAM_Product_Pairing_03_edited_1.jpg?v=1734910346" \
  "jpg"

# Transolid — banner 2700×1000
download "transolid" \
  "https://cdn.transolid.com/static/image/cache/catalog/banners/transolid/transolid-banner-3-2700x1000.jpg" \
  "jpg"

# Amba Products — bathroom/spa lifestyle BG (Nov 2025)
download "amba-products" \
  "https://ambaproducts.com/wp-content/uploads/2025/11/Cape2332.3-SpaHouse.423.jpg" \
  "jpg"

# Belwith Products — Sanity CDN 2560×1440 kitchen/bath hero
download "belwith-products" \
  "https://cdn.sanity.io/images/s8y2cokj/production/630858d035f92ea550454197f6622e5ecdbcf1db-2560x1440.jpg?fm=jpg" \
  "jpg"

# Mansfield — WP scaled bathroom lifestyle 2025
download "mansfield" \
  "https://www.mansfieldplumbing.com/wp-content/uploads/2025/11/Barret_Bathroom-scaled.webp" \
  "webp"

# Merola Tile — banner 1919×1581
download "merola-tile" \
  "https://merolatile.com/wp-content/uploads/2024/12/merola-banner-mobile-002.jpg" \
  "jpg"

# Pulse — showers/spas OG lifestyle
download "pulse" \
  "https://www.pulseshowerspas.com/wp-content/uploads/2021/08/PULSE-ShowersSpas.jpg" \
  "jpg"

# Classic Brass — WP homepage slider 2033×1302
download "classic-brass" \
  "https://classicbrass.com/wp-content/uploads/2025/05/CB-home-slider-newest-03.jpg" \
  "jpg"

# R. Christensen (rchristensen.com → berensonhardware.com) — with Referer
download "r-christensen" \
  "https://www.berensonhardware.com/customer/images/HomePage/Hero%20Images/Berenson_HomeHero_04222026-2.jpg" \
  "jpg"

echo ""
echo "=== Done ==="
echo "Then run: npx tsx scripts/process-brand-heroes-batch2.ts"
