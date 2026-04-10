"use client";

import { motion } from "framer-motion";
import NextLink from "next/link";

interface BrandRibbonProps {
  brands: { name: string; slug: string }[];
  locale: "en" | "es";
}

const BrandRibbon = ({ brands, locale }: BrandRibbonProps) => {
  if (brands.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-brand-linen border-t border-brand-stone/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-body text-xs uppercase tracking-[0.25em] text-brand-stone/60 mb-8 text-center"
        >
          {locale === "en" ? "Trusted Brands" : "Marcas de Confianza"}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-wrap justify-center gap-x-8 md:gap-x-12 gap-y-4"
        >
          {brands.map((brand) => (
            <NextLink
              key={brand.slug}
              href={`/${locale}/brands/${brand.slug}`}
              className="font-display text-lg md:text-xl text-brand-stone/50 hover:text-brand-charcoal transition-colors duration-300"
            >
              {brand.name}
            </NextLink>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export { BrandRibbon };
