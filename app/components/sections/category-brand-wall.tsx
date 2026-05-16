"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/app/i18n/navigation";
import type {
  CategoryBrand,
  CategoryBrandSection,
} from "@/app/lib/category-brand-index";

interface CategoryBrandWallProps {
  category: string;
  sections: CategoryBrandSection[];
  locale: "en" | "es";
}

const HEADLINES: Record<string, { en: string; es: string }> = {
  bathroom: {
    en: "The names behind the bathroom.",
    es: "Los nombres detrás del baño.",
  },
  kitchen: {
    en: "The names behind the kitchen.",
    es: "Los nombres detrás de la cocina.",
  },
  hardware: {
    en: "The names behind the hardware.",
    es: "Los nombres detrás del herraje.",
  },
};

const SUBHEADS: Record<string, { en: string; es: string }> = {
  bathroom: {
    en: "From flagship factories to Mexican workshops — every brand we source for the bath, in one index.",
    es: "Desde fábricas insignia hasta talleres mexicanos — todas las marcas que abastecemos para el baño, en un solo índice.",
  },
  kitchen: {
    en: "From flagship factories to Mexican workshops — every brand we source for the kitchen, in one index.",
    es: "Desde fábricas insignia hasta talleres mexicanos — todas las marcas que abastecemos para la cocina, en un solo índice.",
  },
  hardware: {
    en: "From hand-cast bronze to precision-engineered locks — every hardware name we carry, in one index.",
    es: "Del bronce fundido a mano a las cerraduras de precisión — todos los nombres de herraje que manejamos, en un solo índice.",
  },
};

const BrandName = ({
  brand,
  locale,
  category,
}: {
  brand: CategoryBrand;
  locale: "en" | "es";
  category: string;
}) => {
  const flagshipClass = brand.flagship
    ? "font-display text-2xl md:text-3xl lg:text-4xl tracking-wide text-white"
    : "font-body text-base md:text-lg text-white/65";

  // Brands with curated profile pages route to the rich brand-by-category
  // page. Brands without a built page (yet) fall back to the catalog
  // filtered by brand name — always renders, never 404s, lets the user
  // see what we carry from that brand right now.
  const href = brand.slug
    ? `/brands/${brand.slug}/${category}`
    : `/shop/catalog?brand=${encodeURIComponent(brand.name)}&category=${category}`;

  return (
    <Link
      href={href}
      className={`${flagshipClass} hover:text-brand-copper transition-colors duration-300`}
    >
      {brand.name}
    </Link>
  );
};

const Separator = () => (
  <span aria-hidden="true" className="text-white/25 select-none">
    ·
  </span>
);

const CategoryBrandWall = ({
  category,
  sections,
  locale,
}: CategoryBrandWallProps) => {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const active = sections.find((s) => s.id === activeId) ?? sections[0];

  if (!active) return null;

  const flagship = active.brands.filter((b) => b.flagship);
  const rest = active.brands.filter((b) => !b.flagship);

  return (
    <section className="py-20 md:py-32 bg-brand-charcoal text-white relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end mb-12 md:mb-16">
          <div className="lg:col-span-7">
            <span className="font-body font-semibold text-[11px] tracking-[0.32em] text-brand-copper uppercase">
              {locale === "en" ? "Authorized & Curated" : "Autorizadas y Curadas"}
            </span>
            <h2 className="mt-4 font-display text-3xl md:text-5xl lg:text-6xl font-light tracking-wide text-white leading-[1.05]">
              {(HEADLINES[category] ?? HEADLINES.bathroom)[locale]}
            </h2>
          </div>
          <div className="lg:col-span-5 lg:border-l border-white/15 lg:pl-10">
            <p className="font-body text-base text-white/65 leading-relaxed max-w-md">
              {(SUBHEADS[category] ?? SUBHEADS.bathroom)[locale]}
            </p>
          </div>
        </div>

        {/* Tab nav */}
        <nav
          aria-label={
            locale === "en" ? "Brand index sections" : "Secciones del índice"
          }
          className="border-y border-white/10 mb-10 md:mb-14"
        >
          <ul className="flex gap-6 md:gap-10 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {sections.map((section) => {
              const isActive = section.id === activeId;
              return (
                <li key={section.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveId(section.id)}
                    aria-pressed={isActive}
                    className={`group relative py-5 font-body text-sm tracking-[0.18em] uppercase whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "text-brand-copper font-semibold"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    <span>{section.label[locale]}</span>
                    <span className="ml-2 font-mono text-[10px] tracking-[0.18em] opacity-70">
                      {String(section.brands.length).padStart(2, "0")}
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="brand-wall-underline"
                        className="absolute left-0 right-0 -bottom-px h-px bg-brand-copper"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Brand wall — flagship row, then secondary flow */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-10"
          >
            {flagship.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-x-4 md:gap-x-6 gap-y-3">
                {flagship.map((brand, i) => (
                  <span key={`f-${brand.name}`} className="inline-flex items-baseline gap-x-4 md:gap-x-6">
                    <BrandName brand={brand} locale={locale} category={category} />
                    {i < flagship.length - 1 && <Separator />}
                  </span>
                ))}
              </div>
            )}
            {rest.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-x-3 md:gap-x-4 gap-y-2 max-w-5xl pt-4 border-t border-white/10">
                {rest.map((brand, i) => (
                  <span key={`r-${brand.name}`} className="inline-flex items-baseline gap-x-3 md:gap-x-4">
                    <BrandName brand={brand} locale={locale} category={category} />
                    {i < rest.length - 1 && <Separator />}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer caption */}
        <p className="mt-12 md:mt-16 font-mono text-[10px] tracking-[0.25em] uppercase text-white/40">
          {locale === "en"
            ? `${sections.reduce((sum, s) => sum + s.brands.length, 0)} brands · sourced under one roof`
            : `${sections.reduce((sum, s) => sum + s.brands.length, 0)} marcas · abastecidas bajo un mismo techo`}
        </p>
      </div>
    </section>
  );
};

export { CategoryBrandWall };
