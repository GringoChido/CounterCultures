/**
 * Project List — the customer-facing "quote cart" on /shop/catalog.
 *
 * Architect browses the 354k catalog, stacks items into their project list,
 * then submits the whole list as a quote request. Roger gets an email with
 * the SKUs; a deal gets auto-created in the pipeline with line items.
 *
 * localStorage-persisted so the list survives page refresh and cross-tab work.
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
