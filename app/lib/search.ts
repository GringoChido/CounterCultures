/**
 * Live cross-entity search. Powers the ⌘K command palette.
 *
 * Fetches from existing /api/dashboard/* endpoints in parallel,
 * normalizes to SearchResult[], scores by relevance (title > id > subtitle),
 * caches each entity-list response for 60s in-memory.
 *
 * Client-side: relies on same-origin cookies for auth. Use from a
 * "use client" component that mounts under /dashboard.
 */

import { articles } from "./articles";

export type SearchResultType =
  | "lead"
  | "deal"
  | "trafico"
  | "shipment"
  | "brand"
  | "product"
  | "blog";

export interface SearchProductData {
  sku: string;
  brand: string;
  name: string;
  nameEn: string;
  price: number;
  tradePrice?: number;
  currency: string;
  images: string[];
  finishes: string[];
  category: string;
  subcategory: string;
  availability: string;
  slug: string;
  description: string;
  descriptionEn: string;
  artisanal: boolean;
  id: string;
  featured: boolean;
}

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  href: string;
  score: number;
  productData?: SearchProductData;
}

const CACHE_TTL_MS = 60_000;
type CacheEntry<T> = { at: number; data: T };
const cache: Record<string, CacheEntry<unknown>> = {};

const cachedFetch = async <T>(key: string, url: string): Promise<T> => {
  const hit = cache[key];
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data as T;
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const data = (await res.json()) as T;
  cache[key] = { at: Date.now(), data };
  return data;
};

/**
 * Score a query against ordered fields. Earlier fields weigh more.
 * Exact match > prefix > substring. Returns 0 for no match in any field.
 */
export const score = (query: string, ...fields: (string | undefined)[]): number => {
  const ql = query.trim().toLowerCase();
  if (!ql) return 0;
  let total = 0;
  fields.forEach((f, i) => {
    if (!f) return;
    const fl = f.toLowerCase();
    const positionWeight = Math.max(1, 5 - i);
    if (fl === ql) total += 10 * positionWeight;
    else if (fl.startsWith(ql)) total += 5 * positionWeight;
    else if (fl.includes(ql)) total += 2 * positionWeight;
  });
  return total;
};

export const rankResults = (results: SearchResult[]): SearchResult[] => {
  const seen = new Set<string>();
  const deduped: SearchResult[] = [];
  for (const r of results) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    deduped.push(r);
  }
  deduped.sort((a, b) => b.score - a.score);
  return deduped.slice(0, 50);
};

// ---------------------------------------------------------------------------
// Per-entity searchers
// ---------------------------------------------------------------------------

interface LeadRow extends Record<string, string> {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  brand_slugs: string;
  interest: string;
}

const searchLeads = async (q: string): Promise<SearchResult[]> => {
  try {
    const data = await cachedFetch<{ leads?: LeadRow[] }>("leads", "/api/dashboard/leads");
    return (data.leads ?? [])
      .map<SearchResult | null>((l) => {
        const s = score(q, l.name, l.email, l.id, l.phone, l.brand_slugs);
        if (s === 0) return null;
        return {
          id: `lead-${l.id}`,
          type: "lead",
          title: l.name || l.email || l.id,
          subtitle: [l.status, l.source, l.email].filter(Boolean).join(" · "),
          href: "/dashboard/leads",
          score: s,
        };
      })
      .filter((x): x is SearchResult => x !== null);
  } catch {
    return [];
  }
};

interface DealRow extends Record<string, string> {
  id: string;
  name: string;
  company: string;
  stage: string;
  value: string;
  brand_slugs: string;
  owner: string;
}

const searchDeals = async (q: string): Promise<SearchResult[]> => {
  try {
    const data = await cachedFetch<{ deals?: DealRow[] }>("deals", "/api/dashboard/pipeline");
    return (data.deals ?? [])
      .map<SearchResult | null>((d) => {
        const s = score(q, d.name, d.id, d.company, d.brand_slugs, d.owner);
        if (s === 0) return null;
        const valueNum = Number(d.value);
        const valueStr = !Number.isNaN(valueNum) && valueNum > 0
          ? `$${(valueNum / 1000).toFixed(0)}K`
          : "";
        return {
          id: `deal-${d.id}`,
          type: "deal",
          title: d.name || d.id,
          subtitle: [d.stage, valueStr, d.company].filter(Boolean).join(" · "),
          href: `/dashboard/pipeline?deal=${d.id}`,
          score: s,
        };
      })
      .filter((x): x is SearchResult => x !== null);
  } catch {
    return [];
  }
};

interface TraficoRow extends Record<string, string> {
  TRF_ID: string;
  Trafico_Number: string;
  Pedimento_Number: string;
  Status: string;
  Broker_Name: string;
}

const searchTraficos = async (q: string): Promise<SearchResult[]> => {
  try {
    const data = await cachedFetch<{ traficos?: TraficoRow[] }>(
      "traficos",
      "/api/dashboard/traficos"
    );
    return (data.traficos ?? [])
      .map<SearchResult | null>((t) => {
        const s = score(
          q,
          t.Trafico_Number,
          t.TRF_ID,
          t.Pedimento_Number,
          t.Broker_Name,
          t.Status
        );
        if (s === 0) return null;
        return {
          id: `trafico-${t.TRF_ID}`,
          type: "trafico",
          title: t.Trafico_Number || t.TRF_ID,
          subtitle: [t.Status, t.Pedimento_Number, t.Broker_Name].filter(Boolean).join(" · "),
          href: `/dashboard/shipments?trafico=${t.TRF_ID}`,
          score: s,
        };
      })
      .filter((x): x is SearchResult => x !== null);
  } catch {
    return [];
  }
};

interface ShipmentRow extends Record<string, string> {
  Shipment_ID: string;
  Tracking: string;
  Brand: string;
  Carrier: string;
  Status: string;
  Destination: string;
}

const searchShipments = async (q: string): Promise<SearchResult[]> => {
  try {
    const data = await cachedFetch<{ shipments?: ShipmentRow[] }>(
      "shipments",
      "/api/dashboard/shipments"
    );
    return (data.shipments ?? [])
      .map<SearchResult | null>((sh) => {
        const s = score(
          q,
          sh.Shipment_ID,
          sh.Tracking,
          sh.Brand,
          sh.Carrier,
          sh.Destination
        );
        if (s === 0) return null;
        return {
          id: `shipment-${sh.Shipment_ID}`,
          type: "shipment",
          title: sh.Shipment_ID,
          subtitle: [sh.Carrier, sh.Tracking, sh.Status].filter(Boolean).join(" · "),
          href: "/dashboard/shipments",
          score: s,
        };
      })
      .filter((x): x is SearchResult => x !== null);
  } catch {
    return [];
  }
};

interface BrandRow {
  slug: string;
  name: string;
  taglineEn?: string;
  taglineEs?: string;
  categories?: string[];
  stockedState?: string;
}

const searchBrands = async (q: string): Promise<SearchResult[]> => {
  try {
    const data = await cachedFetch<{ brands?: BrandRow[] }>("brands", "/api/dashboard/brands");
    return (data.brands ?? [])
      .map<SearchResult | null>((b) => {
        const s = score(q, b.name, b.slug, b.taglineEn, b.taglineEs);
        if (s === 0) return null;
        const subtitle = [
          b.taglineEn || b.taglineEs,
          b.categories?.slice(0, 2).join(", "),
        ]
          .filter(Boolean)
          .join(" · ");
        return {
          id: `brand-${b.slug}`,
          type: "brand",
          title: b.name,
          subtitle,
          href: `/dashboard/brands/${b.slug}`,
          score: s,
        };
      })
      .filter((x): x is SearchResult => x !== null);
  } catch {
    return [];
  }
};

interface ProductRow extends Record<string, string> {
  sku: string;
  brand: string;
  name: string;
  nameEn: string;
  price: string;
  tradePrice: string;
  currency: string;
  images: string;
  finishes: string;
  category: string;
  subcategory: string;
  availability: string;
  slug: string;
  description: string;
  descriptionEn: string;
  artisanal: string;
  id: string;
  featured: string;
}

const productRowToData = (p: ProductRow): SearchProductData => ({
  sku: p.sku,
  brand: p.brand,
  name: p.name,
  nameEn: p.nameEn,
  price: parseFloat(p.price) || 0,
  tradePrice: p.tradePrice ? parseFloat(p.tradePrice) : undefined,
  currency: p.currency || "MXN",
  images: p.images ? p.images.split(",").map((u) => u.trim()) : [],
  finishes: p.finishes ? p.finishes.split(",").map((f) => f.trim()) : [],
  category: p.category,
  subcategory: p.subcategory,
  availability: p.availability || "in-stock",
  slug: p.slug,
  description: p.description || "",
  descriptionEn: p.descriptionEn || "",
  artisanal: p.artisanal === "true",
  id: p.id,
  featured: p.featured === "true",
});

const searchProducts = async (q: string): Promise<SearchResult[]> => {
  try {
    const url = `/api/dashboard/products?q=${encodeURIComponent(q)}&limit=8`;
    const data = await cachedFetch<{ products?: ProductRow[] }>(`products:${q}`, url);
    return (data.products ?? []).map<SearchResult>((p) => {
      const productData = productRowToData(p);
      const priceNum = parseFloat(p.price);
      const priceStr = !Number.isNaN(priceNum) && priceNum > 0
        ? `$${priceNum.toLocaleString()} ${p.currency || "MXN"}`
        : "";
      return {
        id: `product-${p.slug || p.sku}`,
        type: "product",
        title: p.name || p.sku,
        subtitle: [p.brand, `${p.category}/${p.subcategory.replace(/-/g, " ")}`, priceStr]
          .filter(Boolean)
          .join(" · "),
        href: "#",
        score: 100, // server already filtered, treat all hits as relevant
        productData,
      };
    });
  } catch {
    return [];
  }
};

const searchBlogPosts = async (q: string): Promise<SearchResult[]> => {
  return articles
    .map<SearchResult | null>((a) => {
      const s = score(q, a.title.en, a.title.es, a.slug, a.excerpt.en);
      if (s === 0) return null;
      return {
        id: `blog-${a.slug}`,
        type: "blog",
        title: a.title.en,
        subtitle: [a.pillar, a.author, a.readTime].filter(Boolean).join(" · "),
        href: `/dashboard/blog-manager?slug=${a.slug}`,
        score: s,
      };
    })
    .filter((x): x is SearchResult => x !== null);
};

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export const searchAllEntities = async (query: string): Promise<SearchResult[]> => {
  if (query.trim().length < 2) return [];
  const groups = await Promise.all([
    searchLeads(query),
    searchDeals(query),
    searchTraficos(query),
    searchShipments(query),
    searchBrands(query),
    searchProducts(query),
    searchBlogPosts(query),
  ]);
  return rankResults(groups.flat());
};
