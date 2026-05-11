"use client";

import { useState, useEffect } from "react";
import NextLink from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Tag, X } from "lucide-react";
import { useCartStore } from "@/app/lib/stores/cart-store";
import { CartWatermark, CartWordmark } from "@/app/components/cart/cart-watermark";

const T = {
  en: {
    title: "Your Cart",
    empty: "Your cart is empty",
    emptyHint: "Browse the shop and find your next piece.",
    browseCta: "Browse Shop",
    subtotal: "Subtotal",
    iva: "IVA (16%, MX ship-to)",
    ivaNote: "Calculated at checkout based on delivery address",
    shipping: "Shipping",
    shippingNote: "Quoted after order review",
    total: "Estimated Total",
    checkout: "Continue to Checkout",
    tradeCode: "Trade code",
    applyCode: "Apply",
    removeCode: "Remove",
    tradeApplied: "Trade pricing active",
    mixedBanner: "This cart contains quote-only items. Checkout will generate a quote request.",
    finish: "Finish",
    notes: "Notes",
    addNote: "Add note",
    qty: "Qty",
    remove: "Remove",
    item: "Item",
    price: "Price",
    each: "each",
  },
  es: {
    title: "Tu Carrito",
    empty: "Tu carrito está vacío",
    emptyHint: "Explora la tienda y encuentra tu próxima pieza.",
    browseCta: "Ver Tienda",
    subtotal: "Subtotal",
    iva: "IVA (16%, envío MX)",
    ivaNote: "Calculado al pagar según dirección de envío",
    shipping: "Envío",
    shippingNote: "Cotizado después de revisión",
    total: "Total Estimado",
    checkout: "Continuar al Pago",
    tradeCode: "Código trade",
    applyCode: "Aplicar",
    removeCode: "Quitar",
    tradeApplied: "Precio trade activo",
    mixedBanner: "Este carrito contiene artículos que requieren cotización. El pago generará una solicitud de cotización.",
    finish: "Acabado",
    notes: "Notas",
    addNote: "Agregar nota",
    qty: "Cant",
    remove: "Quitar",
    item: "Artículo",
    price: "Precio",
    each: "c/u",
  },
};

export const CartPageClient = ({ locale }: { locale: "en" | "es" }) => {
  const t = T[locale];
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const updateNotes = useCartStore((s) => s.updateNotes);
  const remove = useCartStore((s) => s.remove);
  const subtotal = useCartStore((s) => s.subtotal());
  const mode = useCartStore((s) => s.cartMode());
  const tradeCode = useCartStore((s) => s.tradeCode);
  const tradePartnerName = useCartStore((s) => s.tradePartnerName);
  const applyTradeCode = useCartStore((s) => s.applyTradeCode);
  const clearTradeCode = useCartStore((s) => s.clearTradeCode);

  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-stone/20 border-t-brand-terracotta rounded-full animate-spin" />
      </div>
    );
  }

  const currency = items[0]?.currency ?? "MXN";
  const formatted = (amount: number) =>
    new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const handleApplyCode = async () => {
    if (!codeInput.trim()) return;
    setCodeLoading(true);
    setCodeError(null);
    const result = await applyTradeCode(codeInput.trim());
    setCodeLoading(false);
    if (!result.ok) setCodeError(result.message);
    else setCodeInput("");
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <ShoppingBag className="w-12 h-12 text-brand-stone/30 mb-4" />
          <h1 className="font-display text-2xl font-light text-brand-charcoal">{t.empty}</h1>
          <p className="font-body text-sm text-dash-text-secondary mt-2">{t.emptyHint}</p>
          <NextLink
            href={`/${locale}/shop`}
            className="mt-8 px-8 py-3 bg-brand-charcoal text-white font-body text-sm font-medium hover:bg-brand-terracotta transition-colors"
          >
            {t.browseCta}
          </NextLink>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <CartWatermark />
      <div className="relative z-10">
      <CartWordmark />
      <h1 className="font-display text-2xl md:text-3xl font-light tracking-wide text-brand-charcoal">
        {t.title}
      </h1>

      {mode === "mixed" && (
        <div className="mt-4 px-4 py-3 bg-brand-sage/10 border border-brand-sage/20">
          <p className="font-body text-sm text-brand-charcoal/80">{t.mixedBanner}</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
        {/* Items column */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 pb-6 border-b border-brand-stone/10">
              {/* Thumbnail */}
              {item.imageSrc ? (
                <NextLink
                  href={item.productHref}
                  className="w-20 h-20 md:w-24 md:h-24 shrink-0 bg-brand-stone/5 overflow-hidden"
                >
                  <img src={item.imageSrc} alt="" className="w-full h-full object-cover" />
                </NextLink>
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 bg-brand-stone/5" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <NextLink
                      href={item.productHref}
                      className="font-body text-sm font-medium text-brand-charcoal hover:text-brand-terracotta transition-colors"
                    >
                      {item.name}
                    </NextLink>
                    <p className="font-body text-xs text-dash-text-secondary mt-0.5">
                      {item.brand} — {item.sku}
                    </p>
                    {item.selectedFinish && (
                      <p className="font-body text-xs text-dash-text-secondary mt-0.5">
                        {t.finish}: {item.selectedFinish}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-sm text-brand-charcoal whitespace-nowrap">
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
                    className="mt-2 w-full px-2 py-1 font-body text-xs border border-brand-stone/20 focus:border-brand-terracotta focus:outline-none"
                    placeholder={t.notes}
                  />
                ) : item.notes ? (
                  <button
                    type="button"
                    onClick={() => setEditingNotes(item.id)}
                    className="mt-1 font-body text-xs text-dash-text-secondary/70 hover:text-brand-charcoal transition-colors cursor-pointer"
                  >
                    {t.notes}: {item.notes}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingNotes(item.id)}
                    className="mt-1 font-body text-xs text-dash-text-secondary/50 hover:text-brand-charcoal transition-colors cursor-pointer"
                  >
                    + {t.addNote}
                  </button>
                )}

                {/* Qty controls + price per unit */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center border border-brand-stone/20 text-dash-text-secondary hover:text-brand-charcoal hover:border-brand-stone/40 transition-colors cursor-pointer"
                      aria-label="Decrease"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-mono text-sm text-brand-charcoal">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center border border-brand-stone/20 text-dash-text-secondary hover:text-brand-charcoal hover:border-brand-stone/40 transition-colors cursor-pointer"
                      aria-label="Increase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="ml-3 flex items-center gap-1 font-body text-xs text-dash-text-secondary/60 hover:text-red-600 transition-colors cursor-pointer"
                      aria-label={t.remove}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.remove}</span>
                    </button>
                  </div>
                  {item.quantity > 1 && (
                    <span className="font-mono text-xs text-dash-text-secondary">
                      {formatted(item.listPrice)} {t.each}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary column */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Trade code */}
            <div>
              {tradeCode ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-brand-sage/10 border border-brand-sage/20">
                  <Tag className="w-4 h-4 text-brand-sage" />
                  <span className="font-body text-sm text-brand-charcoal flex-1">
                    {t.tradeApplied}: {tradePartnerName}
                  </span>
                  <button
                    type="button"
                    onClick={clearTradeCode}
                    className="text-dash-text-secondary hover:text-red-600 transition-colors cursor-pointer"
                    aria-label={t.removeCode}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <label className="font-body text-xs text-dash-text-secondary">{t.tradeCode}</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCode()}
                      className="flex-1 px-3 py-2 font-mono text-sm border border-brand-stone/20 focus:border-brand-terracotta focus:outline-none"
                      placeholder="CC-TRADE-XXX"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCode}
                      disabled={codeLoading}
                      className="px-4 py-2 bg-brand-charcoal text-white font-body text-xs font-medium hover:bg-brand-terracotta transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {t.applyCode}
                    </button>
                  </div>
                  {codeError && (
                    <p className="mt-1 font-body text-xs text-red-600">{codeError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-3 pt-4 border-t border-brand-stone/10">
              <div className="flex justify-between">
                <span className="font-body text-sm text-dash-text-secondary">{t.subtotal}</span>
                <span className="font-mono text-sm text-brand-charcoal">{formatted(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-sm text-dash-text-secondary">{t.iva}</span>
                <span className="font-body text-xs text-dash-text-secondary">{t.ivaNote}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-sm text-dash-text-secondary">{t.shipping}</span>
                <span className="font-body text-xs text-dash-text-secondary">{t.shippingNote}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-brand-stone/10">
                <span className="font-body text-sm font-medium text-brand-charcoal">{t.total}</span>
                <span className="font-display text-xl text-brand-charcoal">{formatted(subtotal)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <NextLink
              href={`/${locale}/checkout`}
              className="flex items-center justify-center w-full py-4 bg-brand-terracotta text-white font-body text-sm font-medium tracking-wider hover:bg-brand-copper transition-colors"
            >
              {t.checkout}
            </NextLink>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
