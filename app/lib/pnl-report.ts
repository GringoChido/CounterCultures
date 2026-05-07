/**
 * Profit & Loss report generator.
 *
 * Builds P&L from Odoo invoices (posted state only), separated by company
 * (CC Mexico vs LLC USA). Company assignment uses journal mapping with
 * currency fallback.
 *
 * Revenue  = out_invoice − out_refund  (customer invoices minus credit notes)
 * Expenses = in_invoice − in_refund    (vendor bills minus vendor credit notes)
 * Net      = Revenue − Expenses
 */

import {
  getOdooInvoices,
  getOdooInvoiceLines,
  getOdooPayments,
  type OdooInvoice,
  type OdooInvoiceLine,
} from "./odoo-sheets";
import { getCurrentFXRate, convert, type FXRate } from "./fx";

// ---------------------------------------------------------------------------
// Company detection
// ---------------------------------------------------------------------------

type Company = "cc" | "llc";

const JOURNAL_COMPANY_MAP: Record<string, Company> = {
  santander: "cc",
  banamex: "cc",
  banorte: "cc",
  bbva: "cc",
  hsbc: "cc",
  "wells fargo": "llc",
  "wells": "llc",
  stripe: "llc",
  "bank of america": "llc",
  chase: "llc",
};

const detectCompany = (invoice: OdooInvoice): Company => {
  const journal = (invoice.journal_id ?? "").toLowerCase();
  for (const [key, company] of Object.entries(JOURNAL_COMPANY_MAP)) {
    if (journal.includes(key)) return company;
  }
  const currency = (invoice.currency_id ?? "").toUpperCase();
  if (currency === "USD") return "llc";
  return "cc";
};

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export type PeriodType = "month" | "quarter" | "year" | "custom";

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export const getPeriodRange = (
  type: PeriodType,
  year: number,
  period: number
): DateRange => {
  if (type === "year") {
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
  if (type === "quarter") {
    const startMonth = (period - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const lastDay = new Date(year, endMonth, 0).getDate();
    return {
      start: `${year}-${String(startMonth).padStart(2, "0")}-01`,
      end: `${year}-${String(endMonth).padStart(2, "0")}-${lastDay}`,
    };
  }
  // month
  const lastDay = new Date(year, period, 0).getDate();
  return {
    start: `${year}-${String(period).padStart(2, "0")}-01`,
    end: `${year}-${String(period).padStart(2, "0")}-${lastDay}`,
  };
};

const getPriorPeriod = (
  type: PeriodType,
  year: number,
  period: number
): { year: number; period: number } => {
  if (type === "year") return { year: year - 1, period };
  if (type === "quarter") {
    if (period === 1) return { year: year - 1, period: 4 };
    return { year, period: period - 1 };
  }
  if (period === 1) return { year: year - 1, period: 12 };
  return { year, period: period - 1 };
};

// ---------------------------------------------------------------------------
// P&L line item
// ---------------------------------------------------------------------------

export interface PnLLineItem {
  accountId: string;
  accountName: string;
  amountMXN: number;
  amountUSD: number;
  count: number;
}

export interface PnLSection {
  label: string;
  items: PnLLineItem[];
  totalMXN: number;
  totalUSD: number;
}

export interface PnLReport {
  company: Company | "combined";
  period: { type: PeriodType; year: number; period: number };
  range: DateRange;
  reportCurrency: string;
  fxRate: number | null;

  revenue: PnLSection;
  refunds: PnLSection;
  netRevenue: { totalMXN: number; totalUSD: number };

  expenses: PnLSection;
  expenseRefunds: PnLSection;
  netExpenses: { totalMXN: number; totalUSD: number };

  netIncome: { totalMXN: number; totalUSD: number };

  priorPeriod: {
    netRevenueMXN: number;
    netRevenuUSD: number;
    netExpensesMXN: number;
    netExpensesUSD: number;
    netIncomeMXN: number;
    netIncomeUSD: number;
  } | null;

  cashIn: { totalMXN: number; totalUSD: number };
  cashOut: { totalMXN: number; totalUSD: number };

  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Core aggregation
// ---------------------------------------------------------------------------

const parseDate = (d: string): string | null => {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const inRange = (date: string | null, range: DateRange): boolean => {
  if (!date) return false;
  return date >= range.start && date <= range.end;
};

const buildSection = (
  invoices: OdooInvoice[],
  lines: OdooInvoiceLine[],
  label: string
): PnLSection => {
  const invoiceIds = new Set(invoices.map((i) => i.id));
  const matchedLines = lines.filter(
    (l) => invoiceIds.has(l.move_id_id) || invoiceIds.has(l.move_id)
  );

  const byAccount = new Map<string, PnLLineItem>();

  if (matchedLines.length > 0) {
    for (const line of matchedLines) {
      const inv = invoices.find(
        (i) => i.id === line.move_id_id || i.id === line.move_id
      );
      const cur = (inv?.currency_id ?? line.currency_id ?? "MXN").toUpperCase();
      const amount = Math.abs(parseFloat(line.price_subtotal) || 0);
      const key = line.account_id || "Uncategorized";

      const existing = byAccount.get(key);
      if (existing) {
        if (cur === "USD") existing.amountUSD += amount;
        else existing.amountMXN += amount;
        existing.count++;
      } else {
        byAccount.set(key, {
          accountId: key,
          accountName: key,
          amountMXN: cur === "USD" ? 0 : amount,
          amountUSD: cur === "USD" ? amount : 0,
          count: 1,
        });
      }
    }
  } else {
    for (const inv of invoices) {
      const cur = (inv.currency_id ?? "MXN").toUpperCase();
      const amount = Math.abs(parseFloat(inv.amount_untaxed) || 0);
      const key = inv.journal_id || "General";

      const existing = byAccount.get(key);
      if (existing) {
        if (cur === "USD") existing.amountUSD += amount;
        else existing.amountMXN += amount;
        existing.count++;
      } else {
        byAccount.set(key, {
          accountId: key,
          accountName: key,
          amountMXN: cur === "USD" ? 0 : amount,
          amountUSD: cur === "USD" ? amount : 0,
          count: 1,
        });
      }
    }
  }

  const items = [...byAccount.values()].sort(
    (a, b) => b.amountMXN + b.amountUSD - (a.amountMXN + a.amountUSD)
  );
  const totalMXN = items.reduce((s, i) => s + i.amountMXN, 0);
  const totalUSD = items.reduce((s, i) => s + i.amountUSD, 0);

  return { label, items, totalMXN, totalUSD };
};

const buildCashFlow = (
  payments: { amount: string; currency_id: string; payment_type: string; date: string }[],
  range: DateRange,
  company: Company | "combined",
  invoices: OdooInvoice[]
): { cashIn: { totalMXN: number; totalUSD: number }; cashOut: { totalMXN: number; totalUSD: number } } => {
  const cashIn = { totalMXN: 0, totalUSD: 0 };
  const cashOut = { totalMXN: 0, totalUSD: 0 };

  for (const p of payments) {
    const date = parseDate(p.date);
    if (!inRange(date, range)) continue;

    const amount = Math.abs(parseFloat(p.amount) || 0);
    const cur = (p.currency_id ?? "MXN").toUpperCase();
    const bucket = p.payment_type === "inbound" ? cashIn : cashOut;

    if (cur === "USD") bucket.totalUSD += amount;
    else bucket.totalMXN += amount;
  }

  return { cashIn, cashOut };
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const generatePnLReport = async (opts: {
  company: Company | "combined";
  periodType: PeriodType;
  year: number;
  period: number;
  includePrior?: boolean;
}): Promise<PnLReport> => {
  const { company, periodType, year, period, includePrior = true } = opts;
  const range = getPeriodRange(periodType, year, period);

  const [allInvoices, allLines, allPayments, fx] = await Promise.all([
    getOdooInvoices(),
    getOdooInvoiceLines(),
    getOdooPayments(),
    getCurrentFXRate(),
  ]);

  const filterByCompanyAndDate = (inv: OdooInvoice[], r: DateRange) => {
    return inv.filter((i) => {
      if (i.state !== "posted") return false;
      const d = parseDate(i.invoice_date) ?? parseDate(i.date);
      if (!inRange(d, r)) return false;
      if (company === "combined") return true;
      return detectCompany(i) === company;
    });
  };

  const periodInvoices = filterByCompanyAndDate(allInvoices, range);

  const revenueInvoices = periodInvoices.filter((i) => i.move_type === "out_invoice");
  const refundInvoices = periodInvoices.filter((i) => i.move_type === "out_refund");
  const expenseInvoices = periodInvoices.filter((i) => i.move_type === "in_invoice");
  const expenseRefundInvoices = periodInvoices.filter((i) => i.move_type === "in_refund");

  const revenue = buildSection(revenueInvoices, allLines, "Revenue");
  const refunds = buildSection(refundInvoices, allLines, "Sales Returns & Allowances");
  const expenses = buildSection(expenseInvoices, allLines, "Operating Expenses");
  const expenseRefunds = buildSection(expenseRefundInvoices, allLines, "Vendor Credits");

  const netRevenue = {
    totalMXN: revenue.totalMXN - refunds.totalMXN,
    totalUSD: revenue.totalUSD - refunds.totalUSD,
  };
  const netExpenses = {
    totalMXN: expenses.totalMXN - expenseRefunds.totalMXN,
    totalUSD: expenses.totalUSD - expenseRefunds.totalUSD,
  };
  const netIncome = {
    totalMXN: netRevenue.totalMXN - netExpenses.totalMXN,
    totalUSD: netRevenue.totalUSD - netExpenses.totalUSD,
  };

  const { cashIn, cashOut } = buildCashFlow(allPayments, range, company, allInvoices);

  let priorPeriod: PnLReport["priorPeriod"] = null;
  if (includePrior) {
    const prior = getPriorPeriod(periodType, year, period);
    const priorRange = getPeriodRange(periodType, prior.year, prior.period);
    const priorInvoices = filterByCompanyAndDate(allInvoices, priorRange);

    const priorRev = priorInvoices.filter((i) => i.move_type === "out_invoice");
    const priorRef = priorInvoices.filter((i) => i.move_type === "out_refund");
    const priorExp = priorInvoices.filter((i) => i.move_type === "in_invoice");
    const priorExpRef = priorInvoices.filter((i) => i.move_type === "in_refund");

    const prRevenue = buildSection(priorRev, allLines, "");
    const prRefunds = buildSection(priorRef, allLines, "");
    const prExpenses = buildSection(priorExp, allLines, "");
    const prExpRefunds = buildSection(priorExpRef, allLines, "");

    const prNetRev = {
      mxn: prRevenue.totalMXN - prRefunds.totalMXN,
      usd: prRevenue.totalUSD - prRefunds.totalUSD,
    };
    const prNetExp = {
      mxn: prExpenses.totalMXN - prExpRefunds.totalMXN,
      usd: prExpenses.totalUSD - prExpRefunds.totalUSD,
    };

    priorPeriod = {
      netRevenueMXN: prNetRev.mxn,
      netRevenuUSD: prNetRev.usd,
      netExpensesMXN: prNetExp.mxn,
      netExpensesUSD: prNetExp.usd,
      netIncomeMXN: prNetRev.mxn - prNetExp.mxn,
      netIncomeUSD: prNetRev.usd - prNetExp.usd,
    };
  }

  return {
    company,
    period: { type: periodType, year, period },
    range,
    reportCurrency: company === "llc" ? "USD" : "MXN",
    fxRate: fx?.rate ?? null,
    revenue,
    refunds,
    netRevenue,
    expenses,
    expenseRefunds,
    netExpenses,
    netIncome,
    priorPeriod,
    cashIn,
    cashOut,
    generatedAt: new Date().toISOString(),
  };
};
