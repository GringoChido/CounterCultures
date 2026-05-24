/**
 * Live cross-entity search. Powers the dashboard ⌘K command palette.
 *
 * Products use the server-side scoreProduct scorer (via /api/dashboard/products/search)
 * and are re-scored here with scoreTokens for cross-type ranking against leads/deals/brands.
 * The storefront palette uses MiniSearch for brands+articles — intentional split.
 */

import { articles } from "./articles";
import { cachedFetch, scoreTokens, normalize } from "./search-utils";
import { ARTISAN_BRANDS } from "./products-mapping";

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
  const data = await cachedFetch<{ leads?: LeadRow[] }>("/api/dashboard/leads");
  return (data.leads ?? [])
    .map<SearchResult | null>((l) => {
      const s = scoreTokens(q, [l.name, l.email, l.id, l.phone, l.brand_slugs], { weights: [4, 3, 3, 2, 1] });
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
  const data = await cachedFetch<{ deals?: DealRow[] }>("/api/dashboard/pipeline");
  return (data.deals ?? [])
    .map<SearchResult | null>((d) => {
      const s = scoreTokens(q, [d.name, d.id, d.company, d.brand_slugs, d.owner], { weights: [4, 3, 3, 1, 1] });
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
};

interface TraficoRow extends Record<string, string> {
  TRF_ID: string;
  Trafico_Number: string;
  Pedimento_Number: string;
  Status: string;
  Broker_Name: string;
}

const searchTraficos = async (q: string): Promise<SearchResult[]> => {
  const data = await cachedFetch<{ traficos?: TraficoRow[] }>(
    "/api/dashboard/traficos"
  );
  return (data.traficos ?? [])
    .map<SearchResult | null>((t) => {
      const s = scoreTokens(
        q,
        [t.Trafico_Number, t.TRF_ID, t.Pedimento_Number, t.Broker_Name, t.Status],
        { weights: [4, 4, 3, 2, 1] }
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
  const data = await cachedFetch<{ shipments?: ShipmentRow[] }>(
    "/api/dashboard/shipments"
  );
  return (data.shipments ?? [])
    .map<SearchResult | null>((sh) => {
      const s = scoreTokens(
        q,
        [sh.Shipment_ID, sh.Tracking, sh.Brand, sh.Carrier, sh.Destination],
        { weights: [4, 4, 2, 1, 2] }
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
  const data = await cachedFetch<{ brands?: BrandRow[] }>("/api/dashboard/brands");
  return (data.brands ?? [])
    .map<SearchResult | null>((b) => {
      const s = scoreTokens(q, [b.name, b.slug, b.taglineEn, b.taglineEs], { weights: [4, 3, 1, 1] });
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
};

interface FullProductRow {
  id: string;
  sku: string;
  brand: string;
  name: string;
  category: string;
  listPrice: number;
  currency: string;
  imageSrc?: string;
  inStock?: boolean;
  stockQty?: number;
}

interface FullProductSearchResponse {
  items?: FullProductRow[];
  total?: number;
}

const fullProductToData = (p: FullProductRow): SearchProductData => ({
  sku: p.sku,
  brand: p.brand,
  name: p.name,
  nameEn: p.name,
  price: p.listPrice || 0,
  tradePrice: undefined,
  currency: p.currency || "MXN",
  images: p.imageSrc ? [p.imageSrc] : [],
  finishes: [],
  category: p.category,
  subcategory: "",
  availability: p.inStock ? "in-stock" : "quote-only",
  slug: `p-${p.id}`,
  description: "",
  descriptionEn: "",
  artisanal: ARTISAN_BRANDS.has(p.brand),
  id: p.id,
  featured: false,
});

const searchProducts = async (q: string): Promise<SearchResult[]> => {
  const url = `/api/dashboard/products/search?q=${encodeURIComponent(q)}&limit=8`;
  const data = await cachedFetch<FullProductSearchResponse>(url);
  const nq = normalize(q);
  return (data.items ?? []).map<SearchResult>((p) => {
    const productData = fullProductToData(p);
    const priceStr = p.listPrice > 0
      ? `$${p.listPrice.toLocaleString()} ${p.currency || "MXN"}`
      : "";
    // Real relevance score on the same scale as other entities (scoreTokens)
    const s = scoreTokens(nq, [p.sku, p.name, p.brand], { weights: [5, 4, 2] });
    return {
      id: `product-${p.id}`,
      type: "product",
      title: p.name || p.sku,
      subtitle: [p.brand, p.category, priceStr].filter(Boolean).join(" · "),
      href: `/dashboard/products?selected=${encodeURIComponent(p.id)}`,
      score: s,
      productData,
    };
  });
};

const searchBlogPosts = async (q: string): Promise<SearchResult[]> => {
  return articles
    .map<SearchResult | null>((a) => {
      const s = scoreTokens(q, [a.title.en, a.title.es, a.slug, a.excerpt.en], { weights: [4, 4, 2, 1] });
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

export interface SearchAllResult {
  results: SearchResult[];
  errors: Array<{ entity: SearchResultType; message: string }>;
}

const safeSearch = async <T extends SearchResultType>(
  entity: T,
  fn: () => Promise<SearchResult[]>
): Promise<{ results: SearchResult[]; error: { entity: T; message: string } | null }> => {
  try {
    return { results: await fn(), error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error(`[search] ${entity} failed:`, message);
    return { results: [], error: { entity, message } };
  }
};

export const searchAllEntities = async (query: string): Promise<SearchAllResult> => {
  if (query.trim().length < 2) return { results: [], errors: [] };
  const groups = await Promise.all([
    safeSearch("lead", () => searchLeads(query)),
    safeSearch("deal", () => searchDeals(query)),
    safeSearch("trafico", () => searchTraficos(query)),
    safeSearch("shipment", () => searchShipments(query)),
    safeSearch("brand", () => searchBrands(query)),
    safeSearch("product", () => searchProducts(query)),
    safeSearch("blog", () => searchBlogPosts(query)),
  ]);
  const errors = groups
    .map((g) => g.error)
    .filter((e): e is { entity: SearchResultType; message: string } => e !== null);
  const results = rankResults(groups.flatMap((g) => g.results));
  return { results, errors };
};
