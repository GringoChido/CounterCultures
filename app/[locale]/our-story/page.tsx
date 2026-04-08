import type { Metadata } from "next";
import { OurStoryContent } from "./our-story-content";

const BASE_URL = "https://countercultures.mx";

interface OurStoryPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: OurStoryPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Nuestra Historia — Counter Cultures desde 2004"
    : "Our Story — Counter Cultures Since 2004";
  const description = isEs
    ? "Fundada en 2004 por Roger Williams, Counter Cultures lleva 20 años siendo el puente entre los mejores fabricantes mundiales de accesorios y los maestros artesanos de México en San Miguel de Allende."
    : "Founded in 2004 by Roger Williams, Counter Cultures has spent 20 years bridging the world's finest fixture manufacturers and Mexico's master artisans in San Miguel de Allende.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/our-story`,
      languages: {
        en: `${BASE_URL}/en/our-story`,
        es: `${BASE_URL}/es/our-story`,
        "x-default": `${BASE_URL}/en/our-story`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/our-story`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Showroom Counter Cultures en San Miguel de Allende — fundado en 2004"
            : "Counter Cultures showroom in San Miguel de Allende — founded in 2004",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"],
    },
  };
};

const OurStoryPage = async ({ params }: OurStoryPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";

  // GEO: AboutPage with rich entity data for founder and organization
  const aboutPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${BASE_URL}/${locale}/our-story`,
    name: isEs
      ? "Nuestra Historia — Counter Cultures"
      : "Our Story — Counter Cultures",
    description: isEs
      ? "Counter Cultures fue fundada en 2004 por Roger Williams en San Miguel de Allende, México. Durante 20 años ha sido el puente entre los mejores fabricantes mundiales de accesorios y los maestros artesanos de México."
      : "Counter Cultures was founded in 2004 by Roger Williams in San Miguel de Allende, Mexico. For 20 years, it has bridged the world's finest fixture manufacturers and Mexico's master artisans.",
    url: `${BASE_URL}/${locale}/our-story`,
    mainEntity: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Counter Cultures",
      foundingDate: "2004",
      founder: {
        "@type": "Person",
        "@id": `${BASE_URL}/#founder`,
        name: "Roger Williams",
        jobTitle: "Founder & Principal",
        description: isEs
          ? "Roger Williams fundó Counter Cultures en 2004 después de trasladarse a San Miguel de Allende. Lleva casi dos décadas colaborando con artesanos mexicanos y representando las mejores marcas de accesorios del mundo."
          : "Roger Williams founded Counter Cultures in 2004 after relocating to San Miguel de Allende. He has spent nearly two decades collaborating with Mexican artisans and representing the world's finest fixture brands.",
        worksFor: {
          "@id": `${BASE_URL}/#organization`,
        },
      },
      numberOfYearsInBusiness: 20,
      slogan: isEs
        ? "Donde el diseño de clase mundial se encuentra con el arte de México"
        : "Where world-class design meets the soul of Mexican craft",
    },
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
        name: isEs ? "Nuestra Historia" : "Our Story",
        item: `${BASE_URL}/${locale}/our-story`,
      },
    ],
  };

  return (
    <>
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <OurStoryContent />
    </>
  );
};

export default OurStoryPage;
