"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ExternalLink } from "lucide-react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { PROJECTS, PROJECT_LOOKS, type ProjectLook } from "@/app/lib/projects";
import { INSPIRATION_DETAILS } from "@/app/lib/inspiration-details";
import { INSPIRATION_PEOPLE } from "@/app/lib/inspiration-people";
import { HOTEL_CLIENTS, HOTEL_REGIONS } from "@/app/lib/hotel-clients";

type LookFilter = "all" | ProjectLook;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2400&q=80&auto=format";

export const InspirationContent = () => {
  const locale = useLocale() as "en" | "es";
  const isEs = locale === "es";
  const t = (en: string, es: string) => (isEs ? es : en);

  const [look, setLook] = useState<LookFilter>("all");

  const visibleProjects = useMemo(() => {
    if (look === "all") return PROJECTS;
    return PROJECTS.filter((p) => p.look === look);
  }, [look]);

  const lookOptions: { key: LookFilter; label: { en: string; es: string } }[] = [
    { key: "all", label: { en: "All", es: "Todo" } },
    ...(Object.keys(PROJECT_LOOKS) as ProjectLook[]).map((k) => ({
      key: k as LookFilter,
      label: PROJECT_LOOKS[k],
    })),
  ];

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
                  "Homes, hotels, and restaurants across Mexico — pull what speaks to you. Specifications included.",
                  "Casas, hoteles y restaurantes en todo México — toma lo que te hable. Especificaciones incluidas."
                )}
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* FEATURED PROJECTS — with Browse by Look filter */}
        <section className="py-14 md:py-28 bg-brand-linen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
                <div>
                  <span className="font-body font-semibold text-xs tracking-[0.25em] text-brand-terracotta uppercase">
                    {t("Featured Work", "Trabajo Destacado")}
                  </span>
                  <h2 className="mt-3 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.1]">
                    {t("Six projects, told in detail.", "Seis proyectos, contados a detalle.")}
                  </h2>
                </div>
                <p className="font-body text-sm text-dash-text-secondary max-w-md leading-relaxed">
                  {t(
                    "Each one a collaboration between authorized brands, Mexican artisans, and the architects who specified them.",
                    "Cada uno una colaboración entre marcas autorizadas, artesanos mexicanos y los arquitectos que los especificaron."
                  )}
                </p>
              </div>
            </AnimatedSection>

            {/* Browse by Look filter */}
            <AnimatedSection delay={0.1}>
              <div className="flex items-center gap-2 mb-10 md:mb-14 overflow-x-auto pb-1 scrollbar-hide">
                <span className="hidden md:inline font-mono text-[10px] tracking-[0.22em] uppercase text-brand-charcoal/55 mr-3 shrink-0">
                  {t("Browse by Look", "Explorar por Estética")}
                </span>
                {lookOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setLook(opt.key)}
                    className={`shrink-0 px-4 py-2 min-h-[40px] text-sm font-body border rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                      look === opt.key
                        ? "border-brand-charcoal bg-brand-charcoal text-white"
                        : "border-brand-stone/30 text-brand-charcoal hover:border-brand-charcoal"
                    }`}
                  >
                    {opt.label[locale]}
                  </button>
                ))}
              </div>
            </AnimatedSection>

            {/* Project grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {visibleProjects.map((project, i) => (
                <AnimatedSection key={project.slug} delay={i * 0.05}>
                  <Link
                    href={`/${locale}/inspiration/${project.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-brand-stone/10">
                      <Image
                        src={project.heroImage}
                        alt={project.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/95 bg-brand-charcoal/40 backdrop-blur-sm px-2.5 py-1 rounded-sm">
                          {PROJECT_LOOKS[project.look][locale]}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <h3 className="font-display text-xl md:text-2xl leading-tight">
                          {project.title}
                        </h3>
                        <p className="mt-1 font-body text-xs text-white/75">
                          {project.location[locale]} · {project.year}
                        </p>
                        <p className="mt-3 font-body text-sm text-white/90 leading-relaxed line-clamp-2 opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-20 transition-all duration-500">
                          {project.description[locale]}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="font-body font-semibold text-xs tracking-wider text-brand-terracotta uppercase">
                        {project.architect}
                      </p>
                      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-dash-text-secondary">
                        {project.type[locale]}
                      </span>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>

            {visibleProjects.length === 0 && (
              <p className="text-center font-body text-sm text-dash-text-secondary py-12">
                {t("No projects match this look yet.", "Aún no hay proyectos con esta estética.")}
              </p>
            )}
          </div>
        </section>

        {/* DETAIL LIBRARY — handpicked specifier moments */}
        <section className="py-14 md:py-28 bg-dash-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="max-w-2xl">
                <span className="font-body font-semibold text-xs tracking-[0.25em] text-brand-terracotta uppercase">
                  {t("Specifier's Detail", "El Detalle del Especificador")}
                </span>
                <h2 className="mt-3 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.1]">
                  {t(
                    "This faucet, this finish, in this light.",
                    "Este grifo, este acabado, esta luz."
                  )}
                </h2>
                <p className="mt-5 font-body text-base text-dash-text-secondary leading-relaxed">
                  {t(
                    "Close-up moments from real projects — the combinations we'd specify again. Click through to the full project.",
                    "Momentos cercanos de proyectos reales — las combinaciones que volveríamos a especificar. Haz clic para ver el proyecto completo."
                  )}
                </p>
              </div>
            </AnimatedSection>

            <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {INSPIRATION_DETAILS.map((detail, i) => (
                <AnimatedSection key={`${detail.projectSlug}-${i}`} delay={i * 0.04}>
                  <Link
                    href={`/${locale}/inspiration/${detail.projectSlug}`}
                    className="group block relative aspect-square rounded-md overflow-hidden bg-brand-stone/10"
                    aria-label={`${detail.alt[locale]} — ${detail.projectTitle}`}
                  >
                    <Image
                      src={detail.src}
                      alt={detail.alt[locale]}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white">
                      <p className="font-mono text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-brand-copper">
                        {detail.brand}
                      </p>
                      <p className="mt-1 font-body text-xs md:text-sm leading-snug">
                        {detail.caption[locale]}
                      </p>
                      <p className="mt-2 font-body text-[10px] md:text-xs text-white/70 italic">
                        {detail.projectTitle}
                      </p>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* HOSPITALITY ROLL CALL — the marquee */}
        <section className="py-14 md:py-24 bg-brand-linen overflow-hidden border-t border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end mb-12">
                <div className="lg:col-span-7">
                  <span className="font-body font-semibold text-xs tracking-[0.25em] text-brand-terracotta uppercase">
                    {t("Where You've Stayed", "Donde Has Hospedado")}
                  </span>
                  <h2 className="mt-4 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.05]">
                    {t(
                      "Mexico's most considered properties.",
                      "Las propiedades más consideradas de México."
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
                      <dd className="mt-2 font-display text-3xl md:text-5xl font-light text-brand-copper tabular-nums leading-none">
                        {HOTEL_CLIENTS.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] tracking-[0.22em] text-brand-charcoal/55 uppercase">
                        {t("Regions", "Regiones")}
                      </dt>
                      <dd className="mt-2 font-display text-3xl md:text-5xl font-light text-brand-copper tabular-nums leading-none">
                        {new Set(HOTEL_CLIENTS.map((h) => h.region)).size}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] tracking-[0.22em] text-brand-charcoal/55 uppercase">
                        {t("Since", "Desde")}
                      </dt>
                      <dd className="mt-2 font-display text-3xl md:text-5xl font-light text-brand-copper tabular-nums leading-none">
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

        {/* THE PEOPLE — architects + artisans */}
        <section className="py-14 md:py-28 bg-brand-sand/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="max-w-2xl">
                <span className="font-body font-semibold text-xs tracking-[0.25em] text-brand-terracotta uppercase">
                  {t("The People", "Las Personas")}
                </span>
                <h2 className="mt-3 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.1]">
                  {t(
                    "Behind every project, the right hands.",
                    "Detrás de cada proyecto, las manos correctas."
                  )}
                </h2>
                <p className="mt-5 font-body text-base text-dash-text-secondary leading-relaxed">
                  {t(
                    "The architects who specify with us, and the Mexican artisans whose work we source. We're a curatorial bridge — not a vendor.",
                    "Los arquitectos que especifican con nosotros, y los artesanos mexicanos cuyo trabajo obtenemos. Somos un puente curatorial — no un proveedor."
                  )}
                </p>
              </div>
            </AnimatedSection>

            <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {INSPIRATION_PEOPLE.map((person, i) => (
                <AnimatedSection key={person.name} delay={i * 0.05}>
                  <article className="h-full bg-dash-surface rounded-lg p-7 md:p-8 border border-brand-stone/10 flex flex-col">
                    <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-brand-copper">
                      {person.role === "architect"
                        ? t("Architect", "Arquitecto")
                        : t("Artisan", "Artesano")}
                    </span>
                    <h3 className="mt-3 font-display text-2xl text-brand-charcoal leading-tight">
                      {person.name}
                    </h3>
                    {person.firm && (
                      <p className="mt-1 font-body text-sm text-dash-text-secondary italic">
                        {person.firm}
                      </p>
                    )}
                    <p className="mt-2 font-body text-xs tracking-wider text-dash-text-secondary uppercase">
                      {person.location[locale]}
                    </p>
                    <p className="mt-5 font-body text-sm text-dash-text-secondary leading-relaxed flex-1">
                      {person.bio[locale]}
                    </p>
                    {person.projectSlugs.length > 0 && (
                      <div className="mt-6 pt-5 border-t border-brand-stone/10">
                        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-brand-charcoal/55 mb-2">
                          {t("Projects", "Proyectos")}
                        </p>
                        <ul className="space-y-1">
                          {person.projectSlugs.map((slug) => {
                            const proj = PROJECTS.find((p) => p.slug === slug);
                            if (!proj) return null;
                            return (
                              <li key={slug}>
                                <Link
                                  href={`/${locale}/inspiration/${slug}`}
                                  className="font-body text-sm text-brand-charcoal hover:text-brand-terracotta transition-colors"
                                >
                                  {proj.title} →
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </article>
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
