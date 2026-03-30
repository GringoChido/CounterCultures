import type { Metadata } from "next";
import { TradeContent } from "./trade-content";

const BASE_URL = "https://countercultures.mx";

interface TradePageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: TradePageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Programa Trade — Precios y Soporte para Arquitectos y Diseñadores"
    : "Trade Program — Pricing & Support for Architects and Designers";
  const description = isEs
    ? "Precios exclusivos, soporte de especificaciones y atención prioritaria para arquitectos, diseñadores de interiores y constructores en México. Solicita acceso en 2 minutos."
    : "Exclusive pricing, specification support, and priority fulfillment for architects, interior designers, and builders in Mexico. Apply for access in 2 minutes.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/trade`,
      languages: {
        en: `${BASE_URL}/en/trade`,
        es: `${BASE_URL}/es/trade`,
        "x-default": `${BASE_URL}/en/trade`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/trade`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Programa Trade Counter Cultures para arquitectos y diseñadores"
            : "Counter Cultures Trade Program for architects and designers",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80"],
    },
  };
};

const TradePage = async ({ params }: TradePageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";

  // AEO: FAQ schema for trade program questions
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: isEs
      ? [
          {
            "@type": "Question",
            name: "¿Quién puede solicitar el Programa Trade de Counter Cultures?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "El Programa Trade está disponible para arquitectos, diseñadores de interiores, constructores, contratistas y desarrolladores en México. Se requiere verificación profesional (cédula, registro de empresa o portafolio de proyectos).",
            },
          },
          {
            "@type": "Question",
            name: "¿Qué beneficios incluye el Programa Trade?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Los miembros Trade reciben: precios exclusivos en las 12 marcas, soporte de especificaciones técnicas, cumplimiento prioritario de pedidos, un gerente de cuenta dedicado, acceso a presentaciones privadas en el showroom para clientes, y muestras de materiales para proyectos activos.",
            },
          },
          {
            "@type": "Question",
            name: "¿Cuánto tiempo toma obtener acceso al Programa Trade?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "El proceso de solicitud toma menos de 2 minutos. Las solicitudes se revisan en 1–2 días hábiles. Una vez aprobado, tienes acceso inmediato a precios Trade y soporte de cuenta.",
            },
          },
        ]
      : [
          {
            "@type": "Question",
            name: "Who can apply for the Counter Cultures Trade Program?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The Trade Program is available to architects, interior designers, builders, contractors, and developers in Mexico. Professional verification is required (professional ID, company registration, or project portfolio).",
            },
          },
          {
            "@type": "Question",
            name: "What benefits are included in the Trade Program?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Trade members receive: exclusive pricing on all 12 brands, technical specification support, priority order fulfillment, a dedicated account manager, access to private showroom client presentations, and material samples for active projects.",
            },
          },
          {
            "@type": "Question",
            name: "How long does it take to get Trade Program access?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The application takes under 2 minutes. Applications are reviewed within 1–2 business days. Once approved, you have immediate access to Trade pricing and account support.",
            },
          },
          {
            "@type": "Question",
            name: "Does the Trade Program offer net payment terms?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Established Trade Program members may qualify for net-30 payment terms. This is reviewed on a case-by-case basis after the first few orders.",
            },
          },
        ],
  };

  // AEO: HowTo schema — how to apply for the Trade Program
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: isEs
      ? "Cómo solicitar el Programa Trade de Counter Cultures"
      : "How to apply for the Counter Cultures Trade Program",
    description: isEs
      ? "Proceso paso a paso para obtener acceso al Programa Trade de Counter Cultures."
      : "Step-by-step process to gain access to Counter Cultures' Trade Program.",
    step: isEs
      ? [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Completa el formulario de solicitud",
            text: "Rellena el formulario de solicitud Trade en la página del Programa Trade. Solo toma 2 minutos.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Verificación de credenciales",
            text: "Nuestro equipo verifica tu perfil profesional en 1–2 días hábiles.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Recibe tus credenciales Trade",
            text: "Una vez aprobado, recibes acceso a precios exclusivos y un gerente de cuenta dedicado.",
          },
        ]
      : [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Complete the application form",
            text: "Fill out the Trade application form on the Trade Program page. It takes under 2 minutes.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Credential verification",
            text: "Our team verifies your professional profile within 1–2 business days.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Receive your Trade credentials",
            text: "Once approved, you receive access to exclusive pricing and a dedicated account manager.",
          },
        ],
    url: `${BASE_URL}/${locale}/trade`,
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
        name: isEs ? "Programa Trade" : "Trade Program",
        item: `${BASE_URL}/${locale}/trade`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TradeContent />
    </>
  );
};

export default TradePage;
