"use client";

import { useState, type FormEvent } from "react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CategoryHero } from "@/app/components/sections/category-hero";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import {
  Check,
  DollarSign,
  Clock,
  FileText,
  HeadphonesIcon,
  Users,
} from "lucide-react";
import { useLocale } from "next-intl";

const t = {
  heroEyebrow: { en: "For Design Professionals", es: "Para Profesionales del Diseño" },
  heroTitle: { en: "Trade Program", es: "Programa Trade" },
  heroDescription: {
    en: "Dedicated pricing, specification support, and priority fulfillment for architects, designers, and builders.",
    es: "Precios profesionales, soporte de especificación y cumplimiento prioritario para arquitectos, diseñadores y constructores.",
  },
  heroCta: { en: "Apply Now", es: "Aplicar Ahora" },
  benefitsEyebrow: { en: "Why Join", es: "Por Qué Unirte" },
  benefitsTitle: { en: "Trade Benefits", es: "Beneficios Trade" },
  stepsEyebrow: { en: "Getting Started", es: "Cómo Empezar" },
  stepsTitle: { en: "What Happens Next", es: "¿Qué Sigue?" },
  brandsTitle: { en: "Brands Available Through Trade", es: "Marcas Disponibles a Través del Programa Trade" },
  formEyebrow: { en: "Trade Application", es: "Solicitud Trade" },
  formTitle: { en: "Apply for Access", es: "Solicitar Acceso" },
  formDescription: {
    en: "Open to licensed architects, interior designers, contractors, and hospitality developers. Approval typically takes 48 hours.",
    es: "Abierto a arquitectos licenciados, diseñadores de interiores, contratistas y desarrolladores de hospitalidad. La aprobación generalmente toma 48 horas.",
  },
  firstName: { en: "First name", es: "Nombre" },
  lastName: { en: "Last name", es: "Apellido" },
  company: { en: "Company / Studio name", es: "Empresa / Estudio" },
  profession: { en: "Profession", es: "Profesión" },
  profArchitect: { en: "Architect", es: "Arquitecto" },
  profDesigner: { en: "Interior Designer", es: "Diseñador de Interiores" },
  profContractor: { en: "General Contractor / Builder", es: "Contratista General / Constructor" },
  profDeveloper: { en: "Developer / Hospitality Group", es: "Desarrollador / Grupo de Hospitalidad" },
  profOther: { en: "Other", es: "Otro" },
  email: { en: "Email address", es: "Correo electrónico" },
  phone: { en: "Phone / WhatsApp", es: "Teléfono / WhatsApp" },
  website: { en: "Website or portfolio URL (optional)", es: "Sitio web o portafolio (opcional)" },
  license: { en: "License / Tax ID (RFC)", es: "Licencia / RFC" },
  messagePlaceholder: {
    en: "Tell us about your typical projects and how you'd use the trade program",
    es: "Cuéntanos sobre tus proyectos típicos y cómo usarías el programa trade",
  },
  terms: {
    en: "I agree to the Counter Cultures Trade Program terms and conditions. Trade pricing is confidential and not for resale.",
    es: "Acepto los términos y condiciones del Programa Trade de Counter Cultures. Los precios trade son exclusivos y protegidos.",
  },
  submitting: { en: "Submitting...", es: "Enviando..." },
  sent: { en: "Application Sent!", es: "¡Solicitud Enviada!" },
  submit: { en: "Submit Application", es: "Enviar Solicitud" },
  thankYou: {
    en: "Thank you! We\u2019ll review your application within 48 hours.",
    es: "¡Gracias! Revisaremos tu solicitud en 48 horas.",
  },
  error: {
    en: "Something went wrong. Please try again or contact us directly.",
    es: "Algo salió mal. Inténtalo de nuevo o contáctanos directamente.",
  },
  reviewedTime: { en: "Applications reviewed within 48 hours", es: "Solicitudes revisadas en 48 horas" },
};

const benefits = [
  {
    icon: DollarSign,
    title: { en: "Trade Pricing", es: "Precios Profesionales" },
    description: {
      en: "Dedicated pricing on all brands — Kohler, TOTO, Brizo, BLANCO, Sun Valley Bronze, and more.",
      es: "Precios profesionales en todas las marcas — Kohler, TOTO, Brizo, BLANCO, Sun Valley Bronze y más.",
    },
  },
  {
    icon: FileText,
    title: { en: "Specification Support", es: "Soporte de Especificación" },
    description: {
      en: "We help you spec the right products for your project — dimensions, finishes, compatibility, lead times.",
      es: "Te ayudamos a especificar los productos correctos — dimensiones, acabados, compatibilidad, tiempos de entrega.",
    },
  },
  {
    icon: Clock,
    title: { en: "Priority Fulfillment", es: "Cumplimiento Prioritario" },
    description: {
      en: "Trade orders get priority processing and expedited shipping coordination.",
      es: "Los pedidos trade reciben procesamiento prioritario y coordinación de envío expedita.",
    },
  },
  {
    icon: HeadphonesIcon,
    title: { en: "Dedicated Account Manager", es: "Gerente de Cuenta Personal" },
    description: {
      en: "A single point of contact who knows your projects, your preferences, and your timeline.",
      es: "Un solo punto de contacto que conoce tus proyectos, tus preferencias y tu cronograma.",
    },
  },
  {
    icon: Users,
    title: { en: "Client Presentations", es: "Presentaciones para Clientes" },
    description: {
      en: "Bring clients to the showroom for guided presentations. We make your specifications tangible.",
      es: "Trae a tus clientes al showroom para presentaciones guiadas. Hacemos tangibles tus especificaciones.",
    },
  },
];

const steps = [
  {
    number: "01",
    title: { en: "Apply", es: "Aplicar" },
    description: {
      en: "Fill out the trade application below. Takes about 2 minutes.",
      es: "Completa la solicitud trade abajo. Toma unos 2 minutos.",
    },
  },
  {
    number: "02",
    title: { en: "Review", es: "Revisión" },
    description: {
      en: "Our team reviews your application and verifies your credentials within 48 hours.",
      es: "Nuestro equipo revisa tu solicitud y verifica tus credenciales en 48 horas.",
    },
  },
  {
    number: "03",
    title: { en: "Welcome", es: "Bienvenida" },
    description: {
      en: "Once approved, you'll receive your trade account with dedicated pricing and a personal account manager.",
      es: "Una vez aprobado, recibirás tu cuenta trade con precios profesionales y un gerente de cuenta personal.",
    },
  },
];

export const TradeContent = () => {
  const locale = useLocale() as "en" | "es";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.get("firstName"),
          lastName: data.get("lastName"),
          company: data.get("company"),
          profession: data.get("profession"),
          email: data.get("email"),
          phone: data.get("phone"),
          website: data.get("website"),
          license: data.get("license"),
          message: data.get("message"),
        }),
      });

      if (!res.ok) throw new Error();
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  return (
  <>
    <Header locale={locale} />
    <main>
      <CategoryHero
        eyebrow={t.heroEyebrow[locale]}
        title={t.heroTitle[locale]}
        description={t.heroDescription[locale]}
        imageSrc="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
        ctaLabel={t.heroCta[locale]}
        ctaHref="#apply"
      />

      {/* Benefits */}
      <section className="py-12 md:py-28 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
              {t.benefitsEyebrow[locale]}
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
              {t.benefitsTitle[locale]}
            </h2>
          </AnimatedSection>

          <div className="mt-10 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {benefits.map((benefit) => (
              <AnimatedSection key={benefit.title.en}>
                <div className="p-6 bg-white rounded-lg border border-brand-stone/10">
                  <benefit.icon className="w-6 h-6 text-brand-terracotta mb-4" />
                  <h3 className="font-display text-xl text-brand-charcoal">
                    {benefit.title[locale]}
                  </h3>
                  <p className="mt-2 font-body text-sm text-brand-stone leading-relaxed">
                    {benefit.description[locale]}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-28 bg-brand-charcoal">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
              {t.stepsEyebrow[locale]}
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-white">
              {t.stepsTitle[locale]}
            </h2>
          </AnimatedSection>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <AnimatedSection key={step.number}>
                <div className="py-8 border-t border-white/10">
                  <span className="font-mono text-3xl text-brand-copper font-medium">
                    {step.number}
                  </span>
                  <h3 className="mt-4 font-display text-2xl text-white font-light">
                    {step.title[locale]}
                  </h3>
                  <p className="mt-2 font-body text-sm text-white/60 leading-relaxed">
                    {step.description[locale]}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Brands We Carry */}
      <section className="py-16 bg-brand-sand/30 border-b border-brand-stone/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <h3 className="font-display text-2xl text-brand-charcoal font-light text-center mb-8">
              {t.brandsTitle[locale]}
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {[
                "Kohler",
                "TOTO",
                "Brizo",
                "BLANCO",
                "California Faucets",
                "Sun Valley Bronze",
                "Emtek",
                "Badeloft",
                "Villeroy & Boch",
              ].map((brand) => (
                <span
                  key={brand}
                  className="font-body text-sm text-brand-stone tracking-wider"
                >
                  {brand}
                </span>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-12 md:py-28 bg-brand-linen">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
              {t.formEyebrow[locale]}
            </span>
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal">
              {t.formTitle[locale]}
            </h2>
            <p className="mt-4 font-body text-base text-brand-stone leading-relaxed">
              {t.formDescription[locale]}
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder={t.firstName[locale]}
                  className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder={t.lastName[locale]}
                  className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
                />
              </div>
              <input
                type="text"
                name="company"
                required
                placeholder={t.company[locale]}
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
              />
              <select
                name="profession"
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
                defaultValue=""
              >
                <option value="" disabled>
                  {t.profession[locale]}
                </option>
                <option value="architect">{t.profArchitect[locale]}</option>
                <option value="interior-designer">{t.profDesigner[locale]}</option>
                <option value="contractor">{t.profContractor[locale]}</option>
                <option value="developer">{t.profDeveloper[locale]}</option>
                <option value="other">{t.profOther[locale]}</option>
              </select>
              <input
                type="email"
                name="email"
                required
                placeholder={t.email[locale]}
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
              />
              <input
                type="tel"
                name="phone"
                placeholder={t.phone[locale]}
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
              />
              <input
                type="url"
                name="website"
                placeholder={t.website[locale]}
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
              />
              <input
                type="text"
                name="license"
                placeholder={t.license[locale]}
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
              />
              <textarea
                name="message"
                placeholder={t.messagePlaceholder[locale]}
                rows={4}
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors resize-none"
              />

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 accent-brand-terracotta"
                />
                <label
                  htmlFor="terms"
                  className="font-body text-sm text-brand-stone"
                >
                  {t.terms[locale]}
                </label>
              </div>

              <Button variant="primary" className="w-full" disabled={status === "sending"}>
                {status === "sending" ? t.submitting[locale] : status === "sent" ? t.sent[locale] : t.submit[locale]}
              </Button>

              {status === "sent" && (
                <p className="font-body text-sm text-brand-sage text-center">
                  {t.thankYou[locale]}
                </p>
              )}
              {status === "error" && (
                <p className="font-body text-sm text-red-600 text-center">
                  {t.error[locale]}
                </p>
              )}
              {status === "idle" && (
                <div className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-brand-sage" />
                  <p className="font-body text-sm text-brand-stone">
                    {t.reviewedTime[locale]}
                  </p>
                </div>
              )}
            </form>
          </AnimatedSection>
        </div>
      </section>
    </main>
    <Footer locale={locale} />
  </>
  );
};
