import type { Metadata } from "next";
import { InsightsContent } from "./insights-content";
import { articles } from "@/app/lib/articles";

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
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Insights — artículos sobre diseño de accesorios de lujo"
            : "Insights — luxury fixture design articles",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80"],
    },
  };
};

const InsightsPage = async ({ params }: InsightsPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";

  // ItemList JSON-LD — GEO: enumerate articles for AI discovery
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isEs
      ? "Insights — Counter Cultures"
      : "Insights — Counter Cultures",
    description: isEs
      ? "Artículos editoriales sobre diseño de baños y cocinas, artesanía mexicana y accesorios de lujo."
      : "Editorial articles on bathroom and kitchen design, Mexican craft, and luxury fixtures.",
    url: `${BASE_URL}/${locale}/insights`,
    numberOfItems: articles.length,
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/${locale}/insights/${article.slug}`,
      name: article.title[isEs ? "es" : "en"],
    })),
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
        name: "Insights",
        item: `${BASE_URL}/${locale}/insights`,
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
      <InsightsContent />
    </>
  );
};

export default InsightsPage;
