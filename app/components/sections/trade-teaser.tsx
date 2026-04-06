"use client";

import Image from "next/image";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { Check } from "lucide-react";

const content = {
  en: {
    badge: "For Design Professionals",
    title: "Your Specification Partner in Mexico",
    subtitle: "Architects, designers, and builders: access authorized dealer pricing on 491+ products from 19 brands at Counter Cultures in San Miguel de Allende. Dedicated account management, specification support, and priority access to new collections.",
    benefits: [
      "Preferred trade pricing on all 19 authorized brands",
      "Dedicated account manager and specification support",
      "Access to 491+ products — Kohler, TOTO, Brizo, BLANCO, and more",
      "Priority access to new collections and artisan commissions",
    ],
    cta: "Apply for Trade Access",
    note: "Approval within 48 hours. WhatsApp support included.",
  },
  es: {
    badge: "Para Profesionales del Dise\u00f1o",
    title: "Tu Socio de Especificaci\u00f3n en M\u00e9xico",
    subtitle: "Arquitectos, dise\u00f1adores y constructores: accede a precios de distribuidor autorizado en 491+ productos de 19 marcas en Counter Cultures, San Miguel de Allende. Gesti\u00f3n de cuenta dedicada, soporte de especificaci\u00f3n y acceso prioritario a nuevas colecciones.",
    benefits: [
      "Precios trade preferenciales en las 19 marcas autorizadas",
      "Gerente de cuenta dedicado y soporte de especificaci\u00f3n",
      "Acceso a 491+ productos — Kohler, TOTO, Brizo, BLANCO y m\u00e1s",
      "Acceso prioritario a nuevas colecciones y encargos artesanales",
    ],
    cta: "Solicitar Acceso Trade",
    note: "Aprobaci\u00f3n en 48 horas. Soporte por WhatsApp incluido.",
  },
};

const TradeTeaser = ({ locale = "en" }: { locale?: string }) => {
  const t = content[locale as "en" | "es"];
  return (
    <section className="py-14 md:py-32 bg-brand-sage/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <AnimatedSection className="lg:col-span-7">
            <span className="inline-block bg-brand-sage text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm">
              {t.badge}
            </span>
            <h2 className="mt-6 font-display text-4xl md:text-5xl font-normal tracking-wide text-brand-charcoal leading-tight">
              {t.title}
            </h2>
            <p className="mt-4 font-body text-base text-brand-stone leading-relaxed max-w-lg">
              {t.subtitle}
            </p>
            <ul className="mt-6 space-y-3">
              {t.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand-sage mt-0.5 shrink-0" />
                  <span className="font-body text-sm text-brand-charcoal">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button variant="primary" href="/trade">
                {t.cta}
              </Button>
              <p className="mt-3 font-body text-sm text-brand-stone">
                {t.note}
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2} className="lg:col-span-5">
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=75&auto=format"
                alt="Architect reviewing fixture specifications at Counter Cultures showroom"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export { TradeTeaser };
