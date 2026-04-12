"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  FileCheck,
  Loader2,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";

// ---------------------------------------------------------------------------
// Types (matching the API response shape from Deal_Payments sheet)
// ---------------------------------------------------------------------------

interface DealPayment {
  Payment_ID: string;
  Deal_ID: string;
  Type: string;
  Invoice_ID: string;
  Stripe_Invoice_ID: string;
  Stripe_Payment_ID: string;
  Amount: string;
  Currency: string;
  Stripe_Fees: string;
  Net_Received: string;
  Status: string;
  Due_Date: string;
  Paid_Date: string;
  Installment_Num: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatAmount = (value: number, currency: string) => {
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted} ${currency}`;
};

const parseNum = (val: string): number => {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

const daysOutstanding = (dueDate: string): number => {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date();
  return Math.max(
    0,
    Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  );
};

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: typeof CheckCircle2 }> = {
  paid: { label: "Paid", bg: "bg-green-500/10", text: "text-green-400", icon: CheckCircle2 },
  sent: { label: "Sent", bg: "bg-blue-500/10", text: "text-blue-400", icon: Clock },
  overdue: { label: "Overdue", bg: "bg-red-500/10", text: "text-red-400", icon: AlertTriangle },
  draft: { label: "Draft", bg: "bg-gray-500/10", text: "text-gray-400", icon: Clock },
  void: { label: "Void", bg: "bg-gray-500/10", text: "text-gray-500", icon: XCircle },
  refunded: { label: "Refunded", bg: "bg-amber-500/10", text: "text-amber-400", icon: ArrowDownCircle },
};

const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
  deposit: { label: "Deposit", bg: "bg-cyan-500/10", text: "text-cyan-400" },
  installment: { label: "Installment", bg: "bg-violet-500/10", text: "text-violet-400" },
  balance: { label: "Balance", bg: "bg-amber-500/10", text: "text-amber-400" },
  full: { label: "Full Payment", bg: "bg-brand-copper/10", text: "text-brand-copper" },
  refund: { label: "Refund", bg: "bg-red-500/10", text: "text-red-400" },
};

type FilterKey = "all" | "paid" | "outstanding" | "overdue";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FinancePage = () => {
  const [payments, setPayments] = useState<DealPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch("/api/dashboard/deal-payments");
        if (!res.ok) throw new Error("Failed to fetch payments");
        const data = await res.json();
        setPayments(data.payments ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  // ── Derived data ──────────────────────────────────────────────────

  const paidPayments = payments.filter((p) => p.Status?.toLowerCase() === "paid");
  const outstandingPayments = payments.filter(
    (p) => p.Status?.toLowerCase() === "sent" || p.Status?.toLowerCase() === "overdue"
  );
  const overduePayments = payments.filter((p) => p.Status?.toLowerCase() === "overdue");

  const totalCollected = paidPayments.reduce((s, p) => s + parseNum(p.Amount), 0);
  const totalOutstanding = outstandingPayments.reduce((s, p) => s + parseNum(p.Amount), 0);
  const totalStripeFees = paidPayments.reduce((s, p) => s + parseNum(p.Stripe_Fees), 0);
  const totalNetReceived = paidPayments.reduce((s, p) => s + parseNum(p.Net_Received || p.Amount), 0);

  const filteredPayments = payments.filter((p) => {
    const status = p.Status?.toLowerCase();
    switch (filter) {
      case "paid":
        return status === "paid";
      case "outstanding":
        return status === "sent" || status === "overdue";
      case "overdue":
        return status === "overdue";
      default:
        return true;
    }
  });

  // Determine primary currency from data
  const primaryCurrency = payments.length > 0
    ? (payments[0].Currency || "MXN").toUpperCase()
    : "MXN";

  // ── Loading state ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand-copper animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Finance</h2>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Finance</h2>
          <p className="text-sm text-dash-text-secondary mt-1">
            {payments.length} payment records from CRM
          </p>
        </div>
        <Link
          href="/dashboard/customs"
          className="flex items-center gap-1.5 text-xs text-brand-copper hover:text-brand-copper/80 transition-colors"
        >
          <FileCheck className="w-3.5 h-3.5" />
          View Customs
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Collected"
          value={formatCurrency(totalCollected)}
          icon={DollarSign}
          accentColor="bg-brand-copper"
        />
        <KPICard
          label="Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={AlertTriangle}
          accentColor="bg-amber-500"
        />
        <KPICard
          label="Stripe Fees"
          value={formatCurrency(totalStripeFees)}
          icon={CreditCard}
          accentColor="bg-violet-500"
        />
        <KPICard
          label="Net Received"
          value={formatCurrency(totalNetReceived)}
          icon={TrendingUp}
          accentColor="bg-emerald-500"
        />
      </div>

      {/* Cash Flow Summary */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-dash-text-secondary mb-4">
          Cash Flow Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <ArrowDownCircle className="w-6 h-6 text-status-won mx-auto mb-2" />
            <p className="text-xs text-dash-text-secondary uppercase tracking-wider mb-1">
              Money In
            </p>
            <p className="text-2xl font-bold text-status-won">
              {formatAmount(totalCollected, primaryCurrency)}
            </p>
            <p className="text-xs text-dash-text-secondary mt-1">
              {paidPayments.length} paid invoices
            </p>
          </div>
          <div className="text-center">
            <ArrowUpCircle className="w-6 h-6 text-violet-400 mx-auto mb-2" />
            <p className="text-xs text-dash-text-secondary uppercase tracking-wider mb-1">
              Stripe Fees
            </p>
            <p className="text-2xl font-bold text-violet-400">
              {formatAmount(totalStripeFees, primaryCurrency)}
            </p>
            <p className="text-xs text-dash-text-secondary mt-1">
              {totalCollected > 0
                ? `${((totalStripeFees / totalCollected) * 100).toFixed(1)}% effective rate`
                : "No fees yet"}
            </p>
          </div>
          <div className="text-center">
            <DollarSign className="w-6 h-6 text-brand-copper mx-auto mb-2" />
            <p className="text-xs text-dash-text-secondary uppercase tracking-wider mb-1">
              Net After Fees
            </p>
            <p className="text-2xl font-bold text-brand-copper">
              {formatAmount(totalNetReceived, primaryCurrency)}
            </p>
            <p className="text-xs text-dash-text-secondary mt-1">
              Deposited to bank
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(
          [
            { key: "all", label: `All (${payments.length})` },
            { key: "paid", label: `Paid (${paidPayments.length})` },
            { key: "outstanding", label: `Outstanding (${outstandingPayments.length})` },
            { key: "overdue", label: `Overdue (${overduePayments.length})` },
          ] as { key: FilterKey; label: string }[]
        ).map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filter === btn.key
                ? "bg-brand-copper text-white"
                : "bg-dash-surface border border-dash-border text-dash-text-secondary hover:text-dash-text hover:border-brand-copper/30"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div className="bg-dash-surface rounded-xl border border-dash-border">
        <div className="p-5 border-b border-dash-border">
          <h3 className="text-sm font-semibold text-dash-text">
            Payment Records
          </h3>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="py-12 text-center">
            <DollarSign className="w-10 h-10 text-dash-text-secondary/30 mx-auto mb-2" />
            <p className="text-sm text-dash-text-secondary">
              No payments match this filter
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border text-left text-xs text-dash-text-secondary uppercase tracking-wider">
                  <th className="px-5 pb-3 pt-4">Payment ID</th>
                  <th className="pb-3 pt-4">Type</th>
                  <th className="pb-3 pt-4">Invoice</th>
                  <th className="pb-3 pt-4">Deal</th>
                  <th className="pb-3 pt-4 text-right">Amount</th>
                  <th className="pb-3 pt-4 text-right">Fees</th>
                  <th className="pb-3 pt-4 text-right">Net</th>
                  <th className="pb-3 pt-4">Due Date</th>
                  <th className="pb-3 pt-4">Paid Date</th>
                  <th className="pb-3 pt-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const status = p.Status?.toLowerCase() ?? "draft";
                  const sCfg = statusConfig[status] ?? statusConfig.draft;
                  const tCfg = typeConfig[p.Type?.toLowerCase()] ?? {
                    label: p.Type || "—",
                    bg: "bg-gray-500/10",
                    text: "text-gray-400",
                  };
                  const amount = parseNum(p.Amount);
                  const fees = parseNum(p.Stripe_Fees);
                  const net = parseNum(p.Net_Received || p.Amount);
                  const currency = (p.Currency || "MXN").toUpperCase();
                  const isOverdue = status === "overdue" || (status === "sent" && p.Due_Date && daysOutstanding(p.Due_Date) > 0);

                  return (
                    <tr
                      key={p.Payment_ID}
                      className={`border-b border-dash-border/50 hover:bg-dash-bg/50 transition-colors ${
                        isOverdue ? "text-red-400" : "text-dash-text"
                      }`}
                    >
                      <td className="px-5 py-3 font-medium font-mono text-xs">
                        {p.Payment_ID}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${tCfg.bg} ${tCfg.text}`}
                        >
                          {tCfg.label}
                        </span>
                      </td>
                      <td className="py-3 text-dash-text-secondary text-xs">
                        {p.Invoice_ID || "—"}
                      </td>
                      <td className="py-3 text-dash-text-secondary text-xs">
                        {p.Deal_ID || "—"}
                      </td>
                      <td className="py-3 text-right font-medium">
                        ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        <span className="text-[10px] text-dash-text-secondary ml-1">
                          {currency}
                        </span>
                      </td>
                      <td className="py-3 text-right text-dash-text-secondary">
                        {fees > 0
                          ? `$${fees.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="py-3 text-right font-medium text-brand-copper">
                        {net > 0
                          ? `$${net.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="py-3 text-xs">
                        {p.Due_Date || "—"}
                        {isOverdue && p.Due_Date && (
                          <span className="block text-[10px] text-red-400">
                            {daysOutstanding(p.Due_Date)}d overdue
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-xs">
                        {p.Paid_Date || "—"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${sCfg.bg} ${sCfg.text}`}
                        >
                          {sCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancePage;
