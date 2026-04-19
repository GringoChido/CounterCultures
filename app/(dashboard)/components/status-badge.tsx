type BadgeTone = "new" | "in-progress" | "warning" | "danger" | "success" | "neutral";

const toneStyles: Record<BadgeTone, string> = {
  new: "bg-brand-copper/10 text-brand-copper",
  "in-progress": "bg-brand-sage/15 text-brand-sage",
  warning: "bg-brand-terracotta/15 text-brand-terracotta",
  danger: "bg-brand-terracotta-dark/20 text-brand-terracotta-dark",
  success: "bg-brand-sage/20 text-brand-sage",
  neutral: "bg-dash-bg text-dash-text-secondary",
};

const legacyToTone: Record<string, BadgeTone> = {
  new: "new",
  contacted: "in-progress",
  qualified: "in-progress",
  proposal: "in-progress",
  won: "success",
  lost: "danger",
  default: "neutral",
  info: "neutral",
  warning: "warning",
  success: "success",
  danger: "danger",
};

interface StatusBadgeProps {
  label: string;
  variant?: string;
}

const StatusBadge = ({ label, variant = "default" }: StatusBadgeProps) => {
  const tone = legacyToTone[variant] ?? "neutral";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${toneStyles[tone]}`}
    >
      {label}
    </span>
  );
};

// Back-compat: BadgeVariant alias kept as `string` so consumers still typecheck.
type BadgeVariant = string;

export { StatusBadge };
export type { BadgeTone, BadgeVariant };
