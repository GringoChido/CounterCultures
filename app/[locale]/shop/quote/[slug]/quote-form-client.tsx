"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Check } from "lucide-react";

interface QuoteFormProps {
  locale: "en" | "es";
  productId: string;
  productSku: string;
  productName: string;
  productBrand: string;
}

const T = {
  en: {
    title: "Request a Quote",
    name: "Full name",
    email: "Email",
    phone: "Phone / WhatsApp",
    quantity: "Quantity needed",
    finish: "Preferred finish (optional)",
    notes: "Additional details",
    submit: "Send Request",
    sending: "Sending…",
    success: "We'll be in touch within 24 hours.",
    error: "Something went wrong. Please try again or email hola@countercultures.com.mx.",
    required: "Required",
  },
  es: {
    title: "Solicitar Cotización",
    name: "Nombre completo",
    email: "Correo electrónico",
    phone: "Teléfono / WhatsApp",
    quantity: "Cantidad requerida",
    finish: "Acabado preferido (opcional)",
    notes: "Detalles adicionales",
    submit: "Enviar Solicitud",
    sending: "Enviando…",
    success: "Nos pondremos en contacto en menos de 24 horas.",
    error: "Algo salió mal. Intenta de nuevo o escribe a hola@countercultures.com.mx.",
    required: "Requerido",
  },
};

const QuoteForm = ({ locale, productId, productSku, productName, productBrand }: QuoteFormProps) => {
  const t = T[locale];
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          productSku,
          productName,
          productBrand,
          locale,
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          quantity: data.get("quantity"),
          finish: data.get("finish"),
          notes: data.get("notes"),
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="bg-brand-linen border border-brand-sage p-6 text-center">
        <Check className="w-8 h-8 text-brand-sage mx-auto mb-3" />
        <p className="font-body text-sm text-brand-charcoal">{t.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-brand-linen border border-brand-stone/15 p-5 space-y-3">
      <h2 className="font-display text-xl text-brand-charcoal mb-3">{t.title}</h2>

      <label className="block">
        <span className="font-body text-xs text-brand-stone">{t.name} *</span>
        <input name="name" type="text" required maxLength={100}
          className="mt-1 w-full px-3 py-2 border border-brand-stone/25 bg-white font-body text-sm focus:outline-none focus:border-brand-copper" />
      </label>

      <label className="block">
        <span className="font-body text-xs text-brand-stone">{t.email} *</span>
        <input name="email" type="email" required maxLength={150}
          className="mt-1 w-full px-3 py-2 border border-brand-stone/25 bg-white font-body text-sm focus:outline-none focus:border-brand-copper" />
      </label>

      <label className="block">
        <span className="font-body text-xs text-brand-stone">{t.phone}</span>
        <input name="phone" type="tel" maxLength={30}
          className="mt-1 w-full px-3 py-2 border border-brand-stone/25 bg-white font-body text-sm focus:outline-none focus:border-brand-copper" />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="font-body text-xs text-brand-stone">{t.quantity}</span>
          <input name="quantity" type="text" defaultValue="1" maxLength={20}
            className="mt-1 w-full px-3 py-2 border border-brand-stone/25 bg-white font-body text-sm focus:outline-none focus:border-brand-copper" />
        </label>
        <label className="block">
          <span className="font-body text-xs text-brand-stone">{t.finish}</span>
          <input name="finish" type="text" maxLength={60}
            className="mt-1 w-full px-3 py-2 border border-brand-stone/25 bg-white font-body text-sm focus:outline-none focus:border-brand-copper" />
        </label>
      </div>

      <label className="block">
        <span className="font-body text-xs text-brand-stone">{t.notes}</span>
        <textarea name="notes" rows={3} maxLength={1000}
          className="mt-1 w-full px-3 py-2 border border-brand-stone/25 bg-white font-body text-sm focus:outline-none focus:border-brand-copper resize-none" />
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full py-3 bg-brand-charcoal text-white font-body text-sm uppercase tracking-wider hover:bg-brand-copper transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t.sending}
          </>
        ) : (
          t.submit
        )}
      </button>

      {status === "error" && (
        <p className="font-body text-xs text-brand-terracotta text-center">{t.error}</p>
      )}
    </form>
  );
};

export { QuoteForm };
