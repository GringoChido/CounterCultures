"use client";

import { Suspense } from "react";
import { CatalogLayout } from "@/app/components/products/CatalogLayout";
import type { Product } from "@/app/lib/types";

interface ShopCatalogProps {
  initialProducts: Product[];
  initialCategory?: string;
}

const ShopCatalog = ({ initialProducts, initialCategory }: ShopCatalogProps) => {
  return (
    <Suspense fallback={null}>
      <CatalogLayout
        products={initialProducts}
        initialCategory={initialCategory}
      />
    </Suspense>
  );
};

export { ShopCatalog };
