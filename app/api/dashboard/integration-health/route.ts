/**
 * GET /api/dashboard/integration-health
 *
 * Single endpoint that reports the configured/connected state of every
 * integration the portal depends on. Drives the Integration Health panel
 * on the Settings page so Roger can see which services are wired at a
 * glance instead of hunting through .env.local.
 *
 * Each check is cheap: we only introspect env vars and call services
 * whose "isConfigured"-shaped helpers are already in the codebase. We
 * deliberately do NOT probe live Stripe/Drive APIs here — that would
 * slow the page and risk paging rate limits. The panel can be extended
 * with deeper probes later.
 */

import { NextResponse } from "next/server";
import { isConfigured as isStripeConfigured } from "@/app/lib/stripe";
import { isConfigured as isDriveConfigured } from "@/app/lib/google-drive";

type Status = "ok" | "warn" | "error" | "disabled";

type IntegrationStatus = {
  id: string;
  name: string;
  status: Status;
  detail: string;
  missing: string[];
  action?: { label: string; href: string };
};

const envPresent = (keys: string[]): { present: string[]; missing: string[] } => {
  const present: string[] = [];
  const missing: string[] = [];
  for (const k of keys) {
    if (process.env[k] && process.env[k] !== "") present.push(k);
    else missing.push(k);
  }
  return { present, missing };
};

export const GET = async () => {
  const integrations: IntegrationStatus[] = [];

  // ── Google Sheets / Drive (service account) ─────────────────────────
  {
    const { missing } = envPresent([
      "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      "GOOGLE_PRIVATE_KEY",
      "GOOGLE_SHEETS_ID",
      "GOOGLE_DRIVE_FOLDER_ID",
    ]);
    const ok = missing.length === 0 && isDriveConfigured();
    integrations.push({
      id: "google-workspace",
      name: "Google Workspace",
      status: ok ? "ok" : "error",
      detail: ok
        ? "Service account connected for Sheets + Drive reads/writes"
        : `Missing: ${missing.join(", ")}`,
      missing,
    });
  }

  // ── Gmail (per-user OAuth) ──────────────────────────────────────────
  {
    const { missing } = envPresent([
      "GOOGLE_OAUTH_CLIENT_ID",
      "GOOGLE_OAUTH_CLIENT_SECRET",
    ]);
    integrations.push({
      id: "gmail",
      name: "Gmail",
      status: missing.length === 0 ? "ok" : "error",
      detail:
        missing.length === 0
          ? "OAuth credentials configured — per-user connection required"
          : `Missing OAuth credentials: ${missing.join(", ")}`,
      missing,
      action: { label: "Configure", href: "/dashboard/settings?tab=gmail" },
    });
  }

  // ── Stripe ──────────────────────────────────────────────────────────
  {
    const { missing } = envPresent([
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
    ]);
    const configured = isStripeConfigured();
    const webhookOk = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
    let status: Status;
    let detail: string;
    if (!configured) {
      status = "error";
      detail = "STRIPE_SECRET_KEY not set — payments disabled";
    } else if (!webhookOk) {
      status = "warn";
      detail =
        "STRIPE_WEBHOOK_SECRET not set — webhook returns 503 and events are silently dropped";
    } else {
      status = "ok";
      detail = "Live mode configured with webhook verification";
    }
    integrations.push({
      id: "stripe",
      name: "Stripe",
      status,
      detail,
      missing,
      action: {
        label: "Stripe Dashboard",
        href: "https://dashboard.stripe.com/webhooks",
      },
    });
  }

  // ── Resend (transactional email) ────────────────────────────────────
  {
    const { missing } = envPresent(["RESEND_API_KEY"]);
    integrations.push({
      id: "resend",
      name: "Resend",
      status: missing.length === 0 ? "ok" : "error",
      detail:
        missing.length === 0
          ? "Transactional email configured"
          : "RESEND_API_KEY not set — trade approvals and reminders won't send",
      missing,
      action: {
        label: "Resend Dashboard",
        href: "https://resend.com/api-keys",
      },
    });
  }

  // ── WhatsApp (Meta Cloud API) ───────────────────────────────────────
  {
    const enabled = process.env.WHATSAPP_ENABLED === "true";
    const { missing } = envPresent([
      "WHATSAPP_PHONE_NUMBER_ID",
      "WHATSAPP_ACCESS_TOKEN",
    ]);
    let status: Status;
    let detail: string;
    if (!enabled) {
      status = "disabled";
      detail =
        'WHATSAPP_ENABLED is not "true" — all WhatsApp sends run in dry-run mode';
    } else if (missing.length > 0) {
      status = "error";
      detail = `Enabled but missing credentials: ${missing.join(", ")}`;
    } else {
      status = "ok";
      detail = "Enabled with Meta Cloud API credentials";
    }
    integrations.push({
      id: "whatsapp",
      name: "WhatsApp Business",
      status,
      detail,
      missing,
    });
  }

  // ── Meta Graph API (Facebook + Instagram / Social Hub) ──────────────
  {
    const { missing } = envPresent([
      "META_PAGE_ACCESS_TOKEN",
      "META_PAGE_ID",
      "META_INSTAGRAM_ACCOUNT_ID",
    ]);
    integrations.push({
      id: "meta-graph",
      name: "Meta Graph (FB + IG)",
      status: missing.length === 0 ? "ok" : "error",
      detail:
        missing.length === 0
          ? "Social Hub connected to Meta Page + Instagram"
          : `Missing: ${missing.join(", ")} — Social Hub runs in demo mode`,
      missing,
    });
  }

  // ── Anthropic (AI features) ────────────────────────────────────────
  {
    const { missing } = envPresent(["ANTHROPIC_API_KEY"]);
    integrations.push({
      id: "anthropic",
      name: "Anthropic",
      status: missing.length === 0 ? "ok" : "warn",
      detail:
        missing.length === 0
          ? "AI assistant available"
          : "ANTHROPIC_API_KEY not set — AI features disabled",
      missing,
    });
  }

  // ── Odoo (deprecated, data-import only) ────────────────────────────
  {
    const { missing } = envPresent([
      "ODOO_URL",
      "ODOO_DB",
      "ODOO_USERNAME",
      "ODOO_API_KEY",
    ]);
    const status: Status = missing.length === 0 ? "warn" : "disabled";
    integrations.push({
      id: "odoo",
      name: "Odoo (data import)",
      status,
      detail:
        status === "warn"
          ? "Configured — data-import mode only, retirement planned"
          : "Not configured — retirement in progress",
      missing,
    });
  }

  // ── Cron (Netlify scheduled functions) ─────────────────────────────
  {
    const { missing } = envPresent(["CRON_PROBE_KEY"]);
    integrations.push({
      id: "cron",
      name: "Scheduled Jobs",
      status: missing.length === 0 ? "ok" : "warn",
      detail:
        missing.length === 0
          ? "Nightly stale-deal sweep protected with shared secret"
          : "CRON_PROBE_KEY not set — /api/cron/* routes are unauthenticated",
      missing,
    });
  }

  return NextResponse.json({ integrations });
};
