"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Filter,
  Download,
  Loader2,
  Star,
  ExternalLink,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import type {
  Brand,
  CategorySlug,
  StockedState,
} from "@/app/lib/brand-kit-types";
import { CATEGORY_LABELS } from "@/app/lib/brand-kit-types";

const CATEGORY_OPTIONS: Array<CategorySlug | "all"> = [
  "all",
  "faucetry-showers",
  "door-cabinet-hardware",
  "bathroom-sinks",
  "kitchen-sinks",
  "drains",
  "toilets",
  "bathtubs",
  "appliances",
  "other",
];

type StockFilter = "all" | "stocked" | "request" | "external" | "untagged";

const STOCK_FILTER_OPTIONS: StockFilter[] = [
  "all",
  "stocked",
  "request",
  "external",
  "untagged",
];

const STOCK_LABELS: Record<StockFilter, string> = {
  all: "All stock states",
  stocked: "Stocked",
  request: "On request",
  external: "External",
  untagged: "Untagged",
};

const stockBadgeVariant = (s: StockedState): BadgeVariant => {
  if (s === "stocked") return "success";
  if (s === "request") return "warning";
  if (s === "external") return "info";
  return "default";
};

const stockBadgeLabel = (s: StockedState): string => {
  if (s === "stocked") return "Stocked";
  if (s === "request") return "Request";
  if (s === "external") return "External";
  return "Untagged";
};

const BrandInitial = ({ name }: { name: string }) => {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="w-9 h-9 rounded-lg bg-brand-copper/10 text-brand-copper border border-brand-copper/20 flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {initial}
    </div>
  );
};

const columnHelper = createColumnHelper<Brand>();

const columns = [
  columnHelper.accessor("name", {
    header: "Brand",
    cell: (info) => {
      const b = info.row.original;
      return (
        <div className="flex items-center gap-3 min-w-0">
          <BrandInitial name={b.name} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-medium truncate">{b.name}</p>
              {b.isFeatured && (
                <Star
                  className="w-3.5 h-3.5 text-brand-copper fill-brand-copper flex-shrink-0"
                  aria-label="Featured"
                />
              )}
            </div>
            <p className="text-xs text-dash-text-secondary truncate">
              {b.taglineEn ||
                b.originCountryName ||
                CATEGORY_LABELS[b.primaryCategorySlug as CategorySlug] ||
                b.slug}
            </p>
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("originCountry", {
    header: "Origin",
    cell: (info) => {
      const b = info.row.original;
      if (!b.originCountry) {
        return <span className="text-dash-text-secondary">&mdash;</span>;
      }
      return (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-mono font-semibold text-dash-text">
            {b.originCountry}
          </span>
          <span className="text-dash-text-secondary">
            {b.originCountryName}
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("primaryCategorySlug", {
    header: "Primary Category",
    cell: (info) => {
      const slug = info.getValue() as CategorySlug | "";
      const label = slug ? CATEGORY_LABELS[slug] : "—";
      const extra = info.row.original.categorySlugs.length - 1;
      return (
        <div className="text-xs">
          <p className="text-dash-text">{label}</p>
          {extra > 0 && (
            <p className="text-dash-text-secondary">+{extra} more</p>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("stockedState", {
    header: "Stock State",
    cell: (info) => {
      const state = info.getValue();
      return (
        <StatusBadge
          label={stockBadgeLabel(state)}
          variant={stockBadgeVariant(state)}
        />
      );
    },
  }),
  columnHelper.display({
    id: "products",
    header: "Products",
    cell: () => (
      <span className="text-xs text-dash-text-secondary" title="Product count lands with the Products module (phase 2)">
        &mdash;
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: (info) => {
      const b = info.row.original;
      const href = b.websiteUrl || b.externalUrl;
      if (!href) return null;
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-dash-bg text-dash-text-secondary hover:text-brand-copper transition-colors"
          title="Visit brand website"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      );
    },
  }),
];

const exportBrandsToCSV = (brands: Brand[]) => {
  const headers = [
    "slug",
    "name",
    "origin_country",
    "origin_country_name",
    "primary_category",
    "categories",
    "stocked_state",
    "is_featured",
    "is_artisan",
    "website_url",
  ];
  const rows = brands.map((b) => [
    b.slug,
    b.name,
    b.originCountry,
    b.originCountryName,
    b.primaryCategorySlug,
    b.categorySlugs.join("|"),
    b.stockedState,
    String(b.isFeatured),
    String(b.isArtisan),
    b.websiteUrl,
  ]);
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `counter-cultures-brands-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const BrandsPage = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategorySlug | "all">("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/brands");
      if (!res.ok) throw new Error("Failed to fetch brands");
      const data = await res.json();
      setBrands(data.brands as Brand[]);
    } catch (err) {
      console.error(err);
      setError("Unable to load brands from the Brand Kit Sheet. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const counts = useMemo(() => {
    let stocked = 0;
    let request = 0;
    let external = 0;
    let untagged = 0;
    let featured = 0;
    for (const b of brands) {
      if (b.stockedState === "stocked") stocked++;
      else if (b.stockedState === "request") request++;
      else if (b.stockedState === "external") external++;
      else untagged++;
      if (b.isFeatured) featured++;
    }
    return { total: brands.length, stocked, request, external, untagged, featured };
  }, [brands]);

  const filtered = useMemo(() => {
    return brands.filter((b) => {
      if (
        categoryFilter !== "all" &&
        !b.categorySlugs.includes(categoryFilter) &&
        b.primaryCategorySlug !== categoryFilter
      ) {
        return false;
      }
      if (stockFilter !== "all") {
        if (stockFilter === "untagged" && b.stockedState !== "") return false;
        if (stockFilter !== "untagged" && b.stockedState !== stockFilter) return false;
      }
      return true;
    });
  }, [brands, categoryFilter, stockFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 p-6">
        <p className="text-dash-danger text-center">{error}</p>
        <button
          onClick={fetchBrands}
          className="px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-dash-text">
            Brands
          </h1>
          <p className="text-sm text-dash-text-secondary mt-1">
            {counts.total} brands from the Brand Kit — tag stock state, manage
            product attachments, edit per-brand metadata.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard label="Total" value={String(counts.total)} />
        <KPICard label="Stocked" value={String(counts.stocked)} />
        <KPICard label="On Request" value={String(counts.request)} />
        <KPICard label="External" value={String(counts.external)} />
        <KPICard label="Untagged" value={String(counts.untagged)} />
      </div>

      {/* Untagged notice */}
      {counts.untagged === counts.total && counts.total > 0 && (
        <div className="flex items-start gap-3 bg-dash-warn/5 border border-dash-warn/20 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 text-dash-warn flex-shrink-0 mt-0.5" />
          <div className="text-dash-text-secondary">
            <strong className="text-dash-text">
              No stock state tagged yet.
            </strong>{" "}
            Tag each brand as{" "}
            <span className="text-dash-text">stocked</span> /{" "}
            <span className="text-dash-text">request</span> /{" "}
            <span className="text-dash-text">external</span> directly in the{" "}
            <a
              href="https://docs.google.com/spreadsheets/d/1CHIB3NX0kDSGx4sTulkYmzHn32-6yMtQ_dEqJrD9ZBs/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-copper hover:underline"
            >
              Brand Kit Sheet
            </a>
            . Day 2 task in the roadmap.
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-dash-text-secondary" />
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as CategorySlug | "all")
              }
              className="text-sm bg-dash-surface border border-dash-border rounded-lg px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All categories" : CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            className="text-sm bg-dash-surface border border-dash-border rounded-lg px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
          >
            {STOCK_FILTER_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STOCK_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportBrandsToCSV(filtered)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search brands by name..."
        pageSize={25}
        onRowClick={(b) => setSelectedBrand(b)}
      />

      {/* Slide-out — stub detail for Day 2, fleshed out Day 3 */}
      <SlideOut
        open={!!selectedBrand}
        onClose={() => setSelectedBrand(null)}
        title={selectedBrand?.name ?? "Brand"}
      >
        {selectedBrand && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <BrandInitial name={selectedBrand.name} />
              <div className="min-w-0">
                <p className="font-display text-xl font-light text-dash-text">
                  {selectedBrand.name}
                </p>
                <p className="text-xs text-dash-text-secondary">
                  {selectedBrand.originCountryName || "Origin TBD"}
                </p>
              </div>
            </div>

            {selectedBrand.descriptionEn && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-2">
                  Description
                </h4>
                <p className="text-sm text-dash-text leading-relaxed">
                  {selectedBrand.descriptionEn}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-1.5">
                  Stock State
                </h4>
                <StatusBadge
                  label={stockBadgeLabel(selectedBrand.stockedState)}
                  variant={stockBadgeVariant(selectedBrand.stockedState)}
                />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-1.5">
                  NOM Status
                </h4>
                <span className="text-xs text-dash-text">
                  {selectedBrand.nomStatusSummary}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-2">
                Categories
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedBrand.categorySlugs.length === 0 ? (
                  <span className="text-xs text-dash-text-secondary">
                    &mdash;
                  </span>
                ) : (
                  selectedBrand.categorySlugs.map((c) => (
                    <span
                      key={c}
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        c === selectedBrand.primaryCategorySlug
                          ? "bg-brand-copper/15 text-brand-copper"
                          : "bg-dash-bg text-dash-text-secondary"
                      }`}
                    >
                      {CATEGORY_LABELS[c] ?? c}
                    </span>
                  ))
                )}
              </div>
            </div>

            {selectedBrand.websiteUrl && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-1.5">
                  Website
                </h4>
                <a
                  href={selectedBrand.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-copper hover:underline inline-flex items-center gap-1.5"
                >
                  {selectedBrand.websiteUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="pt-4 border-t border-dash-border text-xs text-dash-text-secondary space-y-1">
              <p>
                Slug:{" "}
                <code className="px-1.5 py-0.5 bg-dash-bg rounded">
                  {selectedBrand.slug}
                </code>
              </p>
              <p>
                Featured: {selectedBrand.isFeatured ? "Yes" : "No"} · Artisan:{" "}
                {selectedBrand.isArtisan ? "Yes" : "No"}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Link
                href={`/dashboard/brands/${selectedBrand.slug}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                Open full edit
              </Link>
              {selectedBrand.websiteUrl && (
                <a
                  href={selectedBrand.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-3 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </SlideOut>
    </div>
  );
};

export default BrandsPage;
