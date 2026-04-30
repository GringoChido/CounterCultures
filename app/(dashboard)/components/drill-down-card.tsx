"use client";

import { useRouter } from "next/navigation";
import type { ReactNode, MouseEvent } from "react";

type DrillDownCardProps = {
  href?: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

const DrillDownCard = ({
  href,
  onClick,
  children,
  className = "",
  ariaLabel,
}: DrillDownCardProps) => {
  const router = useRouter();
  const interactive = Boolean(href || onClick);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (onClick) onClick(e);
    if (href) router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (onClick) onClick(e as unknown as MouseEvent<HTMLDivElement>);
      if (href) router.push(href);
    }
  };

  return (
    <div
      role={interactive ? "link" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      className={`${
        interactive
          ? "cursor-pointer hover:border-dash-accent hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-dash-accent/40"
          : ""
      } transition ${className}`}
    >
      {children}
    </div>
  );
};

export { DrillDownCard };
export type { DrillDownCardProps };
