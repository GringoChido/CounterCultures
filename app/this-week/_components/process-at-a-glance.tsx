const STAGES = [
  { n: "01", name: "Lead", note: "Six doors in" },
  { n: "02", name: "Deal", note: "Becomes a deal" },
  { n: "03", name: "Quote", note: "Two languages" },
  { n: "04", name: "Send", note: "Email always" },
  { n: "05", name: "CFDI", note: "Asked early" },
  { n: "06", name: "Deposit", note: "Six payment rails" },
  { n: "07", name: "Vendor", note: "PO + billing" },
  { n: "08", name: "Imports", note: "Customs end-to-end" },
  { n: "09", name: "Delivery", note: "Three ways" },
  { n: "10", name: "Balance", note: "Final 30%" },
  { n: "11", name: "Closed", note: "Numbers roll up" },
] as const;

export const ProcessAtAGlance = () => {
  return (
    <section className="border-y border-[color:var(--color-dash-border)]">
      <div className="mx-auto max-w-[1320px] px-6 md:px-12 py-14">
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
          <p className="font-body font-medium text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-brand-copper)]">
            The process · at a glance
          </p>
          <span
            className="font-body text-[12px] text-[color:var(--color-dash-text-muted)]"
          >
            Full walkthrough — coming soon
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-11 gap-px bg-[color:var(--color-dash-border)]">
          {STAGES.map((s, i) => (
            <div
              key={s.n}
              className="group bg-[color:var(--color-background)] hover:bg-white p-4 transition-colors block"
            >
              <div className="font-mono text-[10px] tracking-[0.08em] text-[color:var(--color-dash-text-muted)] group-hover:text-[color:var(--color-brand-copper)] transition-colors">
                {s.n}
              </div>
              <div className="font-display text-[18px] leading-tight text-[color:var(--color-foreground)] mt-2">
                {s.name}
              </div>
              <div className="font-body text-[11px] mt-1 text-[color:var(--color-dash-text-secondary)] leading-snug">
                {s.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
