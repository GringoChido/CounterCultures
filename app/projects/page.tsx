"use client";

import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CategoryHero } from "@/app/components/sections/category-hero";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";

const projects = [
  {
    title: "Casa Atelier",
    location: "San Miguel de Allende",
    architect: "Arq. Carolina Mendoza",
    type: "Residential",
    description:
      "A contemporary home where Brizo Litze faucets meet hand-hammered copper basins. Every fixture tells a story of precision and craft.",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    brands: ["Brizo", "TOTO", "Counter Cultures Artisanal"],
  },
  {
    title: "Hotel Jardín de la Sierra",
    location: "Guanajuato",
    architect: "Studio Arquitectura MX",
    type: "Hospitality",
    description:
      "48 rooms, each specified with TOTO Washlets and Kohler rain showers. The lobby features a custom artisanal copper vessel by Don Miguel.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    brands: ["TOTO", "Kohler", "California Faucets"],
  },
  {
    title: "Residencia El Charco",
    location: "San Miguel de Allende",
    architect: "Arq. David Torres Robles",
    type: "Residential",
    description:
      "A hacienda-style estate with Sun Valley Bronze entry hardware, BLANCO kitchen sinks, and Badeloft freestanding tubs throughout.",
    image:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
    brands: ["Sun Valley Bronze", "BLANCO", "Badeloft"],
  },
  {
    title: "Restaurante Lumbre",
    location: "San Miguel de Allende",
    architect: "TAC Arquitectos",
    type: "Commercial",
    description:
      "An open-kitchen concept restaurant with Brizo commercial-grade faucets and BLANCO Silgranit prep sinks designed for high-volume use.",
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    brands: ["Brizo", "BLANCO"],
  },
  {
    title: "Boutique Hotel Cantera",
    location: "Querétaro",
    architect: "Arq. Sofía Villanueva",
    type: "Hospitality",
    description:
      "Cantera stone vessel sinks from Taller Piedra Viva paired with California Faucets' Descanso series in an antique brass finish.",
    image:
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80",
    brands: ["California Faucets", "Counter Cultures Artisanal"],
  },
  {
    title: "Casa del Parque",
    location: "San Miguel de Allende",
    architect: "Arq. Martín Ramírez",
    type: "Residential",
    description:
      "A modern residence featuring Emtek door hardware throughout, Kohler Strive kitchen sinks, and Mistoa artisanal basins in the powder rooms.",
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
    brands: ["Emtek", "Kohler", "Mistoa"],
  },
];

const ProjectsPage = () => (
  <>
    <Header />
    <main>
      <CategoryHero
        eyebrow="Our Work"
        title="Projects"
        description="Homes, hotels, and restaurants across Mexico — each one a collaboration between world-class brands, local artisans, and visionary architects."
        imageSrc="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
        ctaLabel="Start Your Project"
        ctaHref="/contact"
      />

      {/* Project Grid */}
      <section className="py-20 md:py-28 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <AnimatedSection key={project.title}>
                <div className="group cursor-pointer">
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-brand-stone/10">
                    <div
                      className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                      style={{
                        backgroundImage: `url('${project.image}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <p className="font-body text-sm text-white/80 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl text-brand-charcoal">
                        {project.title}
                      </h3>
                      <span className="font-mono text-[10px] tracking-wider text-brand-stone uppercase">
                        {project.type}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs tracking-wider text-brand-copper uppercase">
                      {project.architect}
                    </p>
                    <p className="mt-1 font-body text-sm text-brand-stone">
                      {project.location}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.brands.map((brand) => (
                        <span
                          key={brand}
                          className="px-2 py-0.5 text-[10px] font-mono tracking-wider text-brand-charcoal bg-brand-sand/60 rounded"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24 bg-brand-charcoal">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="font-display text-3xl md:text-5xl font-light text-white tracking-wide">
              Have a Project in Mind?
            </h2>
            <p className="mt-4 font-body text-base text-white/60 max-w-xl mx-auto leading-relaxed">
              Whether it&apos;s a single bathroom or a 50-room hotel, we&apos;ll
              help you specify the perfect fixtures — from the world&apos;s finest
              brands and Mexico&apos;s master artisans.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="primary" size="lg" href="/contact">
                Start a Conversation
              </Button>
              <Button
                variant="ghost"
                size="lg"
                href="/trade"
                className="text-white hover:text-brand-copper"
              >
                Trade Program →
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
    <Footer />
  </>
);

export default ProjectsPage;
