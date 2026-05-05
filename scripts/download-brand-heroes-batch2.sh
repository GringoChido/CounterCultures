#!/bin/bash
# Downloads brand hero images for the 18-brand pilot batch.
# Sources: each brand's official site / CDN (verified 2026-05-05 via Chrome MCP DOM extraction).
# Writes raw downloads to public/Assets/BRANDS/staging/ — run process-brand-heroes-batch2.ts after
# this completes to resize/convert to .webp at 1600w.
#
# Usage:
#   chmod +x scripts/download-brand-heroes-batch2.sh
#   ./scripts/download-brand-heroes-batch2.sh

set -e

DIR="public/Assets/BRANDS/staging"
mkdir -p "$DIR"

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

download() {
  local slug="$1"
  local url="$2"
  local ext="$3"
  local dest="$DIR/${slug}-hero.${ext}"

  if [ -f "$dest" ] && [ -s "$dest" ]; then
    echo "SKIP  (exists): $dest"
    return
  fi

  echo "PULL  $slug"
  if curl -sL -A "$UA" --max-time 30 "$url" -o "$dest"; then
    local size=$(wc -c < "$dest")
    if [ "$size" -lt 5000 ]; then
      echo "FAIL  ($slug): file too small (${size} bytes) — likely 403/404. Removing."
      rm -f "$dest"
    else
      echo "OK    $dest (${size} bytes)"
    fi
  else
    echo "FAIL  ($slug): curl error"
    rm -f "$dest"
  fi
}

echo "=== Brand Heroes — Batch 2 (11 verified URLs) ==="
echo ""

# Tier A — verified ≥1600w lifestyle on brand CDN (drop format query params for master res where applicable)
download "hansgrohe"        "https://assets.hansgrohe.com/celum/web/raindance-alive_xtrastoris-minimalistic_showering-woman_red-bathroom-ambiance_16x9.jpg" "jpg"
download "dornbracht"       "https://media.cdn.dornbracht.com/v/1pRVLKft/crop:8645x3705,fp:0,2454/fit-in:1920x10000/quality:80/FDrei_Dornbracht_COYA_Stills_030.webp" "webp"
download "axor"             "https://assets.hansgrohe.com/celum/web/hps_axw_escape_the_ordinary_ish_teaser_02_2000x1100.jpg" "jpg"
download "grohe"            "https://www.grohe.us/cdn/shop/files/Cubeo_Collection_Shop_the_Look_1.jpg?v=1762279523" "jpg"
download "thompson-traders" "https://thompsontraders.com/wp-content/uploads/2020/05/BathroomSink_Angle-scaled.jpg" "jpg"

# Tier B — brand-official but smaller or product-isolated
download "mti-baths"   "https://s3-us-west-2.amazonaws.com/mti.baths/cms/index/banner-MacPherson-01.jpg" "jpg"
download "stone-forest" "https://cdn.shopify.com/s/files/1/0888/5218/files/social-sharing-image-1200x628.jpg?v=1692307578" "jpg"
download "gessi"       "https://gwebassets.gessi.com/strapi-uploads/assets/Bathroom_ce6ce4ea1a.webp" "webp"

# Newport Brass — OG share image (added on 2nd extraction pass)
download "newport-brass" "https://www.newportbrass.com/media/thza0xzr/social-share.jpg" "jpg"

# Tier C — fallback quality, may want to replace manually
download "rocky-mountain-hardware" "https://data-image.sociablekit.com/sources/instagram-feed/rockymountainhardware/DX7KGDTGR52-thumbnail.webp?v=1777923505" "webp"
download "top-knobs"               "https://www.topknobs.com/media/wysiwyg/category-1.jpg" "jpg"
download "native-trails"           "https://nativetrailshome.com/wp-content/uploads/2024/02/Kitchen-block-rendezvous-01.jpg" "jpg"

echo ""
echo "=== Done. ==="
echo ""
echo "Next: drop manual images for these 7 brands into $DIR/<slug>-hero.<jpg|png|webp>:"
echo "  duravit, victoria-albert, newport-brass, kallista, robern, perrin-and-rowe, graff"
echo ""
echo "Then run: npx tsx scripts/process-brand-heroes-batch2.ts"
