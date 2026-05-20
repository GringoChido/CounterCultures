import { CatalogDepthBand } from "./catalog-depth-band";
import { BuyerHub } from "./buyer-hub";
import { getCatalogStats } from "@/app/lib/products-full";

interface CatalogDepthBandAsyncProps {
  locale: "en" | "es";
}

const CatalogDepthBandAsync = async ({ locale }: CatalogDepthBandAsyncProps) => {
  const stats = await getCatalogStats().catch(() => ({ total: 0, brandCount: 0 }));
  return (
    <CatalogDepthBand locale={locale} totalCatalog={stats.total}>
      <BuyerHub locale={locale} />
    </CatalogDepthBand>
  );
};

export { CatalogDepthBandAsync };
