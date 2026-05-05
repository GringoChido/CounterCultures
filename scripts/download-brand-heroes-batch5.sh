#!/bin/bash
# Batch 5 — confirmed via Playwright (2026-05-05).
# Usage: chmod +x scripts/download-brand-heroes-batch5.sh && ./scripts/download-brand-heroes-batch5.sh

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

echo "=== Brand Heroes — Batch 5 ==="

# Pfister — Scene7 CDN, kitchen faucet lifestyle
download "pfister" \
  "https://images.pfisterfaucets.com/is/image/Pfister/kitchen_pivot_innovation?fmt=jpg&qlt=90&wid=1920" \
  "jpg"

# Watermark — DigitalOcean Spaces homepage background (Thea collection lifestyle)
download "watermark" \
  "https://watermarkdesigns.nyc3.cdn.digitaloceanspaces.com/user-uploaded-content/HP-Thea.jpeg" \
  "jpg"

# Waterstone — WP uploads, 6960x4640 kitchen faucet photo
download "waterstone" \
  "https://waterstoneco.com/wp-content/uploads/2023/09/TwoHandleWPPost-1.png" \
  "png"

# LaCava — product+lifestyle (tub + faucet combo)
download "lacava" \
  "https://lacava.com/PDGImages/FLT-W-72D_TUB21-MB.jpg" \
  "jpg"

# WS Bath Collections — Waldorf vanity lifestyle
download "ws-bath-collections" \
  "https://www.wsbathcollections.com/pub/media/home-page/enhance/hp-waldorf.jpg" \
  "jpg"

# Amerock — bath hardware lifestyle hero 1920×1080
download "amerock" \
  "https://www.amerock.com/content/files/content/homepage/2026/Home/v2/Amerock_Homepage_Home-Banner_Bath.jpg" \
  "jpg"

# Liberty Hardware — Shopify CDN, champagne bronze lifestyle 1920×1035
download "liberty-hardware" \
  "https://www.libertyhardware.com/cdn/shop/files/champbronz_1920x.jpg?v=1775148654" \
  "jpg"

# Häfele — kitchen solutions catalog hero 1400×620
download "hafele" \
  "https://www.hafele.com/INTERSHOP/static/WFS/Haefele-HAC-Site/-/Haefele-HAC/en_US/opentext/assets/hac/Kitchen_Solutions_2026_Catalog_Slider_1400x620px.jpg" \
  "jpg"

# Jeffrey Alexander — homepage hero background (brand imagery)
download "jeffrey-alexander" \
  "https://jeffrey-alexander.com/wp-content/uploads/2026/04/Gemini_Generated_Image_9zul829zul829zul-scaled.jpg" \
  "jpg"

# Rusticware — header banner 2000×510
download "rusticware" \
  "https://rusticware.com/wp-content/uploads/2022/07/Header-Rus-2022.jpg" \
  "jpg"

# Emser Tile — CloudFront hero background 1920×720
download "emser-tile" \
  "https://d3bauow4e98jr8.cloudfront.net/userfiles/2026%20april_herobanner_1920x7202_savino_bkgr.jpg" \
  "jpg"

echo ""
echo "=== Done ==="
echo "Then run: npx tsx scripts/process-brand-heroes-batch2.ts"
