/**
 * Banking fees — auto-post Santander card deposit fees and NetPay
 * processing fees per rules 23-26 of CLAUDE-FINANCE-RULES.
 *
 * Fee rates live in the Bank_Fee_Rates sheet tab and are editable by AP.
 * Posted fee entries are deduplicated by (reference, line_id) to prevent
 * double-posting on re-runs.
 */

import {
  readSheet,
  appendRowByHeader,
} from "./dashboard-sheets";
import { ensureTab } from "./sheet-migrations";

export type FeeSource = "santander" | "netpay";
export type CardType = "debit" | "credit";
export type IssuerCountry = "mexican" | "foreign";

interface FeeRateRow extends Record<string, string> {
  source: string;
  card_type: string;
  issuer_country: string;
  fee_percent: string;
  fixed_fee: string;
  description: string;
  description_es: string;
}

interface FeeEntryRow extends Record<string, string> {
  id: string;
  source: string;
  reference: string;
  line_id: string;
  deposit_amount: string;
  fee_amount: string;
  fee_rate_percent: string;
  currency: string;
  card_type: string;
  issuer_country: string;
  vendor_name: string;
  status: string;
  created_at: string;
  created_by: string;
}

const FEE_RATES_TAB = "Bank_Fee_Rates" as const;
const FEE_ENTRIES_TAB = "Bank_Fee_Entries" as const;

const FEE_RATES_HEADERS = [
  "source",
  "card_type",
  "issuer_country",
  "fee_percent",
  "fixed_fee",
  "description",
  "description_es",
];

const FEE_ENTRIES_HEADERS = [
  "id",
  "source",
  "reference",
  "line_id",
  "deposit_amount",
  "fee_amount",
  "fee_rate_percent",
  "currency",
  "card_type",
  "issuer_country",
  "vendor_name",
  "status",
  "created_at",
  "created_by",
];

let ratesMigrated = false;
let entriesMigrated = false;

const ensureTabs = async () => {
  if (!ratesMigrated) {
    await ensureTab(FEE_RATES_TAB, FEE_RATES_HEADERS);
    ratesMigrated = true;
  }
  if (!entriesMigrated) {
    await ensureTab(FEE_ENTRIES_TAB, FEE_ENTRIES_HEADERS);
    entriesMigrated = true;
  }
};

export interface FeeRate {
  source: FeeSource;
  cardType: CardType;
  issuerCountry: IssuerCountry;
  feePercent: number;
  fixedFee: number;
  description: string;
  descriptionEs: string;
}

export const DEFAULT_FEE_RATES: FeeRate[] = [
  { source: "santander", cardType: "debit", issuerCountry: "mexican", feePercent: 1.65, fixedFee: 0, description: "Santander debit (MX)", descriptionEs: "Santander débito (MX)" },
  { source: "santander", cardType: "credit", issuerCountry: "mexican", feePercent: 2.50, fixedFee: 0, description: "Santander credit (MX)", descriptionEs: "Santander crédito (MX)" },
  { source: "santander", cardType: "debit", issuerCountry: "foreign", feePercent: 2.00, fixedFee: 0, description: "Santander debit (foreign)", descriptionEs: "Santander débito (extranjero)" },
  { source: "santander", cardType: "credit", issuerCountry: "foreign", feePercent: 3.50, fixedFee: 0, description: "Santander credit (foreign)", descriptionEs: "Santander crédito (extranjero)" },
  { source: "netpay", cardType: "debit", issuerCountry: "mexican", feePercent: 1.80, fixedFee: 0, description: "NetPay debit (MX)", descriptionEs: "NetPay débito (MX)" },
  { source: "netpay", cardType: "credit", issuerCountry: "mexican", feePercent: 2.90, fixedFee: 0, description: "NetPay credit (MX)", descriptionEs: "NetPay crédito (MX)" },
  { source: "netpay", cardType: "debit", issuerCountry: "foreign", feePercent: 2.50, fixedFee: 0, description: "NetPay debit (foreign)", descriptionEs: "NetPay débito (extranjero)" },
  { source: "netpay", cardType: "credit", issuerCountry: "foreign", feePercent: 3.80, fixedFee: 0, description: "NetPay credit (foreign)", descriptionEs: "NetPay crédito (extranjero)" },
];

export const NETPAY_MONTHLY_RENTAL = 232;

export const getFeeRates = async (): Promise<FeeRate[]> => {
  await ensureTabs();
  const rows = await readSheet<FeeRateRow>(FEE_RATES_TAB);
  if (rows.length === 0) return DEFAULT_FEE_RATES;
  return rows.map((r) => ({
    source: r.source as FeeSource,
    cardType: r.card_type as CardType,
    issuerCountry: r.issuer_country as IssuerCountry,
    feePercent: parseFloat(r.fee_percent) || 0,
    fixedFee: parseFloat(r.fixed_fee) || 0,
    description: r.description,
    descriptionEs: r.description_es,
  }));
};

export const lookupFeeRate = async (
  source: FeeSource,
  cardType: CardType,
  issuerCountry: IssuerCountry
): Promise<FeeRate | null> => {
  const rates = await getFeeRates();
  return (
    rates.find(
      (r) =>
        r.source === source &&
        r.cardType === cardType &&
        r.issuerCountry === issuerCountry
    ) ?? null
  );
};

export const calculateFee = (
  amount: number,
  rate: FeeRate
): number => {
  return Math.round((amount * rate.feePercent) / 100 * 100) / 100 + rate.fixedFee;
};

export interface FeeEntry {
  id: string;
  source: FeeSource;
  reference: string;
  lineId: string;
  depositAmount: number;
  feeAmount: number;
  feeRatePercent: number;
  currency: string;
  cardType: CardType;
  issuerCountry: IssuerCountry;
  vendorName: string;
  status: string;
  createdAt: string;
  createdBy: string;
}

export const listFeeEntries = async (
  source?: FeeSource
): Promise<FeeEntry[]> => {
  await ensureTabs();
  const rows = await readSheet<FeeEntryRow>(FEE_ENTRIES_TAB);
  const entries = rows.map((r) => ({
    id: r.id,
    source: r.source as FeeSource,
    reference: r.reference,
    lineId: r.line_id,
    depositAmount: parseFloat(r.deposit_amount) || 0,
    feeAmount: parseFloat(r.fee_amount) || 0,
    feeRatePercent: parseFloat(r.fee_rate_percent) || 0,
    currency: r.currency,
    cardType: r.card_type as CardType,
    issuerCountry: r.issuer_country as IssuerCountry,
    vendorName: r.vendor_name,
    status: r.status || "posted",
    createdAt: r.created_at,
    createdBy: r.created_by,
  }));
  return source ? entries.filter((e) => e.source === source) : entries;
};

export const postFeeEntry = async (
  entry: Omit<FeeEntry, "id" | "createdAt" | "status">,
  createdBy: string
): Promise<{ action: "created" | "duplicate"; id: string }> => {
  await ensureTabs();

  const existing = await readSheet<FeeEntryRow>(FEE_ENTRIES_TAB);
  const dup = existing.find(
    (r) => r.reference === entry.reference && r.line_id === entry.lineId
  );
  if (dup) {
    return { action: "duplicate", id: dup.id };
  }

  const id = `BF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await appendRowByHeader(FEE_ENTRIES_TAB, {
    id,
    source: entry.source,
    reference: entry.reference,
    line_id: entry.lineId,
    deposit_amount: String(entry.depositAmount),
    fee_amount: String(entry.feeAmount),
    fee_rate_percent: String(entry.feeRatePercent),
    currency: entry.currency,
    card_type: entry.cardType,
    issuer_country: entry.issuerCountry,
    vendor_name: entry.vendorName,
    status: "posted",
    created_at: new Date().toISOString(),
    created_by: createdBy,
  });

  return { action: "created", id };
};
