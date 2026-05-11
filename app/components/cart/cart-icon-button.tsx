"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/app/lib/stores/cart-store";
import { useUiStore } from "@/app/lib/stores/ui-store";

export const CartIconButton = () => {
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());
  const openCart = useUiStore((s) => s.openCart);

  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={openCart}
      className="relative flex items-center justify-center w-11 h-11 text-brand-charcoal hover:text-brand-terracotta transition-colors cursor-pointer"
      aria-label={`Cart${mounted && itemCount > 0 ? ` (${itemCount})` : ""}`}
    >
      <ShoppingBag className="w-5 h-5" />
      {mounted && itemCount > 0 && (
        <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-terracotta text-white font-body text-[10px] font-bold leading-none">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
};
