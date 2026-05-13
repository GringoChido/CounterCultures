"use client";

import { useEffect, useRef } from "react";
import { useCartStore, type CartItem } from "./cart-store";

const DEBOUNCE_MS = 500;

export const useCartSync = (customerEmail: string | null | undefined) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (!customerEmail) return;
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    const hydrate = async () => {
      try {
        const res = await fetch("/api/customer/cart");
        if (!res.ok) return;
        const data = await res.json();
        const serverItems = data.items as CartItem[];
        if (!Array.isArray(serverItems) || serverItems.length === 0) return;

        const localItems = useCartStore.getState().items;
        if (localItems.length === 0) {
          useCartStore.setState({ items: serverItems });
        }
      } catch {
        // Silent fail — local cart is the fallback
      }
    };

    hydrate();
  }, [customerEmail]);

  useEffect(() => {
    if (!customerEmail) return;

    const unsub = useCartStore.subscribe((state) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        fetch("/api/customer/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: state.items }),
        }).catch(() => {});
      }, DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [customerEmail]);
};
