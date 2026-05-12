"use client";

import { useState, useEffect } from "react";
import NextLink from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Tag,
  X,
  ChevronRight,
  ShieldCheck,
  Truck,
  MessageCircle,
} from "lucide-react";
import { useCartStore } from "@/app/lib/stores/cart-store";
import { useDisplayedMoney } from "@/app/lib/currency";
import { OrderSummary } from "@/app/components/cart/order-summary";
import { FinishSwatch } from "@/app/components/cart/finish-swatch";
import { CurrencyToggle } from "@/app/components/cart/currency-toggle";
import { SaveCartButton } from "@/app/components/cart/save-cart-button";

const T = {
  en: {
    eyebrow: "Your Selection",
    title: "Cart",
    itemCount: (n: number) => `${n} ${n === 1 ? "piece" : "pieces"} curated`,
    empty: "Your cart is empty",
    emptyHint:
      "Browse the showroom and add the pieces you'd like to spec for your project.",
    browseCta: "Browse Shop",
    contactCta: "Talk to a specialist",
    tradeCode: "Trade code",
    applyCode: "Apply",
    removeCode: "Remove",
    tradeApplied: "Trade pricing active",
    tradeHint: "Architect, designer, or builder? Apply your trade code.",
    mixedBanner:
      "This selection includes quote-only pieces. Checkout will route to a quote request — no card required.",
    finish: "Finish",
    notes: "Note",
    addNote: "+ Add a note",
    qty: "Qty",
    remove: "Remove",
    each: "each",
    checkout: "Continue to Checkout",
    trustQuote: "24-hour quote",
    trustShip: "Delivery quoted after review",
    trustWa: "WhatsApp support",
  },
  es: {
    eyebrow: "Tu Selección",
    title: "Carrito",
    itemCount: (n: number) => `${n} ${n === 1 ? "pieza" : "piezas"} curadas`,
    empty: "Tu carrito está vacío",
    emptyHint:
      "Explora el showroom y agrega las piezas que quieras especificar para tu proyecto.",
    browseCta: "Ver Tienda",
    contactCta: "Hablar con un especialista",
    tradeCode: "Código trade",
    applyCode: "Aplicar",
    removeCode: "Quitar",
    tradeApplied: "Precio trade activo",
    tradeHint: "¿Arquitecto, diseñador o constructor? Aplica tu código trade.",
    mixedBanner:
      "Esta selección incluye piezas que requieren cotización. El pago generará una solicitud — sin tarjeta requerida.",
    finish: "Acabado",
    notes: "Nota",
    addNote: "+ Agregar nota",
    qty: "Cant",
    remove: "Quitar",
    each: "c/u",
    checkout: "Continuar al Pago",
    trustQuote: "Cotización en 24 hrs",
    trustShip: "Envío cotizado tras revisión",
    trustWa: "Soporte por WhatsApp",
  },
};

export const CartPageClient = ({ locale }: { locale: "en" | "es" }) => {
  const t = T[locale];
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const updateNotes = useCartStore((s) => s.updateNotes);
  const remove = useCartStore((s) => s.remove);
  const mode = useCartStore((s) => s.cartMode());
  const tradeCode = useCartStore((s) => s.tradeCode);
  const tradePartnerName = useCartStore((s) => s.tradePartnerName);
  const applyTradeCode = useCartStore((s) => s.applyTradeCode);
  const clearTradeCode = useCartStore((s) => s.clearTradeCode);

  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);

  // SSR-safe mount guard for zustand-persist cart store (see CART-RULES rule 42).
  // The lint rule prefers useSyncExternalStore, but the codebase convention
  // here is the mount flag — same as cart-icon-button.tsx.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Hooks must run on every render — call this BEFORE any conditional return.
  const sourceCurrency = items[0]?.currency ?? "MXN";
  const { format: formatted } = useDisplayedMoney({
    sourceCurrency,
    locale,
  });

  if (!mounted) {
    return (
      <div className="cc-paper min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-stone/20 border-t-brand-terracotta rounded-full animate-spin" />
      </div>
    );
  }

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const handleApplyCode = async () => {
    if (!codeInput.trim()) return;
    setCodeLoading(true);
    setCodeError(null);
    const result = await applyTradeCode(codeInput.trim());
    setCodeLoading(false);
    if (!result.ok) setCodeError(result.message);
    else setCodeInput("");
  };

  // ─── Empty state ───────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="cc-paper min-h-[70vh]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 md:py-32">
          <div className="cc-surface-card px-8 py-16 text-center">
            <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-brand-copper/10 mb-6">
              <ShoppingBag className="w-7 h-7 text-brand-copper" />
            </div>
            <p className="font-body text-xs uppercase tracking-[0.22em] text-brand-copper">
              {t.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-3xl md:text-4xl font-light text-brand-charcoal tracking-wide">
              {t.empty}
            </h1>
            <p className="mt-4 font-body text-sm text-dash-text-secondary leading-relaxed max-w-sm mx-auto">
              {t.emptyHint}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <NextLink
                href={`/${locale}/shop`}
                className="inline-flex items-center justify-center px-8 py-3 bg-brand-charcoal text-white font-body text-sm font-medium tracking-wider hover:bg-brand-terracotta transition-colors"
              >
                {t.browseCta}
              </NextLink>
              <NextLink
                href={`/${locale}/contact`}
                className="inline-flex items-center justify-center px-8 py-3 border border-brand-stone/30 text-brand-charcoal font-body text-sm font-medium tracking-wider hover:border-brand-charcoal transition-colors"
              >
                {t.contactCta}
              </NextLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Populated state ───────────────────────────────────────────
  return (
    <div className="cc-paper min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-14">
        {/* Header block */}
        <header className="mb-8 md:mb-10">
          <p className="font-body text-xs uppercase tracking-[0.22em] text-brand-copper">
            {t.eyebrow}
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-4 flex-wrap">
            <h1 className="font-display text-3xl md:text-4xl font-light tracking-wide text-brand-charcoal">
              {t.title}
            </h1>
            <div className="flex items-center gap-4">
              <span className="font-body text-sm text-dash-text-secondary">
                {t.itemCount(itemCount)}
              </span>
              <CurrencyToggle variant="outlined" />
            </div>
          </div>
          <div className="cc-rule-copper mt-5" />
        </header>

        {/* Mixed-mode banner */}
        {mode === "mixed" && (
          <div className="mb-6 px-4 py-3 bg-brand-sage/10 border-l-2 border-brand-sage">
            <p className="font-body text-sm text-brand-charcoal/80">
              {t.mixedBanner}
            </p>
          </div>
        )}

        {/* Items list */}
        <ul className="cc-surface-card divide-y divide-brand-stone/15">
          {items.map((item) => (
            <li key={item.id} className="cc-item-in p-5 md:p-6 flex gap-4 md:gap-5">
              {/* Thumbnail */}
              {item.imageSrc ? (
                <NextLink
                  href={item.productHref}
                  className="w-24 h-24 md:w-28 md:h-28 shrink-0 bg-brand-stone/5 overflow-hidden group"
                >
                  <img
                    src={item.imageSrc}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </NextLink>
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 bg-brand-stone/8" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <NextLink
                      href={item.productHref}
                      className="font-body text-sm md:text-base font-medium text-brand-charcoal hover:text-brand-terracotta transition-colors leading-snug block"
                    >
                      {item.name}
                    </NextLink>
                    <p className="font-body text-xs text-dash-text-secondary mt-1">
                      {item.brand}
                      <span className="text-brand-stone/40 mx-1.5">·</span>
                      <span className="font-mono">{item.sku}</span>
                    </p>
                    {item.selectedFinish && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <FinishSwatch
                          finish={item.selectedFinish}
                          size="md"
                        />
                        <span className="font-body text-xs text-brand-charcoal/80">
                          {item.selectedFinish}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="font-display text-lg md:text-xl font-light text-brand-charcoal whitespace-nowrap tabular-nums">
                    {formatted(item.listPrice * item.quantity)}
                  </span>
                </div>

                {/* Notes */}
                {editingNotes === item.id ? (
                  <input
                    type="text"
                    defaultValue={item.notes || ""}
                    autoFocus
                    onBlur={(e) => {
                      updateNotes(item.id, e.target.value);
                      setEditingNotes(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateNotes(item.id, e.currentTarget.value);
                        setEditingNotes(null);
                      }
                    }}
                    className="mt-3 w-full px-2.5 py-1.5 font-body text-xs bg-brand-linen/60 border border-brand-stone/25 focus:border-brand-copper focus:outline-none focus:ring-1 focus:ring-brand-copper/20"
                    placeholder={t.notes}
                  />
                ) : item.notes ? (
                  <button
                    type="button"
                    onClick={() => setEditingNotes(item.id)}
                    className="mt-2.5 font-body text-xs italic text-dash-text-secondary hover:text-brand-charcoal transition-colors cursor-pointer text-left"
                  >
                    &ldquo;{item.notes}&rdquo;
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingNotes(item.id)}
                    className="mt-2.5 font-body text-xs text-dash-text-secondary/60 hover:text-brand-copper transition-colors cursor-pointer"
                  >
                    {t.addNote}
                  </button>
                )}

                {/* Qty + remove */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-9 h-9 flex items-center justify-center border border-brand-stone/25 text-dash-text-secondary hover:text-brand-charcoal hover:border-brand-charcoal/60 transition-colors cursor-pointer"
                      aria-label="Decrease"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-12 text-center font-mono text-sm text-brand-charcoal tabular-nums border-y border-brand-stone/25 h-9 flex items-center justify-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center border border-brand-stone/25 text-dash-text-secondary hover:text-brand-charcoal hover:border-brand-charcoal/60 transition-colors cursor-pointer"
                      aria-label="Increase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {item.quantity > 1 && (
                      <span className="ml-3 font-mono text-xs text-dash-text-secondary tabular-nums">
                        {formatted(item.listPrice)} {t.each}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="flex items-center gap-1.5 font-body text-xs text-dash-text-secondary/70 hover:text-brand-terracotta transition-colors cursor-pointer"
                    aria-label={t.remove}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.remove}</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Trade code */}
        <div className="mt-6">
          {tradeCode ? (
            <div className="cc-surface-card p-4 flex items-center gap-3">
              <Tag className="w-4 h-4 text-brand-sage shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-brand-charcoal">
                  {t.tradeApplied}
                  {tradePartnerName && (
                    <span className="text-dash-text-secondary"> · {tradePartnerName}</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={clearTradeCode}
                className="text-dash-text-secondary hover:text-brand-terracotta transition-colors cursor-pointer p-1 -m-1"
                aria-label={t.removeCode}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <details className="cc-surface-card group">
              <summary className="px-4 py-3 cursor-pointer flex items-center justify-between list-none">
                <div className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-brand-copper" />
                  <div>
                    <span className="font-body text-sm font-medium text-brand-charcoal">
                      {t.tradeCode}
                    </span>
                    <span className="font-body text-xs text-dash-text-secondary ml-2 hidden sm:inline">
                      {t.tradeHint}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-brand-stone group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-4 pb-4 pt-1 flex gap-2">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) =>
                    setCodeInput(e.target.value.toUpperCase())
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCode()}
                  className="flex-1 px-3 py-2.5 font-mono text-sm bg-white border border-brand-stone/25 focus:border-brand-copper focus:outline-none focus:ring-1 focus:ring-brand-copper/20 tracking-wider"
                  placeholder="CC-TRADE-XXX"
                />
                <button
                  type="button"
                  onClick={handleApplyCode}
                  disabled={codeLoading}
                  className="px-5 py-2.5 bg-brand-charcoal text-white font-body text-xs font-medium tracking-wider hover:bg-brand-terracotta transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t.applyCode}
                </button>
              </div>
              {codeError && (
                <p className="px-4 pb-3 font-body text-xs text-dash-danger">
                  {codeError}
                </p>
              )}
            </details>
          )}
        </div>

        {/* Order summary */}
        <div className="mt-6">
          <OrderSummary locale={locale} variant="panel" density="compact" />
        </div>

        {/* Save / share */}
        <div className="mt-4">
          <SaveCartButton locale={locale} />
        </div>

        {/* Checkout CTA */}
        <NextLink
          href={`/${locale}/checkout`}
          className="mt-5 flex items-center justify-center w-full py-4 bg-brand-terracotta text-white font-body text-sm font-medium tracking-[0.18em] uppercase hover:bg-brand-copper transition-colors shadow-sm hover:shadow-md"
        >
          {t.checkout}
          <ChevronRight className="w-4 h-4 ml-2" />
        </NextLink>

        {/* Trust strip */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="flex items-center justify-center gap-2 text-dash-text-secondary">
            <ShieldCheck className="w-4 h-4 text-brand-copper" />
            <span className="font-body text-xs">{t.trustQuote}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-dash-text-secondary">
            <Truck className="w-4 h-4 text-brand-copper" />
            <span className="font-body text-xs">{t.trustShip}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-dash-text-secondary">
            <MessageCircle className="w-4 h-4 text-brand-copper" />
            <span className="font-body text-xs">{t.trustWa}</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
