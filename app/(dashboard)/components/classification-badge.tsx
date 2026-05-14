"use client";

import {
  CLASSIFICATION_COLORS,
  type ContactClassification,
} from "@/app/lib/contact-classifications";

interface ClassificationBadgeProps {
  classification: ContactClassification;
  size?: "sm" | "xs";
}

const ClassificationBadge = ({
  classification,
  size = "sm",
}: ClassificationBadgeProps) => {
  const colors = CLASSIFICATION_COLORS[classification];
  const sizeClass = size === "xs" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClass}`}
    >
      {classification}
    </span>
  );
};

export { ClassificationBadge };
