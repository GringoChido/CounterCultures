/**
 * Lead sources — canonical values, normalization, pill colors, and
 * channel-routing helpers. Six "doors in" plus two tagged overlays.
 *
 * Doors:
 *   - WhatsApp · Meta IG · Meta FB · Phone · Email · Walk-in · Website
 * Overlays (not doors, but valid source values):
 *   - Trade Program · Referral
 */

export const LEAD_SOURCES = [
  "WhatsApp",
  "Meta IG",
  "Meta FB",
  "Phone",
  "Email",
  "Walk-in",
  "Website",
  "Trade Program",
  "Referral",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_SOURCE_OPTIONS = ["all", ...LEAD_SOURCES] as const;

/** "Doors" — actual inbound channels (excludes Trade Program / Referral overlays). */
export const LEAD_SOURCE_DOORS: readonly LeadSource[] = [
  "WhatsApp",
  "Meta IG",
  "Meta FB",
  "Phone",
  "Email",
  "Walk-in",
  "Website",
] as const;

/**
 * Normalize legacy source strings persisted in the Leads sheet. Old values
 * like "Showroom Walk-in", "Website Contact Form", "Instagram" predate the
 * R2-1 source taxonomy and need to land in the new canonical set on read.
 */
export function normalizeLeadSource(raw: string | undefined | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const map: Record<string, LeadSource> = {
    "Showroom Walk-in": "Walk-in",
    "Showroom": "Walk-in",
    "Website Contact Form": "Website",
    "Website Form": "Website",
    "Contact Form": "Website",
    "Instagram": "Meta IG",
    "Facebook": "Meta FB",
    "FB": "Meta FB",
    "IG": "Meta IG",
  };
  return map[trimmed] ?? trimmed;
}

export function isLeadSource(value: string): value is LeadSource {
  return (LEAD_SOURCES as readonly string[]).includes(value);
}

/**
 * Tailwind class set for a per-source pill. Colors are intentionally
 * distinct so the kanban + leads table reads at a glance.
 */
export const LEAD_SOURCE_PILL: Record<LeadSource, { bg: string; text: string; border: string; dot: string }> = {
  "WhatsApp":      { bg: "bg-dash-success/10",        text: "text-dash-success",   border: "border-dash-success/30",   dot: "bg-dash-success" },
  "Meta IG":       { bg: "bg-dash-cat-pink/10",       text: "text-dash-cat-pink",  border: "border-dash-cat-pink/30",  dot: "bg-dash-cat-pink" },
  "Meta FB":       { bg: "bg-dash-info/10",           text: "text-dash-info",      border: "border-dash-info/30",      dot: "bg-dash-info" },
  "Phone":         { bg: "bg-dash-warn/10",           text: "text-dash-warn",      border: "border-dash-warn/30",      dot: "bg-dash-warn" },
  "Email":         { bg: "bg-brand-copper/10",        text: "text-brand-copper",   border: "border-brand-copper/30",   dot: "bg-brand-copper" },
  "Walk-in":       { bg: "bg-dash-cat-terracotta/10", text: "text-dash-cat-terracotta", border: "border-dash-cat-terracotta/30", dot: "bg-dash-cat-terracotta" },
  "Website":       { bg: "bg-dash-cat-violet/10",     text: "text-dash-cat-violet",border: "border-dash-cat-violet/30",dot: "bg-dash-cat-violet" },
  "Trade Program": { bg: "bg-dash-cat-lime/10",       text: "text-dash-cat-lime",  border: "border-dash-cat-lime/30",  dot: "bg-dash-cat-lime" },
  "Referral":      { bg: "bg-dash-text-secondary/10", text: "text-dash-text-secondary", border: "border-dash-border", dot: "bg-dash-text-secondary" },
};

/**
 * Default send channels for a source. Walk-in defaults to email-only per R2-3
 * (Roger's correction: walk-ins rarely leave with a printed quote, the common
 * case is build later + email).
 */
export type SendChannel = "email" | "whatsapp" | "print";

export function defaultSendChannels(source: string): SendChannel[] {
  const s = normalizeLeadSource(source);
  switch (s) {
    case "WhatsApp":
      return ["whatsapp", "email"];
    case "Meta IG":
    case "Meta FB":
      return ["email"]; // platform DMs aren't a quote channel — fall back to email
    case "Phone":
      return ["email", "whatsapp"];
    case "Email":
      return ["email"];
    case "Walk-in":
      return ["email"]; // R2-3: email default, print on demand
    case "Website":
      return ["email"];
    case "Trade Program":
    case "Referral":
      return ["email"];
    default:
      return ["email"];
  }
}
