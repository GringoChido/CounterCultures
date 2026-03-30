import type { Metadata } from "next";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

const BASE_URL = "https://countercultures.mx";

interface BlogPostPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

const formatSlug = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const generateMetadata = async ({
  params,
}: BlogPostPageProps): Promise<Metadata> => {
  const { slug, locale } = await params;
  const isEs = locale === "es";
  const title = formatSlug(slug);

  return {
    title,
    alternates: {
      canonical: `${BASE_URL}/${locale}/blog/${slug}`,
      languages: {
        en: `${BASE_URL}/en/blog/${slug}`,
        es: `${BASE_URL}/es/blog/${slug}`,
        "x-default": `${BASE_URL}/en/blog/${slug}`,
      },
    },
    openGraph: {
      title,
      url: `${BASE_URL}/${locale}/blog/${slug}`,
      locale: isEs ? "es_MX" : "en_US",
      type: "article",
      images: [
        {
          url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80"],
    },
  };
};

const BlogPostPage = async ({ params }: BlogPostPageProps) => {
  const { slug, locale } = await params;
  const title = formatSlug(slug);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    author: {
      "@type": "Organization",
      name: "Counter Cultures",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Counter Cultures",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
    url: `${BASE_URL}/${locale}/blog/${slug}`,
    inLanguage: locale,
  };

  return (
    <>
      <Header locale={locale} />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <article className="pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <Link
              href="/blog"
              className="font-mono text-xs tracking-wider text-brand-terracotta uppercase hover:text-brand-copper transition-colors"
            >
              ← Back to Journal
            </Link>

            <h1 className="mt-8 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-tight">
              {title}
            </h1>

            <div className="mt-4 flex items-center gap-3 font-mono text-xs text-brand-stone uppercase tracking-wider">
              <span>March 2026</span>
              <span>·</span>
              <span>5 min read</span>
            </div>

            <div className="mt-8 aspect-[16/9] rounded-lg overflow-hidden bg-brand-stone/10">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>

            <div className="mt-12 prose-body space-y-6">
              <p className="font-body text-base text-brand-charcoal leading-relaxed">
                This is a placeholder for the blog post content. When the CMS or
                content management system is connected, this page will render the
                full article with rich text, images, and embedded product
                references.
              </p>
              <p className="font-body text-base text-brand-stone leading-relaxed">
                Counter Cultures publishes content across three tracks:
                Inspiration (design trends, project spotlights), Guides (product
                comparisons, care instructions, specification help), and Trade
                (industry insights for architects and designers).
              </p>
              <p className="font-body text-base text-brand-stone leading-relaxed">
                Each article is crafted to help homeowners, architects, and
                designers make informed decisions about bath, kitchen, and
                hardware fixtures — drawing on 20 years of experience in San
                Miguel de Allende.
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-brand-stone/15 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button variant="primary" href="/contact">
                Start Your Project
              </Button>
              <Button variant="ghost" href="/shop">
                Browse the Collection
              </Button>
            </div>
          </div>
        </article>
      </main>
      <Footer locale={locale} />
    </>
  );
};

export default BlogPostPage;
