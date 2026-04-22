"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

type Action = {
  label: string;
  icon?: LucideIcon | ReactNode;
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  external?: boolean;
  disabled?: boolean;
  tone?: "default" | "danger" | "accent";
};

type RowActionTrayProps = {
  actions: Action[];
  alwaysVisible?: boolean;
  className?: string;
};

const toneClasses: Record<NonNullable<Action["tone"]>, string> = {
  default: "text-dash-text-secondary hover:text-dash-accent hover:bg-dash-surface-2",
  accent: "text-dash-accent hover:bg-dash-accent-soft",
  danger: "text-dash-danger hover:bg-dash-danger/10",
};

const renderIcon = (icon?: LucideIcon | ReactNode, size = 14): ReactNode => {
  if (!icon) return null;
  if (typeof icon === "function") {
    const IconComp = icon as LucideIcon;
    return <IconComp size={size} />;
  }
  return icon;
};

const RowActionTray = ({
  actions,
  alwaysVisible = false,
  className = "",
}: RowActionTrayProps) => {
  if (!actions.length) return null;

  const visibility = alwaysVisible
    ? "opacity-100"
    : "opacity-0 group-hover:opacity-100 transition-opacity";

  return (
    <div
      className={`inline-flex items-center gap-1 ${visibility} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map((action, idx) => {
        const classes = `inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
          toneClasses[action.tone ?? "default"]
        } ${action.disabled ? "opacity-40 pointer-events-none" : ""} transition`;

        const content = (
          <>
            {renderIcon(action.icon)}
            <span>{action.label}</span>
          </>
        );

        if (action.href && !action.disabled) {
          if (action.external) {
            return (
              <a
                key={idx}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className={classes}
              >
                {content}
              </a>
            );
          }
          return (
            <Link key={idx} href={action.href} className={classes}>
              {content}
            </Link>
          );
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={classes}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
};

export { RowActionTray };
export type { RowActionTrayProps, Action as RowAction };
