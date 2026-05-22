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
  Send,
  MessageCircle,
  Mail,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { AttachmentsPanel } from "@/app/(dashboard)/components/attachments-panel";
import { MessagesPanel } from "@/app/(dashboard)/components/messages-panel";
import { MarkPaidButton } from "@/app/(dashboard)/components/payments/mark-paid-button";
import { PaymentLinkButton } from "@/app/(dashboard)/components/payments/payment-link-button";
import { InvoiceWorkflowPanel } from "@/app/(dashboard)/components/cfdi/invoice-workflow-panel";

import { DownloadReportButton } from "@/app/(dashboard)/components/download-report-button";
import { CompanyBadge, EntityTintedCard } from "@/app/(dashboard)/components/company-badge";

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
  company: string;
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

interface PartnerLite {
  id: string;
  name: string;
  vat: string;
  l10n_mx_edi_fiscal_regime: string;
  l10n_mx_edi_usage: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state_id: string;
  zip: string;
  country_id: string;
  lang: string;
}

interface InvoiceDetailData {
  invoice: InvoiceListRow;
  rawInvoice: RawInvoice;
  lines: InvoiceLine[];
  payments: Payment[];
  partner: PartnerLite | null;
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

// V3 S11: bilingual payment reminder templates. Each template returns a
// (subject, body) pair filled with the invoice metadata. Rendered in the
// reminder bar below the KPI strip on overdue/unpaid invoices.
type ReminderTemplate = {
  id: string;
  label: string;
  subject: (ctx: ReminderContext) => string;
  body: (ctx: ReminderContext) => string;
};

type ReminderContext = {
  invoiceName: string;
  partnerName: string;
  amount: string;
  dueDate: string;
  daysOverdue: number;
};

const REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    id: "soft-es",
    label: "Recordatorio suave (ES)",
    subject: ({ invoiceName }) => `Recordatorio de pago — ${invoiceName}`,
    body: ({ partnerName, invoiceName, amount, dueDate }) =>
      `Hola ${partnerName},\n\nTe escribimos como recordatorio amistoso sobre la factura ${invoiceName} por ${amount}, con fecha de vencimiento ${dueDate}. Si ya realizaste el pago, por favor ignora este mensaje. Si necesitas el enlace de pago o la ficha bancaria, con gusto te lo enviamos.\n\nGracias,\nCounter Cultures`,
  },
  {
    id: "soft-en",
    label: "Soft reminder (EN)",
    subject: ({ invoiceName }) => `Friendly payment reminder — ${invoiceName}`,
    body: ({ partnerName, invoiceName, amount, dueDate }) =>
      `Hi ${partnerName},\n\nJust a friendly reminder that invoice ${invoiceName} for ${amount} was due on ${dueDate}. If payment is already on its way, please disregard. Happy to re-send the Stripe link or bank details — just let me know.\n\nThanks,\nCounter Cultures`,
  },
  {
    id: "firm-es",
    label: "Vencido (ES)",
    subject: ({ invoiceName, daysOverdue }) =>
      `Factura ${invoiceName} vencida (${daysOverdue} días)`,
    body: ({ partnerName, invoiceName, amount, dueDate, daysOverdue }) =>
      `Hola ${partnerName},\n\nLa factura ${invoiceName} por ${amount} venció el ${dueDate} (${daysOverdue} días vencida). Por favor indícanos la fecha estimada de pago o, si hay alguna incidencia, ponte en contacto directamente. Queremos resolverlo cuanto antes.\n\nSaludos,\nCounter Cultures`,
  },
  {
    id: "firm-en",
    label: "Overdue (EN)",
    subject: ({ invoiceName, daysOverdue }) =>
      `Invoice ${invoiceName} overdue (${daysOverdue} days)`,
    body: ({ partnerName, invoiceName, amount, dueDate, daysOverdue }) =>
      `Hi ${partnerName},\n\nInvoice ${invoiceName} for ${amount} was due on ${dueDate} and is now ${daysOverdue} days overdue. Can you confirm when we can expect payment, or flag if there's any issue we should resolve first?\n\nThanks,\nCounter Cultures`,
  },
];

const ReminderBar = ({ ctx }: { ctx: ReminderContext }) => {
  const [tplId, setTplId] = useState(REMINDER_TEMPLATES[0].id);
  const tpl = REMINDER_TEMPLATES.find((t) => t.id === tplId) ?? REMINDER_TEMPLATES[0];
  const subject = tpl.subject(ctx);
  const body = tpl.body(ctx);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      toast.success("Reminder copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(body)}`;

  return (
    <section className="bg-dash-warn-soft border border-dash-warn rounded p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-dash-warn" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dash-warn">
          Payment reminder
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-dash-warn">
          Template
          <select
            value={tplId}
            onChange={(e) => setTplId(e.target.value)}
            className="ml-2 text-xs bg-dash-surface border border-dash-warn rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-dash-warn"
          >
            {REMINDER_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-dash-warn bg-dash-surface rounded hover:border-dash-warn transition-colors cursor-pointer text-dash-warn"
          >
            <Copy className="w-3 h-3" />
            Copy
          </button>
          <a
            href={mailto}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-dash-warn bg-dash-surface rounded hover:border-dash-warn transition-colors text-dash-warn"
          >
            <Mail className="w-3 h-3" />
            Email
          </a>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-dash-success bg-dash-surface rounded hover:border-dash-success transition-colors text-dash-success"
          >
            <MessageCircle className="w-3 h-3" />
            WhatsApp
          </a>
        </div>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-[11px] text-dash-warn/80 hover:text-dash-warn">
          Preview
        </summary>
        <div className="mt-2 bg-dash-surface rounded border border-dash-warn p-3 text-xs text-dash-text whitespace-pre-wrap">
          <p className="font-medium mb-2">{subject}</p>
          {body}
        </div>
      </details>
    </section>
  );
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

// ---------------------------------------------------------------------------
// Shipping scenario picker (vendor bills only)
// ---------------------------------------------------------------------------

const SCENARIOS = [
  { value: "", label: "Not set", labelEs: "Sin asignar" },
  { value: "direct_ship", label: "Direct ship", labelEs: "Envío directo" },
  { value: "warehouse", label: "Warehouse (SMA)", labelEs: "Almacén (SMA)" },
  { value: "consolidated", label: "Consolidated", labelEs: "Consolidado" },
  { value: "drop_ship", label: "Drop ship (broker)", labelEs: "Drop ship (agente)" },
];

const ShippingScenarioPicker = ({ invoiceId }: { invoiceId: string }) => {
  const [scenario, setScenario] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifyingUps, setNotifyingUps] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard/invoices/${invoiceId}/tags`)
      .then((r) => r.ok ? r.json() : { tags: {} })
      .then((data: { tags: Record<string, string> }) => {
        setScenario(data.tags.shipping_scenario ?? "");
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [invoiceId]);

  const handleChange = async (val: string) => {
    setScenario(val);
    setSaving(true);
    try {
      await fetch(`/api/dashboard/invoices/${invoiceId}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagType: "shipping_scenario", tagValue: val }),
      });
    } catch {
      toast.error("Failed to save shipping scenario");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  const current = SCENARIOS.find((s) => s.value === scenario) ?? SCENARIOS[0];

  return (
    <div className="mb-6 flex items-center gap-3">
      <Truck className="w-4 h-4 text-dash-text-secondary" />
      <span className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
        Shipping / Envío
      </span>
      <div className="flex gap-1">
        {SCENARIOS.filter((s) => s.value).map((s) => (
          <button
            key={s.value}
            onClick={() => handleChange(scenario === s.value ? "" : s.value)}
            disabled={saving}
            className={`px-2.5 py-1 text-[11px] rounded border transition-colors cursor-pointer ${
              scenario === s.value
                ? "bg-brand-sage/10 border-brand-sage/40 text-brand-sage font-medium"
                : "bg-dash-surface border-dash-border text-dash-text-secondary hover:border-dash-accent"
            }`}
            title={s.labelEs}
          >
            {s.label}
          </button>
        ))}
      </div>
      {saving && <Loader2 className="w-3 h-3 animate-spin text-dash-text-secondary" />}
      {scenario === "direct_ship" && (
        <button
          type="button"
          disabled={notifyingUps}
          onClick={async () => {
            if (!confirm("Send shipment notification to UPS agents?")) return;
            setNotifyingUps(true);
            try {
              const r = await fetch(`/api/dashboard/invoices/${invoiceId}/notify-ups`, {
                method: "POST",
              });
              const d = await r.json().catch(() => ({}));
              if (!r.ok) {
                toast.error(d.error ?? `HTTP ${r.status}`);
                return;
              }
              toast.success(
                d.emailStatus === "sent"
                  ? "UPS agents notified"
                  : "Status logged (email not configured)"
              );
            } catch {
              toast.error("Failed to notify UPS agents");
            } finally {
              setNotifyingUps(false);
            }
          }}
          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-brand-copper text-white hover:bg-brand-copper/90 disabled:opacity-50"
        >
          {notifyingUps ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
          Notify UPS
        </button>
      )}
    </div>
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

  const { invoice, rawInvoice, lines, payments, partner } = data;
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
            <CompanyBadge company={invoice.company} />
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
            {invoice.origin && (
              <Link
                href={`/dashboard/orders?q=${encodeURIComponent(invoice.origin)}`}
                className="hover:text-dash-accent transition-colors"
              >
                Origin {invoice.origin} →
              </Link>
            )}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <DownloadReportButton
            reportName={invoice.moveType === "out_invoice" ? "account.report_invoice" : "account.report_invoice"}
            recordId={invoice.id}
            fileName={`${invoice.name}.pdf`}
          />

        </div>
      </header>

      {/* KPI strip */}
      <EntityTintedCard company={invoice.company} className="p-4 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Total</div>
            <div className="text-xl font-semibold text-dash-text mt-1">
              {fmt(invoice.total, invoice.currency)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Paid</div>
            <div className="text-xl font-semibold text-brand-sage mt-1">
              {fmt(paidAmount, invoice.currency)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Balance</div>
            <div
              className={`text-xl font-semibold mt-1 ${
                invoice.residual > 0 ? "text-brand-terracotta" : "text-dash-text"
              }`}
            >
              {invoice.residual > 0 ? fmt(invoice.residual, invoice.currency) : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Tax</div>
            <div className="text-xl font-semibold text-dash-text mt-1">
              {fmt(num(rawInvoice.amount_tax), invoice.currency)}
            </div>
          </div>
        </div>
      </EntityTintedCard>

      {invoice.residual > 0 &&
      (invoice.paymentState === "not_paid" ||
        invoice.paymentState === "partial" ||
        invoice.isOverdue) ? (
        <>
          <ReminderBar
            ctx={{
              invoiceName: invoice.name,
              partnerName: invoice.partnerName,
              amount: fmt(invoice.residual, invoice.currency),
              dueDate: invoice.dueDate || "—",
              daysOverdue: Math.max(0, invoice.daysOverdue || 0),
            }}
          />
          <div className="-mt-3 mb-6 flex flex-wrap justify-end gap-2">
            <PaymentLinkButton
              invoiceId={Number(invoice.id)}
              invoiceName={invoice.name}
              invoiceCurrency={invoice.currency}
              residual={invoice.residual}
              partnerName={invoice.partnerName}
            />
            <MarkPaidButton
              invoiceId={Number(invoice.id)}
              invoiceName={invoice.name}
              invoiceCurrency={invoice.currency}
              residual={invoice.residual}
              partnerName={invoice.partnerName}
            />
          </div>
        </>
      ) : null}

      {/* CFDI workflow — prefactura → approval → stamped CFDI attached */}
      {invoice.moveType === "out_invoice" && (
        <InvoiceWorkflowPanel
          invoiceId={Number(invoice.id)}
          invoiceName={invoice.name}
          partnerName={invoice.partnerName}
          partnerEmail={partner?.email}
        />
      )}

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
          {/* Customer fiscal identity — required for CFDI generation. Surfaced
              here so Roger can verify before stamping without bouncing to
              the customer record. */}
          <div className="space-y-2 text-sm mb-3 pb-3 border-b border-dash-border/60">
            <DetailRow
              label="RFC"
              value={partner?.vat || "—"}
              warn={!partner?.vat}
              warnMessage="Missing — CFDI will fail to stamp without it"
            />
            <DetailRow
              label="Régimen fiscal"
              value={partner?.l10n_mx_edi_fiscal_regime || "—"}
              warn={!partner?.l10n_mx_edi_fiscal_regime}
              warnMessage="Missing — required by SAT for CFDI 4.0"
            />
            <DetailRow
              label="Uso CFDI (default)"
              value={partner?.l10n_mx_edi_usage || rawInvoice.l10n_mx_edi_usage || "—"}
            />
          </div>
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
              <DetailRow label="Uso CFDI (this invoice)" value={rawInvoice.l10n_mx_edi_usage || "—"} />
              <DetailRow label="Stamp state" value={invoice.cfdiState || "—"} />
            </div>
          ) : (
            <p className="text-sm text-dash-text-secondary italic">
              No CFDI stamped for this invoice.
            </p>
          )}
        </section>
      </div>

      {/* Shipping scenario — vendor bills only */}
      {(invoice.moveType === "in_invoice" || invoice.moveType === "in_refund") && (
        <ShippingScenarioPicker invoiceId={invoice.id} />
      )}

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
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Journal</th>
                  <th className="text-left p-3">Memo</th>
                  <th className="text-right p-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-dash-border/50">
                    <td className="p-3 font-mono text-xs">
                      <Link href={`/dashboard/payments/${p.id}`} className="hover:text-dash-accent transition-colors">
                        {p.name}
                      </Link>
                    </td>
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

      {/* Attachments mirrored from Odoo → Drive */}
      <AttachmentsPanel resModel="account.move" resId={invoice.id} />

      {/* Chatter — emails and comments logged on this invoice */}
      <MessagesPanel mode={{ resModel: "account.move", resId: invoice.id }} />
    </div>
  );
};

const DetailRow = ({
  label,
  value,
  warn,
  warnMessage,
}: {
  label: string;
  value: string;
  warn?: boolean;
  warnMessage?: string;
}) => (
  <div className="grid grid-cols-[120px_1fr] gap-2 items-baseline">
    <dt className="text-[10px] uppercase tracking-wider text-dash-text-secondary">{label}</dt>
    <dd className={`text-xs ${warn ? "text-dash-warn" : "text-dash-text"}`}>
      {value || "—"}
      {warn && warnMessage && (
        <span className="ml-1.5 text-[10px] uppercase tracking-wider text-dash-warn/80">
          · {warnMessage}
        </span>
      )}
    </dd>
  </div>
);

export default InvoiceDetailPage;
