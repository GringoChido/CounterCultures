"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import {
  CreditCard,
  Search,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  AlertCircle,
} from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import APQueueSection from "@/app/(dashboard)/components/ap/ap-queue-section";

type PaymentTypeFilter = "all" | "inbound" | "outbound";
type PaymentStateFilter = "all" | "draft" | "posted" | "cancel" | "sent";
type SortBy = "date_desc" | "date_asc" | "amount_desc" | "partner";

interface PaymentRow {
  id: string;
  name: string;
  state: string;
  paymentType: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  currency: string;
  journalName: string;
  journalId: string;
  methodName: string;
  date: string;
  memo: string;
  cfdiUuid: string;
  reconciledInvoiceCount: number;
  reconciledBillCount: number;
}

interface JournalSummary {
  name: string;
  journalId: string;
  count: number;
  totalByCurrency: Record<string, number>;
  inboundByCurrency: Record<string, number>;
  outboundByCurrency: Record<string, number>;
  lastDate: string;
}

interface Summary {
  inbound: { count: number; totalByCurrency: Record<string, number> };
  outbound: { count: number; totalByCurrency: Record<string, number> };
  last30Inbound: Record<string, number>;
  last30Outbound: Record<string, number>;
  journals: JournalSummary[];
  totalPayments: number;
  unreconciledCount: number;
}

const fmt = (n: number, cur = "MXN") =>
  !n ? "—" : `$${Math.round(n).toLocaleString()} ${cur}`;

const sumAllCurrencies = (rec: Record<string, number>) =>
  Object.entries(rec)
    .filter(([, v]) => Math.abs(v) > 0.01)
    .map(([cur, amt]) => `$${Math.round(amt).toLocaleString()} ${cur}`)
    .join(" + ") || "—";

const stateVariant = (s: string): BadgeVariant => {
  if (s === "posted") return "success";
  if (s === "draft") return "new";
  if (s === "cancel") return "danger";
  return "info";
};

const columnHelper = createColumnHelper<PaymentRow>();

const columns = [
  columnHelper.accessor("name", {
    header: "Payment #",
    cell: (info) => {
      const r = info.row.original;
      return (
        <Link
          href={`/dashboard/payments/${r.id}`}
          className="font-mono text-xs hover:text-dash-accent"
        >
          {info.getValue()}
        </Link>
      );
    },
  }),
  columnHelper.accessor("date", {
    header: "Date",
    cell: (info) => <span className="text-xs">{info.getValue() || "—"}</span>,
  }),
  columnHelper.accessor("partnerName", {
    header: "Partner",
    cell: (info) => {
      const r = info.row.original;
      return r.partnerId ? (
        <Link
          href={`/dashboard/customers/${r.partnerId}`}
          className="text-sm hover:text-dash-accent line-clamp-1"
        >
          {info.getValue() || "—"}
        </Link>
      ) : (
        <span className="text-xs text-dash-text-secondary">
          {info.getValue() || "—"}
        </span>
      );
    },
  }),
  columnHelper.accessor("paymentType", {
    header: "Type",
    cell: (info) => {
      const v = info.getValue();
      const isIn = v === "inbound";
      return (
        <div
          className={`inline-flex items-center gap-1 text-xs ${
            isIn ? "text-brand-sage" : "text-brand-terracotta"
          }`}
        >
          {isIn ? (
            <ArrowDownLeft className="w-3 h-3" />
          ) : (
            <ArrowUpRight className="w-3 h-3" />
          )}
          {isIn ? "Received" : "Sent"}
        </div>
      );
    },
  }),
  columnHelper.accessor("journalName", {
    header: "Journal",
    cell: (info) => (
      <span className="text-xs text-dash-text-secondary line-clamp-1">
        {info.getValue() || "—"}
      </span>
    ),
  }),
  columnHelper.accessor("state", {
    header: "State",
    cell: (info) => (
      <StatusBadge label={info.getValue()} variant={stateVariant(info.getValue())} />
    ),
  }),
  columnHelper.accessor((r) => r.reconciledInvoiceCount + r.reconciledBillCount, {
    id: "reconciled",
    header: "Applied",
    cell: (info) => {
      const r = info.row.original;
      const n = r.reconciledInvoiceCount + r.reconciledBillCount;
      if (n === 0) {
        return r.state === "posted" ? (
          <span
            className="text-[10px] text-brand-copper inline-flex items-center gap-0.5"
            title="Payment posted but not reconciled to an invoice"
          >
            <AlertCircle className="w-3 h-3" /> unreconciled
          </span>
        ) : (
          <span className="text-xs text-dash-text-secondary">—</span>
        );
      }
      return <span className="text-xs">{n}</span>;
    },
  }),
  columnHelper.accessor("amount", {
    header: "Amount",
    cell: (info) => {
      const r = info.row.original;
      return (
        <span
          className={`text-right block font-medium ${
            r.paymentType === "inbound" ? "text-brand-sage" : "text-brand-terracotta"
          }`}
        >
          {fmt(r.amount, r.currency)}
        </span>
      );
    },
  }),
];

const SummaryHero = ({
  summary,
  onFilterType,
}: {
  summary: Summary;
  onFilterType: (t: PaymentTypeFilter) => void;
}) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
    <button
      onClick={() => onFilterType("inbound")}
      className="bg-dash-surface border border-dash-border p-4 rounded text-left hover:border-dash-accent transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <ArrowDownLeft className="w-4 h-4 text-brand-sage" />
        <span className="text-xs uppercase tracking-wider text-dash-text-secondary">
          Received (all time)
        </span>
      </div>
      <div className="text-lg font-semibold text-dash-text line-clamp-1">
        {sumAllCurrencies(summary.inbound.totalByCurrency)}
      </div>
      <div className="text-[10px] text-dash-text-secondary mt-1">
        {summary.inbound.count} inbound payments
      </div>
    </button>
    <button
      onClick={() => onFilterType("outbound")}
      className="bg-dash-surface border border-dash-border p-4 rounded text-left hover:border-dash-accent transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <ArrowUpRight className="w-4 h-4 text-brand-terracotta" />
        <span className="text-xs uppercase tracking-wider text-dash-text-secondary">
          Sent (all time)
        </span>
      </div>
      <div className="text-lg font-semibold text-dash-text line-clamp-1">
        {sumAllCurrencies(summary.outbound.totalByCurrency)}
      </div>
      <div className="text-[10px] text-dash-text-secondary mt-1">
        {summary.outbound.count} outbound payments
      </div>
    </button>
    <div className="bg-dash-surface border border-dash-border p-4 rounded">
      <div className="flex items-center gap-2 mb-1">
        <Banknote className="w-4 h-4 text-brand-sage" />
        <span className="text-xs uppercase tracking-wider text-dash-text-secondary">
          Last 30 days (in / out)
        </span>
      </div>
      <div className="text-sm font-semibold text-brand-sage line-clamp-1">
        +{sumAllCurrencies(summary.last30Inbound)}
      </div>
      <div className="text-sm text-brand-terracotta line-clamp-1 mt-0.5">
        −{sumAllCurrencies(summary.last30Outbound)}
      </div>
    </div>
    <div className="bg-dash-surface border border-dash-border p-4 rounded">
      <div className="flex items-center gap-2 mb-1">
        <AlertCircle className="w-4 h-4 text-brand-copper" />
        <span className="text-xs uppercase tracking-wider text-dash-text-secondary">
          Unreconciled
        </span>
      </div>
      <div className="text-lg font-semibold text-dash-text">
        {summary.unreconciledCount.toLocaleString()}
      </div>
      <div className="text-[10px] text-dash-text-secondary mt-1">
        Posted payments not applied to invoice/bill
      </div>
    </div>
  </div>
);

const JournalsRow = ({
  journals,
  activeJournalId,
  onPick,
}: {
  journals: JournalSummary[];
  activeJournalId?: string;
  onPick: (id: string | "") => void;
}) => {
  const top = journals.slice(0, 10);
  return (
    <div className="mb-4">
      <div className="text-xs uppercase tracking-wider text-dash-text-secondary mb-2">
        Journals / Bank Accounts
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => onPick("")}
          className={`shrink-0 px-3 py-2 border text-xs rounded transition-colors ${
            !activeJournalId
              ? "bg-dash-accent text-white border-dash-accent"
              : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-accent"
          }`}
        >
          All ({journals.reduce((s, j) => s + j.count, 0)})
        </button>
        {top.map((j) => (
          <button
            key={j.journalId || j.name}
            onClick={() => onPick(j.journalId)}
            className={`shrink-0 px-3 py-2 border text-xs rounded transition-colors text-left ${
              activeJournalId === j.journalId
                ? "bg-dash-accent text-white border-dash-accent"
                : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-accent"
            }`}
          >
            <div className="font-medium text-[11px] line-clamp-1 max-w-[180px]">{j.name}</div>
            <div className="text-[10px] opacity-70 mt-0.5">
              {j.count} · {sumAllCurrencies(j.totalByCurrency).slice(0, 30)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const PaymentsPage = () => {
  const [query, setQuery] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentTypeFilter>("all");
  const [state, setState] = useState<PaymentStateFilter>("all");
  const [journalId, setJournalId] = useState<string>("");
  const [currency, setCurrency] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("date_desc");
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const urlType = sp.get("paymentType");
    const urlJournal = sp.get("journalId");
    if (urlType) setPaymentType(urlType as PaymentTypeFilter);
    if (urlJournal) setJournalId(urlJournal);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        if (query) p.set("q", query);
        p.set("paymentType", paymentType);
        p.set("state", state);
        if (journalId) p.set("journalId", journalId);
        if (currency) p.set("currency", currency);
        p.set("sort", sortBy);
        p.set("limit", "200");
        const res = await fetch(`/api/dashboard/payments?${p.toString()}`);
        const data = await res.json();
        setRows(data.payments ?? []);
        setTotal(data.total ?? 0);
        setSummary(data.summary ?? null);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, paymentType, state, journalId, currency, sortBy]);

  const currencyOptions = useMemo(() => {
    if (!summary) return [];
    const set = new Set<string>();
    for (const j of summary.journals) {
      for (const k of Object.keys(j.totalByCurrency)) set.add(k);
    }
    return [...set].sort();
  }, [summary]);

  const activeFilters = useMemo(() => {
    const out: string[] = [];
    if (paymentType !== "all") out.push(paymentType);
    if (state !== "all") out.push(state);
    if (journalId && summary) {
      const j = summary.journals.find((x) => x.journalId === journalId);
      if (j) out.push(j.name);
    }
    if (currency) out.push(currency);
    return out;
  }, [paymentType, state, journalId, currency, summary]);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-6 h-6 text-dash-accent" />
          <h1 className="font-display text-2xl">Payments</h1>
        </div>
        <p className="text-sm text-dash-text-secondary">
          All inflows and outflows across every bank account, card, and cash journal — from the live Odoo snapshot.
        </p>
      </header>

      {summary && <SummaryHero summary={summary} onFilterType={setPaymentType} />}

      {summary && (
        <JournalsRow
          journals={summary.journals}
          activeJournalId={journalId || undefined}
          onPick={(id) => setJournalId(id)}
        />
      )}

      <APQueueSection />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search payment #, partner, memo, CFDI…"
            className="w-full pl-10 pr-4 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
          )}
        </div>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value as PaymentTypeFilter)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
        >
          <option value="all">All directions</option>
          <option value="inbound">Received (inbound)</option>
          <option value="outbound">Sent (outbound)</option>
        </select>
        <select
          value={state}
          onChange={(e) => setState(e.target.value as PaymentStateFilter)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
        >
          <option value="all">All states</option>
          <option value="posted">Posted</option>
          <option value="draft">Draft</option>
          <option value="cancel">Cancelled</option>
        </select>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
        >
          <option value="">All currencies</option>
          {currencyOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="amount_desc">Largest amount</option>
          <option value="partner">Partner A-Z</option>
        </select>
      </div>

      <div className="mb-2 text-xs text-dash-text-secondary">
        {total.toLocaleString()} payment{total === 1 ? "" : "s"}
        {activeFilters.length > 0 && <> · filtered: {activeFilters.join(", ")}</>}
      </div>

      <div className="bg-dash-surface border border-dash-border rounded">
        <DataTable columns={columns} data={rows} />
      </div>
    </div>
  );
};

export default PaymentsPage;
