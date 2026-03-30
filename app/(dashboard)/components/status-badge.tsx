type BadgeVariant =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost"
  | "default"
  | "info"
  | "warning"
  | "success"
  | "danger";

const variantStyles: Record<BadgeVariant, string> = {
  new: "bg-status-new/10 text-status-new",
  contacted: "bg-status-contacted/10 text-status-contacted",
  qualified: "bg-status-qualified/10 text-status-qualified",
  proposal: "bg-status-proposal/10 text-status-proposal",
  won: "bg-status-won/10 text-status-won",
  lost: "bg-status-lost/10 text-status-lost",
  default: "bg-dash-bg text-dash-text-secondary",
  info: "bg-blue-50 text-blue-700",
  warning: "bg-amber-50 text-amber-700",
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-red-50 text-red-700",
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const StatusBadge = ({ label, variant = "default" }: StatusBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}
    >
      {label}
    </span>
  );
};

export { StatusBadge };
export type { BadgeVariant };
