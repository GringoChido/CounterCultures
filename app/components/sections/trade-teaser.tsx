"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { Check } from "lucide-react";

const benefits = [
  "Exclusive trade pricing on all brands",
  "Dedicated account manager",
  "Specification sheets and technical support",
  "Priority access to new collections and artisan commissions",
];

const TradeTeaser = () => (
  <section className="py-24 md:py-32 bg-brand-sage/10">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {/* Text — left side */}
        <AnimatedSection className="lg:col-span-7">
          <span className="inline-block bg-brand-sage text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm">
            For Design Professionals
          </span>
          <h2 className="mt-6 font-display text-4xl md:text-5xl font-normal tracking-wide text-brand-charcoal leading-tight">
            Your Specification Partner in Mexico
          </h2>
          <p className="mt-4 font-body text-base text-brand-stone leading-relaxed max-w-lg">
            Architects, designers, and builders: access trade pricing, dedicated account
            management, specification support, and priority access to new collections.
            Join the Counter Cultures trade network.
          </p>
          <ul className="mt-6 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-brand-sage mt-0.5 shrink-0" />
                <span className="font-body text-sm text-brand-charcoal">{benefit}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button variant="primary" href="/trade">
              Apply for Trade Access
            </Button>
            <p className="mt-3 font-body text-sm text-brand-stone">
              Approval within 48 hours. WhatsApp support included.
            </p>
          </div>
        </AnimatedSection>

        {/* Image — right side */}
        <AnimatedSection delay={0.2} className="lg:col-span-5">
          <div className="aspect-[4/5] rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80"
              alt="Architect reviewing fixture specifications"
              className="w-full h-full object-cover"
            />
          </div>
        </AnimatedSection>
      </div>
    </div>
  </section>
);

export { TradeTeaser };
