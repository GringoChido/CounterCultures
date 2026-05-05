#!/usr/bin/env bash
set -euo pipefail
DIR="public/Assets/BRANDS/staging"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

download() {
  local slug="$1" url="$2" ext="$3"
  local dest="$DIR/${slug}-hero.${ext}"
  [ -f "$dest" ] && [ -s "$dest" ] && echo "SKIP  $dest" && return
  echo "GET   $slug"
  curl -sL -A "$UA" --max-time 30 "$url" -o "$dest"
  local size
  size=$(wc -c < "$dest")
  if [ "$size" -lt 5000 ]; then
    echo "FAIL  $dest (${size}B too small)"
    rm -f "$dest"
  else
    echo "OK    $dest (${size}B)"
  fi
}

# sterling — Kohler's value line; uses Kohler Scene7 CDN
download "sterling" \
  "https://kohler.scene7.com/is/image/kohlergbhuat/Full-Bleed-Homepage-Hero-Video-aae71482-1:ST-Full-Bleed-Homepage-Hero-Video-Large-Desktop?fmt=jpg&wid=1920&hei=955" \
  "jpg"

# richelieu — hardware brand, banner from static CDN
download "richelieu" \
  "https://static.richelieu.com/documents/imageBanniere/1403944/ban_2387582_.jpg" \
  "jpg"

# bereson — cabinet hardware; Bereson hero image (same CDN as r-christensen)
download "bereson" \
  "https://www.berensonhardware.com/customer/images/HomePage/Hero%20Images/Bereson_HomeHero_04222026-2.jpg" \
  "jpg"

# chicago-faucets — manufacturing/production lifestyle photo
download "chicago-faucets" \
  "https://www.chicagofaucets.com/sites/default/files/2020-11/chicago_faucets_in_production.png" \
  "png"

# ginger — brand absorbed by Newport Brass; use NB kitchen lifestyle
download "ginger" \
  "https://www.newportbrass.com/media/dcqjshhg/home-kitchen-3.webp" \
  "webp"

# samsung — KV hero (key visual) from IS CDN — try without width constraint
download "samsung" \
  "https://images.samsung.com/is/image/samsung/assets/us/home-appliances/04062026/KV_2_DT.jpg" \
  "jpg"

# franke — try IS CDN with a known landscape sink lifestyle shot
download "franke" \
  "https://assets.franke.com/is/image/frankemanagement/System.Img-Sizes-6?fmt=jpg&wid=1920&hei=1080&fit=crop,1" \
  "jpg"

echo ""
echo "Done. Check staging/ and run: npx tsx scripts/process-brand-heroes-batch2.ts"
