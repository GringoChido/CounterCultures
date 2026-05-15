"use client";

import Link from "next/link";
import { useCallback, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Bell, Link2, Users, Check, X, ExternalLink, CheckCircle2, Mail, Loader2, AlertCircle, ArrowRight, Percent } from "lucide-react";
import { IntegrationHealthPanel } from "@/app/(dashboard)/components/integration-health-panel";
import { useCurrentUser } from "@/app/lib/use-current-user";

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

const STORAGE_KEY = "cc-portal-settings";

interface SettingsState {
  notifications: NotificationSetting[];
  integrations: Integration[];
}

const defaultSettings: SettingsState = {
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
    if (!stored) return defaultSettings;
    const parsed = JSON.parse(stored) as Partial<SettingsState>;
    // Merge over defaults so removed top-level keys (fullName/email pre-R3-1)
    // don't pollute the shape, and any new keys added later get a fallback.
    return {
      notifications: parsed.notifications ?? defaultSettings.notifications,
      integrations: parsed.integrations ?? defaultSettings.integrations,
    };
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
  const { user, loading: userLoading } = useCurrentUser();

  useEffect(() => {
    setSettings(loadSettings());
    setLoaded(true);
  }, []);

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

  if (!loaded) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Settings</h2>
        <p className="text-sm text-dash-text-secondary mt-1">Manage your account and preferences</p>
      </div>

      {/* Account — read-only; name + email come from the Users sheet */}
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
            <div className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text">
              {userLoading ? "—" : user?.name || "—"}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">Email Address</label>
            <div className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text">
              {userLoading ? "—" : user?.email || "—"}
            </div>
          </div>
          <p className="text-xs text-dash-text-secondary">
            Your name and email come from your row in the Users sheet. An owner can update them in{" "}
            <Link href="/dashboard/settings/users" className="text-brand-copper hover:underline">
              Portal users
            </Link>
            .
          </p>
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
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-dash-surface shadow-sm transition-transform ${
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
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-dash-danger text-dash-danger rounded-lg text-xs font-medium hover:bg-dash-danger-soft transition-colors cursor-pointer"
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

      {/* Team Members — owner-managed via the dedicated admin page */}
      <Link
        href="/dashboard/settings/users"
        className="block bg-dash-surface rounded-xl border border-dash-border p-5 hover:border-brand-copper/40 transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-status-new flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dash-text">Team Members</h3>
              <p className="text-xs text-dash-text-secondary mt-0.5">
                Add, edit, or deactivate accounts and per-user feature access.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-dash-text-secondary group-hover:text-brand-copper transition-colors" />
        </div>
      </Link>

      {/* Tax Rates — finance-managed tax rate registry */}
      <Link
        href="/dashboard/settings/tax-rates"
        className="block bg-dash-surface rounded-xl border border-dash-border p-5 hover:border-brand-copper/40 transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-terracotta/80 flex items-center justify-center">
              <Percent className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dash-text">
                Tasas de impuesto / Tax Rates
              </h3>
              <p className="text-xs text-dash-text-secondary mt-0.5">
                Manage IVA, IEPS, retención, and custom tax rates for bills and invoices.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-dash-text-secondary group-hover:text-brand-copper transition-colors" />
        </div>
      </Link>
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
        <div className="w-9 h-9 rounded-lg bg-dash-danger/10 flex items-center justify-center">
          <Mail className="w-4.5 h-4.5 text-dash-danger" />
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
        <div className="flex items-start gap-2 p-3 bg-dash-warn/10 border border-dash-warn/30 rounded-lg text-xs text-dash-warn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-dash-warn mb-1">OAuth client not configured.</p>
            <p className="text-dash-warn/80">
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
          <div className="flex items-start justify-between gap-3 p-3 bg-dash-success/5 border border-dash-success/20 rounded-lg">
            <div className="min-w-0">
              <p className="text-sm font-medium text-dash-text flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-dash-success" />
                Connected as {status.gmailAddress}
              </p>
              {status.connectedAt && (
                <p className="text-[11px] text-dash-text-secondary mt-1">
                  Since {new Date(status.connectedAt).toLocaleString()}
                </p>
              )}
              {status.lastError && (
                <p className="text-[11px] text-dash-warn mt-1">Last error: {status.lastError}</p>
              )}
            </div>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-dash-danger/30 text-dash-danger rounded-lg text-xs font-medium hover:bg-dash-danger/10 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
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
