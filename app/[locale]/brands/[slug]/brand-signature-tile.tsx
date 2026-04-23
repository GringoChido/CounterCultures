"use client";

import { useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import type { ProductFull } from "@/app/lib/products-full";

interface BrandSignatureTileProps {
  product: ProductFull;
  locale: "en" | "es";
}

const BrandSignatureTile = ({ product, locale }: BrandSignatureTileProps) => {
  const [imgErr, setImgErr] = useState(false);
  const price =
    product.listPrice > 0
      ? `${product.currency} ${product.listPrice.toLocaleString(
          locale === "es" ? "es-MX" : "en-US",
          { maximumFractionDigits: 0 }
        )}`
      : null;

  // Deep-link into the catalog preselected on this brand + the product's SKU.
  const catalogHref =
    `/${locale}/shop/catalog?brand=${encodeURIComponent(product.brand)}` +
    (product.sku ? `&q=${encodeURIComponent(product.sku)}` : "");

  return (
    <Link
      href={catalogHref}
      className="group block bg-white border border-brand-stone/15 hover:border-brand-copper/60 transition-colors"
    >
      <div className="aspect-[4/3] bg-brand-linen overflow-hidden">
        {imgErr ? (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-brand-stone/30" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/products/odoo/${product.id}.jpg`}
            alt={product.name || product.sku}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        )}
      </div>
      <div className="p-3">
        <p className="font-mono text-[10px] text-brand-stone truncate">
          {product.sku || "—"}
        </p>
        <h3 className="mt-1 font-body text-sm text-brand-charcoal line-clamp-2 leading-snug group-hover:text-brand-copper transition-colors">
          {product.name || product.sku}
        </h3>
        {price && (
          <p className="mt-2 font-body text-[11px] text-brand-stone">
            <span>{locale === "es" ? "desde" : "from"}</span>{" "}
            <span className="text-brand-charcoal">{price}</span>
          </p>
        )}
      </div>
    </Link>
  );
};

export { BrandSignatureTile };
