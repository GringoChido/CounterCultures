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
    ? "Fundada en 2004 por Roger Williams en San Miguel de Allende. Distribuidor autorizado de Kohler, TOTO, Brizo, BLANCO y socio de los artesanos mexicanos del cobre, la cerámica y la piedra desde hace 22 años."
    : "Founded in 2004 by Roger Williams in San Miguel de Allende. Authorized dealer for Kohler, TOTO, Brizo, BLANCO and partner to Mexican artisans of copper, ceramic, and stone for 22 years.";

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
      ? "Counter Cultures fue fundada en 2004 por Roger Williams en San Miguel de Allende, México. Durante 20 años ha sido distribuidor autorizado de las principales marcas internacionales de cocina, baño y herrajes — y socio de los artesanos mexicanos."
      : "Counter Cultures was founded in 2004 by Roger Williams in San Miguel de Allende, Mexico. For 20 years, it has been an authorized dealer for the leading international kitchen, bath, and hardware brands — and partner to Mexican artisans.",
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
          ? "Roger Williams fundó Counter Cultures en 2004 después de trasladarse a San Miguel de Allende. Lleva casi dos décadas colaborando con artesanos mexicanos y representando marcas internacionales autorizadas de cocina, baño y herrajes."
          : "Roger Williams founded Counter Cultures in 2004 after relocating to San Miguel de Allende. He has spent nearly two decades collaborating with Mexican artisans and representing authorized international kitchen, bath, and hardware brands.",
        worksFor: {
          "@id": `${BASE_URL}/#organization`,
        },
      },
      numberOfYearsInBusiness: 22,
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
