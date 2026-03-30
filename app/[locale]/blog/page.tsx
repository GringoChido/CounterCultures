import type { Metadata } from "next";
import { BlogContent } from "./blog-content";

const BASE_URL = "https://countercultures.mx";

interface BlogPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: BlogPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "El Journal — Inspiración, Guías e Ideas para el Hogar"
    : "The Journal — Design Inspiration, Guides & Trade Insights";
  const description = isEs
    ? "Inspiración de diseño, guías de productos y perspectivas del sector desde el principal showroom de accesorios de San Miguel de Allende. Cobre, piedra, Kohler, TOTO y más."
    : "Design inspiration, product guides, and industry insights from San Miguel de Allende's premier fixture showroom. Copper basins, stone sinks, Kohler, TOTO, and more.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/blog`,
      languages: {
        en: `${BASE_URL}/en/blog`,
        es: `${BASE_URL}/es/blog`,
        "x-default": `${BASE_URL}/en/blog`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/blog`,
      locale: isEs ? "es_MX" : "en_US",
    },
  };
};

const BlogPage = () => {
  return <BlogContent />;
};

export default BlogPage;
