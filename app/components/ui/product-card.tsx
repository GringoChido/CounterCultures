"use client";

import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
  brand: string;
  name: string;
  nameEn: string;
  price: number;
  currency: string;
  finishes: string[];
  image: string;
  category: string;
  subcategory: string;
  slug: string;
  artisanal?: boolean;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-MX", { style: "decimal" }).format(price);

const ProductCard = ({
  brand,
  name,
  nameEn,
  price,
  currency,
  finishes,
  image,
  category,
  subcategory,
  slug,
  artisanal,
}: ProductCardProps) => (
  <Link
    href={`/shop/${category}/p/${slug}`}
    className="group block"
  >
    <div className="relative overflow-hidden aspect-square bg-brand-sand/20">
      <Image
        src={image}
        alt={nameEn}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
      />
      {artisanal && (
        <span className="absolute top-3 left-3 font-body font-semibold text-[10px] tracking-[0.15em] uppercase bg-brand-copper text-white px-2.5 py-1">
          Artisanal
        </span>
      )}
    </div>
    <div className="mt-4 space-y-1.5">
      <p className="font-body font-semibold text-xs text-brand-stone tracking-wide uppercase">
        {brand}
      </p>
      <h3 className="font-body text-sm font-medium text-brand-charcoal group-hover:text-brand-terracotta transition-colors duration-300 leading-snug line-clamp-2">
        {nameEn}
      </h3>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-brand-charcoal">
          ${formatPrice(price)}{" "}
          <span className="text-brand-stone text-xs">{currency}</span>
        </span>
      </div>
      {finishes.length > 1 && (
        <div className="flex items-center gap-1.5 pt-1">
          {finishes.slice(0, 5).map((finish) => (
            <span
              key={finish}
              className="w-3 h-3 rounded-full bg-brand-stone/30 border border-brand-stone/20"
              title={finish}
            />
          ))}
          {finishes.length > 5 && (
            <span className="font-mono text-[10px] text-brand-stone">
              +{finishes.length - 5}
            </span>
          )}
        </div>
      )}
    </div>
  </Link>
);

export { ProductCard, formatPrice };
