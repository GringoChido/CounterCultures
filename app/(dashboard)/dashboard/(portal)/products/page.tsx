import { getBrandCounts, getCatalogStats } from "@/app/lib/products-full";
import { CatalogSearch } from "./catalog-search";
import { ActiveOrderBanner } from "./active-order-banner";

export const dynamic = "force-dynamic";

const ProductsPage = async () => {
  const [brandCounts, stats] = await Promise.all([
    getBrandCounts(),
    getCatalogStats(),
  ]);

  return (
    <div className="space-y-6">
      <ActiveOrderBanner />
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Products</h2>
        <p className="text-sm text-dash-text-secondary mt-1">
          {stats.total.toLocaleString()} products across{" "}
          {stats.brandCount.toLocaleString()} brands &middot; browse, filter,
          or group by brand, category, or stock &middot; 30-min cache from Odoo
        </p>
      </div>
      <CatalogSearch
        brandCounts={brandCounts}
        totalProducts={stats.total}
      />
    </div>
  );
};

export default ProductsPage;
