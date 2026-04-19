import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  tone?: "default" | "success" | "muted";
}

const toneToCopy: Record<NonNullable<EmptyStateProps["tone"]>, string> = {
  default: "text-dash-text-secondary",
  success: "text-brand-sage",
  muted: "text-dash-text-muted",
};

const EmptyState = ({ icon: Icon, title, description, cta, tone = "default" }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      <div className="w-10 h-10 rounded-full bg-dash-bg flex items-center justify-center mb-3">
        <Icon className={`w-5 h-5 ${toneToCopy[tone]}`} />
      </div>
      <p className={`text-sm font-medium ${toneToCopy[tone]}`}>{title}</p>
      {description && <p className="text-xs text-dash-text-muted mt-1 max-w-xs">{description}</p>}
      {cta && (
        <Link
          href={cta.href}
          className="mt-3 text-xs font-medium text-brand-copper hover:text-brand-terracotta transition-colors"
        >
          {cta.label} →
        </Link>
      )}
    </div>
  );
};

export { EmptyState };
export type { EmptyStateProps };
