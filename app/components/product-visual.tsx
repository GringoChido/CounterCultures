"use client";

import { useState, useEffect } from "react";
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
}

/**
 * The cornerstone visual for every product card, tile, and drawer hero
 * across the public site. Tries to load the product image first; on 404
 * (the 98.8% of the catalog without photos) falls back to a branded
 * typographic panel using the finish code or brand color.
 *
 * This is what lets the whole 354k catalog look intentional.
 */
const ProductVisual = ({
  id,
  brand,
  sku,
  name,
  aspect = "4/3",
  size = "card",
  className = "",
  forceTypography,
}: ProductVisualProps) => {
  // Probe state: start optimistic for products likely to have an image,
  // skip straight to typography otherwise (saves a 404 round trip on
  // 98.8% of rows).
  const [mode, setMode] = useState<"probing" | "image" | "typography">(
    forceTypography ? "typography" : "probing"
  );
  useEffect(() => {
    if (forceTypography) {
      setMode("typography");
      return;
    }
    setMode("probing");
  }, [id, forceTypography]);

  const theme = resolveVisualTheme(brand, sku);
  const aspectCls =
    aspect === "1/1"
      ? "aspect-square"
      : aspect === "16/9"
        ? "aspect-[16/9]"
        : "aspect-[4/3]";

  const chipText = size === "tile" ? "text-[9px]" : "text-[10px]";

  // Finish chip — always shown when we parsed one, even on image cards.
  // It's a universal data signal architects use.
  const finishChip = theme.finishCode ? (
    <span
      className={`absolute top-2 right-2 px-2 py-0.5 font-mono ${chipText} font-semibold tracking-wider backdrop-blur-sm ${
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
      <div className={`relative ${aspectCls} bg-brand-linen overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/products/odoo/${id}.jpg`}
          alt={name}
          onError={() => setMode("typography")}
          className="w-full h-full object-cover"
        />
        {finishChip}
      </div>
    );
  }

  if (mode === "probing") {
    return (
      <div className={`relative ${aspectCls} bg-brand-linen overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/products/odoo/${id}.jpg`}
          alt={name}
          onLoad={() => setMode("image")}
          onError={() => setMode("typography")}
          className="w-full h-full object-cover opacity-0"
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
      className={`relative ${aspectCls} overflow-hidden flex items-center justify-center px-4 ${className}`}
      style={{
        background: theme.bg,
        color: theme.fg,
      }}
    >
      {/* Subtle inner ring for depth — keeps the panel from feeling flat */}
      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" />
      {/* Centered brand wordmark — serif, echoes the site's editorial voice */}
      <h4
        className={`font-display font-light tracking-wide ${wordmarkSize} text-center leading-tight max-w-full truncate opacity-90`}
      >
        {brand || "—"}
      </h4>
      {finishChip}
      {/* Tiny finish label at bottom-left on larger sizes */}
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
