"use client";

import { DollarSign, AlertTriangle, Factory, TrendingUp } from "lucide-react";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import {
  SAMPLE_PIPELINE,
  type PipelineDeal,
  type DealPayment,
  type PurchaseOrder,
} from "@/app/lib/sample-dashboard-data";
import {
  checkOverduePayments,
  calculateDealFinancials,
} from "@/app/lib/deal-automation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const formatMXN = (value: number) =>
  `$${value.toLocaleString("en-US")} MXN`;

const daysOutstanding = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
};

// ---------------------------------------------------------------------------
// Derived data
// ---------------------------------------------------------------------------

interface OutstandingInvoice {
  payment: DealPayment;
  deal: PipelineDeal;
  daysOut: number;
}

interface UnpaidPO {
  po: PurchaseOrder;
  deal: PipelineDeal;
}

const getOutstandingInvoices = (): OutstandingInvoice[] => {
  const results: OutstandingInvoice[] = [];
  for (const deal of SAMPLE_PIPELINE) {
    for (const payment of deal.payments ?? []) {
      if (payment.status === "sent" || payment.status === "overdue") {
        results.push({
          payment,
          deal,
          daysOut: payment.dueDate ? daysOutstanding(payment.dueDate) : 0,
        });
      }
    }
  }
  return results.sort((a, b) => b.daysOut - a.daysOut);
};

const getUnpaidPOs = (): UnpaidPO[] => {
  const results: UnpaidPO[] = [];
  for (const deal of SAMPLE_PIPELINE) {
    for (const po of deal.purchaseOrders ?? []) {
      if (
        (po.status === "confirmed" || po.status === "in-production") &&
        !po.paymentToMfr
      ) {
        results.push({ po, deal });
      }
    }
  }
  return results;
};

const getCompletedDeals = (): PipelineDeal[] =>
  SAMPLE_PIPELINE.filter((d) => d.stage === "complete");

const getPaidThisMonth = (): number => {
  let total = 0;
  for (const deal of SAMPLE_PIPELINE) {
    for (const payment of deal.payments ?? []) {
      if (payment.status === "paid") {
        total += payment.amount;
      }
    }
  }
  return total;
};

const getMfrPaymentsThisMonth = (): number => {
  let total = 0;
  for (const deal of SAMPLE_PIPELINE) {
    for (const po of deal.purchaseOrders ?? []) {
      if (po.paymentToMfr) {
        total += po.paymentToMfr.amount;
      }
    }
  }
  return total;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FinancePage = () => {
  const outstandingInvoices = getOutstandingInvoices();
  const unpaidPOs = getUnpaidPOs();
  const completedDeals = getCompletedDeals();

  const revenueThisMonth = getPaidThisMonth();
  const outstandingTotal = outstandingInvoices.reduce(
    (sum, inv) => sum + inv.payment.amount,
    0
  );
  const mfrPayablesTotal = unpaidPOs.reduce(
    (sum, item) => sum + item.po.totalAmount,
    0
  );

  const avgMargin =
    completedDeals.length > 0
      ? completedDeals.reduce((sum, d) => {
          const financials = calculateDealFinancials(d);
          return sum + financials.marginPercent;
        }, 0) / completedDeals.length
      : 0;

  const moneyIn = revenueThisMonth;
  const moneyOut = getMfrPaymentsThisMonth();
  const netCashFlow = moneyIn - moneyOut;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Revenue Collected"
          value={formatCurrency(revenueThisMonth)}
          icon={DollarSign}
          accentColor="bg-brand-copper"
        />
        <KPICard
          label="Outstanding Invoices"
          value={formatCurrency(outstandingTotal)}
          icon={AlertTriangle}
          accentColor="bg-amber-500"
        />
        <KPICard
          label="Manufacturer Payables"
          value={formatCurrency(mfrPayablesTotal)}
          icon={Factory}
          accentColor="bg-violet-500"
        />
        <KPICard
          label="Avg Deal Margin"
          value={`${avgMargin.toFixed(1)}%`}
          icon={TrendingUp}
          accentColor="bg-emerald-500"
        />
      </div>

      {/* Section A: Outstanding Invoices */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-dash-text-secondary mb-4">
          Outstanding Invoices
        </h2>
        {outstandingInvoices.length === 0 ? (
          <p className="text-sm text-dash-text-secondary">No outstanding invoices.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border text-left text-xs text-dash-text-secondary uppercase tracking-wider">
                  <th className="pb-3 pr-4">Invoice #</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Deal</th>
                  <th className="pb-3 pr-4 text-right">Amount</th>
                  <th className="pb-3 pr-4">Due Date</th>
                  <th className="pb-3 pr-4 text-right">Days Out</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {outstandingInvoices.map((inv) => {
                  const isOverdue = inv.payment.status === "overdue";
                  return (
                    <tr
                      key={inv.payment.id}
                      className={`border-b border-dash-border/50 ${isOverdue ? "text-red-400" : "text-dash-text"}`}
                    >
                      <td className="py-3 pr-4 font-medium">
                        {inv.payment.invoiceId}
                      </td>
                      <td className="py-3 pr-4">{inv.deal.contactName}</td>
                      <td className="py-3 pr-4 text-dash-text-secondary">
                        {inv.deal.name}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium">
                        {formatMXN(inv.payment.amount)}
                      </td>
                      <td className="py-3 pr-4">
                        {inv.payment.dueDate ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-right">{inv.daysOut}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isOverdue
                              ? "bg-red-500/10 text-red-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {inv.payment.status}
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

      {/* Section B: Manufacturer Payables */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-dash-text-secondary mb-4">
          Manufacturer Payables
        </h2>
        {unpaidPOs.length === 0 ? (
          <p className="text-sm text-dash-text-secondary">No unpaid manufacturer POs.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border text-left text-xs text-dash-text-secondary uppercase tracking-wider">
                  <th className="pb-3 pr-4">PO #</th>
                  <th className="pb-3 pr-4">Brand / Manufacturer</th>
                  <th className="pb-3 pr-4 text-right">Amount</th>
                  <th className="pb-3 pr-4">Deal Reference</th>
                  <th className="pb-3 pr-4">Confirmed Date</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {unpaidPOs.map((item) => (
                  <tr
                    key={item.po.id}
                    className="border-b border-dash-border/50 text-dash-text"
                  >
                    <td className="py-3 pr-4 font-medium">{item.po.id}</td>
                    <td className="py-3 pr-4">
                      {item.po.manufacturerName}
                    </td>
                    <td className="py-3 pr-4 text-right font-medium">
                      {formatMXN(item.po.totalAmount)}
                    </td>
                    <td className="py-3 pr-4 text-dash-text-secondary">
                      {item.deal.name}
                    </td>
                    <td className="py-3 pr-4">
                      {item.po.confirmedDate ?? "—"}
                    </td>
                    <td className="py-3">
                      <button className="px-3 py-1 text-xs bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer">
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section C: Completed Deals */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-dash-text-secondary mb-4">
          Completed Deals
        </h2>
        {completedDeals.length === 0 ? (
          <p className="text-sm text-dash-text-secondary">No completed deals this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border text-left text-xs text-dash-text-secondary uppercase tracking-wider">
                  <th className="pb-3 pr-4">Deal Name</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4 text-right">Revenue</th>
                  <th className="pb-3 pr-4 text-right">Stripe Fees</th>
                  <th className="pb-3 pr-4 text-right">Mfr Costs</th>
                  <th className="pb-3 pr-4 text-right">Shipping</th>
                  <th className="pb-3 pr-4 text-right">Net Margin</th>
                  <th className="pb-3 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {completedDeals.map((deal) => {
                  const fin = calculateDealFinancials(deal);
                  return (
                    <tr
                      key={deal.id}
                      className="border-b border-dash-border/50 text-dash-text"
                    >
                      <td className="py-3 pr-4 font-medium">{deal.name}</td>
                      <td className="py-3 pr-4">{deal.contactName}</td>
                      <td className="py-3 pr-4 text-right">
                        {formatMXN(fin.totalQuoted)}
                      </td>
                      <td className="py-3 pr-4 text-right text-dash-text-secondary">
                        {formatMXN(fin.totalStripeFees)}
                      </td>
                      <td className="py-3 pr-4 text-right text-dash-text-secondary">
                        {formatMXN(fin.totalDealerCost)}
                      </td>
                      <td className="py-3 pr-4 text-right text-dash-text-secondary">
                        {formatMXN(fin.totalShipping)}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold text-brand-copper">
                        {formatMXN(fin.netMargin)}
                      </td>
                      <td className="py-3 text-right font-semibold text-brand-copper">
                        {fin.marginPercent}%
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                {(() => {
                  const totals = completedDeals.reduce(
                    (acc, deal) => {
                      const fin = calculateDealFinancials(deal);
                      return {
                        revenue: acc.revenue + fin.totalQuoted,
                        stripeFees: acc.stripeFees + fin.totalStripeFees,
                        mfrCosts: acc.mfrCosts + fin.totalDealerCost,
                        shipping: acc.shipping + fin.totalShipping,
                        netMargin: acc.netMargin + fin.netMargin,
                      };
                    },
                    { revenue: 0, stripeFees: 0, mfrCosts: 0, shipping: 0, netMargin: 0 }
                  );
                  const totalMarginPct =
                    totals.revenue > 0
                      ? Math.round((totals.netMargin / totals.revenue) * 1000) / 10
                      : 0;
                  return (
                    <tr className="text-dash-text font-semibold border-t-2 border-dash-border">
                      <td className="py-3 pr-4">Totals</td>
                      <td className="py-3 pr-4" />
                      <td className="py-3 pr-4 text-right">
                        {formatMXN(totals.revenue)}
                      </td>
                      <td className="py-3 pr-4 text-right text-dash-text-secondary">
                        {formatMXN(totals.stripeFees)}
                      </td>
                      <td className="py-3 pr-4 text-right text-dash-text-secondary">
                        {formatMXN(totals.mfrCosts)}
                      </td>
                      <td className="py-3 pr-4 text-right text-dash-text-secondary">
                        {formatMXN(totals.shipping)}
                      </td>
                      <td className="py-3 pr-4 text-right text-brand-copper">
                        {formatMXN(totals.netMargin)}
                      </td>
                      <td className="py-3 text-right text-brand-copper">
                        {totalMarginPct}%
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section D: Cash Flow Summary */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-dash-text-secondary mb-4">
          Cash Flow Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-xs text-dash-text-secondary uppercase tracking-wider mb-2">
              Money In
            </p>
            <p className="text-2xl font-bold text-status-won">
              {formatMXN(moneyIn)}
            </p>
            <p className="text-xs text-dash-text-secondary mt-1">
              Customer payments collected
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-dash-text-secondary uppercase tracking-wider mb-2">
              Money Out
            </p>
            <p className="text-2xl font-bold text-status-lost">
              {formatMXN(moneyOut)}
            </p>
            <p className="text-xs text-dash-text-secondary mt-1">
              Manufacturer payments
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-dash-text-secondary uppercase tracking-wider mb-2">
              Net Cash Flow
            </p>
            <p
              className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-brand-copper" : "text-status-lost"}`}
            >
              {formatMXN(netCashFlow)}
            </p>
            <p className="text-xs text-dash-text-secondary mt-1">
              Retained this period
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancePage;
