import { redirect } from "next/navigation";

import { getLatestEntry } from "./_entries";

const ThisWeekIndex = () => {
  const latest = getLatestEntry();
  if (!latest) {
    return (
      <main className="min-h-screen bg-[color:var(--color-background)] flex items-center justify-center px-6">
        <p className="font-display italic text-[24px] text-[color:var(--color-dash-text-muted)]">
          No entries yet.
        </p>
      </main>
    );
  }
  redirect(`/this-week/${latest.slug}`);
};

export default ThisWeekIndex;
