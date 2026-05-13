import { GoogleAuth } from "google-auth-library";
import { sheets as sheetsApi } from "@googleapis/sheets";
import { getGooglePrivateKey } from "./google-private-key";

export interface TradeContext {
  isTrade: boolean;
  tier: string;
}

interface TradePriceRow {
  product_id: string;
  tier: string;
  trade_price: number;
  currency: string;
  effective_from: string;
  effective_to: string;
  notes: string;
}

const SHEET_ID = process.env.GOOGLE_SHEETS_ID_TRADE_PRICING ?? "";
const TAB = "Prices";
const CACHE_TTL = 5 * 60 * 1000;

let cached: { rows: TradePriceRow[]; ts: number } | null = null;
let loading: Promise<TradePriceRow[]> | null = null;

const fetchRows = async (): Promise<TradePriceRow[]> => {
  if (!SHEET_ID) return [];

  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: getGooglePrivateKey(),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = sheetsApi({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A:G`,
  });
  const raw = res.data.values;
  if (!raw || raw.length < 2) return [];

  const [header, ...data] = raw;
  const idx = (col: string) => header.indexOf(col);
  const iId = idx("product_id");
  const iTier = idx("tier");
  const iPrice = idx("trade_price");
  const iCur = idx("currency");
  const iFrom = idx("effective_from");
  const iTo = idx("effective_to");
  const iNotes = idx("notes");

  return data
    .filter((r) => r[iId] && r[iPrice])
    .map((r) => ({
      product_id: (r[iId] ?? "").toString(),
      tier: (r[iTier] ?? "default").toString(),
      trade_price: Number(r[iPrice]) || 0,
      currency: (r[iCur] ?? "MXN").toString(),
      effective_from: (r[iFrom] ?? "").toString(),
      effective_to: (r[iTo] ?? "").toString(),
      notes: (r[iNotes] ?? "").toString(),
    }));
};

const loadTradePrices = async (): Promise<TradePriceRow[]> => {
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.rows;

  if (loading) return loading;

  loading = fetchRows()
    .then((rows) => {
      cached = { rows, ts: Date.now() };
      loading = null;
      return rows;
    })
    .catch((err) => {
      loading = null;
      console.warn(
        "[trade-pricing] load failed:",
        err instanceof Error ? err.message : err
      );
      return cached?.rows ?? [];
    });

  return loading;
};

export const getTradePrice = async (
  productId: string,
  tier: string
): Promise<number | null> => {
  const rows = await loadTradePrices();
  const now = new Date();
  const candidates = rows.filter(
    (r) =>
      r.product_id === productId &&
      (r.tier === tier || r.tier === "default") &&
      (!r.effective_from || new Date(r.effective_from) <= now) &&
      (!r.effective_to || new Date(r.effective_to) >= now)
  );
  const exact = candidates.find((r) => r.tier === tier);
  const fallback = candidates.find((r) => r.tier === "default");
  return (exact ?? fallback)?.trade_price ?? null;
};

export const getTradePriceMap = async (
  productIds: string[],
  tier: string
): Promise<Map<string, number>> => {
  const rows = await loadTradePrices();
  const now = new Date();
  const out = new Map<string, number>();

  for (const pid of productIds) {
    const candidates = rows.filter(
      (r) =>
        r.product_id === pid &&
        (r.tier === tier || r.tier === "default") &&
        (!r.effective_from || new Date(r.effective_from) <= now) &&
        (!r.effective_to || new Date(r.effective_to) >= now)
    );
    const exact = candidates.find((r) => r.tier === tier);
    const fallback = candidates.find((r) => r.tier === "default");
    const price = (exact ?? fallback)?.trade_price;
    if (price != null) out.set(pid, price);
  }

  return out;
};
