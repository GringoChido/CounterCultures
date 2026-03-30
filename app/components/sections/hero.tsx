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
      en: "Smart Bathrooms",
      es: "Baños Inteligentes",
    },
    title: {
      en: "Smart\nToilets",
      es: "Sanitarios\nInteligentes",
    },
    subtitle: {
      en: "Discover a world of comfort and innovation with our exquisite collection of smart fixtures.",
      es: "Descubre un mundo de confort e innovación con nuestra exquisita colección de sanitarios.",
    },
    cta: {
      label: { en: "Explore Collection", es: "Explorar Colección" },
      href: "/shop/bathroom",
    },
    image:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80",
  },
  {
    eyebrow: {
      en: "Luxury Showers",
      es: "Regaderas de Lujo",
    },
    title: {
      en: "Shower\nSystems",
      es: "Regaderas\npara Baño",
    },
    subtitle: {
      en: "Imported shower systems crafted with advanced technology and durable materials.",
      es: "Regaderas de importación fabricadas con tecnología avanzada y materiales duraderos.",
    },
    cta: {
      label: { en: "Shop Showers", es: "Ver Regaderas" },
      href: "/shop/bathroom?sub=showers",
    },
    image:
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1920&q=80",
  },
  {
    eyebrow: {
      en: "Designer Faucets",
      es: "Grifería de Diseño",
    },
    title: {
      en: "Bathroom\nFaucets",
      es: "Grifos\npara Baño",
    },
    subtitle: {
      en: "The bathroom of your dreams awaits. Premium faucets from Brizo, Kohler, and California Faucets.",
      es: "¡El baño de tus sueños te espera! Grifos premium de Brizo, Kohler y California Faucets.",
    },
    cta: {
      label: { en: "Shop Faucets", es: "Ver Grifos" },
      href: "/shop/bathroom?sub=faucets",
    },
    image:
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1920&q=80",
  },
  {
    eyebrow: {
      en: "Artisan Hardware",
      es: "Herrajes Artesanales",
    },
    title: {
      en: "Door\nHardware",
      es: "Chapas y\nHerrajes",
    },
    subtitle: {
      en: "Find the finest locks and hardware for your doors. Sun Valley Bronze and Emtek.",
      es: "Encuentra las mejores chapas y herrajes para puertas. Sun Valley Bronze y Emtek.",
    },
    cta: {
      label: { en: "Shop Hardware", es: "Ver Herrajes" },
      href: "/shop/hardware",
    },
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80",
  },
  {
    eyebrow: {
      en: "Statement Pieces",
      es: "Piezas de Diseño",
    },
    title: {
      en: "Freestanding\nBathtubs",
      es: "Bañeras\nIndependientes",
    },
    subtitle: {
      en: "Transform your bathroom into an oasis of relaxation. Explore our collection of freestanding tubs.",
      es: "Transforma tu baño en un oasis de relajación. Explora nuestra colección de bañeras.",
    },
    cta: {
      label: { en: "Shop Bathtubs", es: "Ver Bañeras" },
      href: "/shop/bathroom?sub=bathtubs",
    },
    image:
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1920&q=80",
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
        <div className="w-full pb-16 md:pb-24 px-6 md:px-16 max-w-5xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <p className="font-mono text-sm uppercase tracking-[0.2em] text-brand-copper mb-4">
                {slide.eyebrow[lang]}
              </p>

              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-light text-white leading-[0.95] tracking-wide whitespace-pre-line">
                {slide.title[lang]}
              </h1>

              <p className="mt-6 font-body text-lg text-white/80 max-w-xl leading-relaxed">
                {slide.subtitle[lang]}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
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

      {/* Navigation arrows */}
      <div className="absolute right-6 md:right-16 bottom-16 md:bottom-24 z-20 flex items-center gap-3">
        <button
          onClick={prev}
          className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
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
