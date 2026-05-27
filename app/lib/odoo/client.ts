const ODOO_URL = process.env.ODOO_URL ?? "";
const ODOO_DB = process.env.ODOO_DB ?? "";
const ODOO_USERNAME = process.env.ODOO_USERNAME ?? "";
const ODOO_API_KEY = process.env.ODOO_API_KEY ?? "";

const FETCH_TIMEOUT = 15_000; // 15 seconds

interface OdooRpcResponse {
  jsonrpc: string;
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data: { name: string; message: string; debug: string };
  };
}

const jsonRpc = async (
  url: string,
  method: string,
  params: Record<string, unknown>
): Promise<unknown> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Odoo HTTP error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as OdooRpcResponse;

    if (data.error) {
      throw new Error(
        `Odoo RPC error: ${data.error.message} — ${data.error.data?.message ?? ""}`
      );
    }

    return data.result;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Odoo request timed out (15s)");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};

// Cached authentication to avoid re-authenticating on every call
let cachedUid: number | null = null;
let cacheExpiry = 0;

const getCachedUid = async (): Promise<number> => {
  if (cachedUid && Date.now() < cacheExpiry) return cachedUid;
  cachedUid = await authenticate();
  cacheExpiry = Date.now() + 5 * 60 * 1000; // 5 min
  return cachedUid;
};

const authenticate = async (): Promise<number> => {
  const uid = (await jsonRpc(`${ODOO_URL}/jsonrpc`, "call", {
    service: "common",
    method: "authenticate",
    args: [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}],
  })) as number | false;

  if (!uid && uid !== 0) {
    throw new Error(
      "Odoo authentication failed — check credentials. " +
      "The API key may have expired or been revoked. " +
      "Generate a new one in Odoo → Settings → Users → API Keys."
    );
  }

  return uid as number;
};

const execute = async (
  uid: number,
  model: string,
  method: string,
  args: unknown[],
  kwargs?: Record<string, unknown>
): Promise<unknown> => {
  return jsonRpc(`${ODOO_URL}/jsonrpc`, "call", {
    service: "object",
    method: "execute_kw",
    args: [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs ?? {}],
  });
};

const searchRead = async (
  model: string,
  domain: unknown[] = [],
  fields: string[] = [],
  limit = 100,
  offset = 0,
  order?: string
): Promise<Record<string, unknown>[]> => {
  const uid = await getCachedUid();
  const kwargs: Record<string, unknown> = { fields, limit, offset };
  if (order) kwargs.order = order;

  const result = await execute(uid, model, "search_read", [domain], kwargs);
  return result as Record<string, unknown>[];
};

const searchCount = async (
  model: string,
  domain: unknown[] = []
): Promise<number> => {
  const uid = await getCachedUid();
  const result = await execute(uid, model, "search_count", [domain]);
  return result as number;
};

const read = async (
  model: string,
  ids: number[],
  fields: string[] = []
): Promise<Record<string, unknown>[]> => {
  const uid = await getCachedUid();
  const result = await execute(uid, model, "read", [ids], { fields });
  return result as Record<string, unknown>[];
};

const testConnection = async (): Promise<{
  success: boolean;
  uid?: number;
  serverVersion?: string;
  error?: string;
}> => {
  try {
    const version = (await jsonRpc(`${ODOO_URL}/jsonrpc`, "call", {
      service: "common",
      method: "version",
      args: [],
    })) as { server_version: string };

    const uid = await authenticate();

    return {
      success: true,
      uid,
      serverVersion: version.server_version,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

const isConfigured = (): boolean =>
  Boolean(ODOO_URL && ODOO_DB && ODOO_USERNAME && ODOO_API_KEY);

export interface OdooSaleOrderLineLive {
  id: number;
  product_id: string;
  product_id_id: string;
  name: string;
  product_uom_qty: string;
  qty_delivered: string;
  qty_invoiced: string;
  price_unit: string;
  discount: string;
  price_subtotal: string;
  price_tax: string;
  price_total: string;
  currency_id: string;
  sequence: string;
}

const SALE_LINE_FIELDS = [
  "id",
  "product_id",
  "name",
  "product_uom_qty",
  "qty_delivered",
  "qty_invoiced",
  "price_unit",
  "discount",
  "price_subtotal",
  "price_tax",
  "price_total",
  "currency_id",
  "sequence",
];

const fetchSaleOrderLines = async (
  odooOrderId: number
): Promise<OdooSaleOrderLineLive[]> => {
  const rows = await searchRead(
    "sale.order.line",
    [["order_id", "=", odooOrderId]],
    SALE_LINE_FIELDS,
    200,
    0,
    "sequence asc, id asc"
  );

  return rows.map((r) => {
    const m2o = (v: unknown): [string, string] => {
      if (Array.isArray(v) && v.length === 2) return [String(v[0]), String(v[1])];
      return ["", ""];
    };
    const [productIdId, productIdName] = m2o(r.product_id);
    const [, currencyName] = m2o(r.currency_id);
    return {
      id: r.id as number,
      product_id: productIdName,
      product_id_id: productIdId,
      name: String(r.name ?? ""),
      product_uom_qty: String(r.product_uom_qty ?? "0"),
      qty_delivered: String(r.qty_delivered ?? "0"),
      qty_invoiced: String(r.qty_invoiced ?? "0"),
      price_unit: String(r.price_unit ?? "0"),
      discount: String(r.discount ?? "0"),
      price_subtotal: String(r.price_subtotal ?? "0"),
      price_tax: String(r.price_tax ?? "0"),
      price_total: String(r.price_total ?? "0"),
      currency_id: currencyName,
      sequence: String(r.sequence ?? "0"),
    };
  });
};

const PARTNER_FIELDS_SAFE = [
  "id",
  "name",
  "display_name",
  "is_company",
  "parent_id",
  "commercial_partner_id",
  "email",
  "phone",
  "mobile",
  "website",
  "lang",
  "street",
  "street2",
  "city",
  "state_id",
  "zip",
  "country_id",
  "vat",
  "customer_rank",
  "supplier_rank",
  "category_id",
  "user_id",
  "property_payment_term_id",
  "property_supplier_payment_term_id",
  "property_product_pricelist",
  "property_account_receivable_id",
  "property_account_payable_id",
  "property_account_position_id",
  "credit",
  "debit",
  "credit_limit",
  "bank_ids",
  "total_invoiced",
  "active",
  "comment",
  "company_type",
  "create_date",
  "write_date",
  "child_ids",
];

const PARTNER_FIELDS_MX = [
  "l10n_mx_edi_fiscal_regime",
  "l10n_mx_edi_usage",
];

export interface OdooPartnerLive {
  [key: string]: string;
  id: string;
  name: string;
  display_name: string;
}

const fetchPartners = async (): Promise<OdooPartnerLive[]> => {
  const allFields = [...PARTNER_FIELDS_SAFE];

  for (const mxField of PARTNER_FIELDS_MX) {
    try {
      const probe = await searchRead(
        "res.partner",
        [["id", "=", 1]],
        [mxField],
        1
      );
      if (probe) allFields.push(mxField);
    } catch {
      // field doesn't exist on this instance — skip
    }
  }

  const domain: unknown[] = [
    "|", "|",
    ["customer_rank", ">", 0],
    ["supplier_rank", ">", 0],
    ["is_company", "=", true],
  ];

  const rows = await searchRead(
    "res.partner",
    domain,
    allFields,
    0,
    0,
    "write_date desc"
  );

  const m2oStr = (v: unknown): string => {
    if (Array.isArray(v) && v.length === 2) return String(v[1] ?? "");
    return "";
  };
  const m2oId = (v: unknown): string => {
    if (Array.isArray(v) && v.length === 2) return String(v[0] ?? "");
    return "";
  };
  const x2manyStr = (v: unknown): string => {
    if (Array.isArray(v)) return v.map(String).join("|");
    return "";
  };
  const boolStr = (v: unknown): string => {
    if (v === true) return "True";
    if (v === false) return "False";
    return String(v ?? "");
  };
  const scalar = (v: unknown): string => {
    if (v === false || v === null || v === undefined) return "";
    return String(v);
  };

  return rows.map((r) => ({
    id: String(r.id ?? ""),
    name: scalar(r.name),
    display_name: scalar(r.display_name),
    is_company: boolStr(r.is_company),
    parent_id: m2oStr(r.parent_id),
    parent_id_id: m2oId(r.parent_id),
    commercial_partner_id: m2oStr(r.commercial_partner_id),
    commercial_partner_id_id: m2oId(r.commercial_partner_id),
    email: scalar(r.email),
    phone: scalar(r.phone),
    mobile: scalar(r.mobile),
    website: scalar(r.website),
    lang: scalar(r.lang),
    street: scalar(r.street),
    street2: scalar(r.street2),
    city: scalar(r.city),
    state_id: m2oStr(r.state_id),
    state_id_id: m2oId(r.state_id),
    zip: scalar(r.zip),
    country_id: m2oStr(r.country_id),
    country_id_id: m2oId(r.country_id),
    vat: scalar(r.vat),
    l10n_mx_edi_fiscal_regime: scalar(r.l10n_mx_edi_fiscal_regime),
    l10n_mx_edi_usage: scalar(r.l10n_mx_edi_usage),
    customer_rank: scalar(r.customer_rank),
    supplier_rank: scalar(r.supplier_rank),
    category_id: x2manyStr(r.category_id),
    user_id: m2oStr(r.user_id),
    user_id_id: m2oId(r.user_id),
    property_payment_term_id: m2oStr(r.property_payment_term_id),
    property_payment_term_id_id: m2oId(r.property_payment_term_id),
    property_supplier_payment_term_id: m2oStr(r.property_supplier_payment_term_id),
    property_product_pricelist: m2oStr(r.property_product_pricelist),
    property_product_pricelist_id: m2oId(r.property_product_pricelist),
    property_account_receivable_id: m2oStr(r.property_account_receivable_id),
    property_account_payable_id: m2oStr(r.property_account_payable_id),
    property_account_position_id: m2oStr(r.property_account_position_id),
    credit: scalar(r.credit),
    debit: scalar(r.debit),
    credit_limit: scalar(r.credit_limit),
    bank_ids: x2manyStr(r.bank_ids),
    total_invoiced: scalar(r.total_invoiced),
    active: boolStr(r.active),
    comment: scalar(r.comment),
    company_type: scalar(r.company_type),
    create_date: scalar(r.create_date),
    write_date: scalar(r.write_date),
    child_ids: x2manyStr(r.child_ids),
  }));
};

export {
  authenticate,
  execute,
  searchRead,
  searchCount,
  read,
  testConnection,
  isConfigured,
  fetchSaleOrderLines,
  fetchPartners,
};
