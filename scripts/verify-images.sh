#!/bin/bash
# Verifies all image paths in SAMPLE_PRODUCTS resolve to actual files.
#
# Usage:
#   chmod +x scripts/verify-images.sh
#   ./scripts/verify-images.sh

echo "=== Checking SAMPLE_PRODUCTS image paths ==="
MISSING=0
grep 'image:' app/lib/constants.ts | sed 's/.*image: "//;s/".*//' | sort -u | while read img; do
  if [ ! -f "public$img" ]; then
    echo "MISSING: $img"
    MISSING=$((MISSING+1))
  fi
done

echo ""
echo "=== Checking SUBCATEGORY_META hero images ==="
grep 'heroImage:' app/lib/constants.ts | grep '/' | sed 's/.*heroImage: "//;s/".*//' | while read img; do
  if [ ! -f "public$img" ]; then
    echo "MISSING HERO: $img"
  fi
done

echo ""
echo "=== Total products in SAMPLE_PRODUCTS ==="
grep -c 'id:' app/lib/constants.ts

echo ""
echo "=== Products by category ==="
grep 'category:' app/lib/constants.ts | sed 's/.*category: "//;s/".*//' | sort | uniq -c | sort -rn

echo ""
echo "=== Products by subcategory ==="
grep 'subcategory:' app/lib/constants.ts | sed 's/.*subcategory: "//;s/".*//' | sort | uniq -c | sort -rn

echo ""
echo "=== Total images on disk ==="
find public/products -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" \) | wc -l

echo ""
echo "=== Done ==="
