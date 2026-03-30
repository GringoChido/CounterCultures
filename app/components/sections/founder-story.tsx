"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";

const content = {
  en: {
    eyebrow: "Our Story",
    title: "Twenty Years of Impeccable Taste",
    p1: "In 2004, Roger Williams opened a small workshop in San Miguel de Allende with a simple conviction: Mexico deserved access to the world\u2019s finest bath and kitchen design \u2014 and the world deserved to discover Mexico\u2019s extraordinary artisan tradition.",
    p2: "Two decades later, Counter Cultures is the only showroom in the country where you can specify a Kohler smart toilet and a hand-hammered copper basin from a third-generation artisan in Santa Clara del Cobre \u2014 in the same visit.",
    p3: "We bridge two worlds. International precision and Mexican soul. Factory specifications and artisan intuition. That\u2019s not a marketing line. It\u2019s what we do every day.",
    readMore: "Read the Full Story",
    meetArtisans: "Meet Our Artisans",
  },
  es: {
    eyebrow: "Nuestra Historia",
    title: "Veinte A\u00f1os de Gusto Impecable",
    p1: "En 2004, Roger Williams abri\u00f3 un peque\u00f1o taller en San Miguel de Allende con una convicci\u00f3n simple: M\u00e9xico merec\u00eda acceso al mejor dise\u00f1o de ba\u00f1o y cocina del mundo \u2014 y el mundo merec\u00eda descubrir la extraordinaria tradici\u00f3n artesanal de M\u00e9xico.",
    p2: "Dos d\u00e9cadas despu\u00e9s, Counter Cultures es el \u00fanico showroom del pa\u00eds donde puedes especificar un sanitario inteligente Kohler y un lavabo de cobre martillado a mano por un artesano de tercera generaci\u00f3n en Santa Clara del Cobre \u2014 en la misma visita.",
    p3: "Unimos dos mundos. Precisi\u00f3n internacional y alma mexicana. Especificaciones de f\u00e1brica e intuici\u00f3n artesanal. No es un eslogan. Es lo que hacemos todos los d\u00edas.",
    readMore: "Leer la Historia Completa",
    meetArtisans: "Conocer a Nuestros Artesanos",
  },
};

const FounderStory = ({ locale = "en" }: { locale?: string }) => {
  const t = content[locale as "en" | "es"];
  return (
    <section className="py-24 md:py-32 bg-brand-sand/40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <AnimatedSection>
            <div className="aspect-[3/4] overflow-hidden rounded-lg">
              <img
                src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
                alt="Counter Cultures showroom interior"
                className="w-full h-full object-cover"
              />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-copper">
              {t.eyebrow}
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-normal tracking-wide text-brand-charcoal leading-tight">
              {t.title}
            </h2>
            <div className="mt-6 space-y-4 font-body text-base text-brand-stone leading-relaxed">
              <p>{t.p1}</p>
              <p>{t.p2}</p>
              <p>{t.p3}</p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button variant="secondary" href="/our-story">
                {t.readMore}
              </Button>
              <Button variant="ghost" href="/artisanal">
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
