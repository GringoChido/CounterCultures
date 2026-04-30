"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CircleDashed,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

type Status = "ok" | "warn" | "error" | "disabled";

type Integration = {
  id: string;
  name: string;
  status: Status;
  detail: string;
  missing: string[];
  action?: { label: string; href: string };
};

const statusMeta: Record<
  Status,
  { label: string; color: string; bg: string; Icon: typeof CheckCircle2 }
> = {
  ok: {
    label: "Connected",
    color: "text-dash-success",
    bg: "bg-dash-success-soft",
    Icon: CheckCircle2,
  },
  warn: {
    label: "Needs attention",
    color: "text-dash-warn",
    bg: "bg-dash-warn-soft",
    Icon: AlertTriangle,
  },
  error: {
    label: "Not configured",
    color: "text-dash-danger",
    bg: "bg-dash-danger-soft",
    Icon: XCircle,
  },
  disabled: {
    label: "Disabled",
    color: "text-dash-text-secondary",
    bg: "bg-dash-bg",
    Icon: CircleDashed,
  },
};

const IntegrationHealthPanel = () => {
  const [integrations, setIntegrations] = useState<Integration[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/integration-health", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { integrations: Integration[] };
      setIntegrations(data.integrations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const okCount = integrations?.filter((i) => i.status === "ok").length ?? 0;
  const totalCount = integrations?.length ?? 0;

  return (
    <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-dash-text">
            Integration Health
          </h3>
          <p className="text-xs text-dash-text-secondary mt-0.5">
            {integrations
              ? `${okCount} of ${totalCount} services connected`
              : "Loading…"}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs text-dash-text-secondary hover:text-brand-copper transition cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Refresh
        </button>
      </div>

      {error ? (
        <p className="text-sm text-dash-danger">{error}</p>
      ) : null}

      {integrations === null && !error ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 bg-dash-bg rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : null}

      {integrations?.length ? (
        <ul className="divide-y divide-dash-border -my-2">
          {integrations.map((i) => {
            const meta = statusMeta[i.status];
            const Icon = meta.Icon;
            return (
              <li
                key={i.id}
                className="flex items-start gap-3 py-3"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}
                >
                  <Icon className={`w-4 h-4 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-dash-text">{i.name}</p>
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wider ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-dash-text-secondary mt-0.5">
                    {i.detail}
                  </p>
                </div>
                {i.action ? (
                  <a
                    href={i.action.href}
                    target={i.action.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      i.action.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 border border-dash-border rounded text-[11px] text-dash-text-secondary hover:text-brand-copper hover:border-brand-copper transition cursor-pointer shrink-0"
                  >
                    {i.action.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

export { IntegrationHealthPanel };
