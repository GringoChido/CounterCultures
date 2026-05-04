// Counter Cultures · weekly status doc registry
import type { ComponentType } from "react";

import { Week18 } from "./_entries/2026-w18";

export type WeekEntry = {
  slug: string;
  year: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  title: string;
  subtitle: string;
  publishedAt: string;
  Component: ComponentType;
};

const ENTRIES: WeekEntry[] = [
  {
    slug: "2026-w18",
    year: 2026,
    weekNumber: 18,
    startDate: "2026-04-27",
    endDate: "2026-05-03",
    title: "Apr 27 – May 3 · Shipped",
    subtitle: "",
    publishedAt: "2026-05-03T20:00:00-06:00",
    Component: Week18,
  },
];

export const getEntries = (): WeekEntry[] =>
  [...ENTRIES].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

export const getLatestEntry = (): WeekEntry | undefined => getEntries()[0];

export const getEntryBySlug = (slug: string): WeekEntry | undefined =>
  ENTRIES.find((e) => e.slug === slug);

export const getNeighbours = (
  slug: string,
): { prev?: WeekEntry; next?: WeekEntry } => {
  const ordered = [...ENTRIES].sort((a, b) =>
    a.publishedAt < b.publishedAt ? -1 : 1,
  );
  const idx = ordered.findIndex((e) => e.slug === slug);
  if (idx === -1) return {};
  return {
    prev: ordered[idx - 1],
    next: ordered[idx + 1],
  };
};
