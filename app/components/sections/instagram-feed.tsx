"use client";

import Image from "next/image";
import { AnimatedSection } from "@/app/components/ui/animated-section";

const placeholderImages = [
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&q=75&auto=format",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&q=75&auto=format",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=75&auto=format",
  "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=400&q=75&auto=format",
  "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400&q=75&auto=format",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=75&auto=format",
];

const InstagramFeed = () => (
  <section className="py-20 lg:py-28 bg-brand-linen">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <AnimatedSection>
        <div className="text-center mb-12">
          <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-stone uppercase">
            @countercultures
          </span>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
            Follow the Journey
          </h2>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {placeholderImages.map((src, i) => (
          <AnimatedSection key={i} delay={i * 0.05}>
            <a
              href="https://instagram.com/countercultures"
              target="_blank"
              rel="noopener noreferrer"
              className="group block relative aspect-square overflow-hidden"
            >
              <Image
                src={src}
                alt="Counter Cultures Instagram — luxury fixtures and artisanal designs"
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
              />
            </a>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export { InstagramFeed };
