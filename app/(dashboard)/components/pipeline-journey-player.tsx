"use client";

import { useEffect, useMemo, useState } from "react";
import { Player } from "@remotion/player";
import {
  PipelineJourney,
  type PipelineJourneyProps,
} from "@/app/components/ui/pipeline-journey";

interface PipelineJourneyPlayerProps {
  dealLabel?: string;
  dealId?: string;
  clientName?: string;
  dealValue?: string;
  targetPhase?: number;
}

export const PipelineJourneyPlayer = ({
  dealLabel,
  dealId,
  clientName,
  dealValue,
  targetPhase,
}: PipelineJourneyPlayerProps) => {
  const props = useMemo<PipelineJourneyProps>(
    () => ({
      speed: 1,
      ...(dealLabel && { dealLabel }),
      ...(dealId && { dealId }),
      ...(clientName && { clientName }),
      ...(dealValue && { dealValue }),
      ...(targetPhase !== undefined && { targetPhase }),
    }),
    [dealLabel, dealId, clientName, dealValue, targetPhase],
  );

  // Remotion's <Player> measures the DOM and generates IDs during initial
  // render, producing SSR/CSR mismatch warnings ("2 Issues" in Next dev
  // overlay). Defer mount until after hydration to avoid the diff entirely.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="w-full"
        style={{
          aspectRatio: "2 / 1",
          borderRadius: 16,
          overflow: "hidden",
          background: "#1A1A1A",
        }}
        aria-hidden
      />
    );
  }

  return (
    <div className="w-full">
      <Player
        component={PipelineJourney as React.ComponentType<Record<string, unknown>>}
        inputProps={props}
        durationInFrames={260}
        fps={30}
        compositionWidth={1200}
        compositionHeight={600}
        autoPlay
        loop
        controls={false}
        clickToPlay={false}
        style={{
          width: "100%",
          height: "auto",
          aspectRatio: "2 / 1",
          borderRadius: 16,
          overflow: "hidden",
          background: "#1A1A1A",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(184,115,51,0.08)",
        }}
      />
    </div>
  );
};
