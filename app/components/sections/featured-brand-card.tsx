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
 * Brand card with image overlay over a dark typographic fallback.
 *
 * The fallback is dark (charcoal) so it pairs well with the dark
 * featured-brands section background — and the card never has the
 * "blink to cream" look while the image loads.
 *
 * Drive-placeholder detection is gated on Drive URLs only; Next.js
 * resizes the same local asset down to 191px on mobile, which the
 * old <320 width heuristic was wrongly flagging as a placeholder
 * and forcing every card into typographic-fallback mode.
 */
const isDriveUrl = (url?: string) =>
  !!url && /(?:lh\d\.googleusercontent\.com|drive\.google\.com)/.test(url);

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
      {/* Dark typographic base — full bleed, always present. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-brand-charcoal">
        <h3 className="font-display text-xl font-light tracking-wide text-white">
          {name}
        </h3>
        {!showImage && catalogCount > 0 && (
          <p className="mt-2 font-body text-[11px] tracking-[0.15em] uppercase text-white/70">
            <span className="font-mono text-brand-copper">
              {catalogCount.toLocaleString()}
            </span>{" "}
            {piecesLabel}
          </p>
        )}
      </div>

      {/* Image overlay + gradient + bottom-aligned label when present. */}
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
              // Only Drive URLs ever served the 300×300 placeholder we want
              // to fall back from. Local assets resize legitimately small.
              if (!isDriveUrl(heroImage)) return;
              const img = e.currentTarget as HTMLImageElement;
              if (img.naturalWidth > 0 && img.naturalWidth < 320) setErrored(true);
            }}
          />
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-brand-charcoal/85 via-brand-charcoal/30 to-transparent" />
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
