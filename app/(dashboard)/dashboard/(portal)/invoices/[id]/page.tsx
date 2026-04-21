"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Receipt,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";

interface InvoiceListRow {
  id: string;
  name: string;
  moveType: string;
  state: string;
  partnerId: string;
  partnerName: string;
  date: string;
  dueDate: string;
  total: number;
  residual: number;
  currency: string;
  paymentState: string;
  cfdiUuid: string;
  cfdiPolicy: string;
  cfdiState: string;
  origin: string;
  daysOverdue: number;
  agingBucket: string | null;
  isOverdue: boolean;
  rawState: string;
}

interface InvoiceLine {
  id: string;
  name: string;
  quantity: string;
  price_unit: string;
  discount: string;
  price_subtotal: string;
  price_total: string;
  product_id: string;
  product_id_id: string;
  account_id: string;
  currency_id: string;
}

interface Payment {
  id: string;
  name: string;
  date: string;
  amount: string;
  currency_id: string;
  journal_id: string;
  payment_type: string;
  state: string;
  memo: string;
}

interface RawInvoice {
  [key: string]: string;
  invoice_date: string;
  invoice_date_due: string;
  amount_untaxed: string;
  amount_tax: string;
  amount_total: string;
  partner_id: string;
  partner_id_id: string;
  journal_id: string;
  invoice_user_id: string;
  fiscal_position_id: string;
  payment_reference: string;
  invoice_origin: string;
  l10n_mx_edi_cfdi_uuid: string;
  l10n_mx_edi_payment_policy: string;
  l10n_mx_edi_usage: string;
  l10n_mx_edi_cfdi_state: string;
}

interface InvoiceDetailData {
  invoice: InvoiceListRow;
  rawInvoice: RawInvoice;
  lines: InvoiceLine[];
  payments: Payment[];
}

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (n: number, cur = "MXN") =>
  !n ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;

const stateVariant = (state: string): BadgeVariant => {
  if (state === "posted") return "success";
  if (state === "draft") return "new";
  if (state === "cancel") return "danger";
  return "info";
};

const paymentStateVariant = (ps: string): BadgeVariant => {
  if (ps === "paid") return "success";
  if (ps === "partial") return "warning";
  if (ps === "not_paid") return "danger";
  return "info";
};

const moveTypeLabel = (t: string) => {
  if (t === "out_invoice") return "Customer Invoice";
  if (t === "out_refund") return "Customer Credit Note";
  if (t === "in_invoice") return "Vendor Bill";
  if (t === "in_refund") return "Vendor Credit Note";
  return t;
};

const CopyableUUID = ({ uuid }: { uuid: string }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(uuid);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-dash-text-secondary hover:text-dash-text"
      title="Copy UUID"
    >
      {uuid}
      {copied ? <Check className="w-3 h-3 text-brand-sage" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

const InvoiceDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [data, setData] = useState<InvoiceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/invoices/${id}`)
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
          href="/dashboard/invoices"
          className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to invoices
        </Link>
        <div className="bg-dash-surface border border-dash-border p-6 rounded text-center">
          <AlertCircle className="w-8 h-8 text-brand-terracotta mx-auto mb-2" />
          <p className="text-sm text-dash-text">Invoice not found</p>
          <p className="text-xs text-dash-text-secondary mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const { invoice, rawInvoice, lines, payments } = data;
  const paidAmount = invoice.total - invoice.residual;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <Link
        href="/dashboard/invoices"
        className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to invoices
      </Link>

      {/* Header */}
      <header className="mb-6 flex items-start gap-4">
        <div className="p-3 bg-dash-surface border border-dash-border rounded">
          <Receipt className="w-6 h-6 text-dash-accent" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-display text-2xl text-dash-text">{invoice.name}</h1>
            <StatusBadge label={invoice.rawState} variant={stateVariant(invoice.rawState)} />
            {invoice.paymentState && (
              <StatusBadge
                label={invoice.paymentState.replace("_", " ")}
                variant={paymentStateVariant(invoice.paymentState)}
              />
            )}
            {invoice.isOverdue && (
              <StatusBadge label={`${invoice.daysOverdue}d late`} variant="danger" />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dash-text-secondary">
            <span>{moveTypeLabel(invoice.moveType)}</span>
            <span>Issued {invoice.date || "—"}</span>
            <span>Due {invoice.dueDate || "—"}</span>
            {invoice.origin && <span>Origin {invoice.origin}</span>}
          </div>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Total</div>
          <div className="text-xl font-semibold text-dash-text mt-1">
            {fmt(invoice.total, invoice.currency)}
          </div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Paid</div>
          <div className="text-xl font-semibold text-brand-sage mt-1">
            {fmt(paidAmount, invoice.currency)}
          </div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Balance</div>
          <div
            className={`text-xl font-semibold mt-1 ${
              invoice.residual > 0 ? "text-brand-terracotta" : "text-dash-text"
            }`}
          >
            {invoice.residual > 0 ? fmt(invoice.residual, invoice.currency) : "—"}
          </div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Tax</div>
          <div className="text-xl font-semibold text-dash-text mt-1">
            {fmt(num(rawInvoice.amount_tax), invoice.currency)}
          </div>
        </div>
      </div>

      {/* Partner + CFDI cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <section className="bg-dash-surface border border-dash-border p-5 rounded">
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
            Partner
          </h2>
          <div className="space-y-2 text-sm">
            <Link
              href={`/dashboard/customers/${invoice.partnerId}`}
              className="inline-flex items-center gap-1 text-dash-text hover:text-dash-accent font-medium"
            >
              {invoice.partnerName}
              <ExternalLink className="w-3 h-3" />
            </Link>
            <DetailRow label="Salesperson" value={rawInvoice.invoice_user_id} />
            <DetailRow label="Journal" value={rawInvoice.journal_id} />
            <DetailRow label="Fiscal position" value={rawInvoice.fiscal_position_id} />
            <DetailRow label="Payment ref" value={rawInvoice.payment_reference} />
          </div>
        </section>

        <section className="bg-dash-surface border border-dash-border p-5 rounded">
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
            CFDI — Fiscal
          </h2>
          {invoice.cfdiUuid ? (
            <div className="space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-dash-text-secondary mb-1">
                  Folio Fiscal (UUID)
                </dt>
                <dd>
                  <CopyableUUID uuid={invoice.cfdiUuid} />
                </dd>
              </div>
              <DetailRow label="Payment policy" value={invoice.cfdiPolicy || "—"} />
              <DetailRow label="Uso CFDI" value={rawInvoice.l10n_mx_edi_usage || "—"} />
              <DetailRow label="Stamp state" value={invoice.cfdiState || "—"} />
            </div>
          ) : (
            <p className="text-sm text-dash-text-secondary italic">
              No CFDI stamped for this invoice.
            </p>
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
                <th className="text-right p-3">Qty</th>
                <th className="text-right p-3">Unit price</th>
                <th className="text-right p-3">Disc</th>
                <th className="text-right p-3">Subtotal</th>
                <th className="text-right p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-dash-text-secondary">
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
                    <td className="p-3 text-right text-xs">{num(l.quantity).toLocaleString()}</td>
                    <td className="p-3 text-right text-xs">{fmt(num(l.price_unit), l.currency_id || invoice.currency)}</td>
                    <td className="p-3 text-right text-xs">
                      {num(l.discount) ? `${num(l.discount)}%` : "—"}
                    </td>
                    <td className="p-3 text-right text-xs">{fmt(num(l.price_subtotal), l.currency_id || invoice.currency)}</td>
                    <td className="p-3 text-right text-xs font-medium">
                      {fmt(num(l.price_total), l.currency_id || invoice.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payments */}
      <section>
        <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
          Linked Payments ({payments.length})
        </h2>
        {payments.length === 0 ? (
          <div className="bg-dash-surface border border-dash-border rounded p-6 text-center text-sm text-dash-text-secondary">
            No payments linked to this invoice yet.
          </div>
        ) : (
          <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">State</th>
                  <th className="text-left p-3">Journal</th>
                  <th className="text-left p-3">Memo</th>
                  <th className="text-right p-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-dash-border/50">
                    <td className="p-3 font-mono text-xs">{p.name}</td>
                    <td className="p-3 text-xs">{(p.date || "").slice(0, 10)}</td>
                    <td className="p-3">
                      <StatusBadge label={p.state} variant={stateVariant(p.state)} />
                    </td>
                    <td className="p-3 text-xs">{p.journal_id || "—"}</td>
                    <td className="p-3 text-xs text-dash-text-secondary line-clamp-1">
                      {p.memo || "—"}
                    </td>
                    <td className="p-3 text-right text-xs font-medium">
                      {fmt(num(p.amount), p.currency_id || invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[120px_1fr] gap-2 items-baseline">
    <dt className="text-[10px] uppercase tracking-wider text-dash-text-secondary">{label}</dt>
    <dd className="text-xs text-dash-text">{value || "—"}</dd>
  </div>
);

export default InvoiceDetailPage;
