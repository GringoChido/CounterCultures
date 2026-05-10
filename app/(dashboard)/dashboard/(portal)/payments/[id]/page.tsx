"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  AlertCircle,
  ExternalLink,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
} from "lucide-react";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { EditPaymentModal } from "@/app/(dashboard)/components/payments/edit-payment-modal";

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
  rawState: string;
}

interface LinkedMove {
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

interface RawPayment {
  [key: string]: string;
  ref: string;
  payment_reference: string;
  l10n_mx_edi_payment_method_id: string;
  l10n_mx_edi_cfdi_uuid: string;
  l10n_mx_edi_cfdi_state: string;
  payment_method_id: string;
  payment_method_line_id: string;
}

interface PaymentDetailData {
  payment: PaymentRow;
  rawPayment: RawPayment;
  invoices: LinkedMove[];
  bills: LinkedMove[];
}

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n: number, cur = "MXN") =>
  !n ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;

const stateVariant = (s: string): BadgeVariant => {
  if (s === "posted") return "success";
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

const PaymentDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [data, setData] = useState<PaymentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/payments/${id}`)
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
          href="/dashboard/payments"
          className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to payments
        </Link>
        <div className="bg-dash-surface border border-dash-border p-6 rounded text-center">
          <AlertCircle className="w-8 h-8 text-brand-terracotta mx-auto mb-2" />
          <p className="text-sm text-dash-text">Payment not found</p>
          <p className="text-xs text-dash-text-secondary mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const { payment, rawPayment, invoices, bills } = data;
  const isInbound = payment.paymentType === "inbound";

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <Link
        href="/dashboard/payments"
        className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to payments
      </Link>

      <header className="mb-6 flex items-start gap-4">
        <div className="p-3 bg-dash-surface border border-dash-border rounded">
          {isInbound ? (
            <ArrowDownLeft className="w-6 h-6 text-brand-sage" />
          ) : (
            <ArrowUpRight className="w-6 h-6 text-brand-terracotta" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-display text-2xl text-dash-text">{payment.name}</h1>
            <StatusBadge label={payment.rawState} variant={stateVariant(payment.rawState)} />
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                isInbound
                  ? "bg-brand-sage/10 text-brand-sage"
                  : "bg-brand-terracotta/10 text-brand-terracotta"
              }`}
            >
              {isInbound ? "Received" : "Sent"}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dash-text-secondary">
            <span>{payment.date}</span>
            <span>{payment.journalName}</span>
            {payment.methodName && <span>{payment.methodName}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className={`font-semibold text-2xl ${
              isInbound ? "text-brand-sage" : "text-brand-terracotta"
            }`}
          >
            {isInbound ? "+" : "−"}
            {fmt(payment.amount, payment.currency)}
          </div>
          {payment.rawState !== "cancel" && (
            <EditPaymentModal
              paymentId={payment.id}
              paymentName={payment.name}
              currentDate={payment.date}
              currentRef={rawPayment.ref || ""}
              currentMemo={payment.memo}
              currentAmount={payment.amount}
              currentCurrency={payment.currency}
              currentJournalId={payment.journalId}
            />
          )}
        </div>
      </header>

      {/* Partner + CFDI */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <section className="bg-dash-surface border border-dash-border p-5 rounded">
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
            Partner
          </h2>
          <div className="space-y-2 text-sm">
            {payment.partnerId ? (
              <Link
                href={`/dashboard/customers/${payment.partnerId}`}
                className="inline-flex items-center gap-1 text-dash-text hover:text-dash-accent font-medium"
              >
                {payment.partnerName || "Unknown"}
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : (
              <div className="text-dash-text">{payment.partnerName || "—"}</div>
            )}
            <DetailRow label="Memo" value={payment.memo} />
            <DetailRow label="Payment ref" value={rawPayment.payment_reference} />
            <DetailRow label="Method" value={payment.methodName} />
          </div>
        </section>

        <section className="bg-dash-surface border border-dash-border p-5 rounded">
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
            CFDI — Fiscal
          </h2>
          {payment.cfdiUuid ? (
            <div className="space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-dash-text-secondary mb-1">
                  Folio Fiscal (UUID)
                </dt>
                <dd>
                  <CopyableUUID uuid={payment.cfdiUuid} />
                </dd>
              </div>
              <DetailRow label="MX payment method" value={rawPayment.l10n_mx_edi_payment_method_id} />
              <DetailRow label="Stamp state" value={rawPayment.l10n_mx_edi_cfdi_state} />
            </div>
          ) : (
            <p className="text-sm text-dash-text-secondary italic">
              No CFDI stamped for this payment.
            </p>
          )}
        </section>
      </div>

      {/* Linked invoices / bills */}
      {(invoices.length > 0 || bills.length > 0) ? (
        <section>
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
            Applied to
          </h2>
          <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">State</th>
                  <th className="text-left p-3">Payment</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-right p-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {[...invoices, ...bills].map((m) => (
                  <tr key={m.id} className="border-b border-dash-border/50">
                    <td className="p-3 font-mono text-xs">
                      <Link
                        href={`/dashboard/invoices/${m.id}`}
                        className="hover:text-dash-accent"
                      >
                        {m.name}
                      </Link>
                    </td>
                    <td className="p-3 text-xs text-dash-text-secondary">
                      {m.move_type === "out_invoice" && "Customer invoice"}
                      {m.move_type === "out_refund" && "Customer credit"}
                      {m.move_type === "in_invoice" && "Vendor bill"}
                      {m.move_type === "in_refund" && "Vendor credit"}
                    </td>
                    <td className="p-3 text-xs">{(m.invoice_date || "").slice(0, 10)}</td>
                    <td className="p-3">
                      <StatusBadge label={m.state} variant={stateVariant(m.state)} />
                    </td>
                    <td className="p-3">
                      {m.payment_state && (
                        <StatusBadge
                          label={m.payment_state.replace("_", " ")}
                          variant={paymentStateVariant(m.payment_state)}
                        />
                      )}
                    </td>
                    <td className="p-3 text-right text-xs">
                      {fmt(num(m.amount_total), m.currency_id || payment.currency)}
                    </td>
                    <td className="p-3 text-right text-xs">
                      {num(m.amount_residual) > 0.01
                        ? fmt(num(m.amount_residual), m.currency_id || payment.currency)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="bg-dash-surface border border-dash-border rounded p-6 text-center">
          <AlertCircle className="w-6 h-6 text-brand-copper mx-auto mb-2" />
          <p className="text-sm text-dash-text">Not applied to any invoice yet</p>
          <p className="text-xs text-dash-text-secondary mt-1">
            This payment is posted but sits unreconciled. It may be an advance, a deposit, or pending manual reconciliation.
          </p>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[130px_1fr] gap-2 items-baseline">
    <dt className="text-[10px] uppercase tracking-wider text-dash-text-secondary">{label}</dt>
    <dd className="text-xs text-dash-text">{value || "—"}</dd>
  </div>
);

export default PaymentDetailPage;
