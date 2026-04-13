import { create } from "zustand";
import type { ActivityItem } from "@/app/lib/sample-dashboard-data";

interface ActivityState {
  activities: ActivityItem[];
  addActivity: (entry: {
    type: ActivityItem["type"];
    description: string;
    contactName: string;
    dealId?: string;
    followUpDate?: string;
  }) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  addActivity: (entry) =>
    set((state) => ({
      activities: [
        {
          id: `ACT-${Date.now()}`,
          type: entry.type,
          description: entry.description,
          contactName: entry.contactName,
          rep: "Roger",
          timestamp: new Date().toISOString(),
          dealId: entry.dealId,
          followUpDate: entry.followUpDate,
        },
        ...state.activities,
      ],
    })),
}));
