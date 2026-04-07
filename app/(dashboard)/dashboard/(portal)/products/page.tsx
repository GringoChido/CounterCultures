"use client";

import { useState, useEffect, useCallback } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Plus, Package, Loader2 } from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
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

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-copper text-white rounded-lg text-sm font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer">
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
    </div>
  );
};

export default ProductsPage;
