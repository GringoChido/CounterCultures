"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import { useCartStore } from "@/app/lib/stores/cart-store";
import { CartWatermark, CartWordmark } from "@/app/components/cart/cart-watermark";
import { computeIva } from "@/app/lib/iva";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#C4725A",
    colorBackground: "#FFFFFF",
    colorText: "#1A1A1A",
    colorDanger: "#B91C1C",
    fontFamily: "DM Sans, system-ui, sans-serif",
    spacingUnit: "4px",
    borderRadius: "0px",
  },
};

const T = {
  en: {
    loading: "Preparing secure payment...",
    orderSummary: "Order Summary",
    model: "Model",
    subtotal: "Subtotal",
    tradeDiscount: "Trade discount",
    iva: "VAT (16%)",
    shipping: "Shipping",
    shippingQuoted: "Quoted after review",
    total: "Total (IVA included)",
    payNow: "Pay Now",
    processing: "Processing...",
    securePayment: "Secure payment via Stripe",
    noRedirect: "You will not be redirected. Your payment is processed securely on this page.",
    shipTo: "Ship to",
    facturaStatus: "Factura",
    error: "Payment failed. Please try again.",
    stripeNotConfigured: "Online payments are not available at this time. Please contact us to complete your order.",
    finish: "Finish",
    editOrder: "Edit order",
  },
  es: {
    loading: "Preparando pago seguro...",
    orderSummary: "Resumen del Pedido",
    model: "Modelo",
    subtotal: "Subtotal",
    tradeDiscount: "Descuento trade",
    iva: "IVA (16%)",
    shipping: "Envio",
    shippingQuoted: "Cotizado despues de revision",
    total: "Total (IVA incluido)",
    payNow: "Pagar Ahora",
    processing: "Procesando...",
    securePayment: "Pago seguro via Stripe",
    noRedirect: "No seras redirigido. Tu pago se procesa de forma segura en esta pagina.",
    shipTo: "Enviar a",
    facturaStatus: "Factura",
    error: "El pago fallo. Intenta de nuevo.",
    stripeNotConfigured: "Los pagos en linea no estan disponibles en este momento. Contactanos para completar tu pedido.",
    finish: "Acabado",
    editOrder: "Editar pedido",
  },
};

export const PayClient = ({ locale, dealId }: { locale: "en" | "es"; dealId: string }) => {
  const t = T[locale];
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const tradeDiscountPct = useCartStore((s) => s.tradeDiscountPct);
  const cartSessionId = useCartStore((s) => s.cartSessionId);

  const currency = items[0]?.currency ?? "MXN";
  const { iva: ivaAmount, subtotal: productSubtotal } = computeIva(subtotal, "MX");
  const tradeDiscountAmount = tradeDiscountPct ? Math.round(subtotal * (tradeDiscountPct / 100)) : 0;
  const total = subtotal - tradeDiscountAmount;

  const formatted = (amount: number) =>
    new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  useEffect(() => {
    if (!stripePromise) {
      setError(t.stripeNotConfigured);
      setLoading(false);
      return;
    }

    const createPI = async () => {
      try {
        const res = await fetch("/api/stripe/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dealId,
            cartSessionId,
            amount: total,
            currency: currency.toLowerCase(),
          }),
        });
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.error || t.error);
        }
      } catch {
        setError(t.error);
      } finally {
        setLoading(false);
      }
    };

    createPI();
  }, [dealId, cartSessionId, total, currency, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-linen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-brand-terracotta" />
          <p className="font-body text-sm text-dash-text-secondary">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !clientSecret || !stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-linen px-4">
        <div className="max-w-md text-center">
          <CartWordmark />
          <p className="font-body text-sm text-dash-danger mt-4">{error || t.stripeNotConfigured}</p>
          <a
            href={`mailto:equipo@countercultures.com.mx?subject=Order ${dealId}`}
            className="inline-block mt-6 px-6 py-3 bg-brand-terracotta text-white font-body text-sm font-medium"
          >
            {locale === "es" ? "Contactar equipo" : "Contact team"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-brand-linen">
      <CartWatermark />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left column — Order Summary (40%) */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-8 space-y-6">
              <CartWordmark />

              <h2 className="font-display text-lg font-light text-brand-charcoal">{t.orderSummary}</h2>

              {/* Line items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {item.imageSrc ? (
                      <div className="w-16 h-16 shrink-0 bg-brand-stone/5 overflow-hidden">
                        <img src={item.imageSrc} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 shrink-0 bg-brand-stone/10 flex items-center justify-center">
                        <span className="font-mono text-[9px] text-dash-text-secondary">{item.sku}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-brand-charcoal truncate">{item.name}</p>
                      <p className="font-mono text-[10px] text-dash-text-secondary">{t.model}: {item.sku}</p>
                      {item.selectedFinish && (
                        <p className="font-body text-[10px] text-dash-text-secondary">{t.finish}: {item.selectedFinish}</p>
                      )}
                      <p className="font-body text-xs text-dash-text-secondary mt-0.5">x{item.quantity}</p>
                    </div>
                    <span className="font-mono text-sm text-brand-charcoal shrink-0">
                      {formatted((item.tradePrice != null && item.tradePrice > 0 ? item.tradePrice : item.listPrice) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t border-brand-stone/10">
                <div className="flex justify-between">
                  <span className="font-body text-sm text-dash-text-secondary">{t.subtotal}</span>
                  <span className="font-mono text-sm">{formatted(productSubtotal)}</span>
                </div>
                {tradeDiscountAmount > 0 && (
                  <div className="flex justify-between text-brand-sage">
                    <span className="font-body text-sm">{t.tradeDiscount}</span>
                    <span className="font-mono text-sm">-{formatted(tradeDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-body text-sm text-dash-text-secondary">{t.iva}</span>
                  <span className="font-mono text-sm">{formatted(ivaAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-sm text-dash-text-secondary">{t.shipping}</span>
                  <span className="font-body text-xs text-dash-text-secondary">{t.shippingQuoted}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-brand-stone/10">
                  <span className="font-body text-sm font-medium">{t.total}</span>
                  <span className="font-mono text-xl text-brand-charcoal font-medium">{formatted(total)}</span>
                </div>
              </div>

              {/* Edit link */}
              <a
                href={`/${locale}/checkout`}
                className="font-body text-xs text-brand-terracotta hover:underline"
              >
                &larr; {t.editOrder}
              </a>
            </div>
          </div>

          {/* Right column — Stripe Payment Element (60%) */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-brand-stone/10 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-4 h-4 text-brand-sage" />
                <span className="font-body text-sm font-medium text-brand-charcoal">{t.securePayment}</span>
              </div>

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: STRIPE_APPEARANCE,
                }}
              >
                <PaymentForm locale={locale} dealId={dealId} total={total} formatted={formatted} />
              </Elements>

              <p className="mt-6 font-body text-xs text-dash-text-secondary/70 text-center">
                {t.noRedirect}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentForm = ({
  locale,
  dealId,
  total,
  formatted,
}: {
  locale: "en" | "es";
  dealId: string;
  total: number;
  formatted: (n: number) => string;
}) => {
  const t = T[locale];
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const clear = useCartStore((s) => s.clear);
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setPayError(null);

    const origin = window.location.origin;
    const returnUrl = `${origin}/${locale}/checkout/submitted/${dealId}`;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) {
      setPayError(error.message ?? t.error);
      setProcessing(false);
    } else {
      clear();
      router.push(returnUrl);
    }
  }, [stripe, elements, locale, dealId, clear, router, t.error]);

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {payError && (
        <div className="mt-4 px-3 py-2 bg-dash-danger-soft border border-dash-danger/30 text-dash-danger font-body text-sm" role="alert">
          {payError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="mt-6 w-full py-4 bg-brand-terracotta text-white font-body text-base font-medium tracking-wider hover:bg-brand-copper transition-colors disabled:opacity-50 disabled:cursor-default cursor-pointer flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t.processing}
          </>
        ) : (
          <>
            {t.payNow} — {formatted(total)}
          </>
        )}
      </button>
    </form>
  );
};
