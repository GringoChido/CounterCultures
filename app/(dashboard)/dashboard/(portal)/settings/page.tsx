"use client";

import { useCallback, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Bell, Link2, Users, Check, X, ExternalLink, CheckCircle2, Mail, Loader2, AlertCircle } from "lucide-react";
import { IntegrationHealthPanel } from "@/app/(dashboard)/components/integration-health-panel";

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

const STORAGE_KEY = "cc-portal-settings";

interface SettingsState {
  fullName: string;
  email: string;
  notifications: NotificationSetting[];
  integrations: Integration[];
}

const defaultSettings: SettingsState = {
  fullName: "Roger Williams",
  email: "roger@countercultures.com",
  notifications: [
    { id: "email", label: "Email Notifications", description: "Receive updates about leads, deals, and reports via email", enabled: true },
    { id: "whatsapp", label: "WhatsApp Notifications", description: "Get notified about new messages and customer inquiries on WhatsApp", enabled: true },
    { id: "browser", label: "Browser Notifications", description: "Show desktop notifications for important events", enabled: false },
  ],
  integrations: [
    { id: "google-sheets", name: "Google Sheets", description: "Sync data with Google Sheets for reporting", connected: true, icon: "GS" },
    { id: "whatsapp-api", name: "WhatsApp Business API", description: "Send and receive WhatsApp messages", connected: true, icon: "WA" },
    { id: "meta-api", name: "Meta Business API", description: "Manage Facebook and Instagram from the Social Hub", connected: false, icon: "FB" },
  ],
};

function loadSettings(): SettingsState {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as SettingsState;
  } catch {
    // ignore
  }
  return defaultSettings;
}

function saveSettings(state: SettingsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const SettingsPageInner = () => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setLoaded(true);
  }, []);

  const handleSaveAccount = () => {
    saveSettings(settings);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const toggleNotification = (id: string) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? { ...n, enabled: !n.enabled } : n
        ),
      };
      saveSettings(next);
      return next;
    });
  };

  const toggleIntegration = (id: string) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        integrations: prev.integrations.map((i) =>
          i.id === id ? { ...i, connected: !i.connected } : i
        ),
      };
      saveSettings(next);
      return next;
    });
  };

  const teamMembers: TeamMember[] = [
    { name: "Roger Williams", email: "roger@countercultures.com", role: "Owner", avatar: "RW" },
    { name: "Elena Martinez", email: "elena@countercultures.com", role: "Sales Manager", avatar: "EM" },
    { name: "Carlos Mendoza", email: "carlos@countercultures.com", role: "Marketing", avatar: "CM" },
  ];

  if (!loaded) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Save toast */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-xl shadow-lg animate-in slide-in-from-right">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Settings saved</span>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-dash-text">Settings</h2>
        <p className="text-sm text-dash-text-secondary mt-1">Manage your account and preferences</p>
      </div>

      {/* Account */}
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
              value={settings.fullName}
              onChange={(e) => setSettings((s) => ({ ...s, fullName: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">Email Address</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
            />
          </div>
          <button
            onClick={handleSaveAccount}
            className="px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-brand-sage flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-dash-text">Notifications</h3>
        </div>
        <div className="space-y-4">
          {settings.notifications.map((setting) => (
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

      <IntegrationHealthPanel />

      <GmailIntegrationCard />

      {/* Integrations */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-brand-terracotta flex items-center justify-center">
            <Link2 className="w-4.5 h-4.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-dash-text">Integrations</h3>
        </div>
        <div className="space-y-4">
          {settings.integrations.map((integration) => (
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
                <button
                  onClick={() => toggleIntegration(integration.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => toggleIntegration(integration.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-copper text-white rounded-lg text-xs font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Team Members */}
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

interface GmailStatus {
  connected: boolean;
  gmailAddress?: string;
  connectedAt?: string;
  lastError?: string;
  oauthConfigured: boolean;
}

const GmailIntegrationCard = () => {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/gmail/status");
      setStatus((await r.json()) as GmailStatus);
    } catch {
      setStatus({ connected: false, oauthConfigured: false });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const result = searchParams.get("gmail");
    if (!result) return;
    if (result === "connected") {
      const as = searchParams.get("as");
      toast.success(`Gmail connected${as ? ` as ${as}` : ""}`);
    } else if (result === "error") {
      toast.error(`Gmail connect failed: ${searchParams.get("reason") ?? "unknown"}`);
    }
    router.replace("/dashboard/settings");
    fetchStatus();
  }, [searchParams, router, fetchStatus]);

  const disconnect = async () => {
    if (!confirm("Disconnect Gmail? The portal inbox will stop loading mail until reconnected.")) {
      return;
    }
    setDisconnecting(true);
    try {
      const r = await fetch("/api/gmail/disconnect", { method: "POST" });
      if (!r.ok) throw new Error();
      toast.success("Gmail disconnected");
      await fetchStatus();
    } catch {
      toast.error("Couldn't disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
          <Mail className="w-4.5 h-4.5 text-red-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-dash-text">Gmail Integration</h3>
          <p className="text-xs text-dash-text-secondary mt-0.5">
            Native inbox, Create Lead from email, thread-on-Deal
          </p>
        </div>
      </div>

      {!status ? (
        <div className="flex items-center gap-2 text-xs text-dash-text-secondary">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking connection…
        </div>
      ) : !status.oauthConfigured ? (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-400 mb-1">OAuth client not configured.</p>
            <p className="text-amber-300/80">
              Add <code className="bg-dash-bg px-1 py-0.5 rounded">GOOGLE_OAUTH_CLIENT_ID</code>{" "}
              and <code className="bg-dash-bg px-1 py-0.5 rounded">GOOGLE_OAUTH_CLIENT_SECRET</code>{" "}
              to <code>.env.local</code> and restart the dev server. Both values
              come from APIs &amp; Services → Credentials in the{" "}
              <code>gen-lang-client-0620971024</code> GCP project.
            </p>
          </div>
        </div>
      ) : status.connected ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div className="min-w-0">
              <p className="text-sm font-medium text-dash-text flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Connected as {status.gmailAddress}
              </p>
              {status.connectedAt && (
                <p className="text-[11px] text-dash-text-secondary mt-1">
                  Since {new Date(status.connectedAt).toLocaleString()}
                </p>
              )}
              {status.lastError && (
                <p className="text-[11px] text-amber-400 mt-1">Last error: {status.lastError}</p>
              )}
            </div>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/10 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
            >
              {disconnecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <X className="w-3 h-3" />
              )}
              Disconnect
            </button>
          </div>
          <p className="text-[11px] text-dash-text-secondary">
            Refresh tokens are encrypted at rest (AES-256-GCM via{" "}
            <code>SESSION_SECRET</code>) and never leave the workspace.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-dash-text-secondary">
            Not connected yet — click to authorize Counter Portal to read and
            send mail on your behalf.
          </p>
          <a
            href="/api/gmail/connect"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-copper text-white rounded-lg text-xs font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            Connect Gmail
          </a>
        </div>
      )}
    </div>
  );
};

// useSearchParams() requires a Suspense boundary at static prerender time.
const SettingsPage = () => (
  <Suspense fallback={null}>
    <SettingsPageInner />
  </Suspense>
);

export default SettingsPage;
