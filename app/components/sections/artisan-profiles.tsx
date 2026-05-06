"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";

type Locale = "en" | "es";

interface ArtisanProfile {
  name: string;
  craft: { en: string; es: string };
  description: { en: string; es: string };
  image: string;
}

const artisans: ArtisanProfile[] = [
  {
    name: "Don Miguel Hernández",
    craft: {
      en: "Copper Basin Artisan · Santa Clara del Cobre",
      es: "Artesano de Lavabos de Cobre · Santa Clara del Cobre",
    },
    description: {
      en: "Third-generation coppersmith. Each of Don Miguel's basins is hand-hammered from a single sheet of copper — no seams, no molds, no shortcuts.",
      es: "Maestro del cobre, tercera generación. Cada lavabo de Don Miguel se martilla a mano desde una sola lámina de cobre — sin uniones, sin moldes, sin atajos.",
    },
    image: "/Assets/Santa Clara del Cobre.webp",
  },
  {
    name: "Maestra Elena Ruiz",
    craft: {
      en: "Ceramic Artist · Dolores Hidalgo",
      es: "Artista de Cerámica · Dolores Hidalgo",
    },
    description: {
      en: "Elena's hand-painted ceramic sinks draw from centuries of Talavera tradition, reinterpreted with contemporary forms and a restrained palette.",
      es: "Los lavabos de cerámica pintados a mano de Elena se inspiran en siglos de tradición talavera, reinterpretados con formas contemporáneas y una paleta sobria.",
    },
    image: "/Assets/Mistoa Studio.webp",
  },
  {
    name: "Taller Piedra Viva",
    craft: {
      en: "Stone Carvers · Querétaro",
      es: "Talladores de Piedra · Querétaro",
    },
    description: {
      en: "A collective of stone carvers working in cantera rosa and volcanic basalt. Their vessel sinks and countertops bring the raw beauty of Mexican geology indoors.",
      es: "Un colectivo de talladores que trabajan en cantera rosa y basalto volcánico. Sus lavabos y cubiertas traen la belleza cruda de la geología mexicana al interior.",
    },
    image: "/Assets/Stone Artisans.webp",
  },
];

const T = {
  eyebrow: { en: "The Artisans", es: "Los Artesanos" },
  title: {
    en: "Masters of Their Craft",
    es: "Maestros de Su Oficio",
  },
  description: {
    en: "Behind every artisanal piece is a maker with decades of tradition in their hands. These are some of the artisans who make Counter Cultures possible.",
    es: "Detrás de cada pieza artesanal hay un creador con décadas de tradición en sus manos. Estos son algunos de los artesanos que hacen posible Counter Cultures.",
  },
};

export const ArtisanProfiles = ({ locale }: { locale: Locale }) => (
  <section className="py-12 md:py-24 bg-brand-sand/30">
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

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {artisans.map((artisan) => (
          <AnimatedSection key={artisan.name}>
            <div className="group">
              <div className="aspect-[4/5] rounded-lg overflow-hidden bg-brand-stone/10">
                <div
                  className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('${artisan.image}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </div>
              <h3 className="mt-4 font-display text-xl text-brand-charcoal">
                {artisan.name}
              </h3>
              <p className="mt-1 font-body font-semibold text-xs tracking-wider text-brand-terracotta uppercase">
                {artisan.craft[locale]}
              </p>
              <p className="mt-3 font-body text-sm text-dash-text-secondary leading-relaxed">
                {artisan.description[locale]}
              </p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);
