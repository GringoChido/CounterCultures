"use client";

import { useState, type FormEvent } from "react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CategoryHero } from "@/app/components/sections/category-hero";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import {
  TextField,
  TextAreaField,
  SelectField,
} from "@/app/components/ui/field";
import { MapPin, Clock, Phone, MessageCircle, Mail } from "lucide-react";
import { useLocale } from "next-intl";
import { SITE_CONFIG } from "@/app/lib/constants";

const t = {
  heroEyebrow: { en: "San Miguel de Allende", es: "San Miguel de Allende" },
  heroTitle: { en: "Visit the Showroom", es: "Visita el Showroom" },
  heroDescription: {
    en: "Walk through world-class fixtures from Kohler, TOTO, and Brizo alongside handcrafted artisanal pieces — all under one roof.",
    es: "Recorre accesorios de clase mundial de Kohler, TOTO y Brizo junto con piezas artesanales hechas a mano — todo bajo un solo techo.",
  },
  heroCta: { en: "Get Directions", es: "Cómo Llegar" },
  infoEyebrow: { en: "Showroom Details", es: "Detalles del Showroom" },
  infoTitle: { en: "Find Us", es: "Encuéntranos" },
  designDistrict: {
    en: "In the heart of San Miguel de Allende\u2019s design district",
    es: "En el corazón del distrito de diseño de San Miguel de Allende",
  },
  privateAppointments: {
    en: "Private appointments available on request",
    es: "Citas privadas disponibles bajo solicitud",
  },
  whatsapp: { en: "WhatsApp", es: "WhatsApp" },
  sendMessage: { en: "Send a Message", es: "Enviar Mensaje" },
  bookingEyebrow: { en: "Schedule a Visit", es: "Agenda una Visita" },
  bookingTitle: { en: "Book an Appointment", es: "Reservar una Cita" },
  placeholderName: { en: "Your name", es: "Tu nombre" },
  placeholderEmail: { en: "Email address", es: "Correo electrónico" },
  placeholderPhone: { en: "Phone / WhatsApp", es: "Teléfono / WhatsApp" },
  preferredTime: { en: "Preferred time", es: "Horario preferido" },
  timeMorning: { en: "Morning (10:00 – 12:00)", es: "Mañana (10:00 – 12:00)" },
  timeMidday: { en: "Midday (12:00 – 14:00)", es: "Mediodía (12:00 – 14:00)" },
  timeAfternoon: { en: "Afternoon (14:00 – 16:00)", es: "Tarde (14:00 – 16:00)" },
  timeLate: { en: "Late Afternoon (16:00 – 18:00)", es: "Tarde Avanzada (16:00 – 18:00)" },
  placeholderNotes: {
    en: "What are you looking for? (optional)",
    es: "¿Qué estás buscando? (opcional)",
  },
  sending: { en: "Sending...", es: "Enviando..." },
  booked: { en: "Booked!", es: "¡Reservado!" },
  requestAppointment: { en: "Request Appointment", es: "Solicitar Cita" },
  statusSent: {
    en: "We\u2019ll confirm your appointment within 2 hours.",
    es: "Te confirmaremos tu cita en menos de 2 horas.",
  },
  statusError: {
    en: "Something went wrong. Please try again or call us directly.",
    es: "Algo salió mal. Inténtalo de nuevo o llámanos directamente.",
  },
  statusIdle: {
    en: "We\u2019ll confirm within 2 hours during business hours.",
    es: "Confirmamos en 2 horas durante horario laboral.",
  },
  mapTitle: { en: "San Miguel de Allende, Guanajuato", es: "San Miguel de Allende, Guanajuato" },
  mapDirectionsCta: { en: "Open in Google Maps →", es: "Abrir en Google Maps →" },
  galleryEyebrow: { en: "Inside the Showroom", es: "Dentro del Showroom" },
  galleryTitle: { en: "A Space Built for Discovery", es: "Un Espacio Creado para Descubrir" },
};

const galleryImages = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=75&auto=format",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=75&auto=format",
  "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=75&auto=format",
  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=75&auto=format",
  "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&q=75&auto=format",
  "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&q=75&auto=format",
];

export const ShowroomContent = () => {
  const locale = useLocale() as "en" | "es";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/showroom-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          date: data.get("date"),
          time: data.get("time"),
          notes: data.get("notes"),
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
    <main id="main" tabIndex={-1}>
      <CategoryHero
        eyebrow={t.heroEyebrow[locale]}
        title={t.heroTitle[locale]}
        description={t.heroDescription[locale]}
        imageSrc="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=75&auto=format"
        ctaLabel={t.heroCta[locale]}
        ctaHref="#location"
      />

      {/* Info + Booking */}
      <section className="py-12 md:py-28 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left — Info */}
            <AnimatedSection>
              <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                {t.infoEyebrow[locale]}
              </span>
              <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
                {t.infoTitle[locale]}
              </h2>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body text-base text-brand-charcoal font-medium">
                      {SITE_CONFIG.showroom.address}
                    </p>
                    <p className="font-body text-sm text-dash-text-secondary mt-1">
                      {t.designDistrict[locale]}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body text-base text-brand-charcoal font-medium">
                      {SITE_CONFIG.showroom.hours}
                    </p>
                    <p className="font-body text-sm text-dash-text-secondary mt-1">
                      {t.privateAppointments[locale]}
                    </p>
                  </div>
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
                <div className="flex items-start gap-4">
                  <Mail className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                  <a
                    href={`mailto:${SITE_CONFIG.showroom.email}`}
                    className="font-body text-base text-brand-charcoal hover:text-brand-terracotta transition-colors"
                  >
                    {SITE_CONFIG.showroom.email}
                  </a>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="whatsapp"
                  href={`https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}`}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t.whatsapp[locale]}
                </Button>
                <Button variant="secondary" href="/contact">
                  {t.sendMessage[locale]}
                </Button>
              </div>
            </AnimatedSection>

            {/* Right — Booking Form */}
            <AnimatedSection delay={0.2}>
              <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                {t.bookingEyebrow[locale]}
              </span>
              <h3 className="mt-4 font-display text-3xl font-light tracking-wide text-brand-charcoal mb-6">
                {t.bookingTitle[locale]}
              </h3>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <TextField
                  label={t.placeholderName[locale]}
                  hideLabel
                  name="name"
                  type="text"
                  required
                  placeholder={t.placeholderName[locale]}
                  autoComplete="name"
                />
                <TextField
                  label={t.placeholderEmail[locale]}
                  hideLabel
                  name="email"
                  type="email"
                  required
                  placeholder={t.placeholderEmail[locale]}
                  autoComplete="email"
                />
                <TextField
                  label={t.placeholderPhone[locale]}
                  hideLabel
                  name="phone"
                  type="tel"
                  placeholder={t.placeholderPhone[locale]}
                  autoComplete="tel"
                />
                <TextField
                  label={t.preferredTime[locale]}
                  hideLabel
                  name="date"
                  type="date"
                />
                <SelectField
                  label={t.preferredTime[locale]}
                  hideLabel
                  name="time"
                  defaultValue=""
                >
                  <option value="" disabled>
                    {t.preferredTime[locale]}
                  </option>
                  <option value="morning">{t.timeMorning[locale]}</option>
                  <option value="midday">{t.timeMidday[locale]}</option>
                  <option value="afternoon">{t.timeAfternoon[locale]}</option>
                  <option value="late">{t.timeLate[locale]}</option>
                </SelectField>
                <TextAreaField
                  label={t.placeholderNotes[locale]}
                  hideLabel
                  name="notes"
                  placeholder={t.placeholderNotes[locale]}
                  rows={3}
                />
                <Button variant="primary" className="w-full" disabled={status === "sending"}>
                  {status === "sending" ? t.sending[locale] : status === "sent" ? t.booked[locale] : t.requestAppointment[locale]}
                </Button>
                {status === "sent" && (
                  <p role="status" aria-live="polite" className="font-body text-sm text-brand-sage text-center">
                    {t.statusSent[locale]}
                  </p>
                )}
                {status === "error" && (
                  <p role="alert" aria-live="assertive" className="font-body text-sm text-dash-danger text-center">
                    {t.statusError[locale]}
                  </p>
                )}
                {status === "idle" && (
                  <p className="font-body text-sm text-dash-text-secondary text-center">
                    {t.statusIdle[locale]}
                  </p>
                )}
              </form>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Live map embed */}
      <section id="location" className="bg-brand-charcoal">
        <div className="aspect-[4/3] sm:aspect-[16/7] md:aspect-[3/1] relative">
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(SITE_CONFIG.showroom.address)}&output=embed`}
            title={t.mapTitle[locale]}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full border-0"
          />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE_CONFIG.showroom.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 px-4 py-2 bg-brand-copper text-white font-body text-sm tracking-wide hover:bg-brand-copper/90 transition-colors"
          >
            {t.mapDirectionsCta[locale]}
          </a>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="py-12 md:py-28 bg-brand-sand/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
              {t.galleryEyebrow[locale]}
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
              {t.galleryTitle[locale]}
            </h2>
          </AnimatedSection>

          <div className="mt-10 md:mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {galleryImages.map((src, i) => (
              <AnimatedSection key={i} delay={i * 0.05}>
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-brand-stone/10">
                  <div
                    className="w-full h-full hover:scale-105 transition-transform duration-500"
                    style={{
                      backgroundImage: `url('${src}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </main>
    <Footer locale={locale} />
  </>
  );
};
