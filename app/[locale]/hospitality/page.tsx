import type { Metadata } from "next";
import { HospitalityContent } from "./hospitality-content";
import { HOTEL_CLIENTS } from "@/app/lib/hotel-clients";

import { SITE_URL } from "@/app/lib/seo";

const BASE_URL = SITE_URL;

interface HospitalityPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: HospitalityPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Hospitalidad — Hoteles que han Especificado Counter Cultures"
    : "Hospitality — Hotels That Have Specified Counter Cultures";
  const description = isEs
    ? "Hoteles, residencias y propiedades emblemáticas en México que han confiado en Counter Cultures para especificar sus accesorios."
    : "Hotels, residences, and landmark properties across Mexico that have trusted Counter Cultures to specify their fixtures.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/hospitality`,
      languages: {
        en: `${BASE_URL}/en/hospitality`,
        es: `${BASE_URL}/es/hospitality`,
        "x-default": `${BASE_URL}/en/hospitality`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/hospitality`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
    },
  };
};

const HospitalityPage = async ({ params }: HospitalityPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isEs
      ? "Hoteles que han especificado Counter Cultures"
      : "Hotels that have specified Counter Cultures",
    url: `${BASE_URL}/${locale}/hospitality`,
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
        name: isEs ? "Hospitalidad" : "Hospitality",
        item: `${BASE_URL}/${locale}/hospitality`,
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
      <HospitalityContent />
    </>
  );
};

export default HospitalityPage;
