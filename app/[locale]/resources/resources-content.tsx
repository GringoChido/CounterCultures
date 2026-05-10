"use client";

import { useState } from "react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { glossaryTerms } from "@/app/lib/glossary";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Wrench,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from "lucide-react";

export interface BrandCard {
  name: string;
  slug: string;
  href: string;
  count: number;
  heroImage?: string;
  productImage?: string;
}

const HERO_IMAGE = "/images/hero/lux-bathroom.webp";

const content = {
  hero: {
    eyebrow: { en: "Resources", es: "Recursos" },
    title: {
      en: "Everything you need to specify.",
      es: "Todo lo que necesitas para especificar.",
    },
    subtitle: {
      en: "Specs, care guides, brand catalogs, glossary, and warranty terms — for architects, designers, and the trade.",
      es: "Fichas técnicas, cuidado, catálogos de marca, glosario y términos de garantía — para arquitectos, diseñadores y el oficio.",
    },
  },
  chapters: [
    { num: "01", slug: "specs", label: { en: "Specifications", es: "Especificaciones" } },
    { num: "02", slug: "ordering", label: { en: "Ordering", es: "Pedidos" } },
    { num: "03", slug: "brands", label: { en: "Brand Index", es: "Índice de Marcas" } },
    { num: "04", slug: "glossary", label: { en: "Glossary", es: "Glosario" } },
    { num: "05", slug: "warranty", label: { en: "Warranty", es: "Garantía" } },
  ],
  quickAccess: [
    {
      icon: FileText,
      num: "01",
      title: { en: "Specification Sheets", es: "Fichas Técnicas" },
      description: {
        en: "Cut sheets, CAD files, and rough-in dimensions for every brand we carry. Sent on request through the Trade Program.",
        es: "Fichas técnicas, archivos CAD y dimensiones de instalación para cada marca que llevamos. Enviadas a solicitud a través del Programa Trade.",
      },
      cta: { en: "Request Sheets", es: "Solicitar Fichas" },
      href: "/contact",
    },
    {
      icon: Wrench,
      num: "02",
      title: { en: "Care & Maintenance", es: "Cuidado y Mantenimiento" },
      description: {
        en: "Material-specific guides for copper, bronze, Silgranit, porcelain, and Living Finishes — bilingual, written for housekeeping teams.",
        es: "Guías por material para cobre, bronce, Silgranit, porcelana y Living Finishes — bilingües, escritas para equipos de housekeeping.",
      },
      cta: { en: "View Guides", es: "Ver Guías" },
      href: "/insights",
    },
    {
      icon: ShieldCheck,
      num: "03",
      title: { en: "Installation Reference", es: "Referencia de Instalación" },
      description: {
        en: "Plumber-ready rough-in drawings, water-supply requirements, and step-by-step install notes for every fixture line.",
        es: "Diagramas listos para plomero, requisitos de suministro de agua y notas de instalación paso a paso para cada línea de accesorios.",
      },
      cta: { en: "View Reference", es: "Ver Referencia" },
      href: "/contact",
    },
  ],
  ordering: {
    eyebrow: { en: "02 — Ordering", es: "02 — Pedidos" },
    title: {
      en: "From specification to delivered price.",
      es: "De la especificación al precio entregado.",
    },
    subtitle: {
      en: "How we move a fixture from a Brizo factory in Indiana, a TOTO line in Japan, or a coppersmith's bench in Santa Clara — into a finished bathroom in San Miguel.",
      es: "Cómo movemos un accesorio desde una fábrica Brizo en Indiana, una línea TOTO en Japón, o un banco de cobre en Santa Clara — hasta un baño terminado en San Miguel.",
    },
    faqs: [
      {
        q: {
          en: "What are typical lead times for international brands?",
          es: "¿Cuáles son los tiempos de entrega típicos para marcas internacionales?",
        },
        a: {
          en: "Standard finishes from Kohler, TOTO, Brizo, and BLANCO: 4–6 weeks including shipping and customs. Special-order finishes: 8–12 weeks. Custom or discontinued items: 12–16 weeks with manufacturer confirmation. Artisanal pieces: 3–8 weeks depending on complexity. We recommend building a 2-week buffer for Mexican customs clearance.",
          es: "Acabados estándar de Kohler, TOTO, Brizo y BLANCO: 4–6 semanas incluyendo envío y aduana. Acabados de pedido especial: 8–12 semanas. Artículos personalizados o descontinuados: 12–16 semanas. Piezas artesanales: 3–8 semanas. Recomendamos un margen de 2 semanas para despacho aduanal.",
        },
      },
      {
        q: {
          en: "Do you handle import logistics and customs?",
          es: "¿Manejan la logística de importación y aduanas?",
        },
        a: {
          en: "Yes. Counter Cultures manages all import duties, customs brokerage, freight coordination, and regulatory compliance. You receive a single delivered price — no separate freight invoices or customs paperwork. This is included for all orders, not just Trade Program members.",
          es: "Sí. Counter Cultures maneja todos los aranceles de importación, corretaje aduanal, coordinación de flete y cumplimiento regulatorio. Recibes un precio único entregado — sin facturas de flete separadas ni papeleo aduanal.",
        },
      },
      {
        q: {
          en: "What is your return and exchange policy?",
          es: "¿Cuál es su política de devoluciones y cambios?",
        },
        a: {
          en: "Physical exchanges are only accepted if reported within 72 hours of receipt. A 30% operational fee applies to all returns, exchanges, or cancellations. All items must be returned in original packaging with all accessories. Living Finishes, custom orders, and discontinued products are non-returnable. Products shipped more than 8 months ago are not eligible for return. Damaged items — contact equipo@countercultures.com.mx or 415.154.8375 within 72 hours.",
          es: "Los intercambios físicos solo se aceptan si se reportan dentro de las 72 horas posteriores a la recepción. Se aplica un cargo operativo del 30% a todas las devoluciones, cambios o cancelaciones. Todos los artículos deben devolverse en su empaque original con todos los accesorios. Los acabados Living Finishes, pedidos personalizados y productos descontinuados no son retornables. Los productos enviados hace más de 8 meses no son elegibles para devolución.",
        },
      },
      {
        q: {
          en: "Can I visit the showroom to see products before ordering?",
          es: "¿Puedo visitar el showroom para ver productos antes de ordenar?",
        },
        a: {
          en: "Absolutely. Our San Miguel de Allende showroom displays products from all major brands, including working faucet demonstrations and material samples. Walk-ins are welcome Monday–Friday, 10:00–18:00. For Trade Program consultations, we recommend booking an appointment to ensure a dedicated specialist is available.",
          es: "Absolutamente. Nuestro showroom en San Miguel de Allende exhibe productos de las marcas principales, incluyendo demostraciones de grifos en funcionamiento y muestras de materiales. Visitas sin cita bienvenidas lunes a viernes, 10:00–18:00.",
        },
      },
      {
        q: {
          en: "What payment methods do you accept?",
          es: "¿Qué métodos de pago aceptan?",
        },
        a: {
          en: "We accept bank transfers (SPEI), credit cards (Visa, Mastercard, Amex), and cash (MXN or USD). Standard terms are 70% deposit on order confirmation (or more for some brands and orders) and the balance when the order is built and ready to ship — paid before delivery. Some pieces are in stock at the showroom. Trade Program members may qualify for net-30 terms on approved credit.",
          es: "Aceptamos transferencias bancarias (SPEI), tarjetas de crédito (Visa, Mastercard, Amex) y efectivo (MXN o USD). Los términos estándar son 70% de anticipo al confirmar el pedido (o más en ciertas marcas y órdenes) y el saldo cuando el pedido está listo para enviarse — pagado antes de la entrega. Algunas piezas están en showroom. Miembros del programa Trade pueden calificar para términos de crédito a 30 días.",
        },
      },
    ],
  },
  brands: {
    eyebrow: { en: "03 — Brand Index", es: "03 — Índice de Marcas" },
    title: {
      en: "Authorized brands. Mexican artisans.",
      es: "Marcas autorizadas. Artesanos mexicanos.",
    },
    intro: {
      en: "Nineteen lines, side by side. Tap any to browse the full catalog, finishes, and pricing.",
      es: "Diecinueve líneas, lado a lado. Toca cualquiera para explorar el catálogo completo, acabados y precios.",
    },
  },
  glossary: {
    eyebrow: { en: "04 — Glossary", es: "04 — Glosario" },
    title: {
      en: "The vocabulary of fixtures.",
      es: "El vocabulario de los accesorios.",
    },
    intro: {
      en: "Materials, techniques, and standards from the bath, kitchen, and hardware trade — defined in plain language.",
      es: "Materiales, técnicas y estándares del oficio de baño, cocina y herrajes — definidos en lenguaje claro.",
    },
  },
  warranty: {
    eyebrow: { en: "05 — Warranty", es: "05 — Garantía" },
    title: { en: "Warranty coverage at a glance.", es: "Cobertura de garantía de un vistazo." },
    subtitle: {
      en: "Manufacturer terms vary by brand and application. Below is a quick reference — full terms are confirmed on the order acknowledgment.",
      es: "Los términos del fabricante varían por marca y aplicación. A continuación una referencia rápida — los términos completos se confirman en el acuse del pedido.",
    },
    items: [
      { brand: "Kohler", residential: { en: "Lifetime limited", es: "Vida limitada" }, commercial: { en: "1 yr (3 yr commercial lines)", es: "1 año (3 años líneas comerciales)" } },
      { brand: "TOTO", residential: { en: "1 yr (5 yr Cefiontect)", es: "1 año (5 años Cefiontect)" }, commercial: { en: "1 yr (3 yr Washlet)", es: "1 año (3 años Washlet)" } },
      { brand: "Brizo", residential: { en: "Lifetime — finish + function", es: "Vida — acabado + función" }, commercial: { en: "Limited lifetime (5 yr finish)", es: "Vida limitada (5 años acabado)" } },
      { brand: "BLANCO", residential: { en: "Limited lifetime", es: "Vida limitada" }, commercial: { en: "2 yr", es: "2 años" } },
      { brand: "California Faucets", residential: { en: "Lifetime", es: "Vida" }, commercial: { en: "5 yr", es: "5 años" } },
      { brand: "Sun Valley Bronze", residential: { en: "10 yr", es: "10 años" }, commercial: { en: "10 yr", es: "10 años" } },
      { brand: "Emtek", residential: { en: "Lifetime mechanical", es: "Vida mecánica" }, commercial: { en: "5 yr", es: "5 años" } },
      { brand: "Badeloft", residential: { en: "25 yr surface", es: "25 años superficie" }, commercial: { en: "10 yr", es: "10 años" } },
      { brand: { en: "Artisanal (Counter Cultures)", es: "Artesanal (Counter Cultures)" }, residential: { en: "5 yr structural", es: "5 años estructural" }, commercial: { en: "3 yr structural", es: "3 años estructural" } },
    ] as const,
  },
  cta: {
    title: {
      en: "Need something we haven't covered?",
      es: "¿Necesitas algo que no hayamos cubierto?",
    },
    subtitle: {
      en: "Our specification team prepares custom documentation for projects in design — drawings, finish samples, signed quotes. Reach out and we'll route you to the right specialist.",
      es: "Nuestro equipo de especificación prepara documentación personalizada para proyectos en diseño — dibujos, muestras de acabados, cotizaciones firmadas. Contáctanos y te conectamos con el especialista adecuado.",
    },
    primary: { en: "Contact the team", es: "Contactar al equipo" },
    secondary: { en: "Trade Program", es: "Programa Trade" },
  },
};

interface FAQItemProps {
  num: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem = ({ num, question, answer, isOpen, onToggle }: FAQItemProps) => (
  <div className="border-t border-brand-stone/15 first:border-t-0">
    <button
      onClick={onToggle}
      className="w-full grid grid-cols-[auto_1fr_auto] items-baseline gap-4 md:gap-6 py-6 md:py-7 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus-visible:ring-offset-brand-linen"
      aria-expanded={isOpen}
    >
      <span className="font-mono text-[10px] tracking-[0.25em] text-brand-copper">
        {num}
      </span>
      <span className="font-display text-lg md:text-xl font-light text-brand-charcoal leading-snug">
        {question}
      </span>
      <span className="text-brand-charcoal/60 self-center">
        {isOpen ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </span>
    </button>
    <div
      className={`grid transition-all duration-300 ease-out ${
        isOpen ? "grid-rows-[1fr] opacity-100 pb-6 md:pb-8" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto] gap-4 md:gap-6">
          <span className="font-mono text-[10px] tracking-[0.25em] text-transparent select-none">
            {num}
          </span>
          <p className="font-body text-base text-dash-text-secondary leading-relaxed max-w-3xl">
            {answer}
          </p>
          <span className="w-5" />
        </div>
      </div>
    </div>
  </div>
);

export const ResourcesContent = ({ brandCards }: { brandCards: BrandCard[] }) => {
  const locale = useLocale() as "en" | "es";
  const t = (en: string, es: string) => (locale === "es" ? es : en);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [glossaryFilter, setGlossaryFilter] = useState<string>("all");

  const categories = [
    "all",
    "material",
    "technique",
    "standard",
    "product",
    "design",
  ] as const;
  const categoryLabels: Record<string, { en: string; es: string }> = {
    all: { en: "All", es: "Todo" },
    material: { en: "Materials", es: "Materiales" },
    technique: { en: "Techniques", es: "Técnicas" },
    standard: { en: "Standards", es: "Estándares" },
    product: { en: "Products", es: "Productos" },
    design: { en: "Design", es: "Diseño" },
  };

  const filteredTerms =
    glossaryFilter === "all"
      ? glossaryTerms
      : glossaryTerms.filter((term) => term.category === glossaryFilter);
  const sortedTerms = [...filteredTerms].sort((a, b) =>
    a.term.en.localeCompare(b.term.en)
  );

  return (
    <>
      <Header locale={locale} />
      <main id="main" tabIndex={-1}>
        {/* HERO — full-bleed image, editorial overlay */}
        <section className="relative min-h-[88vh] md:min-h-[90vh] flex items-end overflow-hidden bg-brand-charcoal">
          <Image
            src={HERO_IMAGE}
            alt={t(
              "A specifier's reference for fine fixtures — Counter Cultures",
              "Una referencia del especificador para accesorios finos — Counter Cultures"
            )}
            fill
            sizes="100vw"
            priority
            className="object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/55 to-brand-charcoal/15" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-charcoal/40 to-transparent" />

          {/* hairline corner accents */}
          <div className="hidden lg:block absolute top-28 left-8 w-8 h-px bg-brand-copper/60" />
          <div className="hidden lg:block absolute top-28 left-8 h-8 w-px bg-brand-copper/60" />
          <div className="hidden lg:block absolute bottom-8 right-8 w-8 h-px bg-brand-copper/60" />
          <div className="hidden lg:block absolute bottom-8 right-8 h-8 w-px bg-brand-copper/60" />

          <div className="relative mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 pt-32">
            <AnimatedSection>
              <div className="flex items-center gap-4">
                <span className="h-px w-12 bg-brand-copper" aria-hidden />
                <span className="font-mono text-[11px] tracking-[0.32em] text-brand-copper uppercase">
                  {content.hero.eyebrow[locale]}
                </span>
              </div>
              <h1 className="mt-7 font-display text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-light text-white leading-[1.02] tracking-wide max-w-5xl">
                {content.hero.title[locale]}
              </h1>
              <p className="mt-7 font-body text-base md:text-lg text-white/75 max-w-2xl leading-relaxed">
                {content.hero.subtitle[locale]}
              </p>

              {/* hero meta strip */}
              <div className="mt-12 flex flex-wrap items-baseline gap-x-8 gap-y-3 font-mono text-[10px] tracking-[0.25em] uppercase text-white/55">
                <span>
                  <span className="text-brand-copper">{glossaryTerms.length}</span>{" "}
                  {t("Terms", "Términos")}
                </span>
                <span aria-hidden className="text-white/25">·</span>
                <span>
                  <span className="text-brand-copper">{brandCards.length}</span>{" "}
                  {t("Brands", "Marcas")}
                </span>
                <span aria-hidden className="text-white/25">·</span>
                <span>
                  <span className="text-brand-copper">EN</span> /{" "}
                  <span className="text-brand-copper">ES</span>
                </span>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* CHAPTER INDEX — table-of-contents strip on linen */}
        <section className="bg-brand-linen border-b border-brand-stone/15">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 md:gap-3 py-5 md:py-6 overflow-x-auto scrollbar-hide">
              <span className="hidden md:inline font-mono text-[10px] tracking-[0.3em] uppercase text-dash-text-muted shrink-0 mr-4">
                {t("Contents", "Índice")} ⎯
              </span>
              {content.chapters.map((c) => (
                <a
                  key={c.slug}
                  href={`#${c.slug}`}
                  className="group flex items-baseline gap-2 px-3 py-1.5 rounded-sm hover:bg-brand-stone/10 transition-colors shrink-0"
                >
                  <span className="font-mono text-[10px] tracking-[0.2em] text-brand-copper">
                    {c.num}
                  </span>
                  <span className="font-body text-sm text-brand-charcoal group-hover:text-brand-terracotta transition-colors whitespace-nowrap">
                    {c.label[locale]}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* §01 — QUICK ACCESS / SPECIFICATIONS */}
        <section id="specs" className="py-20 md:py-32 bg-dash-surface scroll-mt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="grid md:grid-cols-12 gap-8 mb-14 md:mb-20">
                <div className="md:col-span-5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] tracking-[0.32em] text-brand-copper uppercase">
                      {t("01 — Specifications", "01 — Especificaciones")}
                    </span>
                  </div>
                  <h2 className="mt-5 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.1]">
                    {t(
                      "Documentation, on request.",
                      "Documentación, a solicitud."
                    )}
                  </h2>
                </div>
                <div className="md:col-span-6 md:col-start-7 md:pt-3">
                  <p className="font-body text-base md:text-lg text-dash-text-secondary leading-relaxed">
                    {t(
                      "Three reference packets we keep on hand for every product in the catalog. Architects and contractors get the full set; homeowners get what they need.",
                      "Tres paquetes de referencia que mantenemos para cada producto del catálogo. Arquitectos y contratistas reciben el set completo; los propietarios reciben lo que necesitan."
                    )}
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-brand-stone/15 border border-brand-stone/15">
              {content.quickAccess.map((card, i) => {
                const Icon = card.icon;
                return (
                  <AnimatedSection key={i} delay={i * 0.08}>
                    <Link
                      href={`/${locale}${card.href}`}
                      className="group relative flex flex-col h-full bg-dash-surface p-8 md:p-10 hover:bg-brand-linen transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] tracking-[0.3em] text-brand-copper">
                          {card.num}
                        </span>
                        <Icon
                          className="w-5 h-5 text-brand-stone group-hover:text-brand-terracotta transition-colors"
                          strokeWidth={1.25}
                        />
                      </div>
                      <h3 className="mt-10 md:mt-14 font-display text-2xl md:text-3xl font-light text-brand-charcoal leading-tight">
                        {card.title[locale]}
                      </h3>
                      <p className="mt-4 font-body text-sm md:text-base text-dash-text-secondary leading-relaxed flex-1">
                        {card.description[locale]}
                      </p>
                      <div className="mt-8 flex items-center gap-2 font-mono text-[11px] tracking-[0.25em] uppercase text-brand-charcoal group-hover:text-brand-terracotta transition-colors">
                        <span>{card.cta[locale]}</span>
                        <ArrowUpRight
                          className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          strokeWidth={1.5}
                        />
                      </div>
                    </Link>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>

        {/* §02 — ORDERING */}
        <section id="ordering" className="py-20 md:py-32 bg-brand-linen scroll-mt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-12 gap-8 md:gap-12">
              <div className="md:col-span-4 md:sticky md:top-28 md:self-start">
                <AnimatedSection>
                  <span className="font-mono text-[11px] tracking-[0.32em] text-brand-copper uppercase">
                    {content.ordering.eyebrow[locale]}
                  </span>
                  <h2 className="mt-5 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.05]">
                    {content.ordering.title[locale]}
                  </h2>
                  <p className="mt-5 font-body text-sm md:text-base text-dash-text-secondary leading-relaxed max-w-md">
                    {content.ordering.subtitle[locale]}
                  </p>
                </AnimatedSection>
              </div>

              <div className="md:col-span-7 md:col-start-6">
                <AnimatedSection>
                  <div>
                    {content.ordering.faqs.map((faq, i) => (
                      <FAQItem
                        key={i}
                        num={String(i + 1).padStart(2, "0")}
                        question={faq.q[locale]}
                        answer={faq.a[locale]}
                        isOpen={openFaq === i}
                        onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                      />
                    ))}
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </section>

        {/* §03 — BRAND INDEX — full-bleed marquee strip */}
        <section id="brands" className="py-20 md:py-32 bg-dash-surface scroll-mt-24 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="grid md:grid-cols-12 gap-8 mb-12 md:mb-16">
                <div className="md:col-span-7">
                  <span className="font-mono text-[11px] tracking-[0.32em] text-brand-copper uppercase">
                    {content.brands.eyebrow[locale]}
                  </span>
                  <h2 className="mt-5 font-display text-3xl md:text-5xl lg:text-6xl font-light tracking-wide text-brand-charcoal leading-[1.05]">
                    {content.brands.title[locale]}
                  </h2>
                </div>
                <div className="md:col-span-4 md:col-start-9 md:pt-2">
                  <p className="font-body text-sm md:text-base text-dash-text-secondary leading-relaxed">
                    {content.brands.intro[locale]}
                  </p>
                  <div className="mt-5 flex items-baseline gap-2 font-mono text-[10px] tracking-[0.25em] uppercase">
                    <span className="text-brand-copper text-base">{brandCards.length}</span>
                    <span className="text-dash-text-muted">{t("Brands", "Marcas")}</span>
                    <span className="text-dash-text-muted/40 mx-2">·</span>
                    <span className="text-brand-copper text-base">
                      {brandCards.reduce((sum, b) => sum + b.count, 0)}
                    </span>
                    <span className="text-dash-text-muted">{t("Products", "Productos")}</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* full-bleed marquee — pauses on hover/focus, respects prefers-reduced-motion */}
          <AnimatedSection>
            <div
              className="relative"
              role="region"
              aria-label={t("Brand index — auto-scrolling carousel", "Índice de marcas — carrusel auto-deslizante")}
            >
              <div className="cc-marquee-track flex w-max gap-4 md:gap-5 px-4 sm:px-6 lg:px-8">
                {[...brandCards, ...brandCards].map((brand, i) => {
                  const tileImage = brand.heroImage || brand.productImage;
                  const isClone = i >= brandCards.length;
                  return (
                    <Link
                      key={`${brand.slug}-${i}`}
                      href={brand.href}
                      aria-hidden={isClone || undefined}
                      tabIndex={isClone ? -1 : 0}
                      aria-label={
                        isClone
                          ? undefined
                          : `${brand.name} — ${brand.count} ${t(
                              brand.count === 1 ? "product" : "products",
                              brand.count === 1 ? "producto" : "productos"
                            )}`
                      }
                      className="group relative shrink-0 block w-[200px] sm:w-[220px] md:w-[240px] aspect-[4/5] rounded-lg overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
                    >
                      {tileImage ? (
                        <Image
                          src={tileImage}
                          alt=""
                          fill
                          sizes="240px"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-brand-linen" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/90 via-brand-charcoal/25 to-transparent" />

                      {/* count chip */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-baseline gap-1.5 font-mono text-[9px] tracking-[0.22em] uppercase text-white/95 bg-brand-charcoal/45 backdrop-blur-sm px-2 py-1 rounded-sm">
                          {brand.count > 0 ? (
                            <>
                              <span className="text-brand-copper">{brand.count}</span>
                              <span>
                                {t(
                                  brand.count === 1 ? "Product" : "Products",
                                  brand.count === 1 ? "Producto" : "Productos"
                                )}
                              </span>
                            </>
                          ) : (
                            <span>{t("Coming Soon", "Próximamente")}</span>
                          )}
                        </span>
                      </div>

                      {/* name + view */}
                      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-white">
                        <h3 className="font-display text-xl md:text-2xl leading-tight">
                          {brand.name}
                        </h3>
                        <p className="mt-2 font-mono text-[9px] tracking-[0.22em] uppercase text-brand-copper inline-flex items-center gap-1.5 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          {t("View", "Ver")}
                          <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* edge fades — match section bg */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-24 bg-gradient-to-r from-dash-surface to-transparent z-20" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-24 bg-gradient-to-l from-dash-surface to-transparent z-20" />
            </div>
          </AnimatedSection>
        </section>

        {/* §04 — GLOSSARY */}
        <section id="glossary" className="py-20 md:py-32 bg-brand-linen scroll-mt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-12 gap-8 md:gap-12">
              <div className="md:col-span-4 md:sticky md:top-28 md:self-start">
                <AnimatedSection>
                  <span className="font-mono text-[11px] tracking-[0.32em] text-brand-copper uppercase">
                    {content.glossary.eyebrow[locale]}
                  </span>
                  <h2 className="mt-5 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.05]">
                    {content.glossary.title[locale]}
                  </h2>
                  <p className="mt-5 font-body text-sm md:text-base text-dash-text-secondary leading-relaxed max-w-md">
                    {content.glossary.intro[locale]}
                  </p>

                  {/* category filter */}
                  <div className="mt-8 flex flex-wrap gap-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setGlossaryFilter(cat)}
                        className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] uppercase border transition-colors cursor-pointer ${
                          glossaryFilter === cat
                            ? "border-brand-charcoal bg-brand-charcoal text-brand-linen"
                            : "border-brand-stone/30 text-brand-charcoal hover:border-brand-charcoal"
                        }`}
                      >
                        {categoryLabels[cat][locale]}
                      </button>
                    ))}
                  </div>

                  <p className="mt-6 font-mono text-[10px] tracking-[0.22em] uppercase text-dash-text-muted">
                    <span className="text-brand-copper">
                      {String(sortedTerms.length).padStart(2, "0")}
                    </span>{" "}
                    {t("Entries", "Entradas")}
                  </p>
                </AnimatedSection>
              </div>

              <div className="md:col-span-7 md:col-start-6">
                <AnimatedSection>
                  <dl>
                    {sortedTerms.map((term, i) => (
                      <div
                        key={term.term.en}
                        className="grid grid-cols-[auto_1fr] gap-4 md:gap-6 py-7 border-t border-brand-stone/15 first:border-t-0"
                      >
                        <span className="font-mono text-[10px] tracking-[0.25em] text-dash-text-muted pt-2">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <dt className="font-display text-2xl md:text-3xl font-light text-brand-charcoal leading-tight">
                              {term.term[locale]}
                            </dt>
                            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-brand-copper">
                              {categoryLabels[term.category][locale]}
                            </span>
                          </div>
                          <dd className="mt-3 font-body text-base text-dash-text-secondary leading-relaxed max-w-2xl">
                            {term.definition[locale]}
                          </dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </section>

        {/* §05 — WARRANTY */}
        <section id="warranty" className="py-20 md:py-32 bg-dash-surface scroll-mt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="grid md:grid-cols-12 gap-8 mb-12 md:mb-16">
                <div className="md:col-span-6">
                  <span className="font-mono text-[11px] tracking-[0.32em] text-brand-copper uppercase">
                    {content.warranty.eyebrow[locale]}
                  </span>
                  <h2 className="mt-5 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.05]">
                    {content.warranty.title[locale]}
                  </h2>
                </div>
                <div className="md:col-span-5 md:col-start-8 md:pt-2">
                  <p className="font-body text-sm md:text-base text-dash-text-secondary leading-relaxed">
                    {content.warranty.subtitle[locale]}
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="border-t-2 border-brand-charcoal">
                {/* table header */}
                <div className="hidden md:grid grid-cols-[auto_2fr_2fr_2fr] gap-6 py-4 border-b border-brand-stone/20">
                  <span className="w-6" />
                  <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-dash-text-muted">
                    {t("Brand", "Marca")}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-dash-text-muted">
                    {t("Residential", "Residencial")}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-dash-text-muted">
                    {t("Commercial", "Comercial")}
                  </span>
                </div>

                {content.warranty.items.map((item, i) => {
                  const brandName =
                    typeof item.brand === "string" ? item.brand : item.brand[locale];
                  return (
                    <div
                      key={brandName}
                      className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_2fr_2fr_2fr] gap-x-6 gap-y-3 md:gap-y-0 py-5 md:py-6 border-b border-brand-stone/15 hover:bg-brand-linen/40 transition-colors"
                    >
                      <span className="font-mono text-[10px] tracking-[0.25em] text-dash-text-muted self-center md:self-center w-6">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-lg md:text-xl text-brand-charcoal leading-tight self-center">
                        {brandName}
                      </span>
                      <div className="col-start-2 md:col-start-3 md:row-start-1">
                        <span className="md:hidden block font-mono text-[9px] tracking-[0.22em] uppercase text-dash-text-muted mb-1">
                          {t("Residential", "Residencial")}
                        </span>
                        <span className="font-body text-sm text-dash-text-secondary md:self-center">
                          {item.residential[locale]}
                        </span>
                      </div>
                      <div className="col-start-2 md:col-start-4 md:row-start-1">
                        <span className="md:hidden block font-mono text-[9px] tracking-[0.22em] uppercase text-dash-text-muted mb-1">
                          {t("Commercial", "Comercial")}
                        </span>
                        <span className="font-body text-sm text-dash-text-secondary md:self-center">
                          {item.commercial[locale]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-8 font-mono text-[10px] tracking-[0.25em] uppercase text-dash-text-muted max-w-2xl leading-relaxed">
                {t(
                  "Terms approximate. Coverage subject to current manufacturer policy and confirmed on the order acknowledgment.",
                  "Términos aproximados. Cobertura sujeta a la política actual del fabricante y confirmada en el acuse del pedido."
                )}
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 md:py-32 bg-brand-charcoal overflow-hidden">
          {/* subtle radial accent */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(196, 114, 90, 0.25), transparent 70%)",
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <AnimatedSection>
              <span className="font-mono text-[11px] tracking-[0.32em] text-brand-copper uppercase">
                {t("Still Specifying", "Sigues Especificando")}
              </span>
              <h2 className="mt-6 font-display text-3xl md:text-5xl lg:text-6xl font-light text-white tracking-wide leading-[1.05]">
                {content.cta.title[locale]}
              </h2>
              <p className="mt-6 font-body text-base md:text-lg text-white/65 leading-relaxed max-w-2xl mx-auto">
                {content.cta.subtitle[locale]}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="primary" size="lg" href="/contact">
                  {content.cta.primary[locale]}
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
