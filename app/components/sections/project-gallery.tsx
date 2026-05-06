import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { HOTEL_CLIENTS, HOTEL_REGIONS } from "@/app/lib/hotel-clients";

const ProjectGallery = ({ locale = "en" }: { locale?: string }) => {
  const lang = locale as "en" | "es";
  const isEs = lang === "es";
  const propertyCount = HOTEL_CLIENTS.length;
  const regionCount = new Set(HOTEL_CLIENTS.map((h) => h.region)).size;

  return (
    <section className="py-14 md:py-24 bg-brand-linen overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Editorial header — split layout: title block (left) + stat column (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end">
          <AnimatedSection className="lg:col-span-7">
            <span className="font-body font-semibold text-xs tracking-[0.25em] text-brand-terracotta uppercase">
              {isEs ? "Elegidos Por" : "Trusted By"}
            </span>
            <h2 className="mt-4 font-display text-3xl md:text-5xl lg:text-[3.25rem] font-light tracking-wide text-brand-charcoal leading-[1.05]">
              {isEs
                ? "Líderes de hospitalidad en México."
                : "Mexico's hospitality leaders."}
            </h2>
            <p className="mt-5 font-body text-base text-dash-text-secondary max-w-xl leading-relaxed">
              {isEs
                ? "Propiedades en San Miguel de Allende, Los Cabos, la Riviera Maya y más allá que han especificado Counter Cultures."
                : "Properties across San Miguel de Allende, Los Cabos, the Riviera Maya, and beyond that have specified Counter Cultures."}
            </p>
          </AnimatedSection>

          <AnimatedSection
            delay={0.15}
            className="lg:col-span-5 lg:border-l border-brand-stone/25 lg:pl-12"
          >
            <dl className="grid grid-cols-3 gap-x-4 lg:gap-x-2 lg:gap-y-0">
              <div>
                <dt className="font-mono text-[10px] tracking-[0.22em] text-brand-charcoal/55 uppercase">
                  {isEs ? "Propiedades" : "Properties"}
                </dt>
                <dd className="mt-2 font-display text-3xl md:text-4xl lg:text-5xl font-light text-brand-copper tabular-nums leading-none">
                  {propertyCount}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.22em] text-brand-charcoal/55 uppercase">
                  {isEs ? "Regiones" : "Regions"}
                </dt>
                <dd className="mt-2 font-display text-3xl md:text-4xl lg:text-5xl font-light text-brand-copper tabular-nums leading-none">
                  {regionCount}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.22em] text-brand-charcoal/55 uppercase">
                  {isEs ? "Desde" : "Since"}
                </dt>
                <dd className="mt-2 font-display text-3xl md:text-4xl lg:text-5xl font-light text-brand-copper tabular-nums leading-none">
                  2004
                </dd>
              </div>
            </dl>
          </AnimatedSection>
        </div>

        {/* Marquee — single auto-scrolling row of property cards.
            Track contains the list duplicated, animated by translateX -50% for seamless loop. */}
        <AnimatedSection delay={0.25} className="mt-12 md:mt-16">
          <div
            className="relative -mx-4 sm:-mx-6 lg:-mx-8"
            aria-roledescription="carousel"
            aria-label={
              isEs
                ? "Propiedades que han especificado Counter Cultures"
                : "Properties that have specified Counter Cultures"
            }
          >
            {/* Edge fades */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 md:w-32 z-10 bg-gradient-to-r from-brand-linen to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 md:w-32 z-10 bg-gradient-to-l from-brand-linen to-transparent"
            />

            <div className="cc-marquee-track flex gap-4 md:gap-5 w-max">
              {[...HOTEL_CLIENTS, ...HOTEL_CLIENTS].map((hotel, i) => {
                const isClone = i >= HOTEL_CLIENTS.length;
                return (
                  <a
                    key={`${hotel.slug}-${i}`}
                    href={hotel.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-hidden={isClone ? "true" : undefined}
                    tabIndex={isClone ? -1 : undefined}
                    aria-label={`${hotel.name}, ${hotel.location[lang]} (opens in new tab)`}
                    className="group relative shrink-0 w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] rounded-lg overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={hotel.heroImage}
                        alt={`${hotel.name}, ${hotel.location[lang]}`}
                        fill
                        sizes="(max-width: 768px) 300px, 380px"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      {/* Gradient — strong at the bottom, fades to clear */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                      {/* Region tag */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-block font-mono text-[10px] tracking-[0.22em] uppercase text-white/95 bg-brand-charcoal/40 backdrop-blur-sm px-2.5 py-1 rounded-sm">
                          {HOTEL_REGIONS[hotel.region][lang]}
                        </span>
                      </div>
                      {/* Title + visit affordance */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="font-display text-lg md:text-xl leading-tight">
                          {hotel.name}
                        </h3>
                        <p className="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase text-brand-copper inline-flex items-center gap-1.5 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          {isEs ? "Visitar" : "Visit"}
                          <ExternalLink className="w-3 h-3" />
                        </p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </AnimatedSection>

        {/* Caption — small affordance hint */}
        <AnimatedSection delay={0.35}>
          <p className="mt-6 md:mt-8 font-mono text-[10px] tracking-[0.25em] uppercase text-brand-charcoal/45 text-center">
            {isEs
              ? "Pasa el cursor para pausar"
              : "Hover to pause"}
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
};

export { ProjectGallery };
