"use client";

/**
 * Morning Brief — hero card on /dashboard/overview that gives Roger one
 * curated read-out at the start of his day: where the pipeline sits,
 * what only he can unblock, what advanced overnight, and what's stuck.
 *
 * v0 — owner role only, in-dashboard surface only. Email + WhatsApp
 * delivery + per-user role variants land in v1 once Roger has lived
 * with this for a few days and we've tuned the content.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import type { OwnerMorningBrief, BriefAction } from "@/app/lib/morning-brief";

const dotForSeverity: Record<NonNullable<BriefAction["severity"]>, string> = {
  info: "bg-dash-info",
  warn: "bg-dash-warn",
  urgent: "bg-dash-danger",
};

const ActionRow = ({ action }: { action: BriefAction }) => (
  <Link
    href={action.href}
    className="group flex items-start gap-2.5 py-2 px-3 -mx-3 rounded-md hover:bg-dash-bg transition-colors"
  >
    <span
      className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
        dotForSeverity[action.severity ?? "info"]
      }`}
    />
    <div className="flex-1 min-w-0">
      <p className="text-[13px] text-dash-text leading-snug">{action.label}</p>
      {action.detail && (
        <p className="text-[11px] text-dash-text-secondary mt-0.5 truncate">
          {action.detail}
        </p>
      )}
    </div>
    {action.badge && (
      <span
        className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${
          action.severity === "urgent"
            ? "bg-dash-danger/10 text-dash-danger border border-dash-danger/30"
            : action.severity === "warn"
              ? "bg-dash-warn/10 text-dash-warn border border-dash-warn/30"
              : "bg-dash-bg text-dash-text-secondary border border-dash-border"
        }`}
      >
        {action.badge}
      </span>
    )}
    <ArrowRight className="w-3 h-3 text-dash-text-secondary opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
  </Link>
);

const Section = ({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-baseline justify-between mb-1">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary">
        {title}
      </h4>
      {count > 0 && (
        <span className="text-[10px] text-dash-text-secondary">{count}</span>
      )}
    </div>
    {count === 0 ? (
      <p className="text-[12px] text-dash-text-secondary/70 italic px-3 py-2">
        {empty}
      </p>
    ) : (
      <div className="space-y-px">{children}</div>
    )}
  </div>
);

// Greeting derived from the user's local clock, not the server's UTC.
// Renders an empty string until mount so SSR/CSR markup matches.
const greetingForHour = (hour: number): string => {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

export const MorningBrief = () => {
  const [brief, setBrief] = useState<OwnerMorningBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  // bypass=true sends ?refresh=1 so the route skips its 5min in-memory
  // cache. Initial mount uses the cache; the Refresh button bypasses it.
  const load = async (bypass = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = bypass
        ? "/api/dashboard/morning-brief?refresh=1"
        : "/api/dashboard/morning-brief";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { brief: OwnerMorningBrief };
      setBrief(data.brief);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load brief");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
  }, []);

  if (loading && !brief) {
    return (
      <div className="rounded-lg border border-brand-copper/30 bg-brand-copper/5 p-5">
        <div className="flex items-center gap-2 text-[11px] text-dash-text-secondary">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Building your morning brief…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-dash-danger/30 bg-dash-danger/5 p-4">
        <p className="text-[12px] text-dash-danger inline-flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          Morning brief failed to load · {error}
        </p>
        <button
          type="button"
          onClick={() => load(true)}
          className="text-[11px] text-brand-copper hover:underline mt-1"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!brief) return null;

  const generated = (() => {
    try {
      return format(parseISO(brief.generatedAt), "EEEE d MMM · HH:mm");
    } catch {
      return "";
    }
  })();

  return (
    <div className="rounded-lg border border-brand-copper/30 bg-brand-copper/5 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-brand-copper inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Morning brief
          </p>
          <h3 className="font-display text-[24px] text-dash-text mt-1">
            {greeting ? `${greeting}, Roger.` : "Roger."}
          </h3>
          {generated && (
            <p className="text-[10px] text-dash-text-secondary mt-0.5">
              Generated {generated}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading}
          className="text-[11px] text-dash-text-secondary hover:text-dash-text inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-dash-bg transition-colors disabled:opacity-50"
          title="Regenerate"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Pulse */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {brief.pulse.map((stat) => (
          <div
            key={stat.label}
            className="border border-dash-border bg-dash-surface rounded-md px-3 py-2"
          >
            <p className="text-[9px] uppercase tracking-wider text-dash-text-secondary">
              {stat.label}
            </p>
            <p className="text-[18px] font-display text-dash-text leading-tight mt-1">
              {stat.value}
            </p>
            {stat.delta && (
              <p className="text-[10px] text-dash-text-secondary mt-0.5">
                {stat.delta}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Three sections */}
      <div className="grid md:grid-cols-3 gap-4">
        <Section
          title="Needs you"
          count={brief.needsYou.length}
          empty="Nothing on you · go close something."
        >
          {brief.needsYou.map((a, i) => (
            <ActionRow key={`ny-${i}`} action={a} />
          ))}
        </Section>

        <Section
          title="Advanced"
          count={brief.advanced.length}
          empty="Quiet overnight."
        >
          {brief.advanced.map((a, i) => (
            <ActionRow key={`ad-${i}`} action={a} />
          ))}
        </Section>

        <Section
          title="Stuck"
          count={brief.stuck.length}
          empty="No deals over SLA. Clean board."
        >
          {brief.stuck.map((a, i) => (
            <ActionRow key={`st-${i}`} action={a} />
          ))}
        </Section>
      </div>
    </div>
  );
};
