#!/bin/bash
# Downloads brand hero images for Batch 3 — 10 brands verified via Playwright extraction.
# Sources: each brand's official site / CDN (verified 2026-05-05).
# Writes raw downloads to public/Assets/BRANDS/staging/
# Run process-brand-heroes-batch2.ts after this completes.
#
# Usage:
#   chmod +x scripts/download-brand-heroes-batch3.sh
#   ./scripts/download-brand-heroes-batch3.sh

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

echo "=== Brand Heroes — Batch 3 (10 verified URLs) ==="
echo ""

# Tier A — lifestyle ≥1600w from brand CDN
download "american-standard" \
  "https://www.americanstandard-us.com/cdn/shop/files/img-1.png" \
  "png"

download "kraus" \
  "https://www.kraususa.com/media/wysiwyg/Homepage_Find_Our_Latest_2.jpg" \
  "jpg"

download "atlas-homewares" \
  "https://www.atlashomewares.com/media/wysiwyg/Amplify_Lifestyle_cc-3024x1700.jpg" \
  "jpg"

download "fisher-and-paykel" \
  "https://www.fisherpaykel.com/on/demandware.static/-/Library-Sites-FisherPaykelSharedLibrary/default/dwd214a1cf/web-slides/journey-webslides/fp_02_00_00_kitchen-lifestyle-minimal-cooktop2-model_2437_glo_2400.jpg" \
  "jpg"

download "wyndham-collection" \
  "https://www.wyndhamcollection.com/cdn/shop/files/wyndham-collection-web-pendry-daria-dorrit-collections.jpg?v=1769455448" \
  "jpg"

# Tier B — brand-official but slightly under 1600w or product-isolated
download "bosch" \
  "https://media3.bsh-group.com/Images/1600x/20601380_Bosch_Home_Meta_1200x630.webp" \
  "webp"

download "jacuzzi" \
  "https://www.jacuzzi.com/dw/image/v2/BDRW_PRD/on/demandware.static/-/Library-Sites-jacuzzi-shared-content/default/dwbc3e47b1/spa-main-folder/spa-collections/J5/Jacuzzi_J5_Talent_Night_01_1800x1080.png" \
  "png"

download "cheviot" \
  "https://cheviotproducts.com/cdn/shop/files/1300-MW-1-BK_2_00581791-935c-418d-84e2-37df5fb383c1.jpg?v=1727969460" \
  "jpg"

download "buster-punch" \
  "http://uk.busterandpunch.com/cdn/shop/files/Frame_2033.jpg?v=1751462560&width=2048" \
  "jpg"

# Nostalgic Warehouse — Shopify collection image (heritage door hardware lifestyle)
download "nostalgic-warehouse" \
  "https://nostalgicwarehouse.com/cdn/shop/collections/collection-image_c64938e5-317f-4813-b5eb-4ef1b5faffca.jpg?v=1644875604" \
  "jpg"

echo ""
echo "=== Done. ==="
echo ""
echo "Playwright-blocked (9 brands) — need Roger manual or batch 4:"
echo "  moen, waterstone, bainultra, hydrosystems, kitchenaid,"
echo "  watermark, riobel, victoria-and-albert, sukabumi-stone-mexico"
echo ""
echo "Then run: npx tsx scripts/process-brand-heroes-batch2.ts"
