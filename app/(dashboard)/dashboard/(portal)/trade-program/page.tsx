"use client";

import { Users, Clock, Percent, DollarSign } from "lucide-react";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";

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
}

const tierColors: Record<Tier, string> = {
  Gold: "bg-amber-100 text-amber-800",
  Silver: "bg-gray-100 text-gray-700",
  Bronze: "bg-orange-100 text-orange-800",
};

const statusVariants: Record<string, BadgeVariant> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
};

const tradeMembers: TradeMember[] = [
  {
    id: "1",
    company: "Martinez Design Group",
    contact: "Elena Martinez",
    tier: "Gold",
    discount: 25,
    status: "active",
    totalOrders: 42,
    revenue: 380000,
  },
  {
    id: "2",
    company: "Coastal Living Interiors",
    contact: "James Patterson",
    tier: "Gold",
    discount: 25,
    status: "active",
    totalOrders: 28,
    revenue: 245000,
  },
  {
    id: "3",
    company: "Hacienda Renovations",
    contact: "Carlos Mendoza",
    tier: "Silver",
    discount: 18,
    status: "active",
    totalOrders: 15,
    revenue: 120000,
  },
  {
    id: "4",
    company: "Pacific Homes Builder",
    contact: "Sarah Kim",
    tier: "Bronze",
    discount: 12,
    status: "pending",
    totalOrders: 3,
    revenue: 35000,
  },
];

const pendingApplications = [
  { company: "Desert Modern Studio", contact: "Ryan Torres", submitted: "Mar 25, 2026" },
  { company: "Oaxaca Craft Collective", contact: "Laura Vega", submitted: "Mar 22, 2026" },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const TradeProgramPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Trade Program</h2>
        <p className="text-sm text-dash-text-secondary mt-1">Manage trade members, tiers, and discounts</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Active Members" value="18" change={12.5} icon={Users} accentColor="bg-brand-copper" />
        <KPICard label="Pending Applications" value="2" icon={Clock} accentColor="bg-status-new" />
        <KPICard label="Avg Discount" value="20%" icon={Percent} accentColor="bg-brand-sage" />
        <KPICard label="Trade Revenue" value="$780K" change={18.3} icon={DollarSign} accentColor="bg-brand-terracotta" />
      </div>

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

      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <h3 className="text-sm font-semibold text-dash-text mb-4">Pending Applications</h3>
        <div className="space-y-3">
          {pendingApplications.map((app) => (
            <div key={app.company} className="flex items-center justify-between py-3 border-b border-dash-border last:border-0">
              <div>
                <p className="text-sm font-medium text-dash-text">{app.company}</p>
                <p className="text-xs text-dash-text-secondary">{app.contact} &middot; Submitted {app.submitted}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-brand-copper text-white rounded-lg text-xs font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer">
                  Review
                </button>
                <button className="px-3 py-1.5 border border-dash-border text-dash-text rounded-lg text-xs font-medium hover:bg-dash-bg transition-colors cursor-pointer">
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TradeProgramPage;
