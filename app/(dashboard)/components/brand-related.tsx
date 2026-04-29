"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Briefcase,
  Ship,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";

type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  slug?: string;
  price?: string;
  availability?: string;
};

type Deal = {
  id: string;
  name: string;
  company?: string;
  stage: string;
  value?: string;
  brand_slugs?: string;
};

type Trafico = {
  TRF_ID: string;
  Trafico_Number?: string;
  Status?: string;
  Pedimento_Number?: string;
  Initiated_Date?: string;
};

type BlogPost = {
  slug: string;
  title: { en: string; es: string };
  status: string;
  date: string;
  brandSlugs?: string[];
};

type RelatedTab = "products" | "deals" | "shipments" | "blog";

type BrandRelatedProps = {
  brandSlug: string;
  brandName: string;
};

type TabSpec = {
  id: RelatedTab;
  label: string;
  Icon: typeof Package;
};

const TABS: TabSpec[] = [
  { id: "products", label: "Products", Icon: Package },
  { id: "deals", label: "Deals", Icon: Briefcase },
  { id: "shipments", label: "Shipments", Icon: Ship },
  { id: "blog", label: "Blog Posts", Icon: FileText },
];

const formatPrice = (v?: string) => {
  if (!v) return "—";
  const n = Number(v);
  return Number.isFinite(n)
    ? new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
      }).format(n)
    : v;
};

const BrandRelated = ({ brandSlug, brandName }: BrandRelatedProps) => {
  const [active, setActive] = useState<RelatedTab>("products");

  // Lazy-loaded data, one cache per tab.
  const [products, setProducts] = useState<Product[] | null>(null);
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [shipments, setShipments] = useState<Trafico[] | null>(null);
  const [posts, setPosts] = useState<BlogPost[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (active === "products" && products === null) {
          const res = await fetch("/api/dashboard/products");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as { products?: Product[] };
          const filtered = (data.products ?? []).filter(
            (p) =>
              p.brand &&
              p.brand.toLowerCase().replace(/\s+/g, "-") === brandSlug
          );
          if (!aborted) setProducts(filtered);
        } else if (active === "deals" && deals === null) {
          const res = await fetch("/api/dashboard/pipeline");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as { deals?: Deal[] };
          const filtered = (data.deals ?? []).filter((d) =>
            (d.brand_slugs || "")
              .split("|")
              .map((s) => s.trim().toLowerCase())
              .includes(brandSlug)
          );
          if (!aborted) setDeals(filtered);
        } else if (active === "shipments" && shipments === null) {
          const [itemsRes, traficosRes] = await Promise.all([
            fetch("/api/dashboard/trafico-items"),
            fetch("/api/dashboard/traficos"),
          ]);
          if (!itemsRes.ok || !traficosRes.ok) {
            throw new Error("Shipments fetch failed");
          }
          const itemsJson = (await itemsRes.json()) as {
            items?: { trafico_id: string; brand_slug?: string; vendor_name?: string }[];
          };
          const traficosJson = (await traficosRes.json()) as {
            traficos?: Trafico[];
          };
          const matchIds = new Set(
            (itemsJson.items ?? [])
              .filter(
                (it) =>
                  (it.brand_slug && it.brand_slug.toLowerCase() === brandSlug) ||
                  (it.vendor_name &&
                    it.vendor_name.toLowerCase().replace(/\s+/g, "-") === brandSlug)
              )
              .map((it) => it.trafico_id)
          );
          const filtered = (traficosJson.traficos ?? []).filter((t) =>
            matchIds.has(t.TRF_ID)
          );
          if (!aborted) setShipments(filtered);
        } else if (active === "blog" && posts === null) {
          const res = await fetch("/api/dashboard/blog-posts");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as { posts?: BlogPost[] };
          const filtered = (data.posts ?? []).filter((p) =>
            (p.brandSlugs ?? []).includes(brandSlug)
          );
          if (!aborted) setPosts(filtered);
        }
      } catch (err) {
        if (!aborted) setError(err instanceof Error ? err.message : "Load failed");
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    load();
    return () => {
      aborted = true;
    };
  }, [active, brandSlug, products, deals, shipments, posts]);

  const counts = {
    products: products?.length,
    deals: deals?.length,
    shipments: shipments?.length,
    blog: posts?.length,
  };

  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-1 px-4 pt-3 border-b border-dash-border overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          const count = counts[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? "text-brand-copper border-brand-copper"
                  : "text-dash-text-secondary border-transparent hover:text-dash-text"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {typeof count === "number" ? (
                <span
                  className={`text-[10px] ml-0.5 ${
                    isActive ? "text-brand-copper" : "text-dash-text-muted"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="p-4 min-h-[180px]">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-dash-text-muted py-8 justify-center">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading…
          </div>
        ) : error ? (
          <p className="text-sm text-dash-danger py-8 text-center">{error}</p>
        ) : null}

        {!loading && !error && active === "products" ? (
          <ProductsList products={products} brandName={brandName} />
        ) : null}
        {!loading && !error && active === "deals" ? (
          <DealsList deals={deals} />
        ) : null}
        {!loading && !error && active === "shipments" ? (
          <ShipmentsList shipments={shipments} />
        ) : null}
        {!loading && !error && active === "blog" ? (
          <BlogList posts={posts} brandSlug={brandSlug} />
        ) : null}
      </div>
    </div>
  );
};

// ── Sub-lists ─────────────────────────────────────────────────────────

const EmptyState = ({ label }: { label: string }) => (
  <p className="text-sm text-dash-text-muted py-8 text-center">{label}</p>
);

const ProductsList = ({
  products,
  brandName,
}: {
  products: Product[] | null;
  brandName: string;
}) => {
  if (!products || products.length === 0)
    return <EmptyState label={`No products tagged to ${brandName}`} />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {products.slice(0, 40).map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-3 px-3 py-2 bg-dash-bg/50 border border-dash-border rounded"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-dash-text truncate">{p.name}</p>
            <p className="text-[11px] text-dash-text-secondary truncate">
              {p.sku || "—"}
            </p>
          </div>
          <span className="text-[11px] text-brand-copper font-medium shrink-0">
            {formatPrice(p.price)}
          </span>
        </div>
      ))}
      {products.length > 40 ? (
        <Link
          href={`/dashboard/products?brand=${encodeURIComponent(brandName)}`}
          className="col-span-full text-xs text-brand-copper hover:underline text-center py-2"
        >
          View all {products.length} →
        </Link>
      ) : null}
    </div>
  );
};

const DealsList = ({ deals }: { deals: Deal[] | null }) => {
  if (!deals || deals.length === 0)
    return <EmptyState label="No deals include this brand yet" />;
  return (
    <ul className="divide-y divide-dash-border -my-2">
      {deals.slice(0, 20).map((d) => (
        <li key={d.id} className="py-2 flex items-center justify-between gap-3">
          <Link
            href={`/dashboard/pipeline?deal=${encodeURIComponent(d.id)}`}
            className="flex-1 min-w-0 hover:text-brand-copper transition-colors"
          >
            <p className="text-xs font-medium text-dash-text truncate">{d.name}</p>
            <p className="text-[11px] text-dash-text-secondary truncate">
              {d.company || "—"} · {d.stage}
            </p>
          </Link>
          {d.value ? (
            <span className="text-xs text-brand-copper font-medium shrink-0">
              {formatPrice(d.value)}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
};

const ShipmentsList = ({ shipments }: { shipments: Trafico[] | null }) => {
  if (!shipments || shipments.length === 0)
    return <EmptyState label="No shipments include this brand yet" />;
  return (
    <ul className="divide-y divide-dash-border -my-2">
      {shipments.slice(0, 20).map((s) => (
        <li key={s.TRF_ID} className="py-2 flex items-center justify-between gap-3">
          <Link
            href={`/dashboard/shipments/${encodeURIComponent(s.TRF_ID)}`}
            className="flex-1 min-w-0 hover:text-brand-copper transition-colors"
          >
            <p className="text-xs font-medium font-mono text-dash-text truncate">
              {s.Trafico_Number || s.TRF_ID}
            </p>
            <p className="text-[11px] text-dash-text-secondary truncate">
              {s.Status || "—"}
              {s.Pedimento_Number ? ` · Ped. ${s.Pedimento_Number}` : ""}
            </p>
          </Link>
          {s.Initiated_Date ? (
            <span className="text-[11px] text-dash-text-muted shrink-0">
              {s.Initiated_Date}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
};

const BlogList = ({
  posts,
  brandSlug,
}: {
  posts: BlogPost[] | null;
  brandSlug: string;
}) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-dash-text-muted mb-3">
          No blog posts tagged to this brand yet.
        </p>
        <Link
          href={`/dashboard/blog-manager?brand=${encodeURIComponent(brandSlug)}`}
          className="inline-flex items-center gap-1 text-xs text-brand-copper hover:underline"
        >
          Create a post
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-dash-border -my-2">
      {posts.slice(0, 20).map((p) => (
        <li key={p.slug} className="py-2">
          <Link
            href={`/en/insights/${p.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 hover:text-brand-copper transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-dash-text truncate">
                {p.title.en || p.title.es}
              </p>
              <p className="text-[11px] text-dash-text-secondary truncate">
                {p.status} · {p.date}
              </p>
            </div>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
};

export { BrandRelated };
export type { BrandRelatedProps };
