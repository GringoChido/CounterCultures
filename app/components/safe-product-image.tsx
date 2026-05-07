"use client";

import { useState } from "react";
import Image from "next/image";
import { ProductVisual } from "./product-visual";

interface SafeProductImageProps {
  /** Catalog product id — passed through to ProductVisual fallback */
  id: string;
  brand: string;
  sku: string;
  /** Display name; doubles as alt text */
  name: string;
  /** Source URL. Empty / undefined → typographic fallback only */
  imageSrc?: string;
  /** sizes attribute for next/image */
  sizes: string;
  /** Forwarded to next/image */
  priority?: boolean;
  /** Extra classes for the image (e.g. group-hover:scale-105) */
  imageClassName?: string;
  /** Pass through to ProductVisual for matching size scaling */
  size?: "tile" | "card" | "hero";
}

// Drive's "missing file" placeholder is exactly 300×300. Anything narrower
// than this is almost certainly the placeholder, not a real product photo.
const MIN_REAL_WIDTH = 320;

/**
 * Layered product image that gracefully degrades:
 *
 *   - ProductVisual typographic panel always renders as the base layer.
 *   - When imageSrc is set, an `<Image fill>` overlays on top.
 *   - The overlay is hidden if onError fires OR onLoad reports a width
 *     under MIN_REAL_WIDTH (catches Google Drive's silent placeholder PNG).
 *
 * The parent must provide the aspect ratio + `overflow-hidden`. This
 * component fills it.
 */
const SafeProductImage = ({
  id,
  brand,
  sku,
  name,
  imageSrc,
  sizes,
  priority,
  imageClassName = "",
  size = "card",
}: SafeProductImageProps) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!imageSrc && !imgFailed;

  return (
    <>
      <ProductVisual
        id={id}
        brand={brand}
        sku={sku}
        name={name}
        size={size}
        forceTypography
        fill
      />
      {showImage && (
        <Image
          src={imageSrc!}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          className={`absolute inset-0 object-contain z-10 bg-white ${imageClassName}`}
          onError={() => setImgFailed(true)}
          onLoad={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.naturalWidth > 0 && img.naturalWidth < MIN_REAL_WIDTH) {
              setImgFailed(true);
            }
          }}
        />
      )}
    </>
  );
};

export { SafeProductImage };
