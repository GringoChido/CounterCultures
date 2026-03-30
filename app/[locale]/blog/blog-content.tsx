"use client";

import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import Link from "next/link";
import { useLocale } from "next-intl";

type BlogTrack = "Inspiration" | "Guides" | "Trade";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  track: BlogTrack;
  date: string;
  readTime: string;
  image: string;
}

const posts: BlogPost[] = [
  {
    slug: "copper-basin-guide",
    title: "The Complete Guide to Hand-Hammered Copper Basins",
    excerpt:
      "From Santa Clara del Cobre to your bathroom — how artisanal copper basins are made, how to care for them, and why they age beautifully.",
    track: "Guides",
    date: "March 15, 2026",
    readTime: "8 min read",
    image:
      "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=80",
  },
  {
    slug: "san-miguel-bathroom-trends",
    title: "Bathroom Design Trends in San Miguel de Allende for 2026",
    excerpt:
      "What architects and designers are specifying this year: earthy palettes, statement fixtures, and the return of freestanding tubs.",
    track: "Inspiration",
    date: "March 8, 2026",
    readTime: "6 min read",
    image:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
  },
  {
    slug: "blanco-silgranit-vs-stainless",
    title: "BLANCO Silgranit vs. Stainless Steel: Which Kitchen Sink Is Right for You?",
    excerpt:
      "A side-by-side comparison of two kitchen sink materials — durability, maintenance, aesthetics, and real-world performance in Mexican kitchens.",
    track: "Guides",
    date: "February 28, 2026",
    readTime: "7 min read",
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
  },
  {
    slug: "specifying-fixtures-hospitality",
    title: "Specifying Fixtures for Hospitality Projects in Mexico",
    excerpt:
      "What architects need to know about lead times, warranty coverage, and water efficiency standards when specifying for hotels and restaurants.",
    track: "Trade",
    date: "February 20, 2026",
    readTime: "10 min read",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  },
  {
    slug: "sun-valley-bronze-process",
    title: "Inside Sun Valley Bronze: How America's Finest Hardware Is Made",
    excerpt:
      "A look inside the Idaho foundry where every entry lock set is individually sand-cast in silicon bronze and finished by hand.",
    track: "Inspiration",
    date: "February 12, 2026",
    readTime: "5 min read",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
  },
  {
    slug: "trade-program-benefits",
    title: "5 Ways the Counter Cultures Trade Program Saves You Time",
    excerpt:
      "From dedicated pricing to specification support — how architects and designers streamline procurement through our trade program.",
    track: "Trade",
    date: "February 5, 2026",
    readTime: "4 min read",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  },
];

const trackColors: Record<BlogTrack, string> = {
  Inspiration: "bg-brand-copper",
  Guides: "bg-brand-charcoal",
  Trade: "bg-brand-sage",
};

export const BlogContent = () => {
  const locale = useLocale() as "en" | "es";

  return (
  <>
    <Header locale={locale} />
    <main>
      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-brand-charcoal">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
              Insights & Inspiration
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-7xl font-light text-white tracking-wide">
              The Journal
            </h1>
            <p className="mt-6 font-body text-base text-white/60 max-w-xl leading-relaxed">
              Design inspiration, product guides, and industry insights from San
              Miguel de Allende&apos;s premier fixture showroom.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Track filter */}
      <section className="py-6 bg-brand-linen border-b border-brand-stone/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {(["Inspiration", "Guides", "Trade"] as BlogTrack[]).map(
              (track) => (
                <button
                  key={track}
                  className="px-4 min-h-[44px] flex items-center text-sm font-body border border-brand-stone/20 rounded-full text-brand-charcoal hover:border-brand-terracotta hover:text-brand-terracotta transition-colors cursor-pointer"
                >
                  {track}
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="py-20 md:py-28 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Featured post */}
          <AnimatedSection>
            <Link
              href={`/blog/${posts[0].slug}`}
              className="group block md:grid md:grid-cols-2 gap-8 mb-16"
            >
              <div className="aspect-[16/10] rounded-lg overflow-hidden bg-brand-stone/10">
                <div
                  className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('${posts[0].image}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </div>
              <div className="mt-6 md:mt-0 flex flex-col justify-center">
                <span
                  className={`inline-block w-fit px-3 py-1 text-[10px] font-mono tracking-wider text-white uppercase rounded ${trackColors[posts[0].track]}`}
                >
                  {posts[0].track}
                </span>
                <h2 className="mt-4 font-display text-3xl md:text-4xl font-light text-brand-charcoal tracking-wide group-hover:text-brand-terracotta transition-colors">
                  {posts[0].title}
                </h2>
                <p className="mt-3 font-body text-base text-brand-stone leading-relaxed">
                  {posts[0].excerpt}
                </p>
                <div className="mt-4 flex items-center gap-3 font-mono text-xs text-brand-stone uppercase tracking-wider">
                  <span>{posts[0].date}</span>
                  <span>·</span>
                  <span>{posts[0].readTime}</span>
                </div>
              </div>
            </Link>
          </AnimatedSection>

          {/* Rest of posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.slice(1).map((post) => (
              <AnimatedSection key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
                  <div className="aspect-[16/10] rounded-lg overflow-hidden bg-brand-stone/10">
                    <div
                      className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                      style={{
                        backgroundImage: `url('${post.image}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  </div>
                  <div className="mt-4">
                    <span
                      className={`inline-block px-3 py-1 text-[10px] font-mono tracking-wider text-white uppercase rounded ${trackColors[post.track]}`}
                    >
                      {post.track}
                    </span>
                    <h3 className="mt-3 font-display text-xl text-brand-charcoal group-hover:text-brand-terracotta transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-2 font-body text-sm text-brand-stone leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-brand-stone uppercase tracking-wider">
                      <span>{post.date}</span>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </main>
    <Footer locale={locale} />
  </>
  );
};
