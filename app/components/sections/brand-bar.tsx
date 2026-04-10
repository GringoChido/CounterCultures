"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";

const brands = [
  { name: "Kohler", slug: "kohler" },
  { name: "TOTO", slug: "toto" },
  { name: "Brizo", slug: "brizo" },
  { name: "BLANCO", slug: "blanco" },
  { name: "California Faucets", slug: "california-faucets" },
  { name: "Emtek", slug: "emtek" },
  { name: "Sun Valley Bronze", slug: "sun-valley-bronze" },
  { name: "Badeloft", slug: "badeloft" },
  { name: "SMEG", slug: "smeg" },
  { name: "ROHL", slug: "rohl" },
];

const BrandBar = ({ locale = "en" }: { locale?: string }) => {
  const lang = locale === "es" ? "es" : "en";
  return (
    <section className="bg-brand-charcoal py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <p className="text-center font-body font-semibold text-xs tracking-[0.25em] text-brand-terracotta uppercase mb-6 md:mb-8">
            {locale === "en" ? "Authorized Dealer" : "Distribuidor Autorizado"}
          </p>
          <div className="flex items-center justify-start md:justify-center overflow-x-auto scrollbar-hide gap-0 flex-wrap md:flex-nowrap">
            {brands.map((brand, i) => (
              <a
                key={brand.slug}
                href={`/${lang}/brands/${brand.slug}`}
                className={`flex items-center justify-center px-4 md:px-8 py-3 md:py-4 font-display text-base md:text-2xl text-white tracking-wider hover:text-brand-copper transition-colors duration-300 shrink-0 ${
                  i < brands.length - 1 ? "border-r border-white/20" : ""
                }`}
              >
                {brand.name}
              </a>
            ))}
          </div>
          <p className="text-center font-body text-sm text-white/60 mt-8">
            {locale === "en"
              ? "Your authorized dealer in San Miguel de Allende — factory-direct pricing, sourcing, and delivery for Mexico\u2019s most discerning projects."
              : "Tu distribuidor autorizado en San Miguel de Allende — precios directos de fábrica, importación y entrega para los proyectos más exigentes de México."}
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
};

export { BrandBar };
