"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Percent,
  Plus,
  Loader2,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";

interface TaxRate {
  id: string;
  name: string;
  kind: string;
  rate: number;
  appliesTo: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

const KINDS = ["IVA", "IEPS", "Retencion", "Other"] as const;
const APPLIES = ["AR", "AP", "Both"] as const;

const TaxRatesPage = () => {
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<string>("IVA");
  const [rate, setRate] = useState("");
  const [appliesTo, setAppliesTo] = useState<string>("Both");

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/tax-rates?all=true");
      const data = await res.json();
      setRates(data.rates ?? []);
    } catch {
      toast.error("Failed to load tax rates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const handleCreate = async () => {
    const rateNum = parseFloat(rate);
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      toast.error("Rate must be 0–100");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/tax-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), kind, rate: rateNum, appliesTo }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      toast.success(`Tax rate "${name}" created`);
      setName("");
      setRate("");
      setKind("IVA");
      setAppliesTo("Both");
      setShowForm(false);
      fetchRates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (r: TaxRate) => {
    const next = !r.active;
    setRates((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, active: next } : x))
    );
    try {
      const res = await fetch("/api/dashboard/tax-rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, active: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${r.name} ${next ? "activated" : "deactivated"}`);
    } catch {
      setRates((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, active: r.active } : x))
      );
      toast.error("Update failed");
    }
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Configuración / Settings
      </Link>

      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Percent className="w-6 h-6 text-dash-accent" />
          <div>
            <h1 className="font-display text-2xl">
              Tasas de impuesto / Tax Rates
            </h1>
            <p className="text-sm text-dash-text-secondary mt-0.5">
              Crea y administra tasas fiscales para facturas y recibos.
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-copper text-white rounded hover:bg-brand-copper/90 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva tasa / New rate
          </button>
        )}
      </header>

      {showForm && (
        <div className="bg-dash-surface border border-dash-border rounded p-5 mb-6">
          <h2 className="text-sm font-medium mb-4">
            Nueva tasa / New tax rate
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-xs text-dash-text-secondary block mb-1">
                Nombre / Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="IVA 8% fronterizo"
                className="w-full px-3 py-2 text-sm border border-dash-border rounded bg-dash-surface focus:outline-none focus:border-dash-accent"
              />
            </div>
            <div>
              <label className="text-xs text-dash-text-secondary block mb-1">
                Tipo / Kind
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-dash-border rounded bg-dash-surface focus:outline-none focus:border-dash-accent"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-dash-text-secondary block mb-1">
                Tasa % / Rate %
              </label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="16"
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-dash-border rounded bg-dash-surface focus:outline-none focus:border-dash-accent"
              />
            </div>
            <div>
              <label className="text-xs text-dash-text-secondary block mb-1">
                Aplica a / Applies to
              </label>
              <select
                value={appliesTo}
                onChange={(e) => setAppliesTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-dash-border rounded bg-dash-surface focus:outline-none focus:border-dash-accent"
              >
                {APPLIES.map((a) => (
                  <option key={a} value={a}>
                    {a === "Both"
                      ? "Ambos / Both"
                      : a === "AR"
                        ? "Cuentas por cobrar / AR"
                        : "Cuentas por pagar / AP"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-copper text-white rounded hover:bg-brand-copper/90 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Guardar / Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-dash-text-secondary hover:text-dash-text cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar / Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-dash-accent" />
        </div>
      ) : rates.length === 0 ? (
        <div className="bg-dash-surface border border-dash-border rounded p-8 text-center">
          <Percent className="w-8 h-8 text-dash-text-secondary mx-auto mb-2" />
          <p className="text-sm text-dash-text-secondary">
            No hay tasas configuradas. / No tax rates configured yet.
          </p>
        </div>
      ) : (
        <div className="bg-dash-surface border border-dash-border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
              <tr>
                <th className="text-left p-3">Nombre / Name</th>
                <th className="text-left p-3">Tipo / Kind</th>
                <th className="text-right p-3">Tasa / Rate</th>
                <th className="text-left p-3">Aplica / Applies</th>
                <th className="text-center p-3">Activo / Active</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr
                  key={r.id}
                  className={`border-b border-dash-border/50 ${!r.active ? "opacity-50" : ""}`}
                >
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 text-dash-text-secondary">{r.kind}</td>
                  <td className="p-3 text-right font-mono">{r.rate}%</td>
                  <td className="p-3 text-dash-text-secondary">
                    {r.appliesTo === "Both"
                      ? "Ambos"
                      : r.appliesTo === "AR"
                        ? "AR"
                        : "AP"}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(r)}
                      className="cursor-pointer"
                      title={r.active ? "Desactivar / Deactivate" : "Activar / Activate"}
                    >
                      {r.active ? (
                        <ToggleRight className="w-5 h-5 text-brand-sage" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-dash-text-secondary" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TaxRatesPage;
