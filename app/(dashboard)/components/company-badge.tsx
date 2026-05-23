"use client";

import type { ReactNode } from "react";

type Company = "cc" | "llc";

const COMPANY_CONFIG = {
  cc: {
    label: "CC",
    short: "CC",
    bg: "bg-company-cc-soft",
    text: "text-company-cc-text",
    border: "border-company-cc/30",
    accent: "text-company-cc",
    dot: "bg-company-cc",
    tintBg: "bg-company-cc/8",
    tintBorder: "border-company-cc/20",
  },
  llc: {
    label: "R&F",
    short: "R&F",
    bg: "bg-company-llc-soft",
    text: "text-company-llc-text",
    border: "border-company-llc/30",
    accent: "text-company-llc",
    dot: "bg-company-llc",
    tintBg: "bg-company-llc/8",
    tintBorder: "border-company-llc/20",
  },
} as const;

export const getCompanyConfig = (company: string) =>
  COMPANY_CONFIG[company as Company] ?? COMPANY_CONFIG.cc;

export const CompanyBadge = ({
  company,
  size = "sm",
}: {
  company: string;
  size?: "xs" | "sm";
}) => {
  const c = getCompanyConfig(company);
  const sizeClasses =
    size === "xs"
      ? "text-[9px] px-1.5 py-0.5 gap-1"
      : "text-[10px] px-2 py-0.5 gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wider rounded-full border ${c.bg} ${c.text} ${c.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.short}
    </span>
  );
};

export const EntityTintedCard = ({
  company,
  children,
  className = "",
}: {
  company: string;
  children: ReactNode;
  className?: string;
}) => {
  const c = getCompanyConfig(company);
  return (
    <div className={`${c.tintBg} ${c.tintBorder} border rounded ${className}`}>
      {children}
    </div>
  );
};
