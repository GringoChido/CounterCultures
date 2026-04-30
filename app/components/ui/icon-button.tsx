"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { focusRing } from "./focus-ring";

type IconButtonVariant = "ghost" | "solid" | "subtle";
type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Required — describes the button's action for screen readers. */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  icon: ReactNode;
}

const sizeStyles: Record<IconButtonSize, string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const variantStyles: Record<IconButtonVariant, string> = {
  ghost:
    "text-dash-text-secondary hover:bg-dash-bg hover:text-dash-text transition-colors",
  solid:
    "bg-brand-terracotta text-white hover:bg-brand-terracotta-dark transition-colors",
  subtle:
    "bg-dash-surface-2 text-dash-text-secondary hover:bg-dash-bg hover:text-dash-text transition-colors",
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "ghost",
      size = "md",
      icon,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    const classes = `inline-flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size]} ${variantStyles[variant]} ${focusRing} ${className}`;
    return (
      <button ref={ref} type={type} className={classes} {...props}>
        {icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export { IconButton };
export type { IconButtonProps };
