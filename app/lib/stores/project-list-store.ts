/**
 * @deprecated Prefer `useCartStore` from `@/app/lib/stores/cart-store`.
 * This store is retained for backward compatibility with project-list-bar.
 * The cart store migrates data from `cc_project_list_v1` on first load.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProjectListItem {
  id: string; // Odoo product id
  sku: string;
  name: string;
  brand: string;
  category: string;
  currency: string;
  listPrice: number;
  quantity: number;
  addedAt: string;
}

interface ProjectListStore {
  items: ProjectListItem[];
  add: (item: Omit<ProjectListItem, "quantity" | "addedAt">, quantity?: number) => void;
  updateQty: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

export const useProjectListStore = create<ProjectListStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, quantity = 1) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              { ...item, quantity, addedAt: new Date().toISOString() },
            ],
          });
        }
      },
      updateQty: (id, quantity) => {
        if (quantity < 1) {
          set({ items: get().items.filter((i) => i.id !== id) });
          return;
        }
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        });
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((i) => i.id === id),
    }),
    { name: "cc_project_list_v1" }
  )
);
