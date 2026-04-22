"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  Loader2,
  AlertCircle,
  ExternalLink,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { AttachmentsPanel } from "@/app/(dashboard)/components/attachments-panel";

interface PORow {
  id: string;
  name: string;
  state: string;
  vendorId: string;
  vendorName: string;
  currency: string;
  dateOrder: string;
  amountTotal: number;
  invoiceStatus: string;
  daysOpen: number;
  isOverdue: boolean;
  rawState: string;
}

interface POLine {
  id: string;
  name: string;
  product_id: string;
  product_qty: string;
  qty_received: string;
  qty_invoiced: string;
  price_unit: string;
  discount: string;
  price_subtotal: string;
  price_total: string;
  date_planned: string;
  sequence: string;
}

interface LinkedBill {
  id: string;
  name: string;
  state: string;
  payment_state: string;
  invoice_date: string;
  amount_total: string;
  amount_residual: string;
  currency_id: string;
  move_type: string;
}

interface RawPO {
  [key: string]: string;
  partner_ref: string;
  origin: string;
  date_approve: string;
  date_planned: string;
  notes: string;
  payment_term_id: string;
  fiscal_position_id: string;
  user_id: string;
  amount_untaxed: string;
  amount_tax: string;
}

interface Data {
  order: PORow;
  rawOrder: RawPO;
  lines: POLine[];
  bills: LinkedBill[];
}

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n: number, cur = "USD") =>
  !n ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;

const stateVariant = (s: string): BadgeVariant => {
  if (s === "purchase" || s === "done" || s === "posted") return "success";
  if (s === "sent") return "info";
  if (s === "draft") return "new";
  if (s === "cancel") return "danger";
  return "info";
};

const paymentStateVariant = (ps: string): BadgeVariant => {
  if (ps === "paid") return "success";
  if (ps === "partial") return "warning";
  if (ps === "not_paid") return "danger";
  return "info";
};

const stateLabel = (s: string) => {
  if (s === "draft") return "Draft";
  if (s === "sent") return "Sent to vendor";
  if (s === "purchase") return "Confirmed";
  if (s === "done") return "Done";
  if (s === "cancel") return "Cancelled";
  return s;
};

const PurchaseDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/purchases/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-dash-accent" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Link
          href="/dashboard/purchases"
          className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to purchase orders
        </Link>
        <div className="bg-dash-surface border border-dash-border p-6 rounded text-center">
          <AlertCircle className="w-8 h-8 text-brand-terracotta mx-auto mb-2" />
          <p className="text-sm text-dash-text">PO not found</p>
          <p className="text-xs text-dash-text-secondary mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const { order, rawOrder, lines, bills } = data;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <Link
        href="/dashboard/purchases"
        className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to purchase orders
      </Link>

      <header className="mb-6 flex items-start gap-4">
        <div className="p-3 bg-dash-surface border border-dash-border rounded">
          <Truck className="w-6 h-6 text-dash-accent" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-display text-2xl text-dash-text">{order.name}</h1>
            <StatusBadge label={stateLabel(order.rawState)} variant={stateVariant(order.rawState)} />
            {order.invoiceStatus && order.invoiceStatus !== "no" && (
              <StatusBadge
                label={order.invoiceStatus === "invoiced" ? "Billed" : order.invoiceStatus}
                variant={order.invoiceStatus === "invoiced" ? "success" : "warning"}
              />
            )}
            {order.isOverdue && (
              <span className="text-xs inline-flex items-center gap-1 px-2 py-1 bg-brand-terracotta/10 text-brand-terracotta rounded">
                <AlertTriangle className="w-3 h-3" />
                Stuck · {order.daysOpen}d
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dash-text-secondary">
            <span>Ordered {order.dateOrder || "—"}</span>
            {rawOrder.date_approve && <span>Approved {rawOrder.date_approve.slice(0, 10)}</span>}
            {rawOrder.date_planned && <span>Expected {rawOrder.date_planned.slice(0, 10)}</span>}
            <span>Currency {order.currency}</span>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Total</div>
          <div className="text-xl font-semibold text-dash-text mt-1">
            {fmt(order.amountTotal, order.currency)}
          </div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Subtotal</div>
          <div className="text-xl font-semibold text-dash-text mt-1">
            {fmt(num(rawOrder.amount_untaxed), order.currency)}
          </div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Tax</div>
          <div className="text-xl font-semibold text-dash-text mt-1">
            {fmt(num(rawOrder.amount_tax), order.currency)}
          </div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Line items</div>
          <div className="text-xl font-semibold text-dash-text mt-1">{lines.length}</div>
        </div>
      </div>

      {/* Vendor card */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <section className="bg-dash-surface border border-dash-border p-5 rounded">
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
            Vendor
          </h2>
          <div className="space-y-2 text-sm">
            {order.vendorId ? (
              <Link
                href={`/dashboard/customers/${order.vendorId}`}
                className="inline-flex items-center gap-1 text-dash-text hover:text-dash-accent font-medium"
              >
                {order.vendorName}
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : (
              <div className="text-dash-text">{order.vendorName || "—"}</div>
            )}
            <DetailRow label="Vendor ref" value={rawOrder.partner_ref} />
            <DetailRow label="Buyer" value={rawOrder.user_id} />
            <DetailRow label="Payment terms" value={rawOrder.payment_term_id} />
            <DetailRow label="Fiscal position" value={rawOrder.fiscal_position_id} />
          </div>
        </section>

        <section className="bg-dash-surface border border-dash-border p-5 rounded">
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
            Notes
          </h2>
          {rawOrder.notes ? (
            <p className="text-sm text-dash-text whitespace-pre-wrap line-clamp-6">
              {rawOrder.notes}
            </p>
          ) : (
            <p className="text-sm text-dash-text-secondary italic">No notes on this PO.</p>
          )}
        </section>
      </div>

      {/* Lines */}
      <section className="mb-6">
        <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
          Line Items ({lines.length})
        </h2>
        <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
              <tr>
                <th className="text-left p-3">Description</th>
                <th className="text-left p-3">Product</th>
                <th className="text-right p-3">Ordered</th>
                <th className="text-right p-3">Received</th>
                <th className="text-right p-3">Billed</th>
                <th className="text-right p-3">Unit</th>
                <th className="text-right p-3">Subtotal</th>
                <th className="text-right p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-dash-text-secondary">
                    No line items.
                  </td>
                </tr>
              ) : (
                lines.map((l) => (
                  <tr key={l.id} className="border-b border-dash-border/50">
                    <td className="p-3 text-xs max-w-md">
                      <span className="line-clamp-2">{l.name}</span>
                    </td>
                    <td className="p-3 text-xs text-dash-text-secondary line-clamp-1">
                      {l.product_id || "—"}
                    </td>
                    <td className="p-3 text-right text-xs">{num(l.product_qty).toLocaleString()}</td>
                    <td className="p-3 text-right text-xs text-dash-text-secondary">{num(l.qty_received).toLocaleString()}</td>
                    <td className="p-3 text-right text-xs text-dash-text-secondary">{num(l.qty_invoiced).toLocaleString()}</td>
                    <td className="p-3 text-right text-xs">{fmt(num(l.price_unit), order.currency)}</td>
                    <td className="p-3 text-right text-xs">{fmt(num(l.price_subtotal), order.currency)}</td>
                    <td className="p-3 text-right text-xs font-medium">{fmt(num(l.price_total), order.currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Linked bills */}
      <section>
        <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Vendor Bills ({bills.length})
        </h2>
        {bills.length === 0 ? (
          <div className="bg-dash-surface border border-dash-border rounded p-6 text-center text-sm text-dash-text-secondary">
            No bills linked to this PO yet.
          </div>
        ) : (
          <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">State</th>
                  <th className="text-left p-3">Payment</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-right p-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id} className="border-b border-dash-border/50">
                    <td className="p-3 font-mono text-xs">
                      <Link
                        href={`/dashboard/invoices/${b.id}`}
                        className="hover:text-dash-accent"
                      >
                        {b.name}
                      </Link>
                    </td>
                    <td className="p-3 text-xs">{(b.invoice_date || "").slice(0, 10)}</td>
                    <td className="p-3">
                      <StatusBadge label={b.state} variant={stateVariant(b.state)} />
                    </td>
                    <td className="p-3">
                      {b.payment_state && (
                        <StatusBadge
                          label={b.payment_state.replace("_", " ")}
                          variant={paymentStateVariant(b.payment_state)}
                        />
                      )}
                    </td>
                    <td className="p-3 text-right text-xs">{fmt(num(b.amount_total), b.currency_id || order.currency)}</td>
                    <td className="p-3 text-right text-xs font-medium">
                      {num(b.amount_residual) > 0.01
                        ? fmt(num(b.amount_residual), b.currency_id || order.currency)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AttachmentsPanel resModel="purchase.order" resId={order.id} />
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[130px_1fr] gap-2 items-baseline">
    <dt className="text-[10px] uppercase tracking-wider text-dash-text-secondary">{label}</dt>
    <dd className="text-xs text-dash-text">{value || "—"}</dd>
  </div>
);

export default PurchaseDetailPage;
