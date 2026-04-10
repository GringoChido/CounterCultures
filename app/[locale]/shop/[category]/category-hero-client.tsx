"use client";

import { motion } from "framer-motion";

interface CategoryCinematicHeroProps {
  eyebrow: string;
  title: string;
  body: string;
  productCount: number;
  brandCount: number;
  locale: "en" | "es";
}

const CategoryCinematicHero = ({
  eyebrow,
  title,
  body,
  productCount,
  brandCount,
  locale,
}: CategoryCinematicHeroProps) => {
  const scrollToGrid = () => {
    document.getElementById("subcategories")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative z-10 w-full pb-12 md:pb-20 lg:pb-24 px-5 sm:px-8 md:px-16 max-w-5xl">
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="font-body font-semibold text-xs uppercase tracking-[0.25em] text-brand-terracotta mb-4"
      >
        {eyebrow}
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="font-display text-5xl sm:text-6xl md:text-8xl font-light text-white leading-[0.9] tracking-wide"
      >
        {title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45 }}
        className="mt-6 font-body text-base md:text-lg text-white/80 max-w-2xl leading-relaxed"
      >
        {body}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="mt-6 flex items-center gap-4"
      >
        <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white/80 font-body text-xs tracking-wider">
          {productCount} {locale === "en" ? "Curated Pieces" : "Piezas Curadas"} · {brandCount} {locale === "en" ? "Premium Brands" : "Marcas Premium"}
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.75 }}
        className="mt-8"
      >
        <button
          onClick={scrollToGrid}
          className="group inline-flex items-center gap-3 font-body text-sm font-medium text-white tracking-wider uppercase cursor-pointer"
        >
          <span className="relative">
            {locale === "en" ? "Explore the Collection" : "Explora la Colección"}
            <span className="absolute -bottom-0.5 left-0 w-full h-px bg-brand-terracotta/60 transition-colors duration-300 group-hover:bg-brand-terracotta" />
          </span>
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
};

export { CategoryCinematicHero };
