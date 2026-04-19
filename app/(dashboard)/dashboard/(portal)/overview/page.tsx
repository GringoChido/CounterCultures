"use client";

import { format } from "date-fns";
import { NeedsYou } from "@/app/(dashboard)/components/needs-you";
import { NewSinceLastCheck } from "@/app/(dashboard)/components/new-since-last-check";
import { TodayActiveDeals } from "@/app/(dashboard)/components/today-active-deals";
import { MorningSalesHealth } from "@/app/(dashboard)/components/morning-sales-health";
import { TodayKpiRail } from "@/app/(dashboard)/components/today-kpi-rail";

const greetingFor = (date: Date): string => {
  const h = date.getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

const OverviewPage = () => {
  const now = new Date();
  const day = format(now, "EEEE, MMMM d");
  const greeting = greetingFor(now);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h1 className="font-display text-3xl text-dash-text">{day}</h1>
        <p className="text-sm text-dash-text-secondary">
          · {greeting} Roger
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
        <div className="space-y-4 min-w-0">
          <NeedsYou />
          <NewSinceLastCheck />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <TodayActiveDeals />
            <MorningSalesHealth />
          </div>
        </div>
        <aside className="lg:sticky lg:top-4 self-start">
          <TodayKpiRail />
        </aside>
      </div>
    </div>
  );
};

export default OverviewPage;
