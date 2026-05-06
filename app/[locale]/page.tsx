import { Suspense } from "react";
import ReactDOM from "react-dom";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { Hero } from "@/app/components/sections/hero";
import { ShopByRoom } from "@/app/components/sections/shop-by-room";
import { FeaturedBrandsBand } from "@/app/components/sections/featured-brands-band";
import { HowItWorksBand } from "@/app/components/sections/how-it-works-band";
import { CatalogDepthBandAsync } from "@/app/components/sections/catalog-depth-band-async";
import { TwoPathsBand } from "@/app/components/sections/two-paths-band";
import { FounderStory } from "@/app/components/sections/founder-story";
import { TradeTeaser } from "@/app/components/sections/trade-teaser";
import { Testimonial } from "@/app/components/sections/testimonial";
import { ContactCTA } from "@/app/components/sections/contact-cta";
import { NewsletterStrip } from "@/app/components/sections/newsletter-strip";
import { getFeaturedBrands } from "@/app/lib/featured-brands";

const BASE_URL = "https://countercultures.mx";

// ISR — homepage content (brands, copy, sections) doesn't change per-request.
// 5-min revalidate lets Netlify's CDN serve cached HTML to ~all visitors and
// only a single background render absorbs the Sheets-cache cold-start cost.
export const revalidate = 300;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: HomePageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Counter Cultures — Accesorios de Lujo para Baño y Cocina en San Miguel de Allende"
    : "Counter Cultures — Luxury Bath & Kitchen Fixtures in San Miguel de Allende";
  const description = isEs
    ? "El showroom principal de San Miguel de Allende para accesorios de lujo de baño, cocina y herrajes. Distribuidor autorizado de Kohler, TOTO, Brizo, BLANCO y piezas artesanales mexicanas."
    : "San Miguel de Allende's premier showroom for luxury bath, kitchen, and hardware fixtures. Authorized dealer for Kohler, TOTO, Brizo, BLANCO, and handcrafted Mexican artisanal pieces.";

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        en: `${BASE_URL}/en`,
        es: `${BASE_URL}/es`,
        "x-default": `${BASE_URL}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: `${BASE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: isEs
            ? "Counter Cultures — showroom de accesorios de lujo en San Miguel de Allende"
            : "Counter Cultures — luxury bath and kitchen fixtures showroom in San Miguel de Allende",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}/og-image.jpg`],
    },
  };
};

const HomePage = async ({ params }: HomePageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale as "en" | "es";
  const isEs = lang === "es";

  // LCP preload — the Hero component is "use client", so the browser can't
  // discover the first slide's image until the React bundle parses. Emit a
  // server-side <link rel="preload"> so the fetch starts in parallel with
  // the HTML stream.
  ReactDOM.preload("/Assets/home-hero/storefront.webp", {
    as: "image",
    fetchPriority: "high",
  });

  // featuredBrands comes from the small Brand Kit sheet (~73 rows) so it's
  // cheap to await on the critical path. The catalog-depth band reads the
  // 354k-row product sheet for a single number, so we stream it via
  // <Suspense> below — the rest of the page renders without waiting.
  const featuredBrands = await getFeaturedBrands().catch(() => []);

  // AEO: FAQ structured data — answers common questions AI assistants surface
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: isEs
      ? [
          {
            "@type": "Question",
            name: "¿Qué marcas de accesorios vende Counter Cultures?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Counter Cultures es distribuidor autorizado de Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, Emtek, Badeloft, Banté, Mistoa, Villeroy & Boch y AquaSpa — además de piezas artesanales de cobre, cerámica y piedra hechas por artesanos mexicanos.",
            },
          },
          {
            "@type": "Question",
            name: "¿Dónde está ubicado el showroom de Counter Cultures?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "El showroom de Counter Cultures está en Providencia, San Miguel de Allende, Guanajuato, México. Abierto de lunes a viernes de 10:00 a 18:00. También atendemos por cita.",
            },
          },
          {
            "@type": "Question",
            name: "¿Tienen programa especial para arquitectos y diseñadores?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Sí. El Programa Trade de Counter Cultures ofrece precios exclusivos, soporte de especificaciones, cumplimiento prioritario y un gerente de cuenta dedicado para arquitectos, diseñadores de interiores y constructores en México.",
            },
          },
          {
            "@type": "Question",
            name: "¿Qué son los accesorios artesanales de Counter Cultures?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La Colección Artesanal incluye lavabos de cobre martillado a mano de Santa Clara del Cobre, lavabos de cerámica Mistoa en 10 colores, tinas y lavabos de piedra riolita de Querétaro, y herrajes de bronce forjado — todos diseñados por Roger Williams y fabricados por artesanos mexicanos.",
            },
          },
        ]
      : [
          {
            "@type": "Question",
            name: "What fixture brands does Counter Cultures carry?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Counter Cultures is an authorized dealer for Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, Emtek, Badeloft, Banté, Mistoa, Villeroy & Boch, and AquaSpa — plus handcrafted copper, ceramic, and stone artisanal pieces made by Mexican artisans.",
            },
          },
          {
            "@type": "Question",
            name: "Where is the Counter Cultures showroom located?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The Counter Cultures showroom is located on Providencia in San Miguel de Allende, Guanajuato, Mexico. Open Monday–Friday, 10:00–18:00. Appointments also available.",
            },
          },
          {
            "@type": "Question",
            name: "Do you have a trade program for architects and designers?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Counter Cultures' Trade Program offers exclusive pricing, specification support, priority fulfillment, and a dedicated account manager for architects, interior designers, and builders in Mexico.",
            },
          },
          {
            "@type": "Question",
            name: "What are Counter Cultures' artisanal fixtures?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The Artisanal Collection includes hand-hammered copper basins from Santa Clara del Cobre, Mistoa ceramic sinks in 10 colorways, riolita stone vessels from Querétaro, and hand-forged bronze hardware — all designed by Roger Williams and crafted by Mexican artisans.",
            },
          },
          {
            "@type": "Question",
            name: "Does Counter Cultures handle import logistics for products?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Counter Cultures manages all import duties, customs brokerage, freight coordination, and regulatory compliance for international brands. You receive a single delivered price.",
            },
          },
        ],
  };

  // GEO: Speakable schema — marks content AI assistants can read aloud
  const speakableJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/${locale}`,
    name: isEs
      ? "Counter Cultures — Accesorios de Lujo para Baño y Cocina"
      : "Counter Cultures — Luxury Bath & Kitchen Fixtures",
    url: `${BASE_URL}/${locale}`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", ".speakable"],
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: isEs ? "Inicio" : "Home",
          item: `${BASE_URL}/${locale}`,
        },
      ],
    },
  };

  return (
    <>
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableJsonLd) }}
      />
      <Header locale={lang} />
      <main id="main" tabIndex={-1}>
        <Hero locale={lang} />
        <ShopByRoom locale={lang} />
        <FeaturedBrandsBand locale={lang} brands={featuredBrands} />
        <Suspense fallback={null}>
          <CatalogDepthBandAsync locale={lang} />
        </Suspense>
        <HowItWorksBand
          locale={lang}
          eyebrow={{ en: "From inquiry to install", es: "De la consulta a la instalación" }}
          headline={{
            en: "Three moves. One team. Zero middlemen.",
            es: "Tres pasos. Un equipo. Cero intermediarios.",
          }}
        />
        <FounderStory locale={lang} />
        <Testimonial locale={lang} />
        <TwoPathsBand locale={lang} />
        <TradeTeaser locale={lang} />
        <ContactCTA locale={lang} />
        <NewsletterStrip locale={lang} />
      </main>
      <Footer locale={lang} />
    </>
  );
};

export default HomePage;
