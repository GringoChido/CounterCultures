import type { ReactNode } from "react";
import Image from "next/image";
import { formatCatalogCount } from "@/app/lib/format-catalog-count";
import { CatalogSearchInput } from "./catalog-search-input";

interface CatalogDepthBandProps {
  locale: "en" | "es";
  totalCatalog: number;
  children?: ReactNode;
}

const SIGNAL_BRANDS = [
  "Brizo",
  "TOTO",
  "Kohler",
  "BLANCO",
  "Emtek",
  "Sun Valley Bronze",
  "California Faucets",
  "Villeroy & Boch",
];

const CatalogDepthBand = ({ locale, totalCatalog, children }: CatalogDepthBandProps) => {
  const isEs = locale === "es";
  const numFmt = isEs ? "es-MX" : "en-US";
  if (!totalCatalog) return null;

  return (
    <section className="relative bg-brand-linen overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
          <div className="relative aspect-[4/3] lg:aspect-[5/4] rounded-lg overflow-hidden">
            <Image
              src="/images/kitchen/faucets.webp"
              alt={
                isEs
                  ? "Catálogo completo de Counter Cultures"
                  : "The full Counter Cultures catalog"
              }
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/15 to-transparent pointer-events-none" />
          </div>

          <div>
            <h2 className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
              {isEs ? "Catálogo completo" : "The full catalog"}
            </h2>
            <p className="mt-4 font-display text-6xl md:text-7xl lg:text-8xl font-light text-brand-charcoal tabular-nums leading-[0.95]">
              {formatCatalogCount(totalCatalog, locale)}
            </p>
            <p className="mt-3 font-body text-sm md:text-base text-dash-text-secondary uppercase tracking-[0.15em]">
              {isEs ? "piezas autorizadas" : "authorized pieces"}
            </p>
            <p className="mt-6 font-display text-xl md:text-2xl font-light text-brand-charcoal leading-snug max-w-md">
              {isEs ? (
                <>
                  De grifería a manijas, del producto cotidiano a la pieza{" "}
                  <span className="italic text-brand-copper">artesanal única</span>.
                </>
              ) : (
                <>
                  Faucets to door knobs, mass-market workhorses to one-off{" "}
                  <span className="italic text-brand-copper">artisanal pieces</span>.
                </>
              )}
            </p>
            <p className="mt-4 font-body text-sm text-dash-text-secondary leading-relaxed max-w-md">
              {isEs
                ? "Cada SKU especificado por nosotros y entregado por nosotros. Sin intermediarios, sin sorpresas."
                : "Every SKU spec'd through us and delivered through us. No middlemen, no surprises."}
            </p>

            <CatalogSearchInput locale={locale} totalCatalog={totalCatalog} />

            <div className="mt-8 pt-6 border-t border-brand-stone/15">
              <p className="font-body text-[10px] tracking-[0.2em] uppercase text-dash-text-secondary mb-3">
                {isEs ? "Incluye" : "Includes"}
              </p>
              <p className="font-mono text-[11px] text-dash-text-secondary leading-relaxed">
                {SIGNAL_BRANDS.join(" · ")}{" "}
                <span className="text-dash-text-secondary/60">
                  + {isEs ? "más" : "more"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {children}
      </div>
    </section>
  );
};

export { CatalogDepthBand };
