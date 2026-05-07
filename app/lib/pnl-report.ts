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
import { getCurrentFXRate } from "./fx";

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
// Chart of Accounts classification
// ---------------------------------------------------------------------------

type COASection =
  | "revenue"
  | "cogs"
  | "import_costs"
  | "opex"
  | "adjustments"
  | "other";

interface COAClassification {
  section: COASection;
  categoryCode: string;
  categoryLabel: string;
}

const extractAccountCode = (accountId: string): number | null => {
  const match = accountId.match(/^(\d{4,6})/);
  return match ? parseInt(match[1], 10) : null;
};

const classifyAccount = (accountId: string): COAClassification => {
  const num = extractAccountCode(accountId);

  if (num !== null) {
    if (num >= 400000 && num < 500000) {
      if (num >= 411000 && num < 412000)
        return { section: "revenue", categoryCode: "411", categoryLabel: "Export Sales" };
      return { section: "revenue", categoryCode: "410", categoryLabel: "Domestic Sales" };
    }
    if (num >= 500000 && num < 520000)
      return { section: "cogs", categoryCode: "510", categoryLabel: "Cost of Sales" };
    if (num >= 520000 && num < 600000) {
      if (num >= 520100 && num < 520110) return { section: "import_costs", categoryCode: "520100", categoryLabel: "IGI (Import Duty)" };
      if (num >= 520110 && num < 520120) return { section: "import_costs", categoryCode: "520110", categoryLabel: "DTA" };
      if (num >= 520120 && num < 520130) return { section: "import_costs", categoryCode: "520120", categoryLabel: "PRV" };
      if (num >= 520130 && num < 520140) return { section: "import_costs", categoryCode: "520130", categoryLabel: "Broker Fees" };
      if (num >= 520140 && num < 520150) return { section: "import_costs", categoryCode: "520140", categoryLabel: "Freight" };
      if (num >= 520150 && num < 520160) return { section: "import_costs", categoryCode: "520150", categoryLabel: "Handling & Storage" };
      return { section: "import_costs", categoryCode: "520", categoryLabel: "Other Import Costs" };
    }
    if (num >= 690000 && num < 700000) {
      if (num >= 690100 && num < 690200) return { section: "adjustments", categoryCode: "690100", categoryLabel: "FX Gain/Loss" };
      if (num >= 690200 && num < 690300) return { section: "adjustments", categoryCode: "690200", categoryLabel: "Variances" };
      return { section: "adjustments", categoryCode: "690", categoryLabel: "Other Adjustments" };
    }
    if (num >= 600000 && num < 690000) {
      if (num >= 610000 && num < 620000) return { section: "opex", categoryCode: "610", categoryLabel: "Administrative" };
      if (num >= 620000 && num < 630000) return { section: "opex", categoryCode: "620", categoryLabel: "Selling" };
      if (num >= 630000 && num < 640000) return { section: "opex", categoryCode: "630", categoryLabel: "Financial" };
      return { section: "opex", categoryCode: "600", categoryLabel: "Other Operating" };
    }
  }

  const lower = accountId.toLowerCase();
  if (lower.includes("venta") || lower.includes("revenue") || lower.includes("ingreso"))
    return { section: "revenue", categoryCode: "410", categoryLabel: "Domestic Sales" };
  if (lower.includes("costo de venta") || lower.includes("cost of goods") || lower.includes("cogs"))
    return { section: "cogs", categoryCode: "510", categoryLabel: "Cost of Sales" };
  if (lower.includes("igi") || lower.includes("dta") || lower.includes("prv") || lower.includes("import") || lower.includes("aduana") || lower.includes("pedimento"))
    return { section: "import_costs", categoryCode: "520", categoryLabel: "Import Costs" };
  if (lower.includes("tipo de cambio") || lower.includes("exchange") || lower.includes("varianz") || lower.includes("variance"))
    return { section: "adjustments", categoryCode: "690", categoryLabel: "Adjustments" };

  return { section: "opex", categoryCode: "600", categoryLabel: "Other Operating" };
};

// ---------------------------------------------------------------------------
// P&L types
// ---------------------------------------------------------------------------

export interface PnLLineItem {
  accountId: string;
  accountName: string;
  amountMXN: number;
  amountUSD: number;
  count: number;
}

export interface PnLCategory {
  code: string;
  label: string;
  items: PnLLineItem[];
  totalMXN: number;
  totalUSD: number;
}

export interface PnLSection {
  label: string;
  categories: PnLCategory[];
  totalMXN: number;
  totalUSD: number;
}

export interface PnLPriorTotals {
  netRevenueMXN: number;
  netRevenueUSD: number;
  cogsMXN: number;
  cogsUSD: number;
  importCostsMXN: number;
  importCostsUSD: number;
  grossProfitMXN: number;
  grossProfitUSD: number;
  opexMXN: number;
  opexUSD: number;
  adjustmentsMXN: number;
  adjustmentsUSD: number;
  totalExpensesMXN: number;
  totalExpensesUSD: number;
  netIncomeMXN: number;
  netIncomeUSD: number;
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

  cogs: PnLSection;
  importCosts: PnLSection;
  grossProfit: { totalMXN: number; totalUSD: number };

  opex: PnLSection;
  adjustments: PnLSection;
  expenseCredits: PnLSection;
  totalExpenses: { totalMXN: number; totalUSD: number };

  netIncome: { totalMXN: number; totalUSD: number };

  priorPeriod: PnLPriorTotals | null;

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

const aggregateLines = (
  invoices: OdooInvoice[],
  lines: OdooInvoiceLine[]
): PnLLineItem[] => {
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

  return [...byAccount.values()].sort(
    (a, b) => b.amountMXN + b.amountUSD - (a.amountMXN + a.amountUSD)
  );
};

const buildSection = (items: PnLLineItem[], label: string): PnLSection => {
  const catMap = new Map<string, { label: string; items: PnLLineItem[] }>();

  for (const item of items) {
    const cls = classifyAccount(item.accountId);
    const key = cls.categoryCode;
    const cat = catMap.get(key);
    if (cat) {
      cat.items.push(item);
    } else {
      catMap.set(key, { label: cls.categoryLabel, items: [item] });
    }
  }

  const categories: PnLCategory[] = [...catMap.entries()]
    .map(([code, cat]) => ({
      code,
      label: cat.label,
      items: cat.items.sort((a, b) => b.amountMXN + b.amountUSD - (a.amountMXN + a.amountUSD)),
      totalMXN: cat.items.reduce((s, i) => s + i.amountMXN, 0),
      totalUSD: cat.items.reduce((s, i) => s + i.amountUSD, 0),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  return {
    label,
    categories,
    totalMXN: categories.reduce((s, c) => s + c.totalMXN, 0),
    totalUSD: categories.reduce((s, c) => s + c.totalUSD, 0),
  };
};

const buildSimpleSection = (items: PnLLineItem[], label: string): PnLSection => {
  const totalMXN = items.reduce((s, i) => s + i.amountMXN, 0);
  const totalUSD = items.reduce((s, i) => s + i.amountUSD, 0);
  if (items.length === 0) return { label, categories: [], totalMXN: 0, totalUSD: 0 };
  return {
    label,
    categories: [{ code: "0", label, items, totalMXN, totalUSD }],
    totalMXN,
    totalUSD,
  };
};

interface ExpenseBreakdown {
  cogs: PnLSection;
  importCosts: PnLSection;
  opex: PnLSection;
  adjustments: PnLSection;
}

const splitExpensesByCOA = (items: PnLLineItem[]): ExpenseBreakdown => {
  const buckets: Record<COASection, PnLLineItem[]> = {
    revenue: [], cogs: [], import_costs: [], opex: [], adjustments: [], other: [],
  };

  for (const item of items) {
    const cls = classifyAccount(item.accountId);
    buckets[cls.section].push(item);
  }

  buckets.opex.push(...buckets.other);

  return {
    cogs: buildSection(buckets.cogs, "Cost of Goods Sold"),
    importCosts: buildSection(buckets.import_costs, "Import Costs"),
    opex: buildSection(buckets.opex, "Operating Expenses"),
    adjustments: buildSection(buckets.adjustments, "Adjustments"),
  };
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
  const expenseCreditInvoices = periodInvoices.filter((i) => i.move_type === "in_refund");

  const revenueItems = aggregateLines(revenueInvoices, allLines);
  const refundItems = aggregateLines(refundInvoices, allLines);
  const expenseItems = aggregateLines(expenseInvoices, allLines);
  const creditItems = aggregateLines(expenseCreditInvoices, allLines);

  const revenue = buildSection(revenueItems, "Revenue");
  const refunds = buildSimpleSection(refundItems, "Sales Returns & Allowances");
  const { cogs, importCosts, opex, adjustments } = splitExpensesByCOA(expenseItems);
  const expenseCredits = buildSimpleSection(creditItems, "Vendor Credits");

  const netRevenue = {
    totalMXN: revenue.totalMXN - refunds.totalMXN,
    totalUSD: revenue.totalUSD - refunds.totalUSD,
  };

  const grossExpenseMXN = cogs.totalMXN + importCosts.totalMXN;
  const grossExpenseUSD = cogs.totalUSD + importCosts.totalUSD;
  const grossProfit = {
    totalMXN: netRevenue.totalMXN - grossExpenseMXN,
    totalUSD: netRevenue.totalUSD - grossExpenseUSD,
  };

  const allExpMXN = grossExpenseMXN + opex.totalMXN + adjustments.totalMXN - expenseCredits.totalMXN;
  const allExpUSD = grossExpenseUSD + opex.totalUSD + adjustments.totalUSD - expenseCredits.totalUSD;
  const totalExpenses = { totalMXN: allExpMXN, totalUSD: allExpUSD };

  const netIncome = {
    totalMXN: netRevenue.totalMXN - allExpMXN,
    totalUSD: netRevenue.totalUSD - allExpUSD,
  };

  const { cashIn, cashOut } = buildCashFlow(allPayments, range, company, allInvoices);

  let priorPeriod: PnLPriorTotals | null = null;
  if (includePrior) {
    const prior = getPriorPeriod(periodType, year, period);
    const priorRange = getPeriodRange(periodType, prior.year, prior.period);
    const priorInvoices = filterByCompanyAndDate(allInvoices, priorRange);

    const prRevItems = aggregateLines(priorInvoices.filter((i) => i.move_type === "out_invoice"), allLines);
    const prRefItems = aggregateLines(priorInvoices.filter((i) => i.move_type === "out_refund"), allLines);
    const prExpItems = aggregateLines(priorInvoices.filter((i) => i.move_type === "in_invoice"), allLines);
    const prCredItems = aggregateLines(priorInvoices.filter((i) => i.move_type === "in_refund"), allLines);

    const prRev = buildSection(prRevItems, "");
    const prRef = buildSimpleSection(prRefItems, "");
    const prExp = splitExpensesByCOA(prExpItems);
    const prCred = buildSimpleSection(prCredItems, "");

    const prNetRev = { mxn: prRev.totalMXN - prRef.totalMXN, usd: prRev.totalUSD - prRef.totalUSD };
    const prCogsMXN = prExp.cogs.totalMXN + prExp.importCosts.totalMXN;
    const prCogsUSD = prExp.cogs.totalUSD + prExp.importCosts.totalUSD;
    const prAllExpMXN = prCogsMXN + prExp.opex.totalMXN + prExp.adjustments.totalMXN - prCred.totalMXN;
    const prAllExpUSD = prCogsUSD + prExp.opex.totalUSD + prExp.adjustments.totalUSD - prCred.totalUSD;

    priorPeriod = {
      netRevenueMXN: prNetRev.mxn,
      netRevenueUSD: prNetRev.usd,
      cogsMXN: prExp.cogs.totalMXN,
      cogsUSD: prExp.cogs.totalUSD,
      importCostsMXN: prExp.importCosts.totalMXN,
      importCostsUSD: prExp.importCosts.totalUSD,
      grossProfitMXN: prNetRev.mxn - prCogsMXN,
      grossProfitUSD: prNetRev.usd - prCogsUSD,
      opexMXN: prExp.opex.totalMXN,
      opexUSD: prExp.opex.totalUSD,
      adjustmentsMXN: prExp.adjustments.totalMXN,
      adjustmentsUSD: prExp.adjustments.totalUSD,
      totalExpensesMXN: prAllExpMXN,
      totalExpensesUSD: prAllExpUSD,
      netIncomeMXN: prNetRev.mxn - prAllExpMXN,
      netIncomeUSD: prNetRev.usd - prAllExpUSD,
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
    cogs,
    importCosts,
    grossProfit,
    opex,
    adjustments,
    expenseCredits,
    totalExpenses,
    netIncome,
    priorPeriod,
    cashIn,
    cashOut,
    generatedAt: new Date().toISOString(),
  };
};
