/**
 * Active Order context — "cart" for the consultative B2B workflow.
 *
 * When Roger is assembling a multi-product quote for a customer, he picks
 * a deal (or creates a new one) once, and every subsequent product add
 * lands on that deal with no re-selection. Persisted across reloads so a
 * sidebar nav doesn't drop the context.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ActiveOrder {
  dealId: string;
  name: string;
  company: string;
  itemCount: number;
  // Running total — updated optimistically as items are added and
  // re-read from the server after any price edit on the pipeline page.
  totalQuoted: number;
  currency: string;
  updatedAt: string;
}

interface ActiveOrderStore {
  active: ActiveOrder | null;
  setActive: (o: ActiveOrder) => void;
  bumpItem: (quotedPrice: number, quantity: number) => void;
  clear: () => void;
  /** Re-fetch the deal's line items from the server to resync counts/totals. */
  refresh: () => Promise<void>;
}

export const useActiveOrderStore = create<ActiveOrderStore>()(
  persist(
    (set, get) => ({
      active: null,
      setActive: (o) => set({ active: { ...o, updatedAt: new Date().toISOString() } }),
      bumpItem: (quotedPrice, quantity) => {
        const cur = get().active;
        if (!cur) return;
        set({
          active: {
            ...cur,
            itemCount: cur.itemCount + 1,
            totalQuoted: cur.totalQuoted + quotedPrice * quantity,
            updatedAt: new Date().toISOString(),
          },
        });
      },
      clear: () => set({ active: null }),
      refresh: async () => {
        const cur = get().active;
        if (!cur) return;
        try {
          const r = await fetch(
            `/api/dashboard/deals/${encodeURIComponent(cur.dealId)}/line-items`,
            { cache: "no-store" }
          );
          if (!r.ok) return;
          const d = await r.json();
          const items = (d.items ?? []) as Array<{
            quantity: number;
            quotedPrice: number;
          }>;
          const totalQuoted = items.reduce(
            (s, i) => s + i.quotedPrice * i.quantity,
            0
          );
          set({
            active: {
              ...cur,
              itemCount: items.length,
              totalQuoted,
              updatedAt: new Date().toISOString(),
            },
          });
        } catch {
          // leave existing values; a transient failure shouldn't clear state
        }
      },
    }),
    { name: "cc_active_order_v1" }
  )
);
