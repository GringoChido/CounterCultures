"use client";

import { useState, useEffect, useCallback } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Plus, Package, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";

interface SheetProduct {
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price_mxn: string;
  price_usd: string;
  description: string;
  features: string;
  dimensions: string;
  materials: string;
  finish: string;
  availability: string;
  image_url: string;
  gallery_urls: string;
  featured: string;
  lead_time: string;
  sku: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  availability: "in-stock" | "low-stock" | "out-of-stock" | "made-to-order";
}

const mapProduct = (s: SheetProduct): Product => ({
  id: s.slug || s.sku,
  sku: s.sku,
  name: s.name,
  brand: s.brand,
  category: s.category,
  price: parseFloat(s.price_mxn) || 0,
  availability: (s.availability as Product["availability"]) || "in-stock",
});

const availabilityVariants: Record<string, BadgeVariant> = {
  "in-stock": "success",
  "low-stock": "warning",
  "out-of-stock": "danger",
  "made-to-order": "info",
};

const availabilityLabels: Record<string, string> = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
  "made-to-order": "Made to Order",
};

const columnHelper = createColumnHelper<Product>();

const columns = [
  columnHelper.accessor("sku", {
    header: "SKU",
    cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
  }),
  columnHelper.accessor("name", {
    header: "Product",
    cell: (info) => (
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-dash-text-secondary" />
        <span className="font-medium">{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor("brand", {
    header: "Brand",
  }),
  columnHelper.accessor("category", {
    header: "Category",
    cell: (info) => <span className="text-dash-text-secondary">{info.getValue()}</span>,
  }),
  columnHelper.accessor("price", {
    header: "Price (MXN)",
    cell: (info) => <span className="font-medium">${info.getValue().toLocaleString()}</span>,
  }),
  columnHelper.accessor("availability", {
    header: "Availability",
    cell: (info) => {
      const status = info.getValue();
      return <StatusBadge label={availabilityLabels[status] ?? status} variant={availabilityVariants[status] ?? "info"} />;
    },
  }),
];

const EMPTY_PRODUCT: SheetProduct = {
  slug: "", name: "", brand: "", category: "", subcategory: "",
  price_mxn: "", price_usd: "", description: "", features: "",
  dimensions: "", materials: "", finish: "", availability: "in-stock",
  image_url: "", gallery_urls: "", featured: "false", lead_time: "", sku: "",
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const ProductForm = ({ initial, onSave, onCancel }: { initial: SheetProduct; onSave: (p: SheetProduct) => void; onCancel: () => void }) => {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof SheetProduct, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name) { toast.error("Product name is required"); return; }
    setSaving(true);
    try {
      const slug = form.slug || slugify(form.name);
      const product = { ...form, slug };
      const isNew = !initial.slug;
      const res = await fetch("/api/dashboard/products", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success(isNew ? "Product added" : "Product updated");
      onSave(product);
    } catch {
      toast.error("Error saving product");
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = "w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:ring-1 focus:ring-brand-copper";
  const labelClass = "block text-xs font-medium text-dash-text-secondary mb-1";

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Product Name *</label>
        <input className={fieldClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Litze Pull-Down Faucet" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Brand</label>
          <input className={fieldClass} value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Brizo" />
        </div>
        <div>
          <label className={labelClass}>SKU</label>
          <input className={fieldClass} value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="e.g. 63054LF-GL" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Category</label>
          <input className={fieldClass} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Faucets" />
        </div>
        <div>
          <label className={labelClass}>Subcategory</label>
          <input className={fieldClass} value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)} placeholder="e.g. Kitchen" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Price (MXN)</label>
          <input className={fieldClass} type="number" value={form.price_mxn} onChange={(e) => set("price_mxn", e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className={labelClass}>Price (USD)</label>
          <input className={fieldClass} type="number" value={form.price_usd} onChange={(e) => set("price_usd", e.target.value)} placeholder="0" />
        </div>
      </div>
      <div>
        <label className={labelClass}>Finish</label>
        <input className={fieldClass} value={form.finish} onChange={(e) => set("finish", e.target.value)} placeholder="e.g. Luxe Gold" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Availability</label>
          <select className={fieldClass} value={form.availability} onChange={(e) => set("availability", e.target.value)}>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="made-to-order">Made to Order</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Lead Time</label>
          <input className={fieldClass} value={form.lead_time} onChange={(e) => set("lead_time", e.target.value)} placeholder="e.g. 3-4 weeks" />
        </div>
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea className={`${fieldClass} h-20 resize-none`} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Product description..." />
      </div>
      <div>
        <label className={labelClass}>Dimensions</label>
        <input className={fieldClass} value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Materials</label>
        <input className={fieldClass} value={form.materials} onChange={(e) => set("materials", e.target.value)} />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {initial.slug ? "Update Product" : "Add Product"}
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2 text-dash-text-secondary border border-dash-border rounded-lg text-sm hover:bg-dash-bg transition-colors cursor-pointer">
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
};

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SheetProduct>(EMPTY_PRODUCT);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts((data.products as SheetProduct[]).map(mapProduct));
    } catch (err) {
      console.error(err);
      setError("Unable to load products from CRM.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchProducts}
          className="px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const inStock = products.filter((p) => p.availability === "in-stock").length;
  const lowStock = products.filter((p) => p.availability === "low-stock").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Products</h2>
          <p className="text-sm text-dash-text-secondary mt-1">
            {products.length} products &middot; {inStock} in stock &middot; {lowStock} low stock
          </p>
        </div>
        <button
          onClick={() => { setEditingProduct(EMPTY_PRODUCT); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <DataTable
        data={products as unknown as Record<string, unknown>[]}
        columns={columns as never}
        searchKey="name"
        searchPlaceholder="Search products..."
      />

      <SlideOut
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingProduct.slug ? "Edit Product" : "Add Product"}
      >
        <ProductForm
          initial={editingProduct}
          onSave={() => { setFormOpen(false); fetchProducts(); }}
          onCancel={() => setFormOpen(false)}
        />
      </SlideOut>
    </div>
  );
};

export default ProductsPage;
