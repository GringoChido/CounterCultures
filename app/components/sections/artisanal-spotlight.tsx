"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";

const t = {
  en: {
    badge: "Only at Counter Cultures",
    title1: "Handcrafted in Mexico.",
    title2: "One Piece at a Time.",
    paragraph: "Every artisan piece in our collection is made by hand in workshops across Mexico \u2014 copper basins hammered in Santa Clara del Cobre, volcanic stone carved in Quer\u00e9taro, Mistoa ceramics shaped in Guanajuato. No two pieces are identical. Each one carries the fingerprint of its maker.",
    explore: "Explore Artisanal Collection",
    commission: "Commission a Custom Piece",
  },
  es: {
    badge: "Solo en Counter Cultures",
    title1: "Hecho a Mano en M\u00e9xico.",
    title2: "Una Pieza a la Vez.",
    paragraph: "Cada pieza artesanal de nuestra colecci\u00f3n est\u00e1 hecha a mano en talleres de M\u00e9xico \u2014 lavabos de cobre martillados en Santa Clara del Cobre, piedra volc\u00e1nica tallada en Quer\u00e9taro, cer\u00e1mica Mistoa moldeada en Guanajuato. No hay dos piezas iguales. Cada una lleva la huella de su creador.",
    explore: "Explorar Colecci\u00f3n Artesanal",
    commission: "Encargar una Pieza Personalizada",
  },
};

const ArtisanalSpotlight = ({ locale = "en" }: { locale?: string }) => {
  const c = t[locale as "en" | "es"];
  return (
  <section className="bg-brand-charcoal py-14 md:py-32">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            {c.badge}
          </span>
          <h2 className="mt-6 font-display text-4xl md:text-5xl font-light text-white tracking-wide leading-tight">
            {c.title1}
            <br />
            <span className="italic">{c.title2}</span>
          </h2>
          <p className="mt-6 font-body text-base text-white/80 leading-relaxed">
            {c.paragraph}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button variant="primary" href="/artisanal">
              {c.explore}
            </Button>
            <Button variant="ghost" href="/contact?type=commission" className="text-white hover:text-brand-copper">
              {c.commission}
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
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&q=75&auto=format"
                alt="Hand-hammered copper basin from Santa Clara del Cobre"
                fill
                sizes="(max-width: 1024px) 50vw, 280px"
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=75&auto=format"
                alt="Artisanal ceramic sink handcrafted in Guanajuato"
                fill
                sizes="(max-width: 1024px) 50vw, 280px"
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="relative col-span-2 aspect-[16/9] rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=75&auto=format"
                alt="Mexican artisan workshop where Counter Cultures fixtures are crafted"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
  );
};

export { ArtisanalSpotlight };
