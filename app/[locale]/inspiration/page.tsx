import type { Metadata } from "next";
import { InspirationContent } from "./inspiration-content";
import { HOTEL_CLIENTS } from "@/app/lib/hotel-clients";

const BASE_URL = "https://countercultures.mx";

interface InspirationPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: InspirationPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Inspiración — Hoteles y Propiedades que Hemos Especificado"
    : "Inspiration — Hotels & Properties We've Specified";
  const description = isEs
    ? "Veintidós años abasteciendo hoteles boutique, residencias y propiedades emblemáticas en todo México."
    : "Twenty-two years supplying boutique hotels, residences, and landmark properties across Mexico.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/inspiration`,
      languages: {
        en: `${BASE_URL}/en/inspiration`,
        es: `${BASE_URL}/es/inspiration`,
        "x-default": `${BASE_URL}/en/inspiration`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/inspiration`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: `${BASE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: isEs
            ? "Inspiración — propiedades abastecidas por Counter Cultures"
            : "Inspiration — properties supplied by Counter Cultures",
        },
      ],
    },
  };
};

const InspirationPage = async ({ params }: InspirationPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isEs
      ? "Hoteles que han especificado Counter Cultures"
      : "Hotels that have specified Counter Cultures",
    url: `${BASE_URL}/${locale}/inspiration`,
    numberOfItems: HOTEL_CLIENTS.length,
    itemListElement: HOTEL_CLIENTS.map((hotel, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: hotel.website,
      name: hotel.name,
    })),
  };

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
        name: isEs ? "Inspiración" : "Inspiration",
        item: `${BASE_URL}/${locale}/inspiration`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <InspirationContent />
    </>
  );
};

export default InspirationPage;
