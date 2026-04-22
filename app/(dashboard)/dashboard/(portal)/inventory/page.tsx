"use client";

import { useState, useEffect, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Boxes,
  Search,
  Loader2,
  AlertCircle,
  PackageX,
  Package,
  MapPin,
} from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";

type SortBy = "product" | "location" | "onhand_desc" | "onhand_asc" | "in_date_desc";

interface InventoryRow {
  id: string;
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  onHand: number;
  reserved: number;
  available: number;
  inDate: string;
  lotId: string;
}

interface LocationSummary {
  name: string;
  locationId: string;
  productCount: number;
  totalUnits: number;
}

interface Summary {
  totalUnits: number;
  totalProducts: number;
  totalLocations: number;
  lowStock: number;
  outOfStock: number;
  byLocation: LocationSummary[];
}

const fmtNum = (n: number) =>
  Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2);

const stockVariant = (onHand: number): BadgeVariant => {
  if (onHand <= 0) return "danger";
  if (onHand < 5) return "warning";
  return "success";
};

const columnHelper = createColumnHelper<InventoryRow>();

const columns = [
  columnHelper.accessor("productName", {
    header: "Product",
    cell: (info) => (
      <span className="text-sm line-clamp-1" title={info.getValue()}>
        {info.getValue() || "—"}
      </span>
    ),
  }),
  columnHelper.accessor("locationName", {
    header: "Location",
    cell: (info) => (
      <span className="text-xs text-dash-text-secondary line-clamp-1">
        {info.getValue() || "—"}
      </span>
    ),
  }),
  columnHelper.accessor("onHand", {
    header: "On hand",
    cell: (info) => {
      const r = info.row.original;
      return (
        <div className="flex items-center gap-1.5 justify-end">
          <StatusBadge
            label={fmtNum(r.onHand)}
            variant={stockVariant(r.onHand)}
          />
        </div>
      );
    },
  }),
  columnHelper.accessor("reserved", {
    header: "Reserved",
    cell: (info) => (
      <span className="text-right block text-xs text-dash-text-secondary">
        {info.getValue() ? fmtNum(info.getValue()) : "—"}
      </span>
    ),
  }),
  columnHelper.accessor("available", {
    header: "Available",
    cell: (info) => (
      <span className="text-right block text-xs font-medium">
        {fmtNum(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor("inDate", {
    header: "Received",
    cell: (info) => (
      <span className="text-xs text-dash-text-secondary">
        {info.getValue() || "—"}
      </span>
    ),
  }),
  columnHelper.accessor("lotId", {
    header: "Lot",
    cell: (info) => (
      <span className="font-mono text-[10px] text-dash-text-secondary">
        {info.getValue() || "—"}
      </span>
    ),
  }),
];

const InventoryPage = () => {
  const [query, setQuery] = useState("");
  const [locationId, setLocationId] = useState<string>("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [outOfStockOnly, setOutOfStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("product");
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        if (query) p.set("q", query);
        if (locationId) p.set("locationId", locationId);
        if (lowStockOnly) p.set("lowStockOnly", "true");
        if (outOfStockOnly) p.set("outOfStockOnly", "true");
        p.set("sort", sortBy);
        p.set("limit", "500");
        const res = await fetch(`/api/dashboard/inventory?${p.toString()}`);
        const data = await res.json();
        setRows(data.items ?? []);
        setTotal(data.total ?? 0);
        setSummary(data.summary ?? null);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, locationId, lowStockOnly, outOfStockOnly, sortBy]);

  const activeFilters = useMemo(() => {
    const out: string[] = [];
    if (locationId && summary) {
      const l = summary.byLocation.find((x) => x.locationId === locationId);
      if (l) out.push(l.name);
    }
    if (lowStockOnly) out.push("low stock");
    if (outOfStockOnly) out.push("out of stock");
    return out;
  }, [locationId, lowStockOnly, outOfStockOnly, summary]);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Boxes className="w-6 h-6 text-dash-accent" />
          <h1 className="font-display text-2xl">Inventory</h1>
        </div>
        <p className="text-sm text-dash-text-secondary">
          On-hand stock levels across every warehouse location — from the live Odoo snapshot.
        </p>
      </header>

      {summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <div className="bg-dash-surface border border-dash-border p-4 rounded">
              <div className="text-xs uppercase tracking-wider text-dash-text-secondary">
                Total units
              </div>
              <div className="text-2xl font-semibold text-dash-text mt-1">
                {fmtNum(summary.totalUnits)}
              </div>
            </div>
            <div className="bg-dash-surface border border-dash-border p-4 rounded">
              <div className="text-xs uppercase tracking-wider text-dash-text-secondary">
                Unique products
              </div>
              <div className="text-2xl font-semibold text-dash-text mt-1">
                {summary.totalProducts.toLocaleString()}
              </div>
            </div>
            <div className="bg-dash-surface border border-dash-border p-4 rounded">
              <div className="text-xs uppercase tracking-wider text-dash-text-secondary">
                Locations
              </div>
              <div className="text-2xl font-semibold text-dash-text mt-1">
                {summary.totalLocations}
              </div>
            </div>
            <button
              onClick={() => {
                setLowStockOnly((v) => !v);
                setOutOfStockOnly(false);
              }}
              className={`border p-4 rounded text-left transition-colors ${
                lowStockOnly
                  ? "bg-dash-accent text-white border-dash-accent"
                  : "bg-dash-surface border-dash-border hover:border-dash-accent"
              }`}
            >
              <div className="text-xs uppercase tracking-wider flex items-center gap-1">
                <Package className="w-3 h-3" />
                Low stock
              </div>
              <div className="text-2xl font-semibold mt-1">{summary.lowStock}</div>
              <div className="text-[10px] opacity-70 mt-1">On hand &lt; 5</div>
            </button>
            <button
              onClick={() => {
                setOutOfStockOnly((v) => !v);
                setLowStockOnly(false);
              }}
              className={`border p-4 rounded text-left transition-colors ${
                outOfStockOnly
                  ? "bg-dash-accent text-white border-dash-accent"
                  : "bg-dash-surface border-dash-border hover:border-dash-accent"
              }`}
            >
              <div className="text-xs uppercase tracking-wider flex items-center gap-1">
                <PackageX className="w-3 h-3" />
                Out of stock
              </div>
              <div className="text-2xl font-semibold mt-1">{summary.outOfStock}</div>
              <div className="text-[10px] opacity-70 mt-1">Zero on hand</div>
            </button>
          </div>

          {/* Location chips */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-dash-text-secondary mb-2">
              <MapPin className="w-3 h-3" />
              Locations
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setLocationId("")}
                className={`shrink-0 px-3 py-2 border text-xs rounded transition-colors ${
                  !locationId
                    ? "bg-dash-accent text-white border-dash-accent"
                    : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-accent"
                }`}
              >
                All locations ({summary.totalProducts} SKUs)
              </button>
              {summary.byLocation.map((l) => (
                <button
                  key={l.locationId || l.name}
                  onClick={() => setLocationId(l.locationId)}
                  className={`shrink-0 px-3 py-2 border text-xs rounded transition-colors text-left ${
                    locationId === l.locationId
                      ? "bg-dash-accent text-white border-dash-accent"
                      : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-accent"
                  }`}
                >
                  <div className="font-medium text-[11px] line-clamp-1 max-w-[180px]">
                    {l.name || "Unknown"}
                  </div>
                  <div className="text-[10px] opacity-70 mt-0.5">
                    {l.productCount} SKU · {fmtNum(l.totalUnits)} units
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product name or lot…"
            className="w-full pl-10 pr-4 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus:border-dash-accent rounded"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus:border-dash-accent rounded"
        >
          <option value="product">Product A-Z</option>
          <option value="location">Location A-Z</option>
          <option value="onhand_desc">Most on hand</option>
          <option value="onhand_asc">Least on hand</option>
          <option value="in_date_desc">Most recently received</option>
        </select>
      </div>

      <div className="mb-2 text-xs text-dash-text-secondary">
        {total.toLocaleString()} stock row{total === 1 ? "" : "s"}
        {activeFilters.length > 0 && <> · filtered: {activeFilters.join(", ")}</>}
      </div>

      <div className="bg-dash-surface border border-dash-border rounded">
        <DataTable columns={columns} data={rows} />
      </div>
    </div>
  );
};

export default InventoryPage;
