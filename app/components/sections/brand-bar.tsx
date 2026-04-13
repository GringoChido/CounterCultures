"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";
import { ShieldCheck, Package, Wrench, Truck } from "lucide-react";

// TODO: Replace text names with logo SVGs once assets are sourced from brand partners.
// Logo folder: /public/Assets/BRANDS/ (create when ready)

const brandGroups = {
  en: [
    {
      label: "Bath",
      brands: [
        { name: "Kohler", slug: "kohler" },
        { name: "TOTO", slug: "toto" },
        { name: "Brizo", slug: "brizo" },
        { name: "Badeloft", slug: "badeloft" },
        { name: "ROHL", slug: "rohl" },
      ],
    },
    {
      label: "Kitchen",
      brands: [
        { name: "BLANCO", slug: "blanco" },
        { name: "SMEG", slug: "smeg" },
        { name: "California Faucets", slug: "california-faucets" },
      ],
    },
    {
      label: "Hardware",
      brands: [
        { name: "Emtek", slug: "emtek" },
        { name: "Sun Valley Bronze", slug: "sun-valley-bronze" },
      ],
    },
  ],
  es: [
    {
      label: "Baño",
      brands: [
        { name: "Kohler", slug: "kohler" },
        { name: "TOTO", slug: "toto" },
        { name: "Brizo", slug: "brizo" },
        { name: "Badeloft", slug: "badeloft" },
        { name: "ROHL", slug: "rohl" },
      ],
    },
    {
      label: "Cocina",
      brands: [
        { name: "BLANCO", slug: "blanco" },
        { name: "SMEG", slug: "smeg" },
        { name: "California Faucets", slug: "california-faucets" },
      ],
    },
    {
      label: "Herrajes",
      brands: [
        { name: "Emtek", slug: "emtek" },
        { name: "Sun Valley Bronze", slug: "sun-valley-bronze" },
      ],
    },
  ],
};

const content = {
  en: {
    eyebrow: "Authorized Dealer",
    headline: "The World's Best, Under One Roof.",
    supporting:
      "We partner with 19 of the most respected kitchen, bath, and hardware brands on the planet — plus a hand-picked network of Mexican master artisans. Every product is authenticated, warranty-backed, and sourced direct from the factory.",
    ctaText: "See all 19 authorized brands →",
  },
  es: {
    eyebrow: "Distribuidor Autorizado",
    headline: "Lo Mejor del Mundo, Bajo un Mismo Techo.",
    supporting:
      "Trabajamos con 19 de las marcas de cocina, baño y herrajes más respetadas del mundo — además de una red selecta de maestros artesanos mexicanos. Cada producto es auténtico, con garantía de fábrica e importado directo.",
    ctaText: "Ver las 19 marcas autorizadas →",
  },
};

const trustSignals = {
  en: [
    { icon: ShieldCheck, label: "Authentic & warranty-backed" },
    { icon: Package, label: "Factory-direct pricing" },
    { icon: Wrench, label: "Specification support" },
    { icon: Truck, label: "Delivery across Mexico" },
  ],
  es: [
    { icon: ShieldCheck, label: "Auténtico y con garantía" },
    { icon: Package, label: "Precios directo de fábrica" },
    { icon: Wrench, label: "Soporte de especificación" },
    { icon: Truck, label: "Entrega en todo México" },
  ],
};

const BrandBar = ({ locale = "en" }: { locale?: string }) => {
  const lang = locale === "es" ? "es" : "en";
  const t = content[lang];
  const groups = brandGroups[lang];
  const trust = trustSignals[lang];

  return (
    <section className="bg-brand-charcoal py-16 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <AnimatedSection>
          <p className="text-center font-body font-semibold text-xs tracking-[0.25em] text-brand-terracotta uppercase mb-4">
            {t.eyebrow}
          </p>
          <h2 className="text-center font-display text-3xl md:text-5xl font-normal tracking-wide text-white leading-tight">
            {t.headline}
          </h2>
          <p className="mt-4 text-center font-body text-base text-white/70 leading-relaxed max-w-3xl mx-auto">
            {t.supporting}
          </p>
        </AnimatedSection>

        {/* Brand groups */}
        <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 md:divide-x md:divide-white/10">
          {groups.map((group, gi) => (
            <AnimatedSection key={group.label} delay={gi * 0.12}>
              <div className="flex flex-col items-center px-4 md:px-8">
                <span className="font-body font-semibold text-[10px] uppercase tracking-[0.3em] text-brand-terracotta mb-6">
                  {group.label}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                  {group.brands.map((brand) => (
                    <a
                      key={brand.slug}
                      href={`/${lang}/brands/${brand.slug}`}
                      className="font-display text-lg md:text-2xl text-white tracking-wider hover:text-brand-copper transition-colors duration-300"
                    >
                      {brand.name}
                    </a>
                  ))}
                </div>
              </div>
              {gi < groups.length - 1 && (
                <div className="mt-10 md:hidden h-px w-24 mx-auto bg-white/10" />
              )}
            </AnimatedSection>
          ))}
        </div>

        {/* Trust bar */}
        <AnimatedSection delay={0.4}>
          <div className="mt-16 md:mt-20 pt-10 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
              {trust.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center text-center gap-3"
                >
                  <item.icon className="w-6 h-6 text-brand-terracotta" />
                  <span className="font-body text-sm text-white/80">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* CTA link */}
        <AnimatedSection delay={0.5}>
          <div className="mt-10 text-center">
            <a
              href={`/${lang}/brands`}
              className="font-body text-sm text-brand-terracotta hover:text-brand-copper transition-colors duration-300"
            >
              {t.ctaText}
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export { BrandBar };
