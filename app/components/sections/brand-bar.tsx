"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";

const brands = [
  { name: "Kohler", slug: "kohler" },
  { name: "TOTO", slug: "toto" },
  { name: "Brizo", slug: "brizo" },
  { name: "BLANCO", slug: "blanco" },
  { name: "California Faucets", slug: "california-faucets" },
];

const BrandBar = () => (
  <section className="bg-brand-charcoal py-16">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <AnimatedSection>
        <p className="text-center font-mono text-xs tracking-[0.25em] text-brand-copper uppercase mb-8">
          Authorized Dealer
        </p>
        <div className="flex flex-wrap items-center justify-center gap-0">
          {brands.map((brand, i) => (
            <a
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className={`flex items-center justify-center px-8 md:px-12 py-4 font-display text-xl md:text-2xl text-white tracking-wider hover:text-brand-copper transition-colors duration-300 ${
                i < brands.length - 1 ? "border-r border-white/20" : ""
              }`}
            >
              {brand.name}
            </a>
          ))}
        </div>
        <p className="text-center font-body text-sm text-white/60 mt-8">
          Factory-authorized sales, service, and installation support for Mexico&apos;s most discerning projects.
        </p>
      </AnimatedSection>
    </div>
  </section>
);

export { BrandBar };
