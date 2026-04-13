import type { ReactNode } from "react";

interface TypographyProps {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

const Heading = ({
  children,
  className = "",
  as: Component = "h2",
}: TypographyProps) => {
  const sizeMap = {
    h1: "text-4xl sm:text-5xl md:text-7xl lg:text-8xl",
    h2: "text-4xl md:text-5xl lg:text-6xl",
    h3: "text-3xl md:text-4xl",
    h4: "text-2xl md:text-3xl",
    p: "text-xl",
    span: "text-xl",
  };

  return (
    <Component
      className={`font-display font-light tracking-wide leading-tight ${sizeMap[Component]} ${className}`}
    >
      {children}
    </Component>
  );
};

const Subheading = ({
  children,
  className = "",
  as: Component = "h3",
}: TypographyProps) => (
  <Component
    className={`font-body font-medium text-xl md:text-2xl ${className}`}
  >
    {children}
  </Component>
);

const Body = ({
  children,
  className = "",
  as: Component = "p",
}: TypographyProps) => (
  <Component className={`font-body text-base leading-relaxed ${className}`}>
    {children}
  </Component>
);

const Spec = ({
  children,
  className = "",
  as: Component = "span",
}: TypographyProps) => (
  <Component className={`font-mono text-sm ${className}`}>{children}</Component>
);

export { Heading, Subheading, Body, Spec };
