"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  DollarSign,
  Users,
  ArrowDownToLine,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  ChevronRight,
  Receipt,
  Package,
  Link2,
  Plus,
  Copy,
  FileText,
} from "lucide-react";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";

type Tab = "overview" | "payments" | "customers" | "payouts" | "products" | "payment-links" | "invoices";

interface StripeSummary {
  balance: { available: number; pending: number; currency: string };
  last30Days: { charges: number; volume: number; refunds: number; refundedAmount: number; currency: string };
  customers: { total: string };
}

interface StripePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  customerEmail: string | null;
  customerName: string | null;
  created: number;
  receiptUrl: string | null;
  refunded: boolean;
  amountRefunded: number;
  paymentMethod: string | null;
}

interface StripeCustomer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  currency: string | null;
  created: number;
  balance: number;
}

interface StripePayout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrivalDate: number;
  created: number;
  method: string;
  type: string;
  description: string | null;
}

interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  images: string[];
  price: { amount: number | null; currency: string } | null;
  created: number;
}

interface StripePaymentLink {
  id: string;
  url: string;
  active: boolean;
  created: number;
}

interface StripeInvoice {
  id: string;
  number: string | null;
  customerName: string | null;
  customerEmail: string | null;
  status: string | null;
  amountDue: number;
  amountPaid: number;
  currency: string;
  created: number;
  dueDate: number | null;
  hostedInvoiceUrl: string | null;
  pdfUrl: string | null;
}

const formatAmount = (amount: number, currency = "mxn") =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp * 1000));

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  succeeded: { label: "Succeeded", className: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-400", icon: Clock },
  failed: { label: "Failed", className: "bg-red-500/10 text-red-400", icon: XCircle },
  canceled: { label: "Canceled", className: "bg-gray-500/10 text-gray-400", icon: Ban },
  paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
  in_transit: { label: "In Transit", className: "bg-blue-500/10 text-blue-400", icon: Clock },
  draft: { label: "Draft", className: "bg-gray-500/10 text-gray-400", icon: FileText },
  open: { label: "Open", className: "bg-amber-500/10 text-amber-400", icon: Clock },
  void: { label: "Void", className: "bg-red-500/10 text-red-400", icon: Ban },
  uncollectible: { label: "Uncollectible", className: "bg-red-500/10 text-red-400", icon: XCircle },
};

const StripePage = () => {
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState<StripeSummary | null>(null);
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [customers, setCustomers] = useState<StripeCustomer[]>([]);
  const [payouts, setPayouts] = useState<StripePayout[]>([]);
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<StripePaymentLink[]>([]);
  const [invoices, setInvoices] = useState<StripeInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [createLinkOpen, setCreateLinkOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/summary");
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setSummary(data);
    } catch { /* ignore */ }
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/payments?limit=25");
      const data = await res.json();
      setPayments(data.payments ?? []);
    } catch { /* ignore */ }
  }, []);

  const loadCustomers = useCallback(async (search = "") => {
    try {
      const params = new URLSearchParams({ limit: "25" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/stripe/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers ?? []);
    } catch { /* ignore */ }
  }, []);

  const loadPayouts = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/payouts?limit=25");
      const data = await res.json();
      setPayouts(data.payouts ?? []);
    } catch { /* ignore */ }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/products");
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch { /* ignore */ }
  }, []);

  const loadPaymentLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/payment-links");
      const data = await res.json();
      setPaymentLinks(data.links ?? []);
    } catch { /* ignore */ }
  }, []);

  const loadInvoices = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/invoices");
      const data = await res.json();
      setInvoices(data.invoices ?? []);
    } catch { /* ignore */ }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    await Promise.all([loadSummary(), loadPayments(), loadCustomers(), loadPayouts(), loadProducts(), loadPaymentLinks(), loadInvoices()]);
    setLoading(false);
  }, [loadSummary, loadPayments, loadCustomers, loadPayouts, loadProducts, loadPaymentLinks, loadInvoices]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const copyLink = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const createPaymentLink = async () => {
    if (!customAmount) return;
    try {
      const res = await fetch("/api/stripe/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customAmount: Number(customAmount), currency: "mxn" }),
      });
      const data = await res.json();
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        setCreateLinkOpen(false);
        setCustomAmount("");
        loadPaymentLinks();
      }
    } catch { /* ignore */ }
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: DollarSign },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "customers", label: "Customers", icon: Users },
    { key: "payouts", label: "Payouts", icon: ArrowDownToLine },
    { key: "products", label: "Products", icon: Package },
    { key: "payment-links", label: "Payment Links", icon: Link2 },
    { key: "invoices", label: "Invoices", icon: Receipt },
  ];

  const currency = summary?.balance.currency ?? "MXN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-dash-text">Stripe</h1>
            {!loading && !error && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </span>
            )}
          </div>
          <p className="text-sm text-dash-text-secondary mt-1">
            Payments, customers & payouts from Stripe
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-dash-text-secondary border border-dash-border rounded-lg hover:bg-dash-bg transition-colors"
          >
            Open Stripe
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={loadAll}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#635bff] rounded-lg hover:bg-[#5851db] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-[#635bff] animate-spin mx-auto" />
            <p className="text-sm text-dash-text-secondary mt-3">Loading Stripe data...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-dash-bg rounded-xl p-1 border border-dash-border overflow-x-auto">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  tab === key
                    ? "bg-dash-surface text-dash-text shadow-sm"
                    : "text-dash-text-secondary hover:text-dash-text"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === "overview" && summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Available Balance" value={formatAmount(summary.balance.available, currency)} icon={DollarSign} accentColor="bg-emerald-500" />
                <KPICard label="Pending Balance" value={formatAmount(summary.balance.pending, currency)} icon={Clock} accentColor="bg-amber-500" />
                <KPICard label="30-Day Volume" value={formatAmount(summary.last30Days.volume, currency)} icon={CreditCard} accentColor="bg-[#635bff]" />
                <KPICard label="30-Day Charges" value={summary.last30Days.charges.toString()} icon={Receipt} accentColor="bg-blue-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
                  <h3 className="text-sm font-semibold text-dash-text mb-4">Last 30 Days</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-dash-text-secondary">Successful Charges</span>
                      <span className="font-medium text-dash-text">{summary.last30Days.charges}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dash-text-secondary">Gross Volume</span>
                      <span className="font-medium text-emerald-400">{formatAmount(summary.last30Days.volume, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dash-text-secondary">Refunds</span>
                      <span className="font-medium text-dash-text">{summary.last30Days.refunds}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dash-text-secondary">Refunded Amount</span>
                      <span className="font-medium text-red-400">{formatAmount(summary.last30Days.refundedAmount, currency)}</span>
                    </div>
                    <div className="border-t border-dash-border pt-3 flex justify-between text-sm">
                      <span className="font-medium text-dash-text">Net Volume</span>
                      <span className="font-bold text-dash-text">{formatAmount(summary.last30Days.volume - summary.last30Days.refundedAmount, currency)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
                  <h3 className="text-sm font-semibold text-dash-text mb-4">Balance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-dash-text-secondary">Available</span>
                      <span className="font-medium text-emerald-400">{formatAmount(summary.balance.available, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dash-text-secondary">Pending</span>
                      <span className="font-medium text-amber-400">{formatAmount(summary.balance.pending, currency)}</span>
                    </div>
                    <div className="border-t border-dash-border pt-3 flex justify-between text-sm">
                      <span className="font-medium text-dash-text">Total</span>
                      <span className="font-bold text-dash-text">{formatAmount(summary.balance.available + summary.balance.pending, currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Payments */}
              <div className="bg-dash-surface rounded-xl border border-dash-border">
                <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-dash-text">Recent Payments</h3>
                  <button onClick={() => setTab("payments")} className="text-xs text-[#635bff] hover:underline cursor-pointer flex items-center gap-0.5">
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dash-border">
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Customer</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Date</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Method</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.slice(0, 8).map((p) => {
                        const status = statusConfig[p.status] ?? statusConfig.pending;
                        return (
                          <tr key={p.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                            <td className="px-5 py-3">
                              <p className="font-medium text-dash-text">{p.customerName ?? p.customerEmail ?? "\u2014"}</p>
                              {p.description && <p className="text-xs text-dash-text-secondary truncate max-w-[200px]">{p.description}</p>}
                            </td>
                            <td className="px-5 py-3 text-dash-text-secondary">{formatDate(p.created)}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>{status.label}</span>
                            </td>
                            <td className="px-5 py-3 text-dash-text-secondary capitalize">{p.paymentMethod?.replace("_", " ") ?? "\u2014"}</td>
                            <td className="px-5 py-3 text-right font-medium text-dash-text">
                              {p.refunded ? <span className="text-red-400 line-through">{formatAmount(p.amount, p.currency)}</span> : formatAmount(p.amount, p.currency)}
                            </td>
                          </tr>
                        );
                      })}
                      {payments.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-dash-text-secondary">No payments found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {tab === "payments" && (
            <div className="bg-dash-surface rounded-xl border border-dash-border">
              <div className="px-5 py-4 border-b border-dash-border">
                <h3 className="text-sm font-semibold text-dash-text">All Payments ({payments.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dash-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Customer</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Description</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Method</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Amount</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const status = statusConfig[p.status] ?? statusConfig.pending;
                      return (
                        <tr key={p.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-dash-text">{p.customerName ?? p.customerEmail ?? "\u2014"}</td>
                          <td className="px-5 py-3 text-dash-text-secondary truncate max-w-[200px]">{p.description ?? "\u2014"}</td>
                          <td className="px-5 py-3 text-dash-text-secondary">{formatDate(p.created)}</td>
                          <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>{status.label}</span></td>
                          <td className="px-5 py-3 text-dash-text-secondary capitalize">{p.paymentMethod?.replace("_", " ") ?? "\u2014"}</td>
                          <td className="px-5 py-3 text-right font-medium text-dash-text">{formatAmount(p.amount, p.currency)}</td>
                          <td className="px-5 py-3 text-right">
                            {p.receiptUrl && <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-[#635bff] hover:underline text-xs">View</a>}
                          </td>
                        </tr>
                      );
                    })}
                    {payments.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-dash-text-secondary">No payments found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {tab === "customers" && (
            <div className="bg-dash-surface rounded-xl border border-dash-border">
              <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-dash-text">Customers ({customers.length})</h3>
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
                  <input type="text" placeholder="Search customers..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); loadCustomers(e.target.value); }} className="pl-9 pr-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dash-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Name</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Phone</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-dash-text">{c.name ?? "\u2014"}</td>
                        <td className="px-5 py-3 text-dash-text-secondary">{c.email ?? "\u2014"}</td>
                        <td className="px-5 py-3 text-dash-text-secondary">{c.phone ?? "\u2014"}</td>
                        <td className="px-5 py-3 text-dash-text-secondary">{formatDate(c.created)}</td>
                      </tr>
                    ))}
                    {customers.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-dash-text-secondary">No customers found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payouts Tab */}
          {tab === "payouts" && (
            <div className="bg-dash-surface rounded-xl border border-dash-border">
              <div className="px-5 py-4 border-b border-dash-border">
                <h3 className="text-sm font-semibold text-dash-text">Payouts ({payouts.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dash-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">ID</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Created</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Arrival</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Method</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => {
                      const status = statusConfig[p.status] ?? statusConfig.pending;
                      return (
                        <tr key={p.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs text-dash-text">{p.id.slice(-8)}</td>
                          <td className="px-5 py-3 text-dash-text-secondary">{formatDate(p.created)}</td>
                          <td className="px-5 py-3 text-dash-text-secondary">{formatDate(p.arrivalDate)}</td>
                          <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>{status.label}</span></td>
                          <td className="px-5 py-3 text-dash-text-secondary capitalize">{p.method}</td>
                          <td className="px-5 py-3 text-right font-medium text-dash-text">{formatAmount(p.amount, p.currency)}</td>
                        </tr>
                      );
                    })}
                    {payouts.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-dash-text-secondary">No payouts found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {tab === "products" && (
            <div className="bg-dash-surface rounded-xl border border-dash-border">
              <div className="px-5 py-4 border-b border-dash-border">
                <h3 className="text-sm font-semibold text-dash-text">Products ({products.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dash-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Product</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Description</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Price</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {p.images[0] && (
                              <img src={p.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                            )}
                            <span className="font-medium text-dash-text">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-dash-text-secondary truncate max-w-[200px]">{p.description ?? "\u2014"}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${p.active ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-400"}`}>
                            {p.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-dash-text">
                          {p.price?.amount ? formatAmount(p.price.amount, p.price.currency) : "\u2014"}
                        </td>
                        <td className="px-5 py-3 text-dash-text-secondary">{formatDate(p.created)}</td>
                      </tr>
                    ))}
                    {products.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-dash-text-secondary">No products found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Links Tab */}
          {tab === "payment-links" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setCreateLinkOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-[#635bff] text-white rounded-lg hover:bg-[#5851db] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Payment Link
                </button>
              </div>
              <div className="bg-dash-surface rounded-xl border border-dash-border">
                <div className="px-5 py-4 border-b border-dash-border">
                  <h3 className="text-sm font-semibold text-dash-text">Payment Links ({paymentLinks.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dash-border">
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">URL</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Created</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentLinks.map((l) => (
                        <tr key={l.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                          <td className="px-5 py-3">
                            <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[#635bff] hover:underline text-xs font-mono truncate block max-w-[300px]">
                              {l.url}
                            </a>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${l.active ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-400"}`}>
                              {l.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-dash-text-secondary">{formatDate(l.created)}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => copyLink(l.url, l.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-dash-text border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedLinkId === l.id ? "Copied!" : "Copy"}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paymentLinks.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-dash-text-secondary">No payment links found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {tab === "invoices" && (
            <div className="bg-dash-surface rounded-xl border border-dash-border">
              <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-dash-text">Invoices ({invoices.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dash-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Invoice</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Customer</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Amount Due</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Paid</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Created</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const status = statusConfig[inv.status ?? "draft"] ?? statusConfig.draft;
                      return (
                        <tr key={inv.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-dash-text">{inv.number ?? inv.id.slice(-8)}</td>
                          <td className="px-5 py-3 text-dash-text-secondary">{inv.customerName ?? inv.customerEmail ?? "\u2014"}</td>
                          <td className="px-5 py-3"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>{status.label}</span></td>
                          <td className="px-5 py-3 text-right font-medium text-dash-text">{formatAmount(inv.amountDue, inv.currency)}</td>
                          <td className="px-5 py-3 text-right text-dash-text-secondary">{formatAmount(inv.amountPaid, inv.currency)}</td>
                          <td className="px-5 py-3 text-dash-text-secondary">{formatDate(inv.created)}</td>
                          <td className="px-5 py-3 text-right">
                            {inv.hostedInvoiceUrl && <a href={inv.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" className="text-[#635bff] hover:underline text-xs">View</a>}
                          </td>
                        </tr>
                      );
                    })}
                    {invoices.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-dash-text-secondary">No invoices found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Payment Link SlideOut */}
      <SlideOut open={createLinkOpen} onClose={() => setCreateLinkOpen(false)} title="Create Payment Link" width="w-[400px]">
        <div className="space-y-6">
          <p className="text-sm text-dash-text-secondary">Create a quick payment link to send via WhatsApp or email.</p>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Amount (MXN)</label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="mt-2 w-full px-4 py-2.5 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
            />
          </div>
          <button
            onClick={createPaymentLink}
            disabled={!customAmount}
            className="w-full px-4 py-2.5 text-sm bg-[#635bff] text-white rounded-lg hover:bg-[#5851db] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Create & Copy Link
          </button>
        </div>
      </SlideOut>
    </div>
  );
};

export default StripePage;
