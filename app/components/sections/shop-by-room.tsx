"use client";

import Link from "next/link";
import Image from "next/image";
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
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=75&auto=format",
  },
  {
    title: { en: "Kitchen Fixtures", es: "Accesorios de Cocina" },
    eyebrow: { en: "Explore", es: "Explorar" },
    count: { en: "85+ curated pieces", es: "85+ piezas curadas" },
    href: "/shop/kitchen",
    image:
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=75&auto=format",
  },
  {
    title: { en: "Door & Cabinet Hardware", es: "Chapas y Herrajes" },
    eyebrow: { en: "Explore", es: "Explorar" },
    count: { en: "60+ curated pieces", es: "60+ piezas curadas" },
    href: "/shop/hardware",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=75&auto=format",
  },
];

const ShopByRoom = ({ locale: localeProp = "en" }: { locale?: string }) => {
  const locale = localeProp as "en" | "es";
  return (
  <section className="py-14 md:py-32 bg-brand-linen">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <AnimatedSection>
        <h2 className="text-center font-display text-3xl md:text-5xl font-normal tracking-wide text-brand-charcoal mb-4">
          {locale === "en" ? "Browse Our Collection" : "Explora Nuestra Colección"}
        </h2>
        <p className="text-center font-body text-brand-stone mb-8 md:mb-12 max-w-2xl mx-auto">
          {locale === "en"
            ? "491 premium pieces across kitchen, bath & architectural hardware — from 19 authorized brands and Mexican artisans. Available for order and delivery in Mexico."
            : "491 piezas premium en cocina, baño y herrajes arquitectónicos — de 19 marcas autorizadas y artesanos mexicanos. Disponibles para pedido y entrega en México."}
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <AnimatedSection key={cat.href} delay={i * 0.12}>
            <Link href={cat.href} className="group block relative overflow-hidden rounded-lg">
              <div className="relative aspect-[4/5]">
                <Image
                  src={cat.image}
                  alt={cat.title[locale]}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 flex items-end justify-between">
                <div>
                  <p className="font-body font-semibold text-xs uppercase tracking-wider text-brand-terracotta">
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
