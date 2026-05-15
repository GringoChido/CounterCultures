import {
  readSheet,
  appendRowByHeader,
  updateRowByHeader,
  findRowIndex,
  type SheetTab,
} from "./dashboard-sheets";

const CUSTOMERS_TAB: SheetTab = "Customers";
const CUSTOMER_CARTS_TAB: SheetTab = "Customer_Carts";
const PIPELINE_TAB: SheetTab = "Pipeline";

// ── Customer type ────────────────────────────────────────────────────

export interface Customer {
  email: string;
  name: string;
  phone: string;
  default_ship_address: string;
  default_billing_address: string;
  saved_rfc: string;
  factura_default: string;
  locale: string;
  trade_tier: string;
  is_trade: string;
  created_at: string;
  last_login_at: string;
  marketing_opt_in: string;
  notes: string;
}

interface CustomerRow extends Record<string, string> {
  email: string;
  name: string;
  phone: string;
  default_ship_address: string;
  default_billing_address: string;
  saved_rfc: string;
  factura_default: string;
  locale: string;
  trade_tier: string;
  is_trade: string;
  created_at: string;
  last_login_at: string;
  marketing_opt_in: string;
  notes: string;
}

// ── Cache ────────────────────────────────────────────────────────────

const CACHE_TTL = 60_000;
let cache: { at: number; customers: Customer[] } | null = null;

const invalidateCache = () => {
  cache = null;
};

// ── Read ─────────────────────────────────────────────────────────────

export const getAllCustomers = async (): Promise<Customer[]> => {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL) return cache.customers;
  const rows = await readSheet<CustomerRow>(CUSTOMERS_TAB);
  const customers = rows.map((r) => ({
    ...r,
    email: r.email?.toLowerCase().trim() ?? "",
  }));
  cache = { at: now, customers };
  return customers;
};

export const getCustomer = async (
  email: string
): Promise<Customer | null> => {
  const target = email.toLowerCase().trim();
  const all = await getAllCustomers();
  return all.find((c) => c.email === target) ?? null;
};

// ── Upsert ───────────────────────────────────────────────────────────

export interface UpsertCustomerInput {
  email: string;
  name?: string;
  phone?: string;
  locale?: string;
  lastLoginAt: string;
  createdAt?: string;
}

export const upsertCustomer = async (
  input: UpsertCustomerInput
): Promise<{ action: "created" | "updated"; customer: Customer }> => {
  const email = input.email.toLowerCase().trim();
  const now = input.lastLoginAt;
  const existing = await getCustomer(email);

  if (existing) {
    const idx = await findRowIndex(CUSTOMERS_TAB, "email", existing.email);
    if (idx !== null) {
      const fields: Record<string, string> = { last_login_at: now };
      if (input.name && !existing.name) fields.name = input.name;
      if (input.phone && !existing.phone) fields.phone = input.phone;
      await updateRowByHeader(CUSTOMERS_TAB, idx, fields);
      invalidateCache();
    }
    return {
      action: "updated",
      customer: { ...existing, last_login_at: now },
    };
  }

  const customer: Customer = {
    email,
    name: input.name ?? "",
    phone: input.phone ?? "",
    default_ship_address: "",
    default_billing_address: "",
    saved_rfc: "",
    factura_default: "",
    locale: input.locale ?? "es-MX",
    trade_tier: "default",
    is_trade: "FALSE",
    created_at: input.createdAt ?? now,
    last_login_at: now,
    marketing_opt_in: "TRUE",
    notes: "",
  };

  await appendRowByHeader(CUSTOMERS_TAB, customer as unknown as Record<string, string>);
  invalidateCache();
  return { action: "created", customer };
};

// ── Trade status ────────────────────────────────────────────────────

export const setCustomerTrade = async (
  email: string,
  opts: { isTrade: boolean; tier: string }
): Promise<{ action: "created" | "updated" }> => {
  const target = email.toLowerCase().trim();
  const existing = await getCustomer(target);

  if (existing) {
    const idx = await findRowIndex(CUSTOMERS_TAB, "email", existing.email);
    if (idx !== null) {
      await updateRowByHeader(CUSTOMERS_TAB, idx, {
        is_trade: opts.isTrade ? "TRUE" : "FALSE",
        trade_tier: opts.tier,
      });
      invalidateCache();
    }
    return { action: "updated" };
  }

  const now = new Date().toISOString();
  const customer: Customer = {
    email: target,
    name: "",
    phone: "",
    default_ship_address: "",
    default_billing_address: "",
    saved_rfc: "",
    factura_default: "",
    locale: "es-MX",
    trade_tier: opts.tier,
    is_trade: opts.isTrade ? "TRUE" : "FALSE",
    created_at: now,
    last_login_at: "",
    marketing_opt_in: "TRUE",
    notes: "",
  };
  await appendRowByHeader(CUSTOMERS_TAB, customer as unknown as Record<string, string>);
  invalidateCache();
  return { action: "created" };
};

// ── Pipeline backfill ────────────────────────────────────────────────
// On first login, find Pipeline rows whose `email` matches and ensure
// `customer_email` is populated. Idempotent — rows already carrying
// the value are untouched.

interface PipelineRow extends Record<string, string> {
  email: string;
  customer_email: string;
}

export const backfillPipelineByEmail = async (
  email: string
): Promise<number> => {
  const target = email.toLowerCase().trim();
  const rows = await readSheet<PipelineRow>(PIPELINE_TAB);
  let count = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (
      row.email?.toLowerCase().trim() === target &&
      !row.customer_email
    ) {
      await updateRowByHeader(PIPELINE_TAB, i, {
        customer_email: target,
      });
      count++;
    }
  }

  if (count > 0) {
    console.info(
      `[customer-sheet] backfillPipelineByEmail: linked ${count} Pipeline row(s) for ${target}`
    );
  }
  return count;
};

// ── Customer cart persistence ────────────────────────────────────────

interface CartRow extends Record<string, string> {
  email: string;
  cart_json: string;
  updated_at: string;
}

export const getCustomerCart = async (
  email: string
): Promise<{ items: unknown[]; updated_at: string } | null> => {
  const target = email.toLowerCase().trim();
  const rows = await readSheet<CartRow>(CUSTOMER_CARTS_TAB);
  const row = rows.find((r) => r.email?.toLowerCase().trim() === target);
  if (!row?.cart_json) return null;
  try {
    const items = JSON.parse(row.cart_json);
    return { items, updated_at: row.updated_at };
  } catch {
    return null;
  }
};

export const upsertCustomerCart = async (
  email: string,
  items: unknown[]
): Promise<void> => {
  const target = email.toLowerCase().trim();
  const now = new Date().toISOString();
  const cartJson = JSON.stringify(items);

  const idx = await findRowIndex(CUSTOMER_CARTS_TAB, "email", target);
  if (idx !== null) {
    await updateRowByHeader(CUSTOMER_CARTS_TAB, idx, {
      cart_json: cartJson,
      updated_at: now,
    });
  } else {
    await appendRowByHeader(CUSTOMER_CARTS_TAB, {
      email: target,
      cart_json: cartJson,
      updated_at: now,
    });
  }
};
