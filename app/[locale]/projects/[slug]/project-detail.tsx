"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Calendar, ChevronRight, Quote, X, MessageCircle } from "lucide-react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { SITE_CONFIG } from "@/app/lib/constants";
import type { Project } from "@/app/lib/projects";

interface ProjectDetailProps {
  project: Project;
  locale: "en" | "es";
}

export const ProjectDetail = ({ project, locale }: ProjectDetailProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lang = locale;

  const t = (en: string, es: string) => (lang === "es" ? es : en);

  const whatsappMessage = encodeURIComponent(
    lang === "es"
      ? `Hola, vi el proyecto "${project.title}" en su sitio web y me gustaría discutir un proyecto similar.`
      : `Hi, I saw the "${project.title}" project on your website and would like to discuss a similar project.`
  );
  const whatsappHref = `https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}?text=${whatsappMessage}`;

  return (
    <>
      <Header locale={lang} />
      <main>
        {/* Hero */}
        <section className="relative h-[60vh] min-h-[400px] lg:h-[70vh]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${project.heroImage}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative h-full flex flex-col justify-end">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-12 lg:pb-16 w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-mono text-xs tracking-widest text-white/60 uppercase">
                    {project.type[lang]}
                  </span>
                  <span className="text-white/30">|</span>
                  <span className="font-mono text-xs tracking-widest text-white/60 uppercase">
                    {project.year}
                  </span>
                </div>
                <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-light text-white tracking-wide">
                  {project.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-white/70">
                  <span className="flex items-center gap-1.5 font-body text-sm">
                    <MapPin className="w-4 h-4" />
                    {project.location[lang]}
                  </span>
                  <span className="flex items-center gap-1.5 font-body text-sm">
                    <Calendar className="w-4 h-4" />
                    {project.architect}
                    {project.architectFirm && ` / ${project.architectFirm}`}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Breadcrumb */}
        <section className="py-4 bg-brand-linen border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <nav className="flex items-center gap-2 font-mono text-xs text-brand-stone flex-wrap">
              <Link href={`/${locale}`} className="hover:text-brand-terracotta transition-colors">
                {t("Home", "Inicio")}
              </Link>
              <span>/</span>
              <Link href={`/${locale}/projects`} className="hover:text-brand-terracotta transition-colors">
                {t("Projects", "Proyectos")}
              </Link>
              <span>/</span>
              <span className="text-brand-charcoal">{project.title}</span>
            </nav>
          </div>
        </section>

        {/* Stats bar */}
        {project.stats && (
          <section className="py-8 bg-white border-b border-brand-stone/10">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {project.stats.map((stat) => (
                  <AnimatedSection key={stat.label.en}>
                    <div className="text-center">
                      <p className="font-display text-2xl md:text-3xl font-light text-brand-charcoal">
                        {stat.value}
                      </p>
                      <p className="mt-1 font-mono text-[10px] tracking-widest text-brand-stone uppercase">
                        {stat.label[lang]}
                      </p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Long description */}
        <section className="py-16 md:py-24 bg-brand-linen">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
              <div className="lg:col-span-7">
                <AnimatedSection>
                  <h2 className="font-display text-2xl md:text-3xl font-light text-brand-charcoal tracking-wide mb-8">
                    {t("The Project", "El Proyecto")}
                  </h2>
                  <div className="space-y-6">
                    {project.longDescription[lang].split("\n\n").map((paragraph, i) => (
                      <p
                        key={i}
                        className="font-body text-base text-brand-stone leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </AnimatedSection>
              </div>

              {/* Brands sidebar */}
              <div className="lg:col-span-5">
                <AnimatedSection delay={0.2}>
                  <div className="sticky top-28 space-y-8">
                    <div className="bg-white p-6 border border-brand-stone/10">
                      <h3 className="font-mono text-xs tracking-widest text-brand-stone uppercase mb-4">
                        {t("Brands Specified", "Marcas Especificadas")}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {project.brands.map((brand) => (
                          <span
                            key={brand}
                            className="px-3 py-1.5 text-sm font-body text-brand-charcoal bg-brand-sand/40 border border-brand-stone/10 rounded"
                          >
                            {brand}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 border border-brand-stone/10">
                      <h3 className="font-mono text-xs tracking-widest text-brand-stone uppercase mb-4">
                        {t("Project Details", "Detalles del Proyecto")}
                      </h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="font-mono text-[10px] tracking-wider text-brand-stone uppercase">
                            {t("Architect", "Arquitecto")}
                          </dt>
                          <dd className="font-body text-sm text-brand-charcoal">
                            {project.architect}
                          </dd>
                        </div>
                        {project.architectFirm && (
                          <div>
                            <dt className="font-mono text-[10px] tracking-wider text-brand-stone uppercase">
                              {t("Firm", "Despacho")}
                            </dt>
                            <dd className="font-body text-sm text-brand-charcoal">
                              {project.architectFirm}
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt className="font-mono text-[10px] tracking-wider text-brand-stone uppercase">
                            {t("Location", "Ubicación")}
                          </dt>
                          <dd className="font-body text-sm text-brand-charcoal">
                            {project.location[lang]}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[10px] tracking-wider text-brand-stone uppercase">
                            {t("Year", "Año")}
                          </dt>
                          <dd className="font-body text-sm text-brand-charcoal">
                            {project.year}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="py-16 md:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <AnimatedSection>
              <h2 className="font-display text-2xl md:text-3xl font-light text-brand-charcoal tracking-wide mb-10">
                {t("Gallery", "Galería")}
              </h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.gallery.map((image, i) => (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <button
                    onClick={() => setLightboxIndex(i)}
                    className={`relative w-full overflow-hidden group cursor-pointer ${
                      i === 0 ? "md:col-span-2 aspect-[16/9]" : "aspect-[4/3]"
                    }`}
                  >
                    <div
                      className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url('${image.src}')` }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="font-body text-sm text-white">
                          {image.caption[lang]}
                        </p>
                      </div>
                    )}
                  </button>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
              onClick={() => setLightboxIndex(null)}
            >
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-8 h-8" />
              </button>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-5xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="w-full aspect-[16/10] bg-cover bg-center rounded-lg"
                  style={{
                    backgroundImage: `url('${project.gallery[lightboxIndex].src}')`,
                  }}
                />
                {project.gallery[lightboxIndex].caption && (
                  <p className="mt-4 text-center font-body text-sm text-white/70">
                    {project.gallery[lightboxIndex].caption[lang]}
                  </p>
                )}
                {/* Nav arrows */}
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    onClick={() =>
                      setLightboxIndex(
                        (lightboxIndex - 1 + project.gallery.length) %
                          project.gallery.length
                      )
                    }
                    className="px-4 py-2 text-white/60 hover:text-white font-mono text-sm transition-colors cursor-pointer"
                  >
                    {t("Previous", "Anterior")}
                  </button>
                  <span className="py-2 font-mono text-sm text-white/40">
                    {lightboxIndex + 1} / {project.gallery.length}
                  </span>
                  <button
                    onClick={() =>
                      setLightboxIndex(
                        (lightboxIndex + 1) % project.gallery.length
                      )
                    }
                    className="px-4 py-2 text-white/60 hover:text-white font-mono text-sm transition-colors cursor-pointer"
                  >
                    {t("Next", "Siguiente")}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixtures table */}
        <section className="py-16 md:py-24 bg-brand-linen">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <AnimatedSection>
              <h2 className="font-display text-2xl md:text-3xl font-light text-brand-charcoal tracking-wide mb-10">
                {t("Fixtures Specified", "Accesorios Especificados")}
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <div className="bg-white border border-brand-stone/10 overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-brand-sand/30 border-b border-brand-stone/10">
                  <span className="col-span-4 font-mono text-[10px] tracking-widest text-brand-stone uppercase">
                    {t("Product", "Producto")}
                  </span>
                  <span className="col-span-3 font-mono text-[10px] tracking-widest text-brand-stone uppercase">
                    {t("Brand", "Marca")}
                  </span>
                  <span className="col-span-3 font-mono text-[10px] tracking-widest text-brand-stone uppercase">
                    {t("Location", "Ubicación")}
                  </span>
                  <span className="col-span-2 font-mono text-[10px] tracking-widest text-brand-stone uppercase" />
                </div>
                {project.fixtures.map((fixture, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 border-b border-brand-stone/5 last:border-b-0 hover:bg-brand-sand/10 transition-colors"
                  >
                    <div className="md:col-span-4">
                      <span className="font-body text-sm text-brand-charcoal font-medium">
                        {fixture.product}
                      </span>
                    </div>
                    <div className="md:col-span-3">
                      <span className="md:hidden font-mono text-[10px] tracking-wider text-brand-stone uppercase mr-2">
                        {t("Brand:", "Marca:")}
                      </span>
                      <span className="font-body text-sm text-brand-stone">
                        {fixture.brand}
                      </span>
                    </div>
                    <div className="md:col-span-3">
                      <span className="md:hidden font-mono text-[10px] tracking-wider text-brand-stone uppercase mr-2">
                        {t("Location:", "Ubicación:")}
                      </span>
                      <span className="font-body text-sm text-brand-stone">
                        {fixture.location[lang]}
                      </span>
                    </div>
                    <div className="md:col-span-2 md:text-right">
                      {fixture.slug && (
                        <Link
                          href={`/${locale}/shop/bathroom/p/${fixture.slug}`}
                          className="inline-flex items-center gap-1 font-mono text-xs text-brand-terracotta hover:text-brand-copper transition-colors"
                        >
                          {t("View", "Ver")}
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Testimonial */}
        {project.testimonial && (
          <section className="py-16 md:py-24 bg-brand-charcoal">
            <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
              <AnimatedSection>
                <Quote className="w-10 h-10 text-brand-copper/40 mx-auto mb-6" />
                <blockquote className="font-display text-xl md:text-2xl font-light text-white leading-relaxed tracking-wide">
                  &ldquo;{project.testimonial.quote[lang]}&rdquo;
                </blockquote>
                <div className="mt-8">
                  <p className="font-body text-sm font-medium text-white">
                    {project.testimonial.author}
                  </p>
                  <p className="mt-1 font-mono text-xs tracking-wider text-white/50">
                    {project.testimonial.role[lang]}
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 md:py-24 bg-white">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <AnimatedSection>
              <h2 className="font-display text-3xl md:text-4xl font-light text-brand-charcoal tracking-wide">
                {t("Start Your Project", "Comienza Tu Proyecto")}
              </h2>
              <p className="mt-4 font-body text-base text-brand-stone max-w-xl mx-auto leading-relaxed">
                {t(
                  "Whether it's a single bathroom or a 50-room hotel, we'll help you specify the perfect fixtures.",
                  "Ya sea un solo baño o un hotel de 50 habitaciones, te ayudaremos a especificar los accesorios perfectos."
                )}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white font-body text-sm font-medium rounded-md hover:bg-[#20BD5A] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
                <Button variant="primary" size="lg" href="/contact">
                  {t("Start a Conversation", "Iniciar Conversación")}
                </Button>
                <Button variant="ghost" size="lg" href="/trade">
                  {t("Trade Program", "Programa Trade")} →
                </Button>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Back to projects */}
        <section className="py-8 bg-brand-linen border-t border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Link
              href={`/${locale}/projects`}
              className="inline-flex items-center gap-2 font-body text-sm text-brand-stone hover:text-brand-terracotta transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("Back to All Projects", "Volver a Todos los Proyectos")}
            </Link>
          </div>
        </section>
      </main>
      <Footer locale={lang} />
    </>
  );
};
