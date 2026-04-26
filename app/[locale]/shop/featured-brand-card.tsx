"use client";

import { useState } from "react";
import Image from "next/image";

interface FeaturedBrandCardProps {
  name: string;
  heroImage?: string;
  catalogCount: number;
  piecesLabel: string;
}

/**
 * Branded card body with onError fallback to a typographic panel —
 * matches ProductVisual's aesthetic so a removed/missing /Assets/BRANDS/
 * file gracefully degrades instead of showing a broken image.
 */
const FeaturedBrandCard = ({
  name,
  heroImage,
  catalogCount,
  piecesLabel,
}: FeaturedBrandCardProps) => {
  const [errored, setErrored] = useState(false);
  const showImage = !!heroImage && !errored;

  return (
    <>
      {/* Typographic base layer — always present so a missing or placeholder
          hero degrades to a clean editorial card. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-brand-linen">
        <h3 className="font-display text-xl font-light tracking-wide text-brand-charcoal">
          {name}
        </h3>
        {catalogCount > 0 && (
          <p className="mt-2 font-body text-[11px] tracking-[0.15em] uppercase text-brand-stone">
            <span className="font-mono text-brand-copper">
              {catalogCount.toLocaleString()}
            </span>{" "}
            {piecesLabel}
          </p>
        )}
      </div>
      {showImage && (
        <>
          <Image
            src={heroImage!}
            alt={name}
            fill
            className="absolute inset-0 z-10 object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
            onError={() => setErrored(true)}
            onLoad={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.naturalWidth > 0 && img.naturalWidth < 320) setErrored(true);
            }}
          />
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 z-30 p-4 text-white">
            <h3 className="font-display text-xl font-light tracking-wide leading-tight">
              {name}
            </h3>
            {catalogCount > 0 && (
              <p className="mt-1 font-body text-[11px] tracking-[0.15em] uppercase opacity-90">
                <span className="font-mono text-brand-copper">
                  {catalogCount.toLocaleString()}
                </span>{" "}
                {piecesLabel}
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
};

export { FeaturedBrandCard };
