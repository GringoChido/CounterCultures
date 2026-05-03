"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { NeedsYou } from "@/app/(dashboard)/components/needs-you";
import { NewSinceLastCheck } from "@/app/(dashboard)/components/new-since-last-check";
import { TodayActiveDeals } from "@/app/(dashboard)/components/today-active-deals";
import { MorningSalesHealth } from "@/app/(dashboard)/components/morning-sales-health";
import { TodayKpiRail } from "@/app/(dashboard)/components/today-kpi-rail";
import { ActivityFeed } from "@/app/(dashboard)/components/activity-feed";
import { CommandCenter } from "@/app/(dashboard)/components/command-center";
import { useCurrentUser } from "@/app/lib/use-current-user";

const greetingFor = (date: Date): string => {
  const h = date.getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

const firstNameOf = (name: string | null | undefined): string =>
  (name ?? "").trim().split(/\s+/)[0] ?? "";

const OverviewPage = () => {
  // Render after mount so SSR HTML matches client (no hydration mismatch
  // when server timezone differs from the user's local timezone).
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const { user } = useCurrentUser();
  const firstName = firstNameOf(user?.name);

  const day = now ? format(now, "EEEE, MMMM d") : "";
  const greeting = now ? greetingFor(now) : "";
  const greetingLine = greeting
    ? firstName
      ? `· ${greeting} ${firstName}`
      : `· ${greeting}`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h1 className="font-display text-3xl text-dash-text">{day}</h1>
        <p className="text-sm text-dash-text-secondary">{greetingLine}</p>
      </div>

      <CommandCenter />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
        <div className="space-y-4 min-w-0">
          <NeedsYou />
          <NewSinceLastCheck />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <TodayActiveDeals />
            <MorningSalesHealth />
          </div>
        </div>
        <aside className="lg:sticky lg:top-4 self-start space-y-4">
          <TodayKpiRail />
          <ActivityFeed limit={12} />
        </aside>
      </div>
    </div>
  );
};

export default OverviewPage;
