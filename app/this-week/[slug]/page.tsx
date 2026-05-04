import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ProcessAtAGlance } from "../_components/process-at-a-glance";
import { WeeklyShell } from "../_components/shell";
import { getEntries, getEntryBySlug, getNeighbours } from "../_entries";

type Params = { slug: string };

export const generateStaticParams = (): Params[] =>
  getEntries().map((e) => ({ slug: e.slug }));

export const generateMetadata = async ({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);
  if (!entry) return { title: "This week · Counter Cultures" };
  return {
    title: `Week ${entry.weekNumber} · ${entry.title}`,
    description: entry.subtitle,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  };
};

const WeekEntryPage = async ({ params }: { params: Promise<Params> }) => {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);
  if (!entry) notFound();

  const { prev, next } = getNeighbours(slug);
  const Body = entry.Component;

  return (
    <WeeklyShell entry={entry} prev={prev} next={next}>
      <ProcessAtAGlance />
      <Body />
    </WeeklyShell>
  );
};

export default WeekEntryPage;
