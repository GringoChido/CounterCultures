import type { ReactNode } from "react";

type SectionProps = {
  eyebrow: string;
  heading: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
  tone?: "linen" | "paper";
};

export const Section = ({
  eyebrow,
  heading,
  lead,
  children,
  tone = "linen",
}: SectionProps) => {
  const bg =
    tone === "paper"
      ? "bg-white"
      : "bg-[color:var(--color-background)]";
  return (
    <section className={`${bg} border-b border-[color:var(--color-dash-border)]`}>
      <div className="mx-auto max-w-[1320px] px-6 md:px-12 py-14 md:py-20">
        <div className="grid md:grid-cols-12 gap-10 md:gap-14 items-start">
          <div className="md:col-span-5">
            <p className="font-body font-medium text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-brand-copper)]">
              {eyebrow}
            </p>
            <h2 className="font-display font-light text-[32px] md:text-[44px] leading-[1.05] mt-5 text-[color:var(--color-foreground)]">
              {heading}
            </h2>
            {lead ? (
              <div className="mt-6 font-body text-[15px] leading-[1.65] text-[color:var(--color-dash-text-secondary)] max-w-md">
                {lead}
              </div>
            ) : null}
          </div>
          <div className="md:col-span-7">{children}</div>
        </div>
      </div>
    </section>
  );
};

type ItemRowProps = {
  tag: string;
  title: ReactNode;
  body: ReactNode;
};

export const ItemRow = ({ tag, title, body }: ItemRowProps) => (
  <div className="flex gap-4 py-4 border-t border-[color:var(--color-dash-border)] first:border-t-0">
    <span className="font-mono text-[10px] mt-1 shrink-0 text-[color:var(--color-brand-copper)] w-[70px]">
      {tag}
    </span>
    <div className="text-[13.5px] leading-[1.55]">
      <div className="text-[color:var(--color-foreground)] font-body">
        {title}
      </div>
      <div className="font-body text-[12.5px] mt-1 text-[color:var(--color-dash-text-secondary)]">
        {body}
      </div>
    </div>
  </div>
);

type FrameProps = {
  label: string;
  count?: string;
  tone?: "neutral" | "copper" | "sage";
  children: ReactNode;
};

export const Frame = ({
  label,
  count,
  tone = "neutral",
  children,
}: FrameProps) => {
  const borderColor =
    tone === "copper"
      ? "border-[color:var(--color-brand-copper)]/40"
      : tone === "sage"
        ? "border-[color:var(--color-dash-success)]/40"
        : "border-[color:var(--color-dash-border)]";
  const barBg =
    tone === "copper"
      ? "bg-[color:var(--color-dash-accent-soft)]"
      : tone === "sage"
        ? "bg-[color:var(--color-dash-success-soft)]"
        : "bg-[color:var(--color-dash-surface-2)]";
  const barColor =
    tone === "copper"
      ? "text-[color:var(--color-brand-copper)]"
      : tone === "sage"
        ? "text-[#5A6E2F]"
        : "text-[color:var(--color-dash-text-muted)]";
  return (
    <div className={`border ${borderColor} bg-white`}>
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${borderColor} ${barBg}`}
      >
        <span className={`font-mono text-[11px] ${barColor}`}>{label}</span>
        {count ? (
          <span
            className={`font-body font-medium text-[10px] tracking-[0.18em] uppercase ${barColor}`}
          >
            {count}
          </span>
        ) : null}
      </div>
      <div className="px-5 py-3">{children}</div>
    </div>
  );
};

type PullQuoteProps = { children: ReactNode };

export const PullQuote = ({ children }: PullQuoteProps) => (
  <div className="mt-6 flex items-start gap-4 max-w-md">
    <div className="w-8 h-px mt-3 bg-[color:var(--color-brand-copper)]" />
    <p className="font-display italic font-light text-[18px] leading-[1.4] text-[color:var(--color-foreground)]">
      {children}
    </p>
  </div>
);
