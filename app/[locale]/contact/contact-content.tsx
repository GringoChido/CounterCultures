"use client";

import { useState, type FormEvent } from "react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { MapPin, Clock, Phone, Mail, MessageCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { SITE_CONFIG } from "@/app/lib/constants";

const t = {
  eyebrow: { en: "Get in Touch", es: "Contáctanos" },
  title: { en: "Contact Us", es: "Contáctanos" },
  subtitle: {
    en: "Whether you're planning a renovation, specifying fixtures for a project, or just browsing \u2014 we'd love to hear from you.",
    es: "Ya sea que estés planeando una renovación, especificando accesorios para un proyecto, o simplemente explorando \u2014 nos encantaría saber de ti.",
  },
  formTitle: { en: "Send Us a Message", es: "Env\u00edanos un Mensaje" },
  firstName: { en: "First name", es: "Nombre" },
  lastName: { en: "Last name", es: "Apellido" },
  email: { en: "Email address", es: "Correo electr\u00f3nico" },
  phone: { en: "Phone / WhatsApp", es: "Tel\u00e9fono / WhatsApp" },
  selectType: { en: "How can Counter Cultures support your project?", es: "\u00bfC\u00f3mo puede Counter Cultures apoyar tu proyecto?" },
  residential: { en: "Residential Project", es: "Proyecto Residencial" },
  commercial: { en: "Commercial / Hospitality", es: "Comercial / Hospitalidad" },
  trade: { en: "Trade Program Inquiry", es: "Consulta Programa Trade" },
  artisanal: { en: "Custom / Artisanal Piece", es: "Pieza Personalizada / Artesanal" },
  quote: { en: "Product Quote", es: "Cotizaci\u00f3n de Producto" },
  other: { en: "General Question", es: "Pregunta General" },
  message: { en: "Tell us about your project or question", es: "Cu\u00e9ntanos sobre tu proyecto o pregunta" },
  sending: { en: "Sending...", es: "Enviando..." },
  sent: { en: "Sent!", es: "\u00a1Enviado!" },
  send: { en: "Send Message", es: "Enviar Mensaje" },
  thankYou: { en: "Thank you! We'll be in touch within 2 hours.", es: "\u00a1Gracias! Te responderemos en menos de 2 horas." },
  error: { en: "Something went wrong. Please try again or message us on WhatsApp.", es: "Algo sali\u00f3 mal. Int\u00e9ntalo de nuevo o escr\u00edbenos por WhatsApp." },
  responseTime: { en: "We respond within 2 hours during business hours.", es: "Respondemos en 2 horas durante horario laboral." },
  showroom: { en: "Showroom", es: "Showroom" },
  getDirections: { en: "Get Directions \u2192", es: "C\u00f3mo Llegar \u2192" },
  preferMessaging: { en: "Prefer messaging?", es: "\u00bfPrefieres escribirnos?" },
  whatsapp: { en: "Message on WhatsApp", es: "Mensaje por WhatsApp" },
  forProfessionals: { en: "For design professionals", es: "Para profesionales del dise\u00f1o" },
  tradeCopy: {
    en: "Architects, designers, and builders \u2014 ask about our Trade Program for dedicated pricing and specification support.",
    es: "Arquitectos, dise\u00f1adores y constructores \u2014 preg\u00fanta sobre nuestro Programa Trade para precios profesionales y soporte de especificaci\u00f3n.",
  },
  learnTrade: { en: "Learn About Trade \u2192", es: "Conocer el Programa Trade \u2192" },
};

export const ContactContent = () => {
  const locale = useLocale() as "en" | "es";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.get("firstName"),
          lastName: data.get("lastName"),
          email: data.get("email"),
          phone: data.get("phone"),
          type: data.get("type"),
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
      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-40 md:pb-20 bg-brand-charcoal">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
              {t.eyebrow[locale]}
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-7xl font-light text-white tracking-wide">
              {t.title[locale]}
            </h1>
            <p className="mt-6 font-body text-base text-white/60 max-w-xl leading-relaxed">
              {t.subtitle[locale]}
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Form + Info */}
      <section className="py-12 md:py-28 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20">
            {/* Form — left, wider */}
            <div className="lg:col-span-3">
              <AnimatedSection>
                <h2 className="font-display text-3xl font-light tracking-wide text-brand-charcoal mb-8">
                  {t.formTitle[locale]}
                </h2>
                <form className="space-y-5" onSubmit={handleSubmit}>
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
                  <select
                    name="type"
                    className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {t.selectType[locale]}
                    </option>
                    <option value="residential">{t.residential[locale]}</option>
                    <option value="commercial">{t.commercial[locale]}</option>
                    <option value="trade">{t.trade[locale]}</option>
                    <option value="artisanal">{t.artisanal[locale]}</option>
                    <option value="quote">{t.quote[locale]}</option>
                    <option value="other">{t.other[locale]}</option>
                  </select>
                  <textarea
                    name="message"
                    placeholder={t.message[locale]}
                    rows={5}
                    className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors resize-none"
                  />
                  <Button variant="primary" className="w-full sm:w-auto" disabled={status === "sending"}>
                    {status === "sending" ? t.sending[locale] : status === "sent" ? t.sent[locale] : t.send[locale]}
                  </Button>
                  {status === "sent" && (
                    <p className="font-body text-sm text-brand-sage">
                      {t.thankYou[locale]}
                    </p>
                  )}
                  {status === "error" && (
                    <p className="font-body text-sm text-red-600">
                      {t.error[locale]}
                    </p>
                  )}
                  {status === "idle" && (
                    <p className="font-body text-sm text-brand-stone">
                      {t.responseTime[locale]}
                    </p>
                  )}
                </form>
              </AnimatedSection>
            </div>

            {/* Info — right */}
            <div className="lg:col-span-2">
              <AnimatedSection delay={0.2}>
                <h3 className="font-display text-2xl font-light tracking-wide text-brand-charcoal mb-6">
                  {t.showroom[locale]}
                </h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                    <div>
                      <p className="font-body text-base text-brand-charcoal font-medium">
                        {SITE_CONFIG.showroom.address}
                      </p>
                      <a
                        href="#"
                        className="font-body text-sm text-brand-terracotta hover:text-brand-copper transition-colors mt-1 inline-block"
                      >
                        {t.getDirections[locale]}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                    <p className="font-body text-base text-brand-charcoal">
                      {SITE_CONFIG.showroom.hours}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                    <a
                      href={`tel:${SITE_CONFIG.showroom.phone}`}
                      className="font-body text-base text-brand-charcoal hover:text-brand-terracotta transition-colors"
                    >
                      {SITE_CONFIG.showroom.phone}
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                    <a
                      href={`mailto:${SITE_CONFIG.showroom.email}`}
                      className="font-body text-base text-brand-charcoal hover:text-brand-terracotta transition-colors"
                    >
                      {SITE_CONFIG.showroom.email}
                    </a>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-brand-stone/15">
                  <h4 className="font-body text-sm font-semibold text-brand-charcoal mb-3">
                    {t.preferMessaging[locale]}
                  </h4>
                  <Button
                    variant="whatsapp"
                    size="md"
                    href={`https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}`}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {t.whatsapp[locale]}
                  </Button>
                </div>

                <div className="mt-8 pt-8 border-t border-brand-stone/15">
                  <h4 className="font-body text-sm font-semibold text-brand-charcoal mb-3">
                    {t.forProfessionals[locale]}
                  </h4>
                  <p className="font-body text-sm text-brand-stone leading-relaxed">
                    {t.tradeCopy[locale]}
                  </p>
                  <Button variant="ghost" size="sm" href="/trade" className="mt-3">
                    {t.learnTrade[locale]}
                  </Button>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </main>
    <Footer locale={locale} />
  </>
  );
};
