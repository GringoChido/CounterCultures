"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Search,
  Loader2,
  UserPlus,
  Check,
} from "lucide-react";
import Link from "next/link";
import { CustomerCombobox } from "@/app/(dashboard)/components/customer-combobox";
import { CompanyBadge } from "@/app/(dashboard)/components/company-badge";
import { useCurrentUser } from "@/app/lib/use-current-user";
import { hasFeature } from "@/app/lib/features";
import { useDebouncedFetch } from "@/app/lib/use-debounced-fetch";

const DEFAULT_TERMS = `All orders are subject to Counter Cultures' standard terms and conditions. Lead times vary by product; we will confirm delivery estimates after order review. Prices are valid for 30 days from quote date. IVA (16%) applies to shipments within Mexico. Shipping costs will be quoted separately.`;

interface QuoteLine {
  key: string;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  priceUnit: number;
  discount: number;
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

type EntityCompany = "cc" | "llc";

const fmt = (n: number, cur = "MXN") =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;

const thirtyDaysOut = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

const NewQuotePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();

  const prefillPartnerId = searchParams.get("partnerId");
  const prefillPartnerName = searchParams.get("partnerName");
  const autoNewCustomer = searchParams.get("newCustomer") === "true";

  // Customer
  const [customerText, setCustomerText] = useState(prefillPartnerName ?? "");
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(
    prefillPartnerId ? Number(prefillPartnerId) : null
  );
  const [showNewCustomer, setShowNewCustomer] = useState(autoNewCustomer);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newFirm, setNewFirm] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Order fields
  const [entity, setEntity] = useState<EntityCompany>("cc");
  const [currency, setCurrency] = useState<"MXN" | "USD">("MXN");
  const [validityDate, setValidityDate] = useState(thirtyDaysOut());
  const [note, setNote] = useState(DEFAULT_TERMS);

  // Lines
  const [lines, setLines] = useState<QuoteLine[]>([]);

  // Product search
  const [productQuery, setProductQuery] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  const productSearchUrl =
    productQuery.trim().length >= 2
      ? `/api/dashboard/products/search?q=${encodeURIComponent(productQuery.trim())}&limit=10&sale=true`
      : null;
  const { data: productData, loading: productLoading } = useDebouncedFetch<{
    items: ProductHit[];
  }>(productSearchUrl, 250);
  const productHits: ProductHit[] = productData?.items ?? [];

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate =
    user && hasFeature({ role: user.role, featureOverrides: user.featureOverrides }, "create_quote");

  // Sync entity ↔ currency
  useEffect(() => {
    setCurrency(entity === "llc" ? "USD" : "MXN");
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
            priceUnit: hit.listPrice,
            discount: 0,
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

  const updateLine = (key: string, field: keyof QuoteLine, value: number) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, [field]: value } : l))
    );
  };

  const lineSubtotal = (l: QuoteLine) => {
    const discounted = l.priceUnit * (1 - l.discount / 100);
    return discounted * l.quantity;
  };

  const grandTotal = lines.reduce((sum, l) => sum + lineSubtotal(l), 0);

  const handleCreateCustomer = async () => {
    if (!newName.trim()) return;
    setCreatingCustomer(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined,
          company: newFirm.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create customer");
      setSelectedPartnerId(data.partnerId);
      setCustomerText(data.partnerName);
      setShowNewCustomer(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewFirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPartnerId) {
      setError("Select or create a customer first.");
      return;
    }
    if (lines.length === 0) {
      setError("Add at least one product.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: selectedPartnerId,
          lines: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            priceUnit: l.priceUnit,
            discount: l.discount > 0 ? l.discount : undefined,
          })),
          validity_date: validityDate || undefined,
          companyId: entity === "llc" ? 2 : 1,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create quote");
      router.push(`/dashboard/orders/${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quote");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-sm text-dash-text-secondary">
          You don't have permission to create quotes.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders & Quotes
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-2xl text-dash-text">New Quote</h1>
        <p className="text-sm text-dash-text-secondary mt-1">
          Creates a draft sale order in Odoo. Send it from the order detail page
          after review.
        </p>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-brand-terracotta/10 border border-brand-terracotta/30 rounded text-sm text-brand-terracotta">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* ── Customer ── */}
        <section className="bg-dash-surface border border-dash-border rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-wider text-dash-text-secondary font-medium mb-3">
            Customer
          </h2>
          {!showNewCustomer ? (
            <div className="space-y-3">
              <CustomerCombobox
                value={customerText}
                onChange={(val, matched) => {
                  setCustomerText(val);
                  setSelectedPartnerId(matched ? Number(matched.id) : null);
                }}
                placeholder="Search existing customers…"
                partnerType="customer"
                autoFocus
              />
              {selectedPartnerId && (
                <p className="text-xs text-brand-sage flex items-center gap-1">
                  <Check className="w-3 h-3" /> Odoo partner #{selectedPartnerId}
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowNewCustomer(true)}
                className="inline-flex items-center gap-1.5 text-xs text-dash-accent hover:underline cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add new customer
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name *"
                  className="px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
                  autoFocus
                />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Email"
                  className="px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
                />
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Phone"
                  className="px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
                />
                <input
                  type="text"
                  value={newFirm}
                  onChange={(e) => setNewFirm(e.target.value)}
                  placeholder="Company / firm (optional)"
                  className="px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  disabled={!newName.trim() || creatingCustomer}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-copper text-white text-sm rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 cursor-pointer"
                >
                  {creatingCustomer && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create customer
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(false)}
                  className="px-4 py-2 text-sm text-dash-text-secondary hover:text-dash-text cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── Entity + Currency ── */}
        <section className="bg-dash-surface border border-dash-border rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-wider text-dash-text-secondary font-medium mb-3">
            Entity & Currency
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              {(["cc", "llc"] as const).map((e) => (
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
                  <CompanyBadge company={e} size="xs" />
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
                  setEntity(c === "USD" ? "llc" : "cc");
                }}
                className="px-3 py-1.5 border border-dash-border bg-dash-bg rounded text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-dash-text-secondary">Valid until:</span>
              <input
                type="date"
                value={validityDate}
                onChange={(e) => setValidityDate(e.target.value)}
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

          {/* Product search */}
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
                    No products found for "{productQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lines table */}
          {lines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
                  <tr>
                    <th className="text-left p-2">Product</th>
                    <th className="text-left p-2 w-20">Qty</th>
                    <th className="text-right p-2 w-28">Unit price</th>
                    <th className="text-right p-2 w-20">Disc %</th>
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
                          className="w-24 px-2 py-1 text-sm bg-dash-bg border border-dash-border rounded text-right text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={l.discount}
                          onChange={(e) =>
                            updateLine(l.key, "discount", Math.min(100, Math.max(0, Number(e.target.value))))
                          }
                          className="w-16 px-2 py-1 text-sm bg-dash-bg border border-dash-border rounded text-right text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
                        />
                      </td>
                      <td className="p-2 text-right font-medium text-dash-text">
                        {fmt(lineSubtotal(l), currency)}
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
                <tfoot>
                  <tr className="border-t-2 border-dash-border">
                    <td colSpan={4} className="p-2 text-right text-sm font-medium text-dash-text-secondary uppercase tracking-wider">
                      Subtotal
                    </td>
                    <td className="p-2 text-right text-lg font-semibold text-dash-text">
                      {fmt(grandTotal, currency)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-dash-text-secondary text-center py-6">
              No products added yet. Search above to add line items.
            </p>
          )}
        </section>

        {/* ── Terms / Notes ── */}
        <section className="bg-dash-surface border border-dash-border rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-wider text-dash-text-secondary font-medium mb-3">
            Terms & Notes
          </h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper resize-y"
            placeholder="Terms and conditions, notes for the customer…"
          />
        </section>

        {/* ── Submit ── */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <Link
            href="/dashboard/orders"
            className="text-sm text-dash-text-secondary hover:text-dash-text"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedPartnerId || lines.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create draft quote
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewQuotePage;
