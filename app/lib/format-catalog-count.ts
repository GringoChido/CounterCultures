const formatCatalogCount = (total: number, locale: "en" | "es" = "en"): string => {
  const rounded = Math.floor(total / 10_000) * 10_000;
  const numFmt = locale === "es" ? "es-MX" : "en-US";
  return `${rounded.toLocaleString(numFmt)}+`;
};

export { formatCatalogCount };
