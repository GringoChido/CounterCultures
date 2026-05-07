import {
  getBrandCounts,
  getCatalogStats,
  type BrandCount,
} from "@/app/lib/products-full";
import { CatalogSearch } from "./catalog-search";
import { ActiveOrderBanner } from "./active-order-banner";
import { OdooCreateLink } from "@/app/(dashboard)/components/odoo-link";

export const dynamic = "force-dynamic";

// Netlify Functions default to a 10s timeout. getBrandCounts/getCatalogStats
// pull from the 354k-row Sheets cache and on a cold Lambda boot can take
// 10-20s — pushing the page handler over the deadline and surfacing as
// "DASHBOARD ERROR / Connection closed". Cap each await at 2s; SWR will
// fill the cache in the background so subsequent loads on the same Lambda
// are instant. The CatalogSearch client component pulls live data from
// /api/dashboard/products/search anyway, so empty fallbacks degrade only
// the heading copy + brand sidebar facets, not core search functionality.
const STATS_FALLBACK = { total: 0, brandCount: 0 };

const raceWithFallback = <T,>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([
    p.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);

const ProductsPage = async () => {
  const [brandCounts, stats] = await Promise.all([
    raceWithFallback<BrandCount[]>(getBrandCounts(), 2000, []),
    raceWithFallback(getCatalogStats(), 2000, STATS_FALLBACK),
  ]);

  const statsCopy =
    stats.total > 0
      ? `${stats.total.toLocaleString()} products across ${stats.brandCount.toLocaleString()} brands · browse, filter, or group by brand, category, or stock · 30-min cache from Odoo`
      : "Catalog warming up — refresh in a moment if numbers look off · 30-min cache from Odoo";

  return (
    <div className="space-y-6">
      <ActiveOrderBanner />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Products</h2>
          <p className="text-sm text-dash-text-secondary mt-1">{statsCopy}</p>
        </div>
        <OdooCreateLink model="product.template" label="New Product" />
      </div>
      <CatalogSearch
        brandCounts={brandCounts}
        totalProducts={stats.total}
      />
    </div>
  );
};

export default ProductsPage;
