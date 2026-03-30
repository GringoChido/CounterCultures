"use client";

import { useState } from "react";
import { User, Bell, Link2, Users, Check, X, ExternalLink } from "lucide-react";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  icon: string;
}

interface TeamMember {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

const SettingsPage = () => {
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { id: "email", label: "Email Notifications", description: "Receive updates about leads, deals, and reports via email", enabled: true },
    { id: "whatsapp", label: "WhatsApp Notifications", description: "Get notified about new messages and customer inquiries on WhatsApp", enabled: true },
    { id: "browser", label: "Browser Notifications", description: "Show desktop notifications for important events", enabled: false },
  ]);

  const [integrations] = useState<Integration[]>([
    { id: "google-sheets", name: "Google Sheets", description: "Sync data with Google Sheets for reporting", connected: true, icon: "GS" },
    { id: "whatsapp-api", name: "WhatsApp Business API", description: "Send and receive WhatsApp messages", connected: true, icon: "WA" },
    { id: "meta-api", name: "Meta Business API", description: "Manage Facebook and Instagram ads", connected: false, icon: "FB" },
  ]);

  const teamMembers: TeamMember[] = [
    { name: "Roger Williams", email: "roger@countercultures.com", role: "Owner", avatar: "RW" },
    { name: "Elena Martinez", email: "elena@countercultures.com", role: "Sales Manager", avatar: "EM" },
    { name: "Carlos Mendoza", email: "carlos@countercultures.com", role: "Marketing", avatar: "CM" },
  ];

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Settings</h2>
        <p className="text-sm text-dash-text-secondary mt-1">Manage your account and preferences</p>
      </div>

      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-brand-copper flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-dash-text">Account</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">Full Name</label>
            <input
              type="text"
              defaultValue="Roger Williams"
              className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">Email Address</label>
            <input
              type="email"
              defaultValue="roger@countercultures.com"
              className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
            />
          </div>
          <button className="px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer">
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-brand-sage flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-dash-text">Notifications</h3>
        </div>
        <div className="space-y-4">
          {notifications.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between py-2 border-b border-dash-border last:border-0">
              <div>
                <p className="text-sm font-medium text-dash-text">{setting.label}</p>
                <p className="text-xs text-dash-text-secondary mt-0.5">{setting.description}</p>
              </div>
              <button
                onClick={() => toggleNotification(setting.id)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  setting.enabled ? "bg-brand-copper" : "bg-dash-bg border border-dash-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    setting.enabled ? "translate-x-5.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-brand-terracotta flex items-center justify-center">
            <Link2 className="w-4.5 h-4.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-dash-text">Integrations</h3>
        </div>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.id} className="flex items-center justify-between py-3 border-b border-dash-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-dash-bg flex items-center justify-center">
                  <span className="text-xs font-bold text-dash-text-secondary">{integration.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-dash-text">{integration.name}</p>
                    {integration.connected && (
                      <span className="flex items-center gap-1 text-[10px] text-status-won font-medium">
                        <Check className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-dash-text-secondary mt-0.5">{integration.description}</p>
                </div>
              </div>
              {integration.connected ? (
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors cursor-pointer">
                  <X className="w-3 h-3" />
                  Disconnect
                </button>
              ) : (
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-copper text-white rounded-lg text-xs font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer">
                  <ExternalLink className="w-3 h-3" />
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-status-new flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-dash-text">Team Members</h3>
          </div>
          <button className="px-3 py-1.5 border border-dash-border text-dash-text rounded-lg text-xs font-medium hover:bg-dash-bg transition-colors cursor-pointer">
            Invite Member
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dash-border">
                <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Member</th>
                <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Email</th>
                <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Role</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.email} className="border-b border-dash-border last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-copper/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-brand-copper">{member.avatar}</span>
                      </div>
                      <span className="font-medium text-dash-text">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-dash-text-secondary">{member.email}</td>
                  <td className="py-3 text-dash-text">{member.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
