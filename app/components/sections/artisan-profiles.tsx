"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";

type Locale = "en" | "es";

interface ArtisanProfile {
  name: string;
  craft: { en: string; es: string };
  image: string;
}

const artisans: ArtisanProfile[] = [
  {
    name: "Mistoa",
    craft: {
      en: "Ceramic and concrete basins",
      es: "Lavabos de cerámica y concreto",
    },
    image: "/Assets/Mistoa Studio.webp",
  },
  {
    name: "Castro",
    craft: {
      en: "Copper and brass",
      es: "Cobre y latón",
    },
    image: "/Assets/Santa Clara del Cobre.webp",
  },
  {
    name: "Familia Meza",
    craft: {
      en: "Stone",
      es: "Piedra",
    },
    image: "/Assets/Stone Artisans.webp",
  },
  {
    name: "Manriquez",
    craft: {
      en: "Cast bronze pulls and accessories",
      es: "Jaladeras y accesorios de bronce fundido",
    },
    image: "/products/odoo/2045767.jpg",
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

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
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
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);
