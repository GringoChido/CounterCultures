import { Award } from "lucide-react";

const BrandsPage = () => {
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-dash-surface border border-dash-border rounded-2xl p-10 md:p-14 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-brand-copper/10 text-brand-copper mb-6">
            <Award className="w-7 h-7" />
          </div>

          <h2 className="font-display text-3xl md:text-4xl font-light text-dash-text mb-3">
            Brands
          </h2>
          <p className="text-dash-text-secondary mb-2">
            73-brand catalog — imported premium brands plus Mexican artisan makers.
          </p>
          <p className="text-xs uppercase tracking-[0.15em] text-brand-copper/80 mb-8">
            Coming in Week 2
          </p>

          <div className="text-left bg-dash-bg border border-dash-border rounded-xl p-6 space-y-3 text-sm text-dash-text-secondary">
            <p className="font-medium text-dash-text">What ships here:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>All 73 brands with descriptions, country of origin, and category</li>
              <li>Three states per brand: Stocked · Available on Request · External</li>
              <li>Attach products from Shopify; tag blog posts by brand</li>
              <li>Storefront{" "}
                <code className="px-1.5 py-0.5 bg-dash-surface rounded text-xs">/en/brands</code>{" "}
                grid reads from this catalog at build time
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandsPage;
