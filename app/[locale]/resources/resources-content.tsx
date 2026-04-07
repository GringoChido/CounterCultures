"use client";

import { useState } from "react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { glossaryTerms } from "@/app/lib/glossary";
import { BRANDS } from "@/app/lib/constants";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  FileText,
  Wrench,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ExternalLink,
} from "lucide-react";

const content = {
  hero: {
    eyebrow: { en: "Resources", es: "Recursos" },
    title: {
      en: "Everything You Need to Specify with Confidence",
      es: "Todo Lo Que Necesitas para Especificar con Confianza",
    },
    subtitle: {
      en: "Technical specifications, care guides, brand resources, and industry glossary — all in one place.",
      es: "Especificaciones técnicas, guías de cuidado, recursos de marca y glosario de la industria — todo en un solo lugar.",
    },
  },
  quickAccess: [
    {
      icon: FileText,
      title: { en: "Specification Sheets", es: "Fichas Técnicas" },
      description: {
        en: "Downloadable cut sheets, CAD files, and rough-in specifications for all major brands. Available through our Trade Program.",
        es: "Fichas técnicas descargables, archivos CAD y especificaciones de instalación para todas las marcas principales. Disponibles a través de nuestro Programa Trade.",
      },
      cta: { en: "Request Spec Sheets", es: "Solicitar Fichas" },
      href: "/contact",
    },
    {
      icon: Wrench,
      title: { en: "Care & Maintenance", es: "Cuidado y Mantenimiento" },
      description: {
        en: "Product-specific care guides for copper, bronze, Silgranit, porcelain, and other materials. Bilingual guides available for your maintenance team.",
        es: "Guías de cuidado específicas para cobre, bronce, Silgranit, porcelana y otros materiales. Guías bilingües disponibles para tu equipo de mantenimiento.",
      },
      cta: { en: "View Care Guides", es: "Ver Guías de Cuidado" },
      href: "/insights",
    },
    {
      icon: ShieldCheck,
      title: { en: "Installation Guides", es: "Guías de Instalación" },
      description: {
        en: "Step-by-step installation documentation and plumber reference sheets. Includes rough-in dimensions and water supply requirements.",
        es: "Documentación de instalación paso a paso y hojas de referencia para plomeros. Incluye dimensiones de instalación y requisitos de suministro de agua.",
      },
      cta: { en: "View Guides", es: "Ver Guías" },
      href: "/contact",
    },
  ],
  ordering: {
    title: { en: "How Ordering Works", es: "Cómo Funciona el Pedido" },
    subtitle: {
      en: "From specification to delivery — what to expect when ordering through Counter Cultures.",
      es: "Desde la especificación hasta la entrega — qué esperar al ordenar a través de Counter Cultures.",
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
          en: "Unopened items in original packaging can be returned within 30 days for a full refund or exchange. Opened items are eligible for exchange only, within 15 days. Custom-order and artisanal pieces are non-returnable. Damaged items are replaced at no charge — document any shipping damage and contact us within 48 hours of delivery.",
          es: "Artículos sin abrir en empaque original pueden devolverse dentro de 30 días para reembolso completo o cambio. Artículos abiertos son elegibles solo para cambio, dentro de 15 días. Piezas personalizadas y artesanales no son retornables. Artículos dañados se reemplazan sin cargo.",
        },
      },
      {
        q: {
          en: "Can I visit the showroom to see products before ordering?",
          es: "¿Puedo visitar el showroom para ver productos antes de ordenar?",
        },
        a: {
          en: "Absolutely. Our San Miguel de Allende showroom displays products from all 12 brands, including working faucet demonstrations and material samples. Walk-ins are welcome Monday–Friday, 10:00–18:00. For Trade Program consultations, we recommend booking an appointment to ensure a dedicated specialist is available.",
          es: "Absolutamente. Nuestro showroom en San Miguel de Allende exhibe productos de las 12 marcas, incluyendo demostraciones de grifos en funcionamiento y muestras de materiales. Visitas sin cita bienvenidas lunes a viernes, 10:00–18:00.",
        },
      },
      {
        q: {
          en: "What payment methods do you accept?",
          es: "¿Qué métodos de pago aceptan?",
        },
        a: {
          en: "We accept bank transfers (SPEI), credit cards (Visa, Mastercard, Amex), and cash (MXN or USD). For orders over MXN 50,000, we offer a 50/50 payment split — 50% at order, 50% upon delivery. Trade Program members may qualify for net-30 terms on approved credit.",
          es: "Aceptamos transferencias bancarias (SPEI), tarjetas de crédito (Visa, Mastercard, Amex) y efectivo (MXN o USD). Para pedidos mayores a MXN 50,000, ofrecemos un esquema 50/50 — 50% al ordenar, 50% a la entrega.",
        },
      },
    ],
  },
  warranty: {
    title: { en: "Warranty Coverage", es: "Cobertura de Garantía" },
    subtitle: {
      en: "Warranty terms vary by manufacturer and application type. Here's a quick reference.",
      es: "Los términos de garantía varían por fabricante y tipo de aplicación. Aquí una referencia rápida.",
    },
    items: [
      { brand: "Kohler", residential: "Lifetime limited", commercial: "1 year (3-year on commercial lines)" },
      { brand: "TOTO", residential: "1 year (5-year Cefiontect)", commercial: "1 year (3-year Washlet)" },
      { brand: "Brizo", residential: "Lifetime (finish + function)", commercial: "Limited lifetime (5-year finish)" },
      { brand: "BLANCO", residential: "Limited lifetime", commercial: "2 years" },
      { brand: "California Faucets", residential: "Lifetime", commercial: "5 years" },
      { brand: "Sun Valley Bronze", residential: "10 years", commercial: "10 years" },
      { brand: "Emtek", residential: "Lifetime mechanical", commercial: "5 years" },
      { brand: "Badeloft", residential: "25 years (surface)", commercial: "10 years" },
      { brand: "Artisanal (Counter Cultures)", residential: "5 years structural", commercial: "3 years structural" },
    ],
  },
};

const FAQItem = ({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <div className="border-b border-brand-stone/10">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-5 min-h-[56px] text-left cursor-pointer gap-4"
    >
      <span className="font-body text-base font-medium text-brand-charcoal">
        {question}
      </span>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-brand-terracotta shrink-0" />
      ) : (
        <ChevronDown className="w-5 h-5 text-brand-stone shrink-0" />
      )}
    </button>
    {isOpen && (
      <div className="pb-5">
        <p className="font-body text-sm text-brand-stone leading-relaxed">
          {answer}
        </p>
      </div>
    )}
  </div>
);

export const ResourcesContent = () => {
  const locale = useLocale() as "en" | "es";
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [glossaryFilter, setGlossaryFilter] = useState<string>("all");

  const categories = ["all", "material", "technique", "standard", "product", "design"] as const;
  const categoryLabels: Record<string, { en: string; es: string }> = {
    all: { en: "All", es: "Todos" },
    material: { en: "Materials", es: "Materiales" },
    technique: { en: "Techniques", es: "Técnicas" },
    standard: { en: "Standards", es: "Estándares" },
    product: { en: "Products", es: "Productos" },
    design: { en: "Design", es: "Diseño" },
  };

  const filteredTerms = glossaryFilter === "all"
    ? glossaryTerms
    : glossaryTerms.filter((t) => t.category === glossaryFilter);

  const sortedTerms = [...filteredTerms].sort((a, b) =>
    a.term.en.localeCompare(b.term.en)
  );

  return (
    <>
      <Header locale={locale} />
      <main>
        {/* Hero */}
        <section className="pt-28 pb-12 md:pt-40 md:pb-20 bg-brand-charcoal">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                {content.hero.eyebrow[locale]}
              </span>
              <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-7xl font-light text-white tracking-wide">
                {content.hero.title[locale]}
              </h1>
              <p className="mt-6 font-body text-base text-white/60 max-w-2xl leading-relaxed">
                {content.hero.subtitle[locale]}
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Quick Access Cards */}
        <section className="py-12 md:py-28 bg-brand-linen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {content.quickAccess.map((card, i) => {
                const Icon = card.icon;
                return (
                  <AnimatedSection key={i} delay={i * 0.1}>
                    <div className="flex flex-col h-full bg-white rounded-lg p-8 border border-brand-stone/10">
                      <div className="w-12 h-12 rounded-full bg-brand-terracotta/10 flex items-center justify-center mb-6">
                        <Icon className="w-6 h-6 text-brand-terracotta" />
                      </div>
                      <h3 className="font-display text-2xl text-brand-charcoal">
                        {card.title[locale]}
                      </h3>
                      <p className="mt-3 font-body text-sm text-brand-stone leading-relaxed flex-1">
                        {card.description[locale]}
                      </p>
                      <div className="mt-6">
                        <Button variant="ghost" size="sm" href={`/${locale}${card.href}`}>
                          {card.cta[locale]} →
                        </Button>
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>

        {/* Ordering FAQ */}
        <section className="py-12 md:py-28 bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                FAQ
              </span>
              <h2 className="mt-4 font-display text-4xl md:text-5xl font-light text-brand-charcoal tracking-wide">
                {content.ordering.title[locale]}
              </h2>
              <p className="mt-4 font-body text-base text-brand-stone leading-relaxed">
                {content.ordering.subtitle[locale]}
              </p>
            </AnimatedSection>

            <div className="mt-12">
              {content.ordering.faqs.map((faq, i) => (
                <FAQItem
                  key={i}
                  question={faq.q[locale]}
                  answer={faq.a[locale]}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Brand Resource Hub */}
        <section className="py-12 md:py-28 bg-brand-linen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                {locale === "es" ? "Marcas" : "Brands"}
              </span>
              <h2 className="mt-4 font-display text-3xl md:text-5xl font-light text-brand-charcoal tracking-wide">
                {locale === "es"
                  ? "Centro de Recursos de Marca"
                  : "Brand Resource Hub"}
              </h2>
              <p className="mt-4 font-body text-base text-brand-stone leading-relaxed max-w-2xl">
                {locale === "es"
                  ? "Explora los catálogos, líneas de productos e información de cada marca que llevamos."
                  : "Explore catalogs, product lines, and information for each brand we carry."}
              </p>
            </AnimatedSection>

            <div className="mt-10 md:mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {BRANDS.map((brand) => (
                <AnimatedSection key={brand.slug}>
                  <Link
                    href={`/${locale}/brands/${brand.slug}`}
                    className="group flex items-center gap-3 bg-white rounded-lg p-5 border border-brand-stone/10 hover:border-brand-terracotta/30 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-body text-sm font-semibold text-brand-charcoal group-hover:text-brand-terracotta transition-colors">
                        {brand.name}
                      </h3>
                    </div>
                    <ExternalLink className="w-4 h-4 text-brand-stone/40 group-hover:text-brand-terracotta transition-colors" />
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Glossary */}
        <section className="py-12 md:py-28 bg-white" id="glossary">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-brand-copper" />
                <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                  {locale === "es" ? "Glosario" : "Glossary"}
                </span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-light text-brand-charcoal tracking-wide">
                {locale === "es"
                  ? "Glosario de la Industria"
                  : "Industry Glossary"}
              </h2>
              <p className="mt-4 font-body text-base text-brand-stone leading-relaxed max-w-2xl">
                {locale === "es"
                  ? "Términos clave del mundo de accesorios de baño, cocina y herraje — explicados claramente."
                  : "Key terms from the world of bath, kitchen, and hardware fixtures — clearly explained."}
              </p>
            </AnimatedSection>

            {/* Category Filter */}
            <div className="mt-8 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setGlossaryFilter(cat)}
                  className={`px-4 py-2.5 min-h-[44px] text-sm font-body border rounded-full transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                    glossaryFilter === cat
                      ? "border-brand-terracotta text-brand-terracotta bg-brand-terracotta/5"
                      : "border-brand-stone/20 text-brand-charcoal hover:border-brand-terracotta hover:text-brand-terracotta"
                  }`}
                >
                  {categoryLabels[cat][locale]}
                </button>
              ))}
            </div>

            {/* Terms List */}
            <dl className="mt-10 space-y-0 divide-y divide-brand-stone/10">
              {sortedTerms.map((term) => (
                <div key={term.term.en} className="py-6">
                  <dt className="font-display text-xl text-brand-charcoal">
                    {term.term[locale]}
                    <span className="ml-3 inline-block px-2 py-0.5 text-[10px] font-body font-medium tracking-wider text-brand-stone uppercase bg-brand-linen rounded">
                      {categoryLabels[term.category][locale]}
                    </span>
                  </dt>
                  <dd className="mt-2 font-body text-sm text-brand-stone leading-relaxed">
                    {term.definition[locale]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Warranty Table */}
        <section className="py-12 md:py-28 bg-brand-linen">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                {locale === "es" ? "Garantía" : "Warranty"}
              </span>
              <h2 className="mt-4 font-display text-4xl md:text-5xl font-light text-brand-charcoal tracking-wide">
                {content.warranty.title[locale]}
              </h2>
              <p className="mt-4 font-body text-base text-brand-stone leading-relaxed">
                {content.warranty.subtitle[locale]}
              </p>
            </AnimatedSection>

            <div className="mt-12 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-brand-charcoal">
                    <th className="text-left py-3 font-body font-semibold text-xs tracking-wider text-brand-charcoal uppercase">
                      {locale === "es" ? "Marca" : "Brand"}
                    </th>
                    <th className="text-left py-3 font-body font-semibold text-xs tracking-wider text-brand-charcoal uppercase">
                      {locale === "es" ? "Residencial" : "Residential"}
                    </th>
                    <th className="text-left py-3 font-body font-semibold text-xs tracking-wider text-brand-charcoal uppercase">
                      {locale === "es" ? "Comercial" : "Commercial"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {content.warranty.items.map((item) => (
                    <tr
                      key={item.brand}
                      className="border-b border-brand-stone/10"
                    >
                      <td className="py-4 font-body text-sm font-medium text-brand-charcoal">
                        {item.brand}
                      </td>
                      <td className="py-4 font-body text-sm text-brand-stone">
                        {item.residential}
                      </td>
                      <td className="py-4 font-body text-sm text-brand-stone">
                        {item.commercial}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 font-body text-xs text-brand-stone/60">
              {locale === "es"
                ? "Los términos de garantía son aproximados y están sujetos a las políticas actuales del fabricante. Contacta a Counter Cultures para detalles específicos de cobertura."
                : "Warranty terms are approximate and subject to current manufacturer policies. Contact Counter Cultures for specific coverage details."}
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 md:py-28 bg-brand-charcoal">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <AnimatedSection>
              <h2 className="font-display text-4xl md:text-5xl font-light text-white tracking-wide">
                {locale === "es"
                  ? "¿Necesitas Algo Específico?"
                  : "Need Something Specific?"}
              </h2>
              <p className="mt-4 font-body text-base text-white/60 leading-relaxed">
                {locale === "es"
                  ? "Nuestro equipo de especificación puede preparar documentación personalizada para tu proyecto. Contáctanos directamente."
                  : "Our specification team can prepare custom documentation for your project. Contact us directly."}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button variant="primary" href={`/${locale}/contact`}>
                  {locale === "es" ? "Contactar Equipo" : "Contact Team"}
                </Button>
                <Button variant="secondary" href={`/${locale}/trade`} className="border-white text-white hover:bg-white hover:text-brand-charcoal">
                  {locale === "es" ? "Programa Trade" : "Trade Program"}
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
