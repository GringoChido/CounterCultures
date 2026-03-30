"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "whatsapp";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-terracotta text-white rounded-md hover:bg-brand-terracotta-dark transition-colors duration-200",
  secondary:
    "border-2 border-brand-terracotta text-brand-terracotta rounded-md hover:bg-brand-terracotta hover:text-white transition-colors duration-200",
  outline:
    "border-2 border-brand-charcoal text-brand-charcoal rounded-md hover:bg-brand-charcoal hover:text-white transition-colors duration-200",
  ghost:
    "text-brand-terracotta underline underline-offset-4 hover:text-brand-copper transition-colors duration-200",
  whatsapp:
    "bg-[#25D366] text-white rounded-md hover:bg-[#20BD5A] transition-colors duration-200",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-sm",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "lg", className = "", href, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-body font-medium tracking-wide cursor-pointer";
    const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    if (href) {
      return (
        <a href={href} className={classes}>
          {children}
        </a>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
