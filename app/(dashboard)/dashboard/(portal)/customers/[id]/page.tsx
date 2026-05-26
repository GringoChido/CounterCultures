"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Receipt,
  CreditCard,
  ShoppingCart,
  Loader2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Plus,
} from "lucide-react";
import { OdooEditLink } from "@/app/(dashboard)/components/odoo-link";
import { odooCreateUrl } from "@/app/lib/odoo-links";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { MessagesPanel } from "@/app/(dashboard)/components/messages-panel";
import { CreditPanel } from "@/app/(dashboard)/components/partner/credit-panel";
import { PartnerHierarchy } from "@/app/(dashboard)/components/partner/partner-hierarchy";
import { AgingBuckets } from "@/app/(dashboard)/components/partner/aging-buckets";
import { formatDate } from "@/app/lib/format-date";
import { useCurrentUser } from "@/app/lib/use-current-user";
import { hasFeature } from "@/app/lib/features";

interface OdooPartner {
  id: string;
  name: string;
  display_name: string;
  email: string;
  phone: string;
  mobile: string;
  street: string;
  street2: string;
  city: string;
  state_id: string;
  zip: string;
  country_id: string;
  vat: string;
  l10n_mx_edi_fiscal_regime: string;
  l10n_mx_edi_usage: string;
  is_company: string;
  customer_rank: string;
  supplier_rank: string;
  property_payment_term_id: string;
  property_product_pricelist: string;
  user_id: string;
  comment: string;
  create_date: string;
  credit: string;
  debit: string;
  credit_limit: string;
  total_invoiced: string;
  parent_id_id: string;
  child_ids: string;
}

interface OdooInvoice {
  id: string;
  name: string;
  move_type: string;
  state: string;
  invoice_date: string;
  invoice_date_due: string;
  amount_total: string;
  amount_residual: string;
  currency_id: string;
  payment_state: string;
  l10n_mx_edi_cfdi_uuid: string;
  l10n_mx_edi_payment_policy: string;
  invoice_origin: string;
}

interface OdooPayment {
  id: string;
  name: string;
  state: string;
  payment_type: string;
  date: string;
  amount: string;
  currency_id: string;
  journal_id: string;
  memo: string;
  l10n_mx_edi_cfdi_uuid: string;
}

interface OdooSaleOrder {
  id: string;
  name: string;
  state: string;
  date_order: string;
  amount_total: string;
  currency_id: string;
  invoice_status: string;
}

interface CustomerMetrics {
  totalInvoiced: number;
  totalInvoicedByCurrency: Record<string, number>;
  totalPaid: number;
  outstanding: number;
  outstandingByCurrency: Record<string, number>;
  invoiceCount: number;
  paidInvoiceCount: number;
  openInvoiceCount: number;
  quoteCount: number;
  orderCount: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
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

interface CustomerProfile {
  partner: OdooPartner;
  metrics: CustomerMetrics;
  invoices: OdooInvoice[];
  payments: OdooPayment[];
  orders: OdooSaleOrder[];
  openAR: OdooInvoice[];
  parent: OdooPartner | null;
  children: OdooPartner[];
  aging: AgingShape;
}

type Tab = "overview" | "quotes" | "orders" | "invoices" | "payments" | "messages";

const fmt = (n: string | number, cur = "MXN") => {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (!Number.isFinite(v) || !v) return "—";
  return `$${Math.round(v).toLocaleString()} ${cur}`;
};

const fmtMulti = (by: Record<string, number>) => {
  const entries = Object.entries(by).filter(([, v]) => Math.abs(v) > 0.01);
  if (entries.length === 0) return "—";
  return entries.map(([cur, amt]) => fmt(amt, cur)).join(" + ");
};


const stateVariant = (state: string): BadgeVariant => {
  if (state === "posted" || state === "sale" || state === "done") return "success";
  if (state === "draft") return "new";
  if (state === "sent") return "info";
  if (state === "cancel") return "danger";
  return "info";
};

const paymentStateVariant = (ps: string): BadgeVariant => {
  if (ps === "paid") return "success";
  if (ps === "partial") return "warning";
  if (ps === "not_paid") return "danger";
  if (ps === "reversed") return "info";
  return "info";
};

const CustomerDetailPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    fetch(`/api/dashboard/customers/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setProfile(data))
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

  if (error || !profile) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to customers
        </Link>
        <div className="bg-dash-surface border border-dash-border p-6 rounded text-center">
          <AlertCircle className="w-8 h-8 text-brand-terracotta mx-auto mb-2" />
          <p className="text-sm text-dash-text">Customer not found</p>
          <p className="text-xs text-dash-text-secondary mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const { user: currentUser } = useCurrentUser();
  const { partner, metrics, invoices, payments, orders, openAR, parent, children, aging } = profile;
  const isCompany = partner.is_company === "True" || partner.is_company === "true";
  const canCreateQuote = currentUser && hasFeature(
    { role: currentUser.role, featureOverrides: currentUser.featureOverrides },
    "create_quote"
  );

  const quotes = orders.filter((o) => o.state === "draft" || o.state === "sent");
  const confirmedOrders = orders.filter((o) => o.state === "sale" || o.state === "done");
  const customerInvoices = invoices.filter((i) => i.move_type === "out_invoice");

  const tabs: { key: Tab; label: string; count: number; icon: typeof FileText }[] = [
    { key: "overview", label: "Overview", count: 0, icon: User },
    { key: "quotes", label: "Quotes", count: quotes.length, icon: FileText },
    { key: "orders", label: "Orders", count: confirmedOrders.length, icon: ShoppingCart },
    { key: "invoices", label: "Invoices", count: customerInvoices.length, icon: Receipt },
    { key: "payments", label: "Payments", count: payments.length, icon: CreditCard },
    { key: "messages", label: "Messages", count: 0, icon: MessageCircle },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to customers
      </Link>

      {/* Header */}
      <header className="mb-6 flex items-start gap-4">
        <div className="p-3 bg-dash-surface border border-dash-border rounded">
          {isCompany ? (
            <Building2 className="w-6 h-6 text-dash-accent" />
          ) : (
            <User className="w-6 h-6 text-dash-accent" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl text-dash-text">{partner.name}</h1>
            <div className="flex items-center gap-2 shrink-0">
              <OdooEditLink model="res.partner" id={partner.id} />
              {canCreateQuote && (
                <a
                  href={odooCreateUrl("sale.order")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-copper text-white text-xs font-medium rounded-lg hover:bg-brand-copper/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New quote
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-dash-text-secondary">
            {partner.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {partner.email}
              </span>
            )}
            {(partner.phone || partner.mobile) && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {partner.phone || partner.mobile}
              </span>
            )}
            {(partner.city || partner.country_id) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[partner.city, partner.country_id].filter(Boolean).join(", ")}
              </span>
            )}
            <span className="font-mono">Odoo #{partner.id}</span>
          </div>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Lifetime</div>
          <div className="text-lg font-semibold text-dash-text mt-1">
            {fmtMulti(metrics.totalInvoicedByCurrency)}
          </div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Open AR</div>
          <div
            className={`text-lg font-semibold mt-1 ${
              metrics.outstanding > 0 ? "text-brand-terracotta" : "text-dash-text"
            }`}
          >
            {fmtMulti(metrics.outstandingByCurrency)}
          </div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Orders</div>
          <div className="text-lg font-semibold text-dash-text mt-1">{metrics.orderCount}</div>
          {metrics.quoteCount > 0 && (
            <div className="text-xs text-dash-text-secondary mt-1">
              +{metrics.quoteCount} open quote{metrics.quoteCount === 1 ? "" : "s"}
            </div>
          )}
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">First → Last</div>
          <div className="text-xs text-dash-text mt-1">
            {formatDate(metrics.firstOrderDate ?? "")}
            <br />
            {formatDate(metrics.lastOrderDate ?? "")}
          </div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Pays via</div>
          <div className="text-xs text-dash-text mt-1 line-clamp-3">
            {metrics.paymentMethodsUsed.slice(0, 3).join(", ") || "—"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-dash-border flex gap-1 mb-4 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                tab === t.key
                  ? "border-dash-accent text-dash-accent"
                  : "border-transparent text-dash-text-secondary hover:text-dash-text"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && (
                <span className="text-xs text-dash-text-secondary">({t.count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <OverviewTab partner={partner} parent={parent} children={children} aging={aging} />
      )}
      {tab === "quotes" && <OrdersList orders={quotes} empty="No open quotes." />}
      {tab === "orders" && <OrdersList orders={confirmedOrders} empty="No confirmed orders yet." />}
      {tab === "invoices" && <InvoicesList invoices={customerInvoices} openAR={openAR} />}
      {tab === "payments" && <PaymentsList payments={payments} />}
      {tab === "messages" && (
        <MessagesPanel mode={{ partnerId: partner.id }} title="Customer communications" limit={50} />
      )}
    </div>
  );
};

const OverviewTab = ({
  partner,
  parent,
  children,
  aging,
}: {
  partner: OdooPartner;
  parent: OdooPartner | null;
  children: OdooPartner[];
  aging: AgingShape;
}) => (
  <div className="grid md:grid-cols-2 gap-4">
    <section className="bg-dash-surface border border-dash-border p-5 rounded">
      <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
        Contact
      </h2>
      <dl className="space-y-2 text-sm">
        <Row label="Name" value={partner.name} />
        <Row label="Email" value={partner.email || "—"} />
        <Row label="Phone" value={partner.phone || partner.mobile || "—"} />
        <Row
          label="Address"
          value={
            [partner.street, partner.street2, partner.city, partner.state_id, partner.zip, partner.country_id]
              .filter(Boolean)
              .join(", ") || "—"
          }
        />
      </dl>
    </section>
    <section className="bg-dash-surface border border-dash-border p-5 rounded">
      <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
        Fiscal + Account
      </h2>
      <dl className="space-y-2 text-sm">
        <Row label="RFC" value={partner.vat || "—"} mono />
        <Row label="Régimen" value={partner.l10n_mx_edi_fiscal_regime || "—"} />
        <Row label="Uso CFDI" value={partner.l10n_mx_edi_usage || "—"} />
        <Row label="Payment terms" value={partner.property_payment_term_id || "—"} />
        <Row label="Pricelist" value={partner.property_product_pricelist || "—"} />
        <Row label="Assigned rep" value={partner.user_id || "—"} />
      </dl>
    </section>
    <CreditPanel
      mode="customer"
      credit={partner.credit}
      debit={partner.debit}
      creditLimit={partner.credit_limit}
      totalInvoiced={partner.total_invoiced}
    />
    <PartnerHierarchy mode="customer" parent={parent} children={children} />
    <div className="md:col-span-2">
      <AgingBuckets aging={aging} mode="customer" />
    </div>
    {partner.comment && (
      <section className="md:col-span-2 bg-dash-surface border border-dash-border p-5 rounded">
        <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3">
          Notes
        </h2>
        <p className="text-sm text-dash-text whitespace-pre-wrap">{partner.comment}</p>
      </section>
    )}
  </div>
);

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="grid grid-cols-[140px_1fr] gap-2">
    <dt className="text-xs uppercase tracking-wider text-dash-text-secondary">{label}</dt>
    <dd className={`text-dash-text ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
  </div>
);

const OrdersList = ({
  orders,
  empty,
}: {
  orders: OdooSaleOrder[];
  empty: string;
}) => {
  if (orders.length === 0) {
    return <p className="text-sm text-dash-text-secondary py-8 text-center">{empty}</p>;
  }
  return (
    <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
          <tr>
            <th className="text-left p-3">#</th>
            <th className="text-left p-3">Date</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Invoice status</th>
            <th className="text-right p-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              className="border-b border-dash-border/50 hover:bg-dash-bg/50 cursor-pointer transition-colors"
              onClick={() => {
                window.location.href = `/dashboard/orders/${o.id}`;
              }}
              role="link"
            >
              <td className="p-3 font-mono text-xs">
                <Link
                  href={`/dashboard/orders/${o.id}`}
                  className="text-brand-copper hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {o.name}
                </Link>
              </td>
              <td className="p-3 text-xs">{formatDate(o.date_order)}</td>
              <td className="p-3">
                <StatusBadge label={o.state} variant={stateVariant(o.state)} />
              </td>
              <td className="p-3 text-xs text-dash-text-secondary">{o.invoice_status || "—"}</td>
              <td className="p-3 text-right">{fmt(o.amount_total, o.currency_id)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const InvoicesList = ({
  invoices,
  openAR,
}: {
  invoices: OdooInvoice[];
  openAR: OdooInvoice[];
}) => {
  if (invoices.length === 0) {
    return <p className="text-sm text-dash-text-secondary py-8 text-center">No invoices.</p>;
  }
  const openIds = new Set(openAR.map((i) => i.id));
  return (
    <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
          <tr>
            <th className="text-left p-3">#</th>
            <th className="text-left p-3">Date</th>
            <th className="text-left p-3">Due</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Payment</th>
            <th className="text-left p-3">CFDI UUID</th>
            <th className="text-left p-3">Policy</th>
            <th className="text-right p-3">Total</th>
            <th className="text-right p-3">Balance</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => {
            const open = openIds.has(i.id);
            return (
              <tr
                key={i.id}
                className={`border-b border-dash-border/50 hover:bg-dash-bg/50 cursor-pointer transition-colors ${open ? "bg-brand-terracotta/5" : ""}`}
                onClick={() => {
                  window.location.href = `/dashboard/invoices/${i.id}`;
                }}
                role="link"
              >
                <td className="p-3 font-mono text-xs">
                  <Link
                    href={`/dashboard/invoices/${i.id}`}
                    className="text-brand-copper hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {i.name}
                  </Link>
                </td>
                <td className="p-3 text-xs">{formatDate(i.invoice_date)}</td>
                <td className="p-3 text-xs">{formatDate(i.invoice_date_due)}</td>
                <td className="p-3">
                  <StatusBadge label={i.state} variant={stateVariant(i.state)} />
                </td>
                <td className="p-3">
                  {i.payment_state && (
                    <StatusBadge
                      label={i.payment_state.replace("_", " ")}
                      variant={paymentStateVariant(i.payment_state)}
                    />
                  )}
                </td>
                <td className="p-3 font-mono text-[10px] text-dash-text-secondary">
                  {i.l10n_mx_edi_cfdi_uuid ? i.l10n_mx_edi_cfdi_uuid.slice(0, 8) + "…" : "—"}
                </td>
                <td className="p-3 text-xs text-dash-text-secondary">{i.l10n_mx_edi_payment_policy || "—"}</td>
                <td className="p-3 text-right">{fmt(i.amount_total, i.currency_id)}</td>
                <td className="p-3 text-right font-medium">
                  {parseFloat(i.amount_residual || "0") > 0
                    ? fmt(i.amount_residual, i.currency_id)
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const PaymentsList = ({ payments }: { payments: OdooPayment[] }) => {
  if (payments.length === 0) {
    return <p className="text-sm text-dash-text-secondary py-8 text-center">No payments.</p>;
  }
  return (
    <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
          <tr>
            <th className="text-left p-3">#</th>
            <th className="text-left p-3">Date</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Method</th>
            <th className="text-left p-3">Memo</th>
            <th className="text-right p-3">Amount</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr
              key={p.id}
              className="border-b border-dash-border/50 hover:bg-dash-bg/50 cursor-pointer transition-colors"
              onClick={() => {
                window.location.href = `/dashboard/payments/${p.id}`;
              }}
              role="link"
            >
              <td className="p-3 font-mono text-xs">
                <Link
                  href={`/dashboard/payments/${p.id}`}
                  className="text-brand-copper hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {p.name}
                </Link>
              </td>
              <td className="p-3 text-xs">{formatDate(p.date)}</td>
              <td className="p-3">
                <StatusBadge label={p.state} variant={stateVariant(p.state)} />
              </td>
              <td className="p-3 text-xs">{p.journal_id || "—"}</td>
              <td className="p-3 text-xs text-dash-text-secondary line-clamp-1">
                {p.memo || "—"}
              </td>
              <td className="p-3 text-right font-medium">{fmt(p.amount, p.currency_id)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerDetailPage;
