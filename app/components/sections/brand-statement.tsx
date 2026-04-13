"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";

// Option A (active) — direct, specific, geographic authority
const content = {
  en: {
    eyebrow: "San Miguel de Allende",
    headline: "Mexico's #1 Luxury Kitchen, Bath & Hardware Showroom.",
    supporting: "Based in San Miguel de Allende. Delivering nationwide.",
  },
  es: {
    eyebrow: "San Miguel de Allende",
    headline: "El Showroom #1 de Cocina, Baño y Herrajes de Lujo en México.",
    supporting: "Basados en San Miguel de Allende. Entregando en todo el país.",
  },
};

// Option B (alternate — scarcity + exclusivity angle):
// eyebrow: "The Only Showroom of Its Kind in Mexico"
// headline: "Nineteen international brands. Master Mexican artisans. One showroom."
// supporting: "San Miguel de Allende — serving Mexico's finest projects since 2004."

// Option C (alternate — question hook):
// eyebrow: "Why Counter Cultures"
// headline: "The #1 destination for luxury kitchen, bath, and hardware in Mexico."
// supporting: "In San Miguel de Allende. Sourcing and delivering to projects across the country."

const BrandStatement = ({ locale = "en" }: { locale?: string }) => {
  const t = content[locale as "en" | "es"];
  return (
    <section className="py-14 md:py-24 bg-brand-linen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection>
          <p className="font-body font-semibold text-xs uppercase tracking-[0.25em] text-brand-terracotta mb-4">
            {t.eyebrow}
          </p>
          <div className="mx-auto w-12 h-px bg-brand-terracotta mb-8" />
          <h2 className="font-display text-4xl md:text-6xl font-normal tracking-wide text-brand-charcoal leading-tight">
            {t.headline}
          </h2>
          <p className="mt-6 font-body text-lg text-brand-stone leading-relaxed">
            {t.supporting}
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
};

export { BrandStatement };
