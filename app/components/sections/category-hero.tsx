"use client";

import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";

interface CategoryHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  productCount?: number;
  ctaLabel?: string;
  ctaHref?: string;
  imageSrc: string;
}

const CategoryHero = ({
  eyebrow,
  title,
  description,
  productCount,
  ctaLabel = "Browse Collection",
  ctaHref = "#products",
  imageSrc,
}: CategoryHeroProps) => (
  <section className="relative h-[50vh] md:h-[60vh] flex items-end overflow-hidden">
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('${imageSrc}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/15" />
    </div>

    <div className="relative z-10 w-full pb-10 md:pb-16 px-5 sm:px-8 md:px-16 max-w-5xl">
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-mono text-xs uppercase tracking-[0.2em] text-brand-copper mb-3"
      >
        {eyebrow}
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="font-display text-4xl md:text-6xl lg:text-7xl font-light text-white leading-[0.95] tracking-wide"
      >
        {title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-4 font-body text-base md:text-lg text-white/80 max-w-2xl leading-relaxed"
      >
        {description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="mt-6 flex items-center gap-6"
      >
        <Button variant="primary" size="lg" href={ctaHref}>
          {ctaLabel}
        </Button>
        {productCount !== undefined && (
          <span className="font-mono text-sm text-white/60 tracking-wider">
            {productCount} {productCount === 1 ? "product" : "products"}
          </span>
        )}
      </motion.div>
    </div>
  </section>
);

export { CategoryHero };
