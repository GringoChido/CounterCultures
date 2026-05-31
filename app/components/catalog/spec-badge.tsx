interface SpecifiedBadgeProps {
  count: number;
  locale: "en" | "es";
}

const SpecifiedBadge = ({ count, locale }: SpecifiedBadgeProps) => {
  if (count < 2) return null;
  const label = locale === "es" ? `Spec. ${count}×` : `Spec'd ${count}×`;
  const tooltip =
    locale === "es"
      ? `Especificado en ${count} proyectos`
      : `Specified on ${count} projects`;
  return (
    <span
      role="status"
      aria-label={tooltip}
      title={tooltip}
      className="inline-flex items-center px-1.5 py-0.5 font-body text-[10px] tracking-wide rounded bg-brand-copper/15 text-brand-copper border border-brand-copper/30"
    >
      {label}
    </span>
  );
};

interface ShowroomBadgeProps {
  locale: "en" | "es";
}

const ShowroomBadge = ({ locale }: ShowroomBadgeProps) => {
  const label = locale === "es" ? "En Showroom" : "In Showroom";
  return (
    <span
      role="status"
      aria-label={label}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 font-body text-[10px] tracking-wide rounded bg-brand-sage/15 text-brand-sage border border-brand-sage/30"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-brand-sage" />
      {label}
    </span>
  );
};

export { SpecifiedBadge, ShowroomBadge };
