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
      images: [
        {
          url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Showroom Counter Cultures en San Miguel de Allende"
            : "Counter Cultures showroom in San Miguel de Allende",
        },
      ],
    },
  };
};

const OurStoryPage = () => {
  return <OurStoryContent />;
};

export default OurStoryPage;
