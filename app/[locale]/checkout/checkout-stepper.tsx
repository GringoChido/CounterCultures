"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useCartStore } from "@/app/lib/stores/cart-store";

const BUYABLE_THRESHOLD_MXN = 50_000;

const STEPS = {
  en: ["Contact", "Ship To", "Project", "Review"],
  es: ["Contacto", "Envio", "Proyecto", "Revisar"],
};

const T = {
  en: {
    name: "Full name *",
    email: "Email *",
    phone: "Phone / WhatsApp",
    company: "Company / firm",
    commPref: "Communication preference",
    emailOnly: "Email only",
    whatsappOnly: "WhatsApp only",
    both: "Both",
    locale: "Language",
    line1: "Address line 1 *",
    line2: "Address line 2",
    city: "City *",
    state: "State *",
    postal: "Postal code *",
    country: "Country *",
    mexico: "Mexico",
    us: "United States",
    projectName: "Project name",
    room: "Room / area",
    timeline: "Timeline / target install",
    notes: "Notes for Counter Cultures",
    isTrade: "This is a trade/professional order",
    reviewTitle: "Review your order",
    subtotal: "Subtotal",
    iva: "IVA (16%)",
    ivaNote: "Applied for Mexico delivery",
    shipping: "Shipping",
    shippingNote: "Quoted after review",
    total: "Estimated total",
    terms: "I agree to the terms of service and return policy",
    payNow: "Pay Now",
    submitQuote: "Submit Quote Request",
    submitting: "Submitting...",
    next: "Next",
    back: "Back",
    required: "This field is required",
    invalidEmail: "Enter a valid email",
    emptyCart: "Your cart is empty",
  },
  es: {
    name: "Nombre completo *",
    email: "Correo electronico *",
    phone: "Telefono / WhatsApp",
    company: "Empresa / despacho",
    commPref: "Preferencia de comunicacion",
    emailOnly: "Solo correo",
    whatsappOnly: "Solo WhatsApp",
    both: "Ambos",
    locale: "Idioma",
    line1: "Direccion linea 1 *",
    line2: "Direccion linea 2",
    city: "Ciudad *",
    state: "Estado *",
    postal: "Codigo postal *",
    country: "Pais *",
    mexico: "Mexico",
    us: "Estados Unidos",
    projectName: "Nombre del proyecto",
    room: "Habitacion / area",
    timeline: "Plazo / fecha de instalacion",
    notes: "Notas para Counter Cultures",
    isTrade: "Este es un pedido trade/profesional",
    reviewTitle: "Revisa tu pedido",
    subtotal: "Subtotal",
    iva: "IVA (16%)",
    ivaNote: "Aplicado para envios a Mexico",
    shipping: "Envio",
    shippingNote: "Cotizado despues de revision",
    total: "Total estimado",
    terms: "Acepto los terminos de servicio y la politica de devoluciones",
    payNow: "Pagar Ahora",
    submitQuote: "Enviar Solicitud de Cotizacion",
    submitting: "Enviando...",
    next: "Siguiente",
    back: "Atras",
    required: "Campo requerido",
    invalidEmail: "Ingresa un correo valido",
    emptyCart: "Tu carrito esta vacio",
  },
};

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  channelPreference: "email" | "whatsapp" | "both";
  commLocale: "en" | "es";
}

interface AddressForm {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal: string;
  country: "MX" | "US";
}

interface ProjectForm {
  projectName: string;
  room: string;
  timeline: string;
  notes: string;
  isTrade: boolean;
}

export const CheckoutStepper = ({ locale }: { locale: "en" | "es" }) => {
  const t = T[locale];
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const cartMode = useCartStore((s) => s.cartMode());
  const cartSessionId = useCartStore((s) => s.cartSessionId);
  const tradeCode = useCartStore((s) => s.tradeCode);
  const clear = useCartStore((s) => s.clear);

  const [contact, setContact] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    company: "",
    channelPreference: "both",
    commLocale: locale,
  });

  const [address, setAddress] = useState<AddressForm>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal: "",
    country: "MX",
  });

  const [project, setProject] = useState<ProjectForm>({
    projectName: "",
    room: "",
    timeline: "",
    notes: "",
    isTrade: false,
  });

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-stone/20 border-t-brand-terracotta rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="font-body text-base text-brand-charcoal">{t.emptyCart}</p>
      </div>
    );
  }

  const currency = items[0]?.currency ?? "MXN";
  const isMxShipTo = address.country === "MX";
  const ivaAmount = isMxShipTo ? Math.round(subtotal * 0.16) : 0;
  const total = subtotal + ivaAmount;
  const isBuyPath =
    cartMode === "all_buyable" &&
    (currency === "MXN" ? total < BUYABLE_THRESHOLD_MXN : total < BUYABLE_THRESHOLD_MXN / 20);

  const formatted = (amount: number) =>
    new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!contact.name.trim()) e.name = t.required;
      if (!contact.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
        e.email = t.invalidEmail;
    }
    if (step === 1) {
      if (!address.line1.trim()) e.line1 = t.required;
      if (!address.city.trim()) e.city = t.required;
      if (!address.state.trim()) e.state = t.required;
      if (!address.postal.trim()) e.postal = t.required;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 3));
  };

  const handleSubmit = async () => {
    if (!termsAccepted) return;
    setSubmitting(true);

    const payload = {
      locale,
      contact,
      address,
      project,
      items: items.map((i) => ({
        productId: i.id,
        sku: i.sku,
        name: i.name,
        brand: i.brand,
        quantity: i.quantity,
        listPrice: i.listPrice,
        selectedFinish: i.selectedFinish,
        notes: i.notes,
        buyable: i.buyable,
        availability: i.availability,
      })),
      cartSessionId,
      tradeCode: tradeCode ?? null,
      mode: isBuyPath ? "buy" : "quote",
      subtotal,
      ivaAmount,
      total,
      currency,
    };

    try {
      const endpoint = isBuyPath ? "/api/checkout/buy" : "/api/checkout/quote";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (isBuyPath && data.stripeUrl) {
        window.location.href = data.stripeUrl;
      } else if (data.dealId) {
        clear();
        const trackerParam = data.trackerUrl ? `?tracker=${encodeURIComponent(data.trackerUrl)}` : "";
        router.push(`/${locale}/checkout/submitted/${data.dealId}${trackerParam}`);
      }
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-16 min-h-[70vh]">
      {/* Step indicators */}
      <nav aria-label="Checkout progress" className="flex items-center justify-between mb-10">
        {STEPS[locale].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              aria-current={i === step ? "step" : undefined}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm transition-colors ${
                i < step
                  ? "bg-brand-sage text-white"
                  : i === step
                    ? "bg-brand-terracotta text-white"
                    : "bg-brand-stone/10 text-dash-text-secondary"
              }`}
            >
              {i < step ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`hidden sm:inline font-body text-sm ${
                i <= step ? "text-brand-charcoal" : "text-dash-text-secondary"
              }`}
            >
              {label}
            </span>
            {i < 3 && <div className="hidden sm:block w-8 h-px bg-brand-stone/20 mx-2" />}
          </div>
        ))}
      </nav>

      {/* Step 0: Contact */}
      {step === 0 && (
        <div className="space-y-5">
          <Input label={t.name} value={contact.name} error={errors.name} onChange={(v) => setContact({ ...contact, name: v })} />
          <Input label={t.email} type="email" value={contact.email} error={errors.email} onChange={(v) => setContact({ ...contact, email: v })} />
          <Input label={t.phone} value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} />
          <Input label={t.company} value={contact.company} onChange={(v) => setContact({ ...contact, company: v })} />
          <div>
            <label className="font-body text-xs text-dash-text-secondary">{t.commPref}</label>
            <div className="mt-1 flex gap-3">
              {(["email", "whatsapp", "both"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setContact({ ...contact, channelPreference: opt })}
                  className={`px-3 py-1.5 font-body text-xs border transition-colors cursor-pointer ${
                    contact.channelPreference === opt
                      ? "border-brand-terracotta text-brand-terracotta bg-brand-terracotta/5"
                      : "border-brand-stone/20 text-dash-text-secondary hover:border-brand-stone/40"
                  }`}
                >
                  {opt === "email" ? t.emailOnly : opt === "whatsapp" ? t.whatsappOnly : t.both}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-body text-xs text-dash-text-secondary">{t.locale}</label>
            <div className="mt-1 flex gap-3">
              {(["en", "es"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setContact({ ...contact, commLocale: l })}
                  className={`px-3 py-1.5 font-body text-xs border transition-colors cursor-pointer ${
                    contact.commLocale === l
                      ? "border-brand-terracotta text-brand-terracotta bg-brand-terracotta/5"
                      : "border-brand-stone/20 text-dash-text-secondary hover:border-brand-stone/40"
                  }`}
                >
                  {l === "en" ? "English" : "Espanol"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Address */}
      {step === 1 && (
        <div className="space-y-5">
          <Input label={t.line1} value={address.line1} error={errors.line1} onChange={(v) => setAddress({ ...address, line1: v })} />
          <Input label={t.line2} value={address.line2} onChange={(v) => setAddress({ ...address, line2: v })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t.city} value={address.city} error={errors.city} onChange={(v) => setAddress({ ...address, city: v })} />
            <Input label={t.state} value={address.state} error={errors.state} onChange={(v) => setAddress({ ...address, state: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t.postal} value={address.postal} error={errors.postal} onChange={(v) => setAddress({ ...address, postal: v })} />
            <div>
              <label className="font-body text-xs text-dash-text-secondary">{t.country}</label>
              <select
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value as "MX" | "US" })}
                className="mt-1 w-full px-3 py-2.5 font-body text-sm border border-brand-stone/20 focus:border-brand-terracotta focus:outline-none bg-white"
              >
                <option value="MX">{t.mexico}</option>
                <option value="US">{t.us}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Project */}
      {step === 2 && (
        <div className="space-y-5">
          <Input label={t.projectName} value={project.projectName} onChange={(v) => setProject({ ...project, projectName: v })} />
          <Input label={t.room} value={project.room} onChange={(v) => setProject({ ...project, room: v })} />
          <Input label={t.timeline} value={project.timeline} onChange={(v) => setProject({ ...project, timeline: v })} />
          <div>
            <label className="font-body text-xs text-dash-text-secondary">{t.notes}</label>
            <textarea
              value={project.notes}
              onChange={(e) => setProject({ ...project, notes: e.target.value })}
              rows={3}
              className="mt-1 w-full px-3 py-2.5 font-body text-sm border border-brand-stone/20 focus:border-brand-terracotta focus:outline-none resize-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={project.isTrade}
              onChange={(e) => setProject({ ...project, isTrade: e.target.checked })}
              className="w-4 h-4 accent-brand-terracotta"
            />
            <span className="font-body text-sm text-brand-charcoal">{t.isTrade}</span>
          </label>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="font-display text-lg font-light text-brand-charcoal">{t.reviewTitle}</h2>

          {/* Line items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-brand-stone/5">
                <div>
                  <p className="font-body text-sm text-brand-charcoal">{item.name}</p>
                  <p className="font-body text-xs text-dash-text-secondary">
                    {item.brand} x{item.quantity}
                    {item.selectedFinish && ` — ${item.selectedFinish}`}
                  </p>
                </div>
                <span className="font-mono text-sm text-brand-charcoal">
                  {formatted(item.listPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-4 border-t border-brand-stone/10">
            <div className="flex justify-between">
              <span className="font-body text-sm text-dash-text-secondary">{t.subtotal}</span>
              <span className="font-mono text-sm">{formatted(subtotal)}</span>
            </div>
            {isMxShipTo && (
              <div className="flex justify-between">
                <span className="font-body text-sm text-dash-text-secondary">{t.iva}</span>
                <span className="font-mono text-sm">{formatted(ivaAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-body text-sm text-dash-text-secondary">{t.shipping}</span>
              <span className="font-body text-xs text-dash-text-secondary">{t.shippingNote}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-brand-stone/10">
              <span className="font-body text-sm font-medium">{t.total}</span>
              <span className="font-display text-lg">{formatted(total)}</span>
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-brand-terracotta"
            />
            <span className="font-body text-xs text-dash-text-secondary">{t.terms}</span>
          </label>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-brand-stone/10">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1 font-body text-sm text-dash-text-secondary hover:text-brand-charcoal transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            {t.back}
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1 px-6 py-3 bg-brand-terracotta text-white font-body text-sm font-medium hover:bg-brand-copper transition-colors cursor-pointer"
          >
            {t.next}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!termsAccepted || submitting}
            className="px-8 py-3 bg-brand-terracotta text-white font-body text-sm font-medium hover:bg-brand-copper transition-colors disabled:opacity-50 disabled:cursor-default cursor-pointer flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.submitting}
              </>
            ) : isBuyPath ? (
              t.payNow
            ) : (
              t.submitQuote
            )}
          </button>
        )}
      </div>
    </div>
  );
};

function Input({
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`w-full px-3 py-2.5 font-body text-sm border transition-colors focus:outline-none focus:ring-1 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
            : "border-brand-stone/20 focus:border-brand-terracotta focus:ring-brand-terracotta/20"
        }`}
      />
      {error && (
        <p className="mt-1 font-body text-xs text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
}
