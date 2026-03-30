"use client";

import { format } from "date-fns";
import { createColumnHelper } from "@tanstack/react-table";
import { Plus, Mail, Send, Clock, FileEdit } from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";

interface Campaign {
  id: string;
  name: string;
  status: "draft" | "sent" | "scheduled";
  openRate: number;
  clickRate: number;
  recipients: number;
  sentDate: string;
}

const campaigns: Campaign[] = [
  {
    id: "1",
    name: "Spring Collection Launch",
    status: "sent",
    openRate: 42.5,
    clickRate: 8.3,
    recipients: 2450,
    sentDate: "2026-03-15",
  },
  {
    id: "2",
    name: "Trade Program Invitation",
    status: "sent",
    openRate: 56.2,
    clickRate: 15.1,
    recipients: 380,
    sentDate: "2026-03-10",
  },
  {
    id: "3",
    name: "Easter Weekend Sale",
    status: "scheduled",
    openRate: 0,
    clickRate: 0,
    recipients: 3100,
    sentDate: "2026-04-02",
  },
  {
    id: "4",
    name: "New Artisan Spotlight Series",
    status: "draft",
    openRate: 0,
    clickRate: 0,
    recipients: 0,
    sentDate: "",
  },
];

const statusVariants: Record<string, BadgeVariant> = {
  draft: "default",
  sent: "success",
  scheduled: "info",
};

const statusIcons: Record<string, React.ElementType> = {
  draft: FileEdit,
  sent: Send,
  scheduled: Clock,
};

const columnHelper = createColumnHelper<Campaign>();

const columns = [
  columnHelper.accessor("name", {
    header: "Campaign",
    cell: (info) => (
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-dash-text-secondary" />
        <span className="font-medium">{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      const Icon = statusIcons[status];
      return (
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-dash-text-secondary" />
          <StatusBadge label={status.charAt(0).toUpperCase() + status.slice(1)} variant={statusVariants[status]} />
        </div>
      );
    },
  }),
  columnHelper.accessor("openRate", {
    header: "Open Rate",
    cell: (info) => {
      const val = info.getValue();
      return val > 0 ? <span className="font-medium">{val}%</span> : <span className="text-dash-text-secondary">--</span>;
    },
  }),
  columnHelper.accessor("clickRate", {
    header: "Click Rate",
    cell: (info) => {
      const val = info.getValue();
      return val > 0 ? <span className="font-medium">{val}%</span> : <span className="text-dash-text-secondary">--</span>;
    },
  }),
  columnHelper.accessor("recipients", {
    header: "Recipients",
    cell: (info) => {
      const val = info.getValue();
      return val > 0 ? val.toLocaleString() : <span className="text-dash-text-secondary">--</span>;
    },
  }),
  columnHelper.accessor("sentDate", {
    header: "Date",
    cell: (info) => {
      const val = info.getValue();
      return val ? format(new Date(val), "MMM d, yyyy") : <span className="text-dash-text-secondary">--</span>;
    },
  }),
];

const EmailCampaignsPage = () => {
  const totalSent = campaigns.filter((c) => c.status === "sent").length;
  const avgOpenRate = campaigns.filter((c) => c.openRate > 0).reduce((sum, c) => sum + c.openRate, 0) / (totalSent || 1);
  const avgClickRate = campaigns.filter((c) => c.clickRate > 0).reduce((sum, c) => sum + c.clickRate, 0) / (totalSent || 1);
  const totalRecipients = campaigns.reduce((sum, c) => sum + c.recipients, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Email Campaigns</h2>
          <p className="text-sm text-dash-text-secondary mt-1">Create, manage, and track email campaigns</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer">
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Campaigns" value={String(campaigns.length)} icon={Mail} accentColor="bg-brand-copper" />
        <KPICard label="Avg Open Rate" value={`${avgOpenRate.toFixed(1)}%`} change={3.2} icon={Mail} accentColor="bg-status-new" />
        <KPICard label="Avg Click Rate" value={`${avgClickRate.toFixed(1)}%`} change={1.8} icon={Send} accentColor="bg-brand-sage" />
        <KPICard label="Total Recipients" value={totalRecipients.toLocaleString()} icon={Mail} accentColor="bg-brand-terracotta" />
      </div>

      <DataTable
        data={campaigns as unknown as Record<string, unknown>[]}
        columns={columns as never}
        searchKey="name"
        searchPlaceholder="Search campaigns..."
      />
    </div>
  );
};

export default EmailCampaignsPage;
