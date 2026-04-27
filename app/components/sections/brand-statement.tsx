"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";

const content = {
  en: {
    eyebrow: "San Miguel de Allende",
    headline: "The destination for premium kitchen, bath, and hardware in Mexico.",
    supporting: "International brands. Mexican artisans. One showroom — delivering nationwide.",
  },
  es: {
    eyebrow: "San Miguel de Allende",
    headline: "El destino de cocina, baño y herrajes de lujo en México.",
    supporting: "Marcas internacionales. Artesanos mexicanos. Un solo showroom — entrega en todo el país.",
  },
};

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
