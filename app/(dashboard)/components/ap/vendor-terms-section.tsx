"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

interface VendorTermRow {
  vendor: string;
  name: string;
  creditTerms: string;
  termDays: number;
  billingTrigger: string;
  defaultLeadTimeDays: number;
  notes: string;
}

const VendorTermsSection = () => {
  const [terms, setTerms] = useState<VendorTermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/vendor-terms")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setTerms(data.vendors ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-6">
        <div className="h-4 w-40 bg-dash-bg rounded animate-pulse mb-3" />
        <div className="bg-dash-surface border border-dash-border rounded-md">
          {[0, 1].map((i) => (
            <div key={i} className="h-10 bg-dash-bg/50 animate-pulse border-b border-dash-border last:border-b-0" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 bg-dash-surface border border-dash-border rounded-md p-5">
        <p className="text-xs text-dash-text-secondary">
          No se pudieron cargar los términos. / Could not load vendor terms.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="w-4 h-4 text-brand-copper" />
        <h2 className="font-display text-sm uppercase tracking-wider text-dash-text">
          Términos de proveedor / Vendor Terms
        </h2>
        <span className="text-[10px] text-dash-text-secondary">
          {terms.length} configured
        </span>
      </div>

      {terms.length === 0 ? (
        <div className="bg-dash-surface border border-dash-border rounded-md p-5">
          <p className="text-xs text-dash-text-secondary">
            Sin términos de proveedor configurados. / No vendor terms configured.
          </p>
        </div>
      ) : (
        <div className="bg-dash-surface border border-dash-border rounded overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.6fr_1.5fr] gap-px text-[10px] uppercase tracking-wider text-dash-text-secondary px-4 py-2 border-b border-dash-border bg-dash-bg">
            <div>Proveedor / Vendor</div>
            <div>Términos / Terms</div>
            <div>Días / Days</div>
            <div>Trigger</div>
            <div>Lead time</div>
            <div>Notas / Notes</div>
          </div>
          {terms.map((t) => (
            <div
              key={t.vendor}
              className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.6fr_1.5fr] gap-px px-4 py-2.5 text-sm border-b border-dash-border last:border-b-0"
            >
              <div>
                <Link
                  href={`/dashboard/vendors/${encodeURIComponent(t.vendor)}`}
                  className="text-xs font-medium text-dash-text hover:text-dash-accent"
                >
                  {t.name || t.vendor}
                </Link>
              </div>
              <div className="text-xs text-dash-text-secondary">{t.creditTerms || "—"}</div>
              <div className="font-mono text-xs text-dash-text">{t.termDays || "—"}</div>
              <div className="text-xs text-dash-text-secondary capitalize">{t.billingTrigger || "—"}</div>
              <div className="font-mono text-xs text-dash-text-secondary">{t.defaultLeadTimeDays ? `${t.defaultLeadTimeDays}d` : "—"}</div>
              <div className="text-xs text-dash-text-secondary truncate" title={t.notes}>{t.notes || "—"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorTermsSection;
