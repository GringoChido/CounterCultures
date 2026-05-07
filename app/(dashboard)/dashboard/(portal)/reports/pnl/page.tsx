"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  ChevronDown,
  ChevronRight,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  CompanyBadge,
  getCompanyConfig,
} from "@/app/(dashboard)/components/company-badge";

// ---------------------------------------------------------------------------
// Types (mirroring pnl-report.ts)
// ---------------------------------------------------------------------------

type PeriodType = "month" | "quarter" | "year";
type Company = "cc" | "llc" | "combined";

interface PnLLineItem {
  accountId: string;
  accountName: string;
  amountMXN: number;
  amountUSD: number;
  count: number;
}

interface PnLSection {
  label: string;
  items: PnLLineItem[];
  totalMXN: number;
  totalUSD: number;
}

interface PnLReport {
  company: Company;
  period: { type: PeriodType; year: number; period: number };
  range: { start: string; end: string };
  reportCurrency: string;
  fxRate: number | null;
  revenue: PnLSection;
  refunds: PnLSection;
  netRevenue: { totalMXN: number; totalUSD: number };
  expenses: PnLSection;
  expenseRefunds: PnLSection;
  netExpenses: { totalMXN: number; totalUSD: number };
  netIncome: { totalMXN: number; totalUSD: number };
  priorPeriod: {
    netRevenueMXN: number;
    netRevenuUSD: number;
    netExpensesMXN: number;
    netExpensesUSD: number;
    netIncomeMXN: number;
    netIncomeUSD: number;
  } | null;
  cashIn: { totalMXN: number; totalUSD: number };
  cashOut: { totalMXN: number; totalUSD: number };
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const QUARTERS = ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"];

const fmt = (amount: number, currency: string) => {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = currency === "USD" ? "$" : "$";
  const suffix = currency === "USD" ? " USD" : " MXN";
  return `${amount < 0 ? "-" : ""}${prefix}${formatted}${suffix}`;
};

const pctChange = (current: number, prior: number): number | null => {
  if (prior === 0) return current === 0 ? 0 : null;
  return ((current - prior) / Math.abs(prior)) * 100;
};

const periodLabel = (type: PeriodType, year: number, period: number): string => {
  if (type === "year") return String(year);
  if (type === "quarter") return `Q${period} ${year}`;
  return `${MONTHS[period - 1]} ${year}`;
};

// ---------------------------------------------------------------------------
// Company selector with color identity
// ---------------------------------------------------------------------------

const CompanySelector = ({
  value,
  onChange,
}: {
  value: Company;
  onChange: (v: Company) => void;
}) => (
  <div className="flex rounded-lg border border-dash-border overflow-hidden">
    <button
      type="button"
      onClick={() => onChange("combined")}
      className={`px-4 py-2 text-sm transition-colors cursor-pointer ${
        value === "combined"
          ? "bg-dash-surface font-semibold text-dash-text"
          : "bg-dash-bg text-dash-text-muted hover:text-dash-text-secondary"
      }`}
    >
      Combined
    </button>
    <button
      type="button"
      onClick={() => onChange("cc")}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm border-l border-dash-border transition-colors cursor-pointer ${
        value === "cc"
          ? "bg-company-cc-soft font-semibold text-company-cc-text"
          : "bg-dash-bg text-dash-text-muted hover:text-dash-text-secondary"
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-company-cc" />
      CC Mexico
    </button>
    <button
      type="button"
      onClick={() => onChange("llc")}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm border-l border-dash-border transition-colors cursor-pointer ${
        value === "llc"
          ? "bg-company-llc-soft font-semibold text-company-llc-text"
          : "bg-dash-bg text-dash-text-muted hover:text-dash-text-secondary"
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-company-llc" />
      LLC USA
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// Variance indicator
// ---------------------------------------------------------------------------

const Variance = ({ current, prior, currency, inverted = false }: {
  current: number;
  prior: number;
  currency: string;
  inverted?: boolean;
}) => {
  const pct = pctChange(current, prior);
  if (pct === null) return null;

  const isPositive = inverted ? pct < 0 : pct > 0;
  const isNeutral = Math.abs(pct) < 0.5;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isNeutral
          ? "text-dash-text-muted"
          : isPositive
            ? "text-dash-success"
            : "text-dash-danger"
      }`}
    >
      {isNeutral ? (
        <Minus className="w-3 h-3" />
      ) : isPositive ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
};

// ---------------------------------------------------------------------------
// Section row (expandable)
// ---------------------------------------------------------------------------

const SectionRow = ({
  section,
  currency,
  defaultOpen = false,
}: {
  section: PnLSection;
  currency: string;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const total = currency === "USD" ? section.totalUSD : section.totalMXN;
  const otherTotal = currency === "USD" ? section.totalMXN : section.totalUSD;
  const otherCurrency = currency === "USD" ? "MXN" : "USD";

  return (
    <>
      <tr
        className="cursor-pointer hover:bg-dash-bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <td className="py-2.5 pl-4 pr-2">
          <span className="flex items-center gap-1.5 text-sm font-medium text-dash-text">
            {open ? (
              <ChevronDown className="w-3.5 h-3.5 text-dash-text-muted" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-dash-text-muted" />
            )}
            {section.label}
          </span>
        </td>
        <td className="py-2.5 pr-4 text-right">
          <span className="text-sm font-semibold text-dash-text">
            {fmt(total, currency)}
          </span>
          {otherTotal > 0 && (
            <span className="block text-[10px] text-dash-text-muted">
              + {fmt(otherTotal, otherCurrency)}
            </span>
          )}
        </td>
        <td className="py-2.5 pr-4 text-right text-xs text-dash-text-secondary">
          {section.items.length} {section.items.length === 1 ? "account" : "accounts"}
        </td>
      </tr>
      {open &&
        section.items.map((item) => {
          const amt = currency === "USD" ? item.amountUSD : item.amountMXN;
          const otherAmt = currency === "USD" ? item.amountMXN : item.amountUSD;
          return (
            <tr key={item.accountId} className="bg-dash-bg/30">
              <td className="py-1.5 pl-10 pr-2 text-xs text-dash-text-secondary">
                {item.accountName}
              </td>
              <td className="py-1.5 pr-4 text-right text-xs text-dash-text-secondary">
                {fmt(amt, currency)}
                {otherAmt > 0 && (
                  <span className="text-[10px] text-dash-text-muted ml-1">
                    + {fmt(otherAmt, otherCurrency)}
                  </span>
                )}
              </td>
              <td className="py-1.5 pr-4 text-right text-[10px] text-dash-text-muted">
                {item.count} doc{item.count === 1 ? "" : "s"}
              </td>
            </tr>
          );
        })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Summary cards
// ---------------------------------------------------------------------------

const SummaryCards = ({
  report,
  currency,
}: {
  report: PnLReport;
  currency: string;
}) => {
  const rev = currency === "USD" ? report.netRevenue.totalUSD : report.netRevenue.totalMXN;
  const exp = currency === "USD" ? report.netExpenses.totalUSD : report.netExpenses.totalMXN;
  const net = currency === "USD" ? report.netIncome.totalUSD : report.netIncome.totalMXN;
  const margin = rev > 0 ? (net / rev) * 100 : 0;

  const priorRev = report.priorPeriod
    ? (currency === "USD" ? report.priorPeriod.netRevenuUSD : report.priorPeriod.netRevenueMXN)
    : null;
  const priorExp = report.priorPeriod
    ? (currency === "USD" ? report.priorPeriod.netExpensesUSD : report.priorPeriod.netExpensesMXN)
    : null;
  const priorNet = report.priorPeriod
    ? (currency === "USD" ? report.priorPeriod.netIncomeUSD : report.priorPeriod.netIncomeMXN)
    : null;

  const companyAccent = report.company === "llc"
    ? "border-company-llc/30"
    : report.company === "cc"
      ? "border-company-cc/30"
      : "border-dash-border";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div className={`bg-dash-surface border ${companyAccent} p-4 rounded-lg`}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-dash-success" />
          <span className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
            Net Revenue
          </span>
        </div>
        <div className="text-xl font-semibold text-dash-text">{fmt(rev, currency)}</div>
        {priorRev !== null && (
          <div className="mt-1">
            <Variance current={rev} prior={priorRev} currency={currency} />
          </div>
        )}
      </div>

      <div className={`bg-dash-surface border ${companyAccent} p-4 rounded-lg`}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="w-4 h-4 text-dash-warn" />
          <span className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
            Total Expenses
          </span>
        </div>
        <div className="text-xl font-semibold text-dash-text">{fmt(exp, currency)}</div>
        {priorExp !== null && (
          <div className="mt-1">
            <Variance current={exp} prior={priorExp} currency={currency} inverted />
          </div>
        )}
      </div>

      <div className={`bg-dash-surface border ${companyAccent} p-4 rounded-lg`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-3 h-3 rounded-full ${net >= 0 ? "bg-dash-success" : "bg-dash-danger"}`} />
          <span className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
            Net Income
          </span>
        </div>
        <div className={`text-xl font-semibold ${net >= 0 ? "text-dash-success" : "text-dash-danger"}`}>
          {fmt(net, currency)}
        </div>
        {priorNet !== null && (
          <div className="mt-1">
            <Variance current={net} prior={priorNet} currency={currency} />
          </div>
        )}
      </div>

      <div className={`bg-dash-surface border ${companyAccent} p-4 rounded-lg`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
            Net Margin
          </span>
        </div>
        <div className={`text-xl font-semibold ${margin >= 0 ? "text-dash-text" : "text-dash-danger"}`}>
          {margin.toFixed(1)}%
        </div>
        <div className="flex gap-3 mt-1.5">
          <span className="text-[10px] text-dash-text-muted">
            Cash in: {fmt(
              currency === "USD" ? report.cashIn.totalUSD : report.cashIn.totalMXN,
              currency
            )}
          </span>
          <span className="text-[10px] text-dash-text-muted">
            Out: {fmt(
              currency === "USD" ? report.cashOut.totalUSD : report.cashOut.totalMXN,
              currency
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

const exportCSV = (report: PnLReport, currency: string) => {
  const rows: string[][] = [
    ["P&L Report", periodLabel(report.period.type, report.period.year, report.period.period)],
    ["Company", report.company === "combined" ? "Combined" : report.company.toUpperCase()],
    ["Generated", new Date(report.generatedAt).toLocaleString()],
    [],
    ["Category", "Account", `Amount (${currency})`, "Documents"],
  ];

  const addSection = (section: PnLSection) => {
    for (const item of section.items) {
      const amt = currency === "USD" ? item.amountUSD : item.amountMXN;
      rows.push([section.label, item.accountName, amt.toFixed(2), String(item.count)]);
    }
    const total = currency === "USD" ? section.totalUSD : section.totalMXN;
    rows.push([`${section.label} Total`, "", total.toFixed(2), ""]);
  };

  addSection(report.revenue);
  addSection(report.refunds);
  const netRev = currency === "USD" ? report.netRevenue.totalUSD : report.netRevenue.totalMXN;
  rows.push(["NET REVENUE", "", netRev.toFixed(2), ""]);
  rows.push([]);
  addSection(report.expenses);
  addSection(report.expenseRefunds);
  const netExp = currency === "USD" ? report.netExpenses.totalUSD : report.netExpenses.totalMXN;
  rows.push(["TOTAL EXPENSES", "", netExp.toFixed(2), ""]);
  rows.push([]);
  const netInc = currency === "USD" ? report.netIncome.totalUSD : report.netIncome.totalMXN;
  rows.push(["NET INCOME", "", netInc.toFixed(2), ""]);

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pnl-${report.company}-${report.range.start}-${report.range.end}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const PnLPage = () => {
  const now = new Date();
  const [company, setCompany] = useState<Company>("combined");
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [year, setYear] = useState(now.getFullYear());
  const [period, setPeriod] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<PnLReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState("MXN");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({
        company,
        periodType,
        year: String(year),
        period: String(period),
      });
      const res = await fetch(`/api/dashboard/reports/pnl?${p}`);
      const data = await res.json();
      setReport(data);
      if (data.company === "llc") setDisplayCurrency("USD");
      else if (data.company === "cc") setDisplayCurrency("MXN");
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [company, periodType, year, period]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const companyAccent =
    company === "llc"
      ? "border-t-company-llc"
      : company === "cc"
        ? "border-t-company-cc"
        : "border-t-dash-accent";

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl font-light tracking-wider text-dash-text">
            Profit & Loss
          </h1>
          <p className="text-xs text-dash-text-secondary mt-0.5">
            {report
              ? `${report.range.start} to ${report.range.end}`
              : "Loading..."}
            {report?.fxRate && (
              <span className="ml-2 text-dash-text-muted">
                FX: 1 USD = {report.fxRate.toFixed(2)} MXN
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            className="p-2 rounded hover:bg-dash-bg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-dash-text-secondary ${loading ? "animate-spin" : ""}`} />
          </button>
          {report && (
            <button
              type="button"
              onClick={() => exportCSV(report, displayCurrency)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-dash-text-secondary border border-dash-border rounded hover:bg-dash-bg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <CompanySelector value={company} onChange={setCompany} />

        <div className="flex gap-2">
          <select
            value={periodType}
            onChange={(e) => {
              const pt = e.target.value as PeriodType;
              setPeriodType(pt);
              if (pt === "year") setPeriod(1);
              if (pt === "quarter") setPeriod(Math.ceil((now.getMonth() + 1) / 3));
              if (pt === "month") setPeriod(now.getMonth() + 1);
            }}
            className="px-3 py-2 border border-dash-border bg-dash-surface text-sm rounded focus:outline-none focus:border-dash-accent"
          >
            <option value="month">Monthly</option>
            <option value="quarter">Quarterly</option>
            <option value="year">Annual</option>
          </select>

          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="px-3 py-2 border border-dash-border bg-dash-surface text-sm rounded focus:outline-none focus:border-dash-accent"
          >
            {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {periodType === "month" && (
            <select
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value, 10))}
              className="px-3 py-2 border border-dash-border bg-dash-surface text-sm rounded focus:outline-none focus:border-dash-accent"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          )}

          {periodType === "quarter" && (
            <select
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value, 10))}
              className="px-3 py-2 border border-dash-border bg-dash-surface text-sm rounded focus:outline-none focus:border-dash-accent"
            >
              {QUARTERS.map((q, i) => (
                <option key={i} value={i + 1}>{q}</option>
              ))}
            </select>
          )}

          {company === "combined" && (
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="px-3 py-2 border border-dash-border bg-dash-surface text-sm rounded focus:outline-none focus:border-dash-accent"
            >
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
            </select>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-dash-text-muted animate-spin" />
        </div>
      )}

      {!loading && report && (
        <>
          <SummaryCards report={report} currency={displayCurrency} />

          {/* P&L Statement Table */}
          <div className={`bg-dash-surface border border-dash-border border-t-2 ${companyAccent} rounded-lg overflow-hidden`}>
            <div className="px-4 py-3 border-b border-dash-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-dash-text uppercase tracking-wider">
                {periodLabel(report.period.type, report.period.year, report.period.period)}
                {report.company !== "combined" && (
                  <CompanyBadge company={report.company} size="xs" />
                )}
              </h2>
              {report.priorPeriod && (
                <span className="text-[10px] text-dash-text-muted">
                  vs prior {report.period.type}
                </span>
              )}
            </div>

            <table className="w-full">
              <tbody>
                {/* Revenue */}
                <SectionRow section={report.revenue} currency={displayCurrency} defaultOpen />
                {report.refunds.items.length > 0 && (
                  <SectionRow section={report.refunds} currency={displayCurrency} />
                )}
                <tr className="border-t border-dash-border bg-dash-bg/50">
                  <td className="py-2.5 pl-4 pr-2 text-sm font-semibold text-dash-text">
                    Net Revenue
                  </td>
                  <td className="py-2.5 pr-4 text-right text-sm font-bold text-dash-success">
                    {fmt(
                      displayCurrency === "USD" ? report.netRevenue.totalUSD : report.netRevenue.totalMXN,
                      displayCurrency
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    {report.priorPeriod && (
                      <Variance
                        current={displayCurrency === "USD" ? report.netRevenue.totalUSD : report.netRevenue.totalMXN}
                        prior={displayCurrency === "USD" ? report.priorPeriod.netRevenuUSD : report.priorPeriod.netRevenueMXN}
                        currency={displayCurrency}
                      />
                    )}
                  </td>
                </tr>

                {/* Spacer */}
                <tr><td colSpan={3} className="h-3" /></tr>

                {/* Expenses */}
                <SectionRow section={report.expenses} currency={displayCurrency} defaultOpen />
                {report.expenseRefunds.items.length > 0 && (
                  <SectionRow section={report.expenseRefunds} currency={displayCurrency} />
                )}
                <tr className="border-t border-dash-border bg-dash-bg/50">
                  <td className="py-2.5 pl-4 pr-2 text-sm font-semibold text-dash-text">
                    Total Expenses
                  </td>
                  <td className="py-2.5 pr-4 text-right text-sm font-bold text-dash-warn">
                    {fmt(
                      displayCurrency === "USD" ? report.netExpenses.totalUSD : report.netExpenses.totalMXN,
                      displayCurrency
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    {report.priorPeriod && (
                      <Variance
                        current={displayCurrency === "USD" ? report.netExpenses.totalUSD : report.netExpenses.totalMXN}
                        prior={displayCurrency === "USD" ? report.priorPeriod.netExpensesUSD : report.priorPeriod.netExpensesMXN}
                        currency={displayCurrency}
                        inverted
                      />
                    )}
                  </td>
                </tr>

                {/* Net Income */}
                <tr><td colSpan={3} className="h-1" /></tr>
                <tr className="border-t-2 border-dash-border-strong">
                  <td className="py-3 pl-4 pr-2">
                    <span className="text-sm font-bold uppercase tracking-wider text-dash-text">
                      Net Income
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className={`text-lg font-bold ${
                      (displayCurrency === "USD" ? report.netIncome.totalUSD : report.netIncome.totalMXN) >= 0
                        ? "text-dash-success"
                        : "text-dash-danger"
                    }`}>
                      {fmt(
                        displayCurrency === "USD" ? report.netIncome.totalUSD : report.netIncome.totalMXN,
                        displayCurrency
                      )}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {report.priorPeriod && (
                      <Variance
                        current={displayCurrency === "USD" ? report.netIncome.totalUSD : report.netIncome.totalMXN}
                        prior={displayCurrency === "USD" ? report.priorPeriod.netIncomeUSD : report.priorPeriod.netIncomeMXN}
                        currency={displayCurrency}
                      />
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cash flow summary */}
          <div className="mt-4 p-4 bg-dash-surface border border-dash-border rounded-lg">
            <h3 className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-2">
              Cash Movement (payments received & sent this period)
            </h3>
            <div className="flex gap-6">
              <div>
                <span className="text-xs text-dash-text-muted">Inbound</span>
                <div className="text-sm font-semibold text-dash-success">
                  {fmt(
                    displayCurrency === "USD" ? report.cashIn.totalUSD : report.cashIn.totalMXN,
                    displayCurrency
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-dash-text-muted">Outbound</span>
                <div className="text-sm font-semibold text-dash-warn">
                  {fmt(
                    displayCurrency === "USD" ? report.cashOut.totalUSD : report.cashOut.totalMXN,
                    displayCurrency
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-dash-text-muted">Net Cash</span>
                <div className={`text-sm font-semibold ${
                  (displayCurrency === "USD"
                    ? report.cashIn.totalUSD - report.cashOut.totalUSD
                    : report.cashIn.totalMXN - report.cashOut.totalMXN) >= 0
                    ? "text-dash-success"
                    : "text-dash-danger"
                }`}>
                  {fmt(
                    displayCurrency === "USD"
                      ? report.cashIn.totalUSD - report.cashOut.totalUSD
                      : report.cashIn.totalMXN - report.cashOut.totalMXN,
                    displayCurrency
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-dash-text-muted mt-3 text-right">
            Generated {new Date(report.generatedAt).toLocaleString()}
          </p>
        </>
      )}

      {!loading && !report && (
        <div className="text-center py-20 text-dash-text-secondary">
          No data available for this period.
        </div>
      )}
    </div>
  );
};

export default PnLPage;
