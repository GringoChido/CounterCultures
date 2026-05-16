import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CategoryHero } from "@/app/components/sections/category-hero";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { SITE_CONFIG } from "@/app/lib/constants";
import { NOTABLE_INSTALLATIONS } from "@/app/lib/notable-installations";

type Locale = "en" | "es";

interface TimelineItem {
  year: string;
  title: { en: string; es: string };
  description: { en: string; es: string };
}

const timeline: TimelineItem[] = [
  {
    year: "2004",
    title: {
      en: "The Beginning",
      es: "El Comienzo",
    },
    description: {
      en: "Roger Williams opens a showroom on a center city street in San Miguel de Allende, stocking a handful of imported fixtures from California Faucets alongside handcrafted products from Mexican artisans.",
      es: "Roger Williams abre un showroom en una calle céntrica de San Miguel de Allende, con accesorios importados de California Faucets junto a productos artesanales de artesanos mexicanos.",
    },
  },
  {
    year: "2005",
    title: {
      en: "First Major Brands",
      es: "Las Primeras Grandes Marcas",
    },
    description: {
      en: "Counter Cultures becomes an authorized California Faucets distributor — the only one in Mexico — bridging the gap between international quality and local availability. That same year, Sun Valley Bronze Hardware partners with Counter Cultures as their Mexican distributor.",
      es: "Counter Cultures se convierte en distribuidor autorizado de California Faucets — el único en México — cerrando la brecha entre calidad internacional y disponibilidad local. Ese mismo año, Sun Valley Bronze Hardware se asocia con Counter Cultures como su distribuidor mexicano.",
    },
  },
  {
    year: "2006",
    title: {
      en: "Second Location",
      es: "Segunda Ubicación",
    },
    description: {
      en: "Counter Cultures opens a second showroom in San José del Cabo to serve clients throughout the Baja California region.",
      es: "Counter Cultures abre un segundo showroom en San José del Cabo para atender a los clientes de toda la región de Baja California.",
    },
  },
  {
    year: "2008",
    title: {
      en: "The Artisanal Program",
      es: "El Programa Artesanal",
    },
    description: {
      en: "Roger formalizes partnerships with copper, stone, and ceramic artisans across Mexico, creating the Counter Cultures Artisanal Collection — still adding new product lines from craftsmen across the country to this day.",
      es: "Roger formaliza alianzas con artesanos del cobre, la piedra y la cerámica en todo México, creando la Colección Artesanal de Counter Cultures — hasta el día de hoy sumando nuevas líneas de producto de artesanos de todo el país.",
    },
  },
  {
    year: "2009",
    title: {
      en: "Expanded Showroom",
      es: "Showroom Ampliado",
    },
    description: {
      en: "After outgrowing downtown San Miguel, Roger opens the new SMA showroom on the edge of town — tripling the display space with abundant client parking.",
      es: "Al superar el espacio en el centro de San Miguel, Roger abre el nuevo showroom de SMA en las afueras de la ciudad — triplicando el espacio de exhibición con amplio estacionamiento para clientes.",
    },
  },
  {
    year: "2016",
    title: {
      en: "TOTO, Brizo & Beyond",
      es: "TOTO, Brizo y Más Allá",
    },
    description: {
      en: "The showroom expands to include TOTO, Brizo, BLANCO, California Faucets, and Sun Valley Bronze — adding nine more authorized dealerships in three years.",
      es: "El showroom se expande con TOTO, Brizo, BLANCO, California Faucets y Sun Valley Bronze — sumando nueve distribuidoras autorizadas en tres años.",
    },
  },
  {
    year: "2020",
    title: {
      en: "Trade Program Launch",
      es: "Lanzamiento del Programa Trade",
    },
    description: {
      en: "Counter Cultures launches its Trade Program, offering architects, designers, and builders dedicated pricing, specification support, and priority fulfillment.",
      es: "Counter Cultures lanza su Programa Trade, ofreciendo a arquitectos, diseñadores y constructores precios dedicados, soporte de especificación y cumplimiento prioritario.",
    },
  },
  {
    year: "2024",
    title: {
      en: "20 Years & Growing",
      es: "20 Años y Creciendo",
    },
    description: {
      en: "Two decades in, Counter Cultures has furnished thousands of homes, hotels, and restaurants — still curating where international design meets Mexican craft. Projects spanning Europe, South Africa, South America, and beyond.",
      es: "Dos décadas después, Counter Cultures ha equipado miles de casas, hoteles y restaurantes — sigue curando donde el diseño internacional se encuentra con el arte mexicano. Proyectos que abarcan Europa, Sudáfrica, Sudamérica y más allá.",
    },
  },
  {
    year: "2026",
    title: {
      en: "The Digital Chapter",
      es: "El Capítulo Digital",
    },
    description: {
      en: "Counter Cultures launches a comprehensive digital platform — bringing the full showroom experience online for architects, designers, and homeowners worldwide.",
      es: "Counter Cultures lanza una plataforma digital integral — llevando la experiencia completa del showroom al mundo digital para arquitectos, diseñadores y propietarios de todo el mundo.",
    },
  },
];

const T = {
  hero: {
    eyebrow: { en: "Our Story", es: "Nuestra Historia" },
    title: {
      en: "Where Two Worlds Meet",
      es: "Donde Dos Mundos Se Encuentran",
    },
    description: {
      en: "Authorized dealer for Kohler, TOTO, Brizo, BLANCO, and other international brands — and partner to Mexican artisans since 2004.",
      es: "Distribuidor autorizado de Kohler, TOTO, Brizo, BLANCO y otras marcas internacionales — y socio de los artesanos mexicanos desde 2004.",
    },
    cta: { en: "Visit the Showroom", es: "Visita el Showroom" },
  },
  mission: {
    p1: {
      en: "Counter Cultures is a premium kitchen, bath, and architectural hardware showroom in San Miguel de Allende, Mexico. In 2004, Roger Williams opened a showroom here with a simple conviction: Mexico deserved direct access to the leading international bath and kitchen brands — and the world deserved to know Mexico’s artisan tradition.",
      es: "Counter Cultures es un showroom premium de cocina, baño y herrajes arquitectónicos en San Miguel de Allende, México. En 2004, Roger Williams abrió un showroom aquí con una convicción simple: México merecía acceso directo a las principales marcas internacionales de baño y cocina — y el mundo merecía conocer la tradición artesanal de México.",
    },
    p2: {
      en: "Two decades later, you can specify a Toto Washlet and a hand-hammered copper basin from a third-generation artisan in Santa Clara del Cobre in the same visit — because the showroom was built around exactly that pairing.",
      es: "Dos décadas después, puedes especificar un Toto Washlet y un lavabo de cobre martillado a mano de un artesano de tercera generación en Santa Clara del Cobre en la misma visita — porque el showroom se construyó alrededor de exactamente ese cruce.",
    },
    p3: {
      en: "We bridge two worlds. International precision and Mexican soul. Factory specifications and artisan intuition. That’s not a marketing line. It’s what we do every day.",
      es: "Unimos dos mundos. Precisión internacional y alma mexicana. Especificaciones de fábrica e intuición artesanal. No es un eslogan. Es lo que hacemos todos los días.",
    },
  },
  founder: {
    eyebrow: { en: "The Founder", es: "El Fundador" },
    title: "Roger Williams",
    p1: {
      en: "Roger arrived in San Miguel de Allende in the early 2000s with a background in construction and an eye for detail. What he found was a city full of stunning architecture — and almost nowhere to source the fixtures those buildings deserved.",
      es: "Roger llegó a San Miguel de Allende a principios de los 2000 con experiencia en construcción y ojo para los detalles. Encontró una ciudad llena de arquitectura impresionante — y casi ningún lugar de donde obtener los accesorios que esas obras merecían.",
    },
    p2: {
      en: "He started Counter Cultures to solve that problem: a showroom where an architect could spec handcrafted hardware from Sun Valley Bronze in Idaho, a Blanco Silgranit for the kitchen, and then commission a hand-hammered copper kitchen range hood from a third-generation coppersmith — all in one visit.",
      es: "Fundó Counter Cultures para resolver ese problema: un showroom donde un arquitecto pudiera especificar herrajes artesanales de Sun Valley Bronze en Idaho, una tarja Blanco Silgranit para la cocina, y luego encargar una campana de cocina de cobre martillado a mano por un artesano de tercera generación — todo en una sola visita.",
    },
    p3: {
      en: "Twenty-two years later, the mission hasn’t changed. Authorized dealer for the leading international bath, kitchen, and hardware brands; long-standing partner to Mexican artisans across Mexico. Roger still believes the best spaces need both.",
      es: "Veintidós años después, la misión no ha cambiado. Distribuidor autorizado de las principales marcas internacionales de baño, cocina y herrajes; socio de larga trayectoria de los artesanos mexicanos de todo México. Roger sigue creyendo que los mejores espacios necesitan ambos.",
    },
    image: "/Assets/home-page/Twenty Years of Impeccable Taste.jpg",
  },
  timeline: {
    eyebrow: {
      en: "22 Years in the Making",
      es: "22 Años en Construcción",
    },
    title: { en: "Our Timeline", es: "Nuestra Trayectoria" },
  },
  projects: {
    eyebrow: {
      en: "Featured Projects",
      es: "Proyectos Destacados",
    },
    title: {
      en: "From Our Portfolio",
      es: "De Nuestro Portafolio",
    },
    description: {
      en: "Counter Cultures has furnished projects across Mexico, Central America, and beyond — from luxury resort communities to iconic cultural experiences.",
      es: "Counter Cultures ha equipado proyectos en México, Centroamérica y más allá — desde comunidades turísticas de lujo hasta experiencias culturales icónicas.",
    },
    viewProject: { en: "View Project", es: "Ver Proyecto" },
  },
  cta: {
    title: {
      en: "Come See It for Yourself",
      es: "Ven a Verlo Tú Mismo",
    },
    description: {
      en: "Our San Miguel showroom is where the curated brands and artisan pieces sit side by side. Walk through, see the finishes, talk to the team.",
      es: "Nuestro showroom de San Miguel es donde las marcas curadas y las piezas artesanales conviven. Recórrelo, ve los acabados, habla con el equipo.",
    },
    visitCta: { en: "Visit the Showroom", es: "Visita el Showroom" },
    whatsappCta: {
      en: "Message on WhatsApp",
      es: "Escríbenos por WhatsApp",
    },
  },
};

export const OurStoryContent = () => {
  const locale = useLocale() as Locale;

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        <CategoryHero
          eyebrow={T.hero.eyebrow[locale]}
          title={T.hero.title[locale]}
          description={T.hero.description[locale]}
          imageSrc="/Assets/home-page/Twenty Years of Impeccable Taste.jpg"
          ctaLabel={T.hero.cta[locale]}
          ctaHref="/showroom"
        />

        {/* Mission Statement */}
        <section className="py-16 md:py-28 bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <p className="font-body text-base md:text-lg text-dash-text-secondary leading-relaxed text-center">
                {T.mission.p1[locale]}
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <blockquote className="my-10 md:my-14 border-l-2 border-brand-terracotta pl-6 md:pl-8">
                <p className="font-display text-xl md:text-2xl text-brand-charcoal font-light leading-relaxed tracking-wide">
                  {T.mission.p2[locale]}
                </p>
              </blockquote>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <p className="font-body text-base md:text-lg text-brand-charcoal font-medium text-center leading-relaxed">
                {T.mission.p3[locale]}
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Founder Section */}
        <section className="py-12 md:py-28 bg-brand-linen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <AnimatedSection>
                <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                  {T.founder.eyebrow[locale]}
                </span>
                <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
                  {T.founder.title}
                </h2>
                <div className="mt-6 space-y-5 font-body text-base text-dash-text-secondary leading-relaxed">
                  <p>{T.founder.p1[locale]}</p>
                  <p>{T.founder.p2[locale]}</p>
                  <p>{T.founder.p3[locale]}</p>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                <div className="aspect-[4/5] rounded-lg overflow-hidden bg-brand-stone/10">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url('${T.founder.image}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-12 md:py-28 bg-brand-charcoal">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                {T.timeline.eyebrow[locale]}
              </span>
              <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-white">
                {T.timeline.title[locale]}
              </h2>
            </AnimatedSection>

            <div className="mt-16 relative">
              <div className="absolute left-[7px] md:left-[9px] top-2 bottom-2 w-px bg-brand-copper/25" />

              <div className="space-y-10 md:space-y-14">
                {timeline.map((item, i) => (
                  <AnimatedSection key={item.year} delay={i * 0.06}>
                    <div className="relative flex gap-6 md:gap-10">
                      <div className="relative shrink-0 mt-1.5">
                        <div className="w-[15px] h-[15px] md:w-[19px] md:h-[19px] rounded-full bg-brand-copper/20 flex items-center justify-center">
                          <div className="w-[7px] h-[7px] md:w-[9px] md:h-[9px] rounded-full bg-brand-copper" />
                        </div>
                      </div>
                      <div>
                        <span className="font-mono text-sm tracking-widest text-brand-copper">
                          {item.year}
                        </span>
                        <h3 className="mt-1 font-display text-xl md:text-2xl text-white font-light">
                          {item.title[locale]}
                        </h3>
                        <p className="mt-2 font-body text-sm md:text-base text-white/60 leading-relaxed max-w-xl">
                          {item.description[locale]}
                        </p>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Notable Projects */}
        <section className="py-12 md:py-24 bg-brand-linen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                {T.projects.eyebrow[locale]}
              </span>
              <h2 className="mt-4 font-display text-3xl md:text-4xl font-light tracking-wide text-brand-charcoal">
                {T.projects.title[locale]}
              </h2>
              <p className="mt-4 font-body text-base text-dash-text-secondary max-w-2xl leading-relaxed">
                {T.projects.description[locale]}
              </p>
            </AnimatedSection>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {NOTABLE_INSTALLATIONS.map((project) => (
                <AnimatedSection key={project.name.en}>
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group bg-white rounded-xl overflow-hidden border border-brand-stone/15 hover:border-brand-copper/30 hover:shadow-lg transition-all h-full"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-brand-stone/10">
                      <div
                        className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                        style={{
                          backgroundImage: `url('${project.image}')`,
                          backgroundSize: "cover",
                          backgroundPosition: project.imagePosition ?? "center",
                        }}
                        role="img"
                        aria-label={project.name[locale]}
                      />
                    </div>
                    <div className="p-6 md:p-7">
                      <h3 className="font-display text-xl text-brand-charcoal group-hover:text-brand-copper transition-colors">
                        {project.name[locale]}
                      </h3>
                      <p className="mt-3 font-body text-sm text-dash-text-secondary leading-relaxed">
                        {project.description[locale]}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 font-body text-xs tracking-wider text-brand-copper uppercase">
                        {T.projects.viewProject[locale]} &rarr;
                      </span>
                    </div>
                  </a>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-24 bg-brand-terracotta">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <AnimatedSection>
              <h2 className="font-display text-3xl md:text-5xl font-light text-white tracking-wide">
                {T.cta.title[locale]}
              </h2>
              <p className="mt-4 font-body text-base text-white/80 max-w-xl mx-auto leading-relaxed">
                {T.cta.description[locale]}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="secondary"
                  size="lg"
                  href="/showroom"
                  className="border-white text-white hover:bg-dash-surface hover:text-brand-terracotta"
                >
                  {T.cta.visitCta[locale]}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  href={`https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}`}
                  className="text-white hover:text-white/80"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {T.cta.whatsappCta[locale]}
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
