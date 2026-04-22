import { getBrandCounts, getCatalogStats } from "@/app/lib/products-full";
import { CatalogSearch } from "./catalog-search";

export const dynamic = "force-dynamic";

const CatalogPage = async () => {
  const [brandCounts, stats] = await Promise.all([
    getBrandCounts(),
    getCatalogStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Full Odoo Catalog</h2>
        <p className="text-sm text-dash-text-secondary mt-1">
          {stats.total.toLocaleString()} products across{" "}
          {stats.brandCount.toLocaleString()} brands &middot; read-only snapshot
          from Odoo &middot; 30-min cache
        </p>
      </div>
      <CatalogSearch
        brandCounts={brandCounts}
        totalProducts={stats.total}
      />
    </div>
  );
};

export default CatalogPage;
