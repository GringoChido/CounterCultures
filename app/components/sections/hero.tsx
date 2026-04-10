"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeroSlide {
  eyebrow: { en: string; es: string };
  title: { en: string; es: string };
  subtitle: { en: string; es: string };
  cta: { label: { en: string; es: string }; href: string };
  image: string;
}

const slides: HeroSlide[] = [
  {
    eyebrow: {
      en: "San Miguel de Allende's Premier Showroom",
      es: "El Showroom Premier de San Miguel de Allende",
    },
    title: {
      en: "Premium Kitchen,\nBath & Hardware",
      es: "Cocina, Baño y\nHerrajes Premium",
    },
    subtitle: {
      en: "Authorized dealer for 19 international brands and Mexican artisans. 491 curated pieces — sourced worldwide, delivered to your project in Mexico.",
      es: "Distribuidor autorizado de 19 marcas internacionales y artesanos mexicanos. 491 piezas curadas — importadas del mundo, entregadas en tu proyecto en México.",
    },
    cta: {
      label: { en: "Explore the Collection", es: "Explorar la Colección" },
      href: "#browse",
    },
    image: "/images/hero/smart-toilet.webp",
  },
  {
    eyebrow: {
      en: "Authorized Dealer — Kohler, TOTO & More",
      es: "Distribuidor Autorizado — Kohler, TOTO y Más",
    },
    title: {
      en: "Smart\nToilets",
      es: "Sanitarios\nInteligentes",
    },
    subtitle: {
      en: "Counter Cultures is the authorized TOTO and Kohler dealer in San Miguel de Allende. Smart toilets and bidets — sourced direct, delivered to your project.",
      es: "Counter Cultures es el distribuidor autorizado de TOTO y Kohler en San Miguel de Allende. Sanitarios inteligentes y bidés — importados directo, entregados en tu proyecto.",
    },
    cta: {
      label: { en: "Shop Smart Toilets", es: "Ver Sanitarios Inteligentes" },
      href: "/shop/bathroom",
    },
    image: "/images/hero/shower-system.webp",
  },
  {
    eyebrow: {
      en: "Authorized Brizo & California Faucets Dealer",
      es: "Distribuidor Autorizado de Brizo y California Faucets",
    },
    title: {
      en: "Designer\nFaucets",
      es: "Grifería\nde Diseño",
    },
    subtitle: {
      en: "Premium faucets from Brizo, Kohler, and California Faucets — available at our San Miguel de Allende showroom. We order direct from the factory and deliver to you.",
      es: "Grifería premium de Brizo, Kohler y California Faucets — disponible en nuestro showroom en San Miguel de Allende. Pedimos directo de fábrica y te lo entregamos.",
    },
    cta: {
      label: { en: "Shop Faucets", es: "Ver Grifería" },
      href: "/shop/bathroom?sub=faucets",
    },
    image: "/images/hero/faucets.webp",
  },
  {
    eyebrow: {
      en: "Sun Valley Bronze & Emtek — Authorized Dealer",
      es: "Sun Valley Bronze y Emtek — Distribuidor Autorizado",
    },
    title: {
      en: "Architectural\nHardware",
      es: "Herrajes\nArquitectónicos",
    },
    subtitle: {
      en: "Hand-cast bronze entry sets and precision door hardware — curated for Mexico's finest homes. Only at Counter Cultures, San Miguel de Allende.",
      es: "Chapas de bronce fundidas a mano y herrajes de precisión — curados para las mejores casas de México. Solo en Counter Cultures, San Miguel de Allende.",
    },
    cta: {
      label: { en: "Shop Hardware", es: "Ver Herrajes" },
      href: "/shop/hardware",
    },
    image: "/images/hero/door-hardware.webp",
  },
  {
    eyebrow: {
      en: "International Precision Meets Mexican Soul",
      es: "Precisión Internacional con Alma Mexicana",
    },
    title: {
      en: "Freestanding\nBathtubs",
      es: "Bañeras\nIndependientes",
    },
    subtitle: {
      en: "From Badeloft soaking tubs to hand-hammered copper basins by Mexican artisans — Counter Cultures brings the world's best to San Miguel de Allende.",
      es: "Desde tinas Badeloft hasta lavabos de cobre martillado por artesanos mexicanos — Counter Cultures trae lo mejor del mundo a San Miguel de Allende.",
    },
    cta: {
      label: { en: "Shop Bathtubs", es: "Ver Bañeras" },
      href: "/shop/bathroom?sub=bathtubs",
    },
    image: "/images/hero/bathtub.webp",
  },
];

const INTERVAL = 6000;

const Hero = ({ locale = "en" }: { locale?: string }) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];
  const lang = locale as "en" | "es";

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background images */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('${slide.image}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/30 to-black/10" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex items-end">
        <div className="w-full pb-20 md:pb-28 px-5 sm:px-8 md:px-16 max-w-5xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <p className="font-body font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] text-brand-terracotta mb-3 md:mb-4">
                {slide.eyebrow[lang]}
              </p>

              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light text-white leading-[0.95] tracking-wide whitespace-pre-line">
                {slide.title[lang]}
              </h1>

              <p className="mt-4 md:mt-6 font-body text-base md:text-lg text-white/80 max-w-xl leading-relaxed">
                {slide.subtitle[lang]}
              </p>

              <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-start gap-3 md:gap-4">
                <Button variant="primary" size="lg" href={slide.cta.href}>
                  {slide.cta.label[lang]}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  href="/showroom"
                  className="text-white hover:text-brand-copper"
                >
                  {lang === "en" ? "Visit Our Showroom" : "Visitar Showroom"}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation arrows — hidden on small screens to avoid overlap */}
      <div className="hidden sm:flex absolute right-6 md:right-16 bottom-16 md:bottom-24 z-20 items-center gap-3">
        <button
          onClick={prev}
          className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === current
                ? "w-8 bg-brand-copper"
                : "w-1.5 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/10">
        <motion.div
          key={current}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: INTERVAL / 1000, ease: "linear" }}
          className="h-full bg-brand-copper"
        />
      </div>
    </section>
  );
};

export { Hero };
