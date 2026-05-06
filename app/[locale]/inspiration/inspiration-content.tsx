"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { ExternalLink } from "lucide-react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { HOTEL_CLIENTS, HOTEL_REGIONS } from "@/app/lib/hotel-clients";
import { NOTABLE_INSTALLATIONS } from "@/app/lib/notable-installations";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2400&q=80&auto=format";

export const InspirationContent = () => {
  const locale = useLocale() as "en" | "es";
  const isEs = locale === "es";
  const t = (en: string, es: string) => (isEs ? es : en);

  return (
    <>
      <Header locale={locale} />
      <main id="main" tabIndex={-1}>
        {/* HERO — editorial full-bleed */}
        <section className="relative min-h-[80vh] md:min-h-[90vh] flex items-end overflow-hidden bg-brand-charcoal">
          <Image
            src={HERO_IMAGE}
            alt={t(
              "A Mexican interior — copper basin, brass faucet, plaster wall",
              "Un interior mexicano — lavabo de cobre, grifo de latón, muro de yeso"
            )}
            fill
            sizes="100vw"
            priority
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/40 to-transparent" />
          <div className="relative mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
            <AnimatedSection>
              <span className="font-body font-semibold text-xs tracking-[0.3em] text-brand-copper uppercase">
                {t("Inspiration", "Inspiración")}
              </span>
              <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-light text-white leading-[1.05] tracking-wide max-w-4xl">
                {t(
                  "Twenty-two years of rooms we helped shape.",
                  "Veintidós años moldeando habitaciones."
                )}
              </h1>
              <p className="mt-6 font-body text-base md:text-lg text-white/75 max-w-2xl leading-relaxed">
                {t(
                  "Hotels, residences, and landmark properties across Mexico that have specified Counter Cultures.",
                  "Hoteles, residencias y propiedades emblemáticas en todo México que han especificado Counter Cultures."
                )}
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* HOSPITALITY ROLL CALL — promoted to lead */}
        <section className="py-14 md:py-28 bg-brand-linen overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end mb-12 md:mb-16">
                <div className="lg:col-span-7">
                  <span className="font-body font-semibold text-xs tracking-[0.25em] text-brand-terracotta uppercase">
                    {t("Trusted By", "Elegidos Por")}
                  </span>
                  <h2 className="mt-4 font-display text-3xl md:text-5xl lg:text-[3.25rem] font-light tracking-wide text-brand-charcoal leading-[1.05]">
                    {t(
                      "Mexico's hospitality leaders.",
                      "Líderes de hospitalidad en México."
                    )}
                  </h2>
                  <p className="mt-5 font-body text-base text-dash-text-secondary max-w-xl leading-relaxed">
                    {t(
                      "Properties across San Miguel de Allende, Los Cabos, the Riviera Maya, and beyond — each has specified Counter Cultures.",
                      "Propiedades en San Miguel de Allende, Los Cabos, la Riviera Maya y más allá — cada una ha especificado Counter Cultures."
                    )}
                  </p>
                </div>
                <div className="lg:col-span-5 lg:border-l border-brand-stone/25 lg:pl-12">
                  <dl className="grid grid-cols-3 gap-x-4">
                    <div>
                      <dt className="font-mono text-[10px] tracking-[0.22em] text-brand-charcoal/55 uppercase">
                        {t("Properties", "Propiedades")}
                      </dt>
                      <dd className="mt-2 font-display text-3xl md:text-4xl lg:text-5xl font-light text-brand-copper tabular-nums leading-none">
                        {HOTEL_CLIENTS.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] tracking-[0.22em] text-brand-charcoal/55 uppercase">
                        {t("Regions", "Regiones")}
                      </dt>
                      <dd className="mt-2 font-display text-3xl md:text-4xl lg:text-5xl font-light text-brand-copper tabular-nums leading-none">
                        {new Set(HOTEL_CLIENTS.map((h) => h.region)).size}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] tracking-[0.22em] text-brand-charcoal/55 uppercase">
                        {t("Since", "Desde")}
                      </dt>
                      <dd className="mt-2 font-display text-3xl md:text-4xl lg:text-5xl font-light text-brand-copper tabular-nums leading-none">
                        2004
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="relative -mx-4 sm:-mx-6 lg:-mx-8" aria-roledescription="carousel">
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
                        aria-label={`${hotel.name}, ${hotel.location[locale]} (opens in new tab)`}
                        className="group relative shrink-0 w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] rounded-lg overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={hotel.heroImage}
                            alt={`${hotel.name}, ${hotel.location[locale]}`}
                            fill
                            sizes="(max-width: 768px) 300px, 380px"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                          <div className="absolute top-3 left-3">
                            <span className="inline-block font-mono text-[10px] tracking-[0.22em] uppercase text-white/95 bg-brand-charcoal/40 backdrop-blur-sm px-2.5 py-1 rounded-sm">
                              {HOTEL_REGIONS[hotel.region][locale]}
                            </span>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4 text-white">
                            <h3 className="font-display text-lg md:text-xl leading-tight">
                              {hotel.name}
                            </h3>
                            <p className="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase text-brand-copper inline-flex items-center gap-1.5 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                              {t("Visit", "Visitar")}
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

            <AnimatedSection delay={0.3}>
              <p className="mt-6 md:mt-8 font-mono text-[10px] tracking-[0.25em] uppercase text-brand-charcoal/45 text-center">
                {t("Hover to pause", "Pasa el cursor para pausar")}
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* NOTABLE INSTALLATIONS — three real projects */}
        <section className="py-14 md:py-28 bg-dash-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="max-w-2xl mb-12 md:mb-16">
                <span className="font-body font-semibold text-xs tracking-[0.25em] text-brand-terracotta uppercase">
                  {t("Notable Installations", "Instalaciones Destacadas")}
                </span>
                <h2 className="mt-3 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.1]">
                  {t(
                    "From the Pacific coast to a private island.",
                    "De la costa del Pacífico a una isla privada."
                  )}
                </h2>
                <p className="mt-5 font-body text-base text-dash-text-secondary leading-relaxed">
                  {t(
                    "A few of the landmark properties we've supplied beyond the showroom.",
                    "Algunas de las propiedades emblemáticas que hemos abastecido más allá del showroom."
                  )}
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {NOTABLE_INSTALLATIONS.map((project, i) => (
                <AnimatedSection key={project.slug} delay={i * 0.08}>
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper rounded-lg"
                    aria-label={`${project.name[locale]} (opens in new tab)`}
                  >
                    <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-brand-stone/10">
                      <Image
                        src={project.image}
                        alt={project.name[locale]}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        style={{ objectPosition: project.imagePosition }}
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <h3 className="font-display text-xl md:text-2xl leading-tight">
                          {project.name[locale]}
                        </h3>
                        <p className="mt-2 font-body text-sm text-white/85 leading-relaxed line-clamp-3">
                          {project.description[locale]}
                        </p>
                        <p className="mt-3 font-mono text-[10px] tracking-[0.2em] uppercase text-brand-copper inline-flex items-center gap-1.5 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          {t("Visit", "Visitar")}
                          <ExternalLink className="w-3 h-3" />
                        </p>
                      </div>
                    </div>
                  </a>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 md:py-24 bg-brand-charcoal">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <AnimatedSection>
              <h2 className="font-display text-3xl md:text-5xl font-light text-white tracking-wide">
                {t("Have a Project in Mind?", "¿Tienes un Proyecto en Mente?")}
              </h2>
              <p className="mt-4 font-body text-base text-white/60 max-w-xl mx-auto leading-relaxed">
                {t(
                  "Whether it's a single bathroom or a 50-room hotel, we'll help you specify the right fixtures — from authorized brands and a network of Mexican artisans.",
                  "Ya sea un solo baño o un hotel de 50 habitaciones, te ayudamos a especificar los accesorios adecuados — de marcas autorizadas y una red de artesanos mexicanos."
                )}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="primary" size="lg" href="/contact">
                  {t("Start a Conversation", "Iniciar Conversación")}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  href="/trade"
                  className="text-white hover:text-brand-copper"
                >
                  {t("Trade Program", "Programa Trade")} →
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
