"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  X,
  Package,
  Plus,
  Loader2,
  FilePlus,
  ExternalLink,
  Palette,
  Layers,
  History as HistoryIcon,
  Info,
} from "lucide-react";
import type { ProductFull } from "@/app/lib/products-full";
import { useActiveOrderStore, type ActiveOrder } from "@/app/lib/stores/active-order-store";
import { CustomerCombobox } from "@/app/(dashboard)/components/customer-combobox";
import { ProductVisual } from "@/app/components/product-visual";

interface DealOption {
  id: string;
  name: string;
  company: string;
  stage: string;
}

const CLOSED_STAGES = new Set([
  "closed_won",
  "closed_lost",
  "lost_price",
  "lost_timeline",
  "lost_brand",
  "lost_other",
]);

interface Variant {
  id: string;
  sku: string;
  name: string;
  listPrice: number;
  currency: string;
  finishCode: string;
}

interface SalesHistory {
  count: number;
  quantitySold: number;
  revenue: number;
  avgPriceUnit: number;
  lastOrderDate: string | null;
  currency: string;
  uniqueCustomers: number;
  orders: Array<{
    orderId: string;
    orderName: string;
    partnerName: string;
    partnerId: string;
    dateOrder: string;
    state: string;
    quantity: number;
    priceUnit: number;
    priceSubtotal: number;
  }>;
}

interface ProductDetailPanelProps {
  product: ProductFull;
  onClose: () => void;
  onPickProduct: (p: ProductFull) => void;
  onAddedToDeal?: () => void;
}

type TabKey = "overview" | "variants" | "same-brand" | "history";

const ProductImage = ({
  id,
  brand,
  sku,
  name,
}: {
  id: string;
  brand: string;
  sku: string;
  name: string;
}) => (
  <div className="border border-dash-border rounded-lg overflow-hidden">
    <ProductVisual
      id={id}
      brand={brand}
      sku={sku}
      name={name}
      aspect="4/3"
      size="hero"
    />
  </div>
);

const formatPrice = (p: number, cur: string) =>
  p > 0
    ? `${cur} ${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : "—";

const formatMoney = (n: number, cur = "MXN") =>
  `${cur} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const ProductDetailPanel = ({
  product,
  onClose,
  onPickProduct,
  onAddedToDeal,
}: ProductDetailPanelProps) => {
  const router = useRouter();
  const active = useActiveOrderStore((s) => s.active);
  const setActive = useActiveOrderStore((s) => s.setActive);
  const bumpItem = useActiveOrderStore((s) => s.bumpItem);

  const [tab, setTab] = useState<TabKey>("overview");
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  // For the "choose a different deal" path (when the active order is set
  // but Roger wants to target a different one this time).
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deals, setDeals] = useState<DealOption[]>([]);
  const [pickerDealId, setPickerDealId] = useState("");

  // Walk-in flow
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInCompany, setWalkInCompany] = useState("");
  const [walkInName, setWalkInName] = useState("");

  // Lazy tab data
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [skuRoot, setSkuRoot] = useState<string | null>(null);
  const [sameBrand, setSameBrand] = useState<ProductFull[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<SalesHistory | null>(null);

  // Description state — admin sees status (pending/approved) regardless of gate
  interface DescState {
    descriptionEn: string;
    descriptionEs: string;
    status: "pending" | "approved" | "rejected";
  }
  const [desc, setDesc] = useState<DescState | null>(null);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  // Reset transient state whenever the shown product changes
  useEffect(() => {
    setTab("overview");
    setQty(1);
    setPickerOpen(false);
    setPickerDealId("");
    setWalkInOpen(false);
    setWalkInCompany("");
    setWalkInName("");
    setVariants([]);
    setSameBrand([]);
    setHistory(null);
    setDesc(null);
  }, [product.id]);

  // Hydrate description from sheet — admin view sees pending + approved alike
  useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/dashboard/products/description?id=${encodeURIComponent(product.id)}`,
      { cache: "no-store" }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.row) return;
        setDesc({
          descriptionEn: d.row.descriptionEn,
          descriptionEs: d.row.descriptionEs,
          status: d.row.status,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const generateDesc = async () => {
    if (generatingDesc) return;
    setGeneratingDesc(true);
    try {
      const res = await fetch(`/api/dashboard/products/generate-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Generation failed");
      }
      const d = (await res.json()) as DescState;
      setDesc(d);
      toast.success("Description generated. Approve in the sheet to publish.");
    } catch (e) {
      console.error("[product-detail] generate description failed", e);
      toast.error(e instanceof Error ? e.message : "Could not generate description");
    } finally {
      setGeneratingDesc(false);
    }
  };

  // Fetch variants + same-brand once per product (cheap)
  useEffect(() => {
    let cancelled = false;
    setVariantsLoading(true);
    const params = new URLSearchParams();
    if (product.sku) params.set("sku", product.sku);
    if (product.brand) params.set("brand", product.brand);
    params.set("excludeId", product.id);
    params.set("limit", "12");
    fetch(`/api/dashboard/products/variants?${params}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setVariants((d.variants ?? []) as Variant[]);
        setSkuRoot(d.skuRoot ?? null);
        setSameBrand((d.sameBrand ?? []) as ProductFull[]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setVariantsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product.id, product.sku, product.brand]);

  // Lazy-fetch sales history only when tab is opened
  useEffect(() => {
    if (tab !== "history" || history) return;
    let cancelled = false;
    setHistoryLoading(true);
    fetch(
      `/api/dashboard/products/sales-history?productId=${encodeURIComponent(product.id)}`,
      { cache: "no-store" }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setHistory(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, product.id, history]);

  // Lazy-fetch open deals when the picker opens
  useEffect(() => {
    if (!pickerOpen || deals.length > 0) return;
    fetch("/api/dashboard/pipeline", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { deals: [] }))
      .then((d) => {
        setDeals(
          ((d.deals ?? []) as DealOption[])
            .filter((x) => !CLOSED_STAGES.has(x.stage))
            .sort((a, b) =>
              (a.company || a.name).localeCompare(b.company || b.name)
            )
        );
      })
      .catch(() => {});
  }, [pickerOpen, deals.length]);

  const addToDeal = async (dealId: string, dealLabel: string) => {
    setAdding(true);
    try {
      const res = await fetch(
        `/api/dashboard/deals/${encodeURIComponent(dealId)}/line-items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, quantity: qty }),
        }
      );
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      const price = (data.item?.quotedPrice as number) ?? product.listPrice ?? 0;
      // If this is the active order, update counts locally — otherwise
      // set it as the new active so subsequent adds are one-click.
      if (active?.dealId === dealId) {
        bumpItem(price, qty);
      } else {
        setActive({
          dealId,
          name: dealLabel,
          company: dealLabel,
          itemCount: 1,
          totalQuoted: price * qty,
          currency: product.currency,
          updatedAt: new Date().toISOString(),
        } as ActiveOrder);
      }
      toast.success(
        `Added ${product.sku || product.name} × ${qty} to ${dealLabel}`
      );
      onAddedToDeal?.();
      onClose();
    } catch {
      toast.error("Could not add to deal");
    } finally {
      setAdding(false);
    }
  };

  const startWalkIn = async () => {
    const company = walkInCompany.trim();
    if (!company) {
      toast.error("Enter a company or customer name");
      return;
    }
    setAdding(true);
    try {
      const name = (walkInName.trim() || `Quote for ${company}`).slice(0, 200);
      const dealRes = await fetch("/api/dashboard/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          stage: "discovery",
          value: "",
          probability: "25",
          expected_close: "",
          owner: "",
          source: "walk-in",
          notes: "",
          brand_slugs: "",
        }),
      });
      if (!dealRes.ok) throw new Error("deal-create-failed");
      const dealData = await dealRes.json();
      const dealId = dealData.id as string;
      const addRes = await fetch(
        `/api/dashboard/deals/${encodeURIComponent(dealId)}/line-items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, quantity: qty }),
        }
      );
      const add = await addRes.json();
      const price = (add.item?.quotedPrice as number) ?? product.listPrice ?? 0;
      setActive({
        dealId,
        name,
        company,
        itemCount: 1,
        totalQuoted: price * qty,
        currency: product.currency,
        updatedAt: new Date().toISOString(),
      } as ActiveOrder);
      toast.success(`Started order for ${company}`);
      onAddedToDeal?.();
      onClose();
    } catch {
      toast.error("Could not start new deal");
    } finally {
      setAdding(false);
    }
  };

  const activeLabel = useMemo(
    () => (active ? active.company || active.name : ""),
    [active]
  );

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative ml-auto w-[720px] max-w-[95vw] h-full bg-dash-surface border-l border-dash-border shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 px-6 py-4 border-b border-dash-border">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-dash-text-secondary mb-0.5">
              {product.brand || "—"} &middot; {product.category}
            </div>
            <h3 className="text-lg font-semibold text-dash-text leading-tight">
              {product.name || product.sku}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="font-mono text-dash-text-secondary">
                {product.sku || "no SKU"}
              </span>
              {product.active ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-dash-success/10 text-dash-success text-[10px] font-medium">
                  active
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-dash-text-secondary/10 text-dash-text-secondary text-[10px]">
                  inactive
                </span>
              )}
              {!product.saleOk && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-dash-warn/10 text-dash-warn text-[10px]">
                  not sellable
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-dash-bg text-dash-text-secondary cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Tabs */}
        <nav className="flex gap-1 px-6 pt-3 border-b border-dash-border">
          {(
            [
              { key: "overview" as TabKey, label: "Overview", Icon: Info },
              { key: "variants" as TabKey, label: variants.length ? `Variants (${variants.length})` : "Variants", Icon: Palette },
              { key: "same-brand" as TabKey, label: sameBrand.length ? `Same Brand (${sameBrand.length})` : "Same Brand", Icon: Layers },
              { key: "history" as TabKey, label: "History", Icon: HistoryIcon },
            ]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t border-b-2 transition-colors cursor-pointer ${
                tab === t.key
                  ? "border-brand-copper text-dash-text"
                  : "border-transparent text-dash-text-secondary hover:text-dash-text"
              }`}
            >
              <t.Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </nav>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === "overview" && (
            <div className="space-y-4">
              <ProductImage
                id={product.id}
                brand={product.brand}
                sku={product.sku}
                name={product.name || product.sku}
              />
              {/* AI description + admin gate */}
              <div className="rounded-lg border border-dash-border bg-dash-bg/50 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary">
                    Description
                  </span>
                  <div className="flex items-center gap-2">
                    {desc && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          desc.status === "approved"
                            ? "bg-dash-success/10 text-dash-success"
                            : desc.status === "rejected"
                              ? "bg-dash-danger/10 text-dash-danger"
                              : "bg-dash-warn/10 text-dash-warn"
                        }`}
                      >
                        {desc.status}
                      </span>
                    )}
                    <button
                      onClick={generateDesc}
                      disabled={generatingDesc}
                      className="px-2 py-1 text-[11px] bg-brand-copper text-white rounded hover:bg-brand-copper/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {generatingDesc
                        ? "Generating…"
                        : desc
                          ? "Regenerate"
                          : "Generate"}
                    </button>
                  </div>
                </div>
                {desc ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-0.5">
                        EN
                      </p>
                      <p className="text-dash-text leading-relaxed">{desc.descriptionEn}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-0.5">
                        ES
                      </p>
                      <p className="text-dash-text leading-relaxed">{desc.descriptionEs}</p>
                    </div>
                    {desc.status === "pending" && (
                      <p className="text-[10px] text-dash-warn/70 italic">
                        Open Product_Descriptions in the sheet and set status to “approved” to publish.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-dash-text-secondary italic">
                    No description yet. Generate one — it’ll save as pending until approved in the sheet.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-dash-text-secondary mb-0.5">List price</div>
                  <div className="text-dash-text font-medium">
                    {formatPrice(product.listPrice, product.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-dash-text-secondary mb-0.5">UoM</div>
                  <div className="text-dash-text">{product.uom}</div>
                </div>
                <div>
                  <div className="text-xs text-dash-text-secondary mb-0.5">Brand</div>
                  <div className="text-dash-text">{product.brand || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-dash-text-secondary mb-0.5">Category</div>
                  <div className="text-dash-text capitalize">{product.category}</div>
                </div>
                <div>
                  <div className="text-xs text-dash-text-secondary mb-0.5">Odoo ID</div>
                  <div className="font-mono text-xs text-dash-text-secondary">{product.id}</div>
                </div>
              </div>
            </div>
          )}

          {tab === "variants" && (
            <div className="space-y-3">
              {variantsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 text-dash-text-secondary animate-spin mx-auto" />
                </div>
              ) : variants.length === 0 ? (
                <div className="text-center py-12 text-sm text-dash-text-secondary">
                  {skuRoot ? (
                    <>No variants found with root <code className="font-mono">{skuRoot}</code>.</>
                  ) : (
                    "SKU format doesn't encode a finish — no variants to show."
                  )}
                </div>
              ) : (
                <>
                  <p className="text-xs text-dash-text-secondary">
                    Same product family with different finishes or sizes. Root:{" "}
                    <code className="font-mono text-dash-text">{skuRoot}</code>
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() =>
                          onPickProduct({
                            id: v.id,
                            name: v.name,
                            sku: v.sku,
                            brand: product.brand,
                            category: product.category,
                            listPrice: v.listPrice,
                            currency: v.currency,
                            uom: product.uom,
                            active: true,
                            saleOk: true,
                          })
                        }
                        className="flex items-center gap-3 text-left p-2 rounded border border-dash-border hover:border-brand-copper hover:bg-dash-bg transition-colors cursor-pointer"
                      >
                        <span className="inline-flex items-center justify-center px-2 py-1 bg-brand-copper/10 text-brand-copper rounded font-mono text-[11px] font-semibold shrink-0">
                          {v.finishCode}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-mono text-dash-text-secondary truncate">{v.sku}</div>
                          <div className="text-sm text-dash-text truncate">{v.name}</div>
                        </div>
                        <div className="text-xs font-medium shrink-0">
                          {formatPrice(v.listPrice, v.currency)}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "same-brand" && (
            <div className="space-y-2">
              {variantsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 text-dash-text-secondary animate-spin mx-auto" />
                </div>
              ) : sameBrand.length === 0 ? (
                <div className="text-center py-12 text-sm text-dash-text-secondary">
                  No other {product.brand} products.
                </div>
              ) : (
                sameBrand.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onPickProduct(p)}
                    className="flex items-center gap-3 text-left p-2 rounded border border-dash-border hover:border-brand-copper hover:bg-dash-bg transition-colors cursor-pointer w-full"
                  >
                    <Package className="w-4 h-4 text-dash-text-secondary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-dash-text-secondary truncate">{p.sku || "—"}</div>
                      <div className="text-sm text-dash-text truncate">{p.name}</div>
                    </div>
                    <div className="text-xs font-medium shrink-0">
                      {formatPrice(p.listPrice, p.currency)}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {tab === "history" && (
            <div className="space-y-4">
              {historyLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 text-dash-text-secondary animate-spin mx-auto" />
                </div>
              ) : !history || history.count === 0 ? (
                <div className="text-center py-12 text-sm text-dash-text-secondary">
                  No past sales of this SKU in the Odoo snapshot.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-dash-bg rounded-lg p-3">
                      <div className="text-dash-text-secondary">Orders</div>
                      <div className="text-dash-text font-semibold text-sm mt-0.5">
                        {history.count}
                      </div>
                    </div>
                    <div className="bg-dash-bg rounded-lg p-3">
                      <div className="text-dash-text-secondary">Qty sold</div>
                      <div className="text-dash-text font-semibold text-sm mt-0.5">
                        {history.quantitySold}
                      </div>
                    </div>
                    <div className="bg-dash-bg rounded-lg p-3">
                      <div className="text-dash-text-secondary">Customers</div>
                      <div className="text-dash-text font-semibold text-sm mt-0.5">
                        {history.uniqueCustomers}
                      </div>
                    </div>
                    <div className="bg-dash-bg rounded-lg p-3">
                      <div className="text-dash-text-secondary">Avg price</div>
                      <div className="text-dash-text font-semibold text-sm mt-0.5">
                        {formatMoney(history.avgPriceUnit, history.currency)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-dash-text-secondary mb-1.5">
                      Recent orders
                    </div>
                    <div className="border border-dash-border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-dash-bg text-[10px] uppercase tracking-wider text-dash-text-secondary">
                          <tr>
                            <th className="text-left px-3 py-2">Date</th>
                            <th className="text-left px-3 py-2">Customer</th>
                            <th className="text-right px-3 py-2">Qty</th>
                            <th className="text-right px-3 py-2">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.orders.map((o) => (
                            <tr key={o.orderId} className="border-t border-dash-border">
                              <td className="px-3 py-2 text-dash-text-secondary">
                                {o.dateOrder || "—"}
                              </td>
                              <td className="px-3 py-2">
                                <div className="truncate max-w-[220px]">{o.partnerName}</div>
                                <div className="text-[10px] text-dash-text-secondary font-mono">
                                  {o.orderName}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right">{o.quantity}</td>
                              <td className="px-3 py-2 text-right">
                                {formatMoney(o.priceUnit, history.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Sticky action bar */}
        <footer className="border-t border-dash-border bg-dash-surface px-6 py-3 space-y-2">
          {walkInOpen ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <CustomerCombobox
                  autoFocus
                  value={walkInCompany}
                  onChange={(v) => setWalkInCompany(v)}
                  placeholder="Customer / company * (type to find or add)"
                />
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Deal name (optional)"
                  className="px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-dash-text-secondary">Qty</span>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 px-2 py-1.5 text-sm bg-dash-bg border border-dash-border rounded text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper"
                  />
                </div>
                <button
                  type="button"
                  onClick={startWalkIn}
                  disabled={adding || !walkInCompany.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-copper text-white rounded-lg text-sm font-semibold hover:bg-brand-copper/90 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />}
                  Create deal + add
                </button>
                <button
                  type="button"
                  onClick={() => setWalkInOpen(false)}
                  className="px-3 py-2 text-xs text-dash-text-secondary hover:bg-dash-bg rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : pickerOpen ? (
            <div className="space-y-2">
              <select
                value={pickerDealId}
                onChange={(e) => setPickerDealId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper"
              >
                <option value="">Select an open deal…</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.company || d.name}
                    {d.company && d.name && d.company !== d.name ? ` — ${d.name}` : ""}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-dash-text-secondary">Qty</span>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 px-2 py-1.5 text-sm bg-dash-bg border border-dash-border rounded text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const d = deals.find((x) => x.id === pickerDealId);
                    if (d) addToDeal(d.id, d.company || d.name);
                  }}
                  disabled={!pickerDealId || adding}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-copper text-white rounded-lg text-sm font-semibold hover:bg-brand-copper/90 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add to deal
                </button>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="px-3 py-2 text-xs text-dash-text-secondary hover:bg-dash-bg rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : active ? (
            // Active order mode — one-click primary add.
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-dash-text-secondary">Qty</span>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 px-2 py-1.5 text-sm bg-dash-bg border border-dash-border rounded text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addToDeal(active.dealId, activeLabel)}
                  disabled={adding}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-copper text-white rounded-lg text-sm font-semibold hover:bg-brand-copper/90 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add to {activeLabel}
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="text-dash-text-secondary hover:text-dash-text underline decoration-dotted cursor-pointer"
                >
                  Add to a different deal
                </button>
                <span className="text-dash-text-secondary/50">·</span>
                <button
                  type="button"
                  onClick={() => setWalkInOpen(true)}
                  className="text-dash-text-secondary hover:text-dash-text underline decoration-dotted cursor-pointer"
                >
                  Start new walk-in deal instead
                </button>
              </div>
            </div>
          ) : (
            // No active order — show both paths as equal-weight.
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWalkInOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-copper text-white rounded-lg text-sm font-semibold hover:bg-brand-copper/90 transition-colors cursor-pointer"
                >
                  <FilePlus className="w-4 h-4" />
                  Start new deal
                </button>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dash-border text-dash-text rounded-lg text-sm font-semibold hover:bg-dash-bg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add to existing deal
                </button>
              </div>
              <p className="text-[11px] text-dash-text-secondary">
                Prices start at $0 / list price; refine on the Pipeline page → Line Items.
              </p>
            </div>
          )}
        </footer>
      </aside>
    </div>
  );
};

export { ProductDetailPanel };
