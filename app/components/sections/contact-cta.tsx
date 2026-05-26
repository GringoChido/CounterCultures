"use client";

import { useState, type FormEvent } from "react";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import {
  TextField,
  TextAreaField,
  SelectField,
} from "@/app/components/ui/field";
import { MapPin, Clock, Phone, MessageCircle } from "lucide-react";
import { SITE_CONFIG } from "@/app/lib/constants";

const content = {
  en: {
    title: "Visit Our Showroom in San Miguel de Allende",
    getDirections: "Get Directions \u2192",
    formTitle: "Start Your Project — We Source, Quote & Deliver",
    name: "Your name",
    email: "Email address",
    phone: "Phone number",
    projectType: "Project type",
    residential: "Residential",
    commercial: "Commercial",
    trade: "Trade / Professional",
    message: "Tell us about your project",
    send: "Send Message",
    sending: "Sending...",
    sent: "Sent!",
    responseTime: "Tell us what you're looking for. We'll find it, quote it, and deliver it to your project. Response within 2 hours.",
    successMsg: "Thank you! We\u2019ll be in touch within 2 hours.",
    errorMsg: "Something went wrong. Please try again.",
    whatsapp: "Message on WhatsApp",
  },
  es: {
    title: "Visita Nuestro Showroom en San Miguel de Allende",
    getDirections: "C\u00f3mo Llegar \u2192",
    formTitle: "Inicia Tu Proyecto — Importamos, Cotizamos y Entregamos",
    name: "Tu nombre",
    email: "Correo electr\u00f3nico",
    phone: "Tel\u00e9fono",
    projectType: "Tipo de proyecto",
    residential: "Residencial",
    commercial: "Comercial",
    trade: "Trade / Profesional",
    message: "Cu\u00e9ntanos sobre tu proyecto",
    send: "Enviar Mensaje",
    sending: "Enviando...",
    sent: "\u00a1Enviado!",
    responseTime: "Cuéntanos qué buscas. Lo encontramos, cotizamos y entregamos en tu proyecto. Respuesta en 2 horas.",
    successMsg: "\u00a1Gracias! Te contactaremos en 2 horas.",
    errorMsg: "Algo sali\u00f3 mal. Int\u00e9ntalo de nuevo.",
    whatsapp: "Mensaje por WhatsApp",
  },
};

const ContactCTA = ({ locale = "en" }: { locale?: string }) => {
  const t = content[locale as "en" | "es"];
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
          firstName: data.get("name"),
          lastName: "",
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
    <section className="py-14 md:py-24 bg-brand-linen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <AnimatedSection>
            <h2 className="font-display text-3xl md:text-5xl font-normal tracking-wide text-brand-charcoal">
              {t.title}
            </h2>
            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                <div>
                  <a
                    href={SITE_CONFIG.showroom.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-base text-brand-charcoal font-medium hover:text-brand-terracotta transition-colors block"
                  >
                    {SITE_CONFIG.showroom.address}
                  </a>
                  <a
                    href={SITE_CONFIG.showroom.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-sm text-brand-terracotta hover:text-brand-copper transition-colors mt-1 inline-block"
                  >
                    {t.getDirections}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                <p className="font-body text-base text-brand-charcoal">
                  {SITE_CONFIG.showroom.hours}
                </p>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                <a
                  href={`tel:${SITE_CONFIG.showroom.phone}`}
                  className="font-body text-base text-brand-charcoal hover:text-brand-terracotta transition-colors"
                >
                  {SITE_CONFIG.showroom.phone}
                </a>
              </div>
            </div>
            <div className="mt-8">
              <Button
                variant="whatsapp"
                href={`https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}`}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {t.whatsapp}
              </Button>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="bg-dash-surface rounded-lg cc-lift-subtle border border-dash-border p-6 md:p-8">
            <h3 className="font-display text-3xl font-normal tracking-wide text-brand-charcoal mb-6">
              {t.formTitle}
            </h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <TextField
                label={t.name}
                hideLabel
                name="name"
                type="text"
                required
                placeholder={t.name}
                autoComplete="name"
              />
              <TextField
                label={t.email}
                hideLabel
                name="email"
                type="email"
                required
                placeholder={t.email}
                autoComplete="email"
              />
              <TextField
                label={t.phone}
                hideLabel
                name="phone"
                type="tel"
                placeholder={t.phone}
                autoComplete="tel"
              />
              <SelectField
                label={t.projectType}
                hideLabel
                name="type"
                defaultValue=""
              >
                <option value="" disabled>
                  {t.projectType}
                </option>
                <option value="residential">{t.residential}</option>
                <option value="commercial">{t.commercial}</option>
                <option value="trade">{t.trade}</option>
              </SelectField>
              <TextAreaField
                label={t.message}
                hideLabel
                name="message"
                placeholder={t.message}
                rows={3}
              />
              <Button variant="primary" className="w-full" disabled={status === "sending"}>
                {status === "sending" ? t.sending : status === "sent" ? t.sent : t.send}
              </Button>
              {status === "sent" && (
                <p role="status" aria-live="polite" className="font-body text-sm text-brand-sage text-center">{t.successMsg}</p>
              )}
              {status === "error" && (
                <p role="alert" aria-live="assertive" className="font-body text-sm text-dash-danger text-center">{t.errorMsg}</p>
              )}
              {status === "idle" && (
                <p className="font-body text-sm text-dash-text-secondary text-center">{t.responseTime}</p>
              )}
            </form>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export { ContactCTA };
