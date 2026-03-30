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

export const generateStaticParams = () =>
  articles.map((a) => ({ slug: a.slug }));

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
    authors: [{ name: article.author }],
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
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "article",
      publishedTime: article.date,
      authors: [article.author],
      section: pillarLabels[article.pillar][isEs ? "es" : "en"],
      images: article.image
        ? [{ url: article.image, width: 1200, height: 630, alt: title }]
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

  const relatedArticles = article.relatedSlugs
    .map((s) => articles.find((a) => a.slug === s))
    .filter(Boolean);

  // AEO/GEO: Enriched Article JSON-LD with topical authority signals
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${BASE_URL}/${locale}/insights/${slug}#article`,
    headline: article.title[lang],
    description: article.excerpt[lang],
    image: {
      "@type": "ImageObject",
      url: article.image,
      width: 1200,
      height: 630,
    },
    datePublished: article.date,
    dateModified: article.date,
    inLanguage: isEs ? "es-MX" : "en-US",
    author: {
      "@type": article.author === "Counter Cultures" ? "Organization" : "Person",
      name: article.author,
      ...(article.author !== "Counter Cultures" && {
        worksFor: {
          "@type": "Organization",
          "@id": `${BASE_URL}/#organization`,
          name: "Counter Cultures",
        },
      }),
      ...(article.author === "Counter Cultures" && {
        "@id": `${BASE_URL}/#organization`,
      }),
    },
    publisher: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Counter Cultures",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
        width: 200,
        height: 60,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/${locale}/insights/${slug}`,
    },
    articleSection: pillarLabels[article.pillar][lang],
    about: [
      { "@type": "Thing", name: "Luxury Bath Fixtures" },
      { "@type": "Thing", name: "Kitchen Design" },
      { "@type": "Thing", name: pillarLabels[article.pillar][lang] },
    ],
    mentions: [
      { "@type": "Organization", name: "Counter Cultures", url: BASE_URL },
    ],
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      name: "Counter Cultures Insights",
      url: `${BASE_URL}/${locale}/insights`,
    },
    url: `${BASE_URL}/${locale}/insights/${slug}`,
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
        name: isEs ? "Insights" : "Insights",
        item: `${BASE_URL}/${locale}/insights`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title[lang],
        item: `${BASE_URL}/${locale}/insights/${slug}`,
      },
    ],
  };

  // GEO: Speakable — marks intro/headline content for voice and AI summaries
  const speakableJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/${locale}/insights/${slug}`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", ".article-excerpt", ".article-lead"],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableJsonLd) }}
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
