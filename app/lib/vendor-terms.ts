/**
 * Vendor billing terms — Roger's vendors are messier than "net 30 / advance"
 * implies. Five distinct billing patterns determine when AP queues a
 * payment row, what triggers it, and whether the PO can even ship before
 * payment clears.
 *
 *   on-ship       — vendor invoices once goods ship; due = ship-date + terms
 *   on-order      — vendor invoices off the PO; due = PO-date + terms
 *   cash-upfront  — vendor won't start work without payment; blocks send-PO
 *   split-50-50   — 50% upfront + 50% net N off ship-date
 *   never-invoices — artisan / direct vendor; pay-against-PO, manual entry
 *
 * Confirmation pattern (sends-confirmation | no-confirmation) tells the
 * inbox flow whether to expect a vendor email confirming lead times. The
 * Vendors sheet is the source of truth; this module reads it with a
 * seeded fallback so dev environments without the sheet still render.
 *
 * R2-6.
 */

import { readSheet } from "./dashboard-sheets";
import { ensureTab, appendRows } from "./sheet-migrations";

export type BillingTrigger =
  | "on-ship"
  | "on-order"
  | "cash-upfront"
  | "split-50-50"
  | "never-invoices";

export type ConfirmationPattern = "sends-confirmation" | "no-confirmation";

export interface VendorTerms {
  /** Vendor key — matches BRAND_VENDORS.*.default.key (R2-5). */
  vendor: string;
  /** Display name. */
  name: string;
  /** Free-text terms label, e.g. "net 30", "net 10th of month", "advance". */
  creditTerms: string;
  /** Net-N days component, parsed from credit_terms. 0 means cash. */
  termDays: number;
  billingTrigger: BillingTrigger;
  confirmationPattern: ConfirmationPattern;
  defaultLeadTimeDays: number;
  notes: string;
}

interface VendorRow extends Record<string, string> {
  vendor: string;
  name: string;
  credit_terms: string;
  billing_trigger: string;
  confirmation_pattern: string;
  default_lead_time_days: string;
  notes: string;
}

const COLUMNS: (keyof VendorRow)[] = [
  "vendor",
  "name",
  "credit_terms",
  "billing_trigger",
  "confirmation_pattern",
  "default_lead_time_days",
  "notes",
];

/**
 * Seed used to bootstrap the Vendors tab on first read. These values are
 * starting drafts — Roger should overwrite them in the sheet once he sees
 * how a real billing cycle plays out. Lead times and import-ease scores
 * especially are best-current-estimates, not measurements. Edit any cell
 * in the Vendors tab and the next read picks it up after the 5-min cache
 * expires.
 */
const SEED_VENDORS: VendorTerms[] = [
  {
    vendor: "ferguson",
    name: "Ferguson",
    creditTerms: "advance",
    termDays: 0,
    billingTrigger: "cash-upfront",
    confirmationPattern: "sends-confirmation",
    defaultLeadTimeDays: 18,
    notes: "100% cash up front. No credit terms. Supplies Kohler, Brizo, Dornbracht, and other brands.",
  },
  {
    vendor: "jcr",
    name: "JCR",
    creditTerms: "net 10",
    termDays: 10,
    billingTrigger: "on-ship",
    confirmationPattern: "sends-confirmation",
    defaultLeadTimeDays: 22,
    notes: "NET 10 terms. BLANCO authorized. Also sources TOTO depending on stock/price.",
  },
  {
    vendor: "jelp",
    name: "JELP",
    creditTerms: "net 10",
    termDays: 10,
    billingTrigger: "on-ship",
    confirmationPattern: "sends-confirmation",
    defaultLeadTimeDays: 25,
    notes: "Supplies TOTO depending on stock and price availability.",
  },
  {
    vendor: "svb_direct",
    name: "Sun Valley Bronze (direct)",
    creditTerms: "split 50/50",
    termDays: 0,
    billingTrigger: "split-50-50",
    confirmationPattern: "no-confirmation",
    defaultLeadTimeDays: 60,
    notes: "50% deposit for orders over $2,500. Paid in full before shipment.",
  },
  {
    vendor: "california_faucets",
    name: "California Faucets",
    creditTerms: "net 30",
    termDays: 30,
    billingTrigger: "on-order",
    confirmationPattern: "sends-confirmation",
    defaultLeadTimeDays: 28,
    notes: "NET 30, $10,000 credit limit. CF is both a vendor and a brand.",
  },
  {
    vendor: "badeloft",
    name: "Badeloft",
    creditTerms: "split 50/100",
    termDays: 0,
    billingTrigger: "cash-upfront",
    confirmationPattern: "no-confirmation",
    defaultLeadTimeDays: 45,
    notes: "50% deposit if not in stock, 100% before shipment.",
  },
];

const parseTermDays = (raw: string): number => {
  if (!raw) return 0;
  const match = raw.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 0;
};

const isBillingTrigger = (s: string): s is BillingTrigger => {
  return [
    "on-ship",
    "on-order",
    "cash-upfront",
    "split-50-50",
    "never-invoices",
  ].includes(s);
};

const isConfirmationPattern = (s: string): s is ConfirmationPattern =>
  s === "sends-confirmation" || s === "no-confirmation";

const toTerms = (row: VendorRow): VendorTerms | null => {
  const vendor = (row.vendor ?? "").trim();
  if (!vendor) return null;
  const trigger = (row.billing_trigger ?? "").trim().toLowerCase();
  const conf = (row.confirmation_pattern ?? "").trim().toLowerCase();
  return {
    vendor,
    name: (row.name ?? "").trim() || vendor,
    creditTerms: (row.credit_terms ?? "").trim(),
    termDays: parseTermDays(row.credit_terms ?? ""),
    billingTrigger: isBillingTrigger(trigger) ? trigger : "on-ship",
    confirmationPattern: isConfirmationPattern(conf)
      ? conf
      : "sends-confirmation",
    defaultLeadTimeDays:
      Number.parseInt(row.default_lead_time_days ?? "0", 10) || 0,
    notes: (row.notes ?? "").trim(),
  };
};

const CACHE_TTL = 5 * 60 * 1000;
let cache: { at: number; vendors: VendorTerms[] } | null = null;
// In-flight promise so concurrent cold callers share the bootstrap work
// instead of each running ensureTab + appendRows and producing duplicate
// seed rows.
let inflight: Promise<VendorTerms[]> | null = null;

const VENDOR_HEADERS = [
  "vendor",
  "name",
  "credit_terms",
  "billing_trigger",
  "confirmation_pattern",
  "default_lead_time_days",
  "notes",
];

const seedToRow = (v: VendorTerms): string[] => [
  v.vendor,
  v.name,
  v.creditTerms,
  v.billingTrigger,
  v.confirmationPattern,
  String(v.defaultLeadTimeDays),
  v.notes,
];

/**
 * Reads the Vendors sheet. Self-heals on first call: if the tab doesn't
 * exist, creates it and seeds it with SEED_VENDORS so Roger has a
 * starting list rather than an empty surface. Cached for 5 min.
 *
 * Concurrency-safe: a single in-flight bootstrap promise is shared across
 * concurrent cold callers, so two simultaneous requests don't both
 * append the seed rows.
 */
export const getAllVendorTerms = async (): Promise<VendorTerms[]> => {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL) return cache.vendors;
  if (inflight) return inflight;

  inflight = (async (): Promise<VendorTerms[]> => {
    let rows: VendorRow[] = [];
    try {
      rows = await readSheet<VendorRow>("Vendors");
    } catch {
      rows = [];
    }
    // First-run bootstrap: tab missing or empty → create + seed.
    if (rows.length === 0) {
      try {
        await ensureTab("Vendors", VENDOR_HEADERS);
        // Re-read after ensureTab to confirm the tab is empty before we
        // seed — covers the case where another worker raced past the
        // in-memory inflight guard (different process / cold serverless).
        const after = await readSheet<VendorRow>("Vendors");
        if (after.length === 0) {
          await appendRows("Vendors", SEED_VENDORS.map(seedToRow));
        }
        rows = await readSheet<VendorRow>("Vendors");
      } catch (err) {
        // If sheets API write fails (e.g. dev without creds), fall back to
        // in-memory seed so the dashboard still renders.
        console.warn(
          "[vendor-terms] Vendors tab bootstrap failed, using in-memory seed:",
          err instanceof Error ? err.message : err
        );
      }
    }
    const fromSheet = rows
      .map(toTerms)
      .filter((v): v is VendorTerms => v !== null);
    const vendors = fromSheet.length > 0 ? fromSheet : SEED_VENDORS;
    cache = { at: Date.now(), vendors };
    return vendors;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
};

/** Look up one vendor's terms. Case-insensitive on the vendor key. */
export const getVendorTerms = async (
  vendorKey: string
): Promise<VendorTerms | null> => {
  if (!vendorKey) return null;
  const all = await getAllVendorTerms();
  const target = vendorKey.trim().toLowerCase();
  return all.find((v) => v.vendor.toLowerCase() === target) ?? null;
};

export const invalidateVendorTermsCache = (): void => {
  cache = null;
};

// ── Due-date computation ──────────────────────────────────────────────

export interface PoDateContext {
  /** ISO date the PO was created. */
  poDate: string;
  /** ISO date the goods shipped (or are scheduled to ship). Optional. */
  shipDate?: string;
}

export interface QueuedPayment {
  /** Human label for the AP queue ("PO date", "ship + 30", "advance", etc.). */
  label: string;
  /** ISO date the payment is due. Empty when not yet computable (no ship date). */
  dueDate: string;
  /**
   * Fraction of total to pay on this row (1 = full, 0.5 = half).
   */
  fraction: number;
  /**
   * Whether sending the PO is gated on this payment clearing first
   * (cash-upfront, first-half of split-50-50).
   */
  blocksSend: boolean;
  /**
   * Whether this row is auto-queued from terms or requires manual entry.
   * "manual" surfaces in AP as "pay-against-PO".
   */
  source: "auto" | "manual";
}

const isoAddDays = (iso: string, days: number): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * Computes the AP queue rows for a PO based on the vendor's billing
 * trigger and the PO/ship dates. Returns an empty array for never-invoices
 * vendors (manual entry only) — caller should still surface the PO in AP
 * with a "pay-against-PO" badge.
 */
export const computeQueuedPayments = (
  terms: VendorTerms,
  ctx: PoDateContext
): QueuedPayment[] => {
  switch (terms.billingTrigger) {
    case "cash-upfront":
      return [
        {
          label: "Advance — required before send",
          dueDate: ctx.poDate,
          fraction: 1,
          blocksSend: true,
          source: "auto",
        },
      ];
    case "on-order":
      return [
        {
          label: `PO date + ${terms.termDays}d (${terms.creditTerms})`,
          dueDate: isoAddDays(ctx.poDate, terms.termDays),
          fraction: 1,
          blocksSend: false,
          source: "auto",
        },
      ];
    case "on-ship":
      // Ship date is required to compute the due date. Without it we still
      // queue a placeholder row so AP knows it's coming, just with empty
      // dueDate so the UI can render "—".
      return [
        {
          label: `Ship date + ${terms.termDays}d (${terms.creditTerms})`,
          dueDate: ctx.shipDate ? isoAddDays(ctx.shipDate, terms.termDays) : "",
          fraction: 1,
          blocksSend: false,
          source: "auto",
        },
      ];
    case "split-50-50":
      return [
        {
          label: "First 50% — at PO",
          dueDate: ctx.poDate,
          fraction: 0.5,
          blocksSend: true,
          source: "auto",
        },
        {
          label: `Second 50% — ship + ${terms.termDays || 10}d`,
          dueDate: ctx.shipDate
            ? isoAddDays(ctx.shipDate, terms.termDays || 10)
            : "",
          fraction: 0.5,
          blocksSend: false,
          source: "auto",
        },
      ];
    case "never-invoices":
      // Never auto-queue. AP entry is manual; the PO surfaces with a
      // "pay-against-PO" treatment in the queue.
      return [];
    default:
      return [];
  }
};
