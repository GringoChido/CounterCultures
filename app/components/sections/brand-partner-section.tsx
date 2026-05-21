"use client";

import { useState, type FormEvent } from "react";
import { Handshake, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { AnimatedSection } from "@/app/components/ui/animated-section";

interface BrandPartnerSectionProps {
  locale: "en" | "es";
}

const t = {
  eyebrow: { en: "For brands & manufacturers", es: "Para marcas y fabricantes" },
  headline: { en: "Become a Brand Partner", es: "Conviértete en Socio de Marca" },
  sub: {
    en: "We represent premium brands in central Mexico's most exciting design market. If your products belong in discerning homes, let's talk.",
    es: "Representamos marcas premium en el mercado de diseño más emocionante del centro de México. Si tus productos pertenecen a hogares exigentes, hablemos.",
  },
  fields: {
    brandName: { en: "Brand name", es: "Nombre de la marca" },
    contactName: { en: "Contact name", es: "Nombre de contacto" },
    email: { en: "Email", es: "Correo electrónico" },
    whatsapp: { en: "WhatsApp (optional)", es: "WhatsApp (opcional)" },
    productCategory: {
      en: "Product category (e.g. faucets, tile, lighting)",
      es: "Categoría de producto (ej. grifería, azulejos, iluminación)",
    },
    location: { en: "Location / country", es: "Ubicación / país" },
    description: {
      en: "Tell us about your brand",
      es: "Cuéntanos sobre tu marca",
    },
  },
  cta: { en: "Submit Application", es: "Enviar Solicitud" },
  sending: { en: "Sending…", es: "Enviando…" },
  success: {
    en: "Application received — our team will be in touch within 48 hours.",
    es: "Solicitud recibida — nuestro equipo te contactará en las próximas 48 horas.",
  },
  error: {
    en: "Something went wrong. Please try again or email us directly.",
    es: "Algo salió mal. Intenta de nuevo o escríbenos directamente.",
  },
  // TODO: Week 3 — add line-sheet PDF upload field when R2 storage lands
} as const;

const BrandPartnerSection = ({ locale }: BrandPartnerSectionProps) => {
  const l = locale === "es" ? "es" : "en";
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");

    const fd = new FormData(e.currentTarget);
    const payload = {
      brandName: fd.get("brandName") as string,
      contactName: fd.get("contactName") as string,
      email: fd.get("email") as string,
      whatsapp: fd.get("whatsapp") as string,
      productCategory: fd.get("productCategory") as string,
      location: fd.get("location") as string,
      description: fd.get("description") as string,
    };

    try {
      const res = await fetch("/api/brand-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const inputClass =
    "w-full rounded-md border border-brand-stone/30 bg-white px-4 py-3 font-body text-sm text-brand-charcoal placeholder:text-dash-text-secondary/50 outline-none focus:border-brand-copper focus:ring-1 focus:ring-brand-copper/30 transition-colors";

  return (
    <section className="bg-brand-charcoal py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Left — copy */}
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-copper">
                <Handshake className="h-5 w-5 text-white" strokeWidth={1.75} />
              </div>
              <p className="font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-copper">
                {t.eyebrow[l]}
              </p>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-light tracking-wide text-white mb-5">
              {t.headline[l]}
            </h2>
            <p className="font-body text-base leading-relaxed text-white/70 max-w-lg">
              {t.sub[l]}
            </p>
          </AnimatedSection>

          {/* Right — form */}
          <AnimatedSection delay={0.1}>
            {status === "success" ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-brand-copper/30 bg-white/5 p-10 text-center">
                <CheckCircle className="h-10 w-10 text-brand-copper" />
                <p className="font-body text-base text-white leading-relaxed">
                  {t.success[l]}
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6 md:p-8"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    name="brandName"
                    required
                    placeholder={t.fields.brandName[l]}
                    className={inputClass}
                  />
                  <input
                    name="contactName"
                    required
                    placeholder={t.fields.contactName[l]}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder={t.fields.email[l]}
                    className={inputClass}
                  />
                  <input
                    name="whatsapp"
                    placeholder={t.fields.whatsapp[l]}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    name="productCategory"
                    placeholder={t.fields.productCategory[l]}
                    className={inputClass}
                  />
                  <input
                    name="location"
                    placeholder={t.fields.location[l]}
                    className={inputClass}
                  />
                </div>
                <textarea
                  name="description"
                  rows={3}
                  placeholder={t.fields.description[l]}
                  className={`${inputClass} resize-none`}
                />

                {status === "error" && (
                  <p className="font-body text-sm text-dash-danger">{t.error[l]}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex items-center gap-2 rounded-md bg-brand-copper px-6 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brand-terracotta disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.sending[l]}
                    </>
                  ) : (
                    <>
                      {t.cta[l]}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export { BrandPartnerSection };
