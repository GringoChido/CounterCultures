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
      images: [
        {
          url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Interior del showroom Counter Cultures"
            : "Counter Cultures showroom interior",
        },
      ],
    },
  };
};

const ShowroomPage = () => {
  return <ShowroomContent />;
};

export default ShowroomPage;
