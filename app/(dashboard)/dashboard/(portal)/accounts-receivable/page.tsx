"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import {
  FileText,
  Search,
  Loader2,
  Plus,
  Paperclip,
  FileCheck,
  Clock,
  Building2,
  ArrowDownLeft,
  AlertCircle,
  CreditCard,
  Link2,
  X,
  ChevronDown,
  ChevronRight,
  Mail,
  Upload,
  Landmark,
  Ban,
  FileBarChart,
} from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import {
  StatusBadge,
  type BadgeVariant,
} from "@/app/(dashboard)/components/status-badge";
import {
  CompanyBadge,
  getCompanyConfig,
} from "@/app/(dashboard)/components/company-badge";
import { useFeatures } from "@/app/lib/use-features";

// ---------------------------------------------------------------------------
// Types mirroring ar-factura.ts
// ---------------------------------------------------------------------------

type FacturaRequestState =
  | "pending"
  | "draft"
  | "issued"
  | "files_attached"
  | "cancelled";

type CompanyFilter = "all" | "cc" | "llc";
type StateFilter = "all" | FacturaRequestState;
type DepositFilter = "all" | "deposits_only";

interface ARRequest {
  id: string;
  state: FacturaRequestState;
  source: string;
  company: string;
  requestName: string;
  customerName: string;
  customerRfc: string;
  recipientType: string;
  amount: number;
  currency: string;
  bank: string;
  paymentMethod: string;
  paymentDate: string;
  depositType: string;
  depositPercent: number;
  linkedFolio: string;
  facturaFolio: string;
  facturaNotes: string;
  pdfDriveUrl: string;
  xmlDriveUrl: string;
  requestedBy: string;
  requestedAt: string;
  issuedAt: string;
  issuedBy: string;
  orderReference: string;
  invoiceId: string;
  notes: string;
}

interface CreditNote {
  id: string;
  originalInvoiceId: string;
  originalFolio: string;
  customerName: string;
  customerRfc: string;
  company: string;
  amount: number;
  currency: string;
  reason: string;
  application: string;
  appliedToInvoiceId: string;
  refundReference: string;
  substituteDetails: string;
  notes: string;
  createdAt: string;
  resolvedAt: string;
}

interface SantanderDeposit {
  id: string;
  date: string;
  amount: number;
  currency: string;
  reference: string;
  source: string;
  paymentMethod: string;
  customerId: string;
  customerName: string;
  notes: string;
  status: string;
  facturaRequestId: string;
}

interface ARSummary {
  pendingRequests: number;
  draftRequests: number;
  issuedThisMonth: number;
  totalIssuedAmount: Record<string, number>;
  pendingAmount: Record<string, number>;
  openCreditNotes: number;
  creditNoteTotal: Record<string, number>;
  byCompany: {
    cc: { pending: number; issued: number };
    llc: { pending: number; issued: number };
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number, cur = "MXN") =>
  !n ? "—" : `$${Math.round(n).toLocaleString()} ${cur}`;

const sumAllCurrencies = (rec: Record<string, number>) =>
  Object.entries(rec)
    .filter(([, v]) => Math.abs(v) > 0.01)
    .map(([cur, amt]) => `$${Math.round(amt).toLocaleString()} ${cur}`)
    .join(" + ") || "—";

const stateVariant = (s: string): BadgeVariant => {
  if (s === "pending") return "new";
  if (s === "draft") return "info";
  if (s === "issued") return "success";
  if (s === "files_attached") return "success";
  if (s === "cancelled") return "danger";
  return "default";
};

const stateLabel = (s: string): string => {
  if (s === "pending") return "Pending";
  if (s === "draft") return "Draft";
  if (s === "issued") return "Issued";
  if (s === "files_attached") return "Complete";
  if (s === "cancelled") return "Cancelled";
  return s;
};

const sourceLabel = (s: string): string => {
  if (s === "javier_email") return "Javier";
  if (s === "roger_transfer") return "Roger";
  if (s === "manual") return "Manual";
  return s;
};

const depositLabel = (type: string, pct: number): string => {
  if (type === "deposit") return `Anticipo ${pct}%`;
  if (type === "finiquito") return "Finiquito";
  return "—";
};

const reasonLabel = (r: string): string => {
  const map: Record<string, string> = {
    return: "Return",
    defective: "Defective",
    pricing_adjustment: "Price adj.",
    cancelled_order: "Cancelled",
    other: "Other",
  };
  return map[r] ?? r;
};

const applicationLabel = (a: string): string => {
  const map: Record<string, string> = {
    refund: "Refund",
    substitute_merchandise: "Substitute",
    apply_to_future: "Future invoice",
    pending: "Pending",
  };
  return map[a] ?? a;
};

const shortDate = (iso: string): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return iso.slice(0, 10);
  }
};

// ---------------------------------------------------------------------------
// Summary cards
// ---------------------------------------------------------------------------

const SummaryHero = ({ summary }: { summary: ARSummary }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
    <div className="bg-dash-surface border border-dash-border p-4 rounded">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-brand-copper" />
        <span className="text-xs uppercase tracking-wider text-dash-text-secondary">
          Pending
        </span>
      </div>
      <div className="text-2xl font-semibold text-dash-text">
        {summary.pendingRequests + summary.draftRequests}
      </div>
      <div className="text-[10px] text-dash-text-secondary mt-1">
        {summary.pendingRequests} new · {summary.draftRequests} draft
      </div>
      {Object.keys(summary.pendingAmount).length > 0 && (
        <div className="text-xs text-brand-copper mt-1 font-medium">
          {sumAllCurrencies(summary.pendingAmount)}
        </div>
      )}
    </div>

    <div className="bg-dash-surface border border-dash-border p-4 rounded">
      <div className="flex items-center gap-2 mb-1">
        <FileCheck className="w-4 h-4 text-brand-sage" />
        <span className="text-xs uppercase tracking-wider text-dash-text-secondary">
          Issued this month
        </span>
      </div>
      <div className="text-2xl font-semibold text-dash-text">
        {summary.issuedThisMonth}
      </div>
      <div className="text-xs text-brand-sage mt-1 font-medium">
        {sumAllCurrencies(summary.totalIssuedAmount)}
      </div>
    </div>

    <div className="bg-dash-surface border border-dash-border p-4 rounded">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="w-4 h-4 text-dash-text-secondary" />
        <span className="text-xs uppercase tracking-wider text-dash-text-secondary">
          By company
        </span>
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex-1 bg-company-cc-soft/50 rounded px-3 py-2 border border-company-cc/20">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-company-cc" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-company-cc-text">
              CC Mexico
            </span>
          </div>
          <div className="text-sm font-medium text-dash-text">
            {summary.byCompany.cc.pending} pending ·{" "}
            {summary.byCompany.cc.issued} issued
          </div>
        </div>
        <div className="flex-1 bg-company-llc-soft/50 rounded px-3 py-2 border border-company-llc/20">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-company-llc" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-company-llc-text">
              LLC USA
            </span>
          </div>
          <div className="text-sm font-medium text-dash-text">
            {summary.byCompany.llc.pending} pending ·{" "}
            {summary.byCompany.llc.issued} issued
          </div>
        </div>
      </div>
    </div>

    <div className="bg-dash-surface border border-dash-border p-4 rounded">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard className="w-4 h-4 text-brand-terracotta" />
        <span className="text-xs uppercase tracking-wider text-dash-text-secondary">
          Open credit notes
        </span>
      </div>
      <div className="text-2xl font-semibold text-dash-text">
        {summary.openCreditNotes}
      </div>
      {Object.keys(summary.creditNoteTotal).length > 0 && (
        <div className="text-xs text-brand-terracotta mt-1 font-medium">
          {sumAllCurrencies(summary.creditNoteTotal)}
        </div>
      )}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// New request form (slide-down panel)
// ---------------------------------------------------------------------------

interface NewRequestFormProps {
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  submitting: boolean;
}

const NewRequestForm = ({
  onSubmit,
  onCancel,
  submitting,
}: NewRequestFormProps) => {
  const [customerName, setCustomerName] = useState("");
  const [customerRfc, setCustomerRfc] = useState("");
  const [recipientType, setRecipientType] = useState("general_public");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const [bank, setBank] = useState("SANTANDER");
  const [paymentMethod, setPaymentMethod] = useState("wire");
  const [company, setCompany] = useState("cc");
  const [depositType, setDepositType] = useState("full");
  const [depositPercent, setDepositPercent] = useState("70");
  const [linkedFolio, setLinkedFolio] = useState("");
  const [source, setSource] = useState("javier_email");
  const [orderRef, setOrderRef] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentDate = new Date().toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const pmLabels: Record<string, string> = {
      wire: "TRANSFERENCIA",
      credit_card: "T.CREDITO",
      debit_card: "T.DEBITO",
      cash: "EFECTIVO",
      cheque: "CHEQUE",
      stripe: "STRIPE",
    };
    const requestName = [
      "COMPROBANTE",
      orderRef || `S${Date.now().toString().slice(-5)}`,
      `$ ${parseFloat(amount || "0").toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
      currency,
      bank,
      paymentDate.toUpperCase(),
      pmLabels[paymentMethod] ?? paymentMethod.toUpperCase(),
    ].join("_");

    onSubmit({
      action: "create_request",
      customerName,
      customerRfc,
      recipientType,
      amount,
      currency,
      bank,
      paymentMethod,
      company,
      depositType,
      depositPercent: depositType === "deposit" ? depositPercent : "100",
      linkedFolio: depositType === "finiquito" ? linkedFolio : "",
      source,
      orderReference: orderRef,
      requestName,
      notes,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-dash-surface border border-dash-border rounded p-5 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm uppercase tracking-wider text-dash-text">
          New Factura Request
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded hover:bg-dash-bg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-dash-text-secondary" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
            Customer name
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
            RFC (blank for Publico en General)
          </label>
          <input
            type="text"
            value={customerRfc}
            onChange={(e) => {
              setCustomerRfc(e.target.value);
              setRecipientType(e.target.value ? "personalized" : "general_public");
            }}
            placeholder="XAXX010101000"
            className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
            Source
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
          >
            <option value="javier_email">Javier (email)</option>
            <option value="roger_transfer">Roger (transfer)</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            step="0.01"
            className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
          >
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
            Bank
          </label>
          <select
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
          >
            <option value="SANTANDER">Santander</option>
            <option value="WELLS_FARGO">Wells Fargo</option>
            <option value="STRIPE">Stripe</option>
            <option value="CASH">Cash</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
            Payment method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
          >
            <option value="wire">Wire transfer</option>
            <option value="credit_card">Credit card</option>
            <option value="debit_card">Debit card</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="stripe">Stripe</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
            Company
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCompany("cc")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded border transition-colors cursor-pointer ${
                company === "cc"
                  ? "bg-company-cc-soft border-company-cc/40 text-company-cc-text font-semibold"
                  : "bg-dash-bg border-dash-border text-dash-text-secondary hover:border-company-cc/30"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-company-cc" />
              CC Mexico
            </button>
            <button
              type="button"
              onClick={() => setCompany("llc")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded border transition-colors cursor-pointer ${
                company === "llc"
                  ? "bg-company-llc-soft border-company-llc/40 text-company-llc-text font-semibold"
                  : "bg-dash-bg border-dash-border text-dash-text-secondary hover:border-company-llc/30"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-company-llc" />
              LLC USA
            </button>
          </div>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
            Deposit type
          </label>
          <select
            value={depositType}
            onChange={(e) => setDepositType(e.target.value)}
            className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
          >
            <option value="full">Full payment</option>
            <option value="deposit">Deposit (anticipo)</option>
            <option value="finiquito">Balance (finiquito)</option>
          </select>
        </div>
        {depositType === "deposit" && (
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
              Deposit %
            </label>
            <input
              type="number"
              value={depositPercent}
              onChange={(e) => setDepositPercent(e.target.value)}
              min="1"
              max="99"
              className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
            />
          </div>
        )}
        {depositType === "finiquito" && (
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
              Deposit folio #
            </label>
            <input
              type="text"
              value={linkedFolio}
              onChange={(e) => setLinkedFolio(e.target.value)}
              placeholder="Folio of the deposit factura"
              className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
            />
          </div>
        )}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
            Order / sale reference
          </label>
          <input
            type="text"
            value={orderRef}
            onChange={(e) => setOrderRef(e.target.value)}
            placeholder="S01630"
            className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || !customerName || !amount}
          className="px-4 py-2 bg-brand-copper text-white text-sm rounded hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Create request"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer"
        >
          Cancel
        </button>
        {recipientType === "personalized" && (
          <span className="text-[10px] text-brand-copper ml-auto">
            Personalized factura (RFC provided)
          </span>
        )}
      </div>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Requests table
// ---------------------------------------------------------------------------

const requestColumnHelper = createColumnHelper<ARRequest>();

const requestColumns = [
  requestColumnHelper.accessor("requestName", {
    header: "Request",
    cell: (info) => (
      <span
        className="font-mono text-xs text-dash-text line-clamp-1 max-w-[280px]"
        title={info.getValue()}
      >
        {info.getValue() || info.row.original.id}
      </span>
    ),
  }),
  requestColumnHelper.accessor("customerName", {
    header: "Customer",
    cell: (info) => (
      <span className="text-sm line-clamp-1">{info.getValue() || "—"}</span>
    ),
  }),
  requestColumnHelper.accessor("recipientType", {
    header: "Type",
    cell: (info) => {
      const v = info.getValue();
      return (
        <span
          className={`text-[10px] uppercase tracking-wider ${
            v === "personalized" ? "text-brand-copper" : "text-dash-text-secondary"
          }`}
        >
          {v === "personalized" ? "RFC" : "Público"}
        </span>
      );
    },
  }),
  requestColumnHelper.accessor("amount", {
    header: "Amount",
    cell: (info) => (
      <span className="text-right block font-medium text-sm">
        {fmt(info.getValue(), info.row.original.currency)}
      </span>
    ),
  }),
  requestColumnHelper.accessor("company", {
    header: "Co.",
    cell: (info) => <CompanyBadge company={info.getValue()} size="xs" />,
  }),
  requestColumnHelper.accessor("depositType", {
    header: "Deposit",
    cell: (info) => {
      const r = info.row.original;
      const dt = info.getValue();
      if (dt === "full") return <span className="text-xs text-dash-text-secondary">—</span>;
      return (
        <div className="flex items-center gap-1">
          <span className="text-xs">{depositLabel(dt, r.depositPercent)}</span>
          {r.linkedFolio && (
            <span title={`Linked: ${r.linkedFolio}`}>
              <Link2 className="w-3 h-3 text-brand-copper" />
            </span>
          )}
        </div>
      );
    },
  }),
  requestColumnHelper.accessor("source", {
    header: "From",
    cell: (info) => (
      <span className="text-xs text-dash-text-secondary">
        {sourceLabel(info.getValue())}
      </span>
    ),
  }),
  requestColumnHelper.accessor("state", {
    header: "Status",
    cell: (info) => (
      <StatusBadge
        label={stateLabel(info.getValue())}
        variant={stateVariant(info.getValue())}
      />
    ),
  }),
  requestColumnHelper.accessor("facturaFolio", {
    header: "Folio",
    cell: (info) => {
      const v = info.getValue();
      if (!v) return <span className="text-xs text-dash-text-secondary">—</span>;
      return <span className="font-mono text-xs">{v}</span>;
    },
  }),
  requestColumnHelper.accessor("pdfDriveUrl", {
    header: "Files",
    cell: (info) => {
      const r = info.row.original;
      if (!r.pdfDriveUrl && !r.xmlDriveUrl) {
        return <span className="text-xs text-dash-text-secondary">—</span>;
      }
      return (
        <div className="flex items-center gap-1">
          {r.pdfDriveUrl && (
            <a
              href={r.pdfDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-brand-copper hover:underline"
            >
              PDF
            </a>
          )}
          {r.xmlDriveUrl && (
            <a
              href={r.xmlDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-brand-sage hover:underline"
            >
              XML
            </a>
          )}
        </div>
      );
    },
  }),
  requestColumnHelper.accessor("requestedAt", {
    header: "Requested",
    cell: (info) => (
      <span className="text-xs text-dash-text-secondary">
        {shortDate(info.getValue())}
      </span>
    ),
  }),
];

// ---------------------------------------------------------------------------
// Credit notes table
// ---------------------------------------------------------------------------

const cnColumnHelper = createColumnHelper<CreditNote>();

const cnColumns = [
  cnColumnHelper.accessor("id", {
    header: "ID",
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue()}</span>
    ),
  }),
  cnColumnHelper.accessor("customerName", {
    header: "Customer",
    cell: (info) => (
      <span className="text-sm line-clamp-1">{info.getValue() || "—"}</span>
    ),
  }),
  cnColumnHelper.accessor("originalFolio", {
    header: "Original folio",
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue() || "—"}</span>
    ),
  }),
  cnColumnHelper.accessor("amount", {
    header: "Amount",
    cell: (info) => (
      <span className="text-right block font-medium text-sm text-brand-terracotta">
        {fmt(info.getValue(), info.row.original.currency)}
      </span>
    ),
  }),
  cnColumnHelper.accessor("reason", {
    header: "Reason",
    cell: (info) => (
      <span className="text-xs">{reasonLabel(info.getValue())}</span>
    ),
  }),
  cnColumnHelper.accessor("application", {
    header: "Resolution",
    cell: (info) => {
      const v = info.getValue();
      return (
        <StatusBadge
          label={applicationLabel(v)}
          variant={v === "pending" ? "warning" : "success"}
        />
      );
    },
  }),
  cnColumnHelper.accessor("company", {
    header: "Co.",
    cell: (info) => <CompanyBadge company={info.getValue()} size="xs" />,
  }),
  cnColumnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => (
      <span className="text-xs text-dash-text-secondary">
        {shortDate(info.getValue())}
      </span>
    ),
  }),
];

// ---------------------------------------------------------------------------
// AR Request detail / edit panel
// ---------------------------------------------------------------------------

const ARDetailPanel = ({
  request,
  onClose,
  onUpdated,
}: {
  request: ARRequest;
  onClose: () => void;
  onUpdated: () => void;
}) => {
  const [state, setState] = useState(request.state);
  const [facturaFolio, setFacturaFolio] = useState(request.facturaFolio);
  const [facturaNotes, setFacturaNotes] = useState(request.facturaNotes);
  const [pdfUrl, setPdfUrl] = useState(request.pdfDriveUrl);
  const [xmlUrl, setXmlUrl] = useState(request.xmlDriveUrl);
  const [saving, setSaving] = useState(false);
  const companyConfig = getCompanyConfig(request.company);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/dashboard/ar-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_state",
          id: request.id,
          state,
          updates: {
            factura_folio: facturaFolio,
            factura_notes: facturaNotes,
            pdf_drive_url: pdfUrl,
            xml_drive_url: xmlUrl,
          },
        }),
      });
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const fieldRow = (label: string, value: string | number) => (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-0.5">
        {label}
      </div>
      <div className="text-sm text-dash-text">{value || "—"}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <aside className="relative ml-auto w-[560px] max-w-[95vw] h-full bg-dash-surface border-l border-dash-border shadow-xl flex flex-col overflow-hidden">
        <header
          className="flex items-start justify-between gap-3 px-6 py-4 border-b-2"
          style={{ borderBottomColor: companyConfig?.dot ? undefined : "var(--color-dash-border)" }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CompanyBadge company={request.company} size="sm" />
              <StatusBadge label={stateLabel(request.state)} variant={stateVariant(request.state)} />
            </div>
            <h3
              className="text-sm font-mono text-dash-text leading-tight break-all"
              title={request.requestName}
            >
              {request.requestName || request.id}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-dash-bg text-dash-text-secondary cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Customer info */}
          <section>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary mb-2">
              Customer
            </div>
            <div className="grid grid-cols-2 gap-3">
              {fieldRow("Name", request.customerName)}
              {fieldRow("RFC", request.customerRfc || "Público en general")}
              {fieldRow("Type", request.recipientType === "personalized" ? "Personalized (RFC)" : "Público en general")}
              {fieldRow("Source", sourceLabel(request.source))}
            </div>
          </section>

          {/* Payment info */}
          <section>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary mb-2">
              Payment
            </div>
            <div className="grid grid-cols-2 gap-3">
              {fieldRow("Amount", fmt(request.amount, request.currency))}
              {fieldRow("Bank", request.bank)}
              {fieldRow("Method", request.paymentMethod)}
              {fieldRow("Date", request.paymentDate)}
              {fieldRow("Deposit", depositLabel(request.depositType, request.depositPercent))}
              {request.linkedFolio && fieldRow("Linked folio", request.linkedFolio)}
              {request.orderReference && fieldRow("Order ref", request.orderReference)}
            </div>
          </section>

          {/* Editable fields */}
          <section>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary mb-2">
              Factura details
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
                  State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value as FacturaRequestState)}
                  className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
                >
                  <option value="pending">Pending</option>
                  <option value="draft">Draft</option>
                  <option value="issued">Issued</option>
                  <option value="files_attached">Complete</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
                  Factura folio
                </label>
                <input
                  type="text"
                  value={facturaFolio}
                  onChange={(e) => setFacturaFolio(e.target.value)}
                  placeholder="e.g. A-1234"
                  className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
                    PDF Drive URL
                  </label>
                  <input
                    type="url"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
                    XML Drive URL
                  </label>
                  <input
                    type="url"
                    value={xmlUrl}
                    onChange={(e) => setXmlUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
                  Notes
                </label>
                <textarea
                  value={facturaNotes}
                  onChange={(e) => setFacturaNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent resize-none"
                />
              </div>
            </div>
          </section>

          {/* Metadata */}
          <section className="text-xs text-dash-text-secondary space-y-1">
            <div>Requested by {request.requestedBy || "—"} on {shortDate(request.requestedAt)}</div>
            {request.issuedAt && (
              <div>Issued by {request.issuedBy || "—"} on {shortDate(request.issuedAt)}</div>
            )}
            {request.invoiceId && <div>Invoice: {request.invoiceId}</div>}
            {request.notes && <div>Original notes: {request.notes}</div>}
          </section>
        </div>

        <footer className="border-t border-dash-border px-6 py-3 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-copper text-white text-sm rounded hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {request.pdfDriveUrl && (
            <a
              href={request.pdfDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-brand-copper hover:underline"
            >
              <Paperclip className="w-3.5 h-3.5" />
              View PDF
            </a>
          )}
        </footer>
      </aside>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Deposit entry form (inline)
// ---------------------------------------------------------------------------

const DepositEntryForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const [reference, setReference] = useState("");
  const [source, setSource] = useState<string>("customer");
  const [paymentMethod, setPaymentMethod] = useState("wire");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        date,
        amount: parseFloat(amount) || 0,
        currency,
        reference,
        source,
        paymentMethod,
        customerName,
        notes,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-dash-surface border border-dash-border rounded p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-medium uppercase tracking-wider text-dash-text">
          Add Santander deposit / Agregar depósito
        </h4>
        <button type="button" onClick={onCancel} className="p-1 rounded hover:bg-dash-bg transition-colors cursor-pointer">
          <X className="w-3.5 h-3.5 text-dash-text-secondary" />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">Date / Fecha</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-2 py-1.5 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">Reference / Referencia</label>
          <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} required placeholder="e.g. 0012345678" className="w-full px-2 py-1.5 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">Amount / Monto</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required step="0.01" min="0" className="w-full px-2 py-1.5 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">Currency / Moneda</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-2 py-1.5 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent">
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">Source / Origen</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-2 py-1.5 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent">
            <option value="customer">Customer / Cliente</option>
            <option value="roger_transfer">Roger (owner transfer)</option>
            <option value="netpay">NetPay</option>
            <option value="other">Other / Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">Payment method / Método</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-2 py-1.5 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent">
            <option value="wire">Wire / Transferencia</option>
            <option value="credit_card">Credit card / T. Crédito</option>
            <option value="debit_card">Debit card / T. Débito</option>
            <option value="cash">Cash / Efectivo</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other / Otro</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">Customer / Cliente</label>
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name or description" className="w-full px-2 py-1.5 border border-dash-border bg-dash-bg text-sm rounded focus:outline-none focus:border-dash-accent" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving || !reference || !amount} className="px-3 py-1.5 bg-brand-copper text-white text-xs rounded hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add deposit"}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer">
          Cancel
        </button>
        {source === "customer" && (
          <span className="text-[10px] text-brand-sage ml-auto">
            Will auto-queue factura request
          </span>
        )}
        {source === "roger_transfer" && (
          <span className="text-[10px] text-dash-text-muted ml-auto">
            Owner transfer — no auto-factura
          </span>
        )}
      </div>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const AccountsReceivablePage = () => {
  const features = useFeatures();
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>("all");
  const [depositFilter, setDepositFilter] = useState<DepositFilter>("all");
  const [requests, setRequests] = useState<ARRequest[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [summary, setSummary] = useState<ARSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    scanned: number;
    queued: number;
    skipped: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"requests" | "credit_notes">(
    "requests"
  );
  const [selectedRequest, setSelectedRequest] = useState<ARRequest | null>(null);
  const [depositsOpen, setDepositsOpen] = useState(false);
  const [deposits, setDeposits] = useState<SantanderDeposit[]>([]);
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ imported: number; duplicates: number; facturasQueued: number } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (query) p.set("q", query);
      if (stateFilter !== "all") p.set("state", stateFilter);
      if (companyFilter !== "all") p.set("company", companyFilter);
      if (depositFilter === "deposits_only") p.set("depositOnly", "true");

      const [reqRes, cnRes] = await Promise.all([
        fetch(`/api/dashboard/ar-requests?${p.toString()}`),
        fetch("/api/dashboard/ar-requests?view=credit_notes"),
      ]);
      const reqData = await reqRes.json();
      const cnData = await cnRes.json();

      setRequests(reqData.requests ?? []);
      setSummary(reqData.summary ?? null);
      setCreditNotes(cnData.creditNotes ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchData, 200);
    return () => clearTimeout(timer);
  }, [query, stateFilter, companyFilter, depositFilter]);

  const fetchDeposits = async () => {
    setDepositsLoading(true);
    try {
      const res = await fetch("/api/dashboard/santander-deposits");
      const data = await res.json();
      setDeposits(data.deposits ?? []);
    } finally {
      setDepositsLoading(false);
    }
  };

  const handleScanDeposits = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/dashboard/ar-requests/scan", {
        method: "POST",
      });
      const data = await res.json();
      setScanResult({ scanned: 0, queued: data.queued ?? 0, skipped: 0 });
      if (data.queued > 0) {
        fetchData();
        fetchDeposits();
      }
    } finally {
      setScanning(false);
    }
  };

  const handleCSVUpload = async (file: File) => {
    setUploadingCSV(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/dashboard/santander-deposits/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadResult({ imported: data.imported, duplicates: data.duplicates, facturasQueued: data.facturasQueued });
        fetchDeposits();
        fetchData();
      }
    } finally {
      setUploadingCSV(false);
    }
  };

  const handleQueueFactura = async (depositId: string) => {
    await fetch("/api/dashboard/santander-deposits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositId, action: "queue_factura" }),
    });
    fetchDeposits();
    fetchData();
  };

  const handleSkipDeposit = async (depositId: string) => {
    await fetch("/api/dashboard/santander-deposits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositId, action: "skip" }),
    });
    fetchDeposits();
  };

  useEffect(() => {
    if (depositsOpen && deposits.length === 0) fetchDeposits();
  }, [depositsOpen]);

  const handleCreateRequest = async (data: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      await fetch("/api/dashboard/ar-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setShowForm(false);
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const activeFilters = useMemo(() => {
    const out: string[] = [];
    if (stateFilter !== "all") out.push(stateLabel(stateFilter));
    if (companyFilter !== "all")
      out.push(companyFilter === "cc" ? "CC" : "LLC");
    if (depositFilter === "deposits_only") out.push("deposits");
    return out;
  }, [stateFilter, companyFilter, depositFilter]);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ArrowDownLeft className="w-6 h-6 text-dash-accent" />
          <h1 className="font-display text-2xl">Accounts Receivable</h1>
        </div>
        <p className="text-sm text-dash-text-secondary">
          Factura requests, deposit tracking, credit notes — everything
          coming in from customers.
        </p>
      </header>

      {summary && <SummaryHero summary={summary} />}

      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-4 border-b border-dash-border">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2.5 text-sm transition-colors cursor-pointer ${
            activeTab === "requests"
              ? "text-dash-text border-b-2 border-brand-copper font-medium -mb-px"
              : "text-dash-text-secondary hover:text-dash-text"
          }`}
        >
          Factura Requests
          {requests.length > 0 && (
            <span className="ml-2 text-[10px] bg-dash-bg px-1.5 py-0.5 rounded-full">
              {requests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("credit_notes")}
          className={`px-4 py-2.5 text-sm transition-colors cursor-pointer ${
            activeTab === "credit_notes"
              ? "text-dash-text border-b-2 border-brand-copper font-medium -mb-px"
              : "text-dash-text-secondary hover:text-dash-text"
          }`}
        >
          Credit Notes
          {creditNotes.length > 0 && (
            <span className="ml-2 text-[10px] bg-dash-bg px-1.5 py-0.5 rounded-full">
              {creditNotes.length}
            </span>
          )}
        </button>
        <div className="flex-1" />
        {scanResult && (
          <span className="text-[10px] text-dash-text-secondary mb-1 mr-2">
            {scanResult.queued} queued from deposits
          </span>
        )}
        <button
          onClick={handleScanDeposits}
          disabled={scanning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-sage hover:bg-brand-sage/10 rounded transition-colors mb-1 cursor-pointer disabled:opacity-50"
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Landmark className="w-4 h-4" />
          )}
          Scan deposits
        </button>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-copper hover:bg-brand-copper/10 rounded transition-colors mb-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New request
        </button>
      </div>

      {showForm && (
        <NewRequestForm
          onSubmit={handleCreateRequest}
          onCancel={() => setShowForm(false)}
          submitting={submitting}
        />
      )}

      {/* ── Santander Deposits ─────────────────────────────── */}
      <div className="mb-6">
        <button
          onClick={() => setDepositsOpen(!depositsOpen)}
          className="flex items-center gap-2 w-full text-left px-4 py-3 bg-dash-surface border border-dash-border rounded transition-colors hover:border-dash-accent cursor-pointer"
        >
          {depositsOpen ? (
            <ChevronDown className="w-4 h-4 text-dash-text-secondary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-dash-text-secondary" />
          )}
          <Landmark className="w-4 h-4 text-brand-copper" />
          <span className="text-sm font-medium text-dash-text">
            Santander Deposits
          </span>
          {deposits.filter((d) => d.status === "pending").length > 0 && (
            <span className="text-[10px] bg-brand-copper/10 text-brand-copper px-2 py-0.5 rounded-full font-medium">
              {deposits.filter((d) => d.status === "pending").length} pending
            </span>
          )}
          <span className="flex-1" />
          {depositsOpen && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <label className="flex items-center gap-1.5 px-3 py-1 text-xs text-brand-sage hover:bg-brand-sage/10 rounded transition-colors cursor-pointer">
                {uploadingCSV ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Upload CSV
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCSVUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                onClick={() => setShowDepositForm(!showDepositForm)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs text-brand-copper hover:bg-brand-copper/10 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add deposit
              </button>
            </div>
          )}
        </button>

        {depositsOpen && (
          <div className="border border-t-0 border-dash-border rounded-b bg-dash-bg p-4">
            {uploadResult && (
              <div className="mb-3 text-xs text-dash-text-secondary bg-brand-sage/5 border border-brand-sage/20 rounded p-2">
                Imported {uploadResult.imported} deposits ({uploadResult.duplicates} duplicates skipped), {uploadResult.facturasQueued} facturas queued
              </div>
            )}

            {showDepositForm && (
              <DepositEntryForm
                onSubmit={async (data) => {
                  await fetch("/api/dashboard/santander-deposits", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  });
                  setShowDepositForm(false);
                  fetchDeposits();
                  fetchData();
                }}
                onCancel={() => setShowDepositForm(false)}
              />
            )}

            {depositsLoading ? (
              <div className="flex items-center gap-2 text-sm text-dash-text-secondary py-4 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading deposits…
              </div>
            ) : deposits.length === 0 ? (
              <div className="text-sm text-dash-text-secondary py-4 text-center">
                No deposits imported yet. Upload a Santander CSV or add one manually.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-dash-text-secondary border-b border-dash-border">
                      <th className="text-left py-2 px-2">Date</th>
                      <th className="text-left py-2 px-2">Reference</th>
                      <th className="text-left py-2 px-2">Customer / Description</th>
                      <th className="text-right py-2 px-2">Amount</th>
                      <th className="text-left py-2 px-2">Source</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-right py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((d) => (
                      <tr
                        key={d.id}
                        className="border-b border-dash-border/50 hover:bg-dash-surface/50 transition-colors"
                      >
                        <td className="py-2 px-2 text-dash-text-secondary whitespace-nowrap">
                          {shortDate(d.date)}
                        </td>
                        <td className="py-2 px-2 font-mono text-xs">{d.reference}</td>
                        <td className="py-2 px-2 text-dash-text line-clamp-1 max-w-[200px]">
                          {d.customerName || "—"}
                        </td>
                        <td className="py-2 px-2 text-right font-medium">
                          {fmt(d.amount, d.currency)}
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className={`text-[10px] uppercase tracking-wider ${
                              d.source === "customer"
                                ? "text-brand-sage"
                                : d.source === "roger_transfer"
                                  ? "text-brand-copper"
                                  : d.source === "netpay"
                                    ? "text-dash-text-secondary"
                                    : "text-dash-text-muted"
                            }`}
                          >
                            {d.source === "roger_transfer" ? "Roger" : d.source}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <StatusBadge
                            variant={
                              d.status === "pending"
                                ? "new"
                                : d.status === "factura_queued"
                                  ? "success"
                                  : "default"
                            }
                            label={d.status === "factura_queued" ? "Queued" : d.status === "skipped" ? "Skipped" : "Pending"}
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          {d.status === "pending" && d.source === "customer" && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleQueueFactura(d.id)}
                                className="text-[10px] px-2 py-0.5 text-brand-sage hover:bg-brand-sage/10 rounded transition-colors cursor-pointer"
                                title="Queue factura request"
                              >
                                <FileBarChart className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleSkipDeposit(d.id)}
                                className="text-[10px] px-2 py-0.5 text-dash-text-muted hover:text-dash-text-secondary hover:bg-dash-bg rounded transition-colors cursor-pointer"
                                title="Skip — no factura needed"
                              >
                                <Ban className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {d.status === "pending" && d.source === "roger_transfer" && (
                            <span className="text-[10px] text-dash-text-muted">
                              Owner — no auto-factura
                            </span>
                          )}
                          {d.status === "pending" && d.source === "netpay" && (
                            <span className="text-[10px] text-dash-text-muted">
                              NetPay — skip
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === "requests" && (
        <>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customer, folio, request name, order ref…"
                className="w-full pl-10 pr-4 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
              )}
            </div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value as StateFilter)}
              className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="files_attached">Complete</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex rounded border border-dash-border overflow-hidden">
              <button
                type="button"
                onClick={() => setCompanyFilter("all")}
                className={`px-3 py-2 text-sm transition-colors cursor-pointer ${
                  companyFilter === "all"
                    ? "bg-dash-surface font-medium text-dash-text"
                    : "bg-dash-bg text-dash-text-muted hover:text-dash-text-secondary"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setCompanyFilter("cc")}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm border-l border-dash-border transition-colors cursor-pointer ${
                  companyFilter === "cc"
                    ? "bg-company-cc-soft font-semibold text-company-cc-text"
                    : "bg-dash-bg text-dash-text-muted hover:text-dash-text-secondary"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-company-cc" />
                CC
              </button>
              <button
                type="button"
                onClick={() => setCompanyFilter("llc")}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm border-l border-dash-border transition-colors cursor-pointer ${
                  companyFilter === "llc"
                    ? "bg-company-llc-soft font-semibold text-company-llc-text"
                    : "bg-dash-bg text-dash-text-muted hover:text-dash-text-secondary"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-company-llc" />
                LLC
              </button>
            </div>
            <select
              value={depositFilter}
              onChange={(e) =>
                setDepositFilter(e.target.value as DepositFilter)
              }
              className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
            >
              <option value="all">All types</option>
              <option value="deposits_only">Deposits only</option>
            </select>
          </div>

          <div className="mb-2 text-xs text-dash-text-secondary">
            {requests.length} request{requests.length === 1 ? "" : "s"}
            {activeFilters.length > 0 && (
              <> · filtered: {activeFilters.join(", ")}</>
            )}
          </div>

          <div className="bg-dash-surface border border-dash-border rounded">
            <DataTable
              columns={requestColumns}
              data={requests}
              onRowClick={(row) => setSelectedRequest(row)}
            />
          </div>
        </>
      )}

      {activeTab === "credit_notes" && (
        <>
          <div className="mb-2 text-xs text-dash-text-secondary">
            {creditNotes.length} credit note
            {creditNotes.length === 1 ? "" : "s"}
          </div>
          <div className="bg-dash-surface border border-dash-border rounded">
            <DataTable columns={cnColumns} data={creditNotes} />
          </div>
        </>
      )}

      {/* AR Request detail panel */}
      {selectedRequest && (
        <ARDetailPanel
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdated={() => {
            setSelectedRequest(null);
            fetchData();
          }}
        />
      )}

      {/* Quick links to related pages */}
      <div className="mt-8 pt-6 border-t border-dash-border">
        <div className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-3">
          Related
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/invoices?moveType=customer"
            className="flex items-center gap-2 px-3 py-2 text-xs text-dash-text-secondary border border-dash-border rounded hover:border-dash-accent hover:text-dash-text transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Customer invoices
          </Link>
          <Link
            href="/dashboard/payments?paymentType=inbound"
            className="flex items-center gap-2 px-3 py-2 text-xs text-dash-text-secondary border border-dash-border rounded hover:border-dash-accent hover:text-dash-text transition-colors"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Inbound payments
          </Link>
          <Link
            href="/dashboard/invoices?moveType=refund"
            className="flex items-center gap-2 px-3 py-2 text-xs text-dash-text-secondary border border-dash-border rounded hover:border-dash-accent hover:text-dash-text transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Refunds / credit notes
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountsReceivablePage;
