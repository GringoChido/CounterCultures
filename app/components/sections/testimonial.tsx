"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";

const content = {
  en: {
    quote:
      "Counter Cultures transformed our project. Roger understood the vision immediately \u2014 he specified Brizo for the kitchen, TOTO for the guest baths, and then surprised us with a hand-hammered copper basin from a local artisan that became the centerpiece of the master suite. No other showroom in Mexico could have done that.",
    author: "Arq. Carolina Mendoza",
    role: "Principal, Studio Arquitectura MX \u00b7 San Miguel de Allende",
  },
  es: {
    quote:
      "Counter Cultures transform\u00f3 nuestro proyecto. Roger entendi\u00f3 la visi\u00f3n de inmediato \u2014 especific\u00f3 Brizo para la cocina, TOTO para los ba\u00f1os de invitados, y luego nos sorprendi\u00f3 con un lavabo de cobre martillado a mano de un artesano local que se convirti\u00f3 en la pieza central de la suite principal. Ning\u00fan otro showroom en M\u00e9xico podr\u00eda haber hecho eso.",
    author: "Arq. Carolina Mendoza",
    role: "Directora, Studio Arquitectura MX \u00b7 San Miguel de Allende",
  },
};

const Testimonial = ({ locale = "en" }: { locale?: string }) => {
  const t = content[locale as "en" | "es"];
  return (
    <section className="bg-brand-charcoal py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
        <AnimatedSection>
          <span className="inline-block font-display text-8xl text-brand-copper leading-none select-none">
            &ldquo;
          </span>

          <blockquote className="font-display text-2xl md:text-3xl text-white font-light italic leading-relaxed max-w-4xl mx-auto -mt-6">
            {t.quote}
          </blockquote>

          <div className="mt-8">
            <p className="font-mono text-sm text-brand-copper uppercase tracking-wider">
              {t.author}
            </p>
            <p className="font-body text-sm text-white/50 mt-1">{t.role}</p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export { Testimonial };
