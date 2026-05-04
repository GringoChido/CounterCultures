import type { ReactNode } from "react";
import Link from "next/link";

import type { WeekEntry } from "../_entries";

const formatDateRange = (start: string, end: string) => {
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return `${fmt.format(startDate)} – ${fmt.format(endDate)}`;
};

const formatPublished = (iso: string) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
};

type Props = {
  entry: WeekEntry;
  prev?: WeekEntry;
  next?: WeekEntry;
  children: ReactNode;
};

const WAITING_FOR_AT = "+524151534327"; // CC showroom WA — placeholder, ok to swap

const buildShareUrl = (entry: WeekEntry) => {
  const url = `https://countercultures.mx/this-week/${entry.slug}`;
  const message = `${entry.title}\n${entry.subtitle}\n\n${url}`;
  return `https://wa.me/${WAITING_FOR_AT.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
};

export const WeeklyShell = ({ entry, prev, next, children }: Props) => {
  return (
    <main className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-dash-text-secondary)]">
      {/* Header */}
      <header className="border-b border-[color:var(--color-dash-border)]">
        <div className="mx-auto max-w-[1320px] px-6 md:px-12 py-10 md:py-14">
          <div className="flex items-baseline gap-4 mb-6">
            <Link
              href="/this-week"
              className="font-mono text-[11px] tracking-[0.18em] uppercase text-[color:var(--color-brand-copper)] hover:opacity-70 transition-opacity"
            >
              This week
            </Link>
            <span className="font-mono text-[11px] text-[color:var(--color-dash-text-muted)]">·</span>
            <span className="font-mono text-[11px] text-[color:var(--color-dash-text-muted)]">
              Week {entry.weekNumber} · {entry.year}
            </span>
          </div>

          <h1 className="font-display font-light text-[36px] md:text-[64px] leading-[1.04] tracking-[-0.01em] text-[color:var(--color-foreground)] max-w-3xl">
            {entry.title}
          </h1>
          {entry.subtitle ? (
            <p className="font-display italic font-light text-[20px] md:text-[28px] mt-3 text-[color:var(--color-brand-copper)] max-w-3xl">
              {entry.subtitle}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px]">
            <span className="font-body text-[color:var(--color-dash-text-muted)]">
              For Roger, Antonina, Amber
            </span>
            <span className="font-body text-[color:var(--color-dash-text-muted)]">·</span>
            <span className="font-body text-[color:var(--color-dash-text-muted)]">
              Published {formatPublished(entry.publishedAt)}
            </span>
            <span className="font-body text-[color:var(--color-dash-text-muted)]">·</span>
            <a
              href={buildShareUrl(entry)}
              target="_blank"
              rel="noreferrer"
              className="font-body text-[color:var(--color-vendor-whatsapp)] hover:underline"
            >
              Share to WhatsApp →
            </a>
          </div>
        </div>
      </header>

      {/* Body */}
      <div>{children}</div>

      {/* Footer */}
      <footer className="border-t border-[color:var(--color-dash-border)] mt-8">
        <div className="mx-auto max-w-[1320px] px-6 md:px-12 py-10 grid md:grid-cols-3 gap-6 items-center">
          <div className="font-body text-[12px] text-[color:var(--color-dash-text-muted)]">
            Counter Cultures · weekly update
          </div>

          <div className="flex items-center justify-center gap-6 text-[12px]">
            {prev ? (
              <Link
                href={`/this-week/${prev.slug}`}
                className="font-body text-[color:var(--color-dash-text-secondary)] hover:text-[color:var(--color-brand-copper)] transition-colors"
              >
                ← Week {prev.weekNumber}
              </Link>
            ) : (
              <span className="font-body text-[color:var(--color-dash-text-muted)] opacity-40">
                ← previous
              </span>
            )}
            {next ? (
              <Link
                href={`/this-week/${next.slug}`}
                className="font-body text-[color:var(--color-dash-text-secondary)] hover:text-[color:var(--color-brand-copper)] transition-colors"
              >
                Week {next.weekNumber} →
              </Link>
            ) : (
              <span className="font-body text-[color:var(--color-dash-text-muted)] opacity-40">
                next week pending
              </span>
            )}
          </div>

          <div className="font-body text-[12px] text-[color:var(--color-dash-text-muted)] md:text-right">
            Powered by Untold.works
          </div>
        </div>
      </footer>
    </main>
  );
};
