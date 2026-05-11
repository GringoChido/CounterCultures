"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItemAvailability =
  | "in-stock"
  | "made-to-order"
  | "special-order"
  | "quote_only";

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  currency: "MXN" | "USD";
  listPrice: number;
  tradePrice?: number;
  quantity: number;
  selectedFinish?: string;
  selectedSku?: string;
  imageSrc?: string;
  productHref: string;
  notes?: string;
  availability: CartItemAvailability;
  buyable: boolean;
  addedAt: number;
}

export type CartMode = "all_buyable" | "all_quote" | "mixed";

export interface CartState {
  items: CartItem[];
  tradeCode?: string;
  tradeDiscountPct?: number;
  tradePartnerName?: string;
  cartSessionId: string;
  add: (item: Omit<CartItem, "addedAt">) => void;
  updateQty: (id: string, qty: number) => void;
  updateFinish: (id: string, finish: string) => void;
  updateNotes: (id: string, notes: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  applyTradeCode: (code: string) => Promise<{ ok: boolean; message: string }>;
  clearTradeCode: () => void;
  subtotal: () => number;
  cartMode: () => CartMode;
  isMultiCurrency: () => boolean;
  itemCount: () => number;
}

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function migrateFromProjectList(): CartItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("cc_project_list_v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const items = parsed?.state?.items;
    if (!Array.isArray(items) || items.length === 0) return null;

    return items.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      sku: item.sku as string,
      name: item.name as string,
      brand: item.brand as string,
      category: item.category as string,
      currency: (item.currency as "MXN" | "USD") || "MXN",
      listPrice: item.listPrice as number,
      quantity: item.quantity as number,
      productHref: `/shop`,
      availability: "made-to-order" as const,
      buyable: true,
      addedAt: item.addedAt
        ? new Date(item.addedAt as string).getTime()
        : Date.now(),
    }));
  } catch {
    return null;
  }
}

const MAX_QTY = 99;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tradeCode: undefined,
      tradeDiscountPct: undefined,
      tradePartnerName: undefined,
      cartSessionId: generateSessionId(),

      add: (item) => {
        const state = get();
        // Block currency mismatch
        if (state.items.length > 0) {
          const cartCurrency = state.items[0].currency;
          if (item.currency !== cartCurrency) return;
        }

        const existing = state.items.find((i) => i.id === item.id);
        if (existing) {
          const newQty = Math.min(existing.quantity + item.quantity, MAX_QTY);
          set({
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: newQty } : i
            ),
          });
        } else {
          set({
            items: [
              ...state.items,
              { ...item, quantity: Math.min(item.quantity, MAX_QTY), addedAt: Date.now() },
            ],
          });
        }
      },

      updateQty: (id, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: Math.min(qty, MAX_QTY) } : i
          ),
        });
      },

      updateFinish: (id, finish) => {
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, selectedFinish: finish } : i
          ),
        });
      },

      updateNotes: (id, notes) => {
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, notes } : i
          ),
        });
      },

      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

      clear: () =>
        set({
          items: [],
          tradeCode: undefined,
          tradeDiscountPct: undefined,
          tradePartnerName: undefined,
          cartSessionId: generateSessionId(),
        }),

      has: (id) => get().items.some((i) => i.id === id),

      applyTradeCode: async (code) => {
        try {
          const res = await fetch("/api/cart/trade-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
          const data = await res.json();
          if (data.ok) {
            set({
              tradeCode: code,
              tradeDiscountPct: data.discountPct,
              tradePartnerName: data.partnerName,
            });
            return { ok: true, message: data.partnerName };
          }
          return { ok: false, message: data.message || "Invalid code" };
        } catch {
          return { ok: false, message: "Network error" };
        }
      },

      clearTradeCode: () =>
        set({
          tradeCode: undefined,
          tradeDiscountPct: undefined,
          tradePartnerName: undefined,
        }),

      subtotal: () => {
        const state = get();
        return state.items.reduce((sum, item) => {
          const price = state.tradeDiscountPct && item.tradePrice
            ? item.tradePrice
            : item.listPrice;
          return sum + price * item.quantity;
        }, 0);
      },

      cartMode: () => {
        const items = get().items;
        if (items.length === 0) return "all_buyable";
        const allBuyable = items.every((i) => i.buyable);
        const noneBuyable = items.every((i) => !i.buyable);
        if (allBuyable) return "all_buyable";
        if (noneBuyable) return "all_quote";
        return "mixed";
      },

      isMultiCurrency: () => {
        const items = get().items;
        if (items.length <= 1) return false;
        const first = items[0].currency;
        return items.some((i) => i.currency !== first);
      },

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "cc_cart_v1",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // One-time migration from project list
        if (state.items.length === 0) {
          const migrated = migrateFromProjectList();
          if (migrated && migrated.length > 0) {
            state.items = migrated;
          }
        }
      },
    }
  )
);
