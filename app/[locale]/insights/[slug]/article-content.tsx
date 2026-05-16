"use client";

import { useState, useEffect } from "react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import {
  type Article,
  pillarColors,
  pillarLabels,
} from "@/app/lib/articles";
import Link from "next/link";
import { ArrowLeft, Clock, User, ChevronDown } from "lucide-react";

interface ArticleContentProps {
  article: Article;
  relatedArticles: Article[];
  locale: "en" | "es";
}

const extractHeadings = (markdown: string): { id: string; text: string; level: number }[] => {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const text = match[2];
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text, level: match[1].length });
  }
  return headings;
};

const renderMarkdown = (markdown: string): string => {
  let html = markdown
    .replace(/^### (.+)$/gm, (_match, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
      return `<h3 id="${id}">${text}</h3>`;
    })
    .replace(/^## (.+)$/gm, (_match, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
      return `<h2 id="${id}">${text}</h2>`;
    })
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^\|(.+)\|$/gm, (_match, content) => {
      const cells = content.split("|").map((c: string) => c.trim());
      const cellHtml = cells.map((c: string) => `<td>${c}</td>`).join("");
      return `<tr>${cellHtml}</tr>`;
    })
    .replace(/^(?!<[a-z]|$|\|)(.+)$/gm, "<p>$1</p>");

  html = html.replace(
    /(<li>.*?<\/li>\n?)+/g,
    (match) => `<ul>${match}</ul>`
  );

  html = html.replace(
    /(<tr>.*?<\/tr>\n?)+/g,
    (match) => `<div class="table-wrap"><table>${match}</table></div>`
  );

  return html;
};

export const ArticleContent = ({
  article,
  relatedArticles,
  locale,
}: ArticleContentProps) => {
  const [activeHeading, setActiveHeading] = useState("");
  const [tocOpen, setTocOpen] = useState(false);
  const headings = extractHeadings(article.body[locale]);
  const bodyHtml = renderMarkdown(article.body[locale]);
  const h2Headings = headings.filter((h) => h.level === 2);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "es" ? "es-MX" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        {/* Full-bleed Hero Image */}
        <section className="relative h-[60vh] min-h-[400px] md:h-[70vh] md:min-h-[560px] w-full overflow-hidden bg-brand-charcoal">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('${article.image.startsWith("http") ? article.image.replace("q=80", "q=75").replace(/&?auto=format/g, "") + "&auto=format" : article.image}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/90 via-brand-charcoal/30 to-brand-charcoal/10" />

          <div className="relative h-full flex flex-col justify-end">
            <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 pb-12 md:pb-16">
              <AnimatedSection>
                <Link
                  href={`/${locale}/insights`}
                  className="inline-flex items-center gap-2 font-body font-medium text-xs text-white/50 hover:text-white transition-colors uppercase tracking-wider mb-6"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {locale === "es" ? "Insights" : "Insights"}
                </Link>

                <span
                  className={`inline-block px-3 py-1 text-[10px] font-body font-semibold tracking-wider text-white uppercase rounded ${pillarColors[article.pillar]}`}
                >
                  {pillarLabels[article.pillar][locale]}
                </span>

                <h1 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-wide leading-[1.1]">
                  {article.title[locale]}
                </h1>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Article Meta Bar */}
        <section className="bg-brand-linen border-b border-brand-stone/15">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-body text-xs text-dash-text-secondary tracking-wide">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-stone" />
                <span className="font-medium text-brand-charcoal">{article.author}</span>
              </span>
              <span className="text-brand-stone/40">|</span>
              <span>{formatDate(article.date)}</span>
              <span className="text-brand-stone/40">|</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-stone" />
                {article.readTime}
              </span>
            </div>
          </div>
        </section>

        {/* Article Body with Left-margin TOC */}
        <section className="py-12 md:py-20 bg-brand-linen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Mobile TOC */}
            {h2Headings.length > 0 && (
              <div className="lg:hidden mb-10 mx-auto max-w-3xl">
                <button
                  onClick={() => setTocOpen(!tocOpen)}
                  className="flex items-center justify-between w-full px-5 py-4 bg-white/60 border border-brand-stone/12 rounded-lg"
                >
                  <span className="font-body font-semibold text-[10px] tracking-[0.2em] text-brand-terracotta uppercase">
                    {locale === "es" ? "En Este Artículo" : "In This Article"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-dash-text-secondary transition-transform ${tocOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {tocOpen && (
                  <nav className="mt-2 px-5 py-4 bg-white/60 border border-brand-stone/12 rounded-lg space-y-1">
                    {h2Headings.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        onClick={() => setTocOpen(false)}
                        className="block py-1.5 font-body text-sm text-dash-text-secondary hover:text-brand-terracotta transition-colors"
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                )}
              </div>
            )}

            <div className="relative lg:grid lg:grid-cols-[200px_1fr_200px] lg:gap-0">
              {/* Left TOC - sticky */}
              {h2Headings.length > 0 && (
                <aside className="hidden lg:block">
                  <div className="sticky top-28">
                    <span className="font-body font-semibold text-[10px] tracking-[0.2em] text-brand-terracotta uppercase">
                      {locale === "es" ? "Contenido" : "Contents"}
                    </span>
                    <nav className="mt-4 space-y-2.5 border-l border-brand-stone/15 pl-4">
                      {h2Headings.map((h) => (
                        <a
                          key={h.id}
                          href={`#${h.id}`}
                          className={`block font-body text-[13px] leading-snug transition-colors ${
                            activeHeading === h.id
                              ? "text-brand-terracotta font-medium"
                              : "text-dash-text-muted hover:text-brand-charcoal"
                          }`}
                        >
                          {h.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                </aside>
              )}

              {/* Centered Article Body */}
              <article
                className="prose-custom mx-auto w-full max-w-[65ch]"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />

              {/* Right column - empty for symmetry, or CTA on large screens */}
              <aside className="hidden lg:block">
                <div className="sticky top-28">
                  {article.brandSlugs && article.brandSlugs.length > 0 && (
                    <div className="mb-8">
                      <span className="font-body font-semibold text-[10px] tracking-[0.2em] text-brand-terracotta uppercase">
                        {locale === "es" ? "Marcas" : "Brands"}
                      </span>
                      <div className="mt-3 flex flex-col gap-2">
                        {article.brandSlugs.map((slug) => (
                          <Link
                            key={slug}
                            href={`/${locale}/brands/${slug}`}
                            className="font-body text-[13px] text-dash-text-muted hover:text-brand-terracotta transition-colors capitalize"
                          >
                            {slug.replace(/-/g, " ")} →
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-brand-stone/15">
                    <p className="font-body text-[13px] text-dash-text-muted leading-relaxed">
                      {locale === "es"
                        ? "Nuestro equipo puede ayudarte a especificar los productos correctos."
                        : "Our team can help you specify the right products."}
                    </p>
                    <div className="mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        href="/contact"
                      >
                        {locale === "es" ? "Contactar" : "Get in Touch"}
                      </Button>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="py-16 md:py-24 bg-white/40 border-t border-brand-stone/10">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <AnimatedSection>
                <span className="font-body font-semibold text-[10px] tracking-[0.2em] text-brand-terracotta uppercase">
                  {locale === "es" ? "Sigue Leyendo" : "Keep Reading"}
                </span>
                <h2 className="mt-3 font-display text-2xl md:text-3xl font-light text-brand-charcoal tracking-wide">
                  {locale === "es" ? "Artículos Relacionados" : "Related Articles"}
                </h2>
              </AnimatedSection>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                {relatedArticles.map((related) => (
                  <AnimatedSection key={related.slug}>
                    <Link
                      href={`/${locale}/insights/${related.slug}`}
                      className="group block"
                    >
                      <div className="aspect-[16/10] rounded-lg overflow-hidden bg-brand-stone/10">
                        <div
                          className="w-full h-full transition-transform duration-700 group-hover:scale-[1.03]"
                          style={{
                            backgroundImage: `url('${related.image.startsWith("http") ? related.image.replace("q=80", "q=75").replace(/&?auto=format/g, "") + "&auto=format" : related.image}')`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      </div>
                      <div className="mt-5">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[9px] font-body font-semibold tracking-wider text-white uppercase rounded ${pillarColors[related.pillar]}`}
                        >
                          {pillarLabels[related.pillar][locale]}
                        </span>
                        <h3 className="mt-3 font-display text-xl md:text-2xl text-brand-charcoal group-hover:text-brand-terracotta transition-colors leading-snug">
                          {related.title[locale]}
                        </h3>
                        <p className="mt-2 font-body text-sm text-dash-text-secondary leading-relaxed line-clamp-2">
                          {related.excerpt[locale]}
                        </p>
                        <span className="mt-3 inline-block font-body text-xs font-medium text-brand-terracotta uppercase tracking-wider">
                          {related.readTime}
                        </span>
                      </div>
                    </Link>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Subtle Newsletter CTA */}
        <section className="py-16 md:py-20 bg-brand-charcoal">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
            <AnimatedSection>
              <span className="font-body font-semibold text-[10px] tracking-[0.2em] text-brand-terracotta uppercase">
                {locale === "es" ? "Newsletter" : "Newsletter"}
              </span>
              <h2 className="mt-4 font-display text-2xl md:text-3xl font-light text-white tracking-wide">
                {locale === "es"
                  ? "Diseño e Inspiración, Directo a Tu Inbox"
                  : "Design & Inspiration, Straight to Your Inbox"}
              </h2>
              <p className="mt-4 font-body text-sm text-white/50 leading-relaxed max-w-lg mx-auto">
                {locale === "es"
                  ? "Artículos sobre diseño, comparaciones de productos y tendencias. Sin spam."
                  : "Articles on design, product comparisons, and trends. No spam."}
              </p>
              <div className="mt-8">
                <Button variant="primary" size="md" href="/contact">
                  {locale === "es" ? "Suscribirse" : "Subscribe"}
                </Button>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};
