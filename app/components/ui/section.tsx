import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  bg?: "linen" | "sand" | "charcoal" | "white";
  id?: string;
  fullBleed?: boolean;
}

const bgStyles = {
  linen: "bg-brand-linen",
  sand: "bg-brand-sand/30",
  charcoal: "bg-brand-charcoal text-white",
  white: "bg-white",
};

const Section = ({
  children,
  className = "",
  bg = "linen",
  id,
  fullBleed = false,
}: SectionProps) => (
  <section
    id={id}
    className={`py-20 lg:py-28 ${bgStyles[bg]} ${className}`}
  >
    {fullBleed ? (
      children
    ) : (
      <div className="mx-auto max-w-7xl px-6 lg:px-8">{children}</div>
    )}
  </section>
);

export { Section };
