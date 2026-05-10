"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { ExternalLink } from "lucide-react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import {
  HOTEL_CLIENTS,
  HOTEL_REGIONS,
  type HotelClient,
} from "@/app/lib/hotel-clients";

// Hero — Belmond Casa de Sierra Nevada, a real client on Counter Cultures'
// San Miguel home turf. Easy to swap to another HOTEL_CLIENTS heroImage.
const HERO_IMAGE = "/images/projects/hotels/belmond-sierra-nevada.jpg";

interface Section {
  label: string;
  intro: string;
  hotels: HotelClient[];
}

interface ProcessStep {
  number: string;
  title: string;
  body: string;
}

export const HospitalityContent = () => {
  const locale = useLocale() as "en" | "es";
  const t = (en: string, es: string) => (locale === "es" ? es : en);

  const sma = HOTEL_CLIENTS.filter((h) => h.region === "san-miguel");
  const cabos = HOTEL_CLIENTS.filter((h) => h.region === "los-cabos");
  const beyond = HOTEL_CLIENTS.filter(
    (h) => h.region !== "san-miguel" && h.region !== "los-cabos"
  );

  const sections: Section[] = [
    {
      label: "San Miguel de Allende",
      intro: t(
        "Counter Cultures' home turf. Boutique landmarks and historic residences in Mexico's most architecturally celebrated colonial city.",
        "El terreno de Counter Cultures. Hoteles boutique y residencias históricas en la ciudad colonial más celebrada arquitectónicamente de México."
      ),
      hotels: sma,
    },
    {
      label: "Los Cabos",
      intro: t(
        "Resort hospitality on the Baja Peninsula, where our second showroom serves the region.",
        "Hospitalidad de resort en la Península de Baja California, donde nuestro segundo showroom atiende a la región."
      ),
      hotels: cabos,
    },
    {
      label: t("Beyond", "Más Allá"),
      intro: t(
        "Coastal resorts, a private island in the Caribbean, and an icon of Jalisco tourism — properties Counter Cultures has supplied beyond the home regions.",
        "Resorts costeros, una isla privada en el Caribe y un ícono del turismo jalisciense — propiedades que Counter Cultures ha abastecido más allá de las regiones de origen."
      ),
      hotels: beyond,
    },
  ];

  const processSteps: ProcessStep[] = [
    {
      number: "01",
      title: t("At the table for spec.", "En la mesa de especificación."),
      body: t(
        "Architect, designer, builder, owner — we sit in during specification, not just delivery. Authorized brands and Mexican artisans, selected for each room and the room's purpose.",
        "Arquitecto, diseñador, constructor, propietario — nos sentamos a la mesa durante la especificación, no solo en la entrega. Marcas autorizadas y artesanos mexicanos, seleccionados para cada habitación y su propósito."
      ),
    },
    {
      number: "02",
      title: t("Factory-direct pricing.", "Precio directo de fábrica."),
      body: t(
        "As authorized dealers for the leading international bath, kitchen, and hardware brands, you skip the middle markup. Trade Program rates available for design and construction professionals.",
        "Como distribuidores autorizados de las principales marcas internacionales de baño, cocina y herrajes, te saltas el margen intermedio. Tarifas del Programa Trade disponibles para profesionales de diseño y construcción."
      ),
    },
    {
      number: "03",
      title: t("From PO to punch list.", "De la orden de compra a la entrega."),
      body: t(
        "Coordinated delivery from our showrooms in San Miguel and Los Cabos. Install support, replacement parts, and a dedicated account contact through opening day — and the life of the property.",
        "Entrega coordinada desde nuestros showrooms en San Miguel y Los Cabos. Soporte de instalación, refacciones y un contacto dedicado de cuenta hasta el día de apertura — y la vida útil de la propiedad."
      ),
    },
  ];

  return (
    <>
      <Header locale={locale} />
      <main id="main" tabIndex={-1}>
        {/* HERO — full-bleed, real client image, copy overlaid */}
        <section className="relative min-h-[80vh] md:min-h-[88vh] flex items-end overflow-hidden bg-brand-charcoal">
          <Image
            src={HERO_IMAGE}
            alt={t(
              "Belmond Casa de Sierra Nevada, San Miguel de Allende — a Counter Cultures hospitality client",
              "Belmond Casa de Sierra Nevada, San Miguel de Allende — cliente de hospitalidad de Counter Cultures"
            )}
            fill
            sizes="100vw"
            priority
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/40 to-brand-charcoal/10" />
          <div className="relative mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 pt-32">
            <AnimatedSection>
              <span className="font-body font-semibold text-xs tracking-[0.3em] text-brand-copper uppercase">
                {t("Trusted By", "Elegidos Por")}
              </span>
              <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-light text-white leading-[1.05] tracking-wide max-w-4xl">
                {t(
                  "Mexico's hospitality leaders.",
                  "Líderes de hospitalidad en México."
                )}
              </h1>
              <p className="mt-7 font-body text-base md:text-lg text-white/80 max-w-2xl leading-relaxed">
                {t(
                  "The hotels, residences, and properties below have all specified Counter Cultures. Twenty-two years of fixtures, faucets, and hardware — installed and in use.",
                  "Los hoteles, residencias y propiedades a continuación han especificado Counter Cultures. Veintidós años de accesorios, grifos y herrajes — instalados y en uso."
                )}
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* PROCESS — three-step process for hospitality clients */}
        <section className="py-16 md:py-28 bg-dash-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="max-w-3xl mb-12 md:mb-16">
                <span className="font-body font-semibold text-xs tracking-[0.3em] text-brand-terracotta uppercase">
                  {t("How We Work", "Cómo Trabajamos")}
                </span>
                <h2 className="mt-4 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.1]">
                  {t(
                    "Specifying for hospitality.",
                    "Especificando para hospitalidad."
                  )}
                </h2>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {processSteps.map((step, i) => (
                <AnimatedSection key={step.number} delay={i * 0.08}>
                  <div className="relative">
                    <span className="font-mono text-xs tracking-[0.3em] text-brand-copper">
                      {step.number}
                    </span>
                    <h3 className="mt-3 font-display text-xl md:text-2xl font-light text-brand-charcoal leading-tight">
                      {step.title}
                    </h3>
                    <p className="mt-4 font-body text-base text-dash-text-secondary leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* REGIONAL SECTIONS — image-led 3-col grids */}
        <section className="bg-brand-linen py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20 md:space-y-28">
            {sections.map((section, i) => (
              <AnimatedSection key={section.label} delay={i * 0.05}>
                <div>
                  {/* Section header */}
                  <div className="max-w-3xl mb-8 md:mb-12">
                    <h2 className="font-mono text-xs md:text-sm tracking-[0.3em] uppercase text-brand-copper">
                      {section.label}
                    </h2>
                    <p className="mt-4 font-body text-base md:text-lg text-dash-text-secondary leading-relaxed">
                      {section.intro}
                    </p>
                  </div>

                  {/* Property grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                    {section.hotels.map((hotel) => (
                      <a
                        key={hotel.slug}
                        href={hotel.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${hotel.name}, ${hotel.location[locale]} (opens in new tab)`}
                        className="group relative block aspect-[4/5] rounded-lg overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
                      >
                        <Image
                          src={hotel.heroImage}
                          alt={`${hotel.name}, ${hotel.location[locale]}`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                        <div className="absolute top-4 left-4">
                          <span className="inline-block font-mono text-[10px] tracking-[0.22em] uppercase text-white/95 bg-brand-charcoal/40 backdrop-blur-sm px-2.5 py-1 rounded-sm">
                            {HOTEL_REGIONS[hotel.region][locale]}
                          </span>
                        </div>
                        <div className="absolute bottom-5 left-5 right-5 text-white">
                          <h3 className="font-display text-xl md:text-2xl leading-tight">
                            {hotel.name}
                          </h3>
                          <p className="mt-1.5 font-body text-sm text-white/80">
                            {hotel.location[locale]}
                          </p>
                          <p className="mt-3 font-mono text-[10px] tracking-[0.2em] uppercase text-brand-copper inline-flex items-center gap-1.5 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                            {t("Visit", "Visitar")}
                            <ExternalLink className="w-3 h-3" />
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            ))}
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
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
};
