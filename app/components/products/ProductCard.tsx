"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Eye } from "lucide-react";
import type { Product } from "@/app/lib/types";

interface ProductCardProps {
  product: Product;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-MX", { style: "decimal", maximumFractionDigits: 0 }).format(price);

const ProductCard = ({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/shop/${product.category}/p/${product.slug}`} className="group block h-full">
      <div
        className="relative overflow-hidden aspect-square bg-brand-sand/20 rounded-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image
          src={product.images[0] || ""}
          alt={product.nameEn}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
          priority={false}
        />

        {product.artisanal && (
          <span className="absolute top-3 left-3 font-mono text-[10px] tracking-[0.15em] uppercase bg-brand-copper text-white px-2.5 py-1 z-10">
            Artisanal
          </span>
        )}

        {product.availability === "in-stock" && (
          <span className="absolute top-3 right-3 font-mono text-[10px] tracking-[0.15em] uppercase bg-brand-sage text-white px-2.5 py-1 z-10">
            In Stock
          </span>
        )}

        {isHovered && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20 transition-all duration-300">
            <button className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white text-brand-charcoal font-body text-sm font-medium hover:bg-brand-linen transition-colors rounded-sm">
              <Eye className="w-4 h-4" />
              Quick View
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <p className="font-mono text-xs text-brand-stone tracking-wide uppercase">
          {product.brand}
        </p>

        <h3 className="font-body text-sm font-medium text-brand-charcoal group-hover:text-brand-terracotta transition-colors duration-300 leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.nameEn}
        </h3>

        <div className="flex items-baseline gap-2 pt-1">
          <span className="font-mono text-sm font-medium text-brand-charcoal">
            ${formatPrice(product.price)}
          </span>
          <span className="font-mono text-xs text-brand-stone">
            {product.currency}
          </span>
        </div>

        {product.finishes.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2">
            {product.finishes.slice(0, 6).map((finish, idx) => (
              <div
                key={`${finish}-${idx}`}
                className="w-3.5 h-3.5 rounded-full border border-brand-stone/30 bg-brand-stone/10 transition-transform group-hover:scale-110"
                title={finish}
                style={{
                  backgroundColor: getFinishColor(finish),
                }}
              />
            ))}
            {product.finishes.length > 6 && (
              <span className="font-mono text-[10px] text-brand-stone ml-0.5">
                +{product.finishes.length - 6}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

function getFinishColor(finish: string): string {
  const lowerFinish = finish.toLowerCase();

  const colorMap: Record<string, string> = {
    chrome: "#C0C0C0",
    "brushed nickel": "#8E8E8E",
    "matte black": "#2A2A2A",
    "polished brass": "#D4A373",
    brass: "#D4A373",
    stainless: "#C1C1C1",
    "stainless steel": "#C1C1C1",
    bronze: "#704214",
    copper: "#B87333",
    gold: "#FFD700",
    silver: "#C0C0C0",
    "brushed gold": "#FFD700",
    "matte gold": "#D4A373",
  };

  for (const [key, value] of Object.entries(colorMap)) {
    if (lowerFinish.includes(key)) {
      return value;
    }
  }

  return "#A89F91"; // Default to brand-stone
}

export { ProductCard, formatPrice };
