"use client";

import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CategoryHero } from "@/app/components/sections/category-hero";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { SITE_CONFIG } from "@/app/lib/constants";

const timeline = [
  {
    year: "2004",
    title: "The Beginning",
    description:
      "Roger Williams opens a small showroom on a quiet street in San Miguel de Allende, stocking a handful of imported fixtures alongside pieces from local artisans.",
  },
  {
    year: "2008",
    title: "First Major Brand",
    description:
      "Counter Cultures becomes an authorized Kohler dealer — one of the first in central Mexico — bridging the gap between international quality and local availability.",
  },
  {
    year: "2012",
    title: "The Artisanal Program",
    description:
      "Roger formalizes partnerships with copper, stone, and ceramic artisans across Guanajuato, creating the Counter Cultures Artisanal Collection.",
  },
  {
    year: "2016",
    title: "TOTO, Brizo & Beyond",
    description:
      "The showroom expands to include TOTO, Brizo, BLANCO, California Faucets, and Sun Valley Bronze — becoming the most complete fixture destination in Mexico's colonial heartland.",
  },
  {
    year: "2020",
    title: "Trade Program Launch",
    description:
      "Counter Cultures launches its Trade Program, offering architects, designers, and builders dedicated pricing, specification support, and priority fulfillment.",
  },
  {
    year: "2024",
    title: "20 Years & Growing",
    description:
      "Two decades in, Counter Cultures has furnished thousands of homes, hotels, and restaurants — still curating where world-class design meets the soul of Mexican craft.",
  },
];

export const OurStoryContent = () => {
  const locale = useLocale() as "en" | "es";

  return (
  <>
    <Header locale={locale} />
    <main>
      <CategoryHero
        eyebrow="Our Story"
        title="Where Two Worlds Meet"
        description="For 20 years, Counter Cultures has been the bridge between the world's finest fixture manufacturers and Mexico's master artisans."
        imageSrc="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=75&auto=format"
        ctaLabel="Visit the Showroom"
        ctaHref="/showroom"
      />

      {/* Founder Section */}
      <section className="py-12 md:py-28 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <AnimatedSection>
              <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                The Founder
              </span>
              <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
                Roger Williams
              </h2>
              <div className="mt-6 space-y-5 font-body text-base text-brand-stone leading-relaxed">
                <p>
                  Roger arrived in San Miguel de Allende in the early 2000s with a
                  background in construction and an eye for detail. What he found
                  was a city full of stunning architecture — and almost nowhere to
                  source the fixtures those buildings deserved.
                </p>
                <p>
                  He started Counter Cultures to solve that problem: a showroom
                  where an architect could spec a TOTO Washlet for a guest bath,
                  a BLANCO Silgranit for the kitchen, and then walk next door to
                  commission a hand-hammered copper basin from a third-generation
                  coppersmith. No other showroom in Mexico offered that range.
                </p>
                <p>
                  Twenty years later, the mission hasn&apos;t changed. Counter
                  Cultures remains the only place in the region where world-class
                  engineering and artisanal soul sit side by side — because Roger
                  still believes the best spaces need both.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="aspect-[4/5] rounded-lg overflow-hidden bg-brand-stone/10">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=75&auto=format')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-12 md:py-28 bg-brand-charcoal">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
              20 Years in the Making
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-white">
              Our Timeline
            </h2>
          </AnimatedSection>

          <div className="mt-16 space-y-0">
            {timeline.map((item, i) => (
              <AnimatedSection key={item.year} delay={i * 0.1}>
                <div className="flex gap-5 md:gap-12 py-6 md:py-8 border-t border-white/10">
                  <span className="font-mono text-xl md:text-3xl text-brand-copper font-medium shrink-0 w-16 md:w-24">
                    {item.year}
                  </span>
                  <div>
                    <h3 className="font-display text-xl md:text-2xl text-white font-light">
                      {item.title}
                    </h3>
                    <p className="mt-2 font-body text-sm md:text-base text-white/60 leading-relaxed max-w-xl">
                      {item.description}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Artisan Profiles */}
      <section className="py-12 md:py-28 bg-brand-sand/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
              The Artisans
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
              Masters of Their Craft
            </h2>
            <p className="mt-4 font-body text-base text-brand-stone max-w-2xl leading-relaxed">
              Behind every artisanal piece is a maker with decades of tradition in
              their hands. These are some of the artisans who make Counter Cultures
              possible.
            </p>
          </AnimatedSection>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Don Miguel Hernández",
                craft: "Copper Basin Artisan · Santa Clara del Cobre",
                description:
                  "Third-generation coppersmith. Each of Don Miguel's basins is hand-hammered from a single sheet of copper — no seams, no molds, no shortcuts.",
                image:
                  "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&q=75&auto=format",
              },
              {
                name: "Maestra Elena Ruiz",
                craft: "Ceramic Artist · Dolores Hidalgo",
                description:
                  "Elena's hand-painted ceramic sinks draw from centuries of Talavera tradition, reinterpreted with contemporary forms and a restrained palette.",
                image:
                  "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=75&auto=format",
              },
              {
                name: "Taller Piedra Viva",
                craft: "Stone Carvers · Querétaro",
                description:
                  "A collective of stone carvers working in cantera rosa and volcanic basalt. Their vessel sinks and countertops bring the raw beauty of Mexican geology indoors.",
                image:
                  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=75&auto=format",
              },
            ].map((artisan) => (
              <AnimatedSection key={artisan.name}>
                <div className="group">
                  <div className="aspect-[4/5] rounded-lg overflow-hidden bg-brand-stone/10">
                    <div
                      className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                      style={{
                        backgroundImage: `url('${artisan.image}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  </div>
                  <h3 className="mt-4 font-display text-xl text-brand-charcoal">
                    {artisan.name}
                  </h3>
                  <p className="mt-1 font-body font-semibold text-xs tracking-wider text-brand-terracotta uppercase">
                    {artisan.craft}
                  </p>
                  <p className="mt-3 font-body text-sm text-brand-stone leading-relaxed">
                    {artisan.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24 bg-brand-terracotta">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="font-display text-3xl md:text-5xl font-light text-white tracking-wide">
              Come See It for Yourself
            </h2>
            <p className="mt-4 font-body text-base text-white/80 max-w-xl mx-auto leading-relaxed">
              Our showroom in San Miguel de Allende is where the full story comes
              alive. Walk through world-class fixtures and artisanal pieces,
              side by side.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="secondary"
                size="lg"
                href="/showroom"
                className="border-white text-white hover:bg-white hover:text-brand-terracotta"
              >
                Visit the Showroom
              </Button>
              <Button
                variant="ghost"
                size="lg"
                href={`https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}`}
                className="text-white hover:text-white/80"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message on WhatsApp
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
    <Footer locale={locale} />
  </>
  );
};
