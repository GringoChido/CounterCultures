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
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Recursos técnicos para diseñadores y arquitectos — Counter Cultures"
            : "Technical resources for designers and architects — Counter Cultures",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&q=80"],
    },
  };
};

const ResourcesPage = async ({ params }: ResourcesPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";

  // AEO: Comprehensive FAQPage schema for ordering, logistics, returns
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: isEs
      ? [
          {
            "@type": "Question",
            name: "¿Cuáles son los tiempos de entrega para marcas internacionales?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Acabados estándar de Kohler, TOTO, Brizo y BLANCO: 4–6 semanas incluyendo envío y aduanas. Acabados especiales: 8–12 semanas. Artículos personalizados o descontinuados: 12–16 semanas. Piezas artesanales: 3–8 semanas según la complejidad.",
            },
          },
          {
            "@type": "Question",
            name: "¿Se encargan de la importación y aduanas?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Sí. Counter Cultures gestiona todos los derechos de importación, agencias aduanales, coordinación de flete y cumplimiento normativo. Recibes un único precio entregado — sin facturas de flete separadas ni trámites aduanales.",
            },
          },
          {
            "@type": "Question",
            name: "¿Cuál es su política de devoluciones?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Artículos sin abrir en empaque original pueden devolverse en 30 días para reembolso completo o cambio. Artículos abiertos son elegibles solo para cambio, dentro de 15 días. Piezas de pedido especial y artesanales no son retornables.",
            },
          },
          {
            "@type": "Question",
            name: "¿Puedo visitar el showroom antes de ordenar?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Por supuesto. Nuestro showroom en San Miguel de Allende exhibe productos de las 12 marcas, incluyendo demostraciones de grifos y muestras de materiales. Walk-ins bienvenidos de lunes a viernes, 10:00–18:00.",
            },
          },
          {
            "@type": "Question",
            name: "¿Qué métodos de pago aceptan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Aceptamos transferencias bancarias (SPEI), tarjetas de crédito (Visa, Mastercard, Amex) y efectivo (MXN o USD). Para pedidos mayores de MXN 50,000, ofrecemos pago en partes 50/50. Los miembros del Programa Trade pueden calificar para términos net-30.",
            },
          },
        ]
      : [
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
          {
            "@type": "Question",
            name: "What warranty coverage do products carry?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "All products carry full manufacturer warranties: Kohler lifetime limited, TOTO 1-year parts and labor, Brizo lifetime limited, BLANCO limited lifetime, California Faucets lifetime, Sun Valley Bronze lifetime on finish. Counter Cultures artisanal pieces carry a 1-year craftsmanship warranty.",
            },
          },
        ],
  };

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isEs ? "Inicio" : "Home",
        item: `${BASE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEs ? "Recursos" : "Resources",
        item: `${BASE_URL}/${locale}/resources`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ResourcesContent />
    </>
  );
};

export default ResourcesPage;
