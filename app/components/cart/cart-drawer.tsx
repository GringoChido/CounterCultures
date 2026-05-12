"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import NextLink from "next/link";
import { useCartStore } from "@/app/lib/stores/cart-store";
import { useUiStore } from "@/app/lib/stores/ui-store";
import { useDisplayedMoney } from "@/app/lib/currency";
import { FinishSwatch } from "./finish-swatch";
import { CurrencyToggle } from "./currency-toggle";

const T = {
  en: {
    title: "Your Cart",
    empty: "Your cart is empty",
    emptyHint: "Browse the shop and add pieces to your cart.",
    browseCta: "Browse Shop",
    subtotal: "Subtotal",
    viewCart: "View Cart",
    checkout: "Checkout",
    mixedBanner: "This cart contains quote-only items. Checkout will route to a quote request.",
    remove: "Remove",
    notes: "Notes",
  },
  es: {
    title: "Tu Carrito",
    empty: "Tu carrito está vacío",
    emptyHint: "Explora la tienda y agrega piezas a tu carrito.",
    browseCta: "Ver Tienda",
    subtotal: "Subtotal",
    viewCart: "Ver Carrito",
    checkout: "Pagar",
    mixedBanner: "Este carrito contiene artículos que requieren cotización. El proceso de pago será una solicitud de cotización.",
    remove: "Quitar",
    notes: "Notas",
  },
};

export const CartDrawer = ({ locale = "en" }: { locale?: "en" | "es" }) => {
  const t = T[locale];
  const cartOpen = useUiStore((s) => s.cartOpen);
  const closeCart = useUiStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const remove = useCartStore((s) => s.remove);
  const subtotal = useCartStore((s) => s.subtotal());
  const mode = useCartStore((s) => s.cartMode());
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen, closeCart]);

  const sourceCurrency = items[0]?.currency ?? "MXN";
  const { format: formatted, converted, fxNote } = useDisplayedMoney({
    sourceCurrency,
    locale,
  });

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-brand-charcoal/40"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-brand-linen shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={t.title}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-brand-stone/10">
              <h2 className="font-display text-xl font-light tracking-wide text-brand-charcoal">
                {t.title}
              </h2>
              <div className="flex items-center gap-2">
                {items.length > 0 && <CurrencyToggle />}
                <button
                  type="button"
                  onClick={closeCart}
                  className="flex items-center justify-center w-10 h-10 text-brand-stone hover:text-brand-charcoal transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                <div className="w-20 h-20 flex items-center justify-center rounded-full bg-brand-stone/8 mb-6">
                  <ShoppingBag className="w-8 h-8 text-brand-stone/40" />
                </div>
                <p className="font-display text-lg font-light text-brand-charcoal tracking-wide">
                  {t.empty}
                </p>
                <p className="font-body text-sm text-brand-stone mt-2 max-w-[240px]">
                  {t.emptyHint}
                </p>
                <NextLink
                  href={`/${locale}/shop`}
                  onClick={closeCart}
                  className="mt-8 px-8 py-3 bg-brand-charcoal text-white font-body text-sm font-medium tracking-wider hover:bg-brand-terracotta transition-colors duration-300"
                >
                  {t.browseCta}
                </NextLink>
              </div>
            ) : (
              <>
                {/* Mixed mode banner */}
                {mode === "mixed" && (
                  <div className="px-6 py-3 bg-brand-sage/10 border-b border-brand-sage/20">
                    <p className="font-body text-xs text-brand-charcoal/80">{t.mixedBanner}</p>
                  </div>
                )}

                {/* Items list */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      {/* Thumbnail */}
                      {item.imageSrc ? (
                        <div className="w-20 h-20 shrink-0 bg-brand-stone/5 overflow-hidden">
                          <img
                            src={item.imageSrc}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 shrink-0 bg-brand-stone/8" />
                      )}

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium text-brand-charcoal truncate">
                          {item.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5 font-body text-xs text-brand-stone">
                          <span className="truncate">{item.brand}</span>
                          {item.selectedFinish && (
                            <>
                              <span className="text-brand-stone/40">·</span>
                              <FinishSwatch finish={item.selectedFinish} />
                              <span className="truncate">
                                {item.selectedFinish}
                              </span>
                            </>
                          )}
                        </div>
                        {item.notes && (
                          <p className="font-body text-xs text-brand-stone/70 mt-0.5 truncate">
                            {t.notes}: {item.notes}
                          </p>
                        )}

                        {/* Qty + price */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center border border-brand-stone/15 text-brand-stone hover:text-brand-charcoal hover:border-brand-stone/30 transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-mono text-sm text-brand-charcoal">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center border border-brand-stone/15 text-brand-stone hover:text-brand-charcoal hover:border-brand-stone/30 transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(item.id)}
                              className="ml-2 w-8 h-8 flex items-center justify-center text-brand-stone/50 hover:text-brand-terracotta transition-colors cursor-pointer"
                              aria-label={t.remove}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="font-mono text-sm text-brand-charcoal">
                            {formatted(item.listPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t border-brand-stone/10 bg-brand-linen px-6 py-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm text-brand-stone">{t.subtotal}</span>
                      <span className="font-display text-xl font-light text-brand-charcoal tabular-nums">{formatted(subtotal)}</span>
                    </div>
                    {converted && (
                      <p className="mt-1 font-body text-[11px] text-dash-text-secondary/70 italic text-right">
                        {fxNote}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <NextLink
                      href={`/${locale}/cart`}
                      onClick={closeCart}
                      className="flex items-center justify-center py-3.5 border border-brand-stone/20 font-body text-sm font-medium text-brand-charcoal hover:border-brand-charcoal transition-colors"
                    >
                      {t.viewCart}
                    </NextLink>
                    <NextLink
                      href={`/${locale}/checkout`}
                      onClick={closeCart}
                      className="flex items-center justify-center py-3.5 bg-brand-terracotta text-white font-body text-sm font-medium tracking-wider hover:bg-brand-copper transition-colors"
                    >
                      {t.checkout}
                    </NextLink>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
