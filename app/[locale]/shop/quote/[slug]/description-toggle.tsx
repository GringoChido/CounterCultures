"use client";

import { useState } from "react";

interface DescriptionToggleProps {
  description: string;
  descriptionEn: string;
  locale: "en" | "es";
}

const DescriptionToggle = ({ description, descriptionEn, locale }: DescriptionToggleProps) => {
  const hasBoth = !!description && !!descriptionEn;
  const [lang, setLang] = useState<"en" | "es">(locale);

  const text = lang === "es" ? description : descriptionEn;
  const singleText = description || descriptionEn;

  if (!singleText) return null;

  if (!hasBoth) {
    return (
      <div className="font-body text-sm text-brand-charcoal leading-relaxed whitespace-pre-line">
        {singleText}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`px-2.5 py-1 text-xs font-body transition-colors cursor-pointer ${
            lang === "en"
              ? "bg-brand-charcoal text-white"
              : "bg-brand-linen text-dash-text-secondary hover:text-brand-charcoal"
          }`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLang("es")}
          className={`px-2.5 py-1 text-xs font-body transition-colors cursor-pointer ${
            lang === "es"
              ? "bg-brand-charcoal text-white"
              : "bg-brand-linen text-dash-text-secondary hover:text-brand-charcoal"
          }`}
        >
          ES
        </button>
      </div>
      <div className="font-body text-sm text-brand-charcoal leading-relaxed whitespace-pre-line">
        {text}
      </div>
    </div>
  );
};

export { DescriptionToggle };
