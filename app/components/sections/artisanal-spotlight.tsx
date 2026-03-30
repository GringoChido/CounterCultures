"use client";

import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";

const ArtisanalSpotlight = () => (
  <section className="bg-brand-charcoal py-24 md:py-32">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {/* Text — left column */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-5"
        >
          <span className="inline-block bg-brand-copper text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm">
            Only at Counter Cultures
          </span>
          <h2 className="mt-6 font-display text-4xl md:text-5xl font-light text-white tracking-wide leading-tight">
            Handcrafted in Mexico.
            <br />
            <span className="italic">One Piece at a Time.</span>
          </h2>
          <p className="mt-6 font-body text-base text-white/80 leading-relaxed">
            Every artisan piece in our collection is made by hand in workshops
            across Mexico — copper basins hammered in Santa Clara del Cobre,
            volcanic stone carved in Querétaro, Mistoa ceramics shaped in
            Guanajuato. No two pieces are identical. Each one carries the
            fingerprint of its maker.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button variant="primary" href="/artisanal">
              Explore Artisanal Collection
            </Button>
            <Button variant="ghost" href="/contact?type=commission" className="text-white hover:text-brand-copper">
              Commission a Custom Piece
            </Button>
          </div>
        </motion.div>

        {/* Images — right column */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-7"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[4/5] rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&q=80"
                alt="Hand-hammered copper basin"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="aspect-[4/5] rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80"
                alt="Artisanal ceramic sink"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="col-span-2 aspect-[16/9] rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80"
                alt="Artisan workshop"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export { ArtisanalSpotlight };
