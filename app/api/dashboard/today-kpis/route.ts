import { NextResponse } from "next/server";
import { readSheet } from "@/app/lib/dashboard-sheets";

const HOURS = 1000 * 60 * 60;
const DAYS = HOURS * 24;
const CLOSED_STAGES = new Set(["closed-won", "closed-lost", "won", "lost"]);

const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${Math.round(value)}`;
};

const safeNumber = (s: string | undefined): number => {
  if (!s) return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const olderThan = (iso: string, hours: number): boolean => {
  const t = new Date(iso).getTime();
  return !Number.isNaN(t) && Date.now() - t < hours * HOURS;
};

const between = (iso: string, fromHoursAgo: number, toHoursAgo: number): boolean => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const ageHours = (Date.now() - t) / HOURS;
  return ageHours >= toHoursAgo && ageHours < fromHoursAgo;
};

export const GET = async () => {
  const [pipelineRes, leadsRes] = await Promise.allSettled([
    readSheet<Record<string, string>>("Pipeline"),
    readSheet<Record<string, string>>("Leads"),
  ]);

  const pipeline = pipelineRes.status === "fulfilled" ? pipelineRes.value : [];
  const leads = leadsRes.status === "fulfilled" ? leadsRes.value : [];

  const activeDeals = pipeline.filter((d) => !CLOSED_STAGES.has((d.stage || "").toLowerCase()));
  const pipelineValue = activeDeals.reduce((sum, d) => sum + safeNumber(d.value), 0);

  const newLeadsLast24h = leads.filter((l) => l.created_at && olderThan(l.created_at, 24)).length;
  const newLeadsPrev24h = leads.filter((l) => l.created_at && between(l.created_at, 48, 24)).length;
  const leadsDelta = newLeadsPrev24h > 0
    ? Math.round(((newLeadsLast24h - newLeadsPrev24h) / newLeadsPrev24h) * 100)
    : undefined;

  const dealsCreatedLast7d = pipeline.filter((d) => d.created_at && olderThan(d.created_at, 24 * 7)).length;
  const dealsCreatedPrev7d = pipeline.filter((d) => d.created_at && between(d.created_at, 24 * 14, 24 * 7)).length;
  const dealsDelta = dealsCreatedPrev7d > 0
    ? Math.round(((dealsCreatedLast7d - dealsCreatedPrev7d) / dealsCreatedPrev7d) * 100)
    : undefined;

  const valueLast7d = pipeline
    .filter((d) => d.created_at && olderThan(d.created_at, 24 * 7))
    .reduce((s, d) => s + safeNumber(d.value), 0);
  const valuePrev7d = pipeline
    .filter((d) => d.created_at && between(d.created_at, 24 * 14, 24 * 7))
    .reduce((s, d) => s + safeNumber(d.value), 0);
  const pipelineDelta = valuePrev7d > 0
    ? Math.round(((valueLast7d - valuePrev7d) / valuePrev7d) * 100)
    : undefined;

  // Stripe revenue (24h) — best-effort; falls back to "—" if endpoint unavailable
  let revenueLast24h = "—";
  let revenueDelta: number | undefined;
  try {
    const r = await fetch(`${process.env.URL ?? ""}/api/stripe/summary`, { cache: "no-store" });
    if (r.ok) {
      const data = await r.json();
      const v24 = data?.last24Hours?.volume;
      const vPrev = data?.priorWindow?.volume;
      if (typeof v24 === "number") {
        revenueLast24h = formatCurrency(v24 / 100);
        if (typeof vPrev === "number" && vPrev > 0) {
          revenueDelta = Math.round(((v24 - vPrev) / vPrev) * 100);
        }
      }
    }
  } catch {
    // stripe not configured
  }

  // Suppress unused — DAYS reserved for future "since 7d" comparisons.
  void DAYS;

  return NextResponse.json({
    pipelineValue: formatCurrency(pipelineValue),
    revenueLast24h,
    newLeadsLast24h: String(newLeadsLast24h),
    activeDealCount: String(activeDeals.length),
    pipelineDelta,
    revenueDelta,
    leadsDelta,
    dealsDelta,
  });
};
