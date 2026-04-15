"use client";

import { useMemo } from "react";
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
