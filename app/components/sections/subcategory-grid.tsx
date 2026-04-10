"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import NextLink from "next/link";

interface SubcategoryCard {
  slug: string;
  label: { en: string; es: string };
  description: { en: string; es: string };
  heroImage: string;
  productCount: number;
}

interface SubcategoryGridProps {
  category: string;
  subcategories: SubcategoryCard[];
  locale: "en" | "es";
}

const DESCRIPTIONS: Record<string, Record<string, { en: string; es: string }>> = {
  bathroom: {
    sinks: {
      en: "Copper, ceramic, stone — every morning begins here",
      es: "Cobre, cerámica, piedra — cada mañana comienza aquí",
    },
    faucets: {
      en: "30+ artisan finishes, from matte black to living bronze",
      es: "Más de 30 acabados artesanales, del negro mate al bronce vivo",
    },
    bathtubs: {
      en: "Freestanding sculpture for the room you deserve",
      es: "Escultura independiente para el espacio que mereces",
    },
    "tub-fillers": {
      en: "The finishing pour for your freestanding statement",
      es: "El toque final para tu bañera de autor",
    },
    spa: {
      en: "AquaSpa hydrotherapy — from intimate soaks to grand installations",
      es: "Hidroterapia AquaSpa — desde tinas íntimas hasta grandes instalaciones",
    },
    toilets: {
      en: "TOTO WASHLET technology — the throne, reimagined",
      es: "Tecnología TOTO WASHLET — el trono, reimaginado",
    },
    showers: {
      en: "Rain heads, thermostatic systems, and exposed-pipe drama",
      es: "Regaderas de lluvia, sistemas termostáticos y drama de tubería expuesta",
    },
    accessories: {
      en: "Towel bars, hooks, and hardware in every finish imaginable",
      es: "Toalleros, ganchos y accesorios en todos los acabados imaginables",
    },
    drains: {
      en: "Because even the floor deserves good design",
      es: "Porque hasta el piso merece buen diseño",
    },
    valves: {
      en: "The precision behind the performance",
      es: "La precisión detrás del rendimiento",
    },
  },
  kitchen: {
    sinks: {
      en: "Farmhouse aprons, stainless undermounts, hammered copper",
      es: "Mandiles farmhouse, acero inoxidable, cobre martillado",
    },
    faucets: {
      en: "Bridge, pull-down, pot filler — every pour, perfected",
      es: "Puente, extraíble, llenador — cada vertido, perfeccionado",
    },
    "range-hoods": {
      en: "Teka German engineering meets your cooktop",
      es: "Ingeniería alemana Teka sobre tu estufa",
    },
    appliances: {
      en: "Bluestar ranges, SMEG ovens, Teka cooktops",
      es: "Estufas Bluestar, hornos SMEG, parrillas Teka",
    },
    "soap-dispensers": {
      en: "Deck-mounted, finish-matched, seamless",
      es: "De cubierta, acabado coordinado, impecable",
    },
    "water-dispensers": {
      en: "Instant hot and filtered — right at the point of use",
      es: "Agua caliente y filtrada al instante",
    },
    "double-sinks": {
      en: "Prep and wash, no compromise",
      es: "Prepara y lava, sin compromisos",
    },
    "pot-fillers": {
      en: "Fill at the stove — never carry a heavy pot again",
      es: "Llena en la estufa — nunca más cargues una olla pesada",
    },
  },
  hardware: {
    "door-locks": {
      en: "Sun Valley Bronze hand-cast entry sets and Emtek precision",
      es: "Cerraduras Sun Valley Bronze fundidas a mano y la precisión Emtek",
    },
    deadbolts: {
      en: "Security that matches your style",
      es: "Seguridad que combina con tu estilo",
    },
    "pulls-hooks": {
      en: "Hand-forged bronze — every handle tells a story",
      es: "Bronce forjado a mano — cada jaladera cuenta una historia",
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const SubcategoryGrid = ({ category, subcategories, locale }: SubcategoryGridProps) => {
  const descriptions = DESCRIPTIONS[category] ?? {};

  return (
    <section id="subcategories" className="py-16 md:py-24 bg-brand-linen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 md:mb-16">
          <p className="font-body text-xs uppercase tracking-[0.25em] text-brand-terracotta mb-3">
            {locale === "en" ? "Explore by Category" : "Explora por Categoría"}
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-light text-brand-charcoal">
            {locale === "en" ? "The Collection" : "La Colección"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {subcategories.map((sub, i) => {
            const desc = descriptions[sub.slug];
            return (
              <motion.div
                key={sub.slug}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={i}
              >
                <NextLink
                  href={`/${locale}/shop/${category}/${sub.slug}`}
                  className="group relative block overflow-hidden rounded-lg"
                >
                  <div className="relative w-full aspect-[4/5] overflow-hidden">
                    <Image
                      src={sub.heroImage}
                      alt={sub.label[locale]}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/80 via-brand-charcoal/30 to-transparent transition-colors duration-500 group-hover:from-brand-charcoal/70 group-hover:via-brand-charcoal/20" />

                    <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-7">
                      <span className="self-start mb-3 px-2.5 py-1 bg-white/10 backdrop-blur-sm text-white/80 font-body text-[11px] uppercase tracking-wider rounded-sm">
                        {sub.productCount} {locale === "en" ? "pieces" : "piezas"}
                      </span>
                      <h3 className="font-display text-xl md:text-2xl font-light text-white">
                        <span className="relative">
                          {sub.label[locale]}
                          <span className="absolute -bottom-1 left-0 w-0 h-px bg-brand-terracotta transition-all duration-500 ease-out group-hover:w-full" />
                        </span>
                      </h3>
                      {desc && (
                        <p className="font-body text-xs md:text-sm text-white/70 mt-2 leading-relaxed">
                          {desc[locale]}
                        </p>
                      )}
                    </div>
                  </div>
                </NextLink>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export { SubcategoryGrid };
