/**
 * Feature catalog — the universe of toggleable capabilities. Every gated
 * surface in the dashboard maps to one feature here. Adding a new gated
 * surface? Add it to this list, give every role a default, then check it
 * with `hasFeature(user, "...")`.
 *
 * Per-user overrides live in the `Users` sheet's `feature_overrides`
 * column as a pipe-delimited list of `+feature` / `-feature` tokens. `+`
 * grants beyond the role default, `-` revokes from it.
 */

import type { UserRole } from "./users-sheet";

export const FEATURES = {
  // Daily-driver surfaces
  view_today: "Today / overview page",
  view_customers: "Customers list + 360 view",
  view_orders: "Orders + quotes pipeline",
  view_invoices: "Invoices + AR aging",
  view_payments: "Payments + reconciliation",
  view_inbox: "Native Gmail inbox",
  view_inventory: "Stock quants by warehouse",
  view_purchases: "Purchase orders + vendor bills",
  view_vendors: "Vendor 360 — all activity per supplier",
  view_shipments: "Shipments & customs",

  // Operations
  view_brands: "Brand catalog management",
  view_products: "Product catalog management",
  view_blog: "Blog manager",
  view_drive: "Google Drive home",
  view_finance: "Finance overview (legacy)",
  view_cash_bucket: "Off-books cash bucket — owner-only by default (R2-4)",
  view_stripe: "Stripe transactions",
  view_odoo: "Odoo legacy panel",
  view_trade: "Trade program applications",

  // Marketing (mostly placeholders, but role-gated for the future)
  view_marketing: "Marketing analytics + campaigns",
  view_social: "Social media hub",

  // Pipeline / CRM
  view_leads: "Leads list",
  view_pipeline: "Sales pipeline (kanban)",

  // Write actions on Odoo (Cut #3)
  create_quote: "Create new quote on a customer",
  send_quote: "Send a quote via email from your Gmail",
  create_invoice: "Confirm sale → generate invoice",
  cancel_order: "Cancel a sale order (mark dead)",
  send_prefactura: "Send prefactura PDF to client for approval (gmail-backed)",
  approve_prefactura: "Mark a client's prefactura as approved (unlocks CFDI attach)",
  attach_cfdi: "Attach CFDI XML + PDF to an invoice (uploads to Odoo + Drive)",
  register_payment: "Mark a payment received and reconcile",
  send_payment_link: "Generate a Stripe payment link for an invoice",

  // System
  manage_users: "Add / edit / deactivate portal users",
  manage_settings: "Edit portal-wide settings",
} as const;

export type Feature = keyof typeof FEATURES;

const ALL_FEATURES = Object.keys(FEATURES) as Feature[];

const FINANCE_FEATURES: Feature[] = [
  "view_today",
  "view_customers",
  "view_orders",
  "view_invoices",
  "view_payments",
  "view_purchases",
  "view_vendors",
  "view_inbox",
  "view_finance",
  "view_stripe",
  "send_prefactura",
  "approve_prefactura",
  "attach_cfdi",
  "register_payment",
  "send_payment_link",
];

const SALES_FEATURES: Feature[] = [
  "view_today",
  "view_customers",
  "view_orders",
  "view_vendors",
  "view_inventory",
  "view_inbox",
  "view_shipments",
  "view_leads",
  "view_pipeline",
  "view_brands",
  "view_products",
  "create_quote",
  "send_quote",
  "send_prefactura",
  "send_payment_link",
  "cancel_order",
];

export const ROLE_DEFAULTS: Record<UserRole, Feature[]> = {
  owner: ALL_FEATURES,
  finance: FINANCE_FEATURES,
  sales: SALES_FEATURES,
};

interface ParsedOverrides {
  add: Set<Feature>;
  remove: Set<Feature>;
}

const parseOverrides = (raw: string | undefined | null): ParsedOverrides => {
  const add = new Set<Feature>();
  const remove = new Set<Feature>();
  if (!raw) return { add, remove };
  for (const tokenRaw of raw.split("|")) {
    const token = tokenRaw.trim();
    if (!token) continue;
    const sign = token[0];
    const name = token.slice(1) as Feature;
    if (!(name in FEATURES)) continue;
    if (sign === "+") add.add(name);
    else if (sign === "-") remove.add(name);
  }
  return { add, remove };
};

export interface FeatureContext {
  role: UserRole;
  featureOverrides?: string;
}

export const hasFeature = (
  ctx: FeatureContext,
  feature: Feature
): boolean => {
  const { add, remove } = parseOverrides(ctx.featureOverrides);
  if (remove.has(feature)) return false;
  if (add.has(feature)) return true;
  return ROLE_DEFAULTS[ctx.role].includes(feature);
};

export const computeEnabledFeatures = (ctx: FeatureContext): Feature[] => {
  const { add, remove } = parseOverrides(ctx.featureOverrides);
  const base = new Set<Feature>(ROLE_DEFAULTS[ctx.role]);
  for (const f of add) base.add(f);
  for (const f of remove) base.delete(f);
  return [...base];
};

/**
 * Diffs a desired set of features against the role default and produces the
 * minimal `feature_overrides` string. Features matching the role default
 * yield no token. Features added beyond the default → `+name`. Features
 * removed from the default → `-name`.
 */
export const buildOverridesString = (
  role: UserRole,
  desired: Iterable<Feature>
): string => {
  const desiredSet = new Set<Feature>(desired);
  const defaultSet = new Set<Feature>(ROLE_DEFAULTS[role]);
  const tokens: string[] = [];
  for (const f of ALL_FEATURES) {
    const inDesired = desiredSet.has(f);
    const inDefault = defaultSet.has(f);
    if (inDesired && !inDefault) tokens.push(`+${f}`);
    else if (!inDesired && inDefault) tokens.push(`-${f}`);
  }
  return tokens.join("|");
};

export const ALL_FEATURE_KEYS = ALL_FEATURES;
