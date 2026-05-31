"use client";

import Image from "next/image";
import { Link } from "@/app/i18n/navigation";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { artisans } from "@/app/lib/artisan-data";
export type { ArtisanProfile } from "@/app/lib/artisan-data";
export { artisans } from "@/app/lib/artisan-data";

type Locale = "en" | "es";

const T = {
  eyebrow: { en: "The Makers", es: "Los Creadores" },
  title: {
    en: "Four workshops behind the catalog",
    es: "Cuatro talleres detrás del catálogo",
  },
  description: {
    en: "These are the hands. The kilns, the foundries, the chisels, the hammers. Each piece in our artisanal collection passes through one of these workshops before it reaches a Counter Cultures project.",
    es: "Estas son las manos. Los hornos, las fundiciones, los cinceles, los martillos. Cada pieza de nuestra colección artesanal pasa por uno de estos talleres antes de llegar a un proyecto Counter Cultures.",
  },
};

export const ArtisanProfiles = ({ locale }: { locale: Locale }) => (
  <section id="artisans" className="scroll-mt-24 py-12 md:py-24 bg-brand-sand/30">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <AnimatedSection>
        <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
          {T.eyebrow[locale]}
        </span>
        <h2 className="mt-4 font-display text-3xl md:text-4xl font-light tracking-wide text-brand-charcoal">
          {T.title[locale]}
        </h2>
        <p className="mt-4 font-body text-base text-dash-text-secondary max-w-2xl leading-relaxed">
          {T.description[locale]}
        </p>
      </AnimatedSection>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {artisans.map((artisan) => (
          <AnimatedSection key={artisan.name}>
            <Link href={artisan.href} className="group block cursor-pointer transition-transform duration-300 hover:-translate-y-0.5">
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-brand-stone/10">
                <Image
                  src={artisan.image}
                  alt={`${artisan.name} — ${artisan.craft[locale]}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-4 font-display text-xl text-brand-charcoal">
                {artisan.name}
              </h3>
              <p className="mt-1 font-body font-semibold text-xs tracking-wider text-brand-terracotta uppercase">
                {artisan.craft[locale]}
              </p>
              <p className="mt-2 font-body text-sm leading-relaxed text-dash-text-secondary">
                {artisan.detail[locale]}
              </p>
            </Link>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);
