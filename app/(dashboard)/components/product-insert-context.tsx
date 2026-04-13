"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type { Product } from "@/app/lib/types";

export interface InsertableProduct {
  product: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  tradePrice?: number;
  brand: string;
  image: string;
  slug: string;
  category: string;
  subcategory: string;
}

interface ProductInsertContextType {
  pendingInsert: InsertableProduct | null;
  requestInsert: (product: Product) => void;
  consumeInsert: () => InsertableProduct | null;
  cancelInsert: () => void;
  previewProduct: Product | null;
  openPreview: (product: Product) => void;
  closePreview: () => void;
  openCommandPalette: () => void;
  setCommandPaletteOpener: (fn: () => void) => void;
}

const ProductInsertContext = createContext<ProductInsertContextType | null>(null);

export const useProductInsert = () => {
  const ctx = useContext(ProductInsertContext);
  if (!ctx) throw new Error("useProductInsert must be used within ProductInsertProvider");
  return ctx;
};

export const ProductInsertProvider = ({ children }: { children: ReactNode }) => {
  const [pendingInsert, setPendingInsert] = useState<InsertableProduct | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [cmdOpener, setCmdOpener] = useState<(() => void) | null>(null);

  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestInsert = useCallback((product: Product) => {
    setPendingInsert({
      product: product.name,
      sku: product.sku,
      quantity: 1,
      unitPrice: product.price,
      tradePrice: product.tradePrice,
      brand: product.brand,
      image: product.images[0] || "",
      slug: product.slug,
      category: product.category,
      subcategory: product.subcategory,
    });
    // Auto-clear after 30s if not consumed
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    expiryTimer.current = setTimeout(() => setPendingInsert(null), 30_000);
  }, []);

  useEffect(() => {
    if (!pendingInsert && expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  }, [pendingInsert]);

  const consumeInsert = useCallback(() => {
    const item = pendingInsert;
    setPendingInsert(null);
    return item;
  }, [pendingInsert]);

  const cancelInsert = useCallback(() => setPendingInsert(null), []);
  const openPreview = useCallback((p: Product) => setPreviewProduct(p), []);
  const closePreview = useCallback(() => setPreviewProduct(null), []);
  const openCommandPalette = useCallback(() => cmdOpener?.(), [cmdOpener]);
  const setCommandPaletteOpener = useCallback((fn: () => void) => {
    setCmdOpener(() => fn);
  }, []);

  return (
    <ProductInsertContext.Provider value={{
      pendingInsert, requestInsert, consumeInsert, cancelInsert,
      previewProduct, openPreview, closePreview,
      openCommandPalette, setCommandPaletteOpener,
    }}>
      {children}
    </ProductInsertContext.Provider>
  );
};
