import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

const BlogPostPage = async ({ params }: BlogPostPageProps) => {
  const { slug } = await params;

  const formatSlug = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <>
      <Header />
      <main>
        <article className="pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <Link
              href="/blog"
              className="font-mono text-xs tracking-wider text-brand-terracotta uppercase hover:text-brand-copper transition-colors"
            >
              ← Back to Journal
            </Link>

            <h1 className="mt-8 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-tight">
              {formatSlug}
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
      <Footer />
    </>
  );
};

export default BlogPostPage;
