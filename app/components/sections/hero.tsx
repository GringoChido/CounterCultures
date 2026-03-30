"use client";

import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";

const Hero = () => (
  <section className="relative h-screen flex items-end overflow-hidden">
    {/* Background image — fixture-focused */}
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/10" />
    </div>

    {/* Content — bottom-left aligned */}
    <div className="relative z-10 w-full pb-16 md:pb-24 px-6 md:px-16 max-w-5xl">
      <motion.p
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="font-mono text-sm uppercase tracking-[0.2em] text-brand-copper mb-4"
      >
        Est. 2004 · San Miguel de Allende
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="font-display text-5xl md:text-7xl lg:text-8xl font-light text-white leading-[0.95] tracking-wide"
      >
        Kohler. TOTO. Brizo.
        <br />
        <span className="italic">And the Artisan</span>
        <br />
        Down the Street.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="mt-6 font-body text-lg text-white/80 max-w-xl leading-relaxed"
      >
        Premium bath and kitchen fixtures from the world&apos;s finest makers — alongside
        one-of-a-kind pieces handcrafted by Mexico&apos;s master artisans. Curated in
        San Miguel de Allende since 2004.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
        className="mt-8 flex flex-col sm:flex-row items-start gap-4"
      >
        <Button variant="primary" size="lg" href="/shop">
          Explore the Collection
        </Button>
        <Button variant="ghost" size="lg" href="/showroom" className="text-white hover:text-brand-copper">
          Visit Our Showroom
        </Button>
      </motion.div>
    </div>
  </section>
);

export { Hero };
