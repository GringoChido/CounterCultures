"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DisplayCurrency = "auto" | "MXN" | "USD";

interface UiState {
  // Cart drawer open state — ephemeral, not persisted.
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Chat widget open state — lets FABs yield when chat is expanded.
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;

  // User-preferred display currency. "auto" follows the cart's native
  // currency; explicit MXN/USD overrides it for display only (charges
  // always go through in the cart's actual currency).
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (c: DisplayCurrency) => void;
}

// Two stores in one create — drawer state lives in memory, currency
// preference persists to localStorage so a return visitor sees their
// last choice.
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      cartOpen: false,
      openCart: () => set({ cartOpen: true }),
      closeCart: () => set({ cartOpen: false }),
      toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),

      chatOpen: false,
      setChatOpen: (open) => set({ chatOpen: open }),

      displayCurrency: "auto",
      setDisplayCurrency: (c) => set({ displayCurrency: c }),
    }),
    {
      name: "cc_ui_v1",
      // Only persist displayCurrency; cartOpen is intentionally ephemeral.
      partialize: (state) => ({ displayCurrency: state.displayCurrency }),
    }
  )
);
