import Link from "next/link";
import Image from "next/image";
import type { Brand } from "@/app/lib/brand-kit-types";

interface FeaturedBrandsBandProps {
  locale: "en" | "es";
  brands: Array<Brand & { catalogCount: number; heroImage?: string }>;
}

const T = {
  en: {
    eyebrow: "Authorized dealers",
    headline: "Working with",
    headlineItalic: "real brand relationships.",
    subhead: "Factory-direct pricing, full manufacturer warranty, installation support in San Miguel de Allende.",
    seeAll: "All 160 brands",
    pieces: "pieces",
  },
  es: {
    eyebrow: "Distribuidor autorizado",
    headline: "Trabajamos con",
    headlineItalic: "relaciones de marca reales.",
    subhead: "Precio de fábrica, garantía de manufactura completa, soporte de instalación en San Miguel de Allende.",
    seeAll: "Las 160 marcas",
    pieces: "piezas",
  },
};

const FeaturedBrandsBand = ({ locale, brands }: FeaturedBrandsBandProps) => {
  const t = T[locale];
  if (brands.length === 0) return null;
  return (
    <section className="py-14 md:py-20 bg-brand-linen border-b border-brand-stone/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
          <div>
            <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
              {t.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-light tracking-wide text-brand-charcoal leading-[1.1] max-w-2xl">
              {t.headline}{" "}
              <span className="italic">{t.headlineItalic}</span>
            </h2>
            <p className="mt-2 font-body text-sm text-brand-stone max-w-xl">
              {t.subhead}
            </p>
          </div>
          <Link
            href={`/${locale}/brands`}
            className="font-body text-xs tracking-[0.2em] uppercase text-brand-copper hover:text-brand-copper/70 transition-colors"
          >
            {t.seeAll} →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {brands.map((b) => (
            <Link
              key={b.slug}
              href={`/${locale}/brands/${b.slug}`}
              className="group relative aspect-[4/3] bg-white border border-brand-stone/15 hover:border-brand-copper/60 transition-all overflow-hidden"
            >
              {b.heroImage ? (
                <>
                  <Image
                    src={b.heroImage}
                    alt={b.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <h3 className="font-display text-xl font-light tracking-wide leading-tight">
                      {b.name}
                    </h3>
                    {b.catalogCount > 0 && (
                      <p className="mt-1 font-body text-[11px] tracking-[0.15em] uppercase opacity-90">
                        <span className="font-mono text-brand-copper">
                          {b.catalogCount.toLocaleString()}
                        </span>{" "}
                        {t.pieces}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <h3 className="font-display text-xl font-light tracking-wide text-brand-charcoal">
                    {b.name}
                  </h3>
                  {b.catalogCount > 0 && (
                    <p className="mt-2 font-body text-[11px] tracking-[0.15em] uppercase text-brand-stone">
                      <span className="font-mono text-brand-copper">
                        {b.catalogCount.toLocaleString()}
                      </span>{" "}
                      {t.pieces}
                    </p>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export { FeaturedBrandsBand };
