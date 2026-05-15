"use client";

import { useState } from "react";
import Image from "next/image";
import { resolveVisualTheme } from "@/app/lib/product-visuals";

interface ProductVisualProps {
  id: string;
  brand: string;
  sku: string;
  name: string;
  /** Aspect ratio for the visual area */
  aspect?: "4/3" | "1/1" | "16/9";
  /** Visual size preset — controls wordmark scaling */
  size?: "tile" | "card" | "hero";
  /** Round corners on the top face only (for cards with separate text block) */
  className?: string;
  /** If true, always use typographic variant even when image exists.
   *  Useful for hero contexts where we want consistent style. */
  forceTypography?: boolean;
  /** If true, fill the parent (which provides aspect ratio + overflow).
   *  Drops the internal aspect class so this can stack inside a layered
   *  parent next to a foreground Image — used by SafeProductImage. */
  fill?: boolean;
  /** When false, skip image loading entirely and render the typographic
   *  fallback immediately. Prevents 404 probes for imageless SKUs.
   *  Default true to preserve backward compatibility. */
  hasImage?: boolean;
  /** Explicit image source URL. When provided, used as-is instead of
   *  the default /products/odoo/<id>.jpg path. */
  imageSrc?: string;
  /** When true, load eagerly (above-the-fold). Default false (lazy). */
  eager?: boolean;
}

const sizesForPreset = (size: "tile" | "card" | "hero"): string => {
  if (size === "tile") return "48px";
  if (size === "hero") return "(max-width: 768px) 100vw, 50vw";
  return "(max-width: 768px) 50vw, 25vw";
};

const ProductVisual = ({
  id,
  brand,
  sku,
  name,
  aspect = "4/3",
  size = "card",
  className = "",
  forceTypography,
  fill,
  hasImage = true,
  imageSrc,
  eager = false,
}: ProductVisualProps) => {
  const shouldShowImage = hasImage !== false && !forceTypography;
  const src = imageSrc ?? `/products/odoo/${id}.jpg`;

  const [mode, setMode] = useState<"image" | "typography">(
    shouldShowImage ? "image" : "typography"
  );
  const [prevKey, setPrevKey] = useState(`${shouldShowImage}-${id}`);
  const key = `${shouldShowImage}-${id}`;
  if (key !== prevKey) {
    setPrevKey(key);
    setMode(shouldShowImage ? "image" : "typography");
  }

  const theme = resolveVisualTheme(brand, sku);
  const positionCls = fill
    ? "absolute inset-0"
    : "relative " +
      (aspect === "1/1"
        ? "aspect-square"
        : aspect === "16/9"
          ? "aspect-[16/9]"
          : "aspect-[4/3]");

  const chipText = size === "tile" ? "text-[9px]" : "text-[10px]";

  const finishChip = theme.finishCode ? (
    <span
      className={`absolute top-2 right-2 px-2 py-0.5 font-mono ${chipText} font-semibold tracking-wider backdrop-blur-sm z-20 ${
        mode === "image" ? "bg-white/95 text-brand-charcoal" : "bg-white/15"
      }`}
      style={
        mode === "image"
          ? undefined
          : { color: theme.fg, borderColor: theme.fg + "22" }
      }
      title={theme.finishLabel}
    >
      {theme.finishCode}
    </span>
  ) : null;

  if (mode === "image") {
    return (
      <div className={`${positionCls} bg-white overflow-hidden ${className}`}>
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizesForPreset(size)}
          priority={eager}
          className="object-contain"
          onError={() => setMode("typography")}
        />
        {finishChip}
      </div>
    );
  }

  // Typographic variant — branded panel with wordmark
  const wordmarkSize =
    size === "hero"
      ? "text-4xl md:text-5xl"
      : size === "card"
        ? "text-2xl"
        : "text-base";

  return (
    <div
      className={`${positionCls} overflow-hidden flex items-center justify-center px-4 ${className}`}
      style={{
        background: theme.bg,
        color: theme.fg,
      }}
    >
      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" />
      <h4
        className={`font-display font-light tracking-wide ${wordmarkSize} text-center leading-tight max-w-full truncate opacity-90`}
      >
        {brand || "—"}
      </h4>
      {finishChip}
      {theme.finishLabel && size !== "tile" && (
        <span
          className="absolute bottom-2 left-2 text-[9px] tracking-[0.2em] uppercase opacity-70 font-body"
          style={{ color: theme.fg }}
        >
          {theme.finishLabel}
        </span>
      )}
    </div>
  );
};

export { ProductVisual };
