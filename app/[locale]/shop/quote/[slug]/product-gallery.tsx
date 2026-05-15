"use client";

import { useState } from "react";
import { ProductVisual } from "@/app/components/product-visual";

interface ProductGalleryProps {
  images: string[];
  productId: string;
  brand: string;
  sku: string;
  name: string;
}

const ProductGallery = ({ images, productId, brand, sku, name }: ProductGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full">
        <ProductVisual
          id={productId}
          brand={brand}
          sku={sku}
          name={name}
          aspect="4/3"
          size="hero"
          hasImage={false}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="relative w-full overflow-hidden bg-brand-linen border border-brand-stone/15" style={{ aspectRatio: "4/3" }}>
        <img
          src={images[activeIndex]}
          alt={name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`shrink-0 w-16 h-16 overflow-hidden border-2 transition-colors cursor-pointer ${
                i === activeIndex
                  ? "border-brand-copper"
                  : "border-brand-stone/20 hover:border-brand-stone/40"
              }`}
            >
              <img
                src={src}
                alt={`${name} ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { ProductGallery };
