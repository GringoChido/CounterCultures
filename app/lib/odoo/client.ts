const ODOO_URL = process.env.ODOO_URL ?? "";
const ODOO_DB = process.env.ODOO_DB ?? "";
const ODOO_USERNAME = process.env.ODOO_USERNAME ?? "";
const ODOO_API_KEY = process.env.ODOO_API_KEY ?? "";

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
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
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
};

const authenticate = async (): Promise<number> => {
  const uid = (await jsonRpc(`${ODOO_URL}/jsonrpc`, "call", {
    service: "common",
    method: "authenticate",
    args: [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}],
  })) as number;

  if (!uid) {
    throw new Error("Odoo authentication failed — check credentials");
  }

  return uid;
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
  domain: unknown[][] = [],
  fields: string[] = [],
  limit = 100,
  offset = 0,
  order?: string
): Promise<Record<string, unknown>[]> => {
  const uid = await authenticate();
  const kwargs: Record<string, unknown> = { fields, limit, offset };
  if (order) kwargs.order = order;

  const result = await execute(uid, model, "search_read", [domain], kwargs);
  return result as Record<string, unknown>[];
};

const searchCount = async (
  model: string,
  domain: unknown[][] = []
): Promise<number> => {
  const uid = await authenticate();
  const result = await execute(uid, model, "search_count", [domain]);
  return result as number;
};

const read = async (
  model: string,
  ids: number[],
  fields: string[] = []
): Promise<Record<string, unknown>[]> => {
  const uid = await authenticate();
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

export {
  authenticate,
  execute,
  searchRead,
  searchCount,
  read,
  testConnection,
  isConfigured,
};
