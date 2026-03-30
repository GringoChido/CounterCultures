"use client";

import Link from "next/link";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";

const projects = [
  {
    title: "Casa Rosada Master Bath",
    architect: "Studio Arquitectura MX",
    location: "San Miguel de Allende",
    fixtureCount: 5,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80",
    href: "/projects/casa-rosada",
  },
  {
    title: "Rancho Sereno Kitchen",
    architect: "Taller Héctor Barroso",
    location: "Querétaro",
    fixtureCount: 3,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
    href: "/projects/rancho-sereno",
  },
  {
    title: "Hotel Boutique Luna Spa",
    architect: "Productora",
    location: "San Miguel de Allende",
    fixtureCount: 12,
    image: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=600&q=80",
    href: "/projects/hotel-luna",
  },
  {
    title: "Villa Magnolia Guest Bath",
    architect: "Esrawe Studio",
    location: "San Miguel de Allende",
    fixtureCount: 7,
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80",
    href: "/projects/villa-magnolia",
  },
  {
    title: "Penthouse Centro Kitchen",
    architect: "TO Architects",
    location: "Ciudad de México",
    fixtureCount: 4,
    image: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=600&q=80",
    href: "/projects/penthouse-centro",
  },
  {
    title: "Casa del Jardín Bath Suite",
    architect: "Frida Escobedo",
    location: "San Miguel de Allende",
    fixtureCount: 8,
    image: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80",
    href: "/projects/casa-del-jardin",
  },
];

const ProjectGallery = ({ locale = "en" }: { locale?: string }) => (
  <section className="py-24 md:py-32 bg-brand-linen">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <AnimatedSection>
        <h2 className="text-center font-display text-4xl md:text-5xl font-normal tracking-wide text-brand-charcoal mb-4">
          {locale === "en" ? "Installed. Admired. Credited." : "Instalado. Admirado. Acreditado."}
        </h2>
        <p className="text-center font-body text-brand-stone mb-12 max-w-2xl mx-auto">
          {locale === "en"
            ? "Real projects featuring Counter Cultures fixtures, credited to the architects and designers who specified them."
            : "Proyectos reales con accesorios Counter Cultures, acreditados a los arquitectos y diseñadores que los especificaron."}
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, i) => (
          <AnimatedSection key={project.href} delay={i * 0.08}>
            <Link href={project.href} className="group block rounded-lg overflow-hidden">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
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
                      {project.location} · {project.fixtureCount} Counter Cultures fixtures
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

export { ProjectGallery };
