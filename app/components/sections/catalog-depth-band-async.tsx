import { CatalogDepthBand } from "./catalog-depth-band";
import { BuyerHub } from "./buyer-hub";

interface CatalogDepthBandAsyncProps {
  locale: "en" | "es";
}

const CatalogDepthBandAsync = ({ locale }: CatalogDepthBandAsyncProps) => {
  return (
    <CatalogDepthBand locale={locale} totalCatalog={354_449}>
      <BuyerHub locale={locale} />
    </CatalogDepthBand>
  );
};

export { CatalogDepthBandAsync };
