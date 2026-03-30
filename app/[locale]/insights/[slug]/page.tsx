import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleContent } from "./article-content";
import {
  articles,
  getArticleBySlug,
  pillarLabels,
} from "@/app/lib/articles";

const BASE_URL = "https://countercultures.mx";

interface ArticlePageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const generateMetadata = async ({
  params,
}: ArticlePageProps): Promise<Metadata> => {
  const { slug, locale } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Article Not Found" };

  const isEs = locale === "es";
  const title = article.title[isEs ? "es" : "en"];
  const description = article.excerpt[isEs ? "es" : "en"];

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/insights/${slug}`,
      languages: {
        en: `${BASE_URL}/en/insights/${slug}`,
        es: `${BASE_URL}/es/insights/${slug}`,
        "x-default": `${BASE_URL}/en/insights/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/insights/${slug}`,
      locale: isEs ? "es_MX" : "en_US",
      type: "article",
      publishedTime: article.date,
      authors: [article.author],
      images: article.image
        ? [{ url: article.image, alt: title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.image ? [article.image] : [],
    },
  };
};

const ArticlePage = async ({ params }: ArticlePageProps) => {
  const { slug, locale } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  const isEs = locale === "es";
  const lang = isEs ? "es" : "en";

  // Get related articles
  const relatedArticles = article.relatedSlugs
    .map((s) => articles.find((a) => a.slug === s))
    .filter(Boolean);

  // JSON-LD Article structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title.en,
    description: article.excerpt.en,
    image: article.image,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      "@type": article.author === "Counter Cultures" ? "Organization" : "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Counter Cultures",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/${locale}/insights/${slug}`,
    },
    articleSection: pillarLabels[article.pillar].en,
    inLanguage: locale,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleContent
        article={article}
        relatedArticles={relatedArticles as typeof articles}
        locale={lang}
      />
    </>
  );
};

export default ArticlePage;
