import type { Metadata } from "next";
import { InspirationContent } from "./inspiration-content";
import { PROJECTS } from "@/app/lib/projects";

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
    ? "Inspiración — Casas, Hoteles y Restaurantes que Hemos Especificado"
    : "Inspiration — Homes, Hotels & Restaurants We've Specified";
  const description = isEs
    ? "Veintidós años de habitaciones moldeadas, hoteles abastecidos y oficios celebrados. Explora proyectos, busca por estética, y encuentra el detalle exacto que estás imaginando."
    : "Twenty-two years of rooms shaped, hotels supplied, and craft celebrated. Browse projects, filter by look, and find the exact detail you're picturing.";

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
            ? "Inspiración — proyectos especificados por Counter Cultures"
            : "Inspiration — projects specified by Counter Cultures",
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
    name: isEs ? "Inspiración — Counter Cultures" : "Inspiration — Counter Cultures",
    url: `${BASE_URL}/${locale}/inspiration`,
    numberOfItems: PROJECTS.length,
    itemListElement: PROJECTS.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/${locale}/inspiration/${project.slug}`,
      name: project.title,
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
