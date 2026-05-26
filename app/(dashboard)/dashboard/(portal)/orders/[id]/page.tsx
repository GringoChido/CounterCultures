"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Loader2,
  AlertCircle,
  ExternalLink,
  FileText,
  Truck,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { AttachmentsPanel } from "@/app/(dashboard)/components/attachments-panel";
import { MessagesPanel } from "@/app/(dashboard)/components/messages-panel";
import { ConfirmOrderButton } from "@/app/(dashboard)/components/orders/confirm-order-button";
import { StaleQuoteActions } from "@/app/(dashboard)/components/orders/stale-quote-actions";

import { SendQuoteButton } from "@/app/(dashboard)/components/orders/send-quote-button";
import { DownloadReportButton } from "@/app/(dashboard)/components/download-report-button";
import { CompanyBadge, EntityTintedCard } from "@/app/(dashboard)/components/company-badge";
import { OdooEditLink } from "@/app/(dashboard)/components/odoo-link";
import { stripHtml } from "@/app/lib/strip-html";
import { formatDate } from "@/app/lib/format-date";

interface OrderRow {
  id: string;
  name: string;
  state: string;
  partnerId: string;
  partnerName: string;
  salesperson: string;
  pricelist: string;
  paymentTerm: string;
  currency: string;
  dateOrder: string;
  validityDate: string;
  commitmentDate: string;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  invoiceStatus: string;
  linkedInvoiceCount: number;
  daysOpen: number;
  isStale: boolean;
  isPaid: boolean;
  isDelivered: boolean;
  company: string;
  rawState: string;
}

interface OrderLine {
  id: string;
  name: string;
  product_id: string;
  product_id_id: string;
  product_uom_qty: string;
  qty_delivered: string;
  qty_invoiced: string;
  price_unit: string;
  discount: string;
  price_subtotal: string;
  price_total: string;
  currency_id: string;
  sequence: string;
}

interface LinkedInvoice {
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

interface RawOrder {
  [key: string]: string;
  fiscal_position_id: string;
  note: string;
  create_date: string;
  write_date: string;
}

interface LinkedPurchaseOrder {
  id: string;
  name: string;
  state: string;
  partner_id: string;
  date_order: string;
  amount_total: string;
  currency_id: string;
  invoice_status: string;
}

interface OrderDetailData {
  order: OrderRow;
  rawOrder: RawOrder;
  lines: OrderLine[];
  invoices: LinkedInvoice[];
  purchaseOrders: LinkedPurchaseOrder[];
  partnerEmail: string;
  partnerPhone: string;
  partnerLang: string;
}

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (n: number, cur = "MXN") =>
  !n ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;

const stateVariant = (s: string): BadgeVariant => {
  if (s === "sale" || s === "done" || s === "posted") return "success";
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
  if (s === "sent") return "Quote Sent";
  if (s === "sale") return "Confirmed";
  if (s === "done") return "Done";
  if (s === "cancel") return "Cancelled";
  return s;
};

const OrderDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [data, setData] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/orders/${id}`)
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
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to orders
        </Link>
        <div className="bg-dash-surface border border-dash-border p-6 rounded text-center">
          <AlertCircle className="w-8 h-8 text-brand-terracotta mx-auto mb-2" />
          <p className="text-sm text-dash-text">Order not found</p>
          <p className="text-xs text-dash-text-secondary mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const { order, rawOrder, lines, invoices, purchaseOrders, partnerEmail, partnerLang } = data;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </Link>

      {/* Header */}
      <header className="mb-6 flex items-start gap-4">
        <div className="p-3 bg-dash-surface border border-dash-border rounded">
          <ShoppingCart className="w-6 h-6 text-dash-accent" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-display text-2xl text-dash-text">{order.name}</h1>
            <CompanyBadge company={order.company} />
            <StatusBadge label={stateLabel(order.rawState)} variant={stateVariant(order.rawState)} />
            {order.invoiceStatus && order.invoiceStatus !== "no" && (
              <StatusBadge
                label={order.invoiceStatus}
                variant={order.invoiceStatus === "invoiced" ? "success" : "warning"}
              />
            )}
            {order.isPaid && <StatusBadge label="Paid" variant="success" />}
            {order.isDelivered && <StatusBadge label="Delivered" variant="in-progress" />}
            {order.isStale && (
              <StatusBadge label={`stale · ${order.daysOpen}d`} variant="danger" />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dash-text-secondary">
            <span>Date {formatDate(order.dateOrder)}</span>
            {order.validityDate && <span>Validity {formatDate(order.validityDate)}</span>}
            {order.commitmentDate && <span>Commitment {formatDate(order.commitmentDate)}</span>}
            <span>Currency {order.currency}</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-wrap items-center gap-2">
          <OdooEditLink model="sale.order" id={order.id} />
          <Link
            href={`/dashboard/orders/${order.id}/preview`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dash-border bg-dash-surface rounded hover:border-brand-copper hover:text-brand-copper transition-colors text-dash-text-secondary"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview as customer
          </Link>
          <DownloadReportButton
            reportName="sale.report_saleorder"
            recordId={order.id}
            fileName={`${order.name}.pdf`}
          />
          <SendQuoteButton
            orderId={Number(order.id)}
            orderName={order.name}
            orderState={order.rawState}
            partnerName={order.partnerName}
            partnerEmail={partnerEmail}
            partnerLang={partnerLang}
            amountTotal={order.amountTotal}
            currency={order.currency}
          />
          <ConfirmOrderButton
            orderId={Number(order.id)}
            orderName={order.name}
            orderState={order.rawState}
          />

        </div>
      </header>

      <StaleQuoteActions
        orderId={Number(order.id)}
        orderName={order.name}
        partnerName={order.partnerName}
        partnerEmail={partnerEmail}
        partnerLang={partnerLang}
        daysOpen={order.daysOpen}
        amountTotal={order.amountTotal}
        currency={order.currency}
        isStale={order.isStale}
      />


      {/* KPI strip */}
      <EntityTintedCard company={order.company} className="p-4 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Total</div>
            <div className="text-xl font-semibold text-dash-text mt-1">
              {fmt(order.amountTotal, order.currency)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Subtotal</div>
            <div className="text-xl font-semibold text-dash-text mt-1">
              {fmt(order.amountUntaxed, order.currency)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Tax</div>
            <div className="text-xl font-semibold text-dash-text mt-1">
              {fmt(order.amountTax, order.currency)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Line items</div>
            <div className="text-xl font-semibold text-dash-text mt-1">{lines.length}</div>
          </div>
        </div>
      </EntityTintedCard>

      {/* Partner + Commercial */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <section className="bg-dash-surface border border-dash-border p-5 rounded">
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
            Customer
          </h2>
          <div className="space-y-2 text-sm">
            <Link
              href={`/dashboard/customers/${order.partnerId}`}
              className="inline-flex items-center gap-1 text-dash-text hover:text-dash-accent font-medium"
            >
              {order.partnerName}
              <ExternalLink className="w-3 h-3" />
            </Link>
            <DetailRow label="Salesperson" value={order.salesperson} />
            <DetailRow label="Payment terms" value={order.paymentTerm} />
            <DetailRow label="Pricelist" value={order.pricelist} />
            <DetailRow label="Fiscal position" value={rawOrder.fiscal_position_id} />
          </div>
        </section>

        <TermsSection note={rawOrder.note} />
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
                <th className="text-right p-3">Qty</th>
                <th className="text-right p-3">Delivered</th>
                <th className="text-right p-3">Invoiced</th>
                <th className="text-right p-3">Unit</th>
                <th className="text-right p-3">Disc</th>
                <th className="text-right p-3">Subtotal</th>
                <th className="text-right p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-dash-text-secondary">
                    No line items.
                  </td>
                </tr>
              ) : (
                lines.map((l) => {
                  const qty = num(l.product_uom_qty);
                  const inv = num(l.qty_invoiced);
                  const del = num(l.qty_delivered);
                  // Lines that are fully invoiced fade slightly; partial gets
                  // an amber tint; not-yet-invoiced shows the qty in copper.
                  const fullyInvoiced = qty > 0 && inv >= qty - 0.001;
                  const partiallyInvoiced = !fullyInvoiced && inv > 0;
                  const fullyDelivered = qty > 0 && del >= qty - 0.001;
                  return (
                    <tr
                      key={l.id}
                      className={`border-b border-dash-border/50 ${
                        fullyInvoiced ? "opacity-70" : partiallyInvoiced ? "bg-dash-warn-soft/30" : ""
                      }`}
                    >
                      <td className="p-3 text-xs max-w-md">
                        <span className="line-clamp-2">{l.name}</span>
                      </td>
                      <td className="p-3 text-xs text-dash-text-secondary line-clamp-1">
                        {l.product_id || "—"}
                      </td>
                      <td className="p-3 text-right text-xs">{qty.toLocaleString()}</td>
                      <td
                        className={`p-3 text-right text-xs ${
                          fullyDelivered
                            ? "text-brand-sage font-medium"
                            : del > 0
                              ? "text-dash-warn"
                              : "text-dash-text-secondary"
                        }`}
                      >
                        {del.toLocaleString()}
                      </td>
                      <td
                        className={`p-3 text-right text-xs ${
                          fullyInvoiced
                            ? "text-brand-sage font-medium"
                            : partiallyInvoiced
                              ? "text-dash-warn font-medium"
                              : qty > 0
                                ? "text-brand-copper"
                                : "text-dash-text-secondary"
                        }`}
                      >
                        {inv.toLocaleString()}
                        {partiallyInvoiced && (
                          <div className="text-[9px] uppercase tracking-wider text-dash-warn/80">
                            of {qty}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right text-xs">{fmt(num(l.price_unit), l.currency_id || order.currency)}</td>
                      <td className="p-3 text-right text-xs">{num(l.discount) ? `${num(l.discount)}%` : "—"}</td>
                      <td className="p-3 text-right text-xs">{fmt(num(l.price_subtotal), l.currency_id || order.currency)}</td>
                      <td className="p-3 text-right text-xs font-medium">{fmt(num(l.price_total), l.currency_id || order.currency)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Linked Purchase Orders — POs whose origin is this SO's name */}
      <section className="mb-6">
        <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Linked Purchase Orders ({purchaseOrders.length})
        </h2>
        {purchaseOrders.length === 0 ? (
          <div className="bg-dash-surface border border-dash-border rounded p-6 text-center text-sm text-dash-text-secondary">
            No POs created from this order yet. POs created with this order's
            name (<span className="font-mono">{order.name}</span>) in the
            Source Document field will appear here.
          </div>
        ) : (
          <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
                <tr>
                  <th className="text-left p-3">PO #</th>
                  <th className="text-left p-3">Vendor</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Bill status</th>
                  <th className="text-right p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="border-b border-dash-border/50">
                    <td className="p-3 font-mono text-xs">
                      <Link
                        href={`/dashboard/purchases/${po.id}`}
                        className="hover:text-dash-accent inline-flex items-center gap-1"
                      >
                        {po.name}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                    </td>
                    <td className="p-3 text-xs">{po.partner_id || "—"}</td>
                    <td className="p-3 text-xs">{formatDate(po.date_order)}</td>
                    <td className="p-3">
                      <StatusBadge label={po.state} variant={stateVariant(po.state)} />
                    </td>
                    <td className="p-3 text-xs text-dash-text-secondary">
                      {po.invoice_status || "—"}
                    </td>
                    <td className="p-3 text-right text-xs font-medium">
                      {fmt(num(po.amount_total), po.currency_id || order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Linked Invoices */}
      <section>
        <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Linked Invoices ({invoices.length})
        </h2>
        {invoices.length === 0 ? (
          <div className="bg-dash-surface border border-dash-border rounded p-6 text-center text-sm text-dash-text-secondary">
            No invoices generated from this order yet.
          </div>
        ) : (
          <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Payment</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-right p-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-dash-border/50">
                    <td className="p-3 font-mono text-xs">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="hover:text-dash-accent"
                      >
                        {inv.name}
                      </Link>
                    </td>
                    <td className="p-3 text-xs">{formatDate(inv.invoice_date)}</td>
                    <td className="p-3">
                      <StatusBadge label={inv.state} variant={stateVariant(inv.state)} />
                    </td>
                    <td className="p-3">
                      {inv.payment_state && (
                        <StatusBadge
                          label={inv.payment_state.replace("_", " ")}
                          variant={paymentStateVariant(inv.payment_state)}
                        />
                      )}
                    </td>
                    <td className="p-3 text-right text-xs">{fmt(num(inv.amount_total), inv.currency_id || order.currency)}</td>
                    <td className="p-3 text-right text-xs font-medium">
                      {num(inv.amount_residual) > 0.01
                        ? fmt(num(inv.amount_residual), inv.currency_id || order.currency)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AttachmentsPanel resModel="sale.order" resId={order.id} />
      <MessagesPanel mode={{ resModel: "sale.order", resId: order.id }} />
    </div>
  );
};

const TermsSection = ({ note }: { note: string }) => {
  const text = note ? stripHtml(note) : "";
  const isLong = text.length > 300;
  const [expanded, setExpanded] = useState(!isLong);

  return (
    <section className="bg-dash-surface border border-dash-border p-5 rounded">
      <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
        Terms and Conditions
      </h2>
      {text ? (
        <>
          <p className={`text-sm text-dash-text whitespace-pre-wrap ${!expanded ? "line-clamp-4" : ""}`}>
            {text}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-brand-copper hover:text-brand-copper/80 transition-colors cursor-pointer"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show full terms
                </>
              )}
            </button>
          )}
        </>
      ) : (
        <p className="text-sm text-dash-text-secondary italic">No terms on this order.</p>
      )}
    </section>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[130px_1fr] gap-2 items-baseline">
    <dt className="text-[10px] uppercase tracking-wider text-dash-text-secondary">{label}</dt>
    <dd className="text-xs text-dash-text">{value || "—"}</dd>
  </div>
);

export default OrderDetailPage;
