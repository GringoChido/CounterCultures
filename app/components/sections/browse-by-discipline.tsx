import { Fragment } from "react";
import Image from "next/image";
import { Link } from "@/app/i18n/navigation";
import {
  DISCIPLINE_SPREADS,
  PRODUCT_CATEGORIES,
  type DisciplineSpread,
  type CategoryKey,
} from "@/app/lib/constants";
import { getCategoryPieceCounts } from "@/app/lib/products-full";
import { formatAnchorBrands } from "@/app/lib/format-anchor-brands";

type Locale = "en" | "es";

const T = {
  eyebrow: { en: "Browse by Discipline", es: "Explora por Disciplina" },
  headline: {
    en: "Three rooms. Seventy-three brands. One catalog.",
    es: "Tres ambientes. Setenta y tres marcas. Un catálogo.",
  },
  lede: {
    en: "Counter Cultures organizes 354,000 pieces into three rooms and one workshop. The rooms are conventional. The workshop is not — it's where the artisans Mexico has been perfecting for generations sit next to Brizo, TOTO, and Kohler.",
    es: "Counter Cultures organiza 354,000 piezas en tres ambientes y un taller. Los ambientes son convencionales. El taller no — es donde los artesanos que México ha perfeccionado por generaciones se sientan junto a Brizo, TOTO y Kohler.",
  },
} as const;

const WORKSHOP_SUBCATEGORIES = [
  { slug: "ceramic", label: { en: "Ceramic", es: "Cerámica" } },
  { slug: "concrete", label: { en: "Concrete", es: "Concreto" } },
  { slug: "copper", label: { en: "Copper", es: "Cobre" } },
  { slug: "brass", label: { en: "Brass", es: "Latón" } },
  { slug: "stone", label: { en: "Stone", es: "Piedra" } },
  { slug: "cast-bronze", label: { en: "Cast Bronze", es: "Bronce Fundido" } },
] as const;

interface DisciplineSpreadCardProps {
  spread: DisciplineSpread;
  locale: Locale;
  pieceCount: number;
  imagePosition: "left" | "right";
  priorityImage: boolean;
}

const DisciplineSpreadCard = ({
  spread,
  locale,
  pieceCount,
  imagePosition,
  priorityImage,
}: DisciplineSpreadCardProps) => {
  const isWorkshops = spread.key === "workshops";
  const subcategories = isWorkshops
    ? WORKSHOP_SUBCATEGORIES
    : PRODUCT_CATEGORIES[spread.key as CategoryKey].subcategories;

  const brandLine =
    locale === "en"
      ? `${pieceCount.toLocaleString("en-US")} pieces from ${formatAnchorBrands(spread.anchorBrands, "en")}`
      : `${pieceCount.toLocaleString("es-MX")} piezas de ${formatAnchorBrands(spread.anchorBrands, "es")}`;

  const workshopBrandLine =
    locale === "en"
      ? "Four workshops Mexico has been perfecting for generations"
      : "Cuatro talleres que México ha perfeccionado por generaciones";

  return (
    <div className="border-t border-brand-copper/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
            imagePosition === "left" ? "" : ""
          }`}
        >
          {/* Image column */}
          <div
            className={`relative aspect-[4/5] ${
              imagePosition === "left" ? "lg:order-1" : "lg:order-2"
            }`}
          >
            <Image
              src={spread.heroImage}
              alt={
                locale === "en"
                  ? `${spread.label.en} — Counter Cultures`
                  : `${spread.label.es} — Counter Cultures`
              }
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover rounded-[4px]"
              priority={priorityImage}
            />
          </div>

          {/* Text column */}
          <div
            className={`${
              imagePosition === "left" ? "lg:order-2" : "lg:order-1"
            }`}
          >
            {/* Number marker */}
            <span className="font-mono text-sm text-brand-copper tracking-[0.3em]">
              {spread.number}
            </span>

            {/* Discipline name */}
            <h3 className="mt-3 font-display text-3xl lg:text-5xl font-light tracking-wide text-brand-charcoal">
              {spread.label[locale]}
            </h3>

            {/* Editorial copy */}
            <p className="mt-6 font-body text-[17px] leading-[1.6] text-brand-charcoal/85 max-w-[50ch]">
              {spread.copy[locale]}
            </p>

            {/* Subcategory tracking strip */}
            <div className="mt-8 font-body text-[11px] uppercase tracking-[0.2em] text-brand-copper leading-relaxed max-w-[50ch]">
              {subcategories.map((sub, i) => (
                <Fragment key={sub.slug}>
                  {isWorkshops ? (
                    <span>{sub.label[locale].toUpperCase()}</span>
                  ) : (
                    <Link
                      href={`/shop/${spread.key}/${sub.slug}`}
                      className="hover:underline decoration-brand-copper decoration-1 underline-offset-4 transition-colors"
                    >
                      {sub.label[locale].toUpperCase()}
                    </Link>
                  )}
                  {i < subcategories.length - 1 && (
                    <span className="mx-2 opacity-50">·</span>
                  )}
                </Fragment>
              ))}
            </div>

            {/* Live data line */}
            <p className="font-body text-sm text-dash-text-secondary mt-4 font-medium">
              {isWorkshops ? workshopBrandLine : brandLine}
            </p>

            {/* CTA */}
            <Link
              href={spread.href}
              className="group inline-flex items-center gap-2 mt-8 font-body text-xs uppercase tracking-[0.2em] text-brand-copper hover:text-brand-terracotta transition-colors"
            >
              {spread.ctaLabel[locale]}
              <span className="inline-block transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DisciplineSpreadCard };

interface BrowseByDisciplineProps {
  locale: Locale;
}

const BrowseByDiscipline = async ({ locale }: BrowseByDisciplineProps) => {
  let counts: Record<string, number>;
  try {
    counts = await getCategoryPieceCounts();
  } catch {
    counts = { bathroom: 0, kitchen: 0, hardware: 0, workshops: 0 };
  }

  return (
    <section id="browse" className="scroll-mt-24 bg-brand-linen py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="font-body text-[11px] uppercase tracking-[0.25em] text-brand-terracotta mb-3">
          {T.eyebrow[locale]}
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-light tracking-wide text-brand-charcoal">
          {T.headline[locale]}
        </h2>
        <p className="mt-6 font-body text-[17px] leading-[1.6] text-brand-charcoal/70 max-w-[65ch]">
          {T.lede[locale]}
        </p>
      </div>

      <div className="mt-12 md:mt-20">
        {DISCIPLINE_SPREADS.map((spread, i) => (
          <DisciplineSpreadCard
            key={spread.number}
            spread={spread}
            locale={locale}
            pieceCount={counts[spread.key] ?? 0}
            imagePosition={i % 2 === 0 ? "right" : "left"}
            priorityImage={i === 0}
          />
        ))}
      </div>
    </section>
  );
};

export { BrowseByDiscipline };
