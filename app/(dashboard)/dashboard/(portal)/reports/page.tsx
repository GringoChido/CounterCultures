"use client";

import { FileText, Download, RefreshCw, Calendar, TrendingUp, DollarSign, Package, Users } from "lucide-react";

interface Report {
  id: string;
  name: string;
  description: string;
  lastGenerated: string;
  icon: React.ElementType;
  iconColor: string;
}

const reports: Report[] = [
  {
    id: "1",
    name: "Monthly Sales Report",
    description: "Comprehensive breakdown of revenue, deals closed, product performance, and year-over-year comparisons.",
    lastGenerated: "Mar 28, 2026",
    icon: DollarSign,
    iconColor: "bg-brand-copper",
  },
  {
    id: "2",
    name: "Pipeline Health",
    description: "Analysis of deal pipeline stages, conversion rates, average deal velocity, and bottleneck identification.",
    lastGenerated: "Mar 25, 2026",
    icon: TrendingUp,
    iconColor: "bg-status-new",
  },
  {
    id: "3",
    name: "Marketing ROI",
    description: "Return on investment across all marketing channels including paid ads, email campaigns, and social media.",
    lastGenerated: "Mar 20, 2026",
    icon: Calendar,
    iconColor: "bg-brand-sage",
  },
  {
    id: "4",
    name: "Trade Program Summary",
    description: "Trade member activity, tier distribution, discount utilization, and revenue generated through the program.",
    lastGenerated: "Mar 15, 2026",
    icon: Users,
    iconColor: "bg-brand-terracotta",
  },
  {
    id: "5",
    name: "Inventory Status",
    description: "Current stock levels, low-stock alerts, bestsellers, and reorder recommendations across all product categories.",
    lastGenerated: "Mar 10, 2026",
    icon: Package,
    iconColor: "bg-status-qualified",
  },
];

const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Reports</h2>
        <p className="text-sm text-dash-text-secondary mt-1">Generate and download business reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="bg-dash-surface rounded-xl border border-dash-border p-5 hover:border-brand-copper/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${report.iconColor} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-dash-text">{report.name}</h3>
                  <p className="text-xs text-dash-text-secondary mt-1 leading-relaxed">{report.description}</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <FileText className="w-3 h-3 text-dash-text-secondary" />
                    <span className="text-[10px] text-dash-text-secondary">Last generated: {report.lastGenerated}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-copper text-white rounded-lg text-xs font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer">
                      <RefreshCw className="w-3 h-3" />
                      Generate
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-dash-border text-dash-text rounded-lg text-xs font-medium hover:bg-dash-bg transition-colors cursor-pointer">
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <h3 className="text-sm font-semibold text-dash-text mb-4">Scheduled Reports</h3>
        <div className="space-y-3">
          {[
            { name: "Monthly Sales Report", frequency: "1st of every month", recipients: "roger@countercultures.com" },
            { name: "Pipeline Health", frequency: "Every Monday", recipients: "roger@countercultures.com, sales@countercultures.com" },
            { name: "Inventory Status", frequency: "Every Friday", recipients: "warehouse@countercultures.com" },
          ].map((scheduled) => (
            <div key={scheduled.name} className="flex items-center justify-between py-2 border-b border-dash-border last:border-0">
              <div>
                <p className="text-sm font-medium text-dash-text">{scheduled.name}</p>
                <p className="text-xs text-dash-text-secondary mt-0.5">{scheduled.frequency}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-dash-text-secondary">{scheduled.recipients}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
