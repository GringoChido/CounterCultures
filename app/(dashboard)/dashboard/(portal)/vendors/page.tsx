"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Search, Loader2 } from "lucide-react";

interface VendorRow {
  partnerId: string;
  partnerName: string;
  email: string;
  phone: string;
  poCount: number;
  openPoCount: number;
  totalBilledByCurrency: Record<string, number>;
  openAPByCurrency: Record<string, number>;
  lastPoDate: string | null;
}

const fmtMoneyMap = (rec: Record<string, number>): string => {
  const parts = Object.entries(rec)
    .filter(([, v]) => Math.abs(v) > 0.01)
    .map(([cur, amt]) => `$${Math.round(amt).toLocaleString()} ${cur}`);
  return parts.length === 0 ? "—" : parts.join(" + ");
};

const VendorsPage = () => {
  const [vendors, setVendors] = useState<VendorRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/vendors", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data: { vendors: VendorRow[] }) => setVendors(data.vendors))
      .catch((err) => setError(err instanceof Error ? err.message : "load_failed"));
  }, []);

  const filtered = useMemo(() => {
    if (!vendors) return null;
    if (!query.trim()) return vendors;
    const needle = query.toLowerCase();
    return vendors.filter(
      (v) =>
        v.partnerName.toLowerCase().includes(needle) ||
        v.email.toLowerCase().includes(needle)
    );
  }, [vendors, query]);

  const totals = useMemo(() => {
    if (!vendors) return null;
    const billed: Record<string, number> = {};
    const ap: Record<string, number> = {};
    let openPos = 0;
    for (const v of vendors) {
      openPos += v.openPoCount;
      for (const [cur, amt] of Object.entries(v.totalBilledByCurrency)) {
        billed[cur] = (billed[cur] ?? 0) + amt;
      }
      for (const [cur, amt] of Object.entries(v.openAPByCurrency)) {
        ap[cur] = (ap[cur] ?? 0) + amt;
      }
    }
    return { billed, ap, openPos, vendorCount: vendors.length };
  }, [vendors]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <header className="mb-6 flex items-start gap-4">
        <div className="p-3 bg-dash-surface border border-dash-border rounded">
          <Building2 className="w-6 h-6 text-dash-accent" />
        </div>
        <div>
          <h1 className="font-display text-2xl text-dash-text">Vendors</h1>
          <p className="text-sm text-dash-text-secondary">
            All suppliers with at least one purchase order. Click any vendor
            for the full PO / bill / payment history.
          </p>
        </div>
      </header>

      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-dash-surface border border-dash-border p-4 rounded">
            <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Vendors</div>
            <div className="text-xl font-semibold text-dash-text mt-1">{totals.vendorCount}</div>
          </div>
          <div className="bg-dash-surface border border-dash-border p-4 rounded">
            <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Open POs</div>
            <div className="text-xl font-semibold text-dash-text mt-1">{totals.openPos}</div>
          </div>
          <div className="bg-dash-surface border border-dash-border p-4 rounded">
            <div className="text-xs uppercase tracking-wider text-dash-text-secondary">All-time billed</div>
            <div className="text-base font-semibold text-dash-text mt-1">{fmtMoneyMap(totals.billed)}</div>
          </div>
          <div className="bg-dash-surface border border-dash-border p-4 rounded">
            <div className="text-xs uppercase tracking-wider text-dash-text-secondary">Open AP</div>
            <div className="text-base font-semibold text-brand-terracotta mt-1">{fmtMoneyMap(totals.ap)}</div>
          </div>
        </div>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vendor name or email…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!filtered && !error && (
        <div className="flex items-center justify-center py-12 text-dash-text-secondary">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading vendors…
        </div>
      )}

      {filtered && filtered.length === 0 && !error && (
        <div className="bg-dash-surface border border-dash-border rounded p-8 text-center text-sm text-dash-text-secondary">
          {query ? "No vendors match that search." : "No vendor activity in the mirror yet."}
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
              <tr>
                <th className="text-left p-3">Vendor</th>
                <th className="text-right p-3">POs</th>
                <th className="text-right p-3">Open POs</th>
                <th className="text-right p-3">All-time billed</th>
                <th className="text-right p-3">Open AP</th>
                <th className="text-left p-3">Last PO</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.partnerId} className="border-b border-dash-border/50 hover:bg-dash-bg-muted/40">
                  <td className="p-3">
                    <Link
                      href={`/dashboard/vendors/${v.partnerId}`}
                      className="font-medium text-dash-text hover:text-dash-accent"
                    >
                      {v.partnerName}
                    </Link>
                    {v.email && (
                      <div className="text-[11px] text-dash-text-secondary mt-0.5">{v.email}</div>
                    )}
                  </td>
                  <td className="p-3 text-right text-xs">{v.poCount}</td>
                  <td className="p-3 text-right text-xs">
                    {v.openPoCount > 0 ? (
                      <span className="text-brand-copper font-medium">{v.openPoCount}</span>
                    ) : (
                      <span className="text-dash-text-secondary">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right text-xs">{fmtMoneyMap(v.totalBilledByCurrency)}</td>
                  <td className="p-3 text-right text-xs">
                    {Object.keys(v.openAPByCurrency).length > 0 ? (
                      <span className="text-brand-terracotta font-medium">
                        {fmtMoneyMap(v.openAPByCurrency)}
                      </span>
                    ) : (
                      <span className="text-dash-text-secondary">—</span>
                    )}
                  </td>
                  <td className="p-3 text-xs">{(v.lastPoDate ?? "").slice(0, 10) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VendorsPage;
