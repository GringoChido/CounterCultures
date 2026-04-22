"use client";

/**
 * V3 S7: dedicated, bookmarkable deal detail route.
 *
 * Complements the Pipeline page's slide-out (same data, different
 * affordance):
 *   - The slide-out is for in-flow triage while browsing the kanban.
 *   - This route is a permanent URL you can paste in Slack / email, or
 *     deep-link from other portal surfaces.
 *
 * Deliberately lean — renders the key facts and defers "full editing"
 * back to the slide-out via [Open in Pipeline]. Not a duplicate of the
 * 2000-line pipeline component.
 */

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  Mail,
  Calendar,
  Tag,
  User,
  Briefcase,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react";

type Deal = {
  id: string;
  name: string;
  company?: string;
  stage: string;
  value?: string;
  probability?: string;
  expected_close?: string;
  owner?: string;
  source?: string;
  created_at?: string;
  notes?: string;
  brand_slugs?: string;
  stage_entered_at?: string;
};

type Trafico = {
  TRF_ID: string;
  Trafico_Number?: string;
  Status?: string;
  Pedimento_Number?: string;
  Initiated_Date?: string;
};

type DealEvent = {
  event_id: string;
  deal_id: string;
  timestamp: string;
  actor: string;
  event_type: string;
  from_stage?: string;
  to_stage?: string;
  payload_json?: string;
};

const formatCurrency = (v?: string) => {
  if (!v) return "—";
  const n = Number(v.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return v;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
};

const DealDetailPage = ({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) => {
  const { dealId } = use(params);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [shipments, setShipments] = useState<Trafico[]>([]);
  const [events, setEvents] = useState<DealEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dealsRes, itemsRes, tRes, eventsRes] = await Promise.all([
          fetch("/api/dashboard/pipeline", { cache: "no-store" }),
          fetch("/api/dashboard/trafico-items", { cache: "no-store" }),
          fetch("/api/dashboard/traficos", { cache: "no-store" }),
          fetch(`/api/dashboard/deals/${encodeURIComponent(dealId)}/events`, {
            cache: "no-store",
          }),
        ]);

        const deals = dealsRes.ok
          ? ((await dealsRes.json()) as { deals?: Deal[] }).deals ?? []
          : [];
        const matched = deals.find((d) => d.id === dealId) ?? null;
        if (!aborted) setDeal(matched);

        if (matched) {
          const items = itemsRes.ok
            ? ((await itemsRes.json()) as {
                items?: { trafico_id?: string; deal_id?: string }[];
              }).items ?? []
            : [];
          const traficos = tRes.ok
            ? ((await tRes.json()) as { traficos?: Trafico[] }).traficos ?? []
            : [];
          const linkedIds = new Set(
            items.filter((i) => i.deal_id === matched.id).map((i) => i.trafico_id)
          );
          if (!aborted) {
            setShipments(traficos.filter((t) => linkedIds.has(t.TRF_ID)));
          }
        }

        if (eventsRes.ok) {
          const data = (await eventsRes.json()) as { events?: DealEvent[] };
          if (!aborted) setEvents(data.events ?? []);
        }
      } catch (err) {
        if (!aborted)
          setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    load();
    return () => {
      aborted = true;
    };
  }, [dealId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-copper" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Link
          href="/dashboard/pipeline"
          className="inline-flex items-center gap-1.5 text-sm text-dash-text-secondary hover:text-dash-text mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to pipeline
        </Link>
        <div className="bg-dash-surface border border-dash-border rounded p-6 text-center">
          <AlertCircle className="w-6 h-6 text-brand-terracotta mx-auto mb-2" />
          <p className="text-sm text-dash-text">Deal not found</p>
          {error ? (
            <p className="text-xs text-dash-text-secondary mt-1">{error}</p>
          ) : null}
        </div>
      </div>
    );
  }

  const brandSlugs = (deal.brand_slugs || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/pipeline"
          className="inline-flex items-center gap-1.5 text-sm text-dash-text-secondary hover:text-dash-text"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to pipeline
        </Link>
      </div>

      <header className="flex items-start gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-xl bg-brand-copper/10 text-brand-copper border border-brand-copper/20 flex items-center justify-center shrink-0">
          <Briefcase className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-dash-text-secondary font-mono">
            {deal.id}
          </p>
          <h1 className="font-display text-3xl text-dash-text leading-tight">
            {deal.name}
          </h1>
          <p className="text-sm text-dash-text-secondary mt-1">
            {deal.company || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/dashboard/pipeline?deal=${encodeURIComponent(deal.id)}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors"
          >
            Open in Pipeline
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Stage" value={deal.stage} />
        <StatCard label="Value" value={formatCurrency(deal.value)} tone="accent" />
        <StatCard
          label="Probability"
          value={deal.probability ? `${deal.probability}%` : "—"}
        />
        <StatCard
          label="Expected close"
          value={deal.expected_close || "—"}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-dash-surface border border-dash-border rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
            Overview
          </h2>
          <DetailRow
            icon={User}
            label="Customer"
            value={deal.company || deal.name}
          />
          <DetailRow icon={Tag} label="Source" value={deal.source || "—"} />
          <DetailRow
            icon={Calendar}
            label="Created"
            value={deal.created_at ? formatDate(deal.created_at) : "—"}
          />
          <DetailRow
            icon={Calendar}
            label="In current stage since"
            value={
              deal.stage_entered_at ? formatDate(deal.stage_entered_at) : "—"
            }
          />
          <DetailRow icon={User} label="Owner" value={deal.owner || "—"} />

          {brandSlugs.length > 0 ? (
            <div className="pt-2">
              <p className="text-[11px] uppercase tracking-wider text-dash-text-secondary mb-1.5">
                Brands
              </p>
              <div className="flex flex-wrap gap-1.5">
                {brandSlugs.map((slug) => (
                  <Link
                    key={slug}
                    href={`/dashboard/brands/${slug}`}
                    className="px-2 py-0.5 text-xs bg-brand-copper/10 text-brand-copper border border-brand-copper/20 rounded-full hover:bg-brand-copper/20 transition-colors"
                  >
                    {slug}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {deal.notes ? (
            <div className="pt-2">
              <p className="text-[11px] uppercase tracking-wider text-dash-text-secondary mb-1.5">
                Notes
              </p>
              <p className="text-sm text-dash-text whitespace-pre-wrap">
                {deal.notes}
              </p>
            </div>
          ) : null}
        </section>

        <section className="bg-dash-surface border border-dash-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
              Shipments
            </h2>
            <span className="text-[11px] text-dash-text-muted">
              {shipments.length}
            </span>
          </div>
          {shipments.length === 0 ? (
            <p className="text-sm text-dash-text-muted py-4 text-center">
              No shipments linked to this deal yet.
            </p>
          ) : (
            <ul className="divide-y divide-dash-border -my-2">
              {shipments.map((s) => (
                <li
                  key={s.TRF_ID}
                  className="py-2 flex items-center justify-between gap-3"
                >
                  <Link
                    href={`/dashboard/shipments/${encodeURIComponent(s.TRF_ID)}`}
                    className="flex-1 min-w-0 hover:text-brand-copper transition-colors"
                  >
                    <p className="text-xs font-mono font-medium text-dash-text truncate">
                      {s.Trafico_Number || s.TRF_ID}
                    </p>
                    <p className="text-[11px] text-dash-text-secondary truncate">
                      {s.Status || "—"}
                      {s.Pedimento_Number ? ` · Ped. ${s.Pedimento_Number}` : ""}
                    </p>
                  </Link>
                  <Package className="w-3.5 h-3.5 text-dash-text-secondary shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="bg-dash-surface border border-dash-border rounded-xl p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
          Activity
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-dash-text-muted py-4 text-center">
            No events logged for this deal.
          </p>
        ) : (
          <ul className="space-y-2">
            {events.slice(0, 30).map((e) => (
              <li
                key={e.event_id}
                className="flex items-start gap-3 py-1.5 border-b border-dash-border last:border-0"
              >
                <div className="w-7 h-7 rounded-full bg-dash-bg flex items-center justify-center shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 text-dash-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-dash-text">
                    <span className="font-medium">{e.event_type}</span>
                    {e.from_stage && e.to_stage ? (
                      <span className="text-dash-text-secondary">
                        {" · "}
                        {e.from_stage} → {e.to_stage}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[11px] text-dash-text-secondary mt-0.5">
                    {e.actor || "system"} ·{" "}
                    {(() => {
                      try {
                        return format(new Date(e.timestamp), "MMM d, yyyy h:mm a");
                      } catch {
                        return e.timestamp;
                      }
                    })()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex items-center gap-2 flex-wrap">
        <a
          href={`mailto:?subject=${encodeURIComponent(`Re: ${deal.name}`)}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-dash-border rounded-lg hover:bg-dash-bg transition-colors text-dash-text-secondary"
        >
          <Mail className="w-3.5 h-3.5" />
          Email
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Hi, following up on ${deal.name}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-dash-border rounded-lg hover:bg-dash-bg transition-colors text-dash-text-secondary"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </a>
      </section>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent";
}) => (
  <div className="bg-dash-surface border border-dash-border rounded-xl p-4">
    <p className="text-[11px] uppercase tracking-wider text-dash-text-secondary">
      {label}
    </p>
    <p
      className={`text-lg font-semibold mt-1 ${
        tone === "accent" ? "text-brand-copper" : "text-dash-text"
      }`}
    >
      {value}
    </p>
  </div>
);

const DetailRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 text-sm">
    <Icon className="w-3.5 h-3.5 text-dash-text-secondary shrink-0" />
    <span className="text-[11px] uppercase tracking-wider text-dash-text-secondary w-24 shrink-0">
      {label}
    </span>
    <span className="text-dash-text truncate">{value}</span>
  </div>
);

const formatDate = (iso: string) => {
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
};

export default DealDetailPage;
