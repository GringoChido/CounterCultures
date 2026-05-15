"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import { NotesPanel } from "@/app/(dashboard)/components/notes-panel";
import { ShareButton } from "@/app/(dashboard)/components/share-button";

interface Application {
  id: string;
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  license_number: string;
  status: string;
  created_at: string;
  business_type: string;
  website: string;
  expected_annual_volume: string;
  notes: string;
}

interface TradeMember {
  email: string;
  name: string;
  tier: string;
  joinedAt: string;
}

interface TradeData {
  applications: Application[];
  members: TradeMember[];
  kpis: {
    activeMembers: number;
    pendingApps: number;
  };
}

const statusVariants: Record<string, BadgeVariant> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

const formatDate = (iso: string): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const TradeProgramPage = () => {
  const [data, setData] = useState<TradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/trade-program");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: TradeData = await res.json();
      setData(json);
    } catch (err) {
      console.error("[Trade Program] fetch failed:", err);
      toast.error("Failed to load trade program data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pendingApplications =
    data?.applications.filter((a) => a.status === "pending" || !a.status) ?? [];

  const handleDecision = async (
    app: Application,
    decision: "approve" | "reject",
    notes?: string
  ) => {
    if (actingOn) return;
    setActingOn(app.id);
    try {
      const res = await fetch("/api/dashboard/trade-program", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id, action: decision, notes }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          (errBody as { error?: string }).error || `HTTP ${res.status}`
        );
      }
      if (selectedApp?.id === app.id) setSelectedApp(null);
      setRejectNotes("");
      toast.success(
        decision === "approve"
          ? `Approved: ${app.company}`
          : `Declined: ${app.company}`
      );
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update application"
      );
    } finally {
      setActingOn(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-dash-text-muted" />
        <span className="ml-2 text-sm text-dash-text-muted">
          Loading trade program…
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Trade Program</h2>
        <p className="text-sm text-dash-text-secondary mt-1">
          Manage trade members, applications, and program performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Active Members"
          value={String(data?.kpis.activeMembers ?? 0)}
          icon={Users}
          accentColor="bg-brand-copper"
        />
        <KPICard
          label="Pending Apps"
          value={String(data?.kpis.pendingApps ?? 0)}
          icon={Clock}
          accentColor="bg-status-new"
        />
      </div>

      {/* Trade Members Table */}
      <div className="bg-dash-surface rounded-xl border border-dash-border">
        <div className="p-5 border-b border-dash-border">
          <h3 className="text-sm font-semibold text-dash-text">
            Trade Members ({data?.members.length ?? 0})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dash-border">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                  Tier
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                  Joined
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {(data?.members ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-dash-text-muted"
                  >
                    No active trade members yet.
                  </td>
                </tr>
              ) : null}
              {(data?.members ?? []).map((member) => (
                <tr
                  key={member.email}
                  className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-dash-text">
                    {member.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-dash-text">{member.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-dash-text-muted/10 text-dash-text-muted capitalize">
                      {member.tier || "default"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dash-text-secondary">
                    {formatDate(member.joinedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label="Active" variant="success" />
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
        </div>
        <div className="space-y-3">
          {pendingApplications.length === 0 ? (
            <p className="text-sm text-dash-text-muted py-6 text-center">
              No pending applications.
            </p>
          ) : null}
          {pendingApplications.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between py-3 border-b border-dash-border last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-dash-text">
                  {app.company}
                </p>
                <p className="text-xs text-dash-text-secondary">
                  {app.contact_name} &middot; {app.email} &middot; Submitted{" "}
                  {formatDate(app.created_at)}
                </p>
                {app.business_type ? (
                  <p className="text-xs text-dash-text-secondary mt-0.5">
                    {app.business_type}
                    {app.website ? ` · ${app.website}` : ""}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSelectedApp(app);
                    setRejectNotes("");
                  }}
                  className="px-3 py-1.5 bg-brand-copper text-white rounded-lg text-xs font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer"
                >
                  Review
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(app, "approve")}
                  disabled={actingOn === app.id}
                  className="p-1.5 rounded-lg bg-dash-success/10 text-dash-success hover:bg-dash-success/20 transition-colors cursor-pointer disabled:opacity-50"
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
                  onClick={() => handleDecision(app, "reject")}
                  disabled={actingOn === app.id}
                  className="p-1.5 rounded-lg bg-dash-danger/10 text-dash-danger hover:bg-dash-danger/20 transition-colors cursor-pointer disabled:opacity-50"
                  title="Decline"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Applications Table */}
      {(data?.applications ?? []).some((a) => a.status !== "pending") ? (
        <div className="bg-dash-surface rounded-xl border border-dash-border">
          <div className="p-5 border-b border-dash-border">
            <h3 className="text-sm font-semibold text-dash-text">
              Application History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                    Company
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                    Submitted
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.applications
                  .filter((a) => a.status && a.status !== "pending")
                  .map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-dash-text">
                        {app.company}
                      </td>
                      <td className="px-4 py-3 text-dash-text">
                        {app.contact_name}
                      </td>
                      <td className="px-4 py-3 text-dash-text-secondary">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={
                            app.status.charAt(0).toUpperCase() +
                            app.status.slice(1)
                          }
                          variant={statusVariants[app.status] ?? "default"}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Application Review SlideOut */}
      <SlideOut
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Application Review"
      >
        {selectedApp && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-dash-text">
                {selectedApp.company}
              </h3>
              <p className="text-sm text-dash-text-secondary mt-1">
                {selectedApp.contact_name} &middot; {selectedApp.email}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-dash-border">
                <span className="text-sm text-dash-text-secondary">
                  Submitted
                </span>
                <span className="text-sm text-dash-text">
                  {formatDate(selectedApp.created_at)}
                </span>
              </div>
              {selectedApp.business_type ? (
                <div className="flex justify-between py-2 border-b border-dash-border">
                  <span className="text-sm text-dash-text-secondary">
                    Business Type
                  </span>
                  <span className="text-sm text-dash-text">
                    {selectedApp.business_type}
                  </span>
                </div>
              ) : null}
              {selectedApp.website ? (
                <div className="flex justify-between py-2 border-b border-dash-border">
                  <span className="text-sm text-dash-text-secondary">
                    Website
                  </span>
                  <span className="text-sm text-dash-text">
                    {selectedApp.website}
                  </span>
                </div>
              ) : null}
              {selectedApp.license_number ? (
                <div className="flex justify-between py-2 border-b border-dash-border">
                  <span className="text-sm text-dash-text-secondary">
                    License #
                  </span>
                  <span className="text-sm text-dash-text">
                    {selectedApp.license_number}
                  </span>
                </div>
              ) : null}
              {selectedApp.phone ? (
                <div className="flex justify-between py-2 border-b border-dash-border">
                  <span className="text-sm text-dash-text-secondary">
                    Phone
                  </span>
                  <span className="text-sm text-dash-text">
                    {selectedApp.phone}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Tier pill — disabled in v1 */}
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">
                Trade Tier
              </label>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text-muted">
                <span>Default (v1)</span>
                <span title="Tier assignment ships in P3.4">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Reject notes */}
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">
                Notes (shown to applicant on decline)
              </label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper/50 resize-none"
                placeholder="Optional reason for declining…"
              />
            </div>

            <div className="pt-4 border-t border-dash-border">
              <NotesPanel
                entityType="trade_app"
                entityId={selectedApp.id}
              />
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-dash-border">
              <button
                type="button"
                onClick={() => handleDecision(selectedApp, "approve")}
                disabled={actingOn === selectedApp.id}
                className="flex-1 py-2.5 bg-dash-success text-white rounded-lg text-sm font-medium hover:bg-dash-success transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
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
                onClick={() =>
                  handleDecision(selectedApp, "reject", rejectNotes)
                }
                disabled={actingOn === selectedApp.id}
                className="flex-1 py-2.5 bg-dash-danger text-white rounded-lg text-sm font-medium hover:bg-dash-danger transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <XCircle className="w-4 h-4" />
                Decline
              </button>
              <ShareButton
                entityType="trade_app"
                entityId={selectedApp.id}
                summary={`Trade application: ${selectedApp.company} — ${selectedApp.contact_name}`}
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
