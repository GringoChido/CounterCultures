"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  ShoppingCart,
  FileText,
  Package,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Building2,
  Truck,
  ExternalLink,
  Search,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import type { OdooDashboardSummary, OdooSaleOrder, OdooInvoice, OdooContact, OdooCRMLead } from "@/app/lib/odoo";

type Tab = "overview" | "sales" | "invoices" | "contacts" | "purchases" | "crm";

const formatCurrency = (amount: number, currency = "MXN") =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr: string) => {
  if (!dateStr) return "\u2014";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
};

const stateLabels: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  sent: { label: "Sent", className: "bg-blue-50 text-blue-700" },
  sale: { label: "Confirmed", className: "bg-emerald-50 text-emerald-700" },
  done: { label: "Done", className: "bg-emerald-50 text-emerald-700" },
  cancel: { label: "Cancelled", className: "bg-red-50 text-red-700" },
  posted: { label: "Posted", className: "bg-emerald-50 text-emerald-700" },
  purchase: { label: "Confirmed", className: "bg-emerald-50 text-emerald-700" },
};

const paymentLabels: Record<string, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700" },
  not_paid: { label: "Unpaid", className: "bg-amber-50 text-amber-700" },
  partial: { label: "Partial", className: "bg-orange-50 text-orange-700" },
  in_payment: { label: "In Payment", className: "bg-blue-50 text-blue-700" },
  reversed: { label: "Reversed", className: "bg-red-50 text-red-700" },
};

const priorityLabels: Record<string, string> = {
  "0": "Normal",
  "1": "Low",
  "2": "High",
  "3": "Very High",
};

const OdooPage = () => {
  const [tab, setTab] = useState<Tab>("overview");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [serverVersion, setServerVersion] = useState("");
  const [summary, setSummary] = useState<OdooDashboardSummary | null>(null);
  const [sales, setSales] = useState<OdooSaleOrder[]>([]);
  const [invoices, setInvoices] = useState<OdooInvoice[]>([]);
  const [contacts, setContacts] = useState<OdooContact[]>([]);
  const [purchases, setPurchases] = useState<Record<string, unknown>[]>([]);
  const [crmLeads, setCrmLeads] = useState<OdooCRMLead[]>([]);
  const [crmError, setCrmError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const testConnection = useCallback(async () => {
    try {
      const res = await fetch("/api/odoo/connection-test");
      const data = await res.json();
      setConnected(data.success);
      if (data.serverVersion) setServerVersion(data.serverVersion);
      if (!data.success) setError(data.error ?? "Connection failed");
      return data.success;
    } catch {
      setConnected(false);
      setError("Failed to reach Odoo");
      return false;
    }
  }, []);

  const loadSummary = useCallback(async () => {
    const res = await fetch("/api/odoo/summary");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setSummary(data);
  }, []);

  const loadSales = useCallback(async () => {
    const res = await fetch("/api/odoo/sales?limit=25");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setSales(data.orders ?? []);
  }, []);

  const loadInvoices = useCallback(async () => {
    const res = await fetch("/api/odoo/invoices?limit=25");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setInvoices(data.invoices ?? []);
  }, []);

  const loadContacts = useCallback(async (search = "") => {
    const params = new URLSearchParams({ limit: "50", type: "customer" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/odoo/contacts?${params}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setContacts(data.contacts ?? []);
  }, []);

  const loadPurchases = useCallback(async () => {
    const res = await fetch("/api/odoo/purchases?limit=25");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setPurchases(data.orders ?? []);
  }, []);

  const loadCRM = useCallback(async () => {
    const res = await fetch("/api/odoo/crm?limit=50");
    const data = await res.json();
    if (data.error && !data.leads) throw new Error(data.error);
    if (data.error) setCrmError(data.error);
    setCrmLeads((data.leads ?? []) as OdooCRMLead[]);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    setWarnings([]);
    setCrmError("");

    const ok = await testConnection();
    if (!ok) {
      setLoading(false);
      return;
    }

    // Load ALL data in parallel
    const results = await Promise.allSettled([
      loadSummary(),
      loadSales(),
      loadInvoices(),
      loadContacts(),
      loadPurchases(),
      loadCRM(),
    ]);

    const labels = ["Summary", "Sales Orders", "Invoices", "Contacts", "Purchases", "CRM Pipeline"];
    const newWarnings: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        newWarnings.push(`${labels[i]}: ${r.reason?.message || "Failed to load"}`);
      }
    });
    setWarnings(newWarnings);
    setLoading(false);
  }, [testConnection, loadSummary, loadSales, loadInvoices, loadContacts, loadPurchases, loadCRM]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "overview", label: "Overview", icon: TrendingUp },
    { key: "sales", label: "Sales Orders", icon: ShoppingCart, count: sales.length },
    { key: "invoices", label: "Invoices", icon: FileText, count: invoices.length },
    { key: "contacts", label: "Customers", icon: Users, count: contacts.length },
    { key: "purchases", label: "Purchases", icon: Truck, count: purchases.length },
    { key: "crm", label: "CRM Pipeline", icon: Briefcase, count: crmLeads.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-dash-text">Odoo</h1>
            {connected !== null && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  connected
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {connected ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {connected ? `Connected \u00B7 v${serverVersion}` : "Disconnected"}
              </span>
            )}
          </div>
          <p className="text-sm text-dash-text-secondary mt-1">
            Accounting, sales orders, invoices & purchase orders from Odoo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://counter-cultures.odoo.com/odoo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-dash-text-secondary border border-dash-border rounded-lg hover:bg-dash-bg transition-colors"
          >
            Open Odoo
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={loadAll}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-copper rounded-lg hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Connection Error</p>
            <p className="text-sm text-red-400/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && !loading && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">Some data failed to load</p>
            <ul className="text-sm text-amber-400/80 mt-1 space-y-0.5">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-brand-copper animate-spin mx-auto" />
            <p className="text-sm text-dash-text-secondary mt-3">
              Connecting to Odoo...
            </p>
          </div>
        </div>
      )}

      {!loading && connected && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-dash-bg rounded-xl p-1 border border-dash-border overflow-x-auto">
            {tabs.map(({ key, label, icon: Icon, count }) => (
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
                {count !== undefined && count > 0 && (
                  <span className="text-[10px] bg-dash-border rounded-full px-1.5 py-0.5">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab === "overview" && (
            <div className="space-y-6">
              {summary ? (
                <>
                  {/* KPI Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                      label="Total Revenue"
                      value={formatCurrency(summary.sales.totalRevenue)}
                      icon={DollarSign}
                      accentColor="bg-emerald-500"
                    />
                    <KPICard
                      label="Open Receivables"
                      value={formatCurrency(summary.invoices.totalReceivable)}
                      icon={FileText}
                      accentColor="bg-amber-500"
                    />
                    <KPICard
                      label="Purchase Spend"
                      value={formatCurrency(summary.purchases.totalSpend)}
                      icon={Truck}
                      accentColor="bg-blue-500"
                    />
                    <KPICard
                      label="Customers"
                      value={summary.contacts.customers.toString()}
                      icon={Users}
                      accentColor="bg-brand-copper"
                    />
                  </div>

                  {/* Detail Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Sales Card */}
                    <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-dash-text">Sales Orders</h3>
                        <button
                          onClick={() => setTab("sales")}
                          className="text-xs text-brand-copper hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          View all <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-dash-text-secondary">Draft</span>
                          <span className="font-medium text-dash-text">{summary.sales.draft}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dash-text-secondary">Confirmed</span>
                          <span className="font-medium text-dash-text">{summary.sales.confirmed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dash-text-secondary">Done</span>
                          <span className="font-medium text-dash-text">{summary.sales.done}</span>
                        </div>
                        <div className="border-t border-dash-border pt-3 flex justify-between text-sm">
                          <span className="font-medium text-dash-text">Total</span>
                          <span className="font-bold text-dash-text">{summary.sales.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Invoices Card */}
                    <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-dash-text">Invoices</h3>
                        <button
                          onClick={() => setTab("invoices")}
                          className="text-xs text-brand-copper hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          View all <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-dash-text-secondary flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Paid
                          </span>
                          <span className="font-medium text-dash-text">{summary.invoices.paid}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dash-text-secondary flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500" /> Unpaid
                          </span>
                          <span className="font-medium text-dash-text">{summary.invoices.unpaid}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dash-text-secondary flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Overdue
                          </span>
                          <span className="font-medium text-red-600">{summary.invoices.overdue}</span>
                        </div>
                        <div className="border-t border-dash-border pt-3 flex justify-between text-sm">
                          <span className="font-medium text-dash-text">Total</span>
                          <span className="font-bold text-dash-text">{summary.invoices.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Purchases Card */}
                    <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-dash-text">Purchases</h3>
                        <button
                          onClick={() => setTab("purchases")}
                          className="text-xs text-brand-copper hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          View all <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-dash-text-secondary">Draft</span>
                          <span className="font-medium text-dash-text">{summary.purchases.draft}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dash-text-secondary">Confirmed</span>
                          <span className="font-medium text-dash-text">{summary.purchases.confirmed}</span>
                        </div>
                        <div className="border-t border-dash-border pt-3 flex justify-between text-sm">
                          <span className="font-medium text-dash-text">Total</span>
                          <span className="font-bold text-dash-text">{summary.purchases.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contacts Card */}
                    <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-dash-text">Contacts</h3>
                        <button
                          onClick={() => setTab("contacts")}
                          className="text-xs text-brand-copper hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          View all <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-dash-text-secondary flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-brand-copper" /> Customers
                          </span>
                          <span className="font-medium text-dash-text">{summary.contacts.customers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dash-text-secondary flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" /> Suppliers
                          </span>
                          <span className="font-medium text-dash-text">{summary.contacts.suppliers}</span>
                        </div>
                        <div className="border-t border-dash-border pt-3 flex justify-between text-sm">
                          <span className="font-medium text-dash-text">Total</span>
                          <span className="font-bold text-dash-text">{summary.contacts.total}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Sales Table */}
                  <div className="bg-dash-surface rounded-xl border border-dash-border">
                    <div className="px-5 py-4 border-b border-dash-border">
                      <h3 className="text-sm font-semibold text-dash-text">Recent Sales Orders</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-dash-border">
                            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Order</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Customer</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Date</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Status</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sales.slice(0, 8).map((order) => {
                            const state = stateLabels[order.state] ?? stateLabels.draft;
                            return (
                              <tr key={order.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                                <td className="px-5 py-3 font-medium text-dash-text">{order.name}</td>
                                <td className="px-5 py-3 text-dash-text-secondary">
                                  {Array.isArray(order.partner_id) ? order.partner_id[1] : "\u2014"}
                                </td>
                                <td className="px-5 py-3 text-dash-text-secondary">{formatDate(order.date_order)}</td>
                                <td className="px-5 py-3">
                                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${state.className}`}>
                                    {state.label}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-right font-medium text-dash-text">
                                  {formatCurrency(order.amount_total)}
                                </td>
                              </tr>
                            );
                          })}
                          {sales.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-5 py-8 text-center text-dash-text-secondary">
                                No sales orders found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-dash-surface rounded-xl border border-dash-border p-8 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                  <p className="text-sm text-dash-text-secondary">
                    Summary data unavailable \u2014 try refreshing. Other tabs may still have data.
                  </p>
                  <button
                    onClick={loadAll}
                    className="mt-4 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sales Tab */}
          {tab === "sales" && (
            <div className="bg-dash-surface rounded-xl border border-dash-border">
              <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-dash-text">
                  All Sales Orders ({sales.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dash-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Order</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Customer</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Rep</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Invoice</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((order) => {
                      const state = stateLabels[order.state] ?? stateLabels.draft;
                      return (
                        <tr key={order.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-dash-text">{order.name}</td>
                          <td className="px-5 py-3 text-dash-text-secondary">
                            {Array.isArray(order.partner_id) ? order.partner_id[1] : "\u2014"}
                          </td>
                          <td className="px-5 py-3 text-dash-text-secondary">{formatDate(order.date_order)}</td>
                          <td className="px-5 py-3 text-dash-text-secondary">
                            {Array.isArray(order.user_id) ? order.user_id[1] : "\u2014"}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${state.className}`}>
                              {state.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-dash-text-secondary capitalize">
                            {order.invoice_status?.replace("_", " ") ?? "\u2014"}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-dash-text">
                            {formatCurrency(order.amount_total)}
                          </td>
                        </tr>
                      );
                    })}
                    {sales.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-dash-text-secondary">
                          No sales orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {tab === "invoices" && (
            <div className="bg-dash-surface rounded-xl border border-dash-border">
              <div className="px-5 py-4 border-b border-dash-border">
                <h3 className="text-sm font-semibold text-dash-text">
                  All Invoices ({invoices.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dash-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Invoice</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Customer</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Due</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Payment</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Total</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const payment = paymentLabels[inv.payment_state] ?? paymentLabels.not_paid;
                      return (
                        <tr key={inv.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-dash-text">{inv.name}</td>
                          <td className="px-5 py-3 text-dash-text-secondary">
                            {Array.isArray(inv.partner_id) ? inv.partner_id[1] : "\u2014"}
                          </td>
                          <td className="px-5 py-3 text-dash-text-secondary">{formatDate(inv.invoice_date)}</td>
                          <td className="px-5 py-3 text-dash-text-secondary">{formatDate(inv.invoice_date_due)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.className}`}>
                              {payment.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-dash-text">
                            {formatCurrency(inv.amount_total)}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-dash-text">
                            {inv.amount_residual > 0 ? (
                              <span className="text-amber-600">{formatCurrency(inv.amount_residual)}</span>
                            ) : (
                              <span className="text-emerald-600">$0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-dash-text-secondary">
                          No invoices found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Contacts Tab */}
          {tab === "contacts" && (
            <div className="bg-dash-surface rounded-xl border border-dash-border">
              <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-dash-text">
                  Customers ({contacts.length})
                </h3>
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      loadContacts(e.target.value);
                    }}
                    className="pl-9 pr-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dash-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Name</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Phone</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">City</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => (
                      <tr key={c.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                        <td className="px-5 py-3">
                          <div>
                            <p className="font-medium text-dash-text">{c.name}</p>
                            {c.company_name && (
                              <p className="text-xs text-dash-text-secondary">{c.company_name}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-dash-text-secondary">{c.email || "\u2014"}</td>
                        <td className="px-5 py-3 text-dash-text-secondary">{c.phone || c.mobile || "\u2014"}</td>
                        <td className="px-5 py-3 text-dash-text-secondary">{c.city || "\u2014"}</td>
                        <td className="px-5 py-3 text-dash-text-secondary">{formatDate(c.create_date)}</td>
                      </tr>
                    ))}
                    {contacts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-dash-text-secondary">
                          No customers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Purchases Tab */}
          {tab === "purchases" && (
            <div className="bg-dash-surface rounded-xl border border-dash-border">
              <div className="px-5 py-4 border-b border-dash-border">
                <h3 className="text-sm font-semibold text-dash-text">
                  Purchase Orders ({purchases.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dash-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">PO</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Supplier</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Order Date</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Expected</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((po) => {
                      const state = stateLabels[(po.state as string)] ?? stateLabels.draft;
                      return (
                        <tr key={po.id as number} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-dash-text">{po.name as string}</td>
                          <td className="px-5 py-3 text-dash-text-secondary">
                            {Array.isArray(po.partner_id) ? po.partner_id[1] : "\u2014"}
                          </td>
                          <td className="px-5 py-3 text-dash-text-secondary">{formatDate(po.date_order as string)}</td>
                          <td className="px-5 py-3 text-dash-text-secondary">{formatDate(po.date_planned as string)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${state.className}`}>
                              {state.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-dash-text">
                            {formatCurrency(po.amount_total as number)}
                          </td>
                        </tr>
                      );
                    })}
                    {purchases.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-dash-text-secondary">
                          No purchase orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CRM Pipeline Tab */}
          {tab === "crm" && (
            <div className="bg-dash-surface rounded-xl border border-dash-border">
              <div className="px-5 py-4 border-b border-dash-border">
                <h3 className="text-sm font-semibold text-dash-text">
                  CRM Opportunities ({crmLeads.length})
                </h3>
              </div>
              {crmError ? (
                <div className="p-8 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                  <p className="text-sm text-dash-text-secondary">{crmError}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dash-border">
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Name</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Contact</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Stage</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Revenue</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Probability</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Deadline</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Assigned To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crmLeads.map((lead) => (
                        <tr key={lead.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                          <td className="px-5 py-3">
                            <div>
                              <p className="font-medium text-dash-text">{lead.name}</p>
                              {lead.priority !== "0" && (
                                <span className="text-[10px] text-amber-400">{priorityLabels[lead.priority]}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-dash-text-secondary">
                            {lead.contact_name || (Array.isArray(lead.partner_id) ? lead.partner_id[1] : "\u2014")}
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-copper/10 text-brand-copper">
                              {Array.isArray(lead.stage_id) ? lead.stage_id[1] : "\u2014"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-dash-text">
                            {lead.expected_revenue ? formatCurrency(lead.expected_revenue) : "\u2014"}
                          </td>
                          <td className="px-5 py-3 text-dash-text-secondary">
                            {lead.probability}%
                          </td>
                          <td className="px-5 py-3 text-dash-text-secondary">
                            {formatDate(lead.date_deadline)}
                          </td>
                          <td className="px-5 py-3 text-dash-text-secondary">
                            {Array.isArray(lead.user_id) ? lead.user_id[1] : "\u2014"}
                          </td>
                        </tr>
                      ))}
                      {crmLeads.length === 0 && !crmError && (
                        <tr>
                          <td colSpan={7} className="px-5 py-8 text-center text-dash-text-secondary">
                            No CRM opportunities found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OdooPage;
