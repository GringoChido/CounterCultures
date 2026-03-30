import type { Metadata } from "next";
import { ResourcesContent } from "./resources-content";

const BASE_URL = "https://countercultures.mx";

interface ResourcesPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: ResourcesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Recursos — Guías, Glosario y Soporte Técnico"
    : "Resources — Guides, Glossary & Technical Support";
  const description = isEs
    ? "Guías de especificación, recursos de marca, glosario de la industria, información de garantía y soporte técnico para arquitectos, diseñadores y propietarios."
    : "Specification guides, brand resources, industry glossary, warranty information, and technical support for architects, designers, and homeowners.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/resources`,
      languages: {
        en: `${BASE_URL}/en/resources`,
        es: `${BASE_URL}/es/resources`,
        "x-default": `${BASE_URL}/en/resources`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/resources`,
      locale: isEs ? "es_MX" : "en_US",
    },
  };
};

// FAQ structured data for ordering section
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What are typical lead times for international brands?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Standard finishes from Kohler, TOTO, Brizo, and BLANCO: 4–6 weeks including shipping and customs. Special-order finishes: 8–12 weeks. Custom or discontinued items: 12–16 weeks. Artisanal pieces: 3–8 weeks depending on complexity.",
      },
    },
    {
      "@type": "Question",
      name: "Do you handle import logistics and customs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Counter Cultures manages all import duties, customs brokerage, freight coordination, and regulatory compliance. You receive a single delivered price — no separate freight invoices or customs paperwork.",
      },
    },
    {
      "@type": "Question",
      name: "What is your return and exchange policy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Unopened items in original packaging can be returned within 30 days for a full refund or exchange. Opened items are eligible for exchange only, within 15 days. Custom-order and artisanal pieces are non-returnable.",
      },
    },
    {
      "@type": "Question",
      name: "Can I visit the showroom to see products before ordering?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Our San Miguel de Allende showroom displays products from all 12 brands, including working faucet demonstrations and material samples. Walk-ins welcome Monday–Friday, 10:00–18:00.",
      },
    },
    {
      "@type": "Question",
      name: "What payment methods do you accept?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We accept bank transfers (SPEI), credit cards (Visa, Mastercard, Amex), and cash (MXN or USD). For orders over MXN 50,000, we offer a 50/50 payment split. Trade Program members may qualify for net-30 terms.",
      },
    },
  ],
};

const ResourcesPage = () => {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ResourcesContent />
    </>
  );
};

export default ResourcesPage;
