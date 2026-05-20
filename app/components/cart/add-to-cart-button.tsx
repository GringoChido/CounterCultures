"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/app/lib/stores/cart-store";
import { useUiStore } from "@/app/lib/stores/ui-store";
import type { Product } from "@/app/lib/types";
import { pdpHref } from "@/app/lib/pdp-href";

const BUYABLE_THRESHOLD_MXN = 50_000;

const T = {
  en: {
    addToCart: "Add to Cart",
    added: "Added",
    selectFinish: "Select a finish first",
    currencyMismatch: "Cannot mix currencies in one cart",
  },
  es: {
    addToCart: "Agregar al Carrito",
    added: "Agregado",
    selectFinish: "Selecciona un acabado primero",
    currencyMismatch: "No se pueden mezclar monedas en un carrito",
  },
};

interface AddToCartButtonProps {
  product: Product;
  locale: "en" | "es";
  selectedFinish?: string;
  quantity?: number;
}

function isBuyable(product: Product): boolean {
  if (product.availability === "quote_only") return false;
  if (product.currency === "MXN" && product.price > BUYABLE_THRESHOLD_MXN) return false;
  if (product.currency === "USD" && product.price > BUYABLE_THRESHOLD_MXN / 20) return false;
  return true;
}

export const AddToCartButton = ({
  product,
  locale,
  selectedFinish,
  quantity = 1,
}: AddToCartButtonProps) => {
  const t = T[locale];
  const add = useCartStore((s) => s.add);
  const items = useCartStore((s) => s.items);
  const openCart = useUiStore((s) => s.openCart);
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyable = isBuyable(product);
  const needsFinish = product.finishes.length > 0 && !selectedFinish;

  const handleAdd = () => {
    setError(null);

    if (needsFinish) {
      setError(t.selectFinish);
      return;
    }

    // Currency mismatch check
    if (items.length > 0 && items[0].currency !== product.currency) {
      setError(t.currencyMismatch);
      return;
    }

    add({
      id: product.id,
      sku: product.sku,
      name: locale === "es" ? product.name : product.nameEn,
      brand: product.brand,
      category: product.category,
      currency: product.currency,
      listPrice: product.price,
      tradePrice: undefined,
      quantity,
      selectedFinish: selectedFinish || undefined,
      imageSrc: product.images[0],
      productHref: pdpHref(locale, product),
      availability: product.availability,
      buyable,
    });

    setJustAdded(true);
    setTimeout(() => {
      openCart();
      setJustAdded(false);
    }, 600);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleAdd}
        disabled={justAdded}
        className={`w-full py-4 min-h-[52px] font-body text-sm font-medium tracking-wider transition-colors duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-default ${
          buyable
            ? "bg-brand-terracotta text-white hover:bg-brand-copper disabled:bg-brand-copper"
            : "bg-brand-sage/20 text-brand-charcoal border border-brand-sage/40 hover:bg-brand-sage/30 disabled:bg-brand-sage/30"
        }`}
      >
        {justAdded ? (
          <>
            <Check className="w-4 h-4" />
            {t.added}
          </>
        ) : (
          <>
            <ShoppingBag className="w-4 h-4" />
            {t.addToCart}
          </>
        )}
      </button>

      {error && (
        <p className="mt-2 font-body text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
