"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Plus, Package } from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  availability: "in-stock" | "low-stock" | "out-of-stock" | "made-to-order";
}

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

const products: Product[] = [
  {
    id: "1",
    sku: "CC-OVB-18",
    name: "Hand-Hammered Oval Basin 18\"",
    brand: "Counter Cultures",
    category: "Basins",
    price: 9000,
    availability: "in-stock",
  },
  {
    id: "2",
    sku: "CC-FHS-33",
    name: "Copper Farmhouse Sink 33\"",
    brand: "Counter Cultures",
    category: "Kitchen Sinks",
    price: 15000,
    availability: "in-stock",
  },
  {
    id: "3",
    sku: "CC-RVB-16",
    name: "Round Vessel Basin 16\"",
    brand: "Counter Cultures",
    category: "Basins",
    price: 7000,
    availability: "low-stock",
  },
  {
    id: "4",
    sku: "CC-BRS-15",
    name: "Copper Bar Sink 15\"",
    brand: "Counter Cultures",
    category: "Bar Sinks",
    price: 5500,
    availability: "in-stock",
  },
  {
    id: "5",
    sku: "CC-CPB-20",
    name: "Custom Patina Basin 20\"",
    brand: "Counter Cultures",
    category: "Basins",
    price: 12000,
    availability: "made-to-order",
  },
  {
    id: "6",
    sku: "CC-DBL-36",
    name: "Double Bowl Farmhouse Sink 36\"",
    brand: "Counter Cultures",
    category: "Kitchen Sinks",
    price: 22000,
    availability: "out-of-stock",
  },
];

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
      return <StatusBadge label={availabilityLabels[status]} variant={availabilityVariants[status]} />;
    },
  }),
];

const ProductsPage = () => {
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
