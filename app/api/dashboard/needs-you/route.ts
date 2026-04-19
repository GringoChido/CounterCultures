import { NextResponse } from "next/server";
import { readSheet } from "@/app/lib/dashboard-sheets";
import { getTraficoEvents } from "@/app/lib/trafico-events";

type NeedsYouItem = {
  id: string;
  source: "customs" | "followup" | "shipment-delay";
  message: string;
  href: string;
  severity: "warning" | "danger";
  ageHours: number;
};

type LeadRow = Record<string, string> & {
  id: string;
  name: string;
  next_followup: string;
  status: string;
};

type TraficoRow = Record<string, string> & {
  TRF_ID: string;
  Trafico_Number: string;
  Status: string;
  Domestic_Est_Arrival: string;
  Domestic_Actual_Arrival: string;
  Completed_Date: string;
};

const HOURS = 1000 * 60 * 60;
const DAYS = HOURS * 24;

const safeAgeHours = (iso: string): number => {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return (Date.now() - t) / HOURS;
};

const fetchCustomsHolds = async (): Promise<NeedsYouItem[]> => {
  try {
    const events = await getTraficoEvents();
    return events
      .filter((e) => e.event_type === "issue_logged" && safeAgeHours(e.timestamp) >= 24)
      .map<NeedsYouItem>((e) => {
        const ageHours = safeAgeHours(e.timestamp);
        return {
          id: `customs-${e.event_id}`,
          source: "customs",
          message: `${e.trafico_id} customs issue ${Math.round(ageHours)}h old — ${e.message || "review"}`,
          href: `/dashboard/shipments?trafico=${e.trafico_id}`,
          severity: ageHours >= 48 ? "danger" : "warning",
          ageHours,
        };
      });
  } catch {
    return [];
  }
};

const fetchOverdueFollowups = async (): Promise<NeedsYouItem[]> => {
  try {
    const leads = await readSheet<LeadRow>("Leads");
    const now = Date.now();
    const closed = new Set(["won", "lost", "closed"]);
    return leads
      .filter((l) => {
        if (!l.next_followup) return false;
        if (closed.has((l.status || "").toLowerCase())) return false;
        const t = new Date(l.next_followup).getTime();
        return !Number.isNaN(t) && t < now;
      })
      .map<NeedsYouItem>((l) => {
        const ageHours = (Date.now() - new Date(l.next_followup).getTime()) / HOURS;
        const days = Math.floor(ageHours / 24);
        return {
          id: `followup-${l.id}`,
          source: "followup",
          message: `${l.name || l.id} follow-up ${days >= 1 ? `${days}d overdue` : "due today"}`,
          href: `/dashboard/leads`,
          severity: ageHours >= 72 ? "danger" : "warning",
          ageHours,
        };
      });
  } catch {
    return [];
  }
};

const fetchShipmentDelays = async (): Promise<NeedsYouItem[]> => {
  try {
    const traficos = await readSheet<TraficoRow>("Traficos");
    const now = Date.now();
    return traficos
      .filter((t) => {
        if (t.Completed_Date) return false;
        if (t.Domestic_Actual_Arrival) return false;
        if (!t.Domestic_Est_Arrival) return false;
        const eta = new Date(t.Domestic_Est_Arrival).getTime();
        if (Number.isNaN(eta)) return false;
        const delayDays = (now - eta) / DAYS;
        return delayDays >= 3;
      })
      .map<NeedsYouItem>((t) => {
        const eta = new Date(t.Domestic_Est_Arrival).getTime();
        const delayDays = Math.floor((now - eta) / DAYS);
        const ageHours = (now - eta) / HOURS;
        return {
          id: `shipment-${t.TRF_ID}`,
          source: "shipment-delay",
          message: `${t.Trafico_Number || t.TRF_ID} delayed ${delayDays}d — ETA missed`,
          href: `/dashboard/shipments?trafico=${t.TRF_ID}`,
          severity: delayDays >= 7 ? "danger" : "warning",
          ageHours,
        };
      });
  } catch {
    return [];
  }
};

export const GET = async () => {
  const results = await Promise.allSettled([
    fetchCustomsHolds(),
    fetchOverdueFollowups(),
    fetchShipmentDelays(),
  ]);

  const items: NeedsYouItem[] = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "danger" ? -1 : 1;
      return b.ageHours - a.ageHours;
    })
    .slice(0, 8);

  return NextResponse.json({ items });
};
