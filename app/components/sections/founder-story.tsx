import Image from "next/image";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";

const content = {
  en: {
    eyebrow: "Our Story",
    title: "Twenty Two Years of Impeccable Taste",
    p1: "Counter Cultures is a premium kitchen, bath, and architectural hardware showroom in San Miguel de Allende, Mexico. In 2004, Roger Williams opened a small workshop here with a simple conviction: Mexico deserved direct access to the leading international bath and kitchen brands \u2014 and the world deserved to know Mexico\u2019s artisan tradition.",
    p2: "Two decades later, you can specify a Kohler WASHLET and a hand-hammered copper basin from a third-generation artisan in Santa Clara del Cobre in the same visit \u2014 because the showroom was built around exactly that pairing.",
    p3: "We bridge two worlds. International precision and Mexican soul. Factory specifications and artisan intuition. That\u2019s not a marketing line. It\u2019s what we do every day.",
    readMore: "Read the Full Story",
    meetArtisans: "Meet Our Artisans",
  },
  es: {
    eyebrow: "Nuestra Historia",
    title: "Veintid\u00f3s A\u00f1os de Gusto Impecable",
    p1: "Counter Cultures es un showroom premium de cocina, ba\u00f1o y herrajes arquitect\u00f3nicos en San Miguel de Allende, M\u00e9xico. En 2004, Roger Williams abri\u00f3 un peque\u00f1o taller aqu\u00ed con una convicci\u00f3n simple: M\u00e9xico merec\u00eda acceso directo a las principales marcas internacionales de ba\u00f1o y cocina \u2014 y el mundo merec\u00eda conocer la tradici\u00f3n artesanal de M\u00e9xico.",
    p2: "Dos d\u00e9cadas despu\u00e9s, puedes especificar un WASHLET de Kohler y un lavabo de cobre martillado a mano por un artesano de tercera generaci\u00f3n de Santa Clara del Cobre en la misma visita \u2014 porque el showroom se construy\u00f3 alrededor de ese cruce.",
    p3: "Unimos dos mundos. Precisi\u00f3n internacional y alma mexicana. Especificaciones de f\u00e1brica e intuici\u00f3n artesanal. No es un eslogan. Es lo que hacemos todos los d\u00edas.",
    readMore: "Leer la Historia Completa",
    meetArtisans: "Conocer a Nuestros Artesanos",
  },
};

const FounderStory = ({ locale = "en" }: { locale?: string }) => {
  const t = content[locale as "en" | "es"];
  return (
    <section className="py-14 md:py-32 bg-brand-sand/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <AnimatedSection>
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
              <Image
                src="/images/home/twenty-years.webp"
                alt="Counter Cultures showroom — premium kitchen and bath fixtures curated in San Miguel de Allende"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <span className="font-body font-semibold text-xs uppercase tracking-[0.2em] text-brand-terracotta">
              {t.eyebrow}
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-normal tracking-wide text-brand-charcoal leading-tight">
              {t.title}
            </h2>
            <div className="mt-6 space-y-4 font-body text-base text-dash-text-secondary leading-relaxed">
              <p>{t.p1}</p>
              <p>{t.p2}</p>
              <p>{t.p3}</p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button variant="secondary" href="/our-story">
                {t.readMore}
              </Button>
              <Button variant="ghost" href="/brands">
                {t.meetArtisans}
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export { FounderStory };
