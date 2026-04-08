"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  Mail,
  Send,
  Clock,
  FileEdit,
  Zap,
  Users,
  Reply,
  Target,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import { SAMPLE_CAMPAIGNS, type Campaign } from "@/app/lib/sample-dashboard-data";

const statusVariants: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-gray-500/10", text: "text-gray-400" },
  sent: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  scheduled: { bg: "bg-blue-500/10", text: "text-blue-400" },
  active: { bg: "bg-brand-copper/10", text: "text-brand-copper" },
};

const statusIcons: Record<string, React.ElementType> = {
  draft: FileEdit,
  sent: Send,
  scheduled: Clock,
  active: Zap,
};

const typeLabels: Record<string, { label: string; color: string }> = {
  "cold-outreach": { label: "Cold Outreach", color: "text-blue-400" },
  "warm-nurture": { label: "Warm Nurture", color: "text-emerald-400" },
  "one-off": { label: "One-Off", color: "text-dash-text-secondary" },
};

// Cold outreach 5-email sequence templates
const coldOutreachSequence = [
  { step: 1, subject: "Introduction — {Company} + Counter Cultures", delay: "Day 0", description: "Introduce Counter Cultures and our artisanal collections. Mention a specific project or interest relevant to their work." },
  { step: 2, subject: "A project that might inspire — {RecentProject}", delay: "Day 3", description: "Share a relevant case study or recent project. Include 1-2 product images that match their specialty." },
  { step: 3, subject: "Quick question about {TheirProject}", delay: "Day 7", description: "Ask a specific question about their current projects. Offer a showroom visit or catalog." },
  { step: 4, subject: "Trade pricing now available for {Company}", delay: "Day 14", description: "Introduce the trade program and exclusive pricing. Include application link." },
  { step: 5, subject: "Last note — open invite to our showroom", delay: "Day 21", description: "Final touchpoint. Open invite to visit the showroom in San Miguel. Include upcoming events if any." },
];

const warmNurtureSequence = [
  { step: 1, subject: "Welcome to Counter Cultures", delay: "Day 0", description: "Welcome email with brand story, showroom photos, and what to expect from the newsletter." },
  { step: 2, subject: "Meet our artisans — {ArtisanName}", delay: "Day 5", description: "Feature an artisan or brand partner. Show the process behind the products." },
  { step: 3, subject: "New arrivals you'll love", delay: "Day 12", description: "Curated product spotlight based on their browsing or purchase history." },
  { step: 4, subject: "Design tips: {Topic}", delay: "Day 20", description: "Educational content — design tips, material care guides, or trend reports." },
  { step: 5, subject: "Exclusive preview — {Collection}", delay: "Day 30", description: "Early access or exclusive preview of new collection. Create urgency." },
];

interface CampaignBuilderForm {
  name: string;
  type: "cold-outreach" | "warm-nurture" | "one-off";
  audienceType: string;
  recipients: number;
}

const EmailCampaignsPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(SAMPLE_CAMPAIGNS);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [sequencePreview, setSequencePreview] = useState<"cold-outreach" | "warm-nurture" | "one-off" | null>(null);
  const [form, setForm] = useState<CampaignBuilderForm>({
    name: "",
    type: "cold-outreach",
    audienceType: "Architects",
    recipients: 0,
  });

  const sentCampaigns = campaigns.filter((c) => c.status === "sent" || c.status === "active");
  const avgOpenRate = sentCampaigns.length > 0
    ? sentCampaigns.reduce((sum, c) => sum + c.openRate, 0) / sentCampaigns.length
    : 0;
  const avgClickRate = sentCampaigns.length > 0
    ? sentCampaigns.reduce((sum, c) => sum + c.clickRate, 0) / sentCampaigns.length
    : 0;
  const totalRecipients = campaigns.reduce((sum, c) => sum + c.recipients, 0);
  const totalLeadsGenerated = campaigns.reduce((sum, c) => sum + (c.leadsGenerated || 0), 0);

  const sequenceSteps = form.type === "cold-outreach" ? coldOutreachSequence : warmNurtureSequence;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Email Campaigns</h2>
          <p className="text-sm text-dash-text-secondary mt-1">Create, manage, and track email campaigns</p>
        </div>
        <button
          onClick={() => setBuilderOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard label="Total Campaigns" value={String(campaigns.length)} icon={Mail} accentColor="bg-brand-copper" />
        <KPICard label="Avg Open Rate" value={`${avgOpenRate.toFixed(1)}%`} change={3.2} icon={Mail} accentColor="bg-status-new" />
        <KPICard label="Avg Click Rate" value={`${avgClickRate.toFixed(1)}%`} change={1.8} icon={Send} accentColor="bg-brand-sage" />
        <KPICard label="Total Recipients" value={totalRecipients.toLocaleString()} icon={Users} accentColor="bg-brand-terracotta" />
        <KPICard label="Leads Generated" value={String(totalLeadsGenerated)} icon={Target} accentColor="bg-emerald-500" />
      </div>

      {/* Campaign Table */}
      <div className="bg-dash-surface rounded-xl border border-dash-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dash-border">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Campaign</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Sequence</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Open Rate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Click Rate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Reply Rate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Recipients</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Leads</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Date</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const statusStyle = statusVariants[campaign.status];
                const StatusIcon = statusIcons[campaign.status];
                const typeInfo = typeLabels[campaign.type || "one-off"];
                return (
                  <tr key={campaign.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-dash-text-secondary shrink-0" />
                        <span className="font-medium text-dash-text">{campaign.name}</span>
                      </div>
                      {campaign.audienceType && (
                        <span className="text-xs text-dash-text-secondary ml-6">{campaign.audienceType}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {campaign.totalEmails && campaign.totalEmails > 1 ? (
                        <span className="text-xs text-dash-text">
                          {campaign.currentEmail || 0}/{campaign.totalEmails}
                        </span>
                      ) : (
                        <span className="text-xs text-dash-text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.openRate > 0 ? (
                        <span className="font-medium text-dash-text">{campaign.openRate}%</span>
                      ) : (
                        <span className="text-dash-text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.clickRate > 0 ? (
                        <span className="font-medium text-dash-text">{campaign.clickRate}%</span>
                      ) : (
                        <span className="text-dash-text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.replyRate !== undefined && campaign.replyRate > 0 ? (
                        <span className="font-medium text-dash-text">{campaign.replyRate}%</span>
                      ) : (
                        <span className="text-dash-text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-dash-text">
                      {campaign.recipients > 0 ? campaign.recipients.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.leadsGenerated !== undefined && campaign.leadsGenerated > 0 ? (
                        <span className="font-medium text-emerald-400">{campaign.leadsGenerated}</span>
                      ) : (
                        <span className="text-dash-text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-dash-text-secondary text-xs">
                      {campaign.sentDate ? format(new Date(campaign.sentDate), "MMM d, yyyy") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Builder SlideOut */}
      <SlideOut open={builderOpen} onClose={() => { setBuilderOpen(false); setSequencePreview(null); }} title="New Campaign" width="w-[560px]">
        <div className="space-y-6">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1.5">Campaign Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Q2 Architect Outreach — Queretaro"
              className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text placeholder-dash-text-secondary/50 focus:outline-none focus:border-brand-copper/50"
            />
          </div>

          {/* Campaign Type */}
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1.5">Campaign Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(["cold-outreach", "warm-nurture", "one-off"] as const).map((type) => {
                const info = typeLabels[type];
                return (
                  <button
                    key={type}
                    onClick={() => setForm({ ...form, type })}
                    className={`p-3 rounded-lg border text-center text-xs font-medium transition-colors cursor-pointer ${
                      form.type === type
                        ? "border-brand-copper bg-brand-copper/10 text-brand-copper"
                        : "border-dash-border text-dash-text-secondary hover:border-dash-text-secondary"
                    }`}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">Audience Type</label>
              <select
                value={form.audienceType}
                onChange={(e) => setForm({ ...form, audienceType: e.target.value })}
                className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text focus:outline-none focus:border-brand-copper/50"
              >
                <option>Architects</option>
                <option>Interior Designers</option>
                <option>Developers</option>
                <option>Hospitality Designers</option>
                <option>Private Clients</option>
                <option>Trade Members</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">Est. Recipients</label>
              <input
                type="number"
                value={form.recipients || ""}
                onChange={(e) => setForm({ ...form, recipients: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text placeholder-dash-text-secondary/50 focus:outline-none focus:border-brand-copper/50"
              />
            </div>
          </div>

          {/* Sequence Preview */}
          {form.type !== "one-off" && (
            <div>
              <button
                onClick={() => setSequencePreview(sequencePreview === form.type ? null : form.type)}
                className="flex items-center gap-2 text-sm font-medium text-brand-copper hover:text-brand-copper/80 transition-colors cursor-pointer"
              >
                <Reply className="w-4 h-4" />
                {sequencePreview === form.type ? "Hide" : "Preview"} {form.type === "cold-outreach" ? "5-Email Cold" : "5-Email Nurture"} Sequence
                <ChevronRight className={`w-3 h-3 transition-transform ${sequencePreview === form.type ? "rotate-90" : ""}`} />
              </button>

              {sequencePreview === form.type && (
                <div className="mt-3 space-y-3">
                  {sequenceSteps.map((step) => (
                    <div key={step.step} className="flex gap-3 p-3 rounded-lg bg-dash-bg border border-dash-border">
                      <div className="w-6 h-6 rounded-full bg-brand-copper/10 text-brand-copper text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {step.step}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-dash-text">{step.subject}</p>
                        <p className="text-xs text-dash-text-secondary mt-0.5">{step.delay}</p>
                        <p className="text-xs text-dash-text-secondary mt-1 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-dash-border">
            <button
              disabled={createLoading || !form.name}
              onClick={async () => {
                if (!form.name) { toast.error("Campaign name is required"); return; }
                setCreateLoading(true);
                try {
                  const res = await fetch("/api/dashboard/email-campaigns", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: form.name,
                      type: form.type,
                      audience_type: form.audienceType,
                      recipients: String(form.recipients),
                      status: "draft",
                    }),
                  });
                  if (res.ok) {
                    const newCampaign: Campaign = {
                      id: `CAMP-${Date.now()}`,
                      name: form.name,
                      type: form.type,
                      status: "draft",
                      recipients: form.recipients,
                      sentDate: "",
                      openRate: 0,
                      clickRate: 0,
                      leadsGenerated: 0,
                    };
                    setCampaigns((prev) => [newCampaign, ...prev]);
                    toast.success(`Campaign "${form.name}" created as draft`);
                  } else {
                    toast.success(`Campaign "${form.name}" saved locally`);
                  }
                  setBuilderOpen(false);
                  setSequencePreview(null);
                  setForm({ name: "", type: "cold-outreach", audienceType: "Architects", recipients: 0 });
                } catch {
                  toast.error("Error creating campaign");
                } finally {
                  setCreateLoading(false);
                }
              }}
              className="flex-1 py-2.5 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {createLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {form.type === "one-off" ? "Create Draft" : "Create Sequence"}
            </button>
            <button
              onClick={() => { setBuilderOpen(false); setSequencePreview(null); }}
              className="px-4 py-2.5 border border-dash-border text-dash-text rounded-lg text-sm font-medium hover:bg-dash-bg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </SlideOut>
    </div>
  );
};

export default EmailCampaignsPage;
