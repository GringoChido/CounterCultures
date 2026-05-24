"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { CustomerCombobox } from "@/app/(dashboard)/components/customer-combobox";
import { CompanyBadge } from "@/app/(dashboard)/components/company-badge";
import { useCurrentUser } from "@/app/lib/use-current-user";
import { hasFeature } from "@/app/lib/features";
import { useDebouncedFetch } from "@/app/lib/use-debounced-fetch";

interface POLine {
  key: string;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  priceUnit: number;
}

interface ProductHit {
  id: string;
  name: string;
  sku: string;
  brand: string;
  listPrice: number;
  currency: string;
  stockQty?: number;
  inStock?: boolean;
}

type EntityCompany = "cc" | "rf";

const fmt = (n: number, cur = "MXN") =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;

const NewPurchaseOrderPage = () => {
  const router = useRouter();
  const { user } = useCurrentUser();

  // Vendor
  const [vendorText, setVendorText] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);

  // Order fields
  const [entity, setEntity] = useState<EntityCompany>("cc");
  const [currency, setCurrency] = useState<"MXN" | "USD">("MXN");
  const [datePlanned, setDatePlanned] = useState("");
  const [notes, setNotes] = useState("");

  // Lines
  const [lines, setLines] = useState<POLine[]>([]);

  // Product search
  const [productQuery, setProductQuery] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  const productSearchUrl =
    productQuery.trim().length >= 2
      ? `/api/dashboard/products/search?q=${encodeURIComponent(productQuery.trim())}&limit=10`
      : null;
  const { data: productData, loading: productLoading } = useDebouncedFetch<{
    items: ProductHit[];
  }>(productSearchUrl, 250);
  const productHits: ProductHit[] = productData?.items ?? [];

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate =
    user && hasFeature({ role: user.role, featureOverrides: user.featureOverrides }, "create_po");

  useEffect(() => {
    setCurrency(entity === "rf" ? "USD" : "MXN");
  }, [entity]);

  const addProduct = useCallback(
    (hit: ProductHit) => {
      const existing = lines.find((l) => l.productId === Number(hit.id));
      if (existing) {
        setLines((prev) =>
          prev.map((l) =>
            l.productId === Number(hit.id) ? { ...l, quantity: l.quantity + 1 } : l
          )
        );
      } else {
        setLines((prev) => [
          ...prev,
          {
            key: `${hit.id}-${Date.now()}`,
            productId: Number(hit.id),
            productName: hit.name,
            sku: hit.sku,
            quantity: 1,
            priceUnit: 0,
          },
        ]);
      }
      setProductQuery("");
      setProductDropdownOpen(false);
    },
    [lines]
  );

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const updateLine = (key: string, field: keyof POLine, value: number) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, [field]: value } : l))
    );
  };

  const lineSubtotal = (l: POLine) => l.priceUnit * l.quantity;

  const grandTotal = lines.reduce((sum, l) => sum + lineSubtotal(l), 0);

  const handleSubmit = async () => {
    if (!selectedVendorId) {
      setError("Select a vendor first.");
      return;
    }
    if (lines.length === 0) {
      setError("Add at least one product.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/purchase-orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: selectedVendorId,
          lines: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            priceUnit: l.priceUnit > 0 ? l.priceUnit : undefined,
          })),
          companyId: entity === "rf" ? 2 : 1,
          datePlanned: datePlanned || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create purchase order");
      router.push(`/dashboard/purchases/${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create purchase order");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-sm text-dash-text-secondary">
          You don&apos;t have permission to create purchase orders.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href="/dashboard/purchases"
        className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Purchase Orders
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-2xl text-dash-text">New Purchase Order</h1>
        <p className="text-sm text-dash-text-secondary mt-1">
          Creates a draft PO in Odoo. Confirm and send to vendor from the PO detail page.
        </p>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-brand-terracotta/10 border border-brand-terracotta/30 rounded text-sm text-brand-terracotta">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* ── Vendor ── */}
        <section className="bg-dash-surface border border-dash-border rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-wider text-dash-text-secondary font-medium mb-3">
            Vendor
          </h2>
          <CustomerCombobox
            value={vendorText}
            onChange={(val, matched) => {
              setVendorText(val);
              setSelectedVendorId(matched ? Number(matched.id) : null);
            }}
            placeholder="Search existing vendors…"
            partnerType="vendor"
            autoFocus
          />
          {selectedVendorId && (
            <p className="text-xs text-brand-sage flex items-center gap-1 mt-2">
              Odoo vendor #{selectedVendorId}
            </p>
          )}
        </section>

        {/* ── Entity + Currency ── */}
        <section className="bg-dash-surface border border-dash-border rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-wider text-dash-text-secondary font-medium mb-3">
            Entity & Currency
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              {(["cc", "rf"] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEntity(e)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                    entity === e
                      ? "border-dash-accent bg-dash-accent/10 text-dash-accent"
                      : "border-dash-border text-dash-text-secondary hover:border-dash-accent"
                  }`}
                >
                  <CompanyBadge company={e === "rf" ? "llc" : "cc"} size="xs" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-dash-text">
              <span className="text-dash-text-secondary">Currency:</span>
              <select
                value={currency}
                onChange={(e) => {
                  const c = e.target.value as "MXN" | "USD";
                  setCurrency(c);
                  setEntity(c === "USD" ? "rf" : "cc");
                }}
                className="px-3 py-1.5 border border-dash-border bg-dash-bg rounded text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-dash-text-secondary">Planned date:</span>
              <input
                type="date"
                value={datePlanned}
                onChange={(e) => setDatePlanned(e.target.value)}
                className="px-3 py-1.5 border border-dash-border bg-dash-bg rounded text-sm text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
              />
            </div>
          </div>
        </section>

        {/* ── Line Items ── */}
        <section className="bg-dash-surface border border-dash-border rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-wider text-dash-text-secondary font-medium mb-3">
            Line Items
          </h2>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
            <input
              type="text"
              value={productQuery}
              onChange={(e) => {
                setProductQuery(e.target.value);
                setProductDropdownOpen(true);
              }}
              onFocus={() => setProductDropdownOpen(true)}
              placeholder="Search products by name or SKU…"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
              autoComplete="off"
            />
            {productLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
            )}

            {productDropdownOpen && productQuery.trim().length >= 2 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-dash-surface border border-dash-border rounded-lg shadow-lg max-h-[320px] overflow-y-auto">
                {productHits.length > 0 ? (
                  productHits.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      className="w-full text-left px-3 py-2.5 text-xs border-b border-dash-border/60 last:border-b-0 hover:bg-dash-bg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-dash-text">{p.name}</span>
                          <span className="text-dash-text-secondary ml-2 font-mono">
                            {p.sku}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-dash-text">
                            {fmt(p.listPrice, p.currency)}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-dash-text-secondary mt-0.5 flex gap-3">
                        <span>{p.brand}</span>
                        {p.stockQty != null && (
                          <span>Stock: {p.stockQty}</span>
                        )}
                      </div>
                    </button>
                  ))
                ) : productLoading ? (
                  <div className="px-3 py-3 text-xs text-dash-text-secondary text-center">
                    Searching…
                  </div>
                ) : (
                  <div className="px-3 py-3 text-xs text-dash-text-secondary text-center">
                    No products found for &ldquo;{productQuery}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {lines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
                  <tr>
                    <th className="text-left p-2">Product</th>
                    <th className="text-left p-2 w-20">Qty</th>
                    <th className="text-right p-2 w-28">Unit cost</th>
                    <th className="text-right p-2 w-32">Subtotal</th>
                    <th className="p-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.key} className="border-b border-dash-border/50">
                      <td className="p-2">
                        <div className="text-sm text-dash-text">{l.productName}</div>
                        <div className="text-[10px] text-dash-text-secondary font-mono">{l.sku}</div>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={1}
                          value={l.quantity}
                          onChange={(e) =>
                            updateLine(l.key, "quantity", Math.max(1, Number(e.target.value)))
                          }
                          className="w-16 px-2 py-1 text-sm bg-dash-bg border border-dash-border rounded text-center text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={l.priceUnit}
                          onChange={(e) =>
                            updateLine(l.key, "priceUnit", Math.max(0, Number(e.target.value)))
                          }
                          placeholder="Vendor cost"
                          className="w-24 px-2 py-1 text-sm bg-dash-bg border border-dash-border rounded text-right text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper placeholder:text-dash-text-secondary/40"
                        />
                      </td>
                      <td className="p-2 text-right font-medium text-dash-text">
                        {l.priceUnit > 0 ? fmt(lineSubtotal(l), currency) : "—"}
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => removeLine(l.key)}
                          className="p-1 text-dash-text-secondary hover:text-brand-terracotta transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {grandTotal > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-dash-border">
                      <td colSpan={3} className="p-2 text-right text-sm font-medium text-dash-text-secondary uppercase tracking-wider">
                        Total
                      </td>
                      <td className="p-2 text-right text-lg font-semibold text-dash-text">
                        {fmt(grandTotal, currency)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : (
            <p className="text-sm text-dash-text-secondary text-center py-6">
              No products added yet. Search above to add line items.
            </p>
          )}
        </section>

        {/* ── Notes ── */}
        <section className="bg-dash-surface border border-dash-border rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-wider text-dash-text-secondary font-medium mb-3">
            Notes
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper resize-y"
            placeholder="Internal notes for this purchase order…"
          />
        </section>

        {/* ── Submit ── */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <Link
            href="/dashboard/purchases"
            className="text-sm text-dash-text-secondary hover:text-dash-text"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedVendorId || lines.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create draft PO
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPurchaseOrderPage;
