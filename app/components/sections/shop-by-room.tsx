"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";

const categories = [
  {
    title: { en: "Bathroom Fixtures", es: "Accesorios de Baño" },
    eyebrow: { en: "Explore", es: "Explorar" },
    count: { en: "120+ curated pieces", es: "120+ piezas curadas" },
    href: "/shop/bathroom",
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
  },
  {
    title: { en: "Kitchen Fixtures", es: "Accesorios de Cocina" },
    eyebrow: { en: "Explore", es: "Explorar" },
    count: { en: "85+ curated pieces", es: "85+ piezas curadas" },
    href: "/shop/kitchen",
    image:
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
  },
  {
    title: { en: "Door & Cabinet Hardware", es: "Chapas y Herrajes" },
    eyebrow: { en: "Explore", es: "Explorar" },
    count: { en: "60+ curated pieces", es: "60+ piezas curadas" },
    href: "/shop/hardware",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
  },
];

const ShopByRoom = ({ locale: localeProp = "en" }: { locale?: string }) => {
  const locale = localeProp as "en" | "es";
  return (
  <section className="py-24 md:py-32 bg-brand-linen">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <AnimatedSection>
        <h2 className="text-center font-display text-4xl md:text-5xl font-normal tracking-wide text-brand-charcoal mb-4">
          {locale === "en" ? "Shop by Category" : "Comprar por Categoría"}
        </h2>
        <p className="text-center font-body text-brand-stone mb-12 max-w-2xl mx-auto">
          {locale === "en"
            ? "From world-class faucets and sinks to hand-forged door hardware — every piece curated for quality and design integrity."
            : "Desde grifos y lavabos de clase mundial hasta herrajes forjados a mano — cada pieza curada por calidad e integridad de diseño."}
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <AnimatedSection key={cat.href} delay={i * 0.12}>
            <Link href={cat.href} className="group block relative overflow-hidden rounded-lg">
              <div className="aspect-[4/5]">
                <motion.img
                  src={cat.image}
                  alt={cat.title[locale]}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 flex items-end justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-brand-copper">
                    {cat.eyebrow[locale]}
                  </p>
                  <h3 className="mt-1 font-display text-2xl md:text-3xl font-light text-white tracking-wide">
                    {cat.title[locale]}
                  </h3>
                  <p className="mt-1 font-body text-sm text-white/70">
                    {cat.count[locale]}
                  </p>
                </div>
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-terracotta text-white shrink-0 group-hover:bg-brand-terracotta-dark transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </AnimatedSection>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button variant="secondary" href="/shop">
          {locale === "en" ? "View All Collections" : "Ver Todas las Colecciones"}
        </Button>
      </div>
    </div>
  </section>
  );
};

export { ShopByRoom };
