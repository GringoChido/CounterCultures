"use client";

import Link from "next/link";
import type { ProductFull } from "@/app/lib/products-full";
import { ProductVisual } from "@/app/components/product-visual";

interface BrandSignatureTileProps {
  product: ProductFull;
  locale: "en" | "es";
}

const BrandSignatureTile = ({ product, locale }: BrandSignatureTileProps) => {
  const price =
    product.listPrice > 0
      ? `${product.currency} ${product.listPrice.toLocaleString(
          locale === "es" ? "es-MX" : "en-US",
          { maximumFractionDigits: 0 }
        )}`
      : null;

  const catalogHref =
    `/${locale}/shop/catalog?brand=${encodeURIComponent(product.brand)}` +
    (product.sku ? `&q=${encodeURIComponent(product.sku)}` : "");

  return (
    <Link
      href={catalogHref}
      className="group block bg-white border border-brand-stone/15 hover:border-brand-copper/60 transition-colors"
    >
      <ProductVisual
        id={product.id}
        brand={product.brand}
        sku={product.sku}
        name={product.name || product.sku}
        aspect="4/3"
        size="card"
        className="group-hover:[&>img]:scale-[1.02] [&>img]:transition-transform [&>img]:duration-500"
      />
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
