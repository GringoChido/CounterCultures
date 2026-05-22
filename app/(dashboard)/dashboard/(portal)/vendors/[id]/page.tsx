"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { CreditPanel } from "@/app/(dashboard)/components/partner/credit-panel";
import { PartnerHierarchy } from "@/app/(dashboard)/components/partner/partner-hierarchy";
import { AgingBuckets } from "@/app/(dashboard)/components/partner/aging-buckets";
import { BulkPaySelector } from "@/app/(dashboard)/components/partner/bulk-pay-selector";
import { VendorTermsPanel } from "@/app/(dashboard)/components/vendor/vendor-terms-panel";

interface PartnerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  credit: string;
  debit: string;
  credit_limit: string;
  total_invoiced: string;
  vat: string;
  is_company: string;
  parent_id_id: string;
}

interface PORow {
  id: string;
  name: string;
  state: string;
  date_order: string;
  amount_total: string;
  currency_id: string;
  invoice_status: string;
  origin: string;
}

interface InvoiceRow {
  id: string;
  name: string;
  state: string;
  payment_state: string;
  invoice_date: string;
  invoice_date_due: string;
  amount_total: string;
  amount_residual: string;
  currency_id: string;
  move_type: string;
  invoice_origin: string;
}

interface PaymentRow {
  id: string;
  name: string;
  state: string;
  date: string;
  amount: string;
  currency_id: string;
  journal_id: string;
  memo: string;
  reconciled_bill_ids: string;
}

interface Metrics {
  totalBilled: number;
  totalBilledByCurrency: Record<string, number>;
  totalPaid: number;
  totalPaidByCurrency: Record<string, number>;
  openAP: number;
  openAPByCurrency: Record<string, number>;
  billCount: number;
  paidBillCount: number;
  openBillCount: number;
  poCount: number;
  openPoCount: number;
  firstPoDate: string | null;
  lastPoDate: string | null;
  lastPaymentDate: string | null;
  paymentMethodsUsed: string[];
  currencies: string[];
}

interface AgingShape {
  current: Record<string, number>;
  "0-30": Record<string, number>;
  "30-60": Record<string, number>;
  "60-90": Record<string, number>;
  "90+": Record<string, number>;
  totalOpen: Record<string, number>;
}

interface ProfileData {
  partner: PartnerRow;
  metrics: Metrics;
  bills: InvoiceRow[];
  payments: PaymentRow[];
  purchaseOrders: PORow[];
  openAP: InvoiceRow[];
  parent: PartnerRow | null;
  children: PartnerRow[];
  aging: AgingShape;
}

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (n: number, cur = "MXN") =>
  !n ? "—" : `$${Math.round(n).toLocaleString()} ${cur}`;

const fmtMap = (rec: Record<string, number>) => {
  const parts = Object.entries(rec)
    .filter(([, v]) => Math.abs(v) > 0.01)
    .map(([cur, amt]) => `$${Math.round(amt).toLocaleString()} ${cur}`);
  return parts.length === 0 ? "—" : parts.join(" + ");
};

const stateVariant = (s: string): BadgeVariant => {
  if (s === "purchase" || s === "done" || s === "posted") return "success";
  if (s === "draft" || s === "sent") return "info";
  if (s === "cancel") return "danger";
  return "default";
};

const paymentStateVariant = (ps: string): BadgeVariant => {
  if (ps === "paid") return "success";
  if (ps === "partial") return "warning";
  if (ps === "not_paid") return "danger";
  return "info";
};

const VendorDetailPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadVendor = () => {
    fetch(`/api/dashboard/vendors/${id}`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err instanceof Error ? err.message : "load_failed"));
  };

  useEffect(() => {
    loadVendor();
  }, [id]);

  if (error) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <Link
          href="/dashboard/vendors"
          className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to vendors
        </Link>
        <div className="bg-dash-danger-soft border border-dash-danger rounded p-4 text-sm text-dash-danger inline-flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center text-dash-text-secondary">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading vendor…
      </div>
    );
  }

  const { partner, metrics, bills, payments, purchaseOrders, openAP, parent, children, aging } = data;

  // Sort bills + payments + POs newest first for display
  const recentPOs = [...purchaseOrders]
    .sort((a, b) => (b.date_order || "").localeCompare(a.date_order || ""))
    .slice(0, 25);
  const recentBills = [...bills]
    .sort((a, b) => (b.invoice_date || "").localeCompare(a.invoice_date || ""))
    .slice(0, 25);
  const recentPayments = [...payments]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 25);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <Link
        href="/dashboard/vendors"
        className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to vendors
      </Link>

      <header className="mb-6 flex items-start gap-4">
        <div className="p-3 bg-dash-surface border border-dash-border rounded">
          <Building2 className="w-6 h-6 text-dash-accent" />
        </div>
        <div>
          <h1 className="font-display text-2xl text-dash-text">{partner.name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dash-text-secondary mt-1">
            {partner.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {partner.email}
              </span>
            )}
            {partner.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {partner.phone}
              </span>
            )}
            {metrics.lastPoDate && (
              <span>Last PO {metrics.lastPoDate.slice(0, 10)}</span>
            )}
            {metrics.lastPaymentDate && (
              <span>Last payment {metrics.lastPaymentDate.slice(0, 10)}</span>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">All-time billed</div>
          <div className="text-base font-semibold text-dash-text mt-1">{fmtMap(metrics.totalBilledByCurrency)}</div>
          <div className="text-[11px] text-dash-text-secondary mt-0.5">{metrics.billCount} bills</div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">All-time paid</div>
          <div className="text-base font-semibold text-brand-sage mt-1">{fmtMap(metrics.totalPaidByCurrency)}</div>
          <div className="text-[11px] text-dash-text-secondary mt-0.5">{payments.length} payments</div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Open AP</div>
          <div className="text-base font-semibold text-brand-terracotta mt-1">{fmtMap(metrics.openAPByCurrency)}</div>
          <div className="text-[11px] text-dash-text-secondary mt-0.5">{metrics.openBillCount} open bills</div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">POs</div>
          <div className="text-xl font-semibold text-dash-text mt-1">{metrics.poCount}</div>
          <div className="text-[11px] text-dash-text-secondary mt-0.5">
            {metrics.openPoCount} open
          </div>
        </div>
      </div>

      {/* Hierarchy — surfaced before activity tables when present */}
      {(parent || children.length > 0) && (
        <div className="mb-6">
          <PartnerHierarchy mode="vendor" parent={parent} children={children} />
        </div>
      )}

      {/* Credit terms — looked up from Vendors sheet (vendor-terms.ts) */}
      <div className="mb-6">
        <VendorTermsPanel partnerName={partner.name} />
      </div>

      {/* AP aging — only renders when there's any open balance */}
      <div className="mb-6">
        <AgingBuckets aging={aging} mode="vendor" />
      </div>

      {/* Open AP — bulk-pay selector with aging order + running balance */}
      {openAP.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
            Open AP ({openAP.length})
          </h2>
          <div className="bg-dash-surface border border-dash-border rounded p-4">
            <BulkPaySelector
              bills={openAP}
              vendorName={partner.name}
              onPaymentRegistered={loadVendor}
            />
          </div>
        </section>
      )}

      {/* Recent POs */}
      <section className="mb-6">
        <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
          Recent Purchase Orders ({purchaseOrders.length})
        </h2>
        {purchaseOrders.length === 0 ? (
          <div className="bg-dash-surface border border-dash-border rounded p-6 text-center text-sm text-dash-text-secondary">
            No purchase orders.
          </div>
        ) : (
          <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
                <tr>
                  <th className="text-left p-3">PO #</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">For SO</th>
                  <th className="text-left p-3">Bill status</th>
                  <th className="text-right p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentPOs.map((p) => (
                  <tr key={p.id} className="border-b border-dash-border/50">
                    <td className="p-3 font-mono text-xs">
                      <Link href={`/dashboard/purchases/${p.id}`} className="hover:text-dash-accent inline-flex items-center gap-1">
                        {p.name}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                    </td>
                    <td className="p-3 text-xs">{(p.date_order || "").slice(0, 10) || "—"}</td>
                    <td className="p-3">
                      <StatusBadge label={p.state} variant={stateVariant(p.state)} />
                    </td>
                    <td className="p-3 text-xs text-dash-text-secondary font-mono">{p.origin || "—"}</td>
                    <td className="p-3 text-xs text-dash-text-secondary">{p.invoice_status || "—"}</td>
                    <td className="p-3 text-right text-xs font-medium">{fmt(num(p.amount_total), p.currency_id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {purchaseOrders.length > 25 && (
              <div className="p-2 text-center text-[11px] text-dash-text-secondary">
                Showing 25 most recent of {purchaseOrders.length}.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Recent payments */}
      <section className="mb-6">
        <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
          Recent Payments to {partner.name} ({payments.length})
        </h2>
        {payments.length === 0 ? (
          <div className="bg-dash-surface border border-dash-border rounded p-6 text-center text-sm text-dash-text-secondary">
            No outbound payments to this vendor yet.
          </div>
        ) : (
          <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
                <tr>
                  <th className="text-left p-3">Payment #</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Journal</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Memo</th>
                  <th className="text-right p-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((pay) => (
                  <tr key={pay.id} className="border-b border-dash-border/50">
                    <td className="p-3 font-mono text-xs">
                      <Link href={`/dashboard/payments/${pay.id}`} className="hover:text-dash-accent">
                        {pay.name}
                      </Link>
                    </td>
                    <td className="p-3 text-xs">{(pay.date || "").slice(0, 10) || "—"}</td>
                    <td className="p-3 text-xs text-dash-text-secondary">{pay.journal_id || "—"}</td>
                    <td className="p-3">
                      <StatusBadge label={pay.state} variant={paymentStateVariant(pay.state)} />
                    </td>
                    <td className="p-3 text-xs text-dash-text-secondary line-clamp-1">{pay.memo || "—"}</td>
                    <td className="p-3 text-right text-xs font-medium">{fmt(num(pay.amount), pay.currency_id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length > 25 && (
              <div className="p-2 text-center text-[11px] text-dash-text-secondary">
                Showing 25 most recent of {payments.length}.
              </div>
            )}
          </div>
        )}
      </section>

      {/* All bills */}
      {bills.length > 0 && (
        <section>
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
            All Vendor Bills ({bills.length})
          </h2>
          <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
                <tr>
                  <th className="text-left p-3">Bill #</th>
                  <th className="text-left p-3">Issued</th>
                  <th className="text-left p-3">PO ref</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Payment</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-right p-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map((b) => (
                  <tr key={b.id} className="border-b border-dash-border/50">
                    <td className="p-3 font-mono text-xs">
                      <Link href={`/dashboard/invoices/${b.id}`} className="hover:text-dash-accent">
                        {b.name}
                      </Link>
                    </td>
                    <td className="p-3 text-xs">{(b.invoice_date || "").slice(0, 10) || "—"}</td>
                    <td className="p-3 text-xs text-dash-text-secondary">{b.invoice_origin || "—"}</td>
                    <td className="p-3">
                      <StatusBadge label={b.state} variant={stateVariant(b.state)} />
                    </td>
                    <td className="p-3">
                      {b.payment_state && (
                        <StatusBadge label={b.payment_state.replace("_", " ")} variant={paymentStateVariant(b.payment_state)} />
                      )}
                    </td>
                    <td className="p-3 text-right text-xs">{fmt(num(b.amount_total), b.currency_id)}</td>
                    <td className="p-3 text-right text-xs font-medium">
                      {num(b.amount_residual) > 0.01 ? fmt(num(b.amount_residual), b.currency_id) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bills.length > 25 && (
              <div className="p-2 text-center text-[11px] text-dash-text-secondary">
                Showing 25 most recent of {bills.length}.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default VendorDetailPage;
