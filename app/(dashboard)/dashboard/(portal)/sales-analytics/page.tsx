"use client";

/**
 * V2 Fix 6: six-tab analytics page over existing data.
 *
 * Tabs: Overview | Deals | Revenue | Pipeline Health | Brands | Customers
 *
 * Uses:
 *   - /api/dashboard/sales-analytics  (monthly rollup, existing)
 *   - /api/dashboard/pipeline         (all deals, for Deals/Revenue/Brands/Customers)
 *
 * Deliberately no new endpoints — derive the cuts client-side so this
 * page is a pure read over what the portal already writes.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  DollarSign,
  Target,
  TrendingUp,
  Award,
  Loader2,
  Download,
  Briefcase,
  Users,
  Tag,
  Activity as ActivityIcon,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { ChartCard } from "@/app/(dashboard)/components/chart-card";
import { SAMPLE_REVENUE_TREND } from "@/app/lib/sample-dashboard-data";
import { downloadCsv } from "@/app/lib/csv-export";

// ── Types ──────────────────────────────────────────────────────────────

type MonthlyPoint = { month: string; revenue: number };
type Kpis = {
  totalRevenue: string;
  dealsClosed: string;
  avgDealSize: string;
  winRate: string;
};

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
  brand_slugs?: string;
};

type Tab = "overview" | "deals" | "revenue" | "health" | "brands" | "customers";

const TABS: { id: Tab; label: string; Icon: typeof BarChart3 }[] = [
  { id: "overview", label: "Overview", Icon: BarChart3 },
  { id: "deals", label: "Deals", Icon: Briefcase },
  { id: "revenue", label: "Revenue", Icon: DollarSign },
  { id: "health", label: "Pipeline Health", Icon: ActivityIcon },
  { id: "brands", label: "Brands", Icon: Tag },
  { id: "customers", label: "Customers", Icon: Users },
];

const WON_STAGE_RX = /complete|won|delivered|received/i;
const LOST_STAGE_RX = /lost|cancel/i;

// ── Helpers ────────────────────────────────────────────────────────────

const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const parseVal = (v: string | undefined): number => {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const fallbackMonthlyRevenue = SAMPLE_REVENUE_TREND;

// ── Page ───────────────────────────────────────────────────────────────

const SalesAnalyticsPage = () => {
  const [tab, setTab] = useState<Tab>("overview");
  // Brand filter is settable from the Revenue tab's bar chart / list, and
  // applied on the Deals tab. Click-to-filter is V1 Rule 7.
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyPoint[]>(
    fallbackMonthlyRevenue
  );
  const [kpis, setKpis] = useState<Kpis>({
    totalRevenue: "$2.42M",
    dealsClosed: "38",
    avgDealSize: "$63.7K",
    winRate: "72%",
  });
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealsLoading, setDealsLoading] = useState(false);

  // Revenue metrics (legacy payload)
  useEffect(() => {
    const fetchSalesMetrics = async () => {
      try {
        const res = await fetch("/api/dashboard/sales-analytics");
        if (res.ok) {
          const data = await res.json();
          const metrics = data.metrics as Array<Record<string, string>>;
          if (metrics.length > 0) {
            const chartData = metrics.map((m) => ({
              month: m.date || "",
              revenue: parseFloat(m.total_revenue) || 0,
            }));
            if (chartData.some((d) => d.revenue > 0)) {
              setMonthlyRevenue(chartData);
            }
            const latest = metrics[metrics.length - 1];
            if (latest.total_revenue) {
              setKpis({
                totalRevenue: formatCurrency(parseFloat(latest.total_revenue) || 0),
                dealsClosed: latest.deals_closed || "0",
                avgDealSize: formatCurrency(parseFloat(latest.avg_deal_size) || 0),
                winRate: latest.conversion_rate
                  ? `${latest.conversion_rate}%`
                  : "0%",
              });
            }
          }
        }
      } catch {
        /* keep fallback */
      } finally {
        setLoading(false);
      }
    };
    fetchSalesMetrics();
  }, []);

  // Pipeline deals — the source of truth for Deals/Brands/Customers/Health
  const loadDeals = useCallback(async () => {
    setDealsLoading(true);
    try {
      const res = await fetch("/api/dashboard/pipeline", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { deals?: Deal[] };
        setDeals(data.deals ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setDealsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "overview" && deals.length === 0 && !dealsLoading) {
      loadDeals();
    }
  }, [tab, deals.length, dealsLoading, loadDeals]);

  // ── Derived cuts ─────────────────────────────────────────────────────

  const closedDeals = useMemo(
    () => deals.filter((d) => WON_STAGE_RX.test(d.stage || "")),
    [deals]
  );
  const openDeals = useMemo(
    () =>
      deals.filter(
        (d) =>
          !WON_STAGE_RX.test(d.stage || "") && !LOST_STAGE_RX.test(d.stage || "")
      ),
    [deals]
  );

  const brandRanking = useMemo(() => {
    const byBrand = new Map<string, { revenue: number; deals: number }>();
    for (const d of closedDeals) {
      const slugs = (d.brand_slugs || "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      const value = parseVal(d.value);
      if (slugs.length === 0) continue;
      // Split revenue equally across deal's brands.
      const share = value / slugs.length;
      for (const slug of slugs) {
        const cur = byBrand.get(slug) ?? { revenue: 0, deals: 0 };
        cur.revenue += share;
        cur.deals += 1;
        byBrand.set(slug, cur);
      }
    }
    return Array.from(byBrand.entries())
      .map(([slug, v]) => ({ slug, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [closedDeals]);

  const customerRanking = useMemo(() => {
    const byCustomer = new Map<string, { revenue: number; deals: number }>();
    for (const d of closedDeals) {
      const key = d.company || d.name || "(unknown)";
      const cur = byCustomer.get(key) ?? { revenue: 0, deals: 0 };
      cur.revenue += parseVal(d.value);
      cur.deals += 1;
      byCustomer.set(key, cur);
    }
    return Array.from(byCustomer.entries())
      .map(([customer, v]) => ({ customer, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [closedDeals]);

  const pipelineHealth = useMemo(() => {
    // Stage distribution across open deals — a rough surrogate for stage
    // velocity until we wire deal_events into this page. Each bar is the
    // count of deals sitting in that stage.
    const counts = new Map<string, number>();
    for (const d of openDeals) {
      const s = d.stage || "—";
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count);
  }, [openDeals]);

  // ── Render helpers ───────────────────────────────────────────────────

  const handleExport = () => {
    switch (tab) {
      case "deals":
        downloadCsv(
          "sales-analytics-deals",
          ["ID", "Name", "Company", "Stage", "Value", "Brands", "Close"],
          deals.map((d) => [
            d.id,
            d.name,
            d.company ?? "",
            d.stage,
            d.value ?? "",
            d.brand_slugs ?? "",
            d.expected_close ?? "",
          ])
        );
        break;
      case "brands":
        downloadCsv(
          "sales-analytics-brands",
          ["Brand", "Revenue (MXN)", "Deals"],
          brandRanking.map((b) => [b.slug, b.revenue, b.deals])
        );
        break;
      case "customers":
        downloadCsv(
          "sales-analytics-customers",
          ["Customer", "LTV (MXN)", "Deals"],
          customerRanking.map((c) => [c.customer, c.revenue, c.deals])
        );
        break;
      case "health":
        downloadCsv(
          "sales-analytics-pipeline-health",
          ["Stage", "Open Deals"],
          pipelineHealth.map((h) => [h.stage, h.count])
        );
        break;
      case "revenue":
      case "overview":
      default:
        downloadCsv(
          "sales-analytics-revenue",
          ["Month", "Revenue (MXN)"],
          monthlyRevenue.map((m) => [m.month, m.revenue])
        );
    }
    toast.success("Export started");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Pipeline & Sales</h2>
          <p className="text-sm text-dash-text-secondary mt-1">
            Revenue performance, deal flow, and pipeline health
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-dash-border text-dash-text rounded-lg text-xs font-medium hover:bg-dash-bg transition-colors cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-dash-border overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? "text-brand-copper border-brand-copper"
                  : "text-dash-text-secondary border-transparent hover:text-dash-text"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <OverviewTab kpis={kpis} monthlyRevenue={monthlyRevenue} />
      ) : null}

      {tab === "deals" ? (
        <DealsTab
          deals={deals}
          loading={dealsLoading}
          brandFilter={brandFilter}
          onClearBrandFilter={() => setBrandFilter(null)}
        />
      ) : null}

      {tab === "revenue" ? (
        <RevenueTab
          monthlyRevenue={monthlyRevenue}
          brandRanking={brandRanking}
          activeBrand={brandFilter}
          onBrandClick={(slug) => {
            setBrandFilter(slug);
            setTab("deals");
          }}
        />
      ) : null}

      {tab === "health" ? (
        <HealthTab health={pipelineHealth} loading={dealsLoading} />
      ) : null}

      {tab === "brands" ? (
        <BrandsTab brands={brandRanking} loading={dealsLoading} />
      ) : null}

      {tab === "customers" ? (
        <CustomersTab customers={customerRanking} loading={dealsLoading} />
      ) : null}
    </div>
  );
};

// ── Tab components ────────────────────────────────────────────────────

const OverviewTab = ({
  kpis,
  monthlyRevenue,
}: {
  kpis: Kpis;
  monthlyRevenue: MonthlyPoint[];
}) => (
  <>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPICard
        label="Total Revenue"
        value={kpis.totalRevenue}
        icon={DollarSign}
        accentColor="bg-brand-copper"
      />
      <KPICard
        label="Deals Closed"
        value={kpis.dealsClosed}
        icon={Target}
        accentColor="bg-status-won"
      />
      <KPICard
        label="Avg Deal Size"
        value={kpis.avgDealSize}
        icon={TrendingUp}
        accentColor="bg-brand-sage"
      />
      <KPICard
        label="Win Rate"
        value={kpis.winRate}
        icon={Award}
        accentColor="bg-brand-terracotta"
      />
    </div>

    <ChartCard title="Monthly Revenue" subtitle="Last 6 months (MXN)">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyRevenue}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickFormatter={(v) => formatCurrency(v)}
            />
            <Tooltip
              formatter={(value) => [
                `$${Number(value).toLocaleString()} MXN`,
                "Revenue",
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="revenue"
              fill="#B87333"
              radius={[4, 4, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  </>
);

const DealsTab = ({
  deals,
  loading,
  brandFilter,
  onClearBrandFilter,
}: {
  deals: Deal[];
  loading: boolean;
  brandFilter: string | null;
  onClearBrandFilter: () => void;
}) => {
  const filtered = brandFilter
    ? deals.filter((d) =>
        (d.brand_slugs || "")
          .split("|")
          .map((s) => s.trim().toLowerCase())
          .includes(brandFilter.toLowerCase())
      )
    : deals;

  if (loading && filtered.length === 0) return <TabLoader />;
  if (!loading && filtered.length === 0) {
    return (
      <div>
        {brandFilter ? (
          <FilterChipRow
            label={`Brand: ${brandFilter}`}
            onClear={onClearBrandFilter}
          />
        ) : null}
        <EmptyState
          label={
            brandFilter
              ? `No deals tagged to "${brandFilter}".`
              : "No deals in the pipeline yet."
          }
        />
      </div>
    );
  }

  return (
    <div>
      {brandFilter ? (
        <FilterChipRow
          label={`Brand: ${brandFilter}`}
          onClear={onClearBrandFilter}
        />
      ) : null}
      <div className="bg-dash-surface border border-dash-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dash-border text-left text-xs uppercase tracking-wider text-dash-text-secondary">
              <th className="px-5 py-3">Deal</th>
              <th className="py-3">Customer</th>
              <th className="py-3">Stage</th>
              <th className="py-3">Brands</th>
              <th className="py-3 text-right pr-5">Value</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((d) => (
              <tr
                key={d.id}
                className="border-b border-dash-border/50 last:border-0 hover:bg-dash-bg/50 transition-colors"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/dashboard/pipeline?deal=${encodeURIComponent(d.id)}`}
                    className="text-brand-copper hover:underline"
                  >
                    {d.id}
                  </Link>
                  <p className="text-xs text-dash-text-secondary mt-0.5 truncate max-w-[240px]">
                    {d.name}
                  </p>
                </td>
                <td className="py-3 text-xs text-dash-text">
                  {d.company || "—"}
                </td>
                <td className="py-3 text-xs text-dash-text-secondary">
                  {d.stage}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {(d.brand_slugs || "")
                      .split("|")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((slug) => (
                        <Link
                          key={slug}
                          href={`/dashboard/brands/${slug}`}
                          className="px-1.5 py-0.5 bg-brand-copper/10 text-brand-copper rounded text-[10px] hover:bg-brand-copper/20 transition-colors"
                        >
                          {slug}
                        </Link>
                      ))}
                  </div>
                </td>
                <td className="py-3 pr-5 text-right text-sm font-medium text-brand-copper">
                  {formatCurrency(parseVal(d.value))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

const RevenueTab = ({
  monthlyRevenue,
  brandRanking,
  activeBrand,
  onBrandClick,
}: {
  monthlyRevenue: MonthlyPoint[];
  brandRanking: { slug: string; revenue: number; deals: number }[];
  activeBrand: string | null;
  onBrandClick: (slug: string) => void;
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <ChartCard title="Monthly Revenue" subtitle="Last 6 months (MXN)">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyRevenue}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickFormatter={(v) => formatCurrency(v)}
            />
            <Tooltip
              formatter={(value) => [
                `$${Number(value).toLocaleString()} MXN`,
                "Revenue",
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="revenue"
              fill="#B87333"
              radius={[4, 4, 0, 0]}
              barSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>

    <div className="bg-dash-surface border border-dash-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-dash-text mb-4">
        Revenue by Brand (closed deals)
      </h3>
      {brandRanking.length === 0 ? (
        <EmptyState label="No closed-deal revenue attributed to brands yet." />
      ) : (
        <>
          <p className="text-[11px] text-dash-text-muted mb-2">
            Click a brand to filter the Deals tab.
          </p>
          <ul className="space-y-2">
            {brandRanking.slice(0, 10).map((b) => {
              const max = brandRanking[0].revenue || 1;
              const pct = (b.revenue / max) * 100;
              const isActive = activeBrand === b.slug;
              return (
                <li key={b.slug}>
                  <button
                    type="button"
                    onClick={() => onBrandClick(b.slug)}
                    className={`w-full flex items-center gap-3 cursor-pointer transition-colors text-left ${
                      isActive
                        ? "text-brand-copper"
                        : "text-dash-text hover:text-brand-copper"
                    }`}
                  >
                    <span className="text-xs w-24 truncate">{b.slug}</span>
                    <div className="flex-1 h-2 bg-dash-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isActive ? "bg-brand-terracotta" : "bg-brand-copper"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-brand-copper w-16 text-right">
                      {formatCurrency(b.revenue)}
                    </span>
                    <span className="text-[11px] text-dash-text-secondary w-10 text-right">
                      {b.deals}d
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  </div>
);

const HealthTab = ({
  health,
  loading,
}: {
  health: { stage: string; count: number }[];
  loading: boolean;
}) => {
  if (loading && health.length === 0) return <TabLoader />;
  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-dash-text">
          Open deals by stage
        </h3>
        <Link
          href="/dashboard/pipeline"
          className="text-xs text-brand-copper hover:underline"
        >
          Open pipeline →
        </Link>
      </div>
      {health.length === 0 ? (
        <EmptyState label="No active deals in the pipeline." />
      ) : (
        <div className="space-y-2">
          {health.map((h) => {
            const max = health[0].count || 1;
            const pct = (h.count / max) * 100;
            return (
              <div
                key={h.stage}
                className="flex items-center gap-3"
              >
                <span className="text-xs text-dash-text w-40 truncate">
                  {h.stage}
                </span>
                <div className="flex-1 h-2 bg-dash-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-sage transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-dash-text w-10 text-right">
                  {h.count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const BrandsTab = ({
  brands,
  loading,
}: {
  brands: { slug: string; revenue: number; deals: number }[];
  loading: boolean;
}) => {
  if (loading && brands.length === 0) return <TabLoader />;
  if (brands.length === 0)
    return <EmptyState label="No closed-deal revenue yet." />;
  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dash-border text-left text-xs uppercase tracking-wider text-dash-text-secondary">
            <th className="px-5 py-3">Brand</th>
            <th className="py-3 text-right">Closed deals</th>
            <th className="py-3 text-right pr-5">Attributed revenue</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((b) => (
            <tr
              key={b.slug}
              className="border-b border-dash-border/50 last:border-0 hover:bg-dash-bg/50 transition-colors"
            >
              <td className="px-5 py-3">
                <Link
                  href={`/dashboard/brands/${b.slug}`}
                  className="text-brand-copper hover:underline"
                >
                  {b.slug}
                </Link>
              </td>
              <td className="py-3 text-right text-xs text-dash-text">
                {b.deals}
              </td>
              <td className="py-3 pr-5 text-right font-medium text-brand-copper">
                {formatCurrency(b.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CustomersTab = ({
  customers,
  loading,
}: {
  customers: { customer: string; revenue: number; deals: number }[];
  loading: boolean;
}) => {
  if (loading && customers.length === 0) return <TabLoader />;
  if (customers.length === 0)
    return <EmptyState label="No closed-deal revenue yet." />;
  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dash-border text-left text-xs uppercase tracking-wider text-dash-text-secondary">
            <th className="px-5 py-3">Customer</th>
            <th className="py-3 text-right">Deals</th>
            <th className="py-3 text-right pr-5">Lifetime value</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr
              key={c.customer}
              className="border-b border-dash-border/50 last:border-0 hover:bg-dash-bg/50 transition-colors"
            >
              <td className="px-5 py-3 text-sm text-dash-text">{c.customer}</td>
              <td className="py-3 text-right text-xs text-dash-text">
                {c.deals}
              </td>
              <td className="py-3 pr-5 text-right font-medium text-brand-copper">
                {formatCurrency(c.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FilterChipRow = ({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) => (
  <div className="mb-3 flex items-center gap-2">
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-brand-copper/10 text-brand-copper rounded-full border border-brand-copper/20">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="hover:text-brand-terracotta transition-colors cursor-pointer"
        aria-label="Clear filter"
      >
        ×
      </button>
    </span>
    <button
      type="button"
      onClick={onClear}
      className="text-[11px] text-dash-text-secondary hover:text-dash-text underline underline-offset-2 cursor-pointer"
    >
      Clear filters
    </button>
  </div>
);

const TabLoader = () => (
  <div className="flex items-center justify-center py-12 text-xs text-dash-text-muted">
    <Loader2 className="w-4 h-4 animate-spin mr-2" />
    Loading…
  </div>
);

const EmptyState = ({ label }: { label: string }) => (
  <p className="text-sm text-dash-text-muted py-8 text-center">{label}</p>
);

export default SalesAnalyticsPage;
