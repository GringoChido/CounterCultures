"use client";

import { useState } from "react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import {
  articles,
  pillarColors,
  pillarLabels,
  type ArticlePillar,
} from "@/app/lib/articles";
import { useLocale } from "next-intl";
import Link from "next/link";

const INITIAL_COUNT = 6;

export const InsightsContent = () => {
  const locale = useLocale() as "en" | "es";
  const [activePillar, setActivePillar] = useState<ArticlePillar | "All">("All");
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const pillars: (ArticlePillar | "All")[] = ["All", "Design", "Product", "Trade", "Craft"];
  const pillarAllLabel = { en: "All", es: "Todos" };

  const filtered =
    activePillar === "All"
      ? articles
      : articles.filter((a) => a.pillar === activePillar);

  const featured = articles.find((a) => a.featured);
  const editorsPicks = articles.filter((a) => a.editorsPick && !a.featured);
  const gridArticles = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "es" ? "es-MX" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <Header locale={locale} />
      <main>
        {/* Hero */}
        <section className="pt-28 pb-12 md:pt-40 md:pb-20 bg-brand-charcoal">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
                {locale === "es" ? "Insights" : "Insights"}
              </span>
              <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-7xl font-light text-white tracking-wide">
                {locale === "es"
                  ? "Diseño, Producto y Artesanía"
                  : "Design, Product & Craft"}
              </h1>
              <p className="mt-6 font-body text-base text-white/60 max-w-2xl leading-relaxed">
                {locale === "es"
                  ? "Artículos editoriales del equipo de Counter Cultures — tendencias de diseño, comparaciones de productos, guías de especificación y el arte detrás de los accesorios artesanales."
                  : "Editorial articles from the Counter Cultures team — design trends, product comparisons, specification guides, and the craft behind artisanal fixtures."}
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Featured Article */}
        {featured && (
          <section className="py-12 md:py-20 bg-brand-linen">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <AnimatedSection>
                <Link
                  href={`/${locale}/insights/${featured.slug}`}
                  className="group block md:grid md:grid-cols-2 gap-10"
                >
                  <div className="aspect-[16/10] rounded-lg overflow-hidden bg-brand-stone/10">
                    <div
                      className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                      style={{
                        backgroundImage: `url('${featured.image.replace("q=80", "q=75").replace(/&?auto=format/g, "")}&auto=format')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  </div>
                  <div className="mt-5 md:mt-0 flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-block px-3 py-1 text-[10px] font-mono tracking-wider text-white uppercase rounded ${pillarColors[featured.pillar]}`}
                      >
                        {pillarLabels[featured.pillar][locale]}
                      </span>
                      <span className="font-mono text-[10px] text-brand-copper uppercase tracking-wider">
                        {locale === "es" ? "Artículo Destacado" : "Featured"}
                      </span>
                    </div>
                    <h2 className="mt-4 font-display text-3xl md:text-4xl font-light text-brand-charcoal tracking-wide group-hover:text-brand-terracotta transition-colors">
                      {featured.title[locale]}
                    </h2>
                    <p className="mt-3 font-body text-base text-brand-stone leading-relaxed">
                      {featured.excerpt[locale]}
                    </p>
                    <div className="mt-4 flex items-center gap-3 font-mono text-xs text-brand-stone uppercase tracking-wider">
                      <span>{formatDate(featured.date)}</span>
                      <span>·</span>
                      <span>{featured.readTime}</span>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            </div>
          </section>
        )}

        {/* Editor's Picks */}
        {editorsPicks.length > 0 && (
          <section className="py-12 md:py-20 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <AnimatedSection>
                <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
                  {locale === "es" ? "Selección del Editor" : "Editor's Picks"}
                </span>
              </AnimatedSection>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                {editorsPicks.slice(0, 3).map((article) => (
                  <AnimatedSection key={article.slug}>
                    <Link
                      href={`/${locale}/insights/${article.slug}`}
                      className="group block"
                    >
                      <div className="aspect-[16/10] rounded-lg overflow-hidden bg-brand-stone/10">
                        <div
                          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                          style={{
                            backgroundImage: `url('${article.image.replace("q=80", "q=75").replace(/&?auto=format/g, "")}&auto=format')`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      </div>
                      <div className="mt-4">
                        <span
                          className={`inline-block px-3 py-1 text-[10px] font-mono tracking-wider text-white uppercase rounded ${pillarColors[article.pillar]}`}
                        >
                          {pillarLabels[article.pillar][locale]}
                        </span>
                        <h3 className="mt-3 font-display text-xl text-brand-charcoal group-hover:text-brand-terracotta transition-colors">
                          {article.title[locale]}
                        </h3>
                        <p className="mt-2 font-body text-sm text-brand-stone leading-relaxed line-clamp-3">
                          {article.excerpt[locale]}
                        </p>
                        <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-brand-stone uppercase tracking-wider">
                          <span>{formatDate(article.date)}</span>
                          <span>·</span>
                          <span>{article.readTime}</span>
                        </div>
                      </div>
                    </Link>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Pillar Filter + Content Grid */}
        <section className="py-12 md:py-20 bg-brand-linen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <h2 className="font-display text-3xl md:text-5xl font-light text-brand-charcoal tracking-wide">
                {locale === "es" ? "Todos los Artículos" : "All Articles"}
              </h2>
            </AnimatedSection>

            {/* Pillar Nav */}
            <div className="mt-6 md:mt-8 flex flex-wrap gap-2">
              {pillars.map((pillar) => (
                <button
                  key={pillar}
                  onClick={() => {
                    setActivePillar(pillar);
                    setVisibleCount(INITIAL_COUNT);
                  }}
                  className={`px-4 py-2 text-sm font-body border rounded-full transition-colors cursor-pointer ${
                    activePillar === pillar
                      ? "border-brand-terracotta text-brand-terracotta bg-brand-terracotta/5"
                      : "border-brand-stone/20 text-brand-charcoal hover:border-brand-terracotta hover:text-brand-terracotta"
                  }`}
                >
                  {pillar === "All"
                    ? pillarAllLabel[locale]
                    : pillarLabels[pillar][locale]}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridArticles.map((article) => (
                <AnimatedSection key={article.slug}>
                  <Link
                    href={`/${locale}/insights/${article.slug}`}
                    className="group flex flex-col h-full"
                  >
                    <div className="aspect-[16/10] rounded-lg overflow-hidden bg-brand-stone/10 shrink-0">
                      <div
                        className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                        style={{
                          backgroundImage: `url('${article.image.replace("q=80", "q=75").replace(/&?auto=format/g, "")}&auto=format')`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    </div>
                    <div className="mt-4 flex flex-col flex-1">
                      <span
                        className={`inline-block w-fit px-3 py-1 text-[10px] font-mono tracking-wider text-white uppercase rounded ${pillarColors[article.pillar]}`}
                      >
                        {pillarLabels[article.pillar][locale]}
                      </span>
                      <h3 className="mt-3 font-display text-xl text-brand-charcoal group-hover:text-brand-terracotta transition-colors min-h-[3rem]">
                        {article.title[locale]}
                      </h3>
                      <p className="mt-2 font-body text-sm text-brand-stone leading-relaxed line-clamp-3 flex-1">
                        {article.excerpt[locale]}
                      </p>
                      <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-brand-stone uppercase tracking-wider">
                        <span>{formatDate(article.date)}</span>
                        <span>·</span>
                        <span>{article.readTime}</span>
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="px-8 py-3 font-body text-sm font-medium border-2 border-brand-charcoal text-brand-charcoal rounded-md hover:bg-brand-charcoal hover:text-white transition-colors cursor-pointer"
                >
                  {locale === "es" ? "Cargar Más" : "Load More"}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
};
