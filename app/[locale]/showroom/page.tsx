import type { Metadata } from "next";
import { ShowroomContent } from "./showroom-content";

const BASE_URL = "https://countercultures.mx";

interface ShowroomPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: ShowroomPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Visita el Showroom — San Miguel de Allende, Guanajuato"
    : "Visit the Showroom — San Miguel de Allende, Guanajuato";
  const description = isEs
    ? "Recorre accesorios de clase mundial de Kohler, TOTO y Brizo junto a piezas artesanales mexicanas — todo bajo un mismo techo en San Miguel de Allende. Programa tu visita."
    : "Walk through world-class fixtures from Kohler, TOTO, and Brizo alongside handcrafted artisanal pieces in San Miguel de Allende. Book your showroom appointment.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/showroom`,
      languages: {
        en: `${BASE_URL}/en/showroom`,
        es: `${BASE_URL}/es/showroom`,
        "x-default": `${BASE_URL}/en/showroom`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/showroom`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Interior del showroom Counter Cultures en San Miguel de Allende"
            : "Counter Cultures showroom interior in San Miguel de Allende",
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

const ShowroomPage = async ({ params }: ShowroomPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";

  // LocalBusiness/Store JSON-LD for the showroom page specifically
  const showroomJsonLd = {
    "@context": "https://schema.org",
    "@type": ["Store", "LocalBusiness"],
    "@id": `${BASE_URL}/#showroom`,
    name: "Counter Cultures Showroom",
    description: isEs
      ? "El showroom principal de San Miguel de Allende para accesorios de lujo de baño, cocina y herrajes. Distribuidor autorizado de Kohler, TOTO, Brizo, BLANCO y más."
      : "San Miguel de Allende's premier showroom for luxury bath, kitchen, and hardware fixtures. Authorized dealer for Kohler, TOTO, Brizo, BLANCO, and more.",
    url: `${BASE_URL}/${locale}/showroom`,
    telephone: "+52-415-154-8375",
    email: "info@countercultures.mx",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Providencia",
      addressLocality: "San Miguel de Allende",
      addressRegion: "Guanajuato",
      postalCode: "37700",
      addressCountry: "MX",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 20.9144,
      longitude: -100.7452,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "10:00",
        closes: "18:00",
      },
    ],
    hasMap: "https://maps.google.com/?q=Counter+Cultures+San+Miguel+de+Allende",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
    priceRange: "$$$",
    currenciesAccepted: "MXN, USD",
  };

  // AEO: FAQ for showroom-specific questions
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: isEs
      ? [
          {
            "@type": "Question",
            name: "¿Necesito cita para visitar el showroom?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No se requiere cita — las visitas walk-in son bienvenidas de lunes a viernes de 10:00 a 18:00. Sin embargo, recomendamos programar una cita para proyectos grandes o consultas de diseño, para que podamos preparar una presentación personalizada.",
            },
          },
          {
            "@type": "Question",
            name: "¿Qué marcas están en exhibición en el showroom?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "El showroom exhibe productos de las 12 marcas principales: Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, Emtek, Badeloft, Mistoa, Villeroy & Boch, AquaSpa y Banté, así como la Colección Artesanal completa con lavabos de cobre, cerámica y piedra.",
            },
          },
          {
            "@type": "Question",
            name: "¿Dónde está ubicado el showroom?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "El showroom de Counter Cultures está en Providencia, San Miguel de Allende, Guanajuato, México. Abierto de lunes a viernes de 10:00 a 18:00.",
            },
          },
        ]
      : [
          {
            "@type": "Question",
            name: "Do I need an appointment to visit the showroom?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No appointment is required — walk-ins are welcome Monday–Friday, 10:00–18:00. However, we recommend booking an appointment for large projects or design consultations so we can prepare a personalized presentation.",
            },
          },
          {
            "@type": "Question",
            name: "What brands are on display in the showroom?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The showroom features products from all 12 brands: Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, Emtek, Badeloft, Mistoa, Villeroy & Boch, AquaSpa, and Banté — plus the full Artisanal Collection with copper, ceramic, and stone basins.",
            },
          },
          {
            "@type": "Question",
            name: "Where is the showroom located?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The Counter Cultures showroom is located on Providencia in San Miguel de Allende, Guanajuato, Mexico. Open Monday–Friday, 10:00–18:00.",
            },
          },
          {
            "@type": "Question",
            name: "Can architects and designers bring clients to the showroom?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Absolutely. We regularly host architect and designer client presentations. Contact us to book a private showing and we will prepare samples and demonstrations tailored to your project.",
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
        name: isEs ? "Showroom" : "Showroom",
        item: `${BASE_URL}/${locale}/showroom`,
      },
    ],
  };

  return (
    <>
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(showroomJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ShowroomContent />
    </>
  );
};

export default ShowroomPage;
