import { Link } from "@/app/i18n/navigation";
import type { Brand } from "@/app/lib/brand-kit-types";
import { FeaturedBrandCard } from "./featured-brand-card";

interface FeaturedBrandsBandProps {
  locale: "en" | "es";
  brands: Array<Brand & { catalogCount: number; heroImage?: string }>;
}

const T = {
  en: {
    eyebrow: "Authorized dealer",
    headline: "We don't resell.",
    headlineItalic: "We're the dealer.",
    subhead: "Direct factory relationships with the brands below — full manufacturer warranty, factory-direct pricing, installation support out of San Miguel.",
    seeAll: "All authorized brands",
    pieces: "SKUs",
  },
  es: {
    eyebrow: "Distribuidor autorizado",
    headline: "No revendemos.",
    headlineItalic: "Somos el distribuidor.",
    subhead: "Relaciones directas de fábrica con las marcas que ves abajo — garantía de manufactura completa, precio de fábrica, soporte de instalación desde San Miguel.",
    seeAll: "Todas las marcas autorizadas",
    pieces: "SKUs",
  },
};

const FeaturedBrandsBand = ({ locale, brands }: FeaturedBrandsBandProps) => {
  const t = T[locale];
  if (brands.length === 0) return null;
  return (
    <section className="relative py-16 md:py-24 bg-brand-charcoal text-white overflow-hidden">
      {/* Subtle copper glow — adds warmth without competing with the cards */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-32 w-[640px] h-[640px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, #B87333, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6 mb-10 md:mb-14 flex-wrap">
          <div>
            <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
              {t.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl font-light tracking-wide text-white leading-[1.05] max-w-3xl">
              {t.headline}{" "}
              <span className="italic text-brand-copper">
                {t.headlineItalic}
              </span>
            </h2>
            <p className="mt-3 font-body text-sm md:text-base text-white/70 max-w-2xl leading-relaxed">
              {t.subhead}
            </p>
          </div>
          <Link
            href="/brands"
            className="group inline-flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase text-brand-copper hover:text-white transition-colors"
          >
            {t.seeAll}
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {brands.map((b) => (
            <Link
              key={b.slug}
              href={`/brands/${b.slug}`}
              className="group relative aspect-[4/3] bg-brand-charcoal border border-white/10 hover:border-brand-copper/70 transition-all overflow-hidden"
            >
              <FeaturedBrandCard
                name={b.name}
                heroImage={b.heroImage}
                catalogCount={b.catalogCount}
                piecesLabel={t.pieces}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export { FeaturedBrandsBand };
