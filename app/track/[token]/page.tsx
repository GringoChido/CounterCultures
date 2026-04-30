import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Track your order — Counter Cultures",
  robots: { index: false, follow: false },
};

type TrackData = {
  orderId: string;
  projectName: string;
  brands: string[];
  currentMilestone: string;
  milestoneIndex: number;
  milestones: string[];
  expectedDelivery: string | null;
  createdAt: string | null;
};

const fetchStatus = async (token: string, origin: string): Promise<TrackData | null> => {
  try {
    const res = await fetch(`${origin}/api/track/${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as TrackData;
  } catch {
    return null;
  }
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const TrackPage = async ({
  params,
}: {
  params: Promise<{ token: string }>;
}) => {
  const { token } = await params;

  // Resolve origin from env so this works in prod + preview without hardcoding.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    "http://localhost:3000";

  const data = await fetchStatus(token, origin);
  if (!data) notFound();

  const progressPct = Math.round(
    (data.milestoneIndex / Math.max(1, data.milestones.length - 1)) * 100
  );

  return (
    <main id="main" tabIndex={-1} className="min-h-screen bg-brand-linen text-brand-charcoal px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 pb-6 border-b border-dash-border">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-copper mb-2">
            Counter Cultures
          </p>
          <h1 className="font-serif text-3xl leading-tight">Order tracking</h1>
          <p className="text-sm text-dash-text-secondary mt-2">
            {data.projectName}
            {data.orderId ? (
              <span className="ml-2 text-xs text-dash-text-muted">
                · {data.orderId}
              </span>
            ) : null}
          </p>
        </header>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-[0.14em] text-dash-text-muted">
              Current stage
            </span>
            <span className="text-xs text-dash-text-secondary">
              {data.milestoneIndex + 1} of {data.milestones.length}
            </span>
          </div>
          <p className="font-serif text-2xl mb-4">{data.currentMilestone}</p>

          <div className="h-1.5 bg-dash-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-copper transition-all"
              style={{ width: `${progressPct}%` }}
              aria-hidden="true"
            />
          </div>

          <ol className="mt-6 space-y-3">
            {data.milestones.map((m, i) => {
              const done = i <= data.milestoneIndex;
              const current = i === data.milestoneIndex;
              return (
                <li
                  key={m}
                  className={`flex items-start gap-3 text-sm ${
                    done ? "text-brand-charcoal" : "text-dash-text-muted"
                  }`}
                >
                  <span
                    className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                      current
                        ? "bg-brand-copper ring-4 ring-brand-copper/20"
                        : done
                          ? "bg-brand-copper"
                          : "bg-brand-sand"
                    }`}
                    aria-hidden="true"
                  />
                  <span className={current ? "font-medium" : ""}>{m}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-dash-surface rounded-lg border border-dash-border p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-dash-text-muted mb-1">
              Expected delivery
            </p>
            <p className="text-sm font-medium">
              {formatDate(data.expectedDelivery)}
            </p>
          </div>
          <div className="bg-dash-surface rounded-lg border border-dash-border p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-dash-text-muted mb-1">
              Order placed
            </p>
            <p className="text-sm font-medium">{formatDate(data.createdAt)}</p>
          </div>
        </section>

        {data.brands.length > 0 ? (
          <section className="mb-10">
            <p className="text-[11px] uppercase tracking-[0.14em] text-dash-text-muted mb-2">
              Brands in this order
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.brands.map((b) => (
                <span
                  key={b}
                  className="px-2 py-0.5 text-xs bg-dash-surface border border-dash-border rounded-full"
                >
                  {b}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="pt-6 border-t border-dash-border text-sm text-dash-text-secondary space-y-2">
          <p>
            Questions about your order? Reach us on{" "}
            <a
              href="https://wa.me/524151234567"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-copper underline underline-offset-2"
            >
              WhatsApp
            </a>{" "}
            or{" "}
            <a
              href="mailto:hello@countercultures.com.mx"
              className="text-brand-copper underline underline-offset-2"
            >
              email
            </a>
            .
          </p>
          <p className="text-xs text-dash-text-muted">
            Page last refreshed {formatDate(new Date().toISOString())}.
          </p>
        </section>
      </div>
    </main>
  );
};

export default TrackPage;
