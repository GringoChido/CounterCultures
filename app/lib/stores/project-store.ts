"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProjectItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  currency: "MXN" | "USD";
  listPrice: number;
  quantity: number;
  imageSrc?: string;
  productHref: string;
  addedAt: number;
}

export interface ProjectState {
  items: ProjectItem[];
  add: (item: Omit<ProjectItem, "addedAt">) => void;
  updateQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  itemCount: () => number;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === item.id
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, 99) }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              { ...item, quantity: Math.min(item.quantity, 99), addedAt: Date.now() },
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
            i.id === id ? { ...i, quantity: Math.min(qty, 99) } : i
          ),
        });
      },

      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

      clear: () => set({ items: [] }),

      has: (id) => get().items.some((i) => i.id === id),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "cc_project_v1" }
  )
);
