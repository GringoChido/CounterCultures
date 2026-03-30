"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";

const Testimonial = () => (
  <section className="bg-brand-charcoal py-20 md:py-28">
    <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
      <AnimatedSection>
        {/* Quotation mark */}
        <span className="inline-block font-display text-8xl text-brand-copper leading-none select-none">
          &ldquo;
        </span>

        <blockquote className="font-display text-2xl md:text-3xl text-white font-light italic leading-relaxed max-w-4xl mx-auto -mt-6">
          Counter Cultures transformed our project. Roger understood the vision
          immediately — he specified Brizo for the kitchen, TOTO for the guest
          baths, and then surprised us with a hand-hammered copper basin from a
          local artisan that became the centerpiece of the master suite. No other
          showroom in Mexico could have done that.
        </blockquote>

        <div className="mt-8">
          <p className="font-mono text-sm text-brand-copper uppercase tracking-wider">
            Arq. Carolina Mendoza
          </p>
          <p className="font-body text-sm text-white/50 mt-1">
            Principal, Studio Arquitectura MX · San Miguel de Allende
          </p>
        </div>
      </AnimatedSection>
    </div>
  </section>
);

export { Testimonial };
