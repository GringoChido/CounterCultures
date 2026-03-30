import type { Metadata } from "next";
import { InsightsContent } from "./insights-content";

const BASE_URL = "https://countercultures.mx";

interface InsightsPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: InsightsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Insights — Diseño, Productos y Artesanía de Accesorios de Lujo"
    : "Insights — Design, Products & Craft of Luxury Fixtures";
  const description = isEs
    ? "Artículos editoriales sobre diseño de baños y cocinas, comparaciones de productos, tendencias de la industria y el arte de los accesorios artesanales mexicanos."
    : "Editorial articles on bathroom and kitchen design, product comparisons, industry trends, and the craft of artisanal Mexican fixtures.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/insights`,
      languages: {
        en: `${BASE_URL}/en/insights`,
        es: `${BASE_URL}/es/insights`,
        "x-default": `${BASE_URL}/en/insights`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/insights`,
      locale: isEs ? "es_MX" : "en_US",
    },
  };
};

const InsightsPage = () => {
  return <InsightsContent />;
};

export default InsightsPage;
