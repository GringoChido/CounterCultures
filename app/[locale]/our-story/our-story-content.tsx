import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CategoryHero } from "@/app/components/sections/category-hero";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { SITE_CONFIG } from "@/app/lib/constants";

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
      en: "Roger Williams opens a small showroom on a quiet street in San Miguel de Allende, stocking a handful of imported fixtures alongside pieces from local artisans.",
      es: "Roger Williams abre un pequeño showroom en una calle tranquila de San Miguel de Allende, con un puñado de accesorios importados junto a piezas de artesanos locales.",
    },
  },
  {
    year: "2008",
    title: {
      en: "First Major Brand",
      es: "La Primera Marca",
    },
    description: {
      en: "Counter Cultures becomes an authorized Kohler dealer — one of the first in central Mexico — bridging the gap between international quality and local availability.",
      es: "Counter Cultures se convierte en distribuidor autorizado de Kohler — uno de los primeros del centro de México — cerrando la brecha entre calidad internacional y disponibilidad local.",
    },
  },
  {
    year: "2012",
    title: {
      en: "The Artisanal Program",
      es: "El Programa Artesanal",
    },
    description: {
      en: "Roger formalizes partnerships with copper, stone, and ceramic artisans across Guanajuato, creating the Counter Cultures Artisanal Collection.",
      es: "Roger formaliza alianzas con artesanos del cobre, la piedra y la cerámica en todo Guanajuato, creando la Colección Artesanal de Counter Cultures.",
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
      en: "Two decades in, Counter Cultures has furnished thousands of homes, hotels, and restaurants — still curating where international design meets Mexican craft.",
      es: "Dos décadas después, Counter Cultures ha amueblado miles de casas, hoteles y restaurantes — sigue curando donde el diseño internacional se encuentra con el arte mexicano.",
    },
  },
];

interface ArtisanProfile {
  name: string;
  craft: { en: string; es: string };
  description: { en: string; es: string };
  image: string;
}

const artisans: ArtisanProfile[] = [
  {
    name: "Don Miguel Hernández",
    craft: {
      en: "Copper Basin Artisan · Santa Clara del Cobre",
      es: "Artesano de Lavabos de Cobre · Santa Clara del Cobre",
    },
    description: {
      en: "Third-generation coppersmith. Each of Don Miguel's basins is hand-hammered from a single sheet of copper — no seams, no molds, no shortcuts.",
      es: "Maestro del cobre, tercera generación. Cada lavabo de Don Miguel se martilla a mano desde una sola lámina de cobre — sin uniones, sin moldes, sin atajos.",
    },
    image: "/Assets/Santa Clara del Cobre.webp",
  },
  {
    name: "Maestra Elena Ruiz",
    craft: {
      en: "Ceramic Artist · Dolores Hidalgo",
      es: "Artista de Cerámica · Dolores Hidalgo",
    },
    description: {
      en: "Elena's hand-painted ceramic sinks draw from centuries of Talavera tradition, reinterpreted with contemporary forms and a restrained palette.",
      es: "Los lavabos de cerámica pintados a mano de Elena se inspiran en siglos de tradición talavera, reinterpretados con formas contemporáneas y una paleta sobria.",
    },
    image: "/Assets/Mistoa Studio.webp",
  },
  {
    name: "Taller Piedra Viva",
    craft: {
      en: "Stone Carvers · Querétaro",
      es: "Talladores de Piedra · Querétaro",
    },
    description: {
      en: "A collective of stone carvers working in cantera rosa and volcanic basalt. Their vessel sinks and countertops bring the raw beauty of Mexican geology indoors.",
      es: "Un colectivo de talladores que trabajan en cantera rosa y basalto volcánico. Sus lavabos y cubiertas traen la belleza cruda de la geología mexicana al interior.",
    },
    image: "/Assets/Stone Artisans.webp",
  },
];

const T = {
  hero: {
    eyebrow: { en: "Our Story", es: "Nuestra Historia" },
    title: { en: "Where Two Worlds Meet", es: "Donde Dos Mundos Se Encuentran" },
    description: {
      en: "Authorized dealer for Kohler, TOTO, Brizo, BLANCO, and other international brands — and partner to Mexican artisans since 2004.",
      es: "Distribuidor autorizado de Kohler, TOTO, Brizo, BLANCO y otras marcas internacionales — y socio de los artesanos mexicanos desde 2004.",
    },
    cta: { en: "Visit the Showroom", es: "Visita el Showroom" },
  },
  founder: {
    eyebrow: { en: "The Founder", es: "El Fundador" },
    title: "Roger Williams",
    p1: {
      en: "Roger arrived in San Miguel de Allende in the early 2000s with a background in construction and an eye for detail. What he found was a city full of stunning architecture — and almost nowhere to source the fixtures those buildings deserved.",
      es: "Roger llegó a San Miguel de Allende a principios de los 2000 con experiencia en construcción y ojo para los detalles. Encontró una ciudad llena de arquitectura impresionante — y casi ningún lugar de donde obtener los accesorios que esas obras merecían.",
    },
    p2: {
      en: "He started Counter Cultures to solve that problem: a showroom where an architect could spec a TOTO WASHLET for a guest bath, a BLANCO Silgranit for the kitchen, and then commission a hand-hammered copper basin from a third-generation coppersmith — all in one visit.",
      es: "Fundó Counter Cultures para resolver ese problema: un showroom donde un arquitecto pudiera especificar un WASHLET de TOTO para un baño de visitas, una tarja BLANCO Silgranit para la cocina, y luego encargar un lavabo de cobre martillado a mano por un artesano de tercera generación — todo en una sola visita.",
    },
    p3: {
      en: "Twenty years later, the mission hasn't changed. Authorized dealer for the leading international bath, kitchen, and hardware brands; long-standing partner to Mexican artisans across Guanajuato. Roger still believes the best spaces need both.",
      es: "Veinte años después, la misión no ha cambiado. Distribuidor autorizado de las principales marcas internacionales de baño, cocina y herrajes; socio de larga trayectoria de los artesanos mexicanos de Guanajuato. Roger sigue creyendo que los mejores espacios necesitan ambos.",
    },
    image: "/Assets/home-page/Twenty Years of Impeccable Taste.jpg",
  },
  timeline: {
    eyebrow: { en: "20 Years in the Making", es: "20 Años en Construcción" },
    title: { en: "Our Timeline", es: "Nuestra Trayectoria" },
  },
  artisans: {
    eyebrow: { en: "The Artisans", es: "Los Artesanos" },
    title: {
      en: "Masters of Their Craft",
      es: "Maestros de Su Oficio",
    },
    description: {
      en: "Behind every artisanal piece is a maker with decades of tradition in their hands. These are some of the artisans who make Counter Cultures possible.",
      es: "Detrás de cada pieza artesanal hay un creador con décadas de tradición en sus manos. Estos son algunos de los artesanos que hacen posible Counter Cultures.",
    },
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
    whatsappCta: { en: "Message on WhatsApp", es: "Escríbenos por WhatsApp" },
  },
};

export const OurStoryContent = () => {
  const locale = useLocale() as Locale;

  return (
  <>
    <Header locale={locale} />
    <main id="main" tabIndex={-1}>
      <CategoryHero
        eyebrow={T.hero.eyebrow[locale]}
        title={T.hero.title[locale]}
        description={T.hero.description[locale]}
        imageSrc="/Assets/home-page/Twenty Years of Impeccable Taste.jpg"
        ctaLabel={T.hero.cta[locale]}
        ctaHref="/showroom"
      />

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

          <div className="mt-16 space-y-0">
            {timeline.map((item, i) => (
              <AnimatedSection key={item.year} delay={i * 0.1}>
                <div className="flex gap-5 md:gap-12 py-6 md:py-8 border-t border-white/10">
                  <span className="font-mono text-xl md:text-3xl text-brand-copper font-medium shrink-0 w-16 md:w-24">
                    {item.year}
                  </span>
                  <div>
                    <h3 className="font-display text-xl md:text-2xl text-white font-light">
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
      </section>

      {/* Artisan Profiles */}
      <section className="py-12 md:py-28 bg-brand-sand/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
              {T.artisans.eyebrow[locale]}
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
              {T.artisans.title[locale]}
            </h2>
            <p className="mt-4 font-body text-base text-dash-text-secondary max-w-2xl leading-relaxed">
              {T.artisans.description[locale]}
            </p>
          </AnimatedSection>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {artisans.map((artisan) => (
              <AnimatedSection key={artisan.name}>
                <div className="group">
                  <div className="aspect-[4/5] rounded-lg overflow-hidden bg-brand-stone/10">
                    <div
                      className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                      style={{
                        backgroundImage: `url('${artisan.image}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  </div>
                  <h3 className="mt-4 font-display text-xl text-brand-charcoal">
                    {artisan.name}
                  </h3>
                  <p className="mt-1 font-body font-semibold text-xs tracking-wider text-brand-terracotta uppercase">
                    {artisan.craft[locale]}
                  </p>
                  <p className="mt-3 font-body text-sm text-dash-text-secondary leading-relaxed">
                    {artisan.description[locale]}
                  </p>
                </div>
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
    <Footer locale={locale} />
  </>
  );
};
