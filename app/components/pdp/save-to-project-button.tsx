"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { SaveToProjectModal } from "./save-to-project-modal";
import type { Product } from "@/app/lib/types";
import type { ProjectLineItem } from "@/app/lib/project-store";

const T = {
  en: { saveToProject: "Save to Project" },
  es: { saveToProject: "Guardar en Proyecto" },
};

interface SaveToProjectButtonProps {
  product: Product;
  locale: "en" | "es";
  selectedFinish?: string;
}

export const SaveToProjectButton = ({
  product,
  locale,
  selectedFinish,
}: SaveToProjectButtonProps) => {
  const [open, setOpen] = useState(false);

  const item: Omit<ProjectLineItem, "addedAt"> = {
    productId: product.id,
    name: locale === "es" ? product.name : product.nameEn,
    brand: product.brand,
    category: product.category,
    sku: product.sku,
    qty: 1,
    unitPrice: product.tradePrice ?? product.price,
    currency: product.currency,
    imageSrc: product.images[0],
    productHref: `/${locale}/shop/${product.category}/p/${product.slug}`,
    notes: selectedFinish ? `Finish: ${selectedFinish}` : undefined,
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full py-3.5 min-h-[48px] border border-brand-stone/30 text-dash-text-secondary font-body text-sm font-medium tracking-wider hover:border-brand-copper hover:text-brand-copper transition-colors duration-300 flex items-center justify-center gap-2 cursor-pointer"
      >
        <FolderPlus className="w-4 h-4" />
        {T[locale].saveToProject}
      </button>

      <SaveToProjectModal
        open={open}
        onClose={() => setOpen(false)}
        locale={locale}
        item={item}
      />
    </>
  );
};
