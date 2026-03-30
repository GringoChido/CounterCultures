"use client";

import { useState, type FormEvent } from "react";
import { AnimatedSection } from "@/app/components/ui/animated-section";

const content = {
  en: {
    title: "Design Inspiration, Delivered",
    subtitle: "Trends, new arrivals, and artisan spotlights. Monthly, never spammy.",
    placeholder: "Your email",
    subscribe: "Subscribe",
    sending: "Sending...",
    success: "You\u2019re in!",
    error: "Try again",
  },
  es: {
    title: "Inspiraci\u00f3n de Dise\u00f1o, Entregada",
    subtitle: "Tendencias, nuevos productos y perfiles de artesanos. Mensual, sin spam.",
    placeholder: "Tu correo",
    subscribe: "Suscribirse",
    sending: "Enviando...",
    success: "\u00a1Listo!",
    error: "Reintentar",
  },
};

const NewsletterStrip = ({ locale = "en" }: { locale?: string }) => {
  const t = content[locale as "en" | "es"];
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    const email = new FormData(e.currentTarget).get("email");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error();
      setStatus("sent");
      e.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="bg-brand-terracotta py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimatedSection>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-xl md:text-2xl text-white">
                {t.title}
              </h2>
              <p className="font-body text-sm text-white/80 mt-1">
                {t.subtitle}
              </p>
            </div>
            <form className="flex w-full md:w-auto gap-3" onSubmit={handleSubmit}>
              <input
                type="email"
                name="email"
                required
                placeholder={t.placeholder}
                className="w-full md:w-72 px-4 py-3 bg-white/10 border border-white/30 rounded-md text-white placeholder:text-white/50 font-body text-sm focus:outline-none focus:border-white transition-colors"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="px-6 py-3 bg-white text-brand-terracotta font-body text-sm font-semibold rounded-md hover:bg-white/90 transition-colors shrink-0 cursor-pointer disabled:opacity-70"
              >
                {status === "sending" ? t.sending : status === "sent" ? t.success : status === "error" ? t.error : t.subscribe}
              </button>
            </form>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export { NewsletterStrip };
