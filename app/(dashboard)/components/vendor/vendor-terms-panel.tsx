"use client";

/**
 * Surfaces the Vendors-sheet credit terms on the vendor detail page so
 * Roger can see at a glance how each vendor bills before he sends a PO.
 *
 * R4 Note 6: "vendor billing is complex... Maybe write up a vendor list
 * with credit terms and how they bill." Data already exists in
 * vendor-terms.ts; this is just the surface that exposes it.
 *
 * Match strategy: the Vendors sheet keys vendors by short slugs
 * ("ferguson", "jcr"), but the Odoo partner name is the display string
 * ("Ferguson Enterprises Inc"). We try a case-insensitive substring
 * match in either direction (term name in partner name, or partner
 * name in term name) and pick the longest hit. If nothing matches,
 * the panel renders an empty-state nudging Roger to add the vendor
 * to the Vendors sheet.
 */

import { useEffect, useState } from "react";
import { CreditCard, AlertCircle } from "lucide-react";

interface VendorTerms {
  vendor: string;
  name: string;
  creditTerms: string;
  termDays: number;
  billingTrigger:
    | "on-ship"
    | "on-order"
    | "cash-upfront"
    | "split-50-50"
    | "never-invoices";
  confirmationPattern: "sends-confirmation" | "no-confirmation";
  defaultLeadTimeDays: number;
  notes: string;
}

const TRIGGER_LABEL: Record<VendorTerms["billingTrigger"], string> = {
  "on-ship": "Invoice on ship",
  "on-order": "Invoice on order",
  "cash-upfront": "Cash up front",
  "split-50-50": "50% up front, 50% on ship",
  "never-invoices": "Never invoices · pay against PO",
};

const TRIGGER_HINT: Record<VendorTerms["billingTrigger"], string> = {
  "on-ship": "Invoice arrives once goods leave the warehouse. Due date is ship-date + terms.",
  "on-order": "Invoice posts at PO confirmation. Due date is PO-date + terms.",
  "cash-upfront": "Vendor won't start work until payment clears. PO send is gated on this payment.",
  "split-50-50": "Half up front to start the order, half on net-N from ship. Send is gated on the first half.",
  "never-invoices": "Artisan or direct vendor — no invoices come back. Pay manually against the PO.",
};

const CONFIRMATION_LABEL: Record<VendorTerms["confirmationPattern"], string> = {
  "sends-confirmation": "Sends confirmation email",
  "no-confirmation": "No confirmation — assume PO is in flight",
};

const matchVendor = (
  partnerName: string,
  vendors: VendorTerms[]
): VendorTerms | null => {
  const target = partnerName.trim().toLowerCase();
  if (!target) return null;
  let best: { vendor: VendorTerms; score: number } | null = null;
  for (const v of vendors) {
    const name = v.name.trim().toLowerCase();
    const key = v.vendor.trim().toLowerCase();
    if (!name && !key) continue;
    let score = 0;
    if (name && (target.includes(name) || name.includes(target))) {
      score = name.length;
    } else if (key && target.includes(key)) {
      score = key.length;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { vendor: v, score };
    }
  }
  return best?.vendor ?? null;
};

interface VendorTermsPanelProps {
  partnerName: string;
}

export const VendorTermsPanel = ({ partnerName }: VendorTermsPanelProps) => {
  const [match, setMatch] = useState<VendorTerms | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch("/api/dashboard/vendor-terms", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { vendors: [] }))
      .then((data: { vendors?: VendorTerms[] }) => {
        if (!alive) return;
        const vendors = data.vendors ?? [];
        setMatch(matchVendor(partnerName, vendors));
      })
      .catch(() => {
        if (alive) setMatch(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [partnerName]);

  if (loading) return null;

  if (!match) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded p-4 flex items-start gap-3 text-xs text-dash-text-secondary">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <div className="font-medium text-dash-text">No credit terms on file</div>
          <div className="mt-1">
            Add a row in the Vendors sheet matching this partner name to
            surface billing trigger, lead time, and notes here.
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-dash-surface border border-dash-border rounded p-5">
      <header className="flex items-center gap-2 mb-4">
        <CreditCard className="w-4 h-4 text-dash-accent" />
        <h2 className="font-display text-sm uppercase tracking-wider text-dash-text">
          Credit terms
        </h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
            Terms
          </div>
          <div className="text-sm font-medium text-dash-text">{match.creditTerms || "—"}</div>
          {match.termDays > 0 && (
            <div className="text-[11px] text-dash-text-secondary mt-0.5">
              {match.termDays} days
            </div>
          )}
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
            Billing trigger
          </div>
          <div className="text-sm font-medium text-dash-text">
            {TRIGGER_LABEL[match.billingTrigger]}
          </div>
          <div className="text-[11px] text-dash-text-secondary mt-0.5 leading-snug">
            {TRIGGER_HINT[match.billingTrigger]}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1">
            Lead time
          </div>
          <div className="text-sm font-medium text-dash-text">
            {match.defaultLeadTimeDays > 0
              ? `${match.defaultLeadTimeDays} days`
              : "—"}
          </div>
          <div className="text-[11px] text-dash-text-secondary mt-0.5">
            {CONFIRMATION_LABEL[match.confirmationPattern]}
          </div>
        </div>
      </div>

      {match.notes && (
        <div className="mt-4 pt-4 border-t border-dash-border text-xs text-dash-text-secondary leading-relaxed">
          {match.notes}
        </div>
      )}
    </section>
  );
};
