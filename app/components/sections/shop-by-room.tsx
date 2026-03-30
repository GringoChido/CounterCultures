"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";

const categories = [
  {
    title: "Bathroom Fixtures",
    eyebrow: "Explore",
    count: "120+ curated pieces",
    href: "/shop/bathroom",
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
  },
  {
    title: "Kitchen Fixtures",
    eyebrow: "Explore",
    count: "85+ curated pieces",
    href: "/shop/kitchen",
    image:
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
  },
  {
    title: "Door & Cabinet Hardware",
    eyebrow: "Explore",
    count: "60+ curated pieces",
    href: "/shop/hardware",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
  },
];

const ShopByRoom = () => (
  <section className="py-24 md:py-32 bg-brand-linen">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <AnimatedSection>
        <h2 className="text-center font-display text-4xl md:text-5xl font-normal tracking-wide text-brand-charcoal mb-4">
          Shop by Category
        </h2>
        <p className="text-center font-body text-brand-stone mb-12 max-w-2xl mx-auto">
          From world-class faucets and sinks to hand-forged door hardware — every piece curated for quality and design integrity.
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <AnimatedSection key={cat.href} delay={i * 0.12}>
            <Link href={cat.href} className="group block relative overflow-hidden rounded-lg">
              <div className="aspect-[4/5]">
                <motion.img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 flex items-end justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-brand-copper">
                    {cat.eyebrow}
                  </p>
                  <h3 className="mt-1 font-display text-2xl md:text-3xl font-light text-white tracking-wide">
                    {cat.title}
                  </h3>
                  <p className="mt-1 font-body text-sm text-white/70">
                    {cat.count}
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
          View All Collections
        </Button>
      </div>
    </div>
  </section>
);

export { ShopByRoom };
