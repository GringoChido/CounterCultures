"use client";

/**
 * /dashboard/imports/[deal-id] — direct-link view of a single deal's
 * import status. Surfaces the same ImportsPanel that lives in the
 * deal detail's Customs tab. Useful for hand-offs to the broker /
 * customs agent who shouldn't need to navigate the full pipeline page.
 */

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImportsPanel } from "@/app/(dashboard)/components/customs/imports-panel";

const ImportsForDealPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id: dealId } = use(params);

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      <Link
        href="/dashboard/pipeline"
        className="inline-flex items-center gap-1 text-[12px] text-brand-copper hover:underline mb-4"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Pipeline
      </Link>
      <header className="mb-6">
        <h1 className="font-display text-2xl text-dash-text">
          Imports · <span className="font-mono text-brand-copper">{dealId}</span>
        </h1>
        <p className="text-sm text-dash-text-secondary mt-1">
          Where the goods actually are. Customs status, broker handoff,
          and import documents — all in one row.
        </p>
      </header>

      {/* For now we render with currentStage 0 — the deal-detail tab does
          the stage-derivation. This standalone route is a quick reference
          surface; full per-deal import data hookup ships next. */}
      <ImportsPanel
        data={{
          dealId,
          currentStage: 0,
        }}
      />
    </div>
  );
};

export default ImportsForDealPage;
