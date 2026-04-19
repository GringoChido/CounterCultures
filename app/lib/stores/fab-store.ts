import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FabStore {
  pulseSessionsRemaining: number;
  hasInteracted: boolean;
  consumePulseSession: () => void;
  markInteracted: () => void;
}

export const useFabStore = create<FabStore>()(
  persist(
    (set, get) => ({
      pulseSessionsRemaining: 3,
      hasInteracted: false,
      consumePulseSession: () => {
        const { hasInteracted, pulseSessionsRemaining } = get();
        if (hasInteracted || pulseSessionsRemaining === 0) return;
        set({ pulseSessionsRemaining: pulseSessionsRemaining - 1 });
      },
      markInteracted: () => set({ hasInteracted: true }),
    }),
    { name: "cc_fab_store_v1" }
  )
);
