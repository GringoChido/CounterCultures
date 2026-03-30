"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";

const FounderStory = () => (
  <section className="py-24 md:py-32 bg-brand-sand/40">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Image */}
        <AnimatedSection>
          <div className="aspect-[3/4] overflow-hidden rounded-lg">
            <img
              src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
              alt="Counter Cultures showroom interior"
              className="w-full h-full object-cover"
            />
          </div>
        </AnimatedSection>

        {/* Text */}
        <AnimatedSection delay={0.2}>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-copper">
            Our Story
          </span>
          <h2 className="mt-4 font-display text-4xl md:text-5xl font-normal tracking-wide text-brand-charcoal leading-tight">
            Twenty Years of Impeccable Taste
          </h2>
          <div className="mt-6 space-y-4 font-body text-base text-brand-stone leading-relaxed">
            <p>
              In 2004, Roger Williams opened a small workshop in San Miguel de
              Allende with a simple conviction: Mexico deserved access to the
              world&apos;s finest bath and kitchen design — and the world deserved to
              discover Mexico&apos;s extraordinary artisan tradition.
            </p>
            <p>
              Two decades later, Counter Cultures is the only showroom in the
              country where you can specify a Kohler smart toilet and a
              hand-hammered copper basin from a third-generation artisan in Santa
              Clara del Cobre — in the same visit.
            </p>
            <p>
              We bridge two worlds. International precision and Mexican soul.
              Factory specifications and artisan intuition. That&apos;s not a
              marketing line. It&apos;s what we do every day.
            </p>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button variant="secondary" href="/our-story">
              Read the Full Story
            </Button>
            <Button variant="ghost" href="/artisanal">
              Meet Our Artisans
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </div>
  </section>
);

export { FounderStory };
