"use client";

import Link from "next/link";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CategoryHero } from "@/app/components/sections/category-hero";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { useLocale } from "next-intl";
import { PROJECTS } from "@/app/lib/projects";

export const ProjectsContent = () => {
  const locale = useLocale() as "en" | "es";
  const lang = locale;

  const t = (en: string, es: string) => (lang === "es" ? es : en);

  return (
  <>
    <Header locale={locale} />
    <main>
      <CategoryHero
        eyebrow={t("Our Work", "Nuestro Trabajo")}
        title={t("Projects", "Proyectos")}
        description={t(
          "Homes, hotels, and restaurants across Mexico — each one a collaboration between world-class brands, local artisans, and visionary architects.",
          "Casas, hoteles y restaurantes en todo México — cada uno una colaboración entre marcas de clase mundial, artesanos locales y arquitectos visionarios."
        )}
        imageSrc="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=75&auto=format"
        ctaLabel={t("Start Your Project", "Comienza Tu Proyecto")}
        ctaHref="/contact"
      />

      {/* Project Grid */}
      <section className="py-12 md:py-28 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {PROJECTS.map((project) => (
              <AnimatedSection key={project.slug}>
                <Link
                  href={`/${locale}/projects/${project.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-brand-stone/10">
                    <div
                      className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                      style={{
                        backgroundImage: `url('${project.heroImage.replace("w=1920", "w=800").replace("q=80", "q=75").replace(/&?auto=format/g, "")}&auto=format')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <p className="font-body text-sm text-white/80 leading-relaxed">
                        {project.description[lang]}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl text-brand-charcoal">
                        {project.title}
                      </h3>
                      <span className="font-mono text-[10px] tracking-wider text-brand-stone uppercase">
                        {project.type[lang]}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs tracking-wider text-brand-copper uppercase">
                      {project.architect}
                    </p>
                    <p className="mt-1 font-body text-sm text-brand-stone">
                      {project.location[lang]}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.brands.slice(0, 3).map((brand) => (
                        <span
                          key={brand}
                          className="px-2 py-0.5 text-[10px] font-mono tracking-wider text-brand-charcoal bg-brand-sand/60 rounded"
                        >
                          {brand}
                        </span>
                      ))}
                      {project.brands.length > 3 && (
                        <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider text-brand-stone">
                          +{project.brands.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-24 bg-brand-charcoal">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="font-display text-3xl md:text-5xl font-light text-white tracking-wide">
              {t("Have a Project in Mind?", "Tienes un Proyecto en Mente?")}
            </h2>
            <p className="mt-4 font-body text-base text-white/60 max-w-xl mx-auto leading-relaxed">
              {t(
                "Whether it's a single bathroom or a 50-room hotel, we'll help you specify the perfect fixtures — from the world's finest brands and Mexico's master artisans.",
                "Ya sea un solo baño o un hotel de 50 habitaciones, te ayudaremos a especificar los accesorios perfectos — de las mejores marcas del mundo y los maestros artesanos de México."
              )}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="primary" size="lg" href="/contact">
                {t("Start a Conversation", "Iniciar Conversación")}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                href="/trade"
                className="text-white hover:text-brand-copper"
              >
                {t("Trade Program", "Programa Trade")} →
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
