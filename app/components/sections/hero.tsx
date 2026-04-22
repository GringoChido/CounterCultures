"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface HeroSlide {
  eyebrow: { en: string; es: string };
  title: { en: string; es: string };
  subtitle: { en: string; es: string };
  cta: { label: { en: string; es: string }; href: string };
  image: string;
}

// Hero slides: 4 strategic slides — lifestyle hook, bathroom, kitchen, hardware
const slides: HeroSlide[] = [
  {
    eyebrow: {
      en: "San Miguel de Allende's Premier Showroom",
      es: "El Showroom Premier de San Miguel de Allende",
    },
    title: {
      en: "Where Design\nMeets Craft",
      es: "Donde el Diseño\nEncuentra el Oficio",
    },
    subtitle: {
      en: "19 international brands. Mexican artisan makers. One showroom.",
      es: "19 marcas internacionales. Artesanos mexicanos. Un showroom.",
    },
    cta: {
      label: { en: "Explore the Collection", es: "Explorar la Colección" },
      href: "#browse",
    },
    image: "/images/hero/bathtub.webp",
  },
  {
    eyebrow: {
      en: "Kohler · TOTO · Brizo · Badeloft",
      es: "Kohler · TOTO · Brizo · Badeloft",
    },
    title: {
      en: "Luxury\nBathroom",
      es: "Baño de\nLujo",
    },
    subtitle: {
      en: "Smart toilets, soaking tubs, rain showers — sourced direct, delivered to your project.",
      es: "Sanitarios inteligentes, tinas, regaderas — importados directo, entregados en tu proyecto.",
    },
    cta: {
      label: { en: "Shop Bathroom", es: "Ver Baño" },
      href: "/shop/bathroom",
    },
    image: "/images/hero/lux-bathroom.webp",
  },
  {
    eyebrow: {
      en: "BLANCO · Teka · SMEG · BlueStar",
      es: "BLANCO · Teka · SMEG · BlueStar",
    },
    title: {
      en: "Professional\nKitchen",
      es: "Cocina\nProfesional",
    },
    subtitle: {
      en: "European appliances and artisan sinks for kitchens built to perform.",
      es: "Electrodomésticos europeos y tarjas artesanales para cocinas de alto rendimiento.",
    },
    cta: {
      label: { en: "Shop Kitchen", es: "Ver Cocina" },
      href: "/shop/kitchen",
    },
    image: "/images/hero/kitchen.webp",
  },
  {
    eyebrow: {
      en: "Sun Valley Bronze · Emtek · Baldwin",
      es: "Sun Valley Bronze · Emtek · Baldwin",
    },
    title: {
      en: "Architectural\nHardware",
      es: "Herrajes\nArquitectónicos",
    },
    subtitle: {
      en: "Hand-cast bronze entry sets and precision hardware for Mexico's finest homes.",
      es: "Chapas de bronce fundidas a mano y herrajes de precisión para las mejores casas de México.",
    },
    cta: {
      label: { en: "Shop Hardware", es: "Ver Herrajes" },
      href: "/shop/hardware",
    },
    image: "/images/hero/door-hardware.webp",
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
          <Image
            src={slide.image}
            alt={slide.title[lang]}
            fill
            priority={current === 0}
            sizes="100vw"
            className="object-cover"
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
