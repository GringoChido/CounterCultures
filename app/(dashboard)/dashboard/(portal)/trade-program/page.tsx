"use client";

import { useState, useEffect } from "react";
import { Users, Clock, Percent, DollarSign, CheckCircle2, XCircle, Briefcase, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import { NotesPanel } from "@/app/(dashboard)/components/notes-panel";
import { ShareButton } from "@/app/(dashboard)/components/share-button";

type Tier = "Gold" | "Silver" | "Bronze";

interface TradeMember {
  id: string;
  company: string;
  contact: string;
  tier: Tier;
  discount: number;
  status: "active" | "pending" | "suspended";
  totalOrders: number;
  revenue: number;
  activeProjects?: number;
  revenueType?: "trade" | "direct";
}

const tierColors: Record<Tier, string> = {
  Gold: "bg-amber-500/10 text-amber-400",
  Silver: "bg-gray-500/10 text-gray-400",
  Bronze: "bg-orange-500/10 text-orange-400",
};

const statusVariants: Record<string, BadgeVariant> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
};

const tradeMembers: TradeMember[] = [
  { id: "1", company: "Martinez Design Group", contact: "Elena Martinez", tier: "Gold", discount: 25, status: "active", totalOrders: 42, revenue: 380000, activeProjects: 3, revenueType: "trade" },
  { id: "2", company: "Coastal Living Interiors", contact: "James Patterson", tier: "Gold", discount: 25, status: "active", totalOrders: 28, revenue: 245000, activeProjects: 2, revenueType: "trade" },
  { id: "3", company: "Hacienda Renovations", contact: "Carlos Mendoza", tier: "Silver", discount: 18, status: "active", totalOrders: 15, revenue: 120000, activeProjects: 1, revenueType: "trade" },
  { id: "4", company: "Pacific Homes Builder", contact: "Sarah Kim", tier: "Bronze", discount: 12, status: "pending", totalOrders: 3, revenue: 35000, activeProjects: 0, revenueType: "trade" },
];

interface Application {
  id: string;
  company: string;
  contact: string;
  email: string;
  submitted: string;
  projectTypes: string;
  estimatedAnnual: string;
}

const fallbackApplications: Application[] = [
  { id: "APP-001", company: "Desert Modern Studio", contact: "Ryan Torres", email: "ryan@desertmodern.mx", submitted: "Mar 25, 2026", projectTypes: "Luxury Residential, Boutique Hotels", estimatedAnnual: "$200,000 USD" },
  { id: "APP-002", company: "Oaxaca Craft Collective", contact: "Laura Vega", email: "laura@oaxacacraft.mx", submitted: "Mar 22, 2026", projectTypes: "Commercial, Restaurant", estimatedAnnual: "$80,000 USD" },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const TradeProgramPage = () => {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [pendingApplications, setPendingApplications] = useState<Application[]>(fallbackApplications);
  const [appsLoading, setAppsLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const handleDecision = async (
    app: Application,
    decision: "approved" | "rejected"
  ) => {
    if (actingOn) return;
    setActingOn(app.id);
    try {
      const res = await fetch("/api/dashboard/trade-program", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id, status: decision }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPendingApplications((prev) => prev.filter((a) => a.id !== app.id));
      if (selectedApp?.id === app.id) setSelectedApp(null);
      toast.success(
        decision === "approved"
          ? `Approved: ${app.company}`
          : `Declined: ${app.company}`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update application"
      );
    } finally {
      setActingOn(null);
    }
  };

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch("/api/dashboard/trade-program");
        if (res.ok) {
          const data = await res.json();
          const apps = (data.applications as Array<Record<string, string>>)
            .filter((a) => a.status === "pending" || !a.status)
            .map((a) => ({
              id: a.id,
              company: a.company,
              contact: a.contact_name,
              email: a.email,
              submitted: a.created_at,
              projectTypes: a.license_number ? `License: ${a.license_number}` : "",
              estimatedAnnual: "",
            }));
          if (apps.length > 0) setPendingApplications(apps);
        }
      } catch {
        // Keep fallback data
      } finally {
        setAppsLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const totalTradeRevenue = tradeMembers.reduce((sum, m) => sum + m.revenue, 0);
  const directRevenue = 520000; // sample direct revenue
  const totalActiveProjects = tradeMembers.reduce((sum, m) => sum + (m.activeProjects || 0), 0);

  // Revenue split data
  const tradeRevPct = Math.round((totalTradeRevenue / (totalTradeRevenue + directRevenue)) * 100);
  const directRevPct = 100 - tradeRevPct;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Trade Program</h2>
        <p className="text-sm text-dash-text-secondary mt-1">Manage trade members, applications, and program performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard label="Active Members" value="18" change={12.5} icon={Users} accentColor="bg-brand-copper" />
        <KPICard label="Pending Apps" value={String(pendingApplications.length)} icon={Clock} accentColor="bg-status-new" />
        <KPICard label="Active Projects" value={String(totalActiveProjects)} icon={Briefcase} accentColor="bg-blue-500" />
        <KPICard label="Trade Revenue" value={formatCurrency(totalTradeRevenue)} change={18.3} icon={DollarSign} accentColor="bg-brand-terracotta" />
        <KPICard label="Avg Discount" value="20%" icon={Percent} accentColor="bg-brand-sage" />
      </div>

      {/* Trade vs Direct Revenue */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-brand-copper" />
          <h3 className="text-sm font-semibold text-dash-text">Trade vs Direct Revenue</h3>
        </div>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-copper" />
            <span className="text-xs text-dash-text-secondary">Trade ({tradeRevPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span className="text-xs text-dash-text-secondary">Direct ({directRevPct}%)</span>
          </div>
        </div>
        <div className="w-full h-4 bg-dash-bg rounded-full overflow-hidden flex">
          <div className="h-full bg-brand-copper transition-all" style={{ width: `${tradeRevPct}%` }} />
          <div className="h-full bg-blue-400 transition-all" style={{ width: `${directRevPct}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs font-medium text-brand-copper">{formatCurrency(totalTradeRevenue)}</span>
          <span className="text-xs font-medium text-blue-400">{formatCurrency(directRevenue)}</span>
        </div>
      </div>

      {/* Trade Members Table */}
      <div className="bg-dash-surface rounded-xl border border-dash-border">
        <div className="p-5 border-b border-dash-border">
          <h3 className="text-sm font-semibold text-dash-text">Trade Members</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dash-border">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Tier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Discount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Active Projects</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Orders</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Revenue</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Status</th>
              </tr>
            </thead>
            <tbody>
              {tradeMembers.map((member) => (
                <tr key={member.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-dash-text">{member.company}</td>
                  <td className="px-4 py-3 text-dash-text">{member.contact}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tierColors[member.tier]}`}>
                      {member.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dash-text">{member.discount}%</td>
                  <td className="px-4 py-3 text-dash-text">{member.activeProjects || 0}</td>
                  <td className="px-4 py-3 text-dash-text">{member.totalOrders}</td>
                  <td className="px-4 py-3 font-medium text-brand-copper">{formatCurrency(member.revenue)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={member.status.charAt(0).toUpperCase() + member.status.slice(1)} variant={statusVariants[member.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Applications */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-dash-text">
            Pending Applications ({pendingApplications.length})
          </h3>
          {appsLoading ? (
            <span className="inline-flex items-center gap-1 text-xs text-dash-text-muted">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading…
            </span>
          ) : null}
        </div>
        <div className="space-y-3">
          {pendingApplications.length === 0 ? (
            <p className="text-sm text-dash-text-muted py-6 text-center">
              No pending applications.
            </p>
          ) : null}
          {pendingApplications.map((app) => (
            <div key={app.id} className="flex items-center justify-between py-3 border-b border-dash-border last:border-0">
              <div>
                <p className="text-sm font-medium text-dash-text">{app.company}</p>
                <p className="text-xs text-dash-text-secondary">{app.contact} &middot; {app.email} &middot; Submitted {app.submitted}</p>
                <p className="text-xs text-dash-text-secondary mt-0.5">{app.projectTypes} &middot; Est. {app.estimatedAnnual}/yr</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedApp(app)}
                  className="px-3 py-1.5 bg-brand-copper text-white rounded-lg text-xs font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer"
                >
                  Review
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(app, "approved")}
                  disabled={actingOn === app.id}
                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer disabled:opacity-50"
                  title="Approve"
                >
                  {actingOn === app.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(app, "rejected")}
                  disabled={actingOn === app.id}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                  title="Decline"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Review SlideOut */}
      <SlideOut open={!!selectedApp} onClose={() => setSelectedApp(null)} title="Application Review">
        {selectedApp && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-dash-text">{selectedApp.company}</h3>
              <p className="text-sm text-dash-text-secondary mt-1">{selectedApp.contact} &middot; {selectedApp.email}</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-dash-border">
                <span className="text-sm text-dash-text-secondary">Submitted</span>
                <span className="text-sm text-dash-text">{selectedApp.submitted}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dash-border">
                <span className="text-sm text-dash-text-secondary">Project Types</span>
                <span className="text-sm text-dash-text">{selectedApp.projectTypes}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dash-border">
                <span className="text-sm text-dash-text-secondary">Est. Annual Volume</span>
                <span className="text-sm font-medium text-brand-copper">{selectedApp.estimatedAnnual}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">Assign Tier</label>
              <select className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text focus:outline-none focus:border-brand-copper/50">
                <option>Bronze (12%)</option>
                <option>Silver (18%)</option>
                <option>Gold (25%)</option>
              </select>
            </div>
            <div className="pt-4 border-t border-dash-border">
              <NotesPanel entityType="trade_app" entityId={selectedApp.id} />
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-dash-border">
              <button
                type="button"
                onClick={() => handleDecision(selectedApp, "approved")}
                disabled={actingOn === selectedApp.id}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {actingOn === selectedApp.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve
              </button>
              <button
                type="button"
                onClick={() => handleDecision(selectedApp, "rejected")}
                disabled={actingOn === selectedApp.id}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <XCircle className="w-4 h-4" />
                Decline
              </button>
              <ShareButton
                entityType="trade_app"
                entityId={selectedApp.id}
                summary={`Trade application: ${selectedApp.company} — ${selectedApp.contact}`}
                deepLink={`/dashboard/trade-program#${selectedApp.id}`}
                compact
              />
            </div>
          </div>
        )}
      </SlideOut>
    </div>
  );
};

export default TradeProgramPage;
