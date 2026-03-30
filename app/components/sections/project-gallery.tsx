"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { PROJECTS } from "@/app/lib/projects";

const ProjectGallery = ({ locale = "en" }: { locale?: string }) => {
  const lang = locale as "en" | "es";

  return (
  <section className="py-14 md:py-32 bg-brand-linen">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <AnimatedSection>
        <h2 className="text-center font-display text-3xl md:text-5xl font-normal tracking-wide text-brand-charcoal mb-4">
          {locale === "en" ? "Installed. Admired. Credited." : "Instalado. Admirado. Acreditado."}
        </h2>
        <p className="text-center font-body text-brand-stone mb-12 max-w-2xl mx-auto">
          {locale === "en"
            ? "Real projects featuring Counter Cultures fixtures, credited to the architects and designers who specified them."
            : "Proyectos reales con accesorios Counter Cultures, acreditados a los arquitectos y diseñadores que los especificaron."}
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {PROJECTS.map((project, i) => (
          <AnimatedSection key={project.slug} delay={i * 0.08}>
            <Link href={`/${locale}/projects/${project.slug}`} className="group block rounded-lg overflow-hidden">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={project.heroImage.replace("w=1920", "w=600").replace("q=80", "q=75")}
                  alt={`${project.title} — designed by ${project.architect} in ${project.location[lang]}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div>
                    <h3 className="font-display text-xl text-white">
                      {project.title}
                    </h3>
                    <p className="font-mono text-sm text-brand-copper mt-1">
                      {locale === "en" ? "Designed by" : "Diseñado por"} {project.architect}
                    </p>
                    <p className="font-body text-sm text-white/70 mt-1">
                      {project.location[lang]} · {project.fixtures.length} {locale === "en" ? "fixtures" : "accesorios"}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </AnimatedSection>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button variant="secondary" href="/projects">
          {locale === "en" ? "View All Projects" : "Ver Todos los Proyectos"}
        </Button>
      </div>
    </div>
  </section>
  );
};

export { ProjectGallery };
