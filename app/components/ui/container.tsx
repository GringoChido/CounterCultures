import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "main";
}

const Container = ({
  children,
  className = "",
  as: Component = "div",
}: ContainerProps) => (
  <Component className={`mx-auto max-w-7xl px-6 lg:px-8 ${className}`}>
    {children}
  </Component>
);

export { Container };
