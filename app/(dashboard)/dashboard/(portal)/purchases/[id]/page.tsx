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
  ShieldAlert,
  CreditCard,
  FilePlus,
} from "lucide-react";
import { toast } from "sonner";
import { useFeatures } from "@/app/lib/use-features";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { AttachmentsPanel } from "@/app/(dashboard)/components/attachments-panel";
import { MessagesPanel } from "@/app/(dashboard)/components/messages-panel";

import { DownloadReportButton } from "@/app/(dashboard)/components/download-report-button";
import { stripHtml } from "@/app/lib/strip-html";

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

interface LinkedSaleOrder {
  id: string;
  name: string;
  state: string;
  partner_id: string;
  amount_total: string;
  currency_id: string;
  date_order: string;
}

interface LinkedPayment {
  id: string;
  name: string;
  state: string;
  paymentType: string;
  partnerName: string;
  amount: number;
  currency: string;
  journalName: string;
  date: string;
  memo: string;
}

interface Data {
  order: PORow;
  rawOrder: RawPO;
  lines: POLine[];
  bills: LinkedBill[];
  linkedSaleOrder: LinkedSaleOrder | null;
  linkedPayments: LinkedPayment[];
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

interface APQueueRow {
  label: string;
  dueDate: string;
  fraction: number;
  blocksSend: boolean;
  source: "auto" | "manual";
  poId: string;
  poName: string;
  vendorName: string;
  vendorKey: string;
  poAmount: number;
  currency: string;
}

const POBlocksSendBanner = ({ poId }: { poId: string }) => {
  const [blocking, setBlocking] = useState<APQueueRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/ap-queue")
      .then((r) => (r.ok ? r.json() : { queue: [] }))
      .then((data: { queue?: APQueueRow[] }) => {
        const rows = (data.queue ?? []).filter(
          (r) => r.poId === poId && r.blocksSend
        );
        setBlocking(rows);
      })
      .catch(() => setBlocking([]))
      .finally(() => setLoaded(true));
  }, [poId]);

  if (!loaded || blocking.length === 0) return null;

  return (
    <div className="mb-6 bg-brand-terracotta/10 border border-brand-terracotta/30 rounded p-4 flex items-start gap-3">
      <ShieldAlert className="w-5 h-5 text-brand-terracotta shrink-0 mt-0.5" />
      <div>
        <div className="text-sm font-medium text-brand-terracotta">
          PO send blocked — payment must clear first
        </div>
        <div className="text-xs text-dash-text-secondary mt-1">
          {blocking.map((r) => r.label).join("; ")}. This vendor&apos;s billing
          trigger requires payment before the PO can be sent.
        </div>
      </div>
    </div>
  );
};

const PurchaseDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const features = useFeatures();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingBill, setCreatingBill] = useState(false);

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

  const refetchData = () => {
    fetch(`/api/dashboard/purchases/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d); })
      .catch(() => {});
  };

  const handleCreateBill = async () => {
    setCreatingBill(true);
    try {
      const res = await fetch(`/api/dashboard/purchases/${id}/create-bill`, {
        method: "POST",
        credentials: "include",
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error || "Failed to create bill");
        return;
      }
      toast.success(`Bill ${body.bill.billName} created (draft)`);
      refetchData();
    } catch {
      toast.error("Failed to create bill");
    } finally {
      setCreatingBill(false);
    }
  };

  const { order, rawOrder, lines, bills, linkedSaleOrder, linkedPayments = [] } = data;

  // Three-way match: roll up qty_ordered vs qty_received vs qty_invoiced
  // across all lines so the header carries an actionable badge.
  const matchTotals = lines.reduce(
    (acc, l) => {
      acc.ordered += num(l.product_qty);
      acc.received += num(l.qty_received);
      acc.invoiced += num(l.qty_invoiced);
      return acc;
    },
    { ordered: 0, received: 0, invoiced: 0 }
  );
  const receivedNotBilled = matchTotals.received - matchTotals.invoiced > 0.001;
  const awaitingReceipt =
    matchTotals.ordered - matchTotals.received > 0.001 &&
    (order.rawState === "purchase" || order.rawState === "done");
  const fullyMatched =
    matchTotals.ordered > 0 &&
    Math.abs(matchTotals.received - matchTotals.ordered) < 0.001 &&
    Math.abs(matchTotals.invoiced - matchTotals.ordered) < 0.001;

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
            {receivedNotBilled && (
              <span
                className="text-xs inline-flex items-center gap-1 px-2 py-1 bg-dash-warn-soft text-dash-warn border border-dash-warn rounded"
                title={`Received ${matchTotals.received.toLocaleString()} units, billed only ${matchTotals.invoiced.toLocaleString()}. Capture the vendor bill for the difference.`}
              >
                <AlertTriangle className="w-3 h-3" />
                Received not billed
              </span>
            )}
            {awaitingReceipt && !receivedNotBilled && (
              <span className="text-xs inline-flex items-center gap-1 px-2 py-1 bg-dash-info-soft text-dash-info border border-dash-info rounded">
                <Truck className="w-3 h-3" />
                Awaiting receipt
              </span>
            )}
            {fullyMatched && (
              <span className="text-xs inline-flex items-center gap-1 px-2 py-1 bg-dash-success-soft text-dash-success border border-dash-success rounded">
                3-way match
              </span>
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
        <div className="shrink-0 flex items-center gap-2">
          {features.ready && features.has("register_payment") &&
            order.rawState !== "draft" && order.rawState !== "cancel" &&
            order.invoiceStatus !== "invoiced" && (
            <button
              type="button"
              onClick={handleCreateBill}
              disabled={creatingBill}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-brand-copper/40 bg-brand-copper/5 text-brand-copper rounded hover:bg-brand-copper/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {creatingBill ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FilePlus className="w-3.5 h-3.5" />
              )}
              Create bill
            </button>
          )}
          <DownloadReportButton
            reportName="purchase.report_purchaseorder"
            recordId={order.id}
            fileName={`${order.name}.pdf`}
          />

        </div>
      </header>

      {(order.rawState === "draft" || order.rawState === "sent") && (
        <POBlocksSendBanner poId={order.id} />
      )}

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

      {/* Source — what triggered this PO */}
      {(rawOrder.origin || linkedSaleOrder) && (
        <section className="mb-6 bg-dash-warn-soft/40 border border-dash-warn/70 rounded p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-dash-warn/80">
            <FileText className="w-3.5 h-3.5" />
            Created for
          </div>
          {linkedSaleOrder ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <Link
                href={`/dashboard/orders/${linkedSaleOrder.id}`}
                className="inline-flex items-center gap-1 font-medium text-dash-text hover:text-dash-accent"
              >
                Sale order {linkedSaleOrder.name}
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="text-dash-text-secondary text-xs">·</span>
              <span className="text-xs text-dash-text-secondary">
                {linkedSaleOrder.partner_id || "—"}
              </span>
              {linkedSaleOrder.date_order && (
                <>
                  <span className="text-dash-text-secondary text-xs">·</span>
                  <span className="text-xs text-dash-text-secondary">
                    {linkedSaleOrder.date_order.slice(0, 10)}
                  </span>
                </>
              )}
              {linkedSaleOrder.amount_total && (
                <>
                  <span className="text-dash-text-secondary text-xs">·</span>
                  <span className="text-xs text-dash-text-secondary">
                    {fmt(num(linkedSaleOrder.amount_total), linkedSaleOrder.currency_id || order.currency)}
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="text-sm">
              <span className="font-mono text-xs text-dash-text">{rawOrder.origin}</span>
              <span className="text-xs text-dash-text-secondary ml-2">
                (not a sale order — could be a manufacturing order, stock picking, or external reference)
              </span>
            </div>
          )}
        </section>
      )}

      {/* Vendor card */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <section className="bg-dash-surface border border-dash-border p-5 rounded">
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
            Vendor
          </h2>
          <div className="space-y-2 text-sm">
            {order.vendorId ? (
              <Link
                href={`/dashboard/vendors/${order.vendorId}`}
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
              {stripHtml(rawOrder.notes)}
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

      {/* Linked payments */}
      {linkedPayments.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payments ({linkedPayments.length})
          </h2>
          <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">State</th>
                  <th className="text-left p-3">Journal</th>
                  <th className="text-right p-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {linkedPayments.map((pay) => (
                  <tr key={pay.id} className="border-b border-dash-border/50">
                    <td className="p-3 font-mono text-xs">
                      <Link href={`/dashboard/payments/${pay.id}`} className="hover:text-dash-accent">
                        {pay.name}
                      </Link>
                    </td>
                    <td className="p-3 text-xs">{(pay.date || "").slice(0, 10)}</td>
                    <td className="p-3">
                      <StatusBadge label={pay.state} variant={stateVariant(pay.state)} />
                    </td>
                    <td className="p-3 text-xs">{pay.journalName || "—"}</td>
                    <td className="p-3 text-right text-xs font-medium">
                      {fmt(pay.amount, pay.currency || order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AttachmentsPanel resModel="purchase.order" resId={order.id} />
      <MessagesPanel mode={{ resModel: "purchase.order", resId: order.id }} />
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
