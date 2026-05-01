"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Save,
  Send,
  Download,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import type { PipelineDeal } from "@/app/lib/sample-dashboard-data";
import type { DocumentType } from "@/app/lib/document-numbers";
import { getDocumentTypeLabel } from "@/app/lib/document-numbers";
import {
  QuoteTemplate,
  type LineItem,
  type QuoteData,
  type QuoteCurrency,
  type QuoteFulfillment,
} from "./templates/quote-template";
import { InvoiceTemplate, type InvoiceData } from "./templates/invoice-template";
import { POTemplate, type POData } from "./templates/po-template";
import {
  DeliveryReceiptTemplate,
  type DeliveryReceiptData,
} from "./templates/delivery-receipt-template";
import { useProductInsert } from "./product-insert-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentGeneratorProps {
  docType: DocumentType;
  deal?: PipelineDeal | null;
  existingDocNumber?: string;
  onClose: () => void;
  onSaved?: (docId: string, driveFileId: string) => void;
  onSend?: (docId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const today = () => new Date().toISOString().split("T")[0];
const addDays = (d: string, n: number) => {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date.toISOString().split("T")[0];
};

const parseProductsString = (products: string): LineItem[] => {
  if (!products) return [{ product: "", sku: "", quantity: 1, unitPrice: 0 }];
  return products.split(",").map((p) => ({
    product: p.trim(),
    sku: "",
    quantity: 1,
    unitPrice: 0,
  }));
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DocumentGenerator = ({
  docType,
  deal,
  existingDocNumber,
  onClose,
  onSaved,
  onSend,
}: DocumentGeneratorProps) => {
  const previewRef = useRef<HTMLDivElement>(null);

  // PR 7 — quote-builder toggles. Default to ES + MXN since Roger's
  // book of business is mostly Mexican-resident customers.
  const [locale, setLocale] = useState<"en" | "es">("es");
  const [currency, setCurrency] = useState<QuoteCurrency>("MXN");
  const [fulfillment, setFulfillment] = useState<QuoteFulfillment>("ship");

  // Shared state
  const [saving, setSaving] = useState(false);
  const [docNumber, setDocNumber] = useState(existingDocNumber ?? "");
  const [date, setDate] = useState(today());
  const [customerName, setCustomerName] = useState(deal?.contactName ?? "");
  const [customerCompany, setCustomerCompany] = useState(
    deal?.contactCompany ?? ""
  );
  const [customerEmail, setCustomerEmail] = useState("");
  const [items, setItems] = useState<LineItem[]>(
    deal?.products ? parseProductsString(deal.products) : [{ product: "", sku: "", quantity: 1, unitPrice: 0 }]
  );
  const [notes, setNotes] = useState("");

  // Quote-specific
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    "percent"
  );
  const [paymentTerms, setPaymentTerms] = useState("50/50");
  const [validityDays, setValidityDays] = useState(15);
  const [deliveryEstimate, setDeliveryEstimate] = useState("");

  // Invoice-specific
  const [taxRate, setTaxRate] = useState(16);
  const [stripeLink, setStripeLink] = useState("");
  const [dueDate, setDueDate] = useState(addDays(today(), 30));

  // PO-specific
  const [manufacturerName, setManufacturerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(
    "Providencia, San Miguel de Allende, Guanajuato, Mexico"
  );
  const [requestedDelivery, setRequestedDelivery] = useState(
    addDays(today(), 30)
  );

  // Receipt-specific
  const [orderReference, setOrderReference] = useState("");

  // Product insert context
  const { consumeInsert, pendingInsert, openCommandPalette } = useProductInsert();

  useEffect(() => {
    if (pendingInsert) {
      const inserted = consumeInsert();
      if (inserted) {
        setItems((prev) => [
          ...prev,
          {
            product: inserted.product,
            sku: inserted.sku,
            quantity: 1,
            unitPrice: docType === "po" ? (inserted.tradePrice || inserted.unitPrice) : inserted.unitPrice,
            brand: inserted.brand,
            image: inserted.image,
            slug: inserted.slug,
          },
        ]);
        toast.success(`Added: ${inserted.product}`);
      }
    }
  }, [pendingInsert, consumeInsert, docType]);

  // Item management
  const addItem = () =>
    setItems([...items, { product: "", sku: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: string | number) =>
    setItems(
      items.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );

  // Build template data
  const quoteData: QuoteData = {
    docNumber,
    date,
    validUntil: addDays(date, validityDays),
    customerName,
    customerCompany,
    customerEmail,
    items,
    discount,
    discountType,
    paymentTerms,
    deliveryEstimate,
    notes,
    locale,
    currency,
    fulfillment,
  };

  const invoiceData: InvoiceData = {
    docNumber,
    date,
    dueDate,
    customerName,
    customerCompany,
    customerEmail,
    items,
    taxRate,
    stripeLink,
    notes,
    locale,
  };

  const poData: POData = {
    docNumber,
    date,
    requestedDelivery,
    manufacturerName,
    deliveryAddress,
    items,
    notes,
    locale,
  };

  const receiptData: DeliveryReceiptData = {
    docNumber,
    date,
    customerName,
    customerCompany,
    deliveryAddress,
    orderReference,
    items,
    notes,
    locale,
  };

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    try {
      const total = items.reduce(
        (sum, i) => sum + i.quantity * i.unitPrice,
        0
      );

      const res = await fetch("/api/dashboard/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          dealId: deal?.id ?? "",
          type: docType,
          customerName,
          amount: String(total),
          htmlContent: previewRef.current?.innerHTML ?? "",
        }),
      });

      if (!res.ok) throw new Error("Failed to save document");

      const data = await res.json();
      setDocNumber(data.docId);
      toast.success("Document saved to Drive");
      onSaved?.(data.docId, data.driveFileId);
    } catch {
      toast.error("Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const html = previewRef.current?.innerHTML;
    if (!html) return;
    const blob = new Blob(
      [
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docNumber}</title>
<style>body{margin:0;padding:0;font-family:'DM Sans',sans-serif}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
</head><body>${html}</body></html>`,
      ],
      { type: "text/html" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docNumber || "document"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Document downloaded");
  };

  // ---------------------------------------------------------------------------
  // Input components (inline for brevity)
  // ---------------------------------------------------------------------------

  const inputCls =
    "w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper transition-colors";
  const labelCls =
    "text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-1 block";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col md:flex-row bg-black/40 overflow-hidden">
      {/* Left: Smart Form (full-width on mobile, 40% on md+) */}
      <div className="w-full md:w-[40%] md:min-w-[360px] flex-1 md:flex-initial bg-dash-surface md:border-r border-b md:border-b-0 border-dash-border flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dash-border bg-dash-bg/50">
          <div>
            <h3 className="text-sm font-semibold text-dash-text">
              {docNumber
                ? `Edit ${getDocumentTypeLabel(docType)} — ${docNumber}`
                : `New ${getDocumentTypeLabel(docType)}`}
            </h3>
            {deal && (
              <p className="text-[11px] text-dash-text-secondary mt-0.5">
                Deal: {deal.name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-dash-text-secondary" />
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* PR 7 — quote-only toggles: language, currency, fulfillment.
              These ride at the top of the form so Roger picks them before
              picking line items, and they propagate into the rendered PDF. */}
          {docType === "quote" && (
            <div className="border border-brand-copper/30 bg-brand-copper/5 rounded-lg p-3 space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary">
                  Language
                </span>
                {(["en", "es"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLocale(v)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                      locale === v
                        ? "bg-brand-charcoal text-white border-brand-charcoal"
                        : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-text-secondary"
                    }`}
                  >
                    {v.toUpperCase()}
                  </button>
                ))}
                <span className="w-px h-4 bg-dash-border mx-1" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary">
                  Currency
                </span>
                {(["MXN", "USD"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCurrency(v)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                      currency === v
                        ? "bg-brand-charcoal text-white border-brand-charcoal"
                        : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-text-secondary"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary">
                  Fulfillment
                </span>
                {(
                  [
                    { v: "ship" as const, label: "Skydropx" },
                    { v: "local" as const, label: "SMA · Miguel" },
                    { v: "pickup" as const, label: "Pickup · Warehouse" },
                  ]
                ).map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFulfillment(v)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                      fulfillment === v
                        ? "bg-brand-copper text-white border-brand-copper"
                        : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-brand-copper/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer fields (not for PO) */}
          {docType !== "po" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                Customer
              </p>
              <div>
                <label className={labelCls}>Name</label>
                <input
                  className={inputCls}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className={labelCls}>Company</label>
                <input
                  className={inputCls}
                  value={customerCompany}
                  onChange={(e) => setCustomerCompany(e.target.value)}
                  placeholder="Company"
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  className={inputCls}
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          )}

          {/* PO: Manufacturer */}
          {docType === "po" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                Manufacturer
              </p>
              <div>
                <label className={labelCls}>Manufacturer / Brand</label>
                <input
                  className={inputCls}
                  value={manufacturerName}
                  onChange={(e) => setManufacturerName(e.target.value)}
                  placeholder="e.g. Kohler, Brizo"
                />
              </div>
              <div>
                <label className={labelCls}>Ship To Address</label>
                <input
                  className={inputCls}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Requested Delivery Date</label>
                <input
                  className={inputCls}
                  type="date"
                  value={requestedDelivery}
                  onChange={(e) => setRequestedDelivery(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Receipt: delivery info */}
          {docType === "receipt" && (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Delivery Address</label>
                <input
                  className={inputCls}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Order Reference</label>
                <input
                  className={inputCls}
                  value={orderReference}
                  onChange={(e) => setOrderReference(e.target.value)}
                  placeholder="e.g. CC-Q-2026-001"
                />
              </div>
            </div>
          )}

          {/* Line items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                {docType === "po" ? "Products to Order" : "Line Items"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={openCommandPalette}
                  className="flex items-center gap-1 text-xs text-brand-copper hover:text-brand-copper/80 transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  Search Catalog
                </button>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Manual Entry
                </button>
              </div>
            </div>
            {items.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 items-end bg-dash-bg/50 rounded-lg p-3"
              >
                <div className="col-span-5 flex items-end gap-2">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.product || "Product"}
                      className="w-8 h-8 rounded object-cover shrink-0 mb-0.5"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                      onLoad={(e) => {
                        if (e.currentTarget.naturalWidth > 0 && e.currentTarget.naturalWidth < 200) {
                          e.currentTarget.style.display = "none";
                        }
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <label className={labelCls}>Product</label>
                    <input
                      className={inputCls}
                      value={item.product}
                      onChange={(e) => updateItem(i, "product", e.target.value)}
                      placeholder="Product name"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>SKU</label>
                  <input
                    className={inputCls}
                    value={item.sku}
                    onChange={(e) => updateItem(i, "sku", e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <label className={labelCls}>Qty</label>
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(i, "quantity", parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div className="col-span-3">
                  <label className={labelCls}>
                    {docType === "po" ? "Dealer Cost" : "Unit Price"}
                  </label>
                  <input
                    className={inputCls}
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(
                        i,
                        "unitPrice",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(i)}
                      className="p-1.5 rounded hover:bg-dash-danger/10 text-dash-text-secondary hover:text-dash-danger transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quote-specific fields */}
          {docType === "quote" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                Terms
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Discount</label>
                  <div className="flex gap-2">
                    <input
                      className={`${inputCls} flex-1`}
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(e) =>
                        setDiscount(parseFloat(e.target.value) || 0)
                      }
                    />
                    <select
                      className={`${inputCls} w-20`}
                      value={discountType}
                      onChange={(e) =>
                        setDiscountType(e.target.value as "percent" | "fixed")
                      }
                    >
                      <option value="percent">%</option>
                      <option value="fixed">$</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Valid For (days)</label>
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    value={validityDays}
                    onChange={(e) =>
                      setValidityDays(parseInt(e.target.value) || 15)
                    }
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Payment Terms</label>
                <select
                  className={inputCls}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                >
                  <option value="50/50">50% upfront, 50% on delivery</option>
                  <option value="full">Full payment upfront</option>
                  <option value="net-30">Net 30</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Delivery Estimate</label>
                <input
                  className={inputCls}
                  value={deliveryEstimate}
                  onChange={(e) => setDeliveryEstimate(e.target.value)}
                  placeholder="e.g. 4-6 weeks from order date"
                />
              </div>
            </div>
          )}

          {/* Invoice-specific fields */}
          {docType === "invoice" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                Invoice Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tax Rate (%)</label>
                  <input
                    className={inputCls}
                    type="number"
                    value={taxRate}
                    onChange={(e) =>
                      setTaxRate(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Due Date</label>
                  <input
                    className={inputCls}
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Stripe Payment Link</label>
                <input
                  className={inputCls}
                  value={stripeLink}
                  onChange={(e) => setStripeLink(e.target.value)}
                  placeholder="https://pay.stripe.com/..."
                />
              </div>
            </div>
          )}

          {/* Notes (all types) */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-dash-border bg-dash-bg/50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Draft
          </button>
          <button
            onClick={() => {
              if (docNumber) onSend?.(docNumber);
            }}
            disabled={!docNumber}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* Right: Live Preview — hidden under md, side-by-side from md+ */}
      <div className="hidden md:flex flex-1 bg-dash-preview-bg overflow-y-auto">
        <div className="p-8" ref={previewRef}>
          {docType === "quote" && <QuoteTemplate data={quoteData} />}
          {docType === "invoice" && <InvoiceTemplate data={invoiceData} />}
          {docType === "po" && <POTemplate data={poData} />}
          {docType === "receipt" && (
            <DeliveryReceiptTemplate data={receiptData} />
          )}
        </div>
      </div>
    </div>
  );
};
