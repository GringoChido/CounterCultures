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
import { ArrowLeft, Clock, User } from "lucide-react";

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
    // Headers with IDs
    .replace(/^### (.+)$/gm, (_match, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
      return `<h3 id="${id}" class="font-display text-xl text-brand-charcoal mt-8 mb-3">${text}</h3>`;
    })
    .replace(/^## (.+)$/gm, (_match, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
      return `<h2 id="${id}" class="font-display text-2xl md:text-3xl text-brand-charcoal mt-12 mb-4">${text}</h2>`;
    })
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-brand-charcoal">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 font-body text-base text-brand-stone leading-relaxed">$1</li>')
    // Table rows (basic)
    .replace(/^\|(.+)\|$/gm, (_match, content) => {
      const cells = content.split("|").map((c: string) => c.trim());
      const cellHtml = cells.map((c: string) => `<td class="py-2 px-4 font-body text-sm text-brand-stone border-b border-brand-stone/10">${c}</td>`).join("");
      return `<tr>${cellHtml}</tr>`;
    })
    // Paragraphs (lines that don't start with < or are empty)
    .replace(/^(?!<[a-z]|$|\|)(.+)$/gm, '<p class="font-body text-base text-brand-stone leading-relaxed mb-4">$1</p>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(
    /(<li[^>]*>.*?<\/li>\n?)+/g,
    (match) => `<ul class="list-disc space-y-2 mb-6 pl-2">${match}</ul>`
  );

  // Wrap consecutive <tr> in <table>
  html = html.replace(
    /(<tr>.*?<\/tr>\n?)+/g,
    (match) => `<div class="overflow-x-auto mb-6"><table class="w-full">${match}</table></div>`
  );

  return html;
};

export const ArticleContent = ({
  article,
  relatedArticles,
  locale,
}: ArticleContentProps) => {
  const [activeHeading, setActiveHeading] = useState("");
  const headings = extractHeadings(article.body[locale]);
  const bodyHtml = renderMarkdown(article.body[locale]);

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
      <Header locale={locale} />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-brand-charcoal">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <AnimatedSection>
              <Link
                href={`/${locale}/insights`}
                className="inline-flex items-center gap-2 font-mono text-xs text-white/40 hover:text-white transition-colors uppercase tracking-wider mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                {locale === "es" ? "Volver a Insights" : "Back to Insights"}
              </Link>

              <span
                className={`inline-block px-3 py-1 text-[10px] font-mono tracking-wider text-white uppercase rounded ${pillarColors[article.pillar]}`}
              >
                {pillarLabels[article.pillar][locale]}
              </span>

              <h1 className="mt-4 font-display text-4xl md:text-6xl font-light text-white tracking-wide leading-tight">
                {article.title[locale]}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-xs text-white/50 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {article.author}
                </span>
                <span>·</span>
                <span>{formatDate(article.date)}</span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {article.readTime}
                </span>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Featured Image */}
        <section className="bg-brand-linen">
          <div className="mx-auto max-w-5xl px-6 lg:px-8 -mt-2">
            <div className="aspect-[21/9] rounded-lg overflow-hidden">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url('${article.image}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>
          </div>
        </section>

        {/* Article Body + Sidebar */}
        <section className="py-16 md:py-20 bg-brand-linen">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-16">
              {/* Body */}
              <article
                className="prose-custom"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />

              {/* Sidebar TOC */}
              <aside className="hidden lg:block">
                <div className="sticky top-28">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-brand-copper uppercase">
                    {locale === "es" ? "En Este Artículo" : "In This Article"}
                  </span>
                  <nav className="mt-4 space-y-2">
                    {headings
                      .filter((h) => h.level === 2)
                      .map((h) => (
                        <a
                          key={h.id}
                          href={`#${h.id}`}
                          className={`block font-body text-sm leading-snug transition-colors ${
                            activeHeading === h.id
                              ? "text-brand-terracotta font-medium"
                              : "text-brand-stone hover:text-brand-charcoal"
                          }`}
                        >
                          {h.text}
                        </a>
                      ))}
                  </nav>

                  {/* CTA */}
                  <div className="mt-10 p-6 bg-white rounded-lg border border-brand-stone/10">
                    <h4 className="font-display text-lg text-brand-charcoal">
                      {locale === "es"
                        ? "¿Preguntas sobre este tema?"
                        : "Questions about this topic?"}
                    </h4>
                    <p className="mt-2 font-body text-sm text-brand-stone leading-relaxed">
                      {locale === "es"
                        ? "Nuestro equipo puede ayudarte a especificar los productos correctos para tu proyecto."
                        : "Our team can help you specify the right products for your project."}
                    </p>
                    <div className="mt-4">
                      <Button
                        variant="primary"
                        size="sm"
                        href={`/${locale}/contact`}
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
          <section className="py-16 md:py-20 bg-white">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <AnimatedSection>
                <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
                  {locale === "es" ? "Artículos Relacionados" : "Related Articles"}
                </span>
              </AnimatedSection>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {relatedArticles.map((related) => (
                  <AnimatedSection key={related.slug}>
                    <Link
                      href={`/${locale}/insights/${related.slug}`}
                      className="group flex gap-6"
                    >
                      <div className="w-32 h-24 rounded-lg overflow-hidden bg-brand-stone/10 shrink-0">
                        <div
                          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                          style={{
                            backgroundImage: `url('${related.image}')`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <span
                          className={`inline-block px-2 py-0.5 text-[9px] font-mono tracking-wider text-white uppercase rounded ${pillarColors[related.pillar]}`}
                        >
                          {pillarLabels[related.pillar][locale]}
                        </span>
                        <h3 className="mt-2 font-display text-lg text-brand-charcoal group-hover:text-brand-terracotta transition-colors leading-snug">
                          {related.title[locale]}
                        </h3>
                        <span className="mt-1 block font-mono text-[10px] text-brand-stone uppercase tracking-wider">
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

        {/* Newsletter CTA */}
        <section className="py-16 md:py-20 bg-brand-charcoal">
          <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
            <AnimatedSection>
              <h2 className="font-display text-3xl md:text-4xl font-light text-white tracking-wide">
                {locale === "es"
                  ? "Más Insights en Tu Inbox"
                  : "More Insights in Your Inbox"}
              </h2>
              <p className="mt-4 font-body text-base text-white/60 leading-relaxed">
                {locale === "es"
                  ? "Recibe artículos sobre diseño, comparaciones de productos y tendencias de la industria. Sin spam — solo contenido que vale la pena leer."
                  : "Get articles on design, product comparisons, and industry trends. No spam — just content worth reading."}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button variant="primary" href={`/${locale}/contact`}>
                  {locale === "es" ? "Suscribirse" : "Subscribe"}
                </Button>
                <Button
                  variant="secondary"
                  href={`/${locale}/insights`}
                  className="border-white text-white hover:bg-white hover:text-brand-charcoal"
                >
                  {locale === "es" ? "Ver Todos" : "Browse All"}
                </Button>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
};
