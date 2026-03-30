"use client";

import { useState, type FormEvent } from "react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CategoryHero } from "@/app/components/sections/category-hero";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { MapPin, Clock, Phone, MessageCircle, Mail } from "lucide-react";
import { useLocale } from "next-intl";
import { SITE_CONFIG } from "@/app/lib/constants";

const galleryImages = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
  "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80",
  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80",
  "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&q=80",
  "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&q=80",
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
    <main>
      <CategoryHero
        eyebrow="San Miguel de Allende"
        title="Visit the Showroom"
        description="Walk through world-class fixtures from Kohler, TOTO, and Brizo alongside handcrafted artisanal pieces — all under one roof."
        imageSrc="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
        ctaLabel="Get Directions"
        ctaHref="#location"
      />

      {/* Info + Booking */}
      <section className="py-20 md:py-28 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left — Info */}
            <AnimatedSection>
              <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
                Showroom Details
              </span>
              <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
                Find Us
              </h2>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body text-base text-brand-charcoal font-medium">
                      {SITE_CONFIG.showroom.address}
                    </p>
                    <p className="font-body text-sm text-brand-stone mt-1">
                      In the heart of San Miguel de Allende&apos;s design district
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body text-base text-brand-charcoal font-medium">
                      {SITE_CONFIG.showroom.hours}
                    </p>
                    <p className="font-body text-sm text-brand-stone mt-1">
                      Private appointments available on request
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
                  WhatsApp
                </Button>
                <Button variant="secondary" href="/contact">
                  Send a Message
                </Button>
              </div>
            </AnimatedSection>

            {/* Right — Booking Form */}
            <AnimatedSection delay={0.2}>
              <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
                Schedule a Visit
              </span>
              <h3 className="mt-4 font-display text-3xl font-light tracking-wide text-brand-charcoal mb-6">
                Book an Appointment
              </h3>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
                />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email address"
                  className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone / WhatsApp"
                  className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
                />
                <input
                  type="date"
                  name="date"
                  className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
                />
                <select
                  name="time"
                  className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Preferred time
                  </option>
                  <option value="morning">Morning (10:00 – 12:00)</option>
                  <option value="midday">Midday (12:00 – 14:00)</option>
                  <option value="afternoon">Afternoon (14:00 – 16:00)</option>
                  <option value="late">Late Afternoon (16:00 – 18:00)</option>
                </select>
                <textarea
                  name="notes"
                  placeholder="What are you looking for? (optional)"
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors resize-none"
                />
                <Button variant="primary" className="w-full" disabled={status === "sending"}>
                  {status === "sending" ? "Sending..." : status === "sent" ? "Booked!" : "Request Appointment"}
                </Button>
                {status === "sent" && (
                  <p className="font-body text-sm text-brand-sage text-center">
                    We&apos;ll confirm your appointment within 2 hours.
                  </p>
                )}
                {status === "error" && (
                  <p className="font-body text-sm text-red-600 text-center">
                    Something went wrong. Please try again or call us directly.
                  </p>
                )}
                {status === "idle" && (
                  <p className="font-body text-sm text-brand-stone text-center">
                    We&apos;ll confirm within 2 hours during business hours.
                  </p>
                )}
              </form>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section id="location" className="bg-brand-charcoal">
        <div className="aspect-[21/9] md:aspect-[3/1] flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-10 h-10 text-brand-copper mx-auto mb-4" />
            <p className="font-display text-2xl text-white font-light">
              San Miguel de Allende, Guanajuato
            </p>
            <p className="font-body text-sm text-white/50 mt-2">
              Google Map integration coming soon
            </p>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="py-20 md:py-28 bg-brand-sand/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
              Inside the Showroom
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
              A Space Built for Discovery
            </h2>
          </AnimatedSection>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4">
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
